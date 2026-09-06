import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  TrendingUp, 
  IndianRupee, 
  Receipt, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  FileSpreadsheet, 
  Clock, 
  Award,
  Flame,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import * as XLSX from 'xlsx';
import { DayWiseCollection, DigitalPavati, ExpenseEntry, MandalProfile, MandalLanguage } from '../types';

interface TenDayDashboardViewProps {
  dayWiseData: DayWiseCollection[];
  pavatis: DigitalPavati[];
  expenses: ExpenseEntry[];
  mandal: MandalProfile;
  lang: MandalLanguage;
  onOpenDailySummaryModal?: (date: string) => void;
}

export const TenDayDashboardView: React.FC<TenDayDashboardViewProps> = ({
  dayWiseData,
  pavatis,
  expenses,
  mandal,
  lang,
  onOpenDailySummaryModal
}) => {
  // Aggregate Totals across 10 Days
  const summary = useMemo(() => {
    const totalTarget = dayWiseData.reduce((sum, d) => sum + d.targetAmount, 0);
    const totalCollected = dayWiseData.reduce((sum, d) => sum + d.collectedAmount, 0);
    const totalExpenses = dayWiseData.reduce((sum, d) => sum + d.expensesAmount, 0);
    const totalPavatis = dayWiseData.reduce((sum, d) => sum + d.pavatisCount, 0);
    const netSurplus = totalCollected - totalExpenses;
    const progressPercent = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

    return {
      totalTarget,
      totalCollected,
      totalExpenses,
      totalPavatis,
      netSurplus,
      progressPercent
    };
  }, [dayWiseData]);

  // Chart data
  const chartData = useMemo(() => {
    return dayWiseData.map(d => ({
      day: `दिवस ${d.dayNumber}`,
      target: d.targetAmount,
      collected: d.collectedAmount,
      expense: d.expensesAmount,
      surplus: d.collectedAmount - d.expensesAmount
    }));
  }, [dayWiseData]);

  // Export 10 Day Ledger to Excel
  const handleExport10DayExcel = () => {
    const rows = dayWiseData.map(d => ({
      'दिवस क्र.': `Day ${d.dayNumber}`,
      'तारीख': d.date,
      'उत्सव दिवस': d.festivalDayNameMr,
      'प्रमुख कार्यक्रम': d.majorEventMr,
      'नियोजित लक्ष्य (₹)': d.targetAmount,
      'एकूण संकलन (₹)': d.collectedAmount,
      'पावत्या संख्या': d.pavatisCount,
      'दैनिक खर्च (₹)': d.expensesAmount,
      'दैनिक शिल्लक/नफा (₹)': d.collectedAmount - d.expensesAmount,
      'लक्ष्य पूर्तता (%)': `${Math.round((d.collectedAmount / d.targetAmount) * 100)}%`
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '10_Day_Collection_2026');
    XLSX.writeFile(workbook, `Shivtej_Ganpati_10_Day_Collection_Report_2026.xlsx`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top 10-Day Festival Progress Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl space-y-6 relative overflow-hidden">
        
        {/* Background Watermark */}
        <div className="absolute right-6 -bottom-8 opacity-10 text-[180px] font-black pointer-events-none select-none">
          ॐ
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles size={13} />
              १० दिवसीय गणेशोत्सव २०२६ - थेट संकलन प्रगती
            </div>
            <h3 className="text-2xl md:text-3xl font-black tracking-tight">
              दैनिक वर्गणी व खर्च रिअल-टाईम डॅशबोर्ड
            </h3>
            <p className="text-xs text-amber-100 mt-1 max-w-xl">
              प्रतिष्ठापना (दिवस १) ते विसर्जन मिरवणूक (दिवस १०) प्रत्येक दिवसाचे जमा-खर्च व उद्दिष्ट विश्लेषण.
            </p>
          </div>

          <button
            onClick={handleExport10DayExcel}
            className="px-5 py-3 bg-white text-stone-950 hover:bg-amber-50 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg transition-all shrink-0"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            १० दिवसांचा अहवाल डाऊनलोड
          </button>
        </div>

        {/* 4 Metric Highlights Inside Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 relative z-10 text-stone-950">
          
          <div className="p-4 bg-white/90 dark:bg-zinc-900/90 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">१० दिवसांचे एकूण लक्ष्य</span>
            <span className="text-xl md:text-2xl font-black font-mono text-gray-900 dark:text-gray-100">
              ₹{summary.totalTarget.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-4 bg-white/90 dark:bg-zinc-900/90 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">एकूण जमा निधी ({summary.progressPercent}%)</span>
            <span className="text-xl md:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              ₹{summary.totalCollected.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-4 bg-white/90 dark:bg-zinc-900/90 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] uppercase font-bold text-rose-600 block">१० दिवसांचा एकूण खर्च</span>
            <span className="text-xl md:text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
              ₹{summary.totalExpenses.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-4 bg-white/90 dark:bg-zinc-900/90 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] uppercase font-bold text-blue-600 block">शिल्लक निधी (Net Surplus)</span>
            <span className="text-xl md:text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
              ₹{summary.netSurplus.toLocaleString('en-IN')}
            </span>
          </div>

        </div>

      </div>

      {/* Bar Chart: Target vs Collected vs Expense */}
      <div className="bg-surface p-6 md:p-8 rounded-[2.5rem] border border-gray-200/80 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-black text-main-text flex items-center gap-2">
              <TrendingUp className="text-amber-500" size={18} />
              १० दिवसांचा तुलनात्मक आलेख (Target vs Collected vs Expenses)
            </h4>
            <span className="text-xs text-gray-500">दररोजची देणगी व खर्च तुलना</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-bold text-amber-600">
              <span className="w-3 h-3 rounded bg-amber-400 inline-block" /> लक्ष्य
            </span>
            <span className="flex items-center gap-1 font-bold text-emerald-600">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> जमा
            </span>
            <span className="flex items-center gap-1 font-bold text-rose-600">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block" /> खर्च
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(val: any) => [`₹ ${Number(val).toLocaleString('en-IN')}`, '']}
                contentStyle={{ backgroundColor: '#18181b', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="target" fill="#fbbf24" radius={[4, 4, 0, 0]} name="लक्ष्य (Target)" />
              <Bar dataKey="collected" fill="#10b981" radius={[4, 4, 0, 0]} name="जमा (Collected)" />
              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="खर्च (Expense)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 10 Days Detailed Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dayWiseData.map((day) => {
          const progress = Math.round((day.collectedAmount / day.targetAmount) * 100);
          const daySurplus = day.collectedAmount - day.expensesAmount;

          return (
            <motion.div
              key={day.dayNumber}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-3xl p-5 border border-gray-200/80 dark:border-zinc-800 shadow-sm space-y-3.5 relative hover:border-amber-400/60 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-amber-500 text-stone-950 font-black rounded-full text-[10px] uppercase">
                      दिवस {day.dayNumber}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-500">
                      {day.date}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-main-text leading-tight">
                    {day.festivalDayNameMr}
                  </h4>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    progress >= 100 
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  }`}>
                    {progress}% पूर्ण
                  </span>
                </div>
              </div>

              {/* Major Event Banner */}
              <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-zinc-800/60 border border-amber-200/60 dark:border-zinc-700 text-xs flex items-center gap-2">
                <Flame size={14} className="text-amber-500 shrink-0" />
                <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                  {day.majorEventMr}
                </span>
              </div>

              {/* Target Progress Bar */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1">
                  <span>संकलन: ₹{day.collectedAmount.toLocaleString('en-IN')}</span>
                  <span>लक्ष्य: ₹{day.targetAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              {/* 3 Metric Sub-tiles */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                
                <div className="p-2 bg-gray-50 dark:bg-zinc-800/40 rounded-xl border border-gray-100 dark:border-zinc-800">
                  <span className="text-[9px] text-gray-400 uppercase font-bold block">पावत्या</span>
                  <span className="font-black text-main-text font-mono text-xs">{day.pavatisCount}</span>
                </div>

                <div className="p-2 bg-gray-50 dark:bg-zinc-800/40 rounded-xl border border-gray-100 dark:border-zinc-800">
                  <span className="text-[9px] text-rose-500 uppercase font-bold block">दैनिक खर्च</span>
                  <span className="font-black text-rose-600 dark:text-rose-400 font-mono text-xs">₹{day.expensesAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-2 bg-gray-50 dark:bg-zinc-800/40 rounded-xl border border-gray-100 dark:border-zinc-800">
                  <span className="text-[9px] text-blue-500 uppercase font-bold block">शिल्लक</span>
                  <span className="font-black text-blue-600 dark:text-blue-400 font-mono text-xs">₹{daySurplus.toLocaleString('en-IN')}</span>
                </div>

              </div>

              {/* Nightly Audit Slip & Verification CTA */}
              {onOpenDailySummaryModal && (
                <button
                  onClick={() => onOpenDailySummaryModal(day.date)}
                  className="w-full py-2 bg-amber-500/10 hover:bg-amber-500 hover:text-stone-950 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-amber-300/40 dark:border-amber-700/40"
                >
                  <Receipt size={13} />
                  <span>दैनिक संकलन व रात्री पडताळणी स्लिप</span>
                </button>
              )}

            </motion.div>
          );
        })}
      </div>

    </div>
  );
};
