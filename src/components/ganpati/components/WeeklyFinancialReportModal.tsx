import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  Share2, 
  ShieldCheck, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  CheckCircle2, 
  Banknote, 
  Smartphone, 
  Building2, 
  FileText, 
  Check, 
  Copy,
  Sparkles,
  Award,
  Layers,
  ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DigitalPavati, ExpenseEntry, MandalProfile, MandalLanguage } from '../types';

interface WeeklyFinancialReportModalProps {
  pavatis: DigitalPavati[];
  expenses: ExpenseEntry[];
  mandal: MandalProfile;
  lang: MandalLanguage;
  onClose: () => void;
}

type WeekOption = 'week1' | 'week2' | 'full' | 'custom';

export const WeeklyFinancialReportModal: React.FC<WeeklyFinancialReportModalProps> = ({
  pavatis,
  expenses,
  mandal,
  lang,
  onClose
}) => {
  const [selectedWeek, setSelectedWeek] = useState<WeekOption>('week1');
  const [customStartDate, setCustomStartDate] = useState('2026-08-15');
  const [customEndDate, setCustomEndDate] = useState('2026-08-21');
  const [copiedBriefing, setCopiedBriefing] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Date ranges definitions
  const dateRange = useMemo(() => {
    switch (selectedWeek) {
      case 'week1':
        return {
          titleMr: 'आठवडा १ (दिवस १ ते ७ : १५ ऑगस्ट - २१ ऑगस्ट २०२६)',
          titleEn: 'Week 1 (Days 1-7 : Aug 15 - Aug 21, 2026)',
          start: '2026-08-15',
          end: '2026-08-21'
        };
      case 'week2':
        return {
          titleMr: 'आठवडा २ (दिवस ८ ते १०+ : २२ ऑगस्ट - २५ ऑगस्ट २०२६)',
          titleEn: 'Week 2 (Days 8-10+ : Aug 22 - Aug 25, 2026)',
          start: '2026-08-22',
          end: '2026-08-25'
        };
      case 'full':
        return {
          titleMr: 'संपूर्ण १०-दिवसीय गणेशोत्सव सर्वसमावेशक अहवाल (१५ - २५ ऑगस्ट २०२६)',
          titleEn: 'Full 10-Day Festival Comprehensive Report (Aug 15 - Aug 25, 2026)',
          start: '2026-08-15',
          end: '2026-08-25'
        };
      case 'custom':
        return {
          titleMr: `कस्टम कालावधी (${customStartDate} ते ${customEndDate})`,
          titleEn: `Custom Period (${customStartDate} to ${customEndDate})`,
          start: customStartDate,
          end: customEndDate
        };
    }
  }, [selectedWeek, customStartDate, customEndDate]);

  // Filter pavatis and expenses for the selected range
  const filteredPavatis = useMemo(() => {
    return pavatis.filter(p => {
      if (p.isCancelled) return false;
      const d = p.date;
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [pavatis, dateRange]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = e.date;
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [expenses, dateRange]);

  // Income calculations
  const totalIncome = useMemo(() => {
    return filteredPavatis.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [filteredPavatis]);

  const cashIncome = useMemo(() => {
    return filteredPavatis
      .filter(p => (p.paymentMode || '').toLowerCase().includes('cash') || (p.paymentMode || '').includes('रोख'))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [filteredPavatis]);

  const digitalIncome = totalIncome - cashIncome;

  // Expense calculations
  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const cashExpense = useMemo(() => {
    return filteredExpenses
      .filter(e => (e.paymentMode || '').toLowerCase().includes('cash') || (e.paymentMode || '').includes('रोख'))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const bankExpense = totalExpense - cashExpense;

  // Net surplus
  const netSurplus = totalIncome - totalExpense;

  // Category breakdowns
  const incomeByCategory = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    filteredPavatis.forEach(p => {
      const cat = p.category || 'इतर वर्गणी';
      if (!map[cat]) map[cat] = { count: 0, total: 0 };
      map[cat].count += 1;
      map[cat].total += Number(p.amount) || 0;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [filteredPavatis]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    filteredExpenses.forEach(e => {
      const cat = e.category || 'इतर व्यवस्थापन';
      if (!map[cat]) map[cat] = { count: 0, total: 0 };
      map[cat].count += 1;
      map[cat].total += Number(e.amount) || 0;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [filteredExpenses]);

  // Day-wise collection and expense breakdown table
  const dayWiseLedger = useMemo(() => {
    const daysMap: Record<string, { date: string; incomeCount: number; incomeTotal: number; cashIn: number; digitalIn: number; expenseCount: number; expenseTotal: number }> = {};

    filteredPavatis.forEach(p => {
      if (!daysMap[p.date]) {
        daysMap[p.date] = { date: p.date, incomeCount: 0, incomeTotal: 0, cashIn: 0, digitalIn: 0, expenseCount: 0, expenseTotal: 0 };
      }
      const isCash = (p.paymentMode || '').toLowerCase().includes('cash') || (p.paymentMode || '').includes('रोख');
      daysMap[p.date].incomeCount += 1;
      daysMap[p.date].incomeTotal += Number(p.amount) || 0;
      if (isCash) daysMap[p.date].cashIn += Number(p.amount) || 0;
      else daysMap[p.date].digitalIn += Number(p.amount) || 0;
    });

    filteredExpenses.forEach(e => {
      if (!daysMap[e.date]) {
        daysMap[e.date] = { date: e.date, incomeCount: 0, incomeTotal: 0, cashIn: 0, digitalIn: 0, expenseCount: 0, expenseTotal: 0 };
      }
      daysMap[e.date].expenseCount += 1;
      daysMap[e.date].expenseTotal += Number(e.amount) || 0;
    });

    return Object.values(daysMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredPavatis, filteredExpenses]);

  // Top Donors in Period
  const topDonors = useMemo(() => {
    return [...filteredPavatis].sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [filteredPavatis]);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel Handler
  const handleExportExcel = () => {
    const summaryData = [
      { 'तपशील': 'मंडळाचे नाव', 'माहिती': mandal.nameMr },
      { 'तपशील': 'नोंदणी क्रमांक', 'माहिती': mandal.regNumber },
      { 'तपशील': 'अहवाल कालावधी', 'माहिती': dateRange.titleMr },
      { 'तपशील': 'एकूण जमा रक्कम (Gross Income)', 'माहिती': totalIncome },
      { 'तपशील': 'एकूण पावत्या संख्या', 'माहिती': filteredPavatis.length },
      { 'तपशील': 'रोख जमा (Cash Collections)', 'माहिती': cashIncome },
      { 'तपशील': 'ऑनलाइन जमा (UPI/QR/Bank)', 'माहिती': digitalIncome },
      { 'तपशील': 'एकूण खर्च रक्कम (Gross Expenses)', 'माहिती': totalExpense },
      { 'तपशील': 'एकूण खर्च व्हाऊचर्स', 'माहिती': filteredExpenses.length },
      { 'तपशील': 'साप्ताहिक निव्वळ शिल्लक (Net Surplus)', 'माहिती': netSurplus },
      { 'तपशील': 'अहवाल निर्मिती तारीख', 'माहिती': new Date().toLocaleDateString('mr-IN') }
    ];

    const dayWiseData = dayWiseLedger.map((d, i) => ({
      'अ.क्र.': i + 1,
      'दिनांक': d.date,
      'पावती संख्या': d.incomeCount,
      'रोख जमा (₹)': d.cashIn,
      'डिजिटल जमा (₹)': d.digitalIn,
      'दैनिक एकूण जमा (₹)': d.incomeTotal,
      'खर्च व्हाऊचर्स': d.expenseCount,
      'दैनिक एकूण खर्च (₹)': d.expenseTotal,
      'दैनिक निव्वळ शिल्लक (₹)': d.incomeTotal - d.expenseTotal
    }));

    const incomeDetail = filteredPavatis.map(p => ({
      'पावती क्र.': p.receiptNumber,
      'दिनांक': p.date,
      'देणगीदार': p.donorName,
      'मोबाईल': p.phone,
      'वर्गवारी': p.category,
      'रक्कम (₹)': p.amount,
      'भरणा प्रकार': p.paymentMode.toUpperCase(),
      'संकलक': p.receivedBy
    }));

    const expenseDetail = filteredExpenses.map(e => ({
      'व्हाऊचर क्र.': e.voucherNumber,
      'दिनांक': e.date,
      'खर्चाचे नाव': e.title,
      'व्यापारी/व्हेंडर': e.vendorName,
      'वर्गवारी': e.category,
      'रक्कम (₹)': e.amount,
      'पद्धत': e.paymentMode.toUpperCase(),
      'मंजूर अधिकारी': e.approvedBy
    }));

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const wsDays = XLSX.utils.json_to_sheet(dayWiseData);
    const wsIncome = XLSX.utils.json_to_sheet(incomeDetail);
    const wsExpense = XLSX.utils.json_to_sheet(expenseDetail);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive_Summary');
    XLSX.utils.book_append_sheet(wb, wsDays, 'Day_Wise_Progression');
    XLSX.utils.book_append_sheet(wb, wsIncome, 'Income_Receipts');
    XLSX.utils.book_append_sheet(wb, wsExpense, 'Expense_Vouchers');

    const fileName = `Weekly_Financial_Report_${dateRange.start}_to_${dateRange.end}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // WhatsApp Share Handler
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🚩 *${mandal.nameMr}* 🚩\n` +
      `----------------------------------------\n` +
      `📋 *साप्ताहिक आर्थिक अहवाल (कार्यकारणी आढावा)*\n` +
      `📅 *कालावधी:* ${dateRange.titleMr}\n` +
      `----------------------------------------\n` +
      `💰 *एकूण संकलन (Total Income):* ₹${totalIncome.toLocaleString('en-IN')}\n` +
      `  • रोख संकलन (Cash): ₹${cashIncome.toLocaleString('en-IN')}\n` +
      `  • ऑनलाइन/UPI संकलन: ₹${digitalIncome.toLocaleString('en-IN')}\n` +
      `  • एकूण पावत्या: ${filteredPavatis.length}\n` +
      `----------------------------------------\n` +
      `💸 *एकूण खर्च (Total Expenses):* ₹${totalExpense.toLocaleString('en-IN')}\n` +
      `  • रोख खर्च: ₹${cashExpense.toLocaleString('en-IN')}\n` +
      `  • बँक/ऑनलाइन खर्च: ₹${bankExpense.toLocaleString('en-IN')}\n` +
      `  • एकूण खर्च व्हाऊचर्स: ${filteredExpenses.length}\n` +
      `----------------------------------------\n` +
      `📈 *साप्ताहिक निव्वळ शिल्लक (Net Surplus):* ₹${netSurplus.toLocaleString('en-IN')}\n` +
      `✅ *कार्यकारणी पुनरावलोकन:* सर्वानुमते मंजूर\n` +
      `----------------------------------------\n` +
      `स्वाक्षरी: खजिनदार व अंतर्गत हिशोब तपासणीस\n` +
      `|| गणपती बाप्पा मोरया, मंगलमूर्ती मोरया ||`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Copy Briefing text
  const handleCopyBriefing = () => {
    const text = 
      `🚩 ${mandal.nameMr} - साप्ताहिक आर्थिक अहवाल (${dateRange.titleMr})\n` +
      `एकूण संकलन: ₹${totalIncome.toLocaleString('en-IN')} (${filteredPavatis.length} पावत्या)\n` +
      `एकूण खर्च: ₹${totalExpense.toLocaleString('en-IN')} (${filteredExpenses.length} व्हाऊचर्स)\n` +
      `निव्वळ शिल्लक: ₹${netSurplus.toLocaleString('en-IN')}\n` +
      `रोख जमा: ₹${cashIncome.toLocaleString('en-IN')} | डिजिटल जमा: ₹${digitalIncome.toLocaleString('en-IN')}`;
    navigator.clipboard.writeText(text);
    setCopiedBriefing(true);
    setTimeout(() => setCopiedBriefing(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-amber-200/50 dark:border-amber-900/30 my-auto print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none print:rounded-none"
      >
        {/* Top Control Bar - Hidden on Print */}
        <div className="flex flex-col gap-3 px-6 py-4 bg-gradient-to-r from-stone-900 via-zinc-900 to-stone-900 text-white border-b border-stone-800 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="font-black text-sm md:text-base tracking-wide text-amber-200 flex items-center gap-2">
                  <span>साप्ताहिक आर्थिक ताळेबंद व समिती पुनरावलोकन अहवाल</span>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                    PDF / Committee Ready
                  </span>
                </h3>
                <p className="text-[11px] text-gray-400">
                  {mandal.nameMr} • नोंदणी क्र: {mandal.regNumber}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
                title="Print or Save as PDF"
              >
                <Printer size={15} />
                <span>प्रिंट / PDF डाऊनलोड</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-900/20 transition-all"
                title="Export to Excel"
              >
                <FileSpreadsheet size={15} />
                <span className="hidden sm:inline">Excel</span>
              </button>

              <button
                onClick={handleWhatsAppShare}
                className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-green-900/20 transition-all"
                title="Share on WhatsApp"
              >
                <Share2 size={15} />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Week & Date Selector Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-gray-400 font-bold mr-1">कालावधी निवडा:</span>
              
              <button
                onClick={() => setSelectedWeek('week1')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  selectedWeek === 'week1'
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                }`}
              >
                आठवडा १ (दिवस १ ते ७)
              </button>

              <button
                onClick={() => setSelectedWeek('week2')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  selectedWeek === 'week2'
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                }`}
              >
                आठवडा २ (दिवस ८ ते १०+)
              </button>

              <button
                onClick={() => setSelectedWeek('full')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  selectedWeek === 'full'
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                }`}
              >
                संपूर्ण उत्सव (१० दिवस)
              </button>

              <button
                onClick={() => setSelectedWeek('custom')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  selectedWeek === 'custom'
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                }`}
              >
                कस्टम कालावधी
              </button>
            </div>

            {selectedWeek === 'custom' && (
              <div className="flex items-center gap-2 bg-zinc-800 p-1.5 rounded-xl border border-zinc-700">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-zinc-900 text-white px-2 py-0.5 rounded text-[11px] font-mono"
                />
                <span className="text-gray-400">ते</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-zinc-900 text-white px-2 py-0.5 rounded text-[11px] font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div ref={printAreaRef} className="p-6 sm:p-10 bg-[#faf8f5] dark:bg-zinc-950 text-gray-900 dark:text-gray-100 max-h-[80vh] overflow-y-auto print:max-h-none print:p-4 print:overflow-visible print:bg-white">
          
          {/* Header Frame / Letterhead */}
          <div className="border-4 border-amber-600 dark:border-amber-700 rounded-3xl p-6 md:p-8 bg-white dark:bg-zinc-900 shadow-xl print:shadow-none print:border-2 print:border-black space-y-6">
            
            {/* Auspicious Banner */}
            <div className="text-center pb-3 border-b-2 border-amber-300 dark:border-amber-800">
              <p className="text-amber-800 dark:text-amber-400 font-serif font-bold text-xs md:text-sm tracking-widest uppercase">
                🚩 ॥ श्री गणेशाय नमः • मंगलमूर्ती मोरया ॥ 🚩
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-amber-950 dark:text-amber-300 mt-1">
                {mandal.nameMr}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {mandal.addressMr} • नोंदणी क्र: <strong>{mandal.regNumber}</strong> • स्थापना: {mandal.establishedYear}
              </p>
              
              <div className="inline-block mt-3 px-4 py-1 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white text-xs font-black rounded-lg uppercase tracking-wider shadow-sm">
                साप्ताहिक आर्थिक जमा-खर्च व ताळेबंद पुनरावलोकन अहवाल
              </div>
            </div>

            {/* Document Metadata Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-amber-50/90 dark:bg-zinc-800/80 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs">
              <div>
                <span className="text-gray-500 block text-[10px] font-bold uppercase">अहवाल कालावधी</span>
                <span className="font-bold text-main-text text-[11px] sm:text-xs">{dateRange.titleMr}</span>
              </div>
              <div className="border-t sm:border-t-0 sm:border-l border-amber-200 dark:border-amber-900/40 pt-2 sm:pt-0 sm:pl-3">
                <span className="text-gray-500 block text-[10px] font-bold uppercase">दिनांक व अहवाल क्रमांक</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                  WFR-{dateRange.start.replace(/-/g, '')}-01 • {new Date().toLocaleDateString('mr-IN')}
                </span>
              </div>
              <div className="border-t sm:border-t-0 sm:border-l border-amber-200 dark:border-amber-900/40 pt-2 sm:pt-0 sm:pl-3">
                <span className="text-gray-500 block text-[10px] font-bold uppercase">समिती पुनरावलोकन स्थिती</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck size={14} /> सर्वानुमते मंजूर (Approved)
                </span>
              </div>
            </div>

            {/* 3 Major Financial Key Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Total Income */}
              <div className="p-4 bg-emerald-50/90 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-800 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                    <TrendingUp size={16} /> एकूण संकलन (Total Income)
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 rounded-full font-mono">
                    {filteredPavatis.length} पावत्या
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-200 font-mono">
                  ₹{totalIncome.toLocaleString('en-IN')}
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300 mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-900 font-medium">
                  <span>रोख: ₹{cashIncome.toLocaleString('en-IN')}</span>
                  <span>UPI/ऑनलाइन: ₹{digitalIncome.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Total Expense */}
              <div className="p-4 bg-rose-50/90 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-800 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-rose-800 dark:text-rose-300 uppercase tracking-wide flex items-center gap-1.5">
                    <TrendingDown size={16} /> एकूण खर्च (Total Expenses)
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-rose-200/80 dark:bg-rose-900 text-rose-900 dark:text-rose-200 rounded-full font-mono">
                    {filteredExpenses.length} व्हाऊचर्स
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-rose-900 dark:text-rose-200 font-mono">
                  ₹{totalExpense.toLocaleString('en-IN')}
                </div>
                <div className="flex items-center justify-between text-[11px] text-rose-700 dark:text-rose-300 mt-2 pt-2 border-t border-rose-200 dark:border-rose-900 font-medium">
                  <span>रोख खर्च: ₹{cashExpense.toLocaleString('en-IN')}</span>
                  <span>बँक/ऑनलाइन: ₹{bankExpense.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Net Surplus */}
              <div className="p-4 bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-800 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles size={16} /> साप्ताहिक निव्वळ शिल्लक
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 rounded-full">
                    ताळेबंद अधिशेष
                  </span>
                </div>
                <div className={`text-2xl sm:text-3xl font-black font-mono ${netSurplus >= 0 ? 'text-amber-950 dark:text-amber-300' : 'text-rose-700'}`}>
                  ₹{netSurplus.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-400 mt-2 pt-2 border-t border-amber-200 dark:border-amber-900 font-medium">
                  {netSurplus >= 0 ? '✅ उत्सव ताळेबंद समाधानकारक शिल्लकीत आहे.' : '⚠️ खर्चाचे प्रमाण संकलनापेक्षा अधिक आहे.'}
                </p>
              </div>

            </div>

            {/* SECTION 1: Day-by-Day Progression Table */}
            <div className="space-y-2">
              <h3 className="text-sm font-black text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <span>१. दैनिक संकलन व खर्च प्रगती तक्ता (Day-by-Day Financial Progression)</span>
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-zinc-800">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-amber-100/70 dark:bg-zinc-800 text-amber-950 dark:text-amber-200 font-bold border-b border-gray-200 dark:border-zinc-700">
                      <th className="py-2.5 px-3">दिनांक</th>
                      <th className="py-2.5 px-3 text-center">पावत्या</th>
                      <th className="py-2.5 px-3 text-right">रोख संकलन (₹)</th>
                      <th className="py-2.5 px-3 text-right">डिजिटल / UPI (₹)</th>
                      <th className="py-2.5 px-3 text-right font-black">एकूण जमा (₹)</th>
                      <th className="py-2.5 px-3 text-center">व्हाऊचर्स</th>
                      <th className="py-2.5 px-3 text-right font-black">एकूण खर्च (₹)</th>
                      <th className="py-2.5 px-3 text-right font-black">निव्वळ शिल्लक (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-[11px]">
                    {dayWiseLedger.map((d) => {
                      const dayBalance = d.incomeTotal - d.expenseTotal;
                      return (
                        <tr key={d.date} className="hover:bg-amber-50/50 dark:hover:bg-zinc-800/40">
                          <td className="py-2 px-3 font-mono font-bold text-gray-800 dark:text-gray-200">{d.date}</td>
                          <td className="py-2 px-3 text-center font-mono">{d.incomeCount}</td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400">₹{d.cashIn.toLocaleString('en-IN')}</td>
                          <td className="py-2 px-3 text-right font-mono text-blue-600 dark:text-blue-400">₹{d.digitalIn.toLocaleString('en-IN')}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800 dark:text-emerald-300">₹{d.incomeTotal.toLocaleString('en-IN')}</td>
                          <td className="py-2 px-3 text-center font-mono">{d.expenseCount}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-700 dark:text-rose-400">₹{d.expenseTotal.toLocaleString('en-IN')}</td>
                          <td className={`py-2 px-3 text-right font-mono font-black ${dayBalance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}`}>
                            ₹{dayBalance.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-amber-200/60 dark:bg-zinc-800 font-bold border-t-2 border-amber-300 dark:border-zinc-700 text-xs">
                      <td className="py-2.5 px-3">एकूण (Grand Total)</td>
                      <td className="py-2.5 px-3 text-center font-mono">{filteredPavatis.length}</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹{cashIncome.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹{digitalIncome.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-800 dark:text-emerald-300">₹{totalIncome.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{filteredExpenses.length}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-rose-800 dark:text-rose-300">₹{totalExpense.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-amber-950 dark:text-amber-200">₹{netSurplus.toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* SECTION 2: Category Breakdowns (Income & Expenses) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Income Categories */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={14} /> २. उत्पन्न वर्गवारी सारांश (Income by Category)
                </h4>
                <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-zinc-800 text-[10px] uppercase font-bold text-gray-500">
                      <tr>
                        <th className="p-2 pl-3">वर्गवारी</th>
                        <th className="p-2 text-center">पावत्या</th>
                        <th className="p-2 text-right pr-3">रक्कम (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-[11px]">
                      {incomeByCategory.map(([cat, val]) => (
                        <tr key={cat}>
                          <td className="p-2 pl-3 font-semibold text-gray-800 dark:text-gray-200">{cat}</td>
                          <td className="p-2 text-center font-mono text-gray-500">{val.count}</td>
                          <td className="p-2 text-right pr-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            ₹{val.total.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expense Categories */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingDown size={14} /> ३. खर्च वर्गवारी सारांश (Expenses by Category)
                </h4>
                <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-zinc-800 text-[10px] uppercase font-bold text-gray-500">
                      <tr>
                        <th className="p-2 pl-3">खर्च विभाग</th>
                        <th className="p-2 text-center">व्हाऊचर्स</th>
                        <th className="p-2 text-right pr-3">रक्कम (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-[11px]">
                      {expenseByCategory.map(([cat, val]) => (
                        <tr key={cat}>
                          <td className="p-2 pl-3 font-semibold text-gray-800 dark:text-gray-200">{cat}</td>
                          <td className="p-2 text-center font-mono text-gray-500">{val.count}</td>
                          <td className="p-2 text-right pr-3 font-mono font-bold text-rose-700 dark:text-rose-400">
                            ₹{val.total.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* SECTION 3: Major Donors & Bank Liquidity Reconciliation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-dashed border-gray-200 dark:border-zinc-800">
              
              {/* Top Donors */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={14} /> ४. प्रमुख देणगीदार (Top Donors in this Period)
                </h4>
                <div className="space-y-1.5 text-xs">
                  {topDonors.map((p, idx) => (
                    <div key={p.receiptNumber} className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 dark:bg-zinc-800/60 border border-amber-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-gray-900 dark:text-white block text-[11px]">{p.donorName}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{p.receiptNumber} • {p.category}</span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-xs">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bank & Cash Liquidity Status */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={14} /> ५. रोख व बँक ताळेबंद स्थिती (Cash & Liquidity)
                </h4>
                <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-gray-200 dark:border-zinc-700 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">मंडळ मध्यवर्ती बँक खाते (HDFC Bank):</span>
                    <span className="font-mono font-bold text-main-text">₹{digitalIncome.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">खजिनदार तिजोरी प्रत्यक्ष रोख (Cash in Safe):</span>
                    <span className="font-mono font-bold text-emerald-600">₹{(cashIncome - cashExpense).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 dark:border-zinc-700 pt-2 font-bold">
                    <span>एकूण निव्वळ उपलब्ध निधी:</span>
                    <span className="font-mono font-black text-amber-900 dark:text-amber-300 text-sm">₹{netSurplus.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* SECTION 4: Committee Review, Resolutions & Signatures */}
            <div className="pt-4 border-t-2 border-amber-300 dark:border-amber-800 space-y-4">
              <div className="bg-amber-50/80 dark:bg-zinc-800/80 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 text-xs space-y-1.5">
                <h4 className="font-black text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-emerald-600" />
                  कार्यकारणी समिती पुनरावलोकन व ठराव (Committee Resolutions)
                </h4>
                <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed">
                  १. वरील अहवालातील सर्व जमा पावत्या (क्र. १ ते {filteredPavatis.length}) आणि खर्चाचे व्हाऊचर्स (क्र. १ ते {filteredExpenses.length}) खजिनदार व अंतर्गत हिशोब तपासनीस यांच्या उपस्थितीत तपासण्यात आले असून हिशोब पूर्णपणे अचूक व नियमानुसार आहे.
                </p>
                <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed">
                  २. धर्मादाय आयुक्तांच्या नियमांनुसार अधिकृत डिजिटल लेजरमध्ये सर्व नोंदी सुरक्षित असून हा अहवाल कार्यकारिणी समितीच्या बैठकीत सर्वानुमते मंजूर करण्यात आला आहे.
                </p>
              </div>

              {/* 5 Official Signatures */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-center text-xs">
                
                {/* President */}
                <div>
                  <div className="h-10 flex items-end justify-center font-serif italic font-bold text-amber-950 dark:text-amber-300 text-xs">
                    {mandal.presidentName || 'राजेंद्र बापूराव तांबडे'}
                  </div>
                  <div className="border-t border-gray-400 dark:border-gray-600 pt-1 text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase">
                    अध्यक्ष (President)
                  </div>
                </div>

                {/* Working President */}
                <div>
                  <div className="h-10 flex items-end justify-center font-serif italic font-bold text-amber-950 dark:text-amber-300 text-xs">
                    {mandal.workingPresidentName || 'विलास लक्ष्मण जगताप'}
                  </div>
                  <div className="border-t border-gray-400 dark:border-gray-600 pt-1 text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase">
                    कार्याध्यक्ष
                  </div>
                </div>

                {/* Secretary */}
                <div>
                  <div className="h-10 flex items-end justify-center font-serif italic font-bold text-amber-950 dark:text-amber-300 text-xs">
                    {mandal.secretaryName || 'सचिन अनंत कुलकर्णी'}
                  </div>
                  <div className="border-t border-gray-400 dark:border-gray-600 pt-1 text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase">
                    सचिव (Secretary)
                  </div>
                </div>

                {/* Treasurer */}
                <div>
                  <div className="h-10 flex items-end justify-center font-serif italic font-bold text-amber-950 dark:text-amber-300 text-xs">
                    {mandal.treasurerName || 'महेश चंद्रकांत गायकवाड'}
                  </div>
                  <div className="border-t border-gray-400 dark:border-gray-600 pt-1 text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase">
                    खजिनदार (Treasurer)
                  </div>
                </div>

              </div>

              {/* Mandal Seal */}
              <div className="text-center pt-2">
                <p className="text-[10px] text-gray-500 font-serif italic">
                  🚩 श्री शिवतेज गणेशोत्सव मंडळ, पुणे • अधिकृत ताळेबंद दस्तऐवज • संगणकीकृत डिजिटल स्वाक्षरी 🚩
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* Modal Bottom Action Footer - Hidden on Print */}
        <div className="p-4 bg-gray-50 dark:bg-zinc-800/90 border-t border-gray-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyBriefing}
              className="px-3.5 py-2 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 flex items-center gap-1.5 transition-all shadow-sm"
            >
              {copiedBriefing ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copiedBriefing ? 'माहिती कॉपी झाली!' : 'सारांश मजकूर कॉपी करा'}
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <FileSpreadsheet size={14} />
              Excel (.xlsx) डाऊनलोड
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Printer size={15} />
              प्रिंट / PDF डाऊनलोड करा
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 rounded-xl text-xs font-bold transition-all"
            >
              बंद करा
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
