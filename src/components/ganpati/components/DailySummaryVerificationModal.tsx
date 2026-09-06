import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Share2, 
  Printer, 
  FileSpreadsheet, 
  X, 
  Building2, 
  Smartphone, 
  Banknote, 
  CreditCard, 
  Landmark, 
  Users, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownRight, 
  Scale, 
  ShieldCheck, 
  Clock, 
  Check, 
  Copy,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  DigitalPavati, 
  ExpenseEntry, 
  VolunteerCollector, 
  DayWiseCollection, 
  MandalProfile, 
  MandalLanguage, 
  NightlyVerificationRecord, 
  DenominationBreakdown,
  DailySummaryReport
} from '../types';
import { 
  buildDailySummaryReport, 
  calculateDenominationTotal, 
  generateNightlyWhatsAppDigest 
} from '../utils/dailySummaryEngine';
import { numberToMarathiWords } from '../utils/receiptGenerator';

interface DailySummaryVerificationModalProps {
  initialDate?: string;
  pavatis: DigitalPavati[];
  expenses: ExpenseEntry[];
  volunteers: VolunteerCollector[];
  dayWiseCollections: DayWiseCollection[];
  verifications: NightlyVerificationRecord[];
  mandal: MandalProfile;
  lang: MandalLanguage;
  userRole: string;
  onSaveVerification: (verification: NightlyVerificationRecord) => void;
  onClose: () => void;
  onViewReceipt?: (pavati: DigitalPavati) => void;
}

