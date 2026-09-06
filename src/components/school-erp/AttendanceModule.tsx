import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CalendarCheck, 
  Calendar, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Download, 
  ClipboardCheck,
  TrendingUp,
  UserCheck,
  FileSpreadsheet,
  FileJson,
  FileText,
  Printer,
  Grid,
  Sparkles
} from 'lucide-react';
import { Student, AttendanceRecord } from './types';

interface AttendanceModuleProps {
  students: Student[];
  attendance: AttendanceRecord[];
  onMarkAttendance: (records: AttendanceRecord[]) => void;
  todayStr: string;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  selectedClass?: string;
  onClassChange?: (className: string) => void;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = (props) => {
  const {
    students,
    attendance,
    onMarkAttendance,
    todayStr,
    addToast
  } = props;

  // Tabs for sub-actions
  const [attendanceTab, setAttendanceTab] = useState<'register' | 'reports'>('register');
  
  // Register States
  const [internalSelectedClass, setInternalSelectedClass] = useState<string>('Class 10-A');
  const selectedClass = props.selectedClass !== undefined ? props.selectedClass : internalSelectedClass;
  const setSelectedClass = (c: string) => {
    setInternalSelectedClass(c);
    if (props.onClassChange) {
      props.onClassChange(c);
    }
  };
  const [targetDate, setTargetDate] = useState<string>(todayStr);
  const [registerSearch, setRegisterSearch] = useState<string>('');

  // Dual Register Toggles
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [targetMonth, setTargetMonth] = useState<string>('2026-05'); // Default Month-Year selector
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  // Report States
  const [reportClass, setReportClass] = useState<string>('Class 10-A');
  const [startDate, setStartDate] = useState<string>(() => {
    // Default to 1 week ago
    const d = new Date();
    d.setDate(d.getDate() - 10);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(todayStr);

  const classes: string[] = Array.from(new Set(students.map(s => s.className)));

  // FILTERED STUDENTS FOR ACTIVE CLASS
  const classStudents = students.filter(s => s.className === selectedClass);
  const filteredRegisterStudents = classStudents.filter(s => 
    s.name.toLowerCase().includes(registerSearch.toLowerCase()) ||
    s.rollNumber.includes(registerSearch)
  );

  // CURRENT MARKS FOR REGISTER DATE
  const getStudentStatus = (studentId: string): 'Present' | 'Absent' => {
    const rec = attendance.find(r => r.studentId === studentId && r.date === targetDate);
    return rec ? rec.status : 'Present'; // Defaults to Present
  };

  const handleToggleStatus = (studentId: string) => {
    const currentStatus = getStudentStatus(studentId);
    const updatedStatus: 'Present' | 'Absent' = currentStatus === 'Present' ? 'Absent' : 'Present';
    
    // Find if record exists in global state to update or insert
    const updatedRecords = attendance.filter(r => !(r.studentId === studentId && r.date === targetDate));
    updatedRecords.push({
      studentId,
      date: targetDate,
      status: updatedStatus
    });

    onMarkAttendance(updatedRecords);
  };

  const handleMarkAll = (status: 'Present' | 'Absent') => {
    const updatedRecords = attendance.filter(r => !(r.date === targetDate && classStudents.some(s => s.id === r.studentId)));
    classStudents.forEach(s => {
      updatedRecords.push({
        studentId: s.id,
        date: targetDate,
        status
      });
    });
    onMarkAttendance(updatedRecords);
    addToast(`Marked all ${selectedClass} students as ${status}`, 'success');
  };

  // --- ENHANCED MONTHLY LEDGER LOGIC ---
  const getDaysInSelectedMonth = () => {
    const [year, month] = targetMonth.split('-').map(Number);
    if (!year || !month) return [];
    const daysCount = new Date(year, month, 0).getDate();
    return Array.from({ length: daysCount }, (_, i) => i + 1);
  };

  const daysInSelMonth = getDaysInSelectedMonth();

  const getStudentMonthlyStatus = (studentId: string, dayNum: number) => {
    const dateStr = `${targetMonth}-${String(dayNum).padStart(2, '0')}`;
    const rec = attendance.find(r => r.studentId === studentId && r.date === dateStr);
    return rec ? rec.status : 'Unmarked';
  };

  const handleToggleMonthlyStatus = (studentId: string, dayNum: number) => {
    const dateStr = `${targetMonth}-${String(dayNum).padStart(2, '0')}`;
    const rec = attendance.find(r => r.studentId === studentId && r.date === dateStr);
    const updatedStatus: 'Present' | 'Absent' = rec?.status === 'Present' ? 'Absent' : 'Present';
    
    const updatedRecords = attendance.filter(r => !(r.studentId === studentId && r.date === dateStr));
    updatedRecords.push({
      studentId,
      date: dateStr,
      status: updatedStatus
    });
    onMarkAttendance(updatedRecords);
  };

  const calculateStudentMonthlyStats = (studentId: string) => {
    let present = 0;
    let absent = 0;
    let total = 0;
    
    daysInSelMonth.forEach(d => {
      const dateStr = `${targetMonth}-${String(d).padStart(2, '0')}`;
      const rec = attendance.find(r => r.studentId === studentId && r.date === dateStr);
      if (rec) {
        total++;
        if (rec.status === 'Present') present++;
        else absent++;
      }
    });
    
    const pct = total > 0 ? Math.round((present / total) * 100) : 100;
    return { present, absent, total, pct };
  };

  const handleMarkAllMonthly = (status: 'Present' | 'Absent') => {
    let updatedRecords = [...attendance];
    classStudents.forEach(s => {
      daysInSelMonth.forEach(day => {
        const dateStr = `${targetMonth}-${String(day).padStart(2, '0')}`;
        updatedRecords = updatedRecords.filter(r => !(r.studentId === s.id && r.date === dateStr));
        updatedRecords.push({
          studentId: s.id,
          date: dateStr,
          status
        });
      });
    });
    onMarkAttendance(updatedRecords);
    addToast(`Marked all daily registers for ${selectedClass} as ${status} in ${targetMonth}.`, 'success');
  };

  // --- REPORT GENERATOR BUSINESS LOGIC ---
  const generateReportData = () => {
    const reportStudents = students.filter(s => s.className === reportClass);
    
    // Get unique dates in range
    const dStart = new Date(startDate);
    const dEnd = new Date(endDate);
    
    const relevantAttendance = attendance.filter(r => {
      const d = new Date(r.date);
      return d >= dStart && d <= dEnd;
    });

    // Formulate rows
    return reportStudents.map(student => {
      const studentRecs = relevantAttendance.filter(r => r.studentId === student.id);
      const totalDays = studentRecs.length;
      const presentDays = studentRecs.filter(r => r.status === 'Present').length;
      const absentDays = totalDays - presentDays;
      const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

      return {
        ...student,
        totalDays,
        presentDays,
        absentDays,
        percentage
      };
    });
  };

  const reportData = generateReportData();

  // Export CSV
  const handleExportCSV = () => {
    if (reportData.length === 0) {
      addToast('No data available to export', 'error');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Roll Number,Student Name,Class,Total Days,Present Days,Absent Days,Attendance Percentage\n";
    
    reportData.forEach(row => {
      csvContent += `"${row.rollNumber}","${row.name}","${row.className}",${row.totalDays},${row.presentDays},${row.absentDays},${row.percentage}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Report_${reportClass}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Attendance CSV exported successfully', 'success');
  };

  // Export Excel (.xls)
  const handleExportExcel = () => {
    if (reportData.length === 0) {
      addToast('No data available to export', 'error');
      return;
    }

    let excelContent = "Roll Number\tStudent Name\tClass\tTotal Days\tPresent Days\tAbsent Days\tAttendance Percentage\n";
    
    reportData.forEach(row => {
      excelContent += `${row.rollNumber}\t${row.name}\t${row.className}\t${row.totalDays}\t${row.presentDays}\t${row.absentDays}\t${row.percentage}%\n`;
    });

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_Report_${reportClass}_${startDate}_to_${endDate}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Attendance MS Excel ledger exported successfully', 'success');
  };

  // Export JSON raw database backup (.json)
  const handleExportJSON = () => {
    if (reportData.length === 0) {
      addToast('No data available to export', 'error');
      return;
    }

    const dataObj = {
      reportClass,
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      classAverage: `${Math.round(reportData.reduce((sum, r) => sum + r.percentage, 0) / reportData.length)}%`,
      records: reportData
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataObj, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `Attendance_Raw_Ledger_${reportClass}_${startDate}_to_${endDate}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Attendance raw JSON exported successfully', 'success');
  };

  // Download PDF simulation / Beautiful Web Print
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addToast('Popup blocker prevented printing. Please enable popups.', 'error');
      return;
    }

    const html = `
      <html>
        <head>
          <title>Attendance Report - ${reportClass}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .school-name { font-size: 24px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
            .report-title { font-size: 16px; color: #475569; margin-top: 5px; font-weight: 600; }
            .meta { display: flex; justify-content: space-between; margin-top: 15px; font-size: 12px; font-weight: bold; color: #64748b; }
            table { w-full; border-collapse: collapse; margin-top: 20px; width: 100%; }
            th { background-color: #f8fafc; color: #475569; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; padding: 12px; border-bottom: 1px solid #e2e8f0; }
            td { padding: 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
            .badge-green { color: #15803d; background: #f0fdf4; font-weight: bold; padding: 3px 8px; border-radius: 4px; }
            .badge-red { color: #b91c1c; background: #fef2f2; font-weight: bold; padding: 3px 8px; border-radius: 4px; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">Vidyalaya Public School</div>
            <div class="report-title">Academic Attendance Ledger</div>
            <div class="meta">
              <span>CLASS: ${reportClass}</span>
              <span>PERIOD: ${startDate} to ${endDate}</span>
              <span>GENERATED ON: ${new Date().toLocaleDateString('en-IN')}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Roll No</th>
                <th style="text-align: left;">Student Name</th>
                <th>Presences</th>
                <th>Absences</th>
                <th>Total Tracked</th>
                <th style="text-align: right;">Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.map(row => `
                <tr>
                  <td>${row.rollNumber}</td>
                  <td style="font-weight: bold;">${row.name}</td>
                  <td style="text-align: center; color: #16a34a;">${row.presentDays}</td>
                  <td style="text-align: center; color: #dc2626;">${row.absentDays}</td>
                  <td style="text-align: center;">${row.totalDays}</td>
                  <td style="text-align: right;">
                    <span class="${row.percentage >= 75 ? 'badge-green' : 'badge-red'}">${row.percentage}%</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            Vidyalaya ERP Document Suite Tracker • Powered by Antigravity Sandbox
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Sub Header tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setAttendanceTab('register')}
            className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              attendanceTab === 'register' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            Mark Daily Register
          </button>
          <button
            onClick={() => setAttendanceTab('reports')}
            className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              attendanceTab === 'reports' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            Attendance Reports
          </button>
        </div>
      </div>

      {attendanceTab === 'register' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Dual Register View Modes */}
          <div className="flex bg-slate-200/60 p-1.5 rounded-2xl w-full sm:w-fit shrink-0 border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('daily')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${
                viewMode === 'daily' 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CalendarCheck size={14} />
              <span>Daily Marker Register</span>
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${
                viewMode === 'monthly' 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Grid size={13} />
              <span>Monthly Ledger View</span>
            </button>
          </div>

          {viewMode === 'daily' ? (
            <>
              {/* Controls Bar */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
                
                {/* Year / Class select */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-400" />
                    <span className="text-xs font-black uppercase text-gray-400 select-none">Class:</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                    {classes.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedClass(c)}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-transform active:scale-95 ${
                          selectedClass === c ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Picker */}
                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                  <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase">
                    <Calendar size={16} />
                    <span>Mark Date:</span>
                  </div>
                  <input 
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    max={todayStr}
                    className="px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl font-bold text-sm tracking-tight outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* General Search bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search Class student..."
                    value={registerSearch}
                    onChange={(e) => setRegisterSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              {/* Quick Mark Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-2 text-sm text-indigo-900 font-bold">
                  <UserCheck size={18} className="text-indigo-600" />
                  <span>Bulk Actions for {selectedClass} on {new Date(targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => handleMarkAll('Present')}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/10"
                  >
                    Mark All Present
                  </button>
                  <button 
                    onClick={() => handleMarkAll('Absent')}
                    className="flex-1 sm:flex-none px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-rose-600/10"
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>

              {/* Student attendance tracking grid */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-[2px] text-gray-400">
                        <th className="px-8 py-5">Roll No</th>
                        <th className="px-8 py-5">Student Details</th>
                        <th className="px-8 py-5">Father's Name</th>
                        <th className="px-8 py-5 text-center">Status Toggle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredRegisterStudents.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-gray-400 font-bold uppercase text-xs">No matching student profiles found</td>
                        </tr>
                      ) : (
                        filteredRegisterStudents.map((student) => {
                          const status = getStudentStatus(student.id);
                          return (
                            <tr key={student.id} className="hover:bg-slate-50/40 transition-colors border-b border-slate-50">
                              <td className="px-8 py-5 font-mono text-xs font-black text-gray-500">{student.rollNumber}</td>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-2.5">
                                  {/* Student Photo */}
                                  <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0">
                                    {student.photo ? (
                                      <img src={student.photo} alt={student.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="text-[10px] font-black text-indigo-700 bg-indigo-50 w-full h-full flex items-center justify-center">
                                        {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-extrabold text-gray-900 text-sm whitespace-nowrap">{student.name}</p>
                                      <span className={`w-2.5 h-2.5 rounded-full inline-block ${
                                        status === 'Present' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-rose-500 shadow-sm shadow-rose-500/50'
                                      }`} title={status} />
                                    </div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">{student.className} • DOB: {student.dob}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-sm font-semibold text-slate-600">{student.fatherName}</td>
                              <td className="px-8 py-5">
                                <div className="flex justify-center">
                                  <button
                                    onClick={() => handleToggleStatus(student.id)}
                                    className={`w-32 py-2 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-wider border transition-all ${
                                      status === 'Present' 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-500/5 hover:bg-emerald-100/50' 
                                        : 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm shadow-rose-500/5 hover:bg-rose-100/50'
                                    }`}
                                  >
                                    {status === 'Present' ? (
                                      <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                        <span>Present</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                        <XCircle size={14} className="text-rose-500 shrink-0" />
                                        <span>Absent</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Monthly Controls Bar */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
                
                {/* Year / Class select */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-400" />
                    <span className="text-xs font-black uppercase text-gray-400 select-none">Class:</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                    {classes.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedClass(c)}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-transform active:scale-95 ${
                          selectedClass === c ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Enhanced Month Picker */}
                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                  <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase">
                    <Calendar size={16} />
                    <span>Select Month:</span>
                  </div>
                  <input 
                    type="month"
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(e.target.value)}
                    className="px-4 py-1.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-xs tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                  />
                </div>

                {/* General Search bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search Class student..."
                    value={registerSearch}
                    onChange={(e) => setRegisterSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              {/* Monthly Bulk operations */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-2 text-sm text-indigo-900 font-bold">
                  <Sparkles size={18} className="text-indigo-600 shrink-0" />
                  <span>Seeding {selectedClass} calendars for the entire month of {new Date(targetMonth + "-01").toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <button 
                    onClick={() => handleMarkAllMonthly('Present')}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/10"
                  >
                    Mark Month Present
                  </button>
                  <button 
                    onClick={() => handleMarkAllMonthly('Absent')}
                    className="flex-1 sm:flex-none px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-rose-600/10"
                  >
                    Mark Month Absent
                  </button>
                </div>
              </div>

              {/* Monthly Grid / Register */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/50 gap-2 shrink-0">
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-800 uppercase">Monthly Attendance Matrix</h3>
                    <p className="text-[10px] text-gray-400 font-black">Hover bubbles for dates. Single-click bubbles to live-compile attendance calculations.</p>
                  </div>
                  <div className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded">
                    Interactive Ledger Ledger
                  </div>
                </div>

                <div className="overflow-x-auto max-w-full">
                  <table className="w-full text-left table-fixed min-w-[1000px]">
                    <thead>
                      <tr className="bg-gray-100/60 border-b border-gray-100 text-[9px] font-black uppercase tracking-[1px] text-gray-400">
                        <th className="px-4 py-4 w-12 text-center h-12">Roll</th>
                        <th className="px-4 py-4 w-44 truncate">Student name</th>
                        {daysInSelMonth.map(dayNum => (
                          <th key={dayNum} className="text-center w-8 py-4 px-1 min-w-[2rem]">
                            {dayNum}
                          </th>
                        ))}
                        <th className="px-2 py-4 w-14 text-center">Pres.</th>
                        <th className="px-2 py-4 w-14 text-center">Abs.</th>
                        <th className="px-4 py-4 w-28 text-right pr-6">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredRegisterStudents.length === 0 ? (
                        <tr>
                          <td colSpan={daysInSelMonth.length + 5} className="py-12 text-center text-gray-400 font-bold uppercase text-xs">No matching student profiles found</td>
                        </tr>
                      ) : (
                        filteredRegisterStudents.map((student) => {
                          const stats = calculateStudentMonthlyStats(student.id);
                          const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                          return (
                            <tr key={student.id} className="hover:bg-slate-50/30 transition-colors text-xs border-b border-slate-50">
                              {/* Roll */}
                              <td className="px-4 py-3 font-mono text-[10px] h-12 font-black text-gray-400 text-center">{student.rollNumber}</td>
                              
                              {/* Student name and avatar */}
                              <td className="px-4 py-3 truncate">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-100 bg-slate-50 shrink-0 flex items-center justify-center">
                                    {student.photo ? (
                                      <img src={student.photo} alt={student.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="text-[9px] font-black text-indigo-700 bg-indigo-50 w-full h-full flex items-center justify-center">
                                        {initials}
                                      </div>
                                    )}
                                  </div>
                                  <span className="font-extrabold text-slate-800 truncate" title={student.name}>{student.name}</span>
                                </div>
                              </td>

                              {/* Clickable daily calendar metrics */}
                              {daysInSelMonth.map(dayNum => {
                                const status = getStudentMonthlyStatus(student.id, dayNum);
                                const celID = `${student.id}-${dayNum}`;
                                
                                return (
                                  <td key={dayNum} className="text-center py-3 px-1 relative w-8">
                                    <button
                                      onClick={() => handleToggleMonthlyStatus(student.id, dayNum)}
                                      onMouseEnter={() => setHoveredCell(celID)}
                                      onMouseLeave={() => setHoveredCell(null)}
                                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] border transition-all shrink-0 select-none ${
                                        status === 'Present' 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-sm' 
                                          : status === 'Absent'
                                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 shadow-sm'
                                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      {status === 'Present' ? 'P' : status === 'Absent' ? 'A' : '-'}
                                    </button>

                                    {hoveredCell === celID && (
                                      <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-1 p-2 bg-slate-900 text-white rounded-lg shadow-xl text-[9px] leading-tight font-black select-none pointer-events-none whitespace-nowrap">
                                        {new Date(`${targetMonth}-${String(dayNum).padStart(2, '0')}`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: {status}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}

                              {/* Tracker columns */}
                              <td className="px-2 py-3 font-bold text-emerald-600 text-center">{stats.present}d</td>
                              <td className="px-2 py-3 font-bold text-rose-500 text-center">{stats.absent}d</td>
                              
                              {/* Percentage column */}
                              <td className="px-4 py-3 text-right pr-6">
                                <div className="flex items-center justify-end gap-2">
                                  <span className={`font-mono font-black ${stats.pct >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>{stats.pct}%</span>
                                  <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded border ${
                                    stats.pct >= 75 
                                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                      : 'bg-rose-50 text-rose-500 border-rose-100 border-dashed'
                                  }`}>
                                    {stats.pct >= 75 ? 'OK' : 'FAIL'}
                                  </span>
                                </div>
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {attendanceTab === 'reports' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Report filters panel */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Select Class</label>
              <select
                value={reportClass}
                onChange={(e) => setReportClass(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 py-3 px-4 rounded-xl text-sm font-bold text-gray-800 outline-none"
              >
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
                className="w-full bg-slate-50 border border-gray-200 py-2.5 px-4 rounded-xl text-sm font-bold text-gray-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={todayStr}
                className="w-full bg-slate-50 border border-gray-200 py-2.5 px-4 rounded-xl text-sm font-bold text-gray-800 outline-none"
              />
            </div>
            <div className="flex gap-2 relative">
              <button
                onClick={handlePrintReport}
                className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Printer size={14} />
                <span>PDF Print</span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all flex items-center justify-center gap-2 font-black text-xs uppercase"
                  title="Export Attendance Ledger"
                >
                  <Download size={16} />
                  <span>Export</span>
                </button>

                {isExportDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsExportDropdownOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-100 shadow-2xl p-2 z-50 animate-fadeIn">
                      <p className="text-[9px] text-gray-400 font-extrabold px-3 py-1.5 uppercase tracking-wider">Select Export Format</p>
                      
                      {/* CSV */}
                      <button
                        onClick={() => {
                          handleExportCSV();
                          setIsExportDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all text-left"
                      >
                        <FileText size={14} className="text-emerald-500 shrink-0" />
                        <span>Export CSV (.csv)</span>
                      </button>

                      {/* Excel */}
                      <button
                        onClick={() => {
                          handleExportExcel();
                          setIsExportDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all text-left"
                      >
                        <FileSpreadsheet size={14} className="text-blue-500 shrink-0" />
                        <span>Export Excel (.xls)</span>
                      </button>

                      {/* JSON */}
                      <button
                        onClick={() => {
                          handleExportJSON();
                          setIsExportDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all text-left"
                      >
                        <FileJson size={14} className="text-purple-500 shrink-0" />
                        <span>Export Raw JSON (.json)</span>
                      </button>

                      {/* Web HTML Print */}
                      <button
                        onClick={() => {
                          handlePrintReport();
                          setIsExportDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all text-left border-t border-slate-50"
                      >
                        <Printer size={14} className="text-slate-500 shrink-0" />
                        <span>Print Preview / PDF</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Report Statistics Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Period</p>
              <h4 className="text-sm font-black text-slate-800 mt-2">
                {new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} to {new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </h4>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Below Threshold (&lt;75%)</p>
              <h4 className="text-lg font-black text-rose-600 mt-1">
                {reportData.filter(r => r.percentage < 75).length} Students
              </h4>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Class Avg Attendance</p>
              <h4 className="text-lg font-black text-emerald-600 mt-1">
                {reportData.length > 0 
                  ? `${Math.round(reportData.reduce((sum, r) => sum + r.percentage, 0) / reportData.length)}%`
                  : 'N/A'
                }
              </h4>
            </div>
          </div>

          {/* Report details table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-extrabold text-sm text-gray-900 uppercase">Interactive Ledger: {reportClass}</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase">75% attendance mandatory under CBSE/state bylaws</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-[2px] text-gray-400">
                    <th className="px-8 py-5">Roll No</th>
                    <th className="px-8 py-5">Student Name</th>
                    <th className="px-8 py-5 text-center">Present Days</th>
                    <th className="px-8 py-5 text-center">Absent Days</th>
                    <th className="px-8 py-5 text-center">Total Tracked</th>
                    <th className="px-8 py-5 text-right">Mandatory Criteria Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {reportData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/20 transition-colors">
                      <td className="px-8 py-4 font-mono font-bold text-gray-500">{row.rollNumber}</td>
                      <td className="px-8 py-4 font-extrabold text-gray-900">{row.name}</td>
                      <td className="px-8 py-4 text-center font-bold text-emerald-600">{row.presentDays}</td>
                      <td className="px-8 py-4 text-center font-bold text-rose-500">{row.absentDays}</td>
                      <td className="px-8 py-4 text-center text-gray-500">{row.totalDays}</td>
                      <td className="px-8 py-4">
                        <div className="flex justify-end items-center gap-3">
                          <span className={`text-xs font-black ${row.percentage >= 75 ? 'text-emerald-700' : 'text-rose-600'}`}>{row.percentage}%</span>
                          <span className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg border ${
                            row.percentage >= 75 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-rose-50 text-rose-500 border-rose-100'
                          }`}>
                            {row.percentage >= 75 ? 'Eligible' : 'Critical (Below 75%)'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
