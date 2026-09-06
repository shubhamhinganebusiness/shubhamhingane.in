import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Download, 
  FileSpreadsheet, 
  Award, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  IndianRupee,
  Smartphone,
  Banknote,
  Printer
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';
import * as XLSX from 'xlsx';
import { DigitalPavati, ExpenseEntry, MandalProfile, MandalLanguage, VolunteerCollector, DayWiseCollection, NightlyVerificationRecord } from '../types';
import { mandalTranslations } from '../translations/mandalTranslations';
import { AuditReportModal } from './AuditReportModal';
import { DailySummaryVerificationModal } from './DailySummaryVerificationModal';
import { WeeklyFinancialReportModal } from './WeeklyFinancialReportModal';

interface ReportingAnalyticsSectionProps {
  pavatis: DigitalPavati[];
  expenses: ExpenseEntry[];
  mandal: MandalProfile;
  lang: MandalLanguage;
  userRole: string;
  volunteers?: VolunteerCollector[];
  dayWiseCollections?: DayWiseCollection[];
  verifications?: NightlyVerificationRecord[];
  onSaveVerification?: (verification: NightlyVerificationRecord) => void;
  onViewReceipt?: (pavati: DigitalPavati) => void;
}

const COLORS = ['#ea580c', '#d97706', '#059669', '#2563eb', '#8b5cf6', '#ec4899'];