export const DailySummaryVerificationModal: React.FC<DailySummaryVerificationModalProps> = ({
  initialDate,
  pavatis,
  expenses,
  volunteers,
  dayWiseCollections,
  verifications,
  mandal,
  lang,
  userRole,
  onSaveVerification,
  onClose,
  onViewReceipt
}) => {
  // Determine default selected date (fallback to today or first day in dayWiseCollections)
  const defaultDate = initialDate || dayWiseCollections[0]?.date || '2026-08-15';
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [activeTab, setActiveTab] = useState<'summary' | 'verification' | 'collectors' | 'receipts'>('summary');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Auto-generate report for selected date
  const report: DailySummaryReport = useMemo(() => {
    return buildDailySummaryReport(
      selectedDate,
      pavatis,
      expenses,
      volunteers,
      dayWiseCollections,
      verifications
    );
  }, [selectedDate, pavatis, expenses, volunteers, dayWiseCollections, verifications]);

  // Denominations state for verification form
  const existingVer = report.verification;
  const [denominations, setDenominations] = useState<DenominationBreakdown>(
    existingVer?.denominations || {
      note2000: 0,
      note500: Math.floor((report.incomeByMode.cash) / 500) || 0,
      note200: 0,
      note100: 0,
      note50: 0,
      note20: 0,
      note10: 0,
      coins: 0
    }
  );

  const [treasurerNotes, setTreasurerNotes] = useState<string>(
    existingVer?.treasurerNotes || 'दिवसाचे सर्व रोख संकलन व पावती नोंदवही तपासली. हिशोब अचूक जुळला आहे.'
  );

  const [vaultLocation, setVaultLocation] = useState<NightlyVerificationRecord['depositVaultLocation']>(
    existingVer?.depositVaultLocation || 'Mandal Safe Locker (मंडळ तिजोरी)'
  );

  const [treasurerName, setTreasurerName] = useState<string>(
    existingVer?.verifiedByTreasurer || mandal.treasurerName || 'महेश चंद्रकांत गायकवाड (खजिनदार)'
  );

  const [isCounterSigned, setIsCounterSigned] = useState<boolean>(
    !!existingVer?.counterSignedByPresident
  );

  // Calculated counted cash & variance
  const physicalCashCounted = useMemo(() => {
    return calculateDenominationTotal(denominations);
  }, [denominations]);

  const systemCashExpected = report.incomeByMode.cash;
  const cashVariance = physicalCashCounted - systemCashExpected;

  // Handler for denomination changes
  const handleDenominationChange = (field: keyof DenominationBreakdown, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setDenominations(prev => ({
      ...prev,
      [field]: num
    }));
  };

  // Submit Nightly Verification
  const handleSaveNightlyAudit = (status: 'Verified' | 'Locked') => {
    const record: NightlyVerificationRecord = {
      id: existingVer?.id || `ver-${selectedDate}`,
      date: selectedDate,
      dayNumber: report.dayNumber,
      status,
      verifiedByTreasurer: treasurerName,
      verifiedAt: new Date().toISOString(),
      counterSignedByPresident: isCounterSigned ? (mandal.presidentName || 'राजेंद्र बापूराव तांबडे (अध्यक्ष)') : undefined,
      counterSignedAt: isCounterSigned ? new Date().toISOString() : undefined,
      systemCashExpected,
      physicalCashCounted,
      cashVariance,
      denominations,
      treasurerNotes,
      depositVaultLocation: vaultLocation
    };

    onSaveVerification(record);
    alert(status === 'Locked' 
      ? '✅ हिशोब यशस्वीरित्या लॉक करण्यात आला!' 
      : '✅ खजिनदार रात्री हिशोब पडताळणी यशस्वीरित्या सेव्ह झाली!'
    );
  };

  // Share WhatsApp Digest
  const handleShareWhatsApp = () => {
    const text = generateNightlyWhatsAppDigest(report, mandal);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Copy WhatsApp Text to Clipboard
  const handleCopyWhatsApp = () => {
    const text = generateNightlyWhatsAppDigest(report, mandal);
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Export Daily Excel
  const handleExportDailyExcel = () => {
    const dayPavatis = pavatis.filter(p => p.date === selectedDate);
    const dayExpenses = expenses.filter(e => e.date === selectedDate);

    const incomeSheetData = dayPavatis.map(p => ({
      'पावती क्र.': p.receiptNumber,
      'वेळ': p.time || '---',
      'देणगीदाराचे नाव': p.donorName,
      'मोबाईल': p.phone,
      'वर्गवारी': p.category,
      'रक्कम (₹)': p.amount,
      'पेमेंट पद्धत': p.paymentMode.toUpperCase(),
      'पावती देणारा': p.receivedBy,
      'बुक क्र.': p.bookPrefix || 'HQ',
      'स्थिती': p.isCancelled ? 'रद्द (Cancelled)' : 'सक्रिय (Active)'
    }));

    const expenseSheetData = dayExpenses.map(e => ({
      'व्हाऊचर क्र.': e.voucherNumber,
      'शीर्षक': e.title,
      'व्यापारी/विक्रेता': e.vendorName,
      'वर्गवारी': e.category,
      'रक्कम (₹)': e.amount,
      'पेमेंट पद्धत': e.paymentMode.toUpperCase(),
      'मंजूर अधिकारी': e.approvedBy
    }));

    const summarySheetData = [
      { 'तपशील': 'दैनिक एकूण जमा (Gross Income)', 'रक्कम (₹)': report.totalIncome },
      { 'तपशील': 'दैनिक एकूण खर्च (Gross Expenses)', 'रक्कम (₹)': report.totalExpenses },
      { 'तपशील': 'दैनिक निव्वळ शिल्लक (Net Balance)', 'रक्कम (₹)': report.netDailySurplus },
      { 'तपशील': 'रोख संकलन (Cash)', 'रक्कम (₹)': report.incomeByMode.cash },
      { 'तपशील': 'UPI / QR संकलन', 'रक्कम (₹)': report.incomeByMode.upi },
      { 'तपशील': 'बँक ट्रान्सफर संकलन', 'रक्कम (₹)': report.incomeByMode.bank },
      { 'तपशील': 'धनादेश संकलन', 'रक्कम (₹)': report.incomeByMode.cheque },
      { 'तपशील': 'एकूण पावती संख्या', 'रक्कम (₹)': report.receiptsCount },
      { 'तपशील': 'खजिनदार पडताळणी स्थिती', 'रक्कम (₹)': report.verification?.status || 'Pending' }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summarySheetData), 'दैनिक सारांश');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeSheetData), 'जमा पावत्या');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseSheetData), 'खर्च व्हाऊचर');
    XLSX.writeFile(wb, `Ganpati_Mandal_Daily_Report_${selectedDate}.xlsx`);
  };

  // Print Handler
  const handlePrintSlip = () => {
    window.print();
  };

  const isVerified = report.verification?.status === 'Verified' || report.verification?.status === 'Locked';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-surface rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden text-main-text"
      >
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
              <Calendar size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black">दैनिक संकलन अहवाल व खजिनदार रात्री पडताळणी</h2>
                <span className="px-2.5 py-0.5 bg-white/20 text-white rounded-full text-[10px] font-black uppercase">
                  Nightly Audit ERP
                </span>
              </div>
              <p className="text-xs text-orange-100 mt-0.5">
                {mandal.nameMr} • वर्ष २०२६ • दररोज रात्री खजिनदार स्वाक्षरी व कॅश बॉक्स जुळवणी
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all"
          >
            <X size={22} />
          </button>
        </div>

        {/* 10 Festival Days Quick Selector Bar */}
        <div className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 p-3 sm:px-6 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-xs font-bold text-gray-500 mr-1 flex items-center gap-1">
              <Clock size={13} /> दिवस निवडा:
            </span>
            {dayWiseCollections.map((day) => {
              const isSelected = selectedDate === day.date;
              const hasVer = verifications.some(v => v.date === day.date && (v.status === 'Verified' || v.status === 'Locked'));
              
              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/20 scale-105'
                      : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:border-orange-300'
                  }`}
                >
                  <span>दिवस {day.dayNumber}</span>
                  <span className="text-[10px] opacity-80">({day.date.slice(5)})</span>
                  {hasVer ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="तपासणी पूर्ण" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400" title="तपासणी प्रलंबित" />
                  )}
                </button>
              );
            })}

            {/* Custom Date Input */}
            <div className="ml-2 pl-2 border-l border-gray-300 dark:border-zinc-700 flex items-center gap-1">
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-zinc-800 px-4 sm:px-6 bg-white dark:bg-zinc-900 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'summary'
                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-main-text'
            }`}
          >
            <Scale size={15} />
            दैनिक संकलन व हिशोब सारांश
          </button>

          <button
            onClick={() => setActiveTab('verification')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'verification'
                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-main-text'
            }`}
          >
            <ShieldCheck size={15} />
            खजिनदार रात्री रोख पडताळणी (Nightly Cash Verification)
            {isVerified && (
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded-md text-[9px] font-black">
                VERIFIED
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('collectors')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'collectors'
                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-main-text'
            }`}
          >
            <Users size={15} />
            कार्यकर्ते संकलन ({report.collectorBreakdown.length})
          </button>

          <button
            onClick={() => setActiveTab('receipts')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'receipts'
                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-main-text'
            }`}
          >
            <Receipt size={15} />
            पावती यादी ({report.receiptsCount})
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* Top Date Header Banner with Status */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-zinc-900 dark:to-zinc-850 p-4 sm:p-5 rounded-2xl border border-amber-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-orange-600 text-white rounded-full text-xs font-black">
                  दिवस {report.dayNumber}
                </span>
                <h3 className="text-base font-black text-main-text">
                  {report.festivalDayNameMr}
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                दिनांक: <strong className="font-mono text-main-text">{report.date}</strong> • पावती क्र. श्रेणी: <span className="font-mono text-primary font-bold">{report.firstReceiptNumber} ते {report.lastReceiptNumber}</span>
              </p>
            </div>

            {/* Status Pill */}
            <div className="flex items-center gap-2">
              {isVerified ? (
                <div className="px-3.5 py-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-300 dark:border-emerald-800 text-xs font-black flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>रात्री हिशोब प्रमाणित (Verified by Treasurer)</span>
                </div>
              ) : (
                <div className="px-3.5 py-1.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-300 dark:border-amber-800 text-xs font-black flex items-center gap-1.5">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <span>रात्री पडताळणी प्रलंबित (Pending Review)</span>
                </div>
              )}
            </div>
          </div>

          {/* TAB 1: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              
              {/* 4 Core KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Total Day Income */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[11px] font-black uppercase text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <ArrowUpRight size={14} /> दैनिक एकूण जमा (Income)
                  </span>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                    ₹{report.totalIncome.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-gray-500 block mt-1">
                    {report.receiptsCount} पावत्या नोंदी
                  </span>
                </div>

                {/* Total Day Expenses */}
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                  <span className="text-[11px] font-black uppercase text-rose-800 dark:text-rose-300 flex items-center gap-1">
                    <ArrowDownRight size={14} /> दैनिक खर्च (Expenses)
                  </span>
                  <p className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono mt-1">
                    ₹{report.totalExpenses.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-gray-500 block mt-1">
                    {report.expensesCount} खर्च व्हाऊचर
                  </span>
                </div>

                {/* Net Daily Surplus */}
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <span className="text-[11px] font-black uppercase text-blue-800 dark:text-blue-300 flex items-center gap-1">
                    <Scale size={14} /> दैनिक निव्वळ शिल्लक (Surplus)
                  </span>
                  <p className={`text-2xl font-black font-mono mt-1 ${report.netDailySurplus >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-rose-600'}`}>
                    ₹{report.netDailySurplus.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-gray-500 block mt-1">
                    जमा वजा खर्च
                  </span>
                </div>

                {/* Cash vs Online Split */}
                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                  <span className="text-[11px] font-black uppercase text-purple-800 dark:text-purple-300 flex items-center gap-1">
                    <Banknote size={14} /> रोख वि. डिजिटल
                  </span>
                  <div className="flex items-baseline justify-between font-mono mt-1">
                    <div>
                      <span className="text-xs text-gray-500 block">रोख (Cash):</span>
                      <strong className="text-sm font-black text-purple-900 dark:text-purple-300">₹{report.incomeByMode.cash.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 block">UPI/बँक:</span>
                      <strong className="text-sm font-black text-purple-900 dark:text-purple-300">₹{(report.incomeByMode.upi + report.incomeByMode.bank).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Mode Breakdown Row */}
              <div className="bg-surface rounded-2xl p-5 border border-gray-200 dark:border-zinc-800 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <CreditCard size={14} /> भरणा पद्धतीनुसार दैनिक वर्गवारी (Payment Mode Breakdown)
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  
                  <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mb-1">
                      <Banknote size={14} /> रोख (Cash)
                    </div>
                    <p className="text-lg font-black font-mono text-main-text">
                      ₹{report.incomeByMode.cash.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-gray-500">
                      खर्च: ₹{report.expensesByMode.cash.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700">
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold mb-1">
                      <Smartphone size={14} /> UPI / QR
                    </div>
                    <p className="text-lg font-black font-mono text-main-text">
                      ₹{report.incomeByMode.upi.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-gray-500">
                      खर्च: ₹{report.expensesByMode.upi.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700">
                    <div className="flex items-center gap-1.5 text-xs text-purple-600 font-bold mb-1">
                      <Landmark size={14} /> बँक ट्रान्सफर
                    </div>
                    <p className="text-lg font-black font-mono text-main-text">
                      ₹{report.incomeByMode.bank.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-gray-500">
                      खर्च: ₹{report.expensesByMode.bank.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700">
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold mb-1">
                      <CreditCard size={14} /> धनादेश (Cheque)
                    </div>
                    <p className="text-lg font-black font-mono text-main-text">
                      ₹{report.incomeByMode.cheque.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-gray-500">
                      खर्च: ₹{report.expensesByMode.cheque.toLocaleString('en-IN')}
                    </span>
                  </div>

                </div>
              </div>

              {/* Category Breakdown Table */}
              <div className="bg-surface rounded-2xl p-5 border border-gray-200 dark:border-zinc-800 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Receipt size={14} /> देणगी व वर्गवारी विश्लेषण (Category-wise Collection)
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 rounded-l-xl">वर्गवारी (Category)</th>
                        <th className="p-2.5 text-center">पावत्या</th>
                        <th className="p-2.5 text-right">रक्कम (₹)</th>
                        <th className="p-2.5 rounded-r-xl text-right">वाटा (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                      {report.categoryBreakdown.map((cat, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-zinc-800/40">
                          <td className="p-2.5 font-bold text-main-text">{cat.category}</td>
                          <td className="p-2.5 text-center font-mono">{cat.count}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-primary">₹{cat.amount.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 text-right">
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded-full font-mono text-[10px]">
                              {cat.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: NIGHTLY VERIFICATION (TREASURER CASH BOX & VAULT SIGN-OFF) */}
          {activeTab === 'verification' && (
            <div className="space-y-6">
              
              {/* Verification Header Notice */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs flex items-start gap-3">
                <ShieldCheck size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-amber-950 dark:text-amber-200">
                    खजिनदार रात्री पडताळणी प्रोटोकॉल (Nightly Cash Verification Protocol)
                  </h4>
                  <p className="text-amber-800 dark:text-amber-300 mt-0.5">
                    प्रत्येक दिवशी रात्री आरती व देणगी काउंटर बंद झाल्यानंतर खजिनदारांनी प्रत्यक्ष कॅश बॉक्स मधील नोटा मोजून सिस्टिममधील रोख संकलनाशी जुळवावी आणि डिजिटल स्वाक्षरी करावी.
                  </p>
                </div>
              </div>

              {/* Cash Reconciliation Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Expected Cash */}
                <div className="p-4 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-gray-200 dark:border-zinc-700">
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">
                    १. सिस्टिम अपेक्षित रोख (System Expected Cash)
                  </span>
                  <p className="text-2xl font-black font-mono text-main-text mt-1">
                    ₹{systemCashExpected.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    आजच्या सर्व रोख पावत्यांची बेरीज
                  </span>
                </div>

                {/* 2. Physical Counted Cash */}
                <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800">
                  <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase block">
                    २. प्रत्यक्ष मोजलेली रोख (Physical Counted)
                  </span>
                  <p className="text-2xl font-black font-mono text-purple-800 dark:text-purple-300 mt-1">
                    ₹{physicalCashCounted.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 mt-1 block">
                    नोटा मोजणी काउंटरनुसार एकूण
                  </span>
                </div>

                {/* 3. Variance / Discrepancy */}
                <div className={`p-4 rounded-2xl border ${
                  cashVariance === 0 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : cashVariance > 0
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}>
                  <span className="text-[11px] font-bold uppercase block">
                    ३. कॅश तफावत (Reconciliation Variance)
                  </span>
                  <p className="text-2xl font-black font-mono mt-1">
                    {cashVariance === 0 ? '₹० (शून्य तफावत)' : `₹${cashVariance > 0 ? '+' : ''}${cashVariance.toLocaleString('en-IN')}`}
                  </p>
                  <span className="text-[10px] mt-1 block font-bold">
                    {cashVariance === 0 ? '✅ हिशोब तंतोतंत जुळला (Exact Match)' : cashVariance > 0 ? '⚠️ शिल्लक जादा (Surplus Cash)' : '❌ शिल्लक कमी (Cash Shortage)'}
                  </span>
                </div>

              </div>

              {/* Currency Denominations Interactive Counter */}
              <div className="bg-surface rounded-2xl p-5 border border-gray-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Banknote size={15} /> चलनी नोटा व नाणी मोजणी काउंटर (Currency Denomination Breakdown)
                  </h4>
                  <span className="text-xs font-mono font-bold text-primary">
                    एकूण: ₹{physicalCashCounted.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  
                  {/* ₹500 Notes */}
                  <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-emerald-600">₹५०० नोटा:</span>
                      <span className="font-mono text-gray-500">₹{(denominations.note500 * 500).toLocaleString('en-IN')}</span>
                    </div>
                    <input 
                      type="number"
                      min="0"
                      value={denominations.note500 || ''}
                      onChange={(e) => handleDenominationChange('note500', e.target.value)}
                      placeholder="नग संख्या..."
                      className="w-full px-2.5 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg font-mono font-bold"
                    />
                  </div>

                  {/* ₹200 Notes */}
                  <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-amber-600">₹२०० नोटा:</span>
                      <span className="font-mono text-gray-500">₹{(denominations.note200 * 200).toLocaleString('en-IN')}</span>
                    </div>
                    <input 
                      type="number"
                      min="0"
                      value={denominations.note200 || ''}
                      onChange={(e) => handleDenominationChange('note200', e.target.value)}
                      placeholder="नग संख्या..."
                      className="w-full px-2.5 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg font-mono font-bold"
                    />
                  </div>

                  {/* ₹100 Notes */}
                  <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-blue-600">₹१०० नोटा:</span>
                      <span className="font-mono text-gray-500">₹{(denominations.note100 * 100).toLocaleString('en-IN')}</span>
                    </div>
                    <input 
                      type="number"
                      min="0"
                      value={denominations.note100 || ''}
                      onChange={(e) => handleDenominationChange('note100', e.target.value)}
                      placeholder="नग संख्या..."
                      className="w-full px-2.5 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg font-mono font-bold"
                    />
                  </div>

                  {/* ₹50 Notes */}
                  <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-cyan-600">₹५० नोटा:</span>
                      <span className="font-mono text-gray-500">₹{(denominations.note50 * 50).toLocaleString('en-IN')}</span>
                    </div>
                    <input 
                      type="number"
                      min="0"
                      value={denominations.note50 || ''}
                      onChange={(e) => handleDenominationChange('note50', e.target.value)}
                      placeholder="नग संख्या..."
                      className="w-full px-2.5 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg font-mono font-bold"
                    />
                  </div>

                  {/* ₹20 Notes */}
                  <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-orange-600">₹२० नोटा:</span>
                      <span className="font-mono text-gray-500">₹{(denominations.note20 * 20).toLocaleString('en-IN')}</span>
                    </div>
                    <input 
                      type="number"
                      min="0"
                      value={denominations.note20 || ''}
                      onChange={(e) => handleDenominationChange('note20', e.target.value)}
                      placeholder="नग संख्या..."
                      className="w-full px-2.5 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg font-mono font-bold"
                    />
                  </div>

                  {/* ₹10 Notes */}
                  <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-brown-600">₹१० नोटा:</span>
                      <span className="font-mono text-gray-500">₹{(denominations.note10 * 10).toLocaleString('en-IN')}</span>
                    </div>
                    <input 
                      type="number"
                      min="0"
                      value={denominations.note10 || ''}
                      onChange={(e) => handleDenominationChange('note10', e.target.value)}
                      placeholder="नग संख्या..."
                      className="w-full px-2.5 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg font-mono font-bold"
                    />
                  </div>

                  {/* Coins & Other */}
                  <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700 space-y-1 col-span-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-700 dark:text-gray-300">नाणी / सुट्टे (Coins Total):</span>
                      <span className="font-mono text-gray-500">₹{(denominations.coins || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <input 
                      type="number"
                      min="0"
                      value={denominations.coins || ''}
                      onChange={(e) => handleDenominationChange('coins', e.target.value)}
                      placeholder="नाणी एकूण रक्कम ₹..."
                      className="w-full px-2.5 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg font-mono font-bold"
                    />
                  </div>

                </div>
              </div>

              {/* Vault Custody & Sign-off Details Form */}
              <div className="bg-surface rounded-2xl p-5 border border-gray-200 dark:border-zinc-800 space-y-4 text-xs">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Lock size={15} /> रात्री तिजोरी ठेव व स्वाक्षरी (Vault Custody & Digital Sign-off)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Vault Destination */}
                  <div>
                    <label className="block font-bold text-gray-600 dark:text-gray-400 mb-1">
                      रोख ठेव स्थान (Cash Vault Destination):
                    </label>
                    <select
                      value={vaultLocation}
                      onChange={(e) => setVaultLocation(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl font-bold"
                    >
                      <option value="Mandal Safe Locker (मंडळ तिजोरी)">Mandal Safe Locker (मंडळ तिजोरी)</option>
                      <option value="Bank Account Deposited (बँक जमा)">Bank Account Deposited (बँक जमा)</option>
                      <option value="Treasurer Custody (खजिनदार कक्ष)">Treasurer Custody (खजिनदार कक्ष)</option>
                      <option value="Bank Night Drop (बँक ड्रॉप)">Bank Night Drop (बँक ड्रॉप)</option>
                    </select>
                  </div>

                  {/* Treasurer Signatory Name */}
                  <div>
                    <label className="block font-bold text-gray-600 dark:text-gray-400 mb-1">
                      तपासणी अधिकारी / खजिनदार नाव:
                    </label>
                    <input 
                      type="text"
                      value={treasurerName}
                      onChange={(e) => setTreasurerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl font-bold"
                    />
                  </div>

                  {/* Counter-signed by President checkbox */}
                  <div className="sm:col-span-2 flex items-center gap-2 p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700">
                    <input 
                      type="checkbox"
                      id="presidentCounterSign"
                      checked={isCounterSigned}
                      onChange={(e) => setIsCounterSigned(e.target.checked)}
                      className="w-4 h-4 text-orange-600 rounded border-gray-300"
                    />
                    <label htmlFor="presidentCounterSign" className="font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                      मंडळ अध्यक्ष / सचिवांची संमती व प्रतिस्वाक्षरी (Counter-signed by {mandal.presidentName || 'अध्यक्ष'})
                    </label>
                  </div>

                  {/* Notes */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-600 dark:text-gray-400 mb-1">
                      खजिनदार विशेष शेरा / हिशोब नोंद (Audit Notes):
                    </label>
                    <textarea 
                      rows={2}
                      value={treasurerNotes}
                      onChange={(e) => setTreasurerNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs"
                      placeholder="उदा. दिवस १ चे सर्व संकलन तंतोतंत जुळले असून कॅश सुरक्षित ठेवली आहे..."
                    />
                  </div>

                </div>

                {/* Save & Verify CTA Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <button
                    onClick={() => handleSaveNightlyAudit('Verified')}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:brightness-110 shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={16} />
                    रात्री हिशोब प्रमाणित करा (Verify & Sign Off)
                  </button>

                  <button
                    onClick={() => handleSaveNightlyAudit('Locked')}
                    className="px-4 py-2.5 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 flex items-center gap-1.5"
                  >
                    <Lock size={15} />
                    हिशोब लॉक करा (Lock Night Ledger)
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: COLLECTORS BREAKDOWN */}
          {activeTab === 'collectors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                  कार्यकर्ते व व्हॉलंटियर थेट संकलन तपशील (Active Volunteers on {report.date})
                </h4>
                <span className="text-xs font-bold text-gray-500">
                  एकूण {report.collectorBreakdown.length} कार्यकर्ते सक्रिय
                </span>
              </div>

              {report.collectorBreakdown.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-700">
                  <Users size={32} className="mx-auto text-gray-400 mb-2 opacity-50" />
                  <p className="text-xs font-bold text-gray-500">या दिवशी स्वतंत्र कार्यकर्त्यांनी पावती फाडलेली नोंद आढळली नाही. मुख्य काउंटरवरून संकलन झाले असावे.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {report.collectorBreakdown.map((c) => (
                    <div 
                      key={c.collectorId}
                      className="p-4 bg-surface rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="text-sm font-black text-main-text">{c.collectorName}</h5>
                          <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            बुक सिरीज: {c.bookPrefix}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 rounded-full font-mono text-xs font-black">
                          ₹{c.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800 text-[11px] font-mono">
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase">पावत्या</span>
                          <span className="font-bold">{c.receiptsCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase">रोख (Cash)</span>
                          <span className="font-bold text-emerald-600">₹{c.cashAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase">UPI / QR</span>
                          <span className="font-bold text-blue-600">₹{c.upiAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {c.cashInHand > 0 && (
                        <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-[10px] flex justify-between font-bold text-amber-800 dark:text-amber-300">
                          <span>खजिनदाराकडे जमा बाकी रोख:</span>
                          <span className="font-mono font-black">₹{c.cashInHand.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ITEMIZED RECEIPTS LIST */}
          {activeTab === 'receipts' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                  {report.date} रोजी जारी केलेल्या सर्व डिजिटल पावत्या
                </h4>
                <span className="text-xs font-bold text-gray-500">
                  एकूण {report.receiptsCount} पावत्या
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-zinc-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">पावती क्र.</th>
                      <th className="p-3">वेळ</th>
                      <th className="p-3">देणगीदाराचे नाव</th>
                      <th className="p-3">वर्गवारी</th>
                      <th className="p-3">पेमेंट</th>
                      <th className="p-3 text-right">रक्कम (₹)</th>
                      <th className="p-3 text-center">कृती</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {pavatis.filter(p => p.date === selectedDate).map((p) => (
                      <tr key={p.id} className={`hover:bg-gray-50 dark:hover:bg-zinc-800/40 ${p.isCancelled ? 'opacity-50 bg-rose-50/50' : ''}`}>
                        <td className="p-3 font-mono font-bold text-primary">{p.receiptNumber}</td>
                        <td className="p-3 font-mono text-gray-500">{p.time || '---'}</td>
                        <td className="p-3 font-bold text-main-text">
                          {p.donorName}
                          {p.isCancelled && <span className="ml-2 text-[9px] bg-rose-600 text-white px-1.5 py-0.2 rounded">रद्द</span>}
                        </td>
                        <td className="p-3 text-gray-500">{p.category}</td>
                        <td className="p-3 font-mono uppercase text-gray-600 dark:text-gray-400">{p.paymentMode}</td>
                        <td className="p-3 text-right font-mono font-black text-main-text">₹{p.amount.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-center">
                          {onViewReceipt && (
                            <button
                              onClick={() => onViewReceipt(p)}
                              className="px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg font-bold text-[10px] transition-all"
                            >
                              पाहा
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer with Actions (WhatsApp, Print, Excel Export) */}
        <div className="p-4 sm:p-5 bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm"
              title="Send to Mandal WhatsApp Group"
            >
              <Share2 size={15} />
              WhatsApp अहवाल पाठवा
            </button>

            <button
              onClick={handleCopyWhatsApp}
              className="px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all flex items-center gap-1.5"
            >
              {copiedNotification ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copiedNotification ? 'कॉपी झाले!' : 'मजकूर कॉपी'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDailyExcel}
              className="px-3.5 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" />
              Excel अहवाल (XLSX)
            </button>

            <button
              onClick={handlePrintSlip}
              className="px-4 py-2 bg-orange-600 text-white rounded-xl font-bold text-xs hover:bg-orange-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Printer size={15} />
              दैनिक ऑडिट स्लिप प्रिंट करा
            </button>
          </div>

        </div>

      </motion.div>
    </div>
  );
};
