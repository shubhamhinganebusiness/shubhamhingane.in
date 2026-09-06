import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  CalendarCheck, 
  IndianRupee, 
  FileCheck, 
  TrendingUp, 
  Award, 
  ArrowRight,
  ClipboardList,
  AlertCircle,
  UserPlus,
  Download,
  Printer,
  Eye,
  Phone,
  Calendar,
  User,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  X,
  CreditCard
} from 'lucide-react';
import { Student, ExamFeeRecord, AttendanceRecord, CertificateLog } from './types';

interface DashboardViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  fees: ExamFeeRecord[];
  certificates: CertificateLog[];
  todayStr: string;
  onNavigate: (module: 'attendance' | 'fees' | 'certificates') => void;
  onOpenAddStudentModal: () => void;
  onUpdateStudentPhoto: (studentId: string, photoBase64: string) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  attendance,
  fees,
  certificates,
  todayStr,
  onNavigate,
  onOpenAddStudentModal,
  onUpdateStudentPhoto,
  addToast
}) => {
  // --- STATE FOR PROFILE & PRINT REPORTS ---
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [selectedClassForReport, setSelectedClassForReport] = useState<string | null>(null);

  // 1. Total Students
  const totalStudents = students.length;

  // 2. Today's Attendance %
  const todaysRecords = attendance.filter(r => r.date === todayStr);
  const presentCount = todaysRecords.filter(r => r.status === 'Present').length;
  const attendanceRate = todaysRecords.length > 0 
    ? Math.round((presentCount / todaysRecords.length) * 100) 
    : 0; 

  // 3. Exam Fee collection statistics
  const totalDueAmount = fees.reduce((sum, f) => sum + f.amountDue, 0);
  const totalCollectedAmount = fees.reduce((sum, f) => sum + f.amountPaid, 0);
  const collectionRate = totalDueAmount > 0 
    ? Math.round((totalCollectedAmount / totalDueAmount) * 100) 
    : 0;

  // Class wise strength
  const classCounts = students.reduce((acc: Record<string, number>, s) => {
    acc[s.className] = (acc[s.className] || 0) + 1;
    return acc;
  }, {});

  const classesList = Object.keys(classCounts).sort((a, b) => {
    const aNum = parseInt(a.replace(/\D/g, '')) || 0;
    const bNum = parseInt(b.replace(/\D/g, '')) || 0;
    return aNum - bNum;
  });

  const [viewMode, setViewMode] = useState<'class' | 'all'>('class');
  const [dirClass, setDirClass] = useState<string>(() => {
    return classesList[0] || 'Class 10-A';
  });
  const [dirSearch, setDirSearch] = useState<string>('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [dirLayout, setDirLayout] = useState<'grid' | 'table'>('grid');

  const filteredDirStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(dirSearch.toLowerCase());
    if (viewMode === 'all') {
      return matchesSearch;
    }
    return s.className === dirClass && matchesSearch;
  });

  // --- CSV ROSTER EXPORTER ---
  const handleExportCSV = () => {
    try {
      const headers = [
        'Roll Number',
        'Scholar Name',
        'Class Division',
        "Father's Name",
        "Mother's Name",
        'Date of Birth',
        'Contact Number',
        'Presents Recorded',
        'Absents Recorded',
        'Attendance rate',
        'Fee Code',
        'Fee Dues Scheduled (INR)',
        'Fee Collected (INR)',
        'Outstanding Deficit (INR)',
        'Payment Clearance Status'
      ];

      const rows = students.map(stud => {
        // Attendance logs
        const studAtt = attendance.filter(a => a.studentId === stud.id);
        const presentCount = studAtt.filter(a => a.status === 'Present').length;
        const absentCount = studAtt.filter(a => a.status === 'Absent').length;
        const totalDays = studAtt.length;
        const attRateStr = totalDays > 0 ? `${Math.round((presentCount / totalDays) * 100)}%` : 'N/A';

        // Fee stats
        const studFee = fees.find(f => f.studentId === stud.id);
        const amountDue = studFee ? studFee.amountDue : 0;
        const amountPaid = studFee ? studFee.amountPaid : 0;
        const deficit = amountDue - amountPaid;
        const status = studFee ? studFee.status : 'Pending';
        const feeCode = studFee ? studFee.id : 'N/A';

        return [
          stud.rollNumber,
          stud.name,
          stud.className,
          stud.fatherName,
          stud.motherName,
          stud.dob,
          stud.contact,
          presentCount,
          absentCount,
          attRateStr,
          feeCode,
          amountDue,
          amountPaid,
          deficit,
          status
        ];
      });

      const csvContent = [
        headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
        ...rows.map(r => r.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Vidyalaya_Student_Roster_Backup_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast('Student roster backup compiled and downloaded successfully as CSV.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Database compilation crashed. Please try refreshing portal.', 'error');
    }
  };

  // --- DYNAMIC COMPUTATIONS FOR CLASS PORTRAIT REPORT ---
  const printReportStudents = selectedClassForReport ? students.filter(s => s.className === selectedClassForReport) : [];
  const printReportFees = selectedClassForReport ? fees.filter(f => f.className === selectedClassForReport) : [];
  const totalReportDues = printReportFees.reduce((sum, f) => sum + f.amountDue, 0);
  const totalReportCollected = printReportFees.reduce((sum, f) => sum + f.amountPaid, 0);
  const totalReportDeficit = totalReportDues - totalReportCollected;
  const reportCollectionRate = totalReportDues > 0 ? Math.round((totalReportCollected / totalReportDues) * 100) : 0;

  // Class Attendance average
  const printReportStudentIds = new Set(printReportStudents.map(s => s.id));
  const printReportAttendance = attendance.filter(a => printReportStudentIds.has(a.studentId));
  const classPresentCount = printReportAttendance.filter(a => a.status === 'Present').length;
  const classTotalDaysCount = printReportAttendance.length;
  const classAvgAttendanceRate = classTotalDaysCount > 0 ? Math.round((classPresentCount / classTotalDaysCount) * 100) : 0;

  return (
    <div className="space-y-8 no-print">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12" />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[2px] text-indigo-300 mb-1">Welcome to Central ERP Dashboard</p>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Vidyalaya School ERP Platform</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Streamlined system for student attendance tracking, complete exam fee ledgers, and automated dynamic certificate templates.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur border border-white/20 px-5 py-3 rounded-xl z-10 shrink-0">
          <p className="text-[9px] font-black uppercase text-indigo-200 tracking-wider">System Date</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-bold text-white">{new Date(todayStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Global Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1: Students */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/50 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Users size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Enrolled</p>
            <h3 className="text-2xl font-black text-gray-900">{totalStudents} Students</h3>
            <p className="text-[10px] text-gray-500 font-medium">Across {Object.keys(classCounts).length} Classes</p>
          </div>
        </div>

        {/* Card 2: Today's Attendance */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/50 flex items-center gap-4 hover:shadow-md transition-all">
          <span className={`w-14 h-14 ${todaysRecords.length > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} rounded-xl flex items-center justify-center shrink-0`}>
            <CalendarCheck size={28} />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Today's Attendance</p>
            <h3 className="text-2xl font-black text-gray-900">
              {todaysRecords.length > 0 ? `${attendanceRate}%` : 'Not Marked'}
            </h3>
            <p className="text-[10px] text-gray-500 font-medium">
              {todaysRecords.length > 0 ? `${presentCount}/${todaysRecords.length} Present Today` : 'Action Pending'}
            </p>
          </div>
        </div>

        {/* Card 3: Fee Collection */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/50 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center shrink-0">
            <IndianRupee size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Fee Collected</p>
            <h3 className="text-2xl font-black text-gray-900">₹{totalCollectedAmount.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-violet-600 font-black">{collectionRate}% of ₹{totalDueAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Card 4: Certificates Issued */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/50 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Award size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Certificates Generated</p>
            <h3 className="text-2xl font-black text-gray-900">{certificates.length} Issued</h3>
            <p className="text-[10px] text-gray-500 font-medium">Official Watermarked Logs</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Info Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Quick Operations Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <ClipboardList className="text-primary" size={20} />
              Quick Administrative Access
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <button 
                onClick={() => onNavigate('attendance')}
                className="p-5 text-left rounded-xl border border-gray-100 bg-slate-50 hover:bg-indigo-600 hover:text-white transition-all group relative overflow-hidden cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-white/50 text-indigo-600 group-hover:bg-white group-hover:text-indigo-600 flex items-center justify-center mb-4 transition-all">
                  <CalendarCheck size={20} />
                </div>
                <h4 className="font-bold text-sm mb-1 group-hover:text-white">Daily Attendance</h4>
                <p className="text-[10px] text-gray-400 group-hover:text-white/80">Mark presentees, filter classes, and download historical P/A data.</p>
                <ArrowRight size={14} className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                onClick={() => onNavigate('fees')}
                className="p-5 text-left rounded-xl border border-gray-100 bg-slate-50 hover:bg-indigo-600 hover:text-white transition-all group relative overflow-hidden cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-white/50 text-indigo-600 group-hover:bg-white group-hover:text-indigo-600 flex items-center justify-center mb-4 transition-all">
                  <IndianRupee size={20} />
                </div>
                <h4 className="font-bold text-sm mb-1 group-hover:text-white">Exam Fees System</h4>
                <p className="text-[10px] text-gray-400 group-hover:text-white/80">Check payment status, trigger overdue alerts, and print itemized fee receipts.</p>
                <ArrowRight size={14} className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                onClick={() => onNavigate('certificates')}
                className="p-5 text-left rounded-xl border border-gray-100 bg-slate-50 hover:bg-indigo-600 hover:text-white transition-all group relative overflow-hidden cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-white/50 text-indigo-600 group-hover:bg-white group-hover:text-indigo-600 flex items-center justify-center mb-4 transition-all">
                  <FileCheck size={20} />
                </div>
                <h4 className="font-bold text-sm mb-1 group-hover:text-white">Certificate Suite</h4>
                <p className="text-[10px] text-gray-400 group-hover:text-white/80">Automated templates for Bonafide, Academics, Character, & Sports.</p>
                <ArrowRight size={14} className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                onClick={onOpenAddStudentModal}
                className="p-5 text-left rounded-xl border border-dashed border-indigo-200 bg-indigo-50/20 hover:bg-emerald-600 hover:text-white transition-all group relative overflow-hidden cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-white/80 text-emerald-600 group-hover:bg-white group-hover:text-emerald-600 flex items-center justify-center mb-4 transition-all shadow-sm">
                  <UserPlus size={20} />
                </div>
                <h4 className="font-bold text-sm mb-1 group-hover:text-white">Register Student</h4>
                <p className="text-[10px] text-gray-500 group-hover:text-white/80">Dynamic form setup for detailed profiles and direct fee initialization.</p>
                <ArrowRight size={14} className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>

          {/* Quick Stats table / class wise metric */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-fadeIn">
            <h3 className="text-lg font-black text-gray-900 mb-4">Class-wise Strength, Finance & A4 Print Audits</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[9px] font-black uppercase text-gray-400">
                    <th className="py-3 px-4">Class Division</th>
                    <th className="py-3 px-4">Students Enrolled</th>
                    <th className="py-3 px-4">Standard Fee</th>
                    <th className="py-3 px-4">Fees Pending Alert</th>
                    <th className="py-3 px-4 text-center">Class Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(classCounts).map(([className, count]) => {
                    const classFee = className.includes('10') ? 1500 : className.includes('11') ? 1800 : className.includes('12') ? 2200 : 1000;
                    const overdueForClass = fees.filter(f => f.className === className && f.status !== 'Paid').length;
                    return (
                      <tr 
                        key={className} 
                        onClick={() => {
                          setViewMode('class');
                          setDirClass(className);
                          const target = document.getElementById('student-directory-section');
                          if (target) {
                            target.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="hover:bg-indigo-50/40 cursor-pointer transition-colors text-sm group"
                        title={`Click to view scholars in ${className}`}
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-800 group-hover:text-indigo-700 transition-all flex items-center gap-1.5">
                          <span>{className}</span>
                          <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            View Scholars
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-600">{count} Active Students</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">₹{classFee}</td>
                        <td className="py-3.5 px-4">
                          {overdueForClass > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100">
                              <AlertCircle size={12} />
                              {overdueForClass} Pending / Partial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">
                              All Clear
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClassForReport(className);
                            }}
                            className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white px-2.5 py-1.5 rounded-lg border border-indigo-100 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                          >
                            <Printer size={12} />
                            <span>Export A4 Report</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
 
          {/* Student Profile & Photograph Directory */}
          <div id="student-directory-section" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">Student Profiles & Photo Directory</h3>
                  <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-mono font-black rounded-lg">
                    {viewMode === 'class' ? `${filteredDirStudents.length} in ${dirClass}` : `${filteredDirStudents.length} of ${students.length} Total`}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 animate-pulse">
                  💡 Tip: Click on student names, details or roll numbers to open full academic & fee dossiers!
                </p>
              </div>
              
              {/* Directory Filter & Tab Controls */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                {/* BACKUP EXPORT TRIGGER BUTTON */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10 cursor-pointer h-[32px] font-sans"
                  title="Export school rosters as CSV backup"
                >
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>

                {/* Segemented view switches */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('class');
                      setDirSearch('');
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'class' 
                        ? 'bg-white text-indigo-950 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Classwise
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('all');
                      setDirSearch('');
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'all' 
                        ? 'bg-white text-indigo-950 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All Students
                  </button>
                </div>

                {/* Segmented layout controls */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDirLayout('grid')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      dirLayout === 'grid' 
                        ? 'bg-white text-indigo-950 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirLayout('table')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      dirLayout === 'table' 
                        ? 'bg-white text-indigo-950 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    List (Table)
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-1 sm:flex-initial">
                  {viewMode === 'class' && (
                    <select
                      value={dirClass}
                      onChange={(e) => setDirClass(e.target.value)}
                      className="bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all flex-1 sm:flex-initial cursor-pointer"
                    >
                      {Object.keys(classCounts)
                        .sort((a, b) => {
                          const aNum = parseInt(a.replace(/\D/g, '')) || 0;
                          const bNum = parseInt(b.replace(/\D/g, '')) || 0;
                          return aNum - bNum;
                        })
                        .map(c => (
                          <option key={c} value={c}>
                            {c} ({classCounts[c]})
                          </option>
                        ))}
                    </select>
                  )}
                  <input
                    type="text"
                    placeholder="Search name..."
                    value={dirSearch}
                    onChange={(e) => setDirSearch(e.target.value)}
                    className="bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl text-xs font-medium outline-none w-full sm:w-40 focus:ring-1 focus:ring-indigo-200"
                  />
                </div>
              </div>
            </div>

            {/* List and Grid conditional layout */}
            {dirLayout === 'table' ? (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="px-4 py-3 font-black">Roll No</th>
                      <th className="px-4 py-3 font-black">Student Details</th>
                      <th className="px-4 py-3 font-black">Class/Section</th>
                      <th className="px-4 py-3 font-black">Parents</th>
                      <th className="px-4 py-3 font-black">Contact</th>
                      <th className="px-4 py-3 font-black text-right">Photo Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDirStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-400 font-bold uppercase text-[10px]">
                          No scholars match search terms
                        </td>
                      </tr>
                    ) : (
                      filteredDirStudents.map((stud) => {
                        const initials = stud.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        return (
                          <tr key={stud.id} className="hover:bg-slate-50/70 transition-colors group/tr">
                            <td 
                              onClick={() => setSelectedStudentForProfile(stud)}
                              className="px-4 py-3.5 font-mono font-black text-slate-500 cursor-pointer group-hover/tr:text-indigo-600"
                            >
                              {stud.rollNumber}
                            </td>
                            <td 
                              onClick={() => setSelectedStudentForProfile(stud)}
                              className="px-4 py-3.5 cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0 shadow-inner">
                                  {stud.photo ? (
                                    <img src={stud.photo} alt={stud.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[10px] text-indigo-700 font-extrabold">{initials}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-extrabold text-slate-900 group-hover/tr:text-indigo-600 transition-colors text-xs">{stud.name}</div>
                                  <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">DOB: {stud.dob}</div>
                                </div>
                              </div>
                            </td>
                            <td 
                              onClick={() => setSelectedStudentForProfile(stud)}
                              className="px-4 py-3.5 cursor-pointer"
                            >
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-700 text-[9px] font-mono font-black rounded">
                                {stud.className}
                              </span>
                            </td>
                            <td 
                              onClick={() => setSelectedStudentForProfile(stud)}
                              className="px-4 py-3.5 text-slate-600 font-medium cursor-pointer"
                            >
                              <div><span className="text-[9px] font-black uppercase text-slate-400 block pb-0.5">Father:</span> {stud.fatherName}</div>
                              {stud.motherName && <div className="mt-1"><span className="text-[9px] font-black uppercase text-slate-400 block pb-0.5">Mother:</span> {stud.motherName}</div>}
                            </td>
                            <td 
                              onClick={() => setSelectedStudentForProfile(stud)}
                              className="px-4 py-3.5 font-mono text-slate-700 font-semibold cursor-pointer"
                            >
                              {stud.contact}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  const inputEl = document.getElementById(`table-photo-file-${stud.id}`) as HTMLInputElement;
                                  inputEl?.click();
                                }}
                                className="px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-505 hover:bg-slate-50 text-[10px] font-bold text-slate-700 hover:text-indigo-700 rounded-md transition-all shadow-sm cursor-pointer"
                              >
                                {stud.photo ? 'Update' : 'Upload'}
                              </button>
                              <input
                                id={`table-photo-file-${stud.id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      if (ev.target?.result) {
                                        onUpdateStudentPhoto(stud.id, ev.target.result as string);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredDirStudents.length === 0 ? (
                  <div className="col-span-full text-center py-6 text-gray-400 text-xs font-bold uppercase">
                    No scholars match search terms
                  </div>
                ) : (
                  filteredDirStudents.map((stud) => {
                    const initials = stud.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    return (
                      <div 
                        key={stud.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setHoveredCard(stud.id);
                        }}
                        onDragLeave={() => setHoveredCard(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setHoveredCard(null);
                          const file = e.dataTransfer.files?.[0];
                          if (file && file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                onUpdateStudentPhoto(stud.id, event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className={`p-4 rounded-xl border flex gap-4 items-center transition-all relative overflow-hidden group/card ${
                          hoveredCard === stud.id 
                            ? 'border-indigo-500 bg-indigo-50/30'
                            : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'
                        }`}
                      >
                        {/* Interactive Profile Photo Uploader */}
                        <div className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center cursor-pointer shadow-inner">
                          {stud.photo ? (
                            <img 
                              src={stud.photo} 
                              alt={stud.name} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500/10 to-violet-500/20 text-indigo-700 font-extrabold text-sm flex items-center justify-center">
                              {initials}
                            </div>
                          )}
                          
                          {/* Hover change overlay */}
                          <div 
                            onClick={() => {
                              const inputEl = document.getElementById(`photo-file-${stud.id}`) as HTMLInputElement;
                              inputEl?.click();
                            }}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center animate-fadeIn"
                          >
                            <span className="text-[8px] font-black text-white uppercase tracking-wider text-center leading-none px-1">Upload<br/>Photo</span>
                          </div>
                          
                          {/* Hidden Input */}
                          <input
                            id={`photo-file-${stud.id}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  if (ev.target?.result) {
                                    onUpdateStudentPhoto(stud.id, ev.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>

                        {/* Info click target for full profile card */}
                        <div 
                          className="flex-1 min-w-0 cursor-pointer text-left"
                          onClick={() => setSelectedStudentForProfile(stud)}
                          title="Click to open profile dossier"
                        >
                          <div className="flex items-center gap-1.5 mb-1 bg-slate-50/20 group-hover/card:bg-slate-50 transition-all rounded">
                            <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-[8px] font-black uppercase rounded shrink-0">
                              {stud.className}
                            </span>
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 font-mono text-[8px] font-black uppercase rounded shrink-0">
                              Roll {stud.rollNumber}
                            </span>
                            <span className="inline-flex items-center gap-0.5 ml-auto text-[8px] text-indigo-600 font-bold opacity-0 group-hover/card:opacity-100 transition-opacity uppercase font-sans">
                              <Eye size={10} /> Profile
                            </span>
                          </div>
                          <h4 className="font-extrabold text-xs text-slate-900 truncate leading-tight group-hover/card:text-indigo-600 transition-colors">{stud.name}</h4>
                          <p className="text-[10px] text-gray-500 font-semibold mt-1">Father: {stud.fatherName}</p>
                          
                          {/* Beautiful Contact number display */}
                          <div className="mt-1.5 flex items-center gap-1 bg-indigo-50/45 border border-indigo-100 rounded-lg px-2 py-0.5 inline-block">
                            <span className="text-[8px] font-black uppercase text-indigo-500">Call: </span>
                            <span className="text-[9px] font-mono font-bold text-indigo-950 truncate">{stud.contact}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right 1/3: Recent Certificates Logs */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-gray-900">Certificate log</h3>
            <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{certificates.length} Total</span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar max-h-[380px]">
            {certificates.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileCheck className="mx-auto mb-2 opacity-30" size={32} />
                <p className="text-xs font-bold uppercase tracking-wider">No certificates generated</p>
                <p className="text-[10px] text-gray-500 mt-1">Logs will appear as soon as certificates are generated and verified.</p>
              </div>
            ) : (
              certificates.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{log.studentName}</h4>
                      <p className="text-[10px] text-gray-500">{log.certificateType} Certificate</p>
                    </div>
                    <span className="text-[9px] font-mono font-black bg-white select-all border border-gray-200 text-slate-700 px-2 py-0.5 rounded-md shrink-0">
                      {log.certificateNo}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-400">
                    <span>Issued: {new Date(log.dateOfIssue).toLocaleDateString('en-IN')}</span>
                    <span className="text-primary font-bold">Logged</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL VIEW: STUDENT PROFILE DOSSIER (Request 2) --- */}
      <AnimatePresence>
        {selectedStudentForProfile && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudentForProfile(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl relative border border-slate-100 overflow-hidden z-20 flex flex-col max-h-[92vh]"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50/25 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-950 uppercase tracking-widest">Student Dossier Card</h3>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Vidyalaya Integrated Profile Suite</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStudentForProfile(null)} 
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Contents */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 no-scrollbar text-xs">
                {/* 1. Core Profile Details Column */}
                <div className="flex flex-col md:flex-row gap-6 items-start pb-6 border-b border-slate-100">
                  {/* Large Photo Avatar */}
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shadow-md shrink-0 self-center md:self-start relative group">
                    {selectedStudentForProfile.photo ? (
                      <img 
                        src={selectedStudentForProfile.photo} 
                        alt={selectedStudentForProfile.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-indigo-500/10 to-indigo-500/30 text-indigo-700 font-extrabold text-2xl flex items-center justify-center">
                        {selectedStudentForProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    )}
                    <div 
                      onClick={() => {
                        const cellUpInput = document.getElementById(`profile-dossier-photo-up-${selectedStudentForProfile.id}`) as HTMLInputElement;
                        cellUpInput?.click();
                      }}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      <span className="text-[8px] font-black text-white uppercase tracking-wider">Change photo</span>
                    </div>
                    <input
                      id={`profile-dossier-photo-up-${selectedStudentForProfile.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              onUpdateStudentPhoto(selectedStudentForProfile.id, ev.target.result as string);
                              setSelectedStudentForProfile(prev => prev ? { ...prev, photo: ev.target?.result as string } : null);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>

                  {/* Fields Breakdown Card */}
                  <div className="flex-1 space-y-4 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xl font-black text-slate-950 tracking-tight">{selectedStudentForProfile.name}</h4>
                      <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-[9px] font-black rounded-lg">
                        {selectedStudentForProfile.className}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 font-mono text-[9px] font-black rounded-lg">
                        Roll: {selectedStudentForProfile.rollNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 block pb-0.5">Father's Name</p>
                        <p className="font-bold text-slate-800">{selectedStudentForProfile.fatherName}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 block pb-0.5">Mother's Name</p>
                        <p className="font-bold text-slate-800">{selectedStudentForProfile.motherName || 'Not Registered'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 block pb-0.5">Date of Birth</p>
                        <p className="font-bold font-mono text-slate-800">{selectedStudentForProfile.dob}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 block pb-0.5">Contact Line</p>
                        <p className="font-bold font-mono text-indigo-950">{selectedStudentForProfile.contact}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Analytical Sub-Panels: Attendance Summaries & Fee Ledger */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Attendance Stats Block */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <h4 className="font-black text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <CalendarCheck className="text-emerald-600 font-black" size={14} />
                      Attendance Ledger
                    </h4>

                    {(() => {
                      const studAtt = attendance.filter(a => a.studentId === selectedStudentForProfile.id);
                      const presentDays = studAtt.filter(a => a.status === 'Present').length;
                      const absentDays = studAtt.filter(a => a.status === 'Absent').length;
                      const totalMarked = studAtt.length;
                      const rate = totalMarked > 0 ? Math.round((presentDays / totalMarked) * 100) : 100;

                      return (
                        <div className="space-y-4">
                          {/* Circle rate slider */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-black text-slate-900">{rate}%</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Compound Attendance</p>
                            </div>
                            <div className="text-right text-[10px] font-semibold text-slate-500">
                              <p className="font-bold text-emerald-700"><span className="font-mono">{presentDays}</span> Present</p>
                              <p className="font-bold text-rose-600"><span className="font-mono">{absentDays}</span> Absent</p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${rate >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>

                          {/* Timeline Grid (Last 5 Days) */}
                          <div className="space-y-2 pt-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Historical Logs Tracker</p>
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                              {studAtt.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic">No historical attendance records logged.</p>
                              ) : (
                                studAtt.slice(0).reverse().map((record, index) => (
                                  <div key={index} className="flex justify-between items-center bg-white border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm">
                                    <span className="font-mono text-slate-500 text-[10px] font-bold">{new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    {record.status === 'Present' ? (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                        <CheckCircle2 size={10} /> Present
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                        <XCircle size={10} /> Absent
                                      </span>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Exam Fees Stats Block */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <h4 className="font-black text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <IndianRupee className="text-violet-600 font-black" size={14} />
                      Exam Fees Ledger
                    </h4>

                    {(() => {
                      const studFee = fees.find(f => f.studentId === selectedStudentForProfile.id);
                      if (!studFee) {
                        return <p className="text-[10px] text-slate-400 italic">No fee schedule generated for student.</p>;
                      }

                      const outstandingBalance = studFee.amountDue - studFee.amountPaid;

                      return (
                        <div className="space-y-3">
                          {/* Summary stats */}
                          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-150 shadow-sm">
                            <div>
                              <p className="font-black text-slate-500 text-[9px] uppercase">Payment Status</p>
                              <span className={`inline-block px-2.5 py-0.5 mt-1 text-[10px] font-black uppercase rounded-lg border ${
                                studFee.status === 'Paid' 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-150' 
                                  : studFee.status === 'Pending' 
                                  ? 'bg-rose-50 text-rose-800 border-rose-150' 
                                  : 'bg-amber-50 text-amber-800 border-amber-150'
                              }`}>
                                {studFee.status}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-slate-500 text-[9px] uppercase">Outstanding Balance</p>
                              <p className="text-lg font-black text-slate-900 mt-0.5">₹{outstandingBalance.toLocaleString('en-IN')}</p>
                            </div>
                          </div>

                          {/* Dues Audit table */}
                          <div className="space-y-1.5 text-[10px] font-semibold text-slate-600 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                              <span>Standard Scheduled Dues:</span>
                              <span className="font-bold text-slate-900">₹{studFee.amountDue.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between border-b border-dashed border-slate-100 py-1.5">
                              <span>Total Paid:</span>
                              <span className="font-bold text-emerald-700">₹{studFee.amountPaid.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between pt-1.5">
                              <span>Dues Deadline:</span>
                              <span className="font-mono text-slate-900">{studFee.dueDate}</span>
                            </div>
                          </div>

                          {/* Receipt citation if present */}
                          {(studFee.receiptNumber || studFee.paymentDate) && (
                            <div className="bg-indigo-50/30 p-2.5 border border-dashed border-indigo-150 rounded-lg text-[9px] text-slate-500 font-semibold space-y-0.5 font-mono">
                              {studFee.receiptNumber && <div>Receipt No: <span className="font-bold text-slate-800">{studFee.receiptNumber}</span></div>}
                              {studFee.paymentDate && <div>Payment Clearance: <span className="font-bold text-slate-800">{studFee.paymentDate}</span></div>}
                            </div>
                          )}

                          {/* Fast track jump to fee desk button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentForProfile(null);
                              onNavigate('fees');
                            }}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase tracking-wider text-[10px] rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 cursor-pointer text-center flex items-center justify-center gap-1.5"
                          >
                            <CreditCard size={12} />
                            <span>Dispatch to Exam Fees Desk</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForProfile(null)}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:bg-slate-850 shadow-md cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL VIEW: CLASS-WISE A4 PRINT REPORT (Request 3) --- */}
      <AnimatePresence>
        {selectedClassForReport && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClassForReport(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm no-print"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl relative border border-slate-100 overflow-hidden z-20 flex flex-col max-h-[94vh] no-print"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-150 flex justify-between items-center bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Printer size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-950 uppercase tracking-widest">A4 Audit Report Builder</h3>
                    <p className="text-[9px] text-slate-500 font-extrabold uppercase">A4 Printable Ledger Compiler Suite</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* PRINT REQUISITE ACTION BUTTON */}
                  <button
                    type="button"
                    onClick={() => {
                      setTimeout(() => {
                        window.print();
                      }, 200);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-600/15 cursor-pointer"
                  >
                    <Printer size={14} />
                    <span>Print Report (A4)</span>
                  </button>
                  
                  <button 
                    onClick={() => setSelectedClassForReport(null)} 
                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-950 transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Scrollable live screen preview pane */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-100/40 no-scrollbar text-xs">
                
                {/* Visual A4 Aspect Ratio container */}
                <div 
                  id="print-report-sheet"
                  className="bg-white w-full mx-auto p-12 shadow-md border border-slate-200 rounded-lg max-w-[210mm] min-h-[297mm] text-slate-900 flex flex-col justify-between"
                >
                  
                  {/* self-contained dynamic stylesheet injection for printing cleanly */}
                  <style dangerouslySetInnerHTML={{__html: `
                    @media print {
                      body * {
                        visibility: hidden !important;
                      }
                      /* Display ONLY this sheet container during print jobs */
                      #print-report-sheet, #print-report-sheet * {
                        visibility: visible !important;
                      }
                      #print-report-sheet {
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 15mm !important;
                        box-sizing: border-box !important;
                        border: none !important;
                        box-shadow: none !important;
                        background: white !important;
                        color: black !important;
                      }
                    }
                  `}} />

                  <div>
                    {/* Official Banner Header */}
                    <div className="border-b-4 border-slate-900 pb-5 mb-6 text-center">
                      <h1 className="text-xl font-black tracking-widest text-slate-950 font-sans uppercase">VIDYALAYA DISTRICT INTEGRATED SCHOOL PORTAL</h1>
                      <p className="text-[10px] uppercase font-black tracking-[4px] text-indigo-700 mt-1">OFFICIAL CLASS ACADEMIC & FINANCIAL AUDIT LEDGER</p>
                      <div className="flex justify-between items-center mt-4 text-[9px] font-mono font-bold text-slate-500 border-t border-slate-100 pt-3">
                        <span>REGION CODE: DISTRICT-901</span>
                        <span>SYSTEM STAGE: ACTIVE LEDGER</span>
                        <span>COMPILATION DATE: {new Date(todayStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6">
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black uppercase text-slate-400">Class Parameters</p>
                        <table className="w-full text-[10px] font-bold text-slate-700 leading-normal">
                          <tbody>
                            <tr>
                              <td className="text-slate-500 font-semibold pr-2">Audited Class Div:</td>
                              <td className="text-slate-950 text-xs font-black">{selectedClassForReport}</td>
                            </tr>
                            <tr>
                              <td className="text-slate-500 font-semibold pr-2">Classroom Roster Count:</td>
                              <td className="text-slate-900 font-extrabold">{printReportStudents.length} Scholars Enrolled</td>
                            </tr>
                            <tr>
                              <td className="text-slate-500 font-semibold pr-2">Class Attendance Rate:</td>
                              <td className="text-slate-900 font-extrabold">{classAvgAttendanceRate}% Average</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="space-y-1.5 border-l border-slate-200 pl-4">
                        <p className="text-[9px] font-black uppercase text-slate-400">Classroom Financial Snapshot</p>
                        <table className="w-full text-[10px] font-bold text-slate-700 leading-normal">
                          <tbody>
                            <tr>
                              <td className="text-slate-500 font-semibold pr-2">Total Dues Levied:</td>
                              <td className="text-slate-950 font-black">₹{totalReportDues.toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                              <td className="text-slate-500 font-semibold pr-2">Total Monies Cleared:</td>
                              <td className="text-emerald-800 font-extrabold">₹{totalReportCollected.toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                              <td className="text-slate-500 font-semibold pr-2">Deficit Outstanding:</td>
                              <td className="text-rose-700 font-extrabold">₹{totalReportDeficit.toLocaleString('en-IN')} ({100 - reportCollectionRate}% deficient)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Main audit ledger table */}
                    <div className="space-y-2 mb-6">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-950 border-b border-slate-200 pb-1.5">Scholastic ledger & Deficit schedule</h4>
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="border-b-2 border-slate-900 text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">
                            <th className="py-2.5 px-2">Roll No</th>
                            <th className="py-2.5 px-2">Scholar Name</th>
                            <th className="py-2.5 px-2 text-center">Attendance % (Out of 5)</th>
                            <th className="py-2.5 px-2">Fee Status</th>
                            <th className="py-2.5 px-2 text-right">Standard Dues</th>
                            <th className="py-2.5 px-2 text-right">Cleared to Date</th>
                            <th className="py-2.5 px-2 text-right">O/S Deficit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-medium">
                          {printReportStudents.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-6 text-slate-400 italic font-bold">
                                No registered student records found in {selectedClassForReport}.
                              </td>
                            </tr>
                          ) : (
                            printReportStudents.map((stud) => {
                              const studFee = printReportFees.find(f => f.studentId === stud.id);
                              
                              // Attendance calculations
                              const studAtt = printReportAttendance.filter(a => a.studentId === stud.id);
                              const presents = studAtt.filter(a => a.status === 'Present').length;
                              const totalDays = studAtt.length;
                              const attRate = totalDays > 0 ? Math.round((presents / totalDays) * 100) : 100;

                              const amtDue = studFee ? studFee.amountDue : 0;
                              const amtPaid = studFee ? studFee.amountPaid : 0;
                              const deficit = amtDue - amtPaid;

                              return (
                                <tr key={stud.id} className="hover:bg-slate-50/50">
                                  <td className="py-2 px-2 font-mono font-black text-slate-500">{stud.rollNumber}</td>
                                  <td className="py-2 px-2 text-slate-900 font-bold">{stud.name}</td>
                                  <td className="py-2 px-2 text-center font-mono font-bold text-slate-800">{attRate}% ({presents}/{totalDays})</td>
                                  <td className="py-2 px-2">
                                    <span className={`inline-block px-1.5 py-0.2 rounded font-black text-[9px] uppercase border ${
                                      studFee?.status === 'Paid' 
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                                        : studFee?.status === 'Pending' 
                                        ? 'bg-rose-50 text-rose-800 border-rose-100'
                                        : 'bg-amber-50 text-amber-850 border-amber-100'
                                    }`}>
                                      {studFee ? studFee.status : 'Pending'}
                                    </span>
                                  </td>
                                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-700">₹{amtDue.toLocaleString('en-IN')}</td>
                                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-705 text-emerald-800">₹{amtPaid.toLocaleString('en-IN')}</td>
                                  <td className={`py-2 px-2 text-right font-mono font-bold ${deficit > 0 ? 'text-rose-700 font-black' : 'text-slate-400'}`}>
                                    ₹{deficit.toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                          
                          {/* Total Row */}
                          <tr className="bg-slate-50 border-t-2 border-slate-900 text-slate-950 font-black">
                            <td colSpan={2} className="py-3 px-2 text-xs uppercase text-slate-900">Total Audit Summary:</td>
                            <td className="py-3 px-2 text-center font-mono text-slate-900">{classAvgAttendanceRate}% class Average</td>
                            <td className="py-3 px-2 text-slate-600">
                              {printReportFees.filter(f => f.status !== 'Paid').length} O/S Alerts
                            </td>
                            <td className="py-3 px-2 text-right font-mono">₹{totalReportDues.toLocaleString('en-IN')}</td>
                            <td className="py-3 px-2 text-right font-mono text-emerald-800">₹{totalReportCollected.toLocaleString('en-IN')}</td>
                            <td className="py-3 px-2 text-right font-mono text-rose-700 text-xs">₹{totalReportDeficit.toLocaleString('en-IN')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Official Footnote / Authorization Signoff Block */}
                  <div className="pt-10 border-t border-slate-250 text-slate-800">
                    <div className="grid grid-cols-3 gap-6 text-center text-[10px] font-bold text-slate-500">
                      <div className="space-y-12">
                        <div className="h-0.5 w-[84%] bg-slate-300 mx-auto" />
                        <p className="uppercase text-[8px] tracking-wide">Class Teacher / Roster Head</p>
                      </div>
                      <div className="space-y-12">
                        <div className="h-0.5 w-[84%] bg-slate-300 mx-auto" />
                        <p className="uppercase text-[8px] tracking-wide">Authorized Financial Auditor</p>
                      </div>
                      <div className="space-y-12">
                        <div className="h-0.5 w-[84%] bg-slate-300 mx-auto" />
                        <p className="uppercase text-[8px] tracking-wide">District Principal & Trustee</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-[8px] text-slate-400 font-mono font-semibold pt-6 mt-4 border-t border-slate-100 uppercase">
                      <span>Decentralized Campus Ledger Code: CLRC-{selectedClassForReport.toUpperCase().replace(/\s+/g,'-')}</span>
                      <span>Page 1 of 1</span>
                      <span>SECURE WATERMARK ACTIVE © VIDYALAYA TRUST</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Modal Footer (Screen View Only) */}
              <div className="px-6 py-4 border-t border-gray-150 flex justify-end gap-3 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedClassForReport(null)}
                  className="px-5 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:bg-slate-900 cursor-pointer shadow-md"
                >
                  Close Builder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default DashboardView;