export const ReportingAnalyticsSection: React.FC<ReportingAnalyticsSectionProps> = ({
  pavatis,
  expenses,
  mandal,
  lang,
  userRole,
  volunteers = [],
  dayWiseCollections = [],
  verifications = [],
  onSaveVerification,
  onViewReceipt
}) => {
  const t = mandalTranslations[lang];
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [isDailySummaryModalOpen, setIsDailySummaryModalOpen] = useState(false);
  const [selectedDailyDate, setSelectedDailyDate] = useState<string>(dayWiseCollections[0]?.date || '2026-08-15');

  // Financial Totals
  const totalIncome = useMemo(() => pavatis.reduce((sum, p) => sum + p.amount, 0), [pavatis]);
  const totalExpense = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const netBalance = totalIncome - totalExpense;

  // Category Wise Income Data for Pie Chart
  const incomeCategoryData = useMemo(() => {
    const map: { [key: string]: number } = {};
    pavatis.forEach(p => {
      const shortName = p.category.split(' ')[0];
      map[shortName] = (map[shortName] || 0) + p.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [pavatis]);

  // Payment Mode Breakdown
  const paymentModeData = useMemo(() => {
    const map: { [key: string]: number } = {};
    pavatis.forEach(p => {
      const mode = p.paymentMode.toUpperCase();
      map[mode] = (map[mode] || 0) + p.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [pavatis]);

  // Top Donors (Honor Roll)
  const topDonors = useMemo(() => {
    return [...pavatis].sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [pavatis]);

  // Daily Trend Data
  const trendData = [
    { day: 'Day 1 (आगमन)', income: 45000, expense: 32000 },
    { day: 'Day 2', income: 38000, expense: 12000 },
    { day: 'Day 3', income: 52000, expense: 18000 },
    { day: 'Day 4', income: 61000, expense: 22000 },
    { day: 'Day 5 (सत्यनारायण)', income: 84000, expense: 45000 },
    { day: 'Day 6', income: 49000, expense: 16000 },
    { day: 'Day 7', income: 55000, expense: 19000 },
    { day: 'Day 8', income: 72000, expense: 28000 },
    { day: 'Day 9 (महाआरती)', income: 98000, expense: 35000 },
    { day: 'Day 10 (विसर्जन)', income: 112000, expense: 65000 }
  ];

  // Export Full Balance Sheet
  const handleExportAuditSheet = () => {
    const incomeRows = pavatis.map(p => ({
      'प्रकार': 'उत्पन्न (Income)',
      'पावती क्र./व्हाऊचर': p.receiptNumber,
      'दिनांक': p.date,
      'नाव/विवरण': p.donorName,
      'वर्गवारी': p.category,
      'रक्कम (₹)': p.amount,
      'पद्धत': p.paymentMode.toUpperCase()
    }));

    const expenseRows = expenses.map(e => ({
      'प्रकार': 'खर्च (Expense)',
      'पावती क्र./व्हाऊचर': e.voucherNumber,
      'दिनांक': e.date,
      'नाव/विवरण': `${e.title} (${e.vendorName})`,
      'वर्गवारी': e.category,
      'रक्कम (₹)': e.amount,
      'पद्धत': e.paymentMode.toUpperCase()
    }));

    const fullLedger = [...incomeRows, ...expenseRows];
    const ws = XLSX.utils.json_to_sheet(fullLedger);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Annual_Audit_2026');
    XLSX.writeFile(wb, 'Shivtej_Mandal_Full_Audit_BalanceSheet_2026.xlsx');
  };

  return (
    <div className="space-y-8">
      
      {/* Header & Export Summary */}
      <div className="bg-surface p-6 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <BarChart3 size={22} />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-main-text tracking-tight">
              {t.nav.reports}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            धर्मादाय आयुक्त (Charity Commissioner) नियमांनुसार पारदर्शक वार्षिक हिशोब व ताळेबंद.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setIsWeeklyModalOpen(true)}
            className="px-5 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-stone-950 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all border border-amber-400/40"
          >
            <FileText size={16} />
            साप्ताहिक वित्तीय PDF अहवाल (Weekly Report)
          </button>

          <button 
            onClick={() => setIsDailySummaryModalOpen(true)}
            className="px-5 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-orange-600/20 transition-all"
          >
            <Calendar size={16} />
            दैनिक संकलन व रात्री पडताळणी (Daily Logs)
          </button>

          <button 
            onClick={() => setIsAuditModalOpen(true)}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            <ShieldCheck size={16} />
            अधिकृत ऑडिट अहवाल (CA Report)
          </button>

          <button 
            onClick={handleExportAuditSheet}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all"
          >
            <FileSpreadsheet size={16} />
            {t.reports.downloadAudit}
          </button>
        </div>
      </div>

      {/* Weekly Financial PDF Report Modal */}
      {isWeeklyModalOpen && (
        <WeeklyFinancialReportModal
          pavatis={pavatis}
          expenses={expenses}
          mandal={mandal}
          lang={lang}
          onClose={() => setIsWeeklyModalOpen(false)}
        />
      )}

      {/* Audit Report Modal */}
      {isAuditModalOpen && (
        <AuditReportModal
          pavatis={pavatis}
          expenses={expenses}
          mandal={mandal}
          lang={lang}
          onClose={() => setIsAuditModalOpen(false)}
        />
      )}

      {/* Daily Summary & Nightly Verification Modal */}
      {isDailySummaryModalOpen && (
        <DailySummaryVerificationModal
          initialDate={selectedDailyDate}
          pavatis={pavatis}
          expenses={expenses}
          volunteers={volunteers}
          dayWiseCollections={dayWiseCollections}
          verifications={verifications}
          mandal={mandal}
          lang={lang}
          userRole={userRole}
          onSaveVerification={(ver) => {
            if (onSaveVerification) onSaveVerification(ver);
          }}
          onViewReceipt={onViewReceipt}
          onClose={() => setIsDailySummaryModalOpen(false)}
        />
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Daily Collection vs Expense Trend */}
        <div className="lg:col-span-8 bg-surface p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-black text-main-text flex items-center gap-2">
                <TrendingUp className="text-primary" size={18} />
                उत्सव दैनिक जमा व खर्च विश्लेषण (Daily Trend)
              </h4>
              <span className="text-xs text-gray-400">१० दिवसांचा प्रगती आलेख</span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> जमा
              </span>
              <span className="flex items-center gap-1 text-rose-600 font-bold">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> खर्च
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(val: any) => [`₹ ${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="income" stroke="#059669" fillOpacity={1} fill="url(#incomeGrad)" strokeWidth={2} name="जमा (Income)" />
                <Area type="monotone" dataKey="expense" stroke="#e11d48" fillOpacity={1} fill="url(#expenseGrad)" strokeWidth={2} name="खर्च (Expense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Pie Chart */}
        <div className="lg:col-span-4 bg-surface p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-base font-black text-main-text flex items-center gap-2">
              <PieChartIcon className="text-primary" size={18} />
              {t.reports.categoryBreakdown}
            </h4>
            <span className="text-xs text-gray-400">वर्गवारीनुसार देणगी वाटा</span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={incomeCategoryData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={50} 
                  outerRadius={80} 
                  paddingAngle={4} 
                  dataKey="value"
                >
                  {incomeCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => [`₹ ${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-[11px] pt-2 border-t border-gray-100 dark:border-zinc-800">
            {incomeCategoryData.map((item, idx) => (
              <div key={item.name} className="flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  {item.name}
                </span>
                <span className="font-bold text-main-text">₹ {item.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Top Donors Honor Roll */}
      <div className="bg-surface p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-black text-main-text flex items-center gap-2">
              <Award className="text-amber-500" size={20} />
              {t.reports.topDonors} (Honor Roll)
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              उत्सव २०२६ मधील प्रमुख देणगीदार व सौजन्यकर्ते.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {topDonors.map((donor, idx) => (
            <div 
              key={donor.id}
              className="p-4 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-2xl border border-amber-300/40 dark:border-amber-900/40 text-center space-y-2 relative"
            >
              <div className="w-7 h-7 mx-auto bg-amber-500 text-white rounded-full flex items-center justify-center font-black text-xs shadow-sm">
                #{idx + 1}
              </div>

              <h5 className="font-bold text-xs text-main-text leading-tight truncate">{donor.donorName}</h5>
              <div className="text-sm font-black text-amber-900 dark:text-amber-300">
                ₹ {donor.amount.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-gray-400 block font-mono">{donor.receiptNumber}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
