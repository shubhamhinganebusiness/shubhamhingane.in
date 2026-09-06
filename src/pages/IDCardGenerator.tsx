import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LANGUAGES, 
  INITIAL_DESIGN, 
  INITIAL_STUDENT, 
  IDCardDesign, 
  Student, 
  CardStatus, 
  TemplateStyle 
} from '../types/idCard';
import { IDCardPreview } from '../components/idcard/IDCardPreview';
import { WizardIntro } from '../components/idcard/WizardIntro';
import { generateBulkPDF } from '../utils/idCardGenerator';
import { 
  Sliders, 
  Upload, 
  Users, 
  Save, 
  Database, 
  Search, 
  Check, 
  Trash2, 
  Plus, 
  RefreshCw, 
  HelpCircle, 
  Settings, 
  Globe, 
  ArrowLeft,
  ChevronDown, 
  Undo, 
  Redo, 
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';

export const IDCardGenerator: React.FC = () => {
  const navigate = useNavigate();

  // Primary state buckets
  const [language, setLanguage] = useState<'en' | 'hi' | 'es'>('en');
  const [activeTab, setActiveTab] = useState<'design' | 'bulk' | 'database' | 'templates'>('design');
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [savedLogs, setSavedLogs] = useState<boolean>(false);

  const [design, setDesign] = useState<IDCardDesign>(INITIAL_DESIGN);
  const [student, setStudent] = useState<Student>(INITIAL_STUDENT);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<IDCardDesign[]>([]);

  // CSV Mapping & Bulk States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState({
    id: '',
    name: '',
    role: '',
    department: '',
    bloodGroup: '',
    dob: '',
    validUntil: '',
    emergencyContact: ''
  });
  const [bulkGenerating, setBulkGenerating] = useState<boolean>(false);
  const [bulkSides, setBulkSides] = useState<'both' | 'front' | 'back'>('both');
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  // Database Management Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | CardStatus>('All');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Batch updates block
  const [batchExpiryDate, setBatchExpiryDate] = useState<string>('');

  // Undo / Redo engine
  const [undoHistory, setUndoHistory] = useState<IDCardDesign[]>([]);
  const [redoHistory, setRedoHistory] = useState<IDCardDesign[]>([]);

  // Teacher student data addition states
  const [teacherForm, setTeacherForm] = useState<Student>({
    id: '',
    name: '',
    role: 'Student',
    department: '',
    bloodGroup: 'O+',
    dob: '',
    validUntil: '',
    emergencyContact: '',
    photo: '',
    status: 'Active',
    createdAt: ''
  });
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const t = LANGUAGES[language];

  // Local storage cache syncer
  useEffect(() => {
    // 1. Initialise tutorial walkthrough
    const hasSeenIntro = localStorage.getItem('zenid_tutorial');
    if (hasSeenIntro !== 'true') {
      setShowWizard(true);
      localStorage.setItem('zenid_tutorial', 'true');
    }

    // 2. Load designs
    const cachedDesign = localStorage.getItem('zenid_design');
    if (cachedDesign) {
      try { setDesign(JSON.parse(cachedDesign)); } catch (_) {}
    }

    // 3. Load students list
    const cachedStudents = localStorage.getItem('zenid_students');
    if (cachedStudents) {
      try { 
        setAllStudents(JSON.parse(cachedStudents)); 
      } catch (_) {}
    } else {
      // Seed default students for demonstrations
      const seedData: Student[] = [
        { ...INITIAL_STUDENT, id: 'STU-2026-001', name: 'Alex Rivera', role: 'Student', department: 'Bio-Technology', bloodGroup: 'O+', status: 'Active' },
        { ...INITIAL_STUDENT, id: 'STU-2026-015', name: 'Meera Sharma', role: 'Student', department: 'Electrical Engineering', bloodGroup: 'A+', status: 'Active' },
        { ...INITIAL_STUDENT, id: 'STU-2026-042', name: 'Carlos Gomez', role: 'Faculty', department: 'Quantum Physics', bloodGroup: 'AB-', status: 'Active' },
        { ...INITIAL_STUDENT, id: 'STU-2026-104', name: 'Zahra Patel', role: 'Student', department: 'Computer Science', bloodGroup: 'B-', status: 'Expired' }
      ];
      setAllStudents(seedData);
      localStorage.setItem('zenid_students', JSON.stringify(seedData));
    }

    // 4. Load saved templates
    const cachedTemplates = localStorage.getItem('zenid_saved_templates');
    if (cachedTemplates) {
      try { setSavedTemplates(JSON.parse(cachedTemplates)); } catch (_) {}
    }
  }, []);

  // Set-up auto-save helper (every 30 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem('zenid_design', JSON.stringify(design));
      setSavedLogs(true);
      setTimeout(() => setSavedLogs(false), 2000);
    }, 30000);

    return () => clearInterval(timer);
  }, [design]);

  // Keyboard Shortcuts for professional desktop-like Undo/Redo operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl && 
        (activeEl.tagName === 'INPUT' || 
         activeEl.tagName === 'TEXTAREA' || 
         activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      const key = e.key?.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && key === 'z') {
        if (undoHistory.length > 0) {
          e.preventDefault();
          handleUndo();
        }
      } else if (
        ((e.ctrlKey || e.metaKey) && key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'z')
      ) {
        if (redoHistory.length > 0) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoHistory, redoHistory, design]);

  // Handle design state push helper to support robust undos/redos
  const updateDesignState = (newDesign: IDCardDesign) => {
    setUndoHistory([...undoHistory, design]);
    setRedoHistory([]);
    setDesign(newDesign);
    localStorage.setItem('zenid_design', JSON.stringify(newDesign));
  };

  const handleUndo = () => {
    if (undoHistory.length === 0) return;
    const prev = undoHistory[undoHistory.length - 1];
    setRedoHistory([design, ...redoHistory]);
    setUndoHistory(undoHistory.slice(0, -1));
    setDesign(prev);
  };

  const handleRedo = () => {
    if (redoHistory.length === 0) return;
    const next = redoHistory[0];
    setUndoHistory([...undoHistory, design]);
    setRedoHistory(redoHistory.slice(1));
    setDesign(next);
  };

  // Base64 generic file compressor
  const handleImageSelector = (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (base64: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 400; // Limit image bounds for responsive lightness

        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          callback(compressedBase64);
        } else {
          callback(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Saved templates operations
  const handleSaveTemplate = () => {
    const nameInput = prompt('Enter a name for this ID template:', design.name);
    if (!nameInput) return;

    const newTpl: IDCardDesign = {
      ...design,
      id: Date.now().toString(),
      name: nameInput
    };

    const nextTemplates = [...savedTemplates, newTpl];
    setSavedTemplates(nextTemplates);
    localStorage.setItem('zenid_saved_templates', JSON.stringify(nextTemplates));
    alert('Template saved perfectly to collection!');
  };

  const handleLoadTemplate = (tpl: IDCardDesign) => {
    updateDesignState(tpl);
    alert(`Loaded "${tpl.name}" as current styling preset!`);
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this template form local list?')) return;
    const nextTemplates = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(nextTemplates);
    localStorage.setItem('zenid_saved_templates', JSON.stringify(nextTemplates));
  };

  // Student Database CRUD operations
  const handleSaveStudent = () => {
    const exists = allStudents.some(s => s.id === student.id);
    let updated: Student[];

    if (exists) {
      if (!confirm(`An ID record with Number ${student.id} already exists. Do you want to update it?`)) return;
      updated = allStudents.map(s => s.id === student.id ? { ...student, createdAt: new Date().toISOString() } : s);
    } else {
      updated = [student, ...allStudents];
    }

    setAllStudents(updated);
    localStorage.setItem('zenid_students', JSON.stringify(updated));
    alert('Student profile synced cleanly with internal database!');
  };

  const handleDeleteStudent = (id: string) => {
    if (!confirm(`Are you sure you want to revoke and delete Student ${id}?`)) return;
    const updated = allStudents.filter(s => s.id !== id);
    setAllStudents(updated);
    localStorage.setItem('zenid_students', JSON.stringify(updated));
  };

  const handleEditStudent = (tgt: Student) => {
    setStudent(tgt);
    setActiveTab('design');
    // Scroll window smoothly to designer area
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleBatchExpiryUpdate = () => {
    if (!batchExpiryDate) {
      alert('Please specify a valid expiry date to deploy.');
      return;
    }
    if (!confirm(`Apply validity expire: ${new Date(batchExpiryDate).toLocaleDateString()} to all Active records?`)) return;

    const updated = allStudents.map(s => {
      if (s.status === 'Active') {
        return { ...s, validUntil: batchExpiryDate };
      }
      return s;
    });

    setAllStudents(updated);
    localStorage.setItem('zenid_students', JSON.stringify(updated));
    alert(`Batch updated ${allStudents.filter(s => s.status === 'Active').length} Active student expiry parameters successfully!`);
    setBatchExpiryDate('');
  };

  // PapaParse CSV loader integration
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headers = Object.keys(results.data[0]);
          setCsvHeaders(headers);
          setCsvRows(results.data);

          // Auto map columns fuzzy guessing titles!
          const newMap = { ...mapping };
          headers.forEach(h => {
            const hLower = h.toLowerCase().trim();
            if (hLower.includes('name') || hLower.includes('fullname')) newMap.name = h;
            else if (hLower.includes('id') || hLower.includes('enroll') || hLower.includes('number')) newMap.id = h;
            else if (hLower.includes('dept') || hLower.includes('class') || hLower.includes('course')) newMap.department = h;
            else if (hLower.includes('blood') || hLower.includes('group')) newMap.bloodGroup = h;
            else if (hLower.includes('role') || hLower.includes('type')) newMap.role = h;
            else if (hLower.includes('dob') || hLower.includes('birth')) newMap.dob = h;
            else if (hLower.includes('valid') || hLower.includes('expire')) newMap.validUntil = h;
            else if (hLower.includes('contact') || hLower.includes('emergency')) newMap.emergencyContact = h;
          });
          setMapping(newMap);
        }
      },
      error: () => {
        alert('Failed parsing the specified CSV file containing database.');
      }
    });
  };

  const triggerBulkPDFGeneration = async () => {
    if (csvRows.length === 0) return;
    
    // Convert parsed CSV rows according to mapped parameters list
    const mappedStudents: Student[] = csvRows.map((row, idx) => {
      // Validate or fall back safely for empty column metrics
      return {
        id: row[mapping.id] || `STU-${1000 + idx}`,
        name: row[mapping.name] || 'Anonymous Holder',
        role: (row[mapping.role] || 'Student') as any,
        department: row[mapping.department] || 'Academics',
        bloodGroup: row[mapping.bloodGroup] || 'O+',
        dob: row[mapping.dob] || '2004-11-20',
        validUntil: row[mapping.validUntil] || '2028-06-30',
        emergencyContact: row[mapping.emergencyContact] || '+1 (555) 000-0000',
        photo: '', // Base64 profiles can be loaded sequentially or bypassed during bulk CSV for default frames representation
        status: 'Active',
        createdAt: new Date().toISOString()
      };
    });

    setBulkGenerating(true);
    try {
      const pdf = await generateBulkPDF(design, mappedStudents, bulkSides, (curr, tot) => {
        setBulkProgress({ current: curr, total: tot });
      });
      pdf.save(`Bulk_ID_Cards_Batch_${Date.now()}.pdf`);
      
      // Merge compiled students cleanly into global Indexed / Local database too to keep search valid!
      const mergedList = [...mappedStudents, ...allStudents].filter(
        (val, idIdx, self) => self.findIndex(t => t.id === val.id) === idIdx
      );
      setAllStudents(mergedList);
      localStorage.setItem('zenid_students', JSON.stringify(mergedList));
      alert(`Bulk batch with ${mappedStudents.length} entries has generated flawlessly and saved as Print PDF!`);
    } catch (err) {
      console.error('Core bulk compiler failed:', err);
    } finally {
      setBulkGenerating(false);
      setBulkProgress({ current: 0, total: 0 });
    }
  };

  // Filter conditions
  const filteredStudents = allStudents.filter(s => {
    const qMatches = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     s.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const sMatches = statusFilter === 'All' ? true : s.status === statusFilter;
    return qMatches && sMatches;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#07070b] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Navigation Sub-App Header */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="p-2 ml-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 text-slate-600 dark:text-gray-300 rounded-xl transition-all cursor-pointer transform active:scale-95"
            title="Return to Main hub"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="text-left">
            <h1 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-widest flex items-center gap-1.5 leading-none">
              <Sparkles size={14} className="text-blue-500 animate-pulse" />
              ZenID Design Studio
            </h1>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block mt-0.5">
              Dual-Side Student / Faculty ID Cards Engine
            </span>
          </div>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex items-center gap-3">
          
          {/* Quick Auto-save notification pill */}
          {savedLogs && (
            <span className="hidden md:inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
              <Check size={10} className="stroke-[3]" />
              {t.autoSaved}
            </span>
          )}

          {/* Undo/Redo design buttons */}
          <div className="hidden sm:flex items-center gap-1 border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-1 rounded-xl">
            <button
              onClick={handleUndo}
              disabled={undoHistory.length === 0}
              className={`p-2 rounded-lg transition-all ${
                undoHistory.length > 0 
                  ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer' 
                  : 'text-slate-300 dark:text-slate-700 opacity-40 cursor-not-allowed'
              }`}
              title="Undo design change"
            >
              <Undo size={14} />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoHistory.length === 0}
              className={`p-2 rounded-lg transition-all ${
                redoHistory.length > 0 
                  ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer' 
                  : 'text-slate-300 dark:text-slate-700 opacity-40 cursor-not-allowed'
              }`}
              title="Redo design change"
            >
              <Redo size={14} />
            </button>
          </div>

          {/* Multilingual Selector */}
          <div className="relative group">
            <button className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/60 text-slate-800 dark:text-slate-200 hover:text-slate-900 rounded-xl border border-transparent dark:border-slate-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all">
              <Globe size={12} className="text-blue-500" />
              {language}
              <ChevronDown size={10} className="stroke-[3]" />
            </button>
            <div className="absolute right-0 top-11 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-2 w-32 shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 flex flex-col gap-1 z-30">
              {(['en', 'hi', 'es'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`w-full py-2 px-3 text-left rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${
                    language === lang 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {lang === 'en' ? 'ENGLISH' : lang === 'hi' ? 'हिंदी' : 'ESPAÑOL'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowWizard(true)}
            className="p-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer transform active:scale-95"
            title="Open guided tour"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </nav>

      {/* Main Layout Area */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-32 pb-24 space-y-10">
        
        {/* Intro description */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="px-4 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black tracking-widest uppercase text-[10px] rounded-full">
            REGULAR CR80 SIZE STANDARD
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-slate-950 dark:text-white tracking-tight pt-1 leading-none">
            {t.title}
          </h2>
          <p className="text-xs md:text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {t.subtitle}
          </p>
        </div>

        {/* Tab Navigation Bars */}
        <div className="flex bg-slate-100/80 dark:bg-slate-900/40 p-1.5 rounded-[1.5rem] border border-slate-200/30 dark:border-slate-800/50 max-w-4xl mx-auto">
          {([
            { id: 'design', label: t.tabDesign, icon: Sliders },
            { id: 'bulk', label: t.tabBulk, icon: Upload },
            { id: 'database', label: t.tabDatabase, icon: Database },
            { id: 'templates', label: t.tabTemplates, icon: Save }
          ] as const).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 px-2 rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest flex items-center justify-center gap-1.5 md:gap-2 transition-all transform active:scale-98 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15 font-black scale-102'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/10'
                }`}
              >
                <Icon size={12} className={isActive ? 'stroke-[2.5]' : ''} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic active tab page contexts */}
        <div>
          {activeTab === 'design' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column Settings Sidebar controllers (col-span-5) */}
              <div className="lg:col-span-6 space-y-8">
                
                {/* 1. Brand templates & Colors Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800/60 pb-4">
                    <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                      <Settings size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                        {t.templates} & {t.colors}
                      </h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mt-0.5">
                        Configure backgrounds and border aesthetics
                      </p>
                    </div>
                  </div>

                  {/* Template grid selector */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Select Base Template
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {([
                        { id: 'modern', label: 'Modern Curved', desc: 'Diagonals & Orbs' },
                        { id: 'classic', label: 'Classic School', desc: 'Colored Banner Head' },
                        { id: 'minimal', label: 'Pure Minimalist', desc: 'Borders & Whitespace' },
                        { id: 'corporate', label: 'Steel Corporate', desc: 'Dark Charcoal Header' }
                      ] as const).map((style) => (
                        <button
                          key={style.id}
                          onClick={() => updateDesignState({ ...design, templateStyle: style.id })}
                          className={`p-4 rounded-2xl text-left border transition-all transform active:scale-95 cursor-pointer ${
                            design.templateStyle === style.id
                              ? 'border-blue-600 bg-blue-500/5 dark:bg-blue-600/5 shadow-sm'
                              : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/20'
                          }`}
                        >
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 block">
                            {style.label}
                          </span>
                          <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold block uppercase tracking-wider mt-0.5">
                            {style.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brand color pickers block */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                        Primary Color
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={design.primaryColor}
                          onChange={(e) => updateDesignState({ ...design, primaryColor: e.target.value })}
                          className="h-10 w-10 p-0 border-0 rounded-xl cursor-pointer shadow-sm bg-transparent"
                        />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{design.primaryColor}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                        Secondary Color
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={design.secondaryColor}
                          onChange={(e) => updateDesignState({ ...design, secondaryColor: e.target.value })}
                          className="h-10 w-10 p-0 border-0 rounded-xl cursor-pointer shadow-sm bg-transparent"
                        />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{design.secondaryColor}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                        Text Color
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={design.textColor}
                          onChange={(e) => updateDesignState({ ...design, textColor: e.target.value })}
                          className="h-10 w-10 p-0 border-0 rounded-xl cursor-pointer shadow-sm bg-transparent"
                        />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{design.textColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Grid overlay rules and guides */}
                  <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/60 pt-4">
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 block">
                        {t.guides} Overlay
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block mt-0.5">
                        Superimpose grids for layout coordinate alignment
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={design.showGrid}
                        onChange={(e) => updateDesignState({ ...design, showGrid: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Orientation choice */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                      Card Orientation
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['portrait', 'landscape'] as const).map((orient) => (
                        <button
                          key={orient}
                          type="button"
                          onClick={() => updateDesignState({ ...design, orientation: orient })}
                          className={`py-3 px-4 rounded-xl text-left border font-black uppercase tracking-widest text-[9px] flex items-center justify-between transition-all transform active:scale-95 cursor-pointer ${
                            design.orientation === orient
                              ? 'border-blue-600 bg-blue-500/5 text-blue-600'
                              : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {orient}
                          <span className={`w-2.5 h-2.5 rounded-full ${orient === 'portrait' ? 'aspect-[54/85.6] border border-current' : 'aspect-[85.6/54] border border-current'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Watermark slide input */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {t.watermark} Label
                      </label>
                      <span className="text-[10px] font-bold text-slate-500">{(design.watermarkOpacity * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. OFFICIAL ID"
                      value={design.watermarkText}
                      onChange={(e) => updateDesignState({ ...design, watermarkText: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-800 dark:text-white"
                    />
                    <input
                      type="range"
                      min="0"
                      max="0.4"
                      step="0.02"
                      value={design.watermarkOpacity}
                      onChange={(e) => updateDesignState({ ...design, watermarkOpacity: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* 2. Official Authority Credentials (Logos, Sigs) Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800/60 pb-4">
                    <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
                      <Settings size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                        {t.schoolDetails}
                      </h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mt-0.5">
                        Set institution name, upload school emblem and credentials sigs
                      </p>
                    </div>
                  </div>

                  {/* Institution Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Institution Name
                    </label>
                    <input
                      type="text"
                      value={design.institutionName}
                      onChange={(e) => updateDesignState({ ...design, institutionName: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/40 font-extrabold text-xs text-slate-800 dark:text-slate-155 [text-transform:uppercase]"
                    />
                  </div>

                  {/* Drag-n-Drop Logo Selector & Drag-n-Drop Signature Selector side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Logo DropBox */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                        {t.logoUpload} (150x150)
                      </span>
                      <div className="border border-dashed border-slate-200 dark:border-slate-850 p-4 rounded-2xl bg-slate-50/50 dark:bg-[#090911] text-center flex flex-col items-center justify-center relative min-h-[110px]">
                        {design.institutionLogo ? (
                          <div className="relative group">
                            <img src={design.institutionLogo} alt="Institution Logo" className="h-14 w-14 object-contain rounded-lg bg-white p-1" />
                            <button
                              onClick={() => updateDesignState({ ...design, institutionLogo: '' })}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full text-[8px] font-black cursor-pointer shadow-sm"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center">
                            <Upload size={18} className="text-gray-450 hover:scale-110 transition-transform mb-1.5" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Select Emblem</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageSelector(e, (base64) => updateDesignState({ ...design, institutionLogo: base64 }))}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Signature DropBox */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                        {t.signatureUpload}
                      </span>
                      <div className="border border-dashed border-slate-200 dark:border-slate-850 p-4 rounded-2xl bg-slate-50/50 dark:bg-[#090911] text-center flex flex-col items-center justify-center relative min-h-[110px]">
                        {design.authorizedSignature ? (
                          <div className="relative group">
                            <img src={design.authorizedSignature} alt="Authorized Signature" className="h-12 w-20 object-contain rounded-lg bg-white p-1" />
                            <button
                              onClick={() => updateDesignState({ ...design, authorizedSignature: '' })}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full text-[8px] font-black cursor-pointer shadow-sm"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center">
                            <Upload size={18} className="text-gray-450 hover:scale-110 transition-transform mb-1.5" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Select Signature</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageSelector(e, (base64) => updateDesignState({ ...design, authorizedSignature: base64 }))}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Field hide/show settings sliders */}
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-50 dark:border-slate-800/60 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-350">
                        Hide Card Back Barcode
                      </span>
                      <input
                        type="checkbox"
                        checked={design.hideBarcode}
                        onChange={(e) => updateDesignState({ ...design, hideBarcode: e.target.checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-350">
                        Hide Card Back QR Code
                      </span>
                      <input
                        type="checkbox"
                        checked={design.hideQRCode}
                        onChange={(e) => updateDesignState({ ...design, hideQRCode: e.target.checked })}
                      />
                    </div>
                  </div>

                </div>

                {/* 3. Individual Holder Profile Fields */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800/60 pb-4">
                    <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                      <Users size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                        {t.studentDetails}
                      </h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mt-0.5">
                        Set specific holder fields data dynamically
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Portrait Photo SelectBox */}
                    <div className="space-y-2 md:col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                        {t.photoUpload} (200x200 Portrait Frame)
                      </span>
                      <div className="border border-dashed border-slate-200 dark:border-slate-850 p-4 rounded-2xl bg-slate-50/50 dark:bg-[#090911] text-center flex items-center justify-center gap-4 min-h-[90px]">
                        {student.photo ? (
                          <div className="relative group shrink-0">
                            <img src={student.photo} alt="Student Photograph" className="h-14 w-12 object-cover rounded-lg bg-slate-100 border border-slate-200" />
                            <button
                              onClick={() => setStudent({ ...student, photo: '' })}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full text-[8px] font-black cursor-pointer shadow-sm"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer shrink-0 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-600 transition-all rounded-xl text-center flex items-center justify-center">
                            <Upload size={14} className="text-blue-600 hover:scale-110 transition-transform mr-1.5" />
                            <span className="text-[9px] font-black text-slate-800 dark:text-gray-200 uppercase tracking-widest">Upload photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageSelector(e, (base64) => setStudent({ ...student, photo: base64 }))}
                            />
                          </label>
                        )}
                        <p className="text-[9px] font-bold text-yellow-600 uppercase tracking-wider text-left bg-yellow-500/10 p-2.5 rounded-xl flex items-start gap-1">
                          <Info size={12} className="shrink-0" />
                          Recommended: Clean white portrait background with face visible. Image is auto-cropped and compressed.
                        </p>
                      </div>
                    </div>

                    {/* Holder Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Holder Name
                      </label>
                      <input
                        type="text"
                        maxLength={24}
                        value={student.name}
                        onChange={(e) => setStudent({ ...student, name: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-800 dark:text-white"
                      />
                      <span className="text-[9px] text-gray-400 font-extrabold block text-right">
                        {student.name.length}/24 characters
                      </span>
                    </div>

                    {/* Role selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Holder Role Status
                      </label>
                      <select
                        value={student.role}
                        onChange={(e) => setStudent({ ...student, role: e.target.value as any })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl font-extrabold text-[10.5px] uppercase tracking-widest text-slate-800 dark:text-white"
                      >
                        <option value="Student">Student (Minor)</option>
                        <option value="Faculty">Faculty (Professor)</option>
                        <option value="Staff">Official Staff</option>
                      </select>
                    </div>

                    {/* Enrollment code */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        ID/Enrollment Number
                      </label>
                      <input
                        type="text"
                        value={student.id}
                        onChange={(e) => setStudent({ ...student, id: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-800 dark:text-white"
                      />
                    </div>

                    {/* Department */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Class/Department
                      </label>
                      <input
                        type="text"
                        value={student.department}
                        onChange={(e) => setStudent({ ...student, department: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-800 dark:text-white"
                      />
                    </div>

                    {/* Blood Group */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Blood Group
                      </label>
                      <select
                        value={student.bloodGroup}
                        onChange={(e) => setStudent({ ...student, bloodGroup: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl font-extrabold text-[10.5px] uppercase tracking-widest text-slate-800 dark:text-white"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date Of Birth */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={student.dob}
                        onChange={(e) => setStudent({ ...student, dob: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                      />
                    </div>

                    {/* Valid until */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Valid Until Expiry
                      </label>
                      <input
                        type="date"
                        value={student.validUntil}
                        onChange={(e) => setStudent({ ...student, validUntil: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                      />
                    </div>

                    {/* Emergency Contact */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Emergency Contact
                      </label>
                      <input
                        type="text"
                        value={student.emergencyContact}
                        onChange={(e) => setStudent({ ...student, emergencyContact: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                      />
                    </div>

                  </div>

                  {/* Primary Save triggers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-50 dark:border-slate-800/60">
                    <button
                      onClick={handleSaveStudent}
                      className="flex items-center justify-center gap-1.5 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all transform active:scale-95 cursor-pointer"
                    >
                      <Database size={13} className="stroke-[2.5]" />
                      Register Record
                    </button>
                    <button
                      onClick={handleSaveTemplate}
                      className="flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all transform active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      <Save size={13} />
                      Save Template
                    </button>
                  </div>

                </div>

              </div>

              {/* Right Column previews stage (col-span-7) */}
              <div className="lg:col-span-6 lg:sticky lg:top-24">
                <IDCardPreview 
                  design={design} 
                  student={student} 
                  language={language}
                  translations={t}
                  onUpdateDesign={updateDesignState}
                />
              </div>

            </div>
          )}

          {activeTab === 'bulk' && (
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 md:p-10 rounded-[2.5rem] shadow-sm space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-50 dark:border-slate-800/60 pb-6">
                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                  <Upload size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    {t.tabBulk} Dashboard
                  </h3>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mt-0.5">
                    Generate over 500+ ID cards simultaneously via CSV spreadsheet mappings
                  </p>
                </div>
              </div>

              {/* Upload field action */}
              <div className="border border-dashed border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/50 text-center flex flex-col items-center justify-center relative min-h-[160px]">
                {csvFile ? (
                  <div className="space-y-4">
                    <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                      File Loaded Successfully
                    </span>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white mt-2">
                      {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                    </h4>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Parsed {csvRows.length} total student records in file
                    </p>
                    <button
                      onClick={() => {
                        setCsvFile(null);
                        setCsvHeaders([]);
                        setCsvRows([]);
                      }}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-650 text-[10px] font-black uppercase tracking-widest rounded-full transition-all cursor-pointer"
                    >
                      Clear File
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center p-6">
                    <Upload size={32} className="text-gray-450 hover:scale-110 transition-transform mb-3" />
                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest block">
                      Choose spreadsheet file
                    </span>
                    <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider block mt-1">
                      Drag and drop .CSV database file here (Comma separated format)
                    </span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleCSVUpload}
                    />
                  </label>
                )}
              </div>

              {/* CSV headers mapping section */}
              {csvRows.length > 0 && (
                <div className="space-y-6 border-t border-slate-50 dark:border-slate-800/60 pt-6 animate-fade-in">
                  <div className="text-left space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#1d4ed8]">
                      {t.csvMapping}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">
                      Map CSV column headers to template variables:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {Object.keys(mapping).map((fieldKey) => (
                      <div key={fieldKey} className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-gray-300">
                          {fieldKey.replace(/([A-Z])/g, ' $1')}:
                        </span>
                        <select
                          value={(mapping as any)[fieldKey]}
                          onChange={(e) => setMapping({ ...mapping, [fieldKey]: e.target.value })}
                          className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white max-w-[200px]"
                        >
                          <option value="">-- Discard Field --</option>
                          {csvHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Top 5 Preview Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Record preview (First 5 Items in Spreadsheet)
                    </h4>
                    <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-[11px] leading-relaxed">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            <th className="p-3 font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">#</th>
                            {Object.keys(mapping).map(key => (
                              <th key={key} className="p-3 font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {csvRows.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/40">
                              <td className="p-3 font-bold">{idx + 1}</td>
                              {Object.keys(mapping).map(key => {
                                const colHeader = (mapping as any)[key];
                                return (
                                  <td key={key} className="p-3 font-medium text-slate-650 dark:text-slate-300">
                                    {row[colHeader] || <span className="text-gray-400 italic">No Map</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Loader progress indicator and download trigger */}
                  <div className="p-6 bg-blue-500/5 dark:bg-blue-600/5 rounded-3xl border border-blue-500/10 space-y-4">
                    {bulkGenerating ? (
                      <div className="space-y-3 text-center">
                        <div className="flex justify-between items-center text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                          <span>Rendering dual-sided canvas sheets...</span>
                          <span>{bulkProgress.current} / {bulkProgress.total}</span>
                        </div>
                        <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 transition-all duration-200 rounded-full"
                            style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">
                          System is processing items in micro-chunks. Please do not close browser tab.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="space-y-1 text-left">
                          <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">
                            Ready for batch compiler sequence
                          </h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                            Generates consecutively collated printable PDF based on your choice below
                          </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                          {/* Bulk Sides Segment Select */}
                          <div className="flex bg-slate-150/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold gap-1 w-full sm:w-auto justify-center">
                            {(['both', 'front', 'back'] as const).map((side) => (
                              <button
                                key={side}
                                type="button"
                                onClick={() => setBulkSides(side)}
                                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer text-[9px] font-black uppercase tracking-widest ${
                                  bulkSides === side
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-650 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                }`}
                              >
                                {side === 'both' ? 'Both Sides' : `${side} Only`}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={triggerBulkPDFGeneration}
                            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-blue-500/10 transform active:scale-95 cursor-pointer w-full sm:w-auto whitespace-nowrap"
                          >
                            Compile & Download Batch
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

          {activeTab === 'database' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 md:p-10 rounded-[2.5rem] shadow-sm space-y-8">
              
              <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800/60 pb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                    <Database size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white">
                      {t.databaseTitle} ({filteredStudents.length} item logs)
                    </h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mt-0.5">
                      View, edit, search, revoke profiles or perform batch date modifiers
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
                  {/* Teacher: Register New Student Action Button */}
                  <button
                    onClick={() => {
                      setTeacherForm({
                        id: `STU-2026-${Math.floor(100 + Math.random() * 900)}`,
                        name: '',
                        role: 'Student',
                        department: '',
                        bloodGroup: 'O+',
                        dob: '',
                        validUntil: '',
                        emergencyContact: '',
                        photo: '',
                        status: 'Active',
                        createdAt: ''
                      });
                      setShowAddForm(!showAddForm);
                    }}
                    className="px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-95 shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap self-stretch sm:self-auto"
                  >
                    <Plus size={14} className="stroke-[3]" />
                    {showAddForm ? 'Close Form' : 'Register Student'}
                  </button>

                  {/* Batch Updates block inside sidebar */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="text-left">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Batch Expire Update</span>
                      <input
                        type="date"
                        value={batchExpiryDate}
                        onChange={(e) => setBatchExpiryDate(e.target.value)}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-white mt-1"
                      />
                    </div>
                    <button
                      onClick={handleBatchExpiryUpdate}
                      className="mt-4 px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border border-transparent dark:border-slate-700"
                    >
                      Deploy
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible Teacher: Add Student Form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border border-emerald-500/15 bg-emerald-500/5 dark:bg-emerald-950/10 p-6 md:p-8 rounded-[2rem] space-y-6 overflow-hidden"
                  >
                    <div className="flex items-center gap-3 border-b border-emerald-500/10 pb-4">
                      <div className="p-2 bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 rounded-xl">
                        <Plus size={16} className="stroke-[2.5]" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                          Teacher Portal: Register New ID Record
                        </h4>
                        <p className="text-[10px] font-bold text-emerald-650 dark:text-emerald-450 uppercase tracking-widest block mt-0.5">
                          Quickly insert student details to compile and print
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Photograph selector */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block text-left">
                          Student Photograph
                        </span>
                        <div className="border border-dashed border-slate-200 dark:border-slate-800 p-4 rounded-2xl bg-white dark:bg-slate-950/60 text-center flex flex-col items-center justify-center gap-3 min-h-[160px] shadow-sm">
                          {teacherForm.photo ? (
                            <div className="relative group shrink-0">
                              <img src={teacherForm.photo} alt="Preview" className="h-24 w-20 object-cover rounded-xl bg-slate-100 border border-slate-200 dark:border-slate-800" />
                              <button
                                type="button"
                                onClick={() => setTeacherForm({ ...teacherForm, photo: '' })}
                                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full text-[9px] font-black cursor-pointer shadow-sm"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer shrink-0 p-4 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-600 transition-all rounded-xl text-center flex flex-col items-center justify-center gap-1.5 w-full">
                              <Upload size={18} className="text-emerald-600 hover:scale-115 transition-transform" />
                              <span className="text-[9px] font-black text-slate-800 dark:text-gray-200 uppercase tracking-widest">Select Portrait</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageSelector(e, (base64) => setTeacherForm({ ...teacherForm, photo: base64 }))}
                              />
                            </label>
                          )}
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-normal">
                            Recommended: crisp portrait aspect ratio. File is auto-compressed.
                          </p>
                        </div>
                      </div>

                      {/* Profile data fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-2">
                        {/* Name input */}
                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Student's Full Name*
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. ARYA SHARMA"
                            value={teacherForm.name}
                            onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-850 dark:text-white shadow-sm"
                          />
                        </div>

                        {/* ID input */}
                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Student ID Number*
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. STU-2026-610"
                            value={teacherForm.id}
                            onChange={(e) => setTeacherForm({ ...teacherForm, id: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-850 dark:text-white shadow-sm"
                          />
                        </div>

                        {/* Class input */}
                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Class / Section*
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Grade 12-B"
                            value={teacherForm.department}
                            onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-850 dark:text-white shadow-sm"
                          />
                        </div>

                        {/* DOB input */}
                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Date of Birth*
                          </label>
                          <input
                            type="date"
                            required
                            value={teacherForm.dob}
                            onChange={(e) => setTeacherForm({ ...teacherForm, dob: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-850 dark:text-white shadow-sm"
                          />
                        </div>

                        {/* Blood Group */}
                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Blood Group
                          </label>
                          <select
                            value={teacherForm.bloodGroup}
                            onChange={(e) => setTeacherForm({ ...teacherForm, bloodGroup: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl font-extrabold text-[10px] uppercase tracking-widest text-slate-850 dark:text-white shadow-sm"
                          >
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                              <option key={group} value={group}>{group}</option>
                            ))}
                          </select>
                        </div>

                        {/* Valid until expiry date */}
                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Valid Until Expiry
                          </label>
                          <input
                            type="date"
                            value={teacherForm.validUntil}
                            onChange={(e) => setTeacherForm({ ...teacherForm, validUntil: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-850 dark:text-white shadow-sm"
                          />
                        </div>

                        {/* Emergency Contact */}
                        <div className="space-y-1 text-left sm:col-span-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Emergency Contact Mobile
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. +91 98765 43210"
                            value={teacherForm.emergencyContact}
                            onChange={(e) => setTeacherForm({ ...teacherForm, emergencyContact: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-850 dark:text-white shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-emerald-500/10 flex items-center justify-end gap-3 text-right">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!teacherForm.name.trim()) {
                            alert('Please provide a valid Student name.');
                            return;
                          }
                          if (!teacherForm.id.trim()) {
                            alert('Please state a valid ID Number.');
                            return;
                          }
                          if (!teacherForm.department.trim()) {
                            alert('Please specify the Class/Section.');
                            return;
                          }
                          if (!teacherForm.dob.trim()) {
                            alert('Please select a Date of Birth.');
                            return;
                          }

                          // Check unique ID constraint
                          const existsIdx = allStudents.some(s => s.id.toUpperCase() === teacherForm.id.toUpperCase());
                          if (existsIdx) {
                            alert(`Error: Student ID "${teacherForm.id}" is already allocated to another profile log.`);
                            return;
                          }

                          const record: Student = {
                            ...teacherForm,
                            name: teacherForm.name.toUpperCase(),
                            id: teacherForm.id.toUpperCase(),
                            createdAt: new Date().toISOString(),
                            status: 'Active'
                          };

                          const updated = [record, ...allStudents];
                          setAllStudents(updated);
                          localStorage.setItem('zenid_students', JSON.stringify(updated));
                          setShowAddForm(false);
                          alert(`Success! student file "${record.name}" has been registered safely.`);
                        }}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                      >
                        Register Student Data
                      </button>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

              {/* Filtering bar panel */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* Searchbar */}
                <div className="relative w-full md:max-w-md">
                  <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-5 py-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-800 dark:text-white"
                  />
                </div>

                {/* Status selector */}
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                  {(['All', 'Active', 'Expired', 'Revoked'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-95 whitespace-nowrap ${
                        statusFilter === status
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-400'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

              </div>

              {/* Student datatable list */}
              {filteredStudents.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-extrabold uppercase tracking-widest text-xs">
                  No matching student files found in storage
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-[2rem]">
                  <table className="w-full text-left text-xs leading-relaxed">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="p-4 font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Holder Profile</th>
                        <th className="p-4 font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">ID / Enroll</th>
                        <th className="p-4 font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Department</th>
                        <th className="p-4 font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Blood group</th>
                        <th className="p-4 font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Validity expiry</th>
                        <th className="p-4 font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Status</th>
                        <th className="p-4 font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/40">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {s.photo ? (
                                <img src={s.photo} alt="Portrait placeholder" className="h-10 w-9 object-cover rounded shadow-sm border" />
                              ) : (
                                <div className="h-10 w-9 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-[9px] font-black text-slate-400">
                                  NO IMG
                                </div>
                              )}
                              <div>
                                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase text-[11px] tracking-wide">{s.name}</h4>
                                <span className="text-[9px] bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded text-gray-400 font-black uppercase mt-1 inline-block">
                                  {s.role}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold">{s.id}</td>
                          <td className="p-4 font-bold text-slate-500 uppercase">{s.department}</td>
                          <td className="p-4 font-black text-slate-800 dark:text-white">{s.bloodGroup}</td>
                          <td className="p-4 font-bold text-slate-500">{s.validUntil ? new Date(s.validUntil).toLocaleDateString() : 'N/A'}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              s.status === 'Active'
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-350'
                                : s.status === 'Expired'
                                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-350'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditStudent(s)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 hover:text-slate-950 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer text-slate-650"
                              >
                                Edit Card
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(s.id)}
                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg cursor-pointer transition-all"
                                title="Revoke Card"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

          {activeTab === 'templates' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 md:p-10 rounded-[2.5rem] shadow-sm space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-50 dark:border-slate-800/60 pb-6">
                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                  <Save size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    {t.tabTemplates} List
                  </h3>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mt-0.5">
                    Browse previously archived corporate layout presets or branding matrices
                  </p>
                </div>
              </div>

              {savedTemplates.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-extrabold uppercase tracking-widest text-xs">
                  No customized templates logged. Click "Save Template" in design panel.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => handleLoadTemplate(tpl)}
                      className="p-5 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 hover:border-blue-500/30 rounded-3xl hover:shadow-md transition-all cursor-pointer text-left space-y-4 relative group"
                    >
                      <button
                        onClick={(e) => handleDeleteTemplate(tpl.id || '', e)}
                        className="absolute top-4 right-4 p-2 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg transition-all cursor-pointer"
                        title="Delete template archive"
                      >
                        <Trash2 size={12} />
                      </button>

                      <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider block pr-8">
                          {tpl.name}
                        </h4>
                        <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest block">
                          Style: {tpl.templateStyle} | {tpl.orientation}
                        </span>
                      </div>

                      <div className="flex gap-2 items-center">
                        <span className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: tpl.primaryColor }} />
                        <span className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: tpl.secondaryColor }} />
                        <span className="text-[10px] text-slate-500 font-semibold">{tpl.institutionName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </main>

      {/* Trigger wizard modal overlay walkthrough */}
      <AnimatePresence>
        {showWizard && <WizardIntro onClose={() => setShowWizard(false)} />}
      </AnimatePresence>

    </div>
  );
};

export default IDCardGenerator;
