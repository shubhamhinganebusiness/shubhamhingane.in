import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Users, 
  CalendarCheck, 
  IndianRupee, 
  Award, 
  Sparkles,
  ChevronLeft,
  X,
  Info,
  LogOut,
  Sliders,
  Bell,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Student, AttendanceRecord, ExamFeeRecord, CertificateLog, ToastMessage } from './types';
import { 
  SAMPLE_STUDENTS, 
  generateDefaultAttendance, 
  generateDefaultExamFees,
  CLASS_FEE_STRUCTURE
} from './sampleData';

import { DashboardView } from './DashboardView';
import { AttendanceModule } from './AttendanceModule';
import { ExamFeeModule } from './ExamFeeModule';
import { CertificationModule } from './CertificationModule';

export const SchoolERPApp: React.FC = () => {
  const navigate = useNavigate();
  const todayStr = '2026-05-19'; // Fixed standard date matching generated historical logs

  // --- CORE STATE DRIVERS ---
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<ExamFeeRecord[]>([]);
  const [certificates, setCertificates] = useState<CertificateLog[]>([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance' | 'fees' | 'certificates'>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // Add Student Form States
  const [currentGlobalClass, setCurrentGlobalClass] = useState<string>('Class 10-A');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('Class 10');
  const [newStudentSection, setNewStudentSection] = useState('A');
  const [newStudentFather, setNewStudentFather] = useState('');
  const [newStudentMother, setNewStudentMother] = useState('');
  const [newStudentDob, setNewStudentDob] = useState('01/01/2011');
  const [newStudentContact, setNewStudentContact] = useState('');
  const [newStudentPhoto, setNewStudentPhoto] = useState('');
  const [isPhotoDragging, setIsPhotoDragging] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Formatting & Validation helpers
  const formatDobInput = (val: string) => {
    const num = val.replace(/\D/g, '').slice(0, 8);
    if (num.length <= 2) return num;
    if (num.length <= 4) return `${num.slice(0, 2)}/${num.slice(2)}`;
    return `${num.slice(0, 2)}/${num.slice(2, 4)}/${num.slice(4)}`;
  };

  const formatContactNumber = (val: string) => {
    const num = val.replace(/\D/g, '').slice(0, 10);
    if (num.length <= 3) return num;
    if (num.length <= 6) return `${num.slice(0, 3)}-${num.slice(3)}`;
    return `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6)}`;
  };

  const validateDob = (val: string): boolean => {
    const parts = val.split('/');
    if (parts.length !== 3) return false;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    
    const dateObj = new Date(year, month - 1, day);
    if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
      return false;
    }
    
    if (year < 1990 || year > 2026) return false;
    return true;
  };

  // Sync modal class/section state with currently active global class selection
  useEffect(() => {
    if (isAddStudentModalOpen) {
      const parts = currentGlobalClass.split('-');
      setNewStudentClass(parts[0] || 'Class 10');
      setNewStudentSection(parts[1] || 'A');
    }
  }, [isAddStudentModalOpen, currentGlobalClass]);

  // Auto-suggest roll number when class or modal opens
  useEffect(() => {
    if (isAddStudentModalOpen && students.length > 0) {
      const combinedClass = `${newStudentClass}-${newStudentSection}`;
      const classStudents = students.filter(s => s.className === combinedClass);
      if (classStudents.length > 0) {
        const rolls = classStudents.map(s => parseInt(s.rollNumber)).filter(n => !isNaN(n));
        if (rolls.length > 0) {
          const maxRoll = Math.max(...rolls);
          setNewStudentRoll((maxRoll + 1).toString());
        } else {
          setNewStudentRoll('1001');
        }
      } else {
        const stdMatch = newStudentClass.match(/\d+/);
        if (stdMatch) {
          const stdNum = parseInt(stdMatch[0], 10);
          if (stdNum === 10) setNewStudentRoll('1007');
          else if (stdNum === 11) setNewStudentRoll('1107');
          else if (stdNum === 12) setNewStudentRoll('1207');
          else setNewStudentRoll(`${stdNum}02`);
        } else {
          setNewStudentRoll('1001');
        }
      }
    }
  }, [newStudentClass, newStudentSection, isAddStudentModalOpen, students]);

  // --- LOCALSTORAGE PERSISTENCE DRIVER ---
  useEffect(() => {
    // 1. Students
    const storedStudents = localStorage.getItem('erp_students');
    if (storedStudents) {
      setStudents(JSON.parse(storedStudents));
    } else {
      localStorage.setItem('erp_students', JSON.stringify(SAMPLE_STUDENTS));
      setStudents(SAMPLE_STUDENTS);
    }

    // 2. Attendance
    const storedAttendance = localStorage.getItem('erp_attendance');
    if (storedAttendance) {
      setAttendance(JSON.parse(storedAttendance));
    } else {
      const defaultAtt = generateDefaultAttendance();
      localStorage.setItem('erp_attendance', JSON.stringify(defaultAtt));
      setAttendance(defaultAtt);
    }

    // 3. Exam Fees
    const storedFees = localStorage.getItem('erp_fees');
    if (storedFees) {
      setFees(JSON.parse(storedFees));
    } else {
      const defaultFees = generateDefaultExamFees();
      localStorage.setItem('erp_fees', JSON.stringify(defaultFees));
      setFees(defaultFees);
    }

    // 4. Certificates log
    const storedCerts = localStorage.getItem('erp_certificates');
    if (storedCerts) {
      setCertificates(JSON.parse(storedCerts));
    } else {
      setCertificates([]);
    }
  }, []);

  // Sync back state corrections to localStorage
  const handleMarkAttendance = (updatedRecords: AttendanceRecord[]) => {
    setAttendance(updatedRecords);
    localStorage.setItem('erp_attendance', JSON.stringify(updatedRecords));
  };

  const handleUpdateFees = (updatedFees: ExamFeeRecord[]) => {
    setFees(updatedFees);
    localStorage.setItem('erp_fees', JSON.stringify(updatedFees));
  };

  const handleAddCertificateLog = (newLog: CertificateLog) => {
    const nextLogs = [newLog, ...certificates];
    setCertificates(nextLogs);
    localStorage.setItem('erp_certificates', JSON.stringify(nextLogs));
  };

  const handleAddStudent = (newStudent: Student) => {
    const nextStudents = [...students, newStudent];
    setStudents(nextStudents);
    localStorage.setItem('erp_students', JSON.stringify(nextStudents));

    // Auto-generate standard fee for the class
    const classNameBase = newStudent.className.split('-')[0]; // e.g., "Class 5" from "Class 5-A"
    const feeAmount = CLASS_FEE_STRUCTURE[`${classNameBase}-A`] || 1500;

    const newFeeRecord: ExamFeeRecord = {
      id: `fee-${newStudent.id}`,
      studentId: newStudent.id,
      rollNumber: newStudent.rollNumber,
      studentName: newStudent.name,
      className: newStudent.className,
      amountDue: feeAmount,
      amountPaid: 0,
      status: 'Pending',
      dueDate: '2026-06-15',
    };

    const nextFees = [...fees, newFeeRecord];
    setFees(nextFees);
    localStorage.setItem('erp_fees', JSON.stringify(nextFees));

    // Prime default attendance records as Present for previous school days
    const days = ['2026-05-13', '2026-05-14', '2026-05-15', '2026-05-18', '2026-05-19'];
    const extraAttendance: AttendanceRecord[] = days.map(day => ({
      studentId: newStudent.id,
      date: day,
      status: 'Present'
    }));

    const nextAttendance = [...attendance, ...extraAttendance];
    setAttendance(nextAttendance);
    localStorage.setItem('erp_attendance', JSON.stringify(nextAttendance));

    addToast(`Student "${newStudent.name}" registered successfully.`, 'success');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    // Validate Name
    if (!newStudentName.trim()) {
      errors.name = "Full name is required";
    } else if (newStudentName.trim().length < 3) {
      errors.name = "Name must be at least 3 characters long";
    } else if (!/^[A-Za-z\s.]+$/.test(newStudentName.trim())) {
      errors.name = "Name can only contain letters, spaces, or dots";
    }

    // Validate Roll Number
    if (!newStudentRoll.trim()) {
      errors.rollNumber = "Roll number is required";
    } else if (!/^\d+$/.test(newStudentRoll.trim())) {
      errors.rollNumber = "Roll number must be a valid positive integer";
    }

    // Validate Father's Name
    if (!newStudentFather.trim()) {
      errors.fatherName = "Father's name is required";
    } else if (newStudentFather.trim().length < 3) {
      errors.fatherName = "Father's name must be at least 3 characters long";
    } else if (!/^[A-Za-z\s.]+$/.test(newStudentFather.trim())) {
      errors.fatherName = "Father's name can only contain letters, spaces, or dots";
    }

    // Validate Mother's Name
    if (!newStudentMother.trim()) {
      errors.motherName = "Mother's name is required";
    } else if (newStudentMother.trim().length < 3) {
      errors.motherName = "Mother's name must be at least 3 characters long";
    }

    // Validate Date of Birth (DD/MM/YYYY)
    if (!newStudentDob.trim()) {
      errors.dob = "Date of birth is required";
    } else if (!validateDob(newStudentDob)) {
      errors.dob = "Enter valid date of birth in DD/MM/YYYY format (e.g. 15/04/2011)";
    }

    // Validate Contact Number (XXX-XXX-XXXX)
    if (!newStudentContact.trim()) {
      errors.contact = "Contact number is required";
    } else if (!/^\d{3}-\d{3}-\d{4}$/.test(newStudentContact.trim())) {
      errors.contact = "Enter contact in standard XXX-XXX-XXXX format";
    }

    // Check Duplicate Roll Number
    const combinedClass = `${newStudentClass}-${newStudentSection}`;
    if (!errors.rollNumber) {
      const duplicate = students.find(
        s => s.className === combinedClass && s.rollNumber.trim().toLowerCase() === newStudentRoll.trim().toLowerCase()
      );
      if (duplicate) {
        errors.rollNumber = `Roll "${newStudentRoll}" already assigned to ${duplicate.name} in ${combinedClass}`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast("Please fix the highlighted form validation errors", "error");
      return;
    }

    // Reset error panel
    setFormErrors({});
    
    const createdStudent: Student = {
      id: `st-${Date.now()}`,
      rollNumber: newStudentRoll.trim(),
      name: newStudentName.trim(),
      className: combinedClass,
      fatherName: newStudentFather.trim(),
      motherName: newStudentMother.trim(),
      dob: newStudentDob.trim(),
      contact: newStudentContact.trim(),
      photo: newStudentPhoto || undefined
    };

    handleAddStudent(createdStudent);
    
    // Reset fields & Close Modal
    setNewStudentName('');
    setNewStudentRoll('');
    setNewStudentFather('');
    setNewStudentMother('');
    setNewStudentDob('01/01/2011');
    setNewStudentContact('');
    setNewStudentPhoto('');
    setFormErrors({});
    setIsAddStudentModalOpen(false);
  };

  // --- TOAST NOTIFICATIONS HELPER ---
  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto erase
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleResetDemoData = () => {
    if (window.confirm('Are you sure you want to reset all records to default sample datasets? This will clear current certificate print logs.')) {
      localStorage.removeItem('erp_students');
      localStorage.removeItem('erp_attendance');
      localStorage.removeItem('erp_fees');
      localStorage.removeItem('erp_certificates');
      
      setStudents(SAMPLE_STUDENTS);
      setAttendance(generateDefaultAttendance());
      setFees(generateDefaultExamFees());
      setCertificates([]);
      addToast('System database flushed and reset to sample data.', 'success');
    }
  };

  const handleUpdateStudentPhoto = (studentId: string, photo: string) => {
    const updatedStudents = students.map(s => s.id === studentId ? { ...s, photo } : s);
    setStudents(updatedStudents);
    localStorage.setItem('erp_students', JSON.stringify(updatedStudents));
    addToast(`Successfully updated student photograph.`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      
      {/* MOBILE HEADER FOR RESPONSIVENESS */}
      <header className="lg:hidden h-16 bg-slate-900 text-white fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Building2 className="text-primary" size={20} />
          <span className="font-extrabold text-xs uppercase tracking-widest text-[#fff]">Vidyalaya ERP</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-slate-800 rounded-lg"
        >
          <Sliders size={18} />
        </button>
      </header>

      {/* SIDEBAR NAVIGATION PANEL */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-white flex flex-col justify-between transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen shrink-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-0'
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0 pt-16 lg:pt-0">
          
          {/* Logo / Org Section */}
          <div className="p-6 border-b border-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
                <Building2 size={22} className="shrink-0" />
              </div>
              <div>
                <h1 className="font-black text-xs uppercase tracking-[3px] text-white">Vidyalaya</h1>
                <p className="text-[10px] text-slate-500 font-extrabold uppercase">District Portal ERP</p>
              </div>
            </div>
            {/* Close sidebar on mobile option */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 hover:bg-slate-900 rounded-lg text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1 overflow-y-auto no-scrollbar flex-1">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 px-3">Primary Gateways</p>
            
            <button
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-primary text-white font-black shadow-lg shadow-primary/20' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sliders size={16} />
                <span>Admin Dashboard</span>
              </div>
              <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded-full ${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-950 text-white border border-indigo-900' 
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}>
                {students.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'attendance' 
                  ? 'bg-primary text-white font-black shadow-lg shadow-primary/20' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <CalendarCheck size={16} />
              <span>Daily Attendance</span>
            </button>

            <button
              onClick={() => { setActiveTab('fees'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'fees' 
                  ? 'bg-primary text-white font-black shadow-lg shadow-primary/20' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <IndianRupee size={16} />
              <span>Exam Fees Desk</span>
            </button>

            <button
              onClick={() => { setActiveTab('certificates'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'certificates' 
                  ? 'bg-primary text-white font-black shadow-lg shadow-primary/20' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Award size={16} />
              <span>Certificate Suite</span>
            </button>

            <button
              onClick={() => { setIsAddStudentModalOpen(true); setIsSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-indigo-400 hover:bg-slate-900 hover:text-white mt-1 border border-dashed border-slate-900 hover:border-indigo-500/30"
            >
              <UserPlus size={16} />
              <span>Register Scholar</span>
            </button>

            <div className="pt-8 space-y-2">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-3">Maintenance</p>
              <button
                onClick={handleResetDemoData}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] uppercase font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all text-left"
              >
                <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                <span>Reset Database</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Back exit controller */}
        <div className="p-4 border-t border-slate-900 space-y-2">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-900 flex items-start gap-2.5">
            <Info className="text-primary shrink-0" size={14} />
            <p className="text-[9px] text-slate-400 leading-normal font-medium">Auto-persistence is active. Local databases automatically sync to standard LocalStorage slots.</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
          >
            <LogOut size={16} />
            <span>Close ERP Portal</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER CONTENT VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto pt-16 lg:pt-0">
        
        {/* TOP STATUS BAR (DESKTOP) */}
        <header className="hidden lg:flex justify-between items-center h-20 bg-white border-b border-gray-100 px-8 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary" size={16} />
            <span className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 select-none">Vidyalaya Integrated ERP Suite</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsAddStudentModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm shadow-indigo-600/25 transition-all"
            >
              <UserPlus size={14} />
              <span>Add Student</span>
            </button>
            <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-bold text-xs shrink-0 select-none">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Central Admin Portal : ONLINE</span>
            </div>
          </div>
        </header>

        {/* ACTIVE STAGE CANVAS */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardView 
                  students={students} 
                  attendance={attendance} 
                  fees={fees} 
                  certificates={certificates} 
                  todayStr={todayStr} 
                  onNavigate={(module) => setActiveTab(module)}
                  onOpenAddStudentModal={() => setIsAddStudentModalOpen(true)}
                  onUpdateStudentPhoto={handleUpdateStudentPhoto}
                  addToast={addToast}
                />
              )}

              {activeTab === 'attendance' && (
                <AttendanceModule 
                  students={students} 
                  attendance={attendance} 
                  onMarkAttendance={handleMarkAttendance} 
                  todayStr={todayStr}
                  addToast={addToast}
                  selectedClass={currentGlobalClass}
                  onClassChange={setCurrentGlobalClass}
                />
              )}

              {activeTab === 'fees' && (
                <ExamFeeModule 
                  students={students} 
                  fees={fees} 
                  onUpdateFees={handleUpdateFees} 
                  addToast={addToast}
                />
              )}

              {activeTab === 'certificates' && (
                <CertificationModule 
                  students={students} 
                  certificates={certificates}
                  onAddCertificateLog={handleAddCertificateLog} 
                  addToast={addToast}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* TOAST SYSTEM CONTAINER PANEL */}
      <div className="fixed bottom-6 left-6 z-[100] space-y-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30, scale: 0.9 }}
              className="pointer-events-auto w-full"
            >
              <div className={`p-4 rounded-xl shadow-xl flex items-start gap-3 border ${
                toast.type === 'success' 
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-900' 
                  : toast.type === 'error' 
                  ? 'bg-rose-950 text-rose-300 border-rose-900' 
                  : 'bg-indigo-950 text-indigo-300 border-indigo-900'
               }`}>
                <div className="shrink-0 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${
                    toast.type === 'success' ? 'bg-emerald-400' : toast.type === 'error' ? 'bg-rose-400' : 'bg-indigo-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold leading-relaxed">{toast.message}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* DYNAMIC REGISTRATION DIALOG MODAL */}
      <AnimatePresence>
        {isAddStudentModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddStudentModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl relative border border-slate-100 overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              
              {/* Header */}
              <div className="px-6 py-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/20 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-950 uppercase tracking-widest">Register Student</h3>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase">District Portal Entry File</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddStudentModalOpen(false)} 
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-950 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 no-scrollbar">
                
                {/* Full name input */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400">Student Full Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Priyesh Deshpande"
                    value={newStudentName}
                    onChange={(e) => {
                      setNewStudentName(e.target.value);
                      if (formErrors.name) {
                        setFormErrors(prev => ({ ...prev, name: '' }));
                      }
                    }}
                    className={`w-full bg-slate-50 border py-2.5 px-3 rounded-xl text-xs font-semibold focus:ring-1 focus:bg-white outline-none transition-all ${
                      formErrors.name ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-150'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-[9px] text-rose-600 font-bold uppercase tracking-wide">{formErrors.name}</p>
                  )}
                </div>

                {/* Class & Roll Row */}
                <div className="grid grid-cols-3 gap-3">
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 font-sans">Class</label>
                    <select
                      value={newStudentClass}
                      onChange={(e) => setNewStudentClass(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 py-2.5 px-2 rounded-xl text-xs font-bold text-slate-800 focus:ring-1 focus:ring-indigo-100 outline-none transition-all"
                    >
                      <option value="Class 1">Class 1</option>
                      <option value="Class 2">Class 2</option>
                      <option value="Class 3">Class 3</option>
                      <option value="Class 4">Class 4</option>
                      <option value="Class 5">Class 5</option>
                      <option value="Class 6">Class 6</option>
                      <option value="Class 7">Class 7</option>
                      <option value="Class 8">Class 8</option>
                      <option value="Class 9">Class 9</option>
                      <option value="Class 10">Class 10</option>
                      <option value="Class 11">Class 11</option>
                      <option value="Class 12">Class 12</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 font-sans">Section</label>
                    <select
                      value={newStudentSection}
                      onChange={(e) => setNewStudentSection(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 py-2.5 px-2 rounded-xl text-xs font-bold text-slate-800 focus:ring-1 focus:ring-indigo-100 outline-none transition-all"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-indigo-600 flex items-center gap-1">
                      Assigned Roll
                      <Sparkles size={10} className="text-amber-500 animate-pulse" />
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. 1007"
                      value={newStudentRoll}
                      onChange={(e) => {
                        setNewStudentRoll(e.target.value);
                        if (formErrors.rollNumber) {
                          setFormErrors(prev => ({ ...prev, rollNumber: '' }));
                        }
                      }}
                      className={`w-full py-2.5 px-2.5 rounded-xl text-xs font-mono font-bold outline-none transition-all ${
                        formErrors.rollNumber 
                          ? 'bg-rose-50 border border-rose-500 text-rose-950 focus:ring-rose-200 focus:bg-white' 
                          : 'bg-indigo-50/10 border border-indigo-200 text-indigo-950 focus:ring-indigo-200 focus:bg-white'
                      }`}
                    />
                  </div>

                </div>
                {formErrors.rollNumber && (
                  <p className="text-[9px] text-rose-600 font-bold uppercase tracking-wide mt-1">{formErrors.rollNumber}</p>
                )}

                {/* Parents details block */}
                <div className="bg-slate-50/70 py-4 px-4 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider">Guardians/Parents Dossier</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Father's Name *</label>
                      <input 
                        type="text"
                        required
                        placeholder="Shri. Rajesh Sharma"
                        value={newStudentFather}
                        onChange={(e) => {
                          setNewStudentFather(e.target.value);
                          if (formErrors.fatherName) {
                            setFormErrors(prev => ({ ...prev, fatherName: '' }));
                          }
                        }}
                        className={`w-full bg-white border py-2 px-3 rounded-xl text-xs font-medium outline-none ${
                          formErrors.fatherName ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100'
                        }`}
                      />
                      {formErrors.fatherName && (
                        <p className="text-[9px] text-rose-600 font-semibold">{formErrors.fatherName}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Mother's Name *</label>
                      <input 
                        type="text"
                        required
                        placeholder="Smt. Sunita Sharma"
                        value={newStudentMother}
                        onChange={(e) => {
                          setNewStudentMother(e.target.value);
                          if (formErrors.motherName) {
                            setFormErrors(prev => ({ ...prev, motherName: '' }));
                          }
                        }}
                        className={`w-full bg-white border py-2 px-3 rounded-xl text-xs font-medium outline-none ${
                          formErrors.motherName ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100'
                        }`}
                      />
                      {formErrors.motherName && (
                        <p className="text-[9px] text-rose-600 font-semibold">{formErrors.motherName}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Photo Upload Panel */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400">Student Photograph (Optional)</label>
                  
                  {newStudentPhoto ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center group">
                      <img 
                        src={newStudentPhoto} 
                        alt="Preview" 
                        referrerPolicy="no-referrer"
                        className="h-full w-auto object-contain" 
                      />
                      <button
                        type="button"
                        onClick={() => setNewStudentPhoto('')}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        title="Remove photo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsPhotoDragging(true);
                      }}
                      onDragLeave={() => setIsPhotoDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsPhotoDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('image/')) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setNewStudentPhoto(event.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      onClick={() => {
                        const fileInput = document.getElementById('student-photo-file-form') as HTMLInputElement;
                        fileInput?.click();
                      }}
                      className={`w-full py-6 px-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                        isPhotoDragging 
                          ? 'border-indigo-500 bg-indigo-50/45' 
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
                      }`}
                    >
                      <input 
                        id="student-photo-file-form"
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                             const reader = new FileReader();
                             reader.onload = (ev) => {
                               if (ev.target?.result) {
                                 setNewStudentPhoto(ev.target.result as string);
                               }
                             };
                             reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <p className="text-xs font-bold text-slate-700">Drag & Drop Photograph</p>
                      <p className="text-[9px] text-slate-400">or click to browse from local computer files</p>
                    </div>
                  )}
                </div>

                {/* Dob & Contact Info */}
                <div className="grid grid-cols-2 gap-4">

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 flex justify-between">
                      <span>Date of Birth *</span>
                      <span className="text-indigo-500 font-mono tracking-tighter">DD/MM/YYYY</span>
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="DD/MM/YYYY"
                      value={newStudentDob}
                      onChange={(e) => {
                        const val = formatDobInput(e.target.value);
                        setNewStudentDob(val);
                        if (formErrors.dob) {
                          setFormErrors(prev => ({ ...prev, dob: '' }));
                        }
                      }}
                      className={`w-full bg-slate-50 border py-2.5 px-3 rounded-xl text-xs font-mono font-semibold focus:bg-white outline-none transition-all ${
                        formErrors.dob ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100'
                      }`}
                    />
                    {formErrors.dob && (
                      <p className="text-[9px] text-rose-600 font-bold uppercase tracking-wide leading-tight mt-0.5">{formErrors.dob}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 flex justify-between">
                      <span>Contact Number *</span>
                      <span className="text-indigo-500 font-mono tracking-tighter">XXX-XXX-XXXX</span>
                    </label>
                    <input 
                      type="tel"
                      required
                      placeholder="e.g. XXX-XXX-XXXX"
                      value={newStudentContact}
                      onChange={(e) => {
                        const val = formatContactNumber(e.target.value);
                        setNewStudentContact(val);
                        if (formErrors.contact) {
                          setFormErrors(prev => ({ ...prev, contact: '' }));
                        }
                      }}
                      className={`w-full bg-slate-50 border py-2.5 px-3 rounded-xl text-xs font-mono font-semibold focus:bg-white outline-none transition-all ${
                        formErrors.contact ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100'
                      }`}
                    />
                    {formErrors.contact && (
                      <p className="text-[9px] text-rose-600 font-bold uppercase tracking-wide leading-tight mt-0.5">{formErrors.contact}</p>
                    )}
                  </div>

                </div>

                {/* Actions Footer inside clean block */}
                <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end shrink-0">
                  <button 
                    type="button"
                    onClick={() => setIsAddStudentModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 transition-all"
                  >
                    Commit Dossier
                  </button>
                </div>

              </form>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default SchoolERPApp;
