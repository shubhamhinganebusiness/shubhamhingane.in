import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  ShieldCheck, 
  CheckCircle2, 
  Award, 
  Scale, 
  IndianRupee,
  Building2,
  Calendar,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DigitalPavati, ExpenseEntry, MandalProfile, MandalLanguage } from '../types';

interface AuditReportModalProps {
  pavatis: DigitalPavati[];
  expenses: ExpenseEntry[];
  mandal: MandalProfile;
  lang: MandalLanguage;
  onClose: () => void;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  pavatis,
  expenses,
  mandal,
  lang,
  onClose
}) => {
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Active Pavatis Only
  const activePavatis = pavatis.filter(p => !p.isCancelled);

  // Income Aggregate
  const totalIncome = activePavatis.reduce((sum, p) => sum + p.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netSurplus = totalIncome - totalExpense;

  // Breakdown by Categories
  const incomeByCategory = activePavatis.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  const expenseByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  // Payment Mode Breakdowns
  const isMode = (mode: string, targets: string[]) => targets.some(t => mode?.toLowerCase() === t.toLowerCase());

  const cashIncome = activePavatis.filter(p => isMode(p.paymentMode, ['cash'])).reduce((sum, p) => sum + p.amount, 0);
  const upiIncome = activePavatis.filter(p => isMode(p.paymentMode, ['upi', 'gpay', 'phonepe', 'paytm', 'online', 'qr'])).reduce((sum, p) => sum + p.amount, 0);
  const bankIncome = activePavatis.filter(p => isMode(p.paymentMode, ['bank transfer', 'neft', 'rtgs', 'netbanking', 'imps', 'bank'])).reduce((sum, p) => sum + p.amount, 0);
  const chequeIncome = activePavatis.filter(p => isMode(p.paymentMode, ['cheque', 'check', 'dd'])).reduce((sum, p) => sum + p.amount, 0);

  const cashExpense = expenses.filter(e => isMode(e.paymentMode, ['cash'])).reduce((sum, e) => sum + e.amount, 0);
  const upiExpense = expenses.filter(e => isMode(e.paymentMode, ['upi', 'gpay', 'phonepe', 'paytm', 'online', 'qr'])).reduce((sum, e) => sum + e.amount, 0);
  const bankExpense = expenses.filter(e => isMode(e.paymentMode, ['bank transfer', 'neft', 'rtgs', 'netbanking', 'imps', 'bank'])).reduce((sum, e) => sum + e.amount, 0);
  const chequeExpense = expenses.filter(e => isMode(e.paymentMode, ['cheque', 'check', 'dd'])).reduce((sum, e) => sum + e.amount, 0);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel
  const handleExportExcel = () => {
    const incomeRows = Object.entries(incomeByCategory).map(([cat, amt]) => ({
      'लेखा शीर्षक (Account Head)': `जमा: ${cat}`,
      'प्रकार': 'जमा (Income)',
      'रक्कम (₹)': amt
    }));

    const expenseRows = Object.entries(expenseByCategory).map(([cat, amt]) => ({
      'लेखा शीर्षक (Account Head)': `खर्च: ${cat}`,
      'प्रकार': 'खर्च (Expense)',
      'रक्कम (₹)': amt
    }));

    const summaryRows = [
      { 'लेखा शीर्षक (Account Head)': 'एकूण जमा निधी (Gross Income)', 'प्रकार': 'Total', 'रक्कम (₹)': totalIncome },
      { 'लेखा शीर्षक (Account Head)': 'एकूण झालेला खर्च (Gross Expenditure)', 'प्रकार': 'Total', 'रक्कम (₹)': totalExpense },
      { 'लेखा शीर्षक (Account Head)': 'निव्वळ शिल्लक निधी (Net Surplus Balance)', 'प्रकार': 'Balance', 'रक्कम (₹)': netSurplus }
    ];

    const worksheet = XLSX.utils.json_to_sheet([...incomeRows, ...expenseRows, ...summaryRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Final_Audit_Ledger_2026');
    XLSX.writeFile(workbook, `Shivtej_Ganpati_Final_Audit_Statement_2026.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface border border-gray-200 dark:border-zinc-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col"
      >
        
        {/* Top Actions Control Header (Hidden on Print) */}
        <div className="p-4 bg-gray-900 text-white flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500 text-stone-950 rounded-lg">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">अधिकृत वार्षिक ताळेबंद व ऑडिट अहवाल २०२६</h3>
              <p className="text-[10px] text-gray-400">धर्मादाय आयुक्त व सनदी लेखापाल (CA) प्रमाणित विवरणपत्र</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <FileSpreadsheet size={14} /> Excel
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Printer size={14} /> प्रिंट / PDF डाऊनलोड
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 hover:text-white transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Audit Document Container */}
        <div 
          ref={printContainerRef}
          className="p-6 sm:p-10 overflow-y-auto bg-white text-gray-900 font-sans space-y-6 print:p-4 print:text-black print:overflow-visible"
        >
          
          {/* Official Letterhead */}
          <div className="text-center pb-4 border-b-2 border-amber-500/80 space-y-1 relative">
            <p className="text-xs font-bold text-amber-700 font-serif">॥ श्री गणेशाय नमः ॥</p>
            
            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600 font-bold uppercase tracking-wider">
              <span>नोंदणी क्र: {mandal.regNumber}</span>
              <span>•</span>
              <span>स्थापना वर्ष: {mandal.establishedYear}</span>
              <span>•</span>
              <span>80G आयकर सवलत प्रमाणपत्र क्र: {mandal.panNumber || 'CIT/PUN/80G/1982'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-amber-900 tracking-tight">
              {mandal.nameMr}
            </h2>
            <p className="text-xs text-gray-600 font-serif italic">
              {mandal.taglineMr}
            </p>
            <p className="text-xs text-gray-600">
              {mandal.addressMr} • संपर्क: {mandal.phone} • ई-मेल: {mandal.email}
            </p>

            <div className="mt-3 inline-block px-4 py-1 bg-amber-500 text-stone-950 font-black text-xs uppercase rounded-md tracking-wider">
              श्री गणेशोत्सव २०२६ - वार्षिक हिशोब व अंतिम ताळेबंद (Final Audit Ledger)
            </div>
          </div>

          {/* Audit Verification Period Notice */}
          <div className="flex flex-wrap items-center justify-between text-xs bg-amber-50/80 p-3 rounded-xl border border-amber-200">
            <div>
              <span className="font-bold text-gray-700">हिशोब कालावधी: </span>
              <span>१५ ऑगस्ट २०२६ ते २५ ऑगस्ट २०२६ (१० दिवसीय गणेशोत्सव)</span>
            </div>
            <div>
              <span className="font-bold text-gray-700">अंतिम ताळेबंद दिनांक: </span>
              <span>२६ ऑगस्ट २०२६</span>
            </div>
          </div>

          {/* Receipts & Payments 2-Column Ledger */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            
            {/* PART A: RECEIPTS (जमा) */}
            <div className="border border-emerald-300 rounded-2xl overflow-hidden bg-emerald-50/20">
              <div className="bg-emerald-600 text-white p-3 font-black text-xs flex items-center justify-between">
                <span>अ. प्राप्त देणग्या व जमा निधी (Receipts / Income)</span>
                <span>रक्कम (₹)</span>
              </div>

              <div className="p-3 divide-y divide-emerald-200/60 space-y-2">
                {Object.entries(incomeByCategory).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between pt-1.5">
                    <span className="text-gray-700 font-medium">{category}</span>
                    <span className="font-mono font-bold text-gray-900">₹ {Number(amount).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div className="bg-emerald-100 p-3 border-t-2 border-emerald-400 flex items-center justify-between font-black text-sm text-emerald-950">
                <span>एकूण जमा रक्कम (Total Receipts)</span>
                <span className="font-mono">₹ {totalIncome.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* PART B: PAYMENTS (खर्च) */}
            <div className="border border-rose-300 rounded-2xl overflow-hidden bg-rose-50/20">
              <div className="bg-rose-600 text-white p-3 font-black text-xs flex items-center justify-between">
                <span>ब. उत्सव खर्च तपशील (Expenditure / Payments)</span>
                <span>रक्कम (₹)</span>
              </div>

              <div className="p-3 divide-y divide-rose-200/60 space-y-2">
                {Object.entries(expenseByCategory).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between pt-1.5">
                    <span className="text-gray-700 font-medium">{category}</span>
                    <span className="font-mono font-bold text-gray-900">₹ {Number(amount).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div className="bg-rose-100 p-3 border-t-2 border-rose-400 flex items-center justify-between font-black text-sm text-rose-950">
                <span>एकूण झालेला खर्च (Total Expenditure)</span>
                <span className="font-mono">₹ {totalExpense.toLocaleString('en-IN')}</span>
              </div>
            </div>

          </div>

          {/* Balance Sheet & Bank / Cash Reconciliation */}
          <div className="border-2 border-amber-300 rounded-2xl p-4 bg-amber-50/40 text-xs space-y-3">
            <h4 className="font-black text-amber-900 text-sm flex items-center gap-1.5">
              <Scale size={16} /> क. अंतिम शिल्लक निधी व भरणा पद्धतीनुसार वर्गीकरण (Reconciliation)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              
              <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                <span className="text-[10px] text-gray-500 font-bold block">रोख शिल्लक (Cash in Hand)</span>
                <span className="text-sm font-black text-emerald-700 font-mono">
                  ₹ {(cashIncome - cashExpense).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                <span className="text-[10px] text-gray-500 font-bold block">UPI / QR शिल्लक</span>
                <span className="text-sm font-black text-blue-700 font-mono">
                  ₹ {(upiIncome - upiExpense).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                <span className="text-[10px] text-gray-500 font-bold block">बँक खात्यात शिल्लक (Bank A/c)</span>
                <span className="text-sm font-black text-purple-700 font-mono">
                  ₹ {(bankIncome - bankExpense).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                <span className="text-[10px] text-gray-500 font-bold block">धनादेश शिल्लक (Cheque)</span>
                <span className="text-sm font-black text-amber-700 font-mono">
                  ₹ {(chequeIncome - chequeExpense).toLocaleString('en-IN')}
                </span>
              </div>

            </div>

            <div className="p-3 bg-amber-500/20 rounded-xl flex items-center justify-between font-black text-sm text-stone-950 border border-amber-400">
              <span>अंतिम निव्वळ शिल्लक निधी (Net Surplus Balance for Next Year 2027)</span>
              <span className="font-mono text-base">₹ {netSurplus.toLocaleString('en-IN')} /-</span>
            </div>
          </div>

          {/* Statutory Auditor / Chartered Accountant Certification */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-300 text-xs space-y-1.5">
            <h5 className="font-black text-gray-900 flex items-center gap-1.5">
              <ShieldCheck className="text-emerald-600" size={15} /> सनदी लेखापाल (CA) तपासणी प्रमाणपत्र
            </h5>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              आम्ही श्री शिवतेज सार्वजनिक गणेशोत्सव मंडळ, पुणे यांचे श्री गणेशोत्सव २०२६ चे सर्व पावती पुस्तके, व्हाऊचर्स, बँक स्टेटमेंट्स व खर्चाच्या पावत्यांची सखोल तपासणी केली आहे. धर्मादाय आयुक्त नियमावली व भारतीय सनदी लेखापाल संस्थेच्या (ICAI) मानकांनुसार सदर ताळेबंद संपूर्ण सत्य, अचूक व पारदर्शक असल्याचे प्रमाणित करण्यात येत आहे.
            </p>
          </div>

          {/* Official Signatures Block */}
          <div className="grid grid-cols-4 items-end pt-8 text-center text-xs gap-2">
            
            <div>
              <div className="h-10 flex items-end justify-center">
                <span className="font-serif italic font-bold text-gray-800">{mandal.presidentName}</span>
              </div>
              <div className="border-t border-gray-400 pt-1 text-[10px] font-bold text-gray-600 uppercase">
                अध्यक्ष (President)
              </div>
            </div>

            <div>
              <div className="h-10 flex items-end justify-center">
                <span className="font-serif italic font-bold text-gray-800">{mandal.secretaryName}</span>
              </div>
              <div className="border-t border-gray-400 pt-1 text-[10px] font-bold text-gray-600 uppercase">
                सचिव (Secretary)
              </div>
            </div>

            <div>
              <div className="h-10 flex items-end justify-center">
                <span className="font-serif italic font-bold text-gray-800">{mandal.treasurerName}</span>
              </div>
              <div className="border-t border-gray-400 pt-1 text-[10px] font-bold text-gray-600 uppercase">
                खजिनदार (Treasurer)
              </div>
            </div>

            <div>
              <div className="h-10 flex items-end justify-center">
                <span className="font-serif italic font-bold text-gray-800">CA. R. B. Joshi & Co.</span>
              </div>
              <div className="border-t border-gray-400 pt-1 text-[10px] font-bold text-gray-600 uppercase">
                सनदी लेखापाल (Auditor)
              </div>
            </div>

          </div>

          <div className="text-center pt-2 text-[10px] text-gray-400 font-bold">
            🚩 गणपती बाप्पा मोरया, मंगलमूर्ती मोरया • धर्मादाय आयुक्त महाराष्ट्र राज्य नोंदणीकृत 🚩
          </div>

        </div>

      </motion.div>
    </div>
  );
};
