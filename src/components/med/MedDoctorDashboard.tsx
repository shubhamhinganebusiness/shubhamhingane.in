import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Stethoscope, Users, Plus, Trash2, Send, 
  CheckCircle2, Search, FileText, Pill, Clock,
  Calendar, ArrowLeft, X, AlertCircle, MessageCircle,
  Mail, Printer, Globe, Edit3, Save, Share2, PenTool,
  Type, ShieldCheck, TrendingUp, UserCheck, Activity,
  ChevronRight, History, Settings, MapPin, Store, LogOut
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Patient, Medication, Prescription, Template,
  MOCK_PATIENTS, MOCK_MEDICATIONS, 
  PRESCRIPTION_TEMPLATES, ClinicProfile, DEFAULT_CLINIC
} from './types';
import { SignaturePad } from './SignaturePad';
import { HandwrittenPad } from './HandwrittenPad';
import { HospitalSuite } from './HospitalSuite';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError, OperationType, isFirestoreQuotaExhausted } from '../../lib/firebase';
import { collection, doc, setDoc, getDocs, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';

export const MedDoctorDashboard: React.FC = () => {
  const { user, isDoctor, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<any | null>(null);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [clinicProfile, setClinicProfile] = useState<ClinicProfile>(DEFAULT_CLINIC);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showClinicSettings, setShowClinicSettings] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState<Prescription | null>(null);
  const [activeTab, setActiveTab] = useState<'Recent' | 'Drafts' | 'Reports'>('Recent');
  const [reportGrouping, setReportGrouping] = useState<'day' | 'month'>('day');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [manualPatient, setManualPatient] = useState<Partial<Patient>>({ name: '', email: '', phone: '' });
  const [isManualPatient, setIsManualPatient] = useState(false);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [signature, setSignature] = useState<string>('');
  const [patientSignature, setPatientSignature] = useState<string>('');
  const [handwrittenData, setHandwrittenData] = useState<string>('');
  const [isHandwrittenMode, setIsHandwrittenMode] = useState(false);
  const [language, setLanguage] = useState('English');
  const [prescriptionDate, setPrescriptionDate] = useState<string>('');
  const [drugSearch, setDrugSearch] = useState<{ [key: string]: string }>({});
  const [showDrugSuggestions, setShowDrugSuggestions] = useState<{ [key: string]: boolean }>({});

  // Analytics Data
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayPxs = prescriptions.filter(p => p.date.startsWith(today));
    
    // Last 7 days trend
    const trend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      return {
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        count: prescriptions.filter(p => p.date.startsWith(dateStr)).length
      };
    });

    return {
      today: todayPxs.length,
      pending: prescriptions.filter(p => p.status === 'Pending').length,
      dispensed: prescriptions.filter(p => p.status === 'Dispensed').length,
      trend
    };
  }, [prescriptions]);

  const patientHistory = useMemo(() => {
    if (!selectedPatient && !isManualPatient) return [];
    const id = isManualPatient ? 'manual' : selectedPatient?.id;
    return prescriptions.filter(p => p.patientId === id || (isManualPatient && p.patientName === manualPatient.name));
  }, [selectedPatient, prescriptions, isManualPatient, manualPatient.name]);

  useEffect(() => {
    if (!authLoading && !isDoctor) {
      navigate('/med-login');
    }
  }, [authLoading, isDoctor, navigate]);

  useEffect(() => {
    if (!user) return;

    // Fetch Prescriptions (Isolated by Doctor ID)
    const q = query(
      collection(db, 'prescriptions'),
      where('doctorId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPrescriptions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Prescription)));
    }, (err) => {
      console.error(err);
    });

    // Fetch Master Pharmacy List
    const fetchPharmacies = async () => {
      try {
        const phSnap = await getDocs(collection(db, 'pharmacies'));
        let phList = phSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (phList.length === 0) {
          const defaults = [
            { id: 'Metro_rx', name: 'Metro Pharmacy Desk', address: 'Downtown Medical Row, Ground Floor', phone: '771900002' },
            { id: 'City_rx', name: 'City Health Pharmacy', address: 'General Hospital Crossroad, Lane 2', phone: '771900003' },
            { id: 'Fischer_rx', name: 'Fischer Specialty Pharmacy', address: 'Professional Medical Complex, Suite 10', phone: '771900004' }
          ];
          if (!isFirestoreQuotaExhausted()) {
            for (const ph of defaults) {
              await setDoc(doc(db, 'pharmacies', ph.id), ph, { merge: true }).catch(() => {});
            }
          }
          phList = defaults;
        }
        setPharmacies(phList);
      } catch (err) {
        console.warn('Silent fallback directory loading:', err);
        setPharmacies([
          { id: 'Metro_rx', name: 'Metro Pharmacy Desk', address: 'Downtown Medical Row, Ground Floor', phone: '771900002' },
          { id: 'City_rx', name: 'City Health Pharmacy', address: 'General Hospital Crossroad, Lane 2', phone: '771900003' },
          { id: 'Fischer_rx', name: 'Fischer Specialty Pharmacy', address: 'Professional Medical Complex, Suite 10', phone: '771900004' }
        ]);
      }
    };
    fetchPharmacies();

    // Load Local Settings
    const savedTemplates = localStorage.getItem('med_custom_templates');
    if (savedTemplates) {
      setCustomTemplates(JSON.parse(savedTemplates));
    } else {
      setCustomTemplates(PRESCRIPTION_TEMPLATES);
    }

    const savedClinic = localStorage.getItem('med_clinic_profile');
    if (savedClinic) setClinicProfile(JSON.parse(savedClinic));

    return () => unsubscribe();
  }, [user]);

  // Auto-select Default Pharmacy on new prescription modal open
  useEffect(() => {
    if (showAddModal && !isEditing && pharmacies.length > 0 && !selectedPharmacy) {
      const defaultPh = pharmacies.find(p => p.id === 'Metro_rx') || pharmacies[0];
      if (defaultPh) {
        setSelectedPharmacy(defaultPh);
      }
    }
  }, [showAddModal, isEditing, pharmacies, selectedPharmacy]);

  const handleUpdateClinic = (newProfile: ClinicProfile) => {
    setClinicProfile(newProfile);
    localStorage.setItem('med_clinic_profile', JSON.stringify(newProfile));
    setShowClinicSettings(false);
  };

  // Auto-save logic (Simulated Cloud Backup)
  useEffect(() => {
    if (showAddModal) {
      const timer = setInterval(() => {
        console.log('Auto-saving draft...');
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [showAddModal]);

  // Synchronously sync prescriptionDate with either existing edited record or new dynamic timestamp
  useEffect(() => {
    if (showAddModal) {
      if (isEditing) {
        const matchingRx = prescriptions.find(p => p.id === isEditing);
        if (matchingRx) {
          setPrescriptionDate(matchingRx.date);
        }
      } else {
        // Set to current time automatically for a new prescription
        setPrescriptionDate(new Date().toISOString());
      }
    } else {
      setPrescriptionDate('');
    }
  }, [showAddModal, isEditing, prescriptions]);

  const savePrescriptions = (newPrescriptions: Prescription[]) => {
    setPrescriptions(newPrescriptions);
    localStorage.setItem('med_prescriptions', JSON.stringify(newPrescriptions));
  };

  const handleAddMed = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const newMed: Medication = {
      id,
      name: '',
      dosage: '',
      instructions: '',
      duration: ''
    };
    setMeds([...meds, newMed]);
  };

  const saveTemplates = (newTemplates: Template[]) => {
    setCustomTemplates(newTemplates);
    localStorage.setItem('med_custom_templates', JSON.stringify(newTemplates));
  };

  const handleAddTemplate = (name: string, templateMeds: Omit<Medication, 'id'>[]) => {
    const newTemplate: Template = {
      id: `ct-${Math.random().toString(36).substr(2, 9)}`,
      name,
      medications: templateMeds
    };
    saveTemplates([...customTemplates, newTemplate]);
  };

  const handleRemoveTemplate = (id: string) => {
    saveTemplates(customTemplates.filter(t => t.id !== id));
  };

  const applyTemplate = (templateId: string) => {
    const template = customTemplates.find(t => t.id === templateId);
    if (template) {
      const templateMeds = template.medications.map(m => ({
        ...m,
        id: Math.random().toString(36).substr(2, 9)
      }));
      setMeds([...meds, ...templateMeds]);
    }
  };

  const handleEdit = (rx: Prescription) => {
    setIsEditing(rx.id);
    setSelectedPatient(MOCK_PATIENTS.find(p => p.id === rx.patientId) || null);
    setMeds(rx.medications);
    setLanguage(rx.language || 'English');
    setSignature(rx.signature || '');
    setIsHandwrittenMode(!!rx.isHandwritten);
    
    // Auto-select the pharmacy associated with this prescription
    // @ts-ignore
    const targetPharmacy = pharmacies.find(ph => ph.id === rx.pharmacyId) || pharmacies[0];
    if (targetPharmacy) {
      setSelectedPharmacy(targetPharmacy);
    }
    
    setShowAddModal(true);
  };

  const handleShare = (rx: Prescription, platform: 'WhatsApp' | 'SMS' | 'Email') => {
    const message = `Digital Prescription Issue: ${rx.id}. Patient: ${rx.patientName}. Date: ${new Date(rx.date).toLocaleDateString()}. View at: ${window.location.origin}/med-pharmacy`;
    
    if (platform === 'WhatsApp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    } else if (platform === 'SMS') {
      window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
    } else if (platform === 'Email') {
      window.open(`mailto:?subject=Digital Prescription&body=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleRemoveMed = (id: string) => {
    setMeds(meds.filter(m => m.id !== id));
  };

  const handleUpdateMed = (id: string, field: keyof Medication, value: string) => {
    setMeds(meds.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const patientData = isManualPatient ? {
      id: `p-manual-${Date.now()}`,
      name: manualPatient.name || 'Unknown Patient',
      email: manualPatient.email || '',
      phone: manualPatient.phone || '',
    } : selectedPatient;

    if (!patientData || (meds.length === 0 && !isHandwrittenMode) || !selectedPharmacy) {
      if (!selectedPharmacy) alert('Please select a pharmacy from the master list.');
      return;
    }

    try {
      const rxId = isEditing || `RX-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const prescriptionData: Partial<Prescription> = {
        doctorId: user.uid,
        doctorName: clinicProfile.name || user.displayName || 'Doctor',
        patientId: patientData.id,
        patientName: patientData.name,
        medications: meds,
        date: prescriptionDate || new Date().toISOString(),
        status: isEditing ? prescriptions.find(p => p.id === isEditing)?.status || 'Pending' : 'Pending',
        language,
        signature,
        patientSignature,
        isHandwritten: isHandwrittenMode,
        notes: isHandwrittenMode ? handwrittenData : (isEditing ? prescriptions.find(p => p.id === isEditing)?.notes || '' : ''),
        // @ts-ignore - types.ts might not have these yet, but they are in the blueprint
        pharmacyId: selectedPharmacy.id,
        pharmacyName: selectedPharmacy.name
      };

      await setDoc(doc(db, 'prescriptions', rxId), prescriptionData, { merge: true });

      // Save locally to support instant offline synchronization for Pharmacy EMR Inbox
      try {
        const savedLocalRx = localStorage.getItem('pharmacy_local_rx');
        const localRxList = savedLocalRx ? JSON.parse(savedLocalRx) : [];
        const filteredRxList = localRxList.filter((r: any) => r.id !== rxId);
        const fullRxRecord = { 
          id: rxId, 
          ...prescriptionData,
          category: isHandwrittenMode ? 'Other' : 'General'
        };
        localStorage.setItem('pharmacy_local_rx', JSON.stringify([fullRxRecord, ...filteredRxList]));
        // Trigger a custom event or reload simulation in case window/tab is shared
        window.dispatchEvent(new Event('storage'));
      } catch (locErr) {
        console.warn('LocalStorage EMR sync write omitted/failed:', locErr);
      }

      if (isEditing) {
        setSuccessMessage('Prescription updated successfully!');
      } else {
        setSuccessMessage('Prescription issued successfully!');
        if (patientData.phone) {
          setTimeout(() => {
            handleShare({ id: rxId, patientName: patientData.name, date: prescriptionData.date } as any, 'WhatsApp');
          }, 1500);
        }
      }

      setShowAddModal(false);
      setIsEditing(null);
      setSelectedPatient(null);
      setManualPatient({ name: '', email: '', phone: '' });
      setIsManualPatient(false);
      setMeds([]);
      setSignature('');
      setPatientSignature('');
      setIsHandwrittenMode(false);
      setSelectedPharmacy(null);
      setShowPrintPreview({ id: rxId, ...prescriptionData } as any);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'prescriptions');
    }
  };

  // Analytics aggregation for Day-wise and Month-wise patient, bill & prescription history
  const analyticsData = useMemo(() => {
    const dayGroups: { [key: string]: { date: string, rxList: Prescription[], patients: Set<string>, revenue: number } } = {};
    const monthGroups: { [key: string]: { month: string, rxList: Prescription[], patients: Set<string>, revenue: number } } = {};
    
    prescriptions.forEach(p => {
      const dateObj = new Date(p.date);
      if (isNaN(dateObj.getTime())) return;
      
      const dayKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
      const monthKey = dayKey.substring(0, 7); // YYYY-MM
      
      const consultFee = 500; // Standard flat fee per general consultation prescription issued
      
      // Day aggregation
      if (!dayGroups[dayKey]) {
        dayGroups[dayKey] = { date: dayKey, rxList: [], patients: new Set(), revenue: 0 };
      }
      dayGroups[dayKey].rxList.push(p);
      dayGroups[dayKey].patients.add(p.patientName);
      dayGroups[dayKey].revenue += consultFee;
      
      // Month aggregation
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = { month: monthKey, rxList: [], patients: new Set(), revenue: 0 };
      }
      monthGroups[monthKey].rxList.push(p);
      monthGroups[monthKey].patients.add(p.patientName);
      monthGroups[monthKey].revenue += consultFee;
    });
    
    const formattedDays = Object.values(dayGroups).map(d => ({
      period: d.date,
      rxCount: d.rxList.length,
      patientCount: d.patients.size,
      revenue: d.revenue,
      rxList: d.rxList
    })).sort((a, b) => b.period.localeCompare(a.period));
    
    const formattedMonths = Object.values(monthGroups).map(m => ({
      period: m.month,
      rxCount: m.rxList.length,
      patientCount: m.patients.size,
      revenue: m.revenue,
      rxList: m.rxList
    })).sort((a, b) => b.period.localeCompare(a.period));
    
    return { days: formattedDays, months: formattedMonths };
  }, [prescriptions]);

  const filteredPrescriptions = prescriptions.filter(p => 
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || !isDoctor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-20 bg-emerald-950 text-white font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-400 mb-4"></div>
        <p className="font-bold text-emerald-300 uppercase tracking-widest text-xs">Verifying Doctor Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-4 mb-4 select-none flex-wrap">
              <Link to="/med-demo" className="text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                <ArrowLeft size={14} /> Back to Landing
              </Link>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <Link to="/med-pharmacy" className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/10 transition-all">
                <Store size={14} /> Open Pharmacy Portal EMR
              </Link>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <button 
                onClick={async () => {
                  try {
                    await logout();
                    navigate('/med-login');
                  } catch (err) {
                    console.error('Logout error:', err);
                  }
                }}
                className="text-red-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer inline-flex border-none bg-transparent"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowClinicSettings(true)}
                className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/20">
                  <Edit3 size={16} />
                </div>
                <Stethoscope size={32} />
              </button>
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{clinicProfile.name}</h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">{clinicProfile.specialty} • {clinicProfile.regNumber}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 transition-all"
          >
            <Plus size={20} />
            New Prescription
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Today\'s Prescriptions', value: prescriptions.filter(p => new Date(p.date).toDateString() === new Date().toDateString()).length, icon: Calendar, color: 'text-blue-500' },
            { label: 'Pending Dispense', value: prescriptions.filter(p => p.status === 'Pending').length, icon: Clock, color: 'text-amber-500' },
            { label: 'Total Patients', value: new Set(prescriptions.map(p => p.patientId)).size, icon: Users, color: 'text-green-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/20 dark:shadow-none">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-800 ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <span className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</span>
              </div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Success Alert */}
        <AnimatePresence>
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-6 rounded-3xl mb-8 flex items-center gap-4 text-green-700 dark:text-green-400"
            >
              <CheckCircle2 size={24} />
              <p className="font-bold">{successMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prescription List */}
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl shadow-gray-200/20 overflow-hidden">
          <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex bg-gray-50 dark:bg-gray-800 p-1 rounded-2xl">
              {(['Recent', 'Drafts', 'Reports'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-900 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {tab === 'Reports' ? 'Reports & History' : tab}
                </button>
              ))}
            </div>
            {activeTab !== 'Reports' && (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search patient or RX ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-6 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none w-full md:w-64"
                />
              </div>
            )}
          </div>
          
          {activeTab === 'Reports' ? (
            <div className="p-8 space-y-8">
              {/* Header and Toggles */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/40 p-6 rounded-3xl">
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest">Medical Analytics Reporting</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Periodical analysis of patient visits & consultation bills history</p>
                </div>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl shrink-0 self-start sm:self-center border border-gray-200/40 dark:border-gray-700/40">
                  <button
                    onClick={() => setReportGrouping('day')}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${reportGrouping === 'day' ? 'bg-white dark:bg-gray-900 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Day-Wise
                  </button>
                  <button
                    onClick={() => setReportGrouping('month')}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${reportGrouping === 'month' ? 'bg-white dark:bg-gray-900 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Month-Wise
                  </button>
                </div>
              </div>

              {/* Aggregation graphs using Recharts */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                  <TrendingUp size={14} className="text-primary" />
                  Prescription Issue Volume & Est. Consult Invoice Revenue (Rs. 500 flat per RX)
                </h4>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportGrouping === 'day' ? analyticsData.days.slice(0, 10).reverse() : analyticsData.months.slice(0, 12).reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:opacity-10" />
                      <XAxis dataKey="period" stroke="#a0a0a0" fontSize={9} tickLine={false} />
                      <YAxis yAxisId="left" stroke="#3b82f6" fontSize={9} tickLine={false} label={{ value: 'Patients / RX Count', angle: -90, position: 'insideLeft', style: { fill: '#3b82f6', fontWeight: 'bold' } }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={9} tickLine={false} label={{ value: 'Income (Rs.)', angle: 90, position: 'insideRight', style: { fill: '#10b981', fontWeight: 'bold' } }} />
                      <Tooltip contentStyle={{ borderRadius: '15px', fontWeight: 'bold' }} />
                      <Bar yAxisId="left" dataKey="patientCount" name="Patients" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="rxCount" name="Prescriptions" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="revenue" name="Revenue (Rs.)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Aggregate detailed day/month lists */}
              <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 font-black uppercase tracking-widest text-[8px] border-b border-gray-100 dark:border-gray-800">
                      <th className="px-6 py-4">{reportGrouping === 'day' ? 'Date Day' : 'Month Period'}</th>
                      <th className="px-6 py-4 text-center">Patients Consulted</th>
                      <th className="px-6 py-4 text-center">Digital Prescriptions</th>
                      <th className="px-6 py-4 text-right">Consultation Fees Invoice</th>
                      <th className="px-6 py-4 text-right">Total Est Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {(reportGrouping === 'day' ? analyticsData.days : analyticsData.months).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-xs font-black uppercase tracking-widest text-gray-400">
                          No prescription transactions found
                        </td>
                      </tr>
                    ) : (
                      (reportGrouping === 'day' ? analyticsData.days : analyticsData.months).map((row, idx) => (
                        <React.Fragment key={idx}>
                          <tr className="hover:bg-gray-50/40 dark:hover:bg-gray-800/10 font-semibold text-gray-700 dark:text-gray-200">
                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{row.period}</td>
                            <td className="px-6 py-4 text-center text-blue-500 font-extrabold">{row.patientCount} Patients</td>
                            <td className="px-6 py-4 text-center text-purple-500 font-extrabold">{row.rxCount} RXs</td>
                            <td className="px-6 py-4 text-right font-mono">Rs.{(row.revenue * 0.9).toFixed(0)}</td>
                            <td className="px-6 py-4 text-right text-emerald-500 font-extrabold font-mono">Rs.{row.revenue}</td>
                          </tr>
                          {/* Interactive list of patients and prescriptions issued on this grouping item */}
                          <tr className="bg-gray-50/10 dark:bg-gray-900/10">
                            <td colSpan={5} className="px-6 py-2 border-none">
                              <div className="flex flex-wrap gap-2 py-1">
                                {row.rxList.map(item => (
                                  <span key={item.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-850 hover:border-gray-300 border border-gray-150 dark:border-gray-800 rounded-lg text-[10px] text-gray-500 dark:text-gray-400 font-bold">
                                    <Users size={10} className="text-gray-400" />
                                    <strong>{item.patientName}</strong> ({item.id})
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'Drafts' ? (
             <div className="p-20 text-center">
                <Save className="mx-auto text-gray-200 mb-6" size={48} />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No saved drafts</p>
             </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                <FileText size={40} />
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Patient</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Type</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {filteredPrescriptions.map((px) => (
                    <tr key={px.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-bold text-gray-900 dark:text-white">{px.patientName}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{px.id}</p>
                      </td>
                      <td className="px-8 py-6 text-xs text-gray-500 font-medium">
                        {new Date(px.date).toLocaleDateString()} {new Date(px.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-8 py-6 text-center">
                        {px.isHandwritten ? (
                          <div className="flex items-center justify-center text-primary group" title="Handwritten">
                            <PenTool size={16} />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center text-gray-400" title="Typed">
                            <Type size={16} />
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          px.status === 'Dispensed' 
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {px.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(px)}
                            className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                            title="Edit Prescription"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => handleShare(px, 'WhatsApp')}
                            className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                            title="Share on WhatsApp"
                          >
                            <MessageCircle size={14} />
                          </button>
                          <button 
                            onClick={() => window.print()}
                            className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            title="Print"
                          >
                            <Printer size={14} />
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

        {/* Dynamic Hospital Enterprise Suite Selector */}
        <HospitalSuite onPrescribeClick={(patName) => {
          setSelectedPatient({ id: `p-manual-${Date.now()}`, name: patName } as any);
          setIsManualPatient(true);
          setManualPatient({ name: patName, email: '', phone: '' });
          setMeds([]);
          setShowAddModal(true);
        }} />
      </div>

      {/* New Prescription Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Create Digital Prescription</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar">
                {/* Header Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
                  <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setIsHandwrittenMode(false)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isHandwrittenMode ? 'bg-white dark:bg-gray-900 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <Type size={14} /> Typed
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsHandwrittenMode(true)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isHandwrittenMode ? 'bg-white dark:bg-gray-900 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <PenTool size={14} /> Handwrite
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-gray-400" />
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-primary outline-none"
                    >
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Marathi</option>
                      <option>Gujarati</option>
                    </select>
                  </div>
                </div>

                {/* Patient Selection & History */}
                <div className="mb-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Patient Selection</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsManualPatient(!isManualPatient);
                          setSelectedPatient(null);
                        }}
                        className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary/5 px-3 py-1 rounded-lg transition-all"
                      >
                        {isManualPatient ? <Users size={12} /> : <Plus size={12} />}
                        {isManualPatient ? 'Select Existing' : 'Manual Entry'}
                      </button>
                    </div>

                    {isManualPatient ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] border border-gray-100 dark:border-gray-800"
                      >
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase">Full Name</label>
                          <input
                            type="text"
                            value={manualPatient.name}
                            onChange={(e) => setManualPatient({ ...manualPatient, name: e.target.value })}
                            className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20"
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase">Phone (WhatsApp)</label>
                          <input
                            type="tel"
                            value={manualPatient.phone}
                            onChange={(e) => setManualPatient({ ...manualPatient, phone: e.target.value })}
                            className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20"
                            placeholder="+91 00000 00000"
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {MOCK_PATIENTS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatient(p);
                              setIsManualPatient(false);
                            }}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${
                              selectedPatient?.id === p.id 
                                ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' 
                                : 'border-gray-50 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                            }`}
                          >
                            <p className="font-bold text-gray-900 dark:text-white text-xs">{p.name}</p>
                            <p className="text-[9px] text-gray-500 font-medium truncate">{p.village}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Patient History Sidebar */}
                  <div className="lg:col-span-5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
                       <History size={12} /> Patient History
                    </label>
                    <div className="bg-blue-50/50 dark:bg-gray-800/50 rounded-[2rem] p-6 h-[180px] overflow-y-auto border border-blue-100/50 dark:border-gray-700 custom-scrollbar">
                      {patientHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                           <FileText size={24} className="mb-2" />
                           <p className="text-[10px] font-bold uppercase tracking-wider">No Previous Records</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {patientHistory.map(h => (
                            <div key={h.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                               <div>
                                 <p className="text-[10px] font-black text-primary uppercase">{h.id}</p>
                                 <p className="text-[9px] font-bold text-gray-500">{new Date(h.date).toLocaleDateString()}</p>
                               </div>
                               <button type="button" onClick={() => handleEdit(h)} className="text-primary hover:scale-110 transition-transform">
                                 <ChevronRight size={16} />
                               </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Auto-Loaded Date and Time */}
                <div className="mb-10 p-6 bg-slate-50 dark:bg-slate-800/20 rounded-[2rem] border border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                      <Clock size={16} />
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Prescription Issuance Slot</span>
                      <span className="text-xs font-black text-gray-800 dark:text-gray-200">
                        {isEditing ? 'Restored Archive Stamp' : 'Loaded Automatically'}
                      </span>
                    </div>
                  </div>
                  <input
                    type="datetime-local"
                    value={
                      prescriptionDate 
                        ? new Date(new Date(prescriptionDate).getTime() - new Date(prescriptionDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                        : new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                    }
                    onChange={(e) => {
                      const selectedLocalTime = e.target.value;
                      if (selectedLocalTime) {
                        setPrescriptionDate(new Date(selectedLocalTime).toISOString());
                      }
                    }}
                    className="bg-transparent text-xs font-bold text-gray-800 dark:text-gray-200 outline-none border border-gray-200 dark:border-gray-700 hover:border-primary p-3 rounded-2xl cursor-pointer"
                  />
                </div>

                {/* Content: Either Handwritten or Typed */}
                {isHandwrittenMode ? (
                  <div className="mb-10">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block underline decoration-primary/30 underline-offset-4">Handwritten Entry</label>
                    <HandwrittenPad 
                      onSave={(data) => setHandwrittenData(data)}
                      onClear={() => setHandwrittenData('')}
                    />
                  </div>
                ) : (
                  <>
                    {/* Templates */}
                    <div className="mb-10">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Quick Templates</label>
                        <button
                          type="button"
                          onClick={() => setShowTemplateManager(true)}
                          className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary/5 px-3 py-1 rounded-lg transition-all"
                        >
                          <Edit3 size={12} /> Manage
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {customTemplates.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => applyTemplate(t.id)}
                            className="px-4 py-2 bg-primary/5 dark:bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
                          >
                            + {t.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Medications List */}
                    <div className="space-y-6 mb-10">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0 block">Medications List</label>
                        <button 
                          type="button"
                          onClick={handleAddMed}
                          className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition-all"
                        >
                          <Plus size={12} /> Add Medicine
                        </button>
                      </div>
                      
                      {meds.length === 0 ? (
                        <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-3xl text-center border border-dashed border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic leading-relaxed">No medications added yet. <br />Use templates or click "Add Medicine".</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {meds.map((med, index) => (
                            <div key={med.id} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 relative group animate-fade-in">
                              <button 
                                type="button"
                                onClick={() => handleRemoveMed(med.id)}
                                className="absolute -top-2 -right-2 w-8 h-8 bg-black text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              >
                                <Trash2 size={14} />
                              </button>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div className="relative">
                                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Intelligent Suggestion</label>
                                   <input 
                                     type="text"
                                     value={drugSearch[med.id] || med.name}
                                     onChange={(e) => {
                                       const val = e.target.value;
                                       setDrugSearch(prev => ({ ...prev, [med.id]: val }));
                                       setShowDrugSuggestions(prev => ({ ...prev, [med.id]: val.length > 1 }));
                                       handleUpdateMed(med.id, 'name', val);
                                     }}
                                     className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20"
                                     placeholder="Start typing drug name..."
                                     required
                                   />
                                   {showDrugSuggestions[med.id] && (
                                     <div className="absolute z-10 left-0 right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                       {MOCK_MEDICATIONS.filter(d => d.toLowerCase().includes((drugSearch[med.id] || '').toLowerCase())).map((d, i) => (
                                         <button
                                           key={i}
                                           type="button"
                                           onClick={() => {
                                             handleUpdateMed(med.id, 'name', d);
                                             setDrugSearch(prev => ({ ...prev, [med.id]: d }));
                                             setShowDrugSuggestions(prev => ({ ...prev, [med.id]: false }));
                                           }}
                                           className="w-full px-4 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-primary/5 hover:text-primary transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0"
                                         >
                                           {d}
                                         </button>
                                       ))}
                                     </div>
                                   )}
                                </div>
                                <div>
                                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Dosage (e.g. 1 Tab / 8 hrs)</label>
                                   <input 
                                     type="text"
                                     value={med.dosage}
                                     onChange={(e) => handleUpdateMed(med.id, 'dosage', e.target.value)}
                                     className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20"
                                     placeholder="1 Tab / 8 hours"
                                     required
                                   />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Instructions</label>
                                   <input 
                                     type="text"
                                     value={med.instructions}
                                     onChange={(e) => handleUpdateMed(med.id, 'instructions', e.target.value)}
                                     className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20"
                                     placeholder="After meal"
                                     required
                                   />
                                </div>
                                <div>
                                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Duration</label>
                                   <input 
                                     type="text"
                                     value={med.duration}
                                     onChange={(e) => handleUpdateMed(med.id, 'duration', e.target.value)}
                                     className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20"
                                     placeholder="5 Days"
                                     required
                                   />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Signatures removed as per request */}

                {/* Pharmacy Selection */}
                <div className="mb-10 p-8 bg-secondary/5 border border-secondary/10 rounded-[2.5rem]">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest mb-4 block flex items-center gap-2">
                    <Store size={14} /> Send To Pharmacy
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pharmacies.map(ph => (
                      <button
                        key={ph.id}
                        type="button"
                        onClick={() => setSelectedPharmacy(ph)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                          selectedPharmacy?.id === ph.id 
                            ? 'border-secondary bg-secondary/10 shadow-lg scale-[1.02]' 
                            : 'border-white dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-secondary/20 shadow-sm'
                        }`}
                      >
                        <p className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-tight">{ph.name}</p>
                        <p className="text-[9px] text-gray-500 font-medium truncate mt-1">{ph.address}</p>
                      </button>
                    ))}
                    {pharmacies.length === 0 && (
                      <div className="col-span-full p-6 text-center bg-white/50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No Pharmacies in Master List</p>
                        <p className="text-[8px] text-gray-400 mt-1 uppercase">Contact Super Admin to update Directory</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    type="submit"
                    disabled={(isManualPatient ? !manualPatient.name.trim() : !selectedPatient) || (meds.length === 0 && !isHandwrittenMode)}
                    className="flex-1 py-5 bg-primary disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-primary/20 hover:bg-black hover:-translate-y-1 transition-all flex items-center justify-center gap-4"
                  >
                    <Save size={20} />
                    {isEditing ? 'Update Prescription' : 'Issue Prescription'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-10 py-5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm"
                  >
                    Cancel
                  </button>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-50 dark:border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Save size={14} className="mx-auto text-green-500 mb-2" />
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-tight">Auto-saved to Cloud</p>
                  </div>
                  <div className="text-center">
                    <ShieldCheck size={14} className="mx-auto text-blue-500 mb-2" />
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-tight">Secure & Compliant</p>
                  </div>
                  <div className="text-center">
                    <Share2 size={14} className="mx-auto text-purple-500 mb-2" />
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-tight">Instant Sharing</p>
                  </div>
                  <div className="text-center">
                    <Globe size={14} className="mx-auto text-amber-500 mb-2" />
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-tight">Multilingual Ready</p>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Template Manager Modal */}
      <AnimatePresence>
        {showTemplateManager && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-800 p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Prescription Templates</h3>
                <button onClick={() => setShowTemplateManager(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {customTemplates.map(t => (
                  <div key={t.id} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 flex items-center justify-between group">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{t.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.medications.length} Medicines</p>
                    </div>
                    <button 
                      onClick={() => handleRemoveTemplate(t.id)}
                      className="p-3 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                <button 
                  onClick={() => {
                    const name = prompt('Template Name?');
                    if (name && meds.length > 0) {
                      const templateMeds = meds.map(({ id, ...rest }) => rest);
                      handleAddTemplate(name, templateMeds);
                    } else if (meds.length === 0) {
                      alert('Add medications to the current prescription first to save as a template.');
                    }
                  }}
                  className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Save Current Meds as Template
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Preview Modal */}
      <AnimatePresence>
        {showPrintPreview && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Prescription Snapshot</h3>
                  <p className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-2 mt-1">
                    <CheckCircle2 size={12} /> Successfully Issued
                  </p>
                </div>
                <button onClick={() => setShowPrintPreview(null)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl">
                  <X size={20} />
                </button>
              </div>

              <div id="rx-print-content" className="p-10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex-1 overflow-y-auto">
                {/* Print Template */}
                <div className="border-[6px] border-primary/20 p-8 rounded-[2rem] relative">
                  <div className="absolute top-8 right-8 text-right">
                    <h4 className="text-2xl font-black text-primary leading-tight">{clinicProfile.name}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{clinicProfile.specialty}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reg: {clinicProfile.regNumber}</p>
                  </div>
                  
                  <div className="mb-12">
                    <Stethoscope size={40} className="text-primary mb-4" />
                    <div className="h-1 w-20 bg-primary rounded-full" />
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-12 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl">
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Patient</p>
                      <p className="font-black text-lg">{showPrintPreview.patientName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Date, Time & ID</p>
                      <p className="font-bold text-xs">{new Date(showPrintPreview.date).toLocaleDateString()} {new Date(showPrintPreview.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="font-mono text-[8px] text-gray-400">{showPrintPreview.id}</p>
                    </div>
                  </div>

                  <div className="space-y-6 mb-12">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-2xl font-serif italic text-primary">Rx</span>
                      <div className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800" />
                    </div>
                    {showPrintPreview.isHandwritten ? (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-center">
                        <img src={showPrintPreview.notes} className="max-w-full h-auto dark:invert" alt="Handwritten Rx" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {showPrintPreview.medications.map((m, i) => (
                          <div key={i} className="flex items-start justify-between">
                            <div>
                               <p className="font-black text-sm">{m.name}</p>
                               <p className="text-[10px] font-medium text-gray-500">{m.dosage} • {m.instructions}</p>
                            </div>
                            <p className="text-xs font-bold text-gray-400">{m.duration}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-end justify-between pt-12 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-center">
                      <img src={showPrintPreview.patientSignature} className="h-10 object-contain mx-auto mb-2 dark:invert" alt="Patient Sig" />
                      <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Patient Signature</p>
                    </div>
                    <div className="text-center">
                      <img src={showPrintPreview.signature} className="h-14 object-contain mx-auto mb-2 dark:invert opacity-80" alt="Doctor Sig" />
                      <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Doctor Signature & Seal</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:translate-y-[-2px] transition-all"
                >
                  <Printer size={18} /> Print Prescription
                </button>
                <button 
                  onClick={() => handleShare(showPrintPreview, 'WhatsApp')}
                  className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:translate-y-[-2px] transition-all"
                >
                  <MessageCircle size={18} /> Share via WhatsApp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clinic Settings Modal */}
      <AnimatePresence>
        {showClinicSettings && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-800 p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Clinic Profile</h3>
                <button onClick={() => setShowClinicSettings(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hospital / Clinic Name</label>
                    <div className="relative">
                      <Stethoscope size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                      <input 
                        type="text" 
                        value={clinicProfile.name}
                        onChange={(e) => setClinicProfile({...clinicProfile, name: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
                        placeholder="Enter Hospital Name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Specialization</label>
                      <input 
                        type="text" 
                        value={clinicProfile.specialty}
                        onChange={(e) => setClinicProfile({...clinicProfile, specialty: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 text-sm font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
                        placeholder="e.g. Cardiologist"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reg Number</label>
                      <input 
                        type="text" 
                        value={clinicProfile.regNumber}
                        onChange={(e) => setClinicProfile({...clinicProfile, regNumber: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 text-sm font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
                        placeholder="Registration ID"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Clinic Address</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-4 text-primary" />
                    <textarea 
                      value={clinicProfile.address}
                      onChange={(e) => setClinicProfile({...clinicProfile, address: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-primary/20 h-24 resize-none"
                      placeholder="Full clinic address"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={() => handleUpdateClinic(clinicProfile)}
                  className="w-full py-4 bg-primary text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
