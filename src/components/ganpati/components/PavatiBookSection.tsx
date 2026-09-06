import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Share2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Building, 
  Receipt, 
  CheckCircle2, 
  FileSpreadsheet, 
  Eye, 
  TrendingUp, 
  IndianRupee,
  Smartphone,
  CreditCard,
  Banknote,
  Tag,
  Calendar,
  Sparkles,
  Edit3,
  Trash2,
  Ban,
  RotateCcw,
  AlertTriangle,
  FileEdit,
  Check,
  Users,
  Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  DigitalPavati, 
  ExpenseEntry, 
  MandalProfile, 
  MandalLanguage, 
  IncomeCategory, 
  PaymentMode,
  DonorProfile,
  PendingVarganiEntry,
  DayWiseCollection,
  VolunteerCollector
} from '../types';
import { 
  initialDonors, 
  initialPendingVargani, 
  initialDayWiseCollections 
} from '../data/initialData';
import { mandalTranslations } from '../translations/mandalTranslations';
import { DonorDatabaseView } from './DonorDatabaseView';
import { PendingVarganiView } from './PendingVarganiView';
import { TenDayDashboardView } from './TenDayDashboardView';
import { generateUniquePavatiNumber, getWhatsAppShareText } from '../utils/receiptGenerator';

interface PavatiBookSectionProps {
  pavatis: DigitalPavati[];
  expenses: ExpenseEntry[];
  mandal: MandalProfile;
  lang: MandalLanguage;
  donors?: DonorProfile[];
  pendingVargani?: PendingVarganiEntry[];
  dayWiseCollections?: DayWiseCollection[];
  volunteers?: VolunteerCollector[];
  onAddPavati: (newPavati: Omit<DigitalPavati, 'id'>) => void;
  onUpdatePavati: (updatedPavati: DigitalPavati) => void;
  onDeletePavati: (pavatiId: string) => void;
  onCancelPavati?: (pavatiId: string, reason: string) => void;
  onRestorePavati?: (pavatiId: string) => void;
  onViewReceipt: (pavati: DigitalPavati) => void;
  onAddDonor?: (newDonor: Omit<DonorProfile, 'id'>) => void;
  onAddPendingEntry?: (newEntry: Omit<PendingVarganiEntry, 'id'>) => void;
  onUpdatePendingStatus?: (id: string, status: PendingVarganiEntry['status'], collected?: number) => void;
  onOpenDailySummaryModal?: (date: string) => void;
  userRole: string;
}

export const PavatiBookSection: React.FC<PavatiBookSectionProps> = ({
  pavatis,
  expenses,
  mandal,
  lang,
  donors: propDonors,
  pendingVargani: propPending,
  dayWiseCollections: propDayWise,
  onAddPavati,
  onUpdatePavati,
  onDeletePavati,
  onCancelPavati,
  onRestorePavati,
  onViewReceipt,
  onAddDonor,
  onAddPendingEntry,
  onUpdatePendingStatus,
  onOpenDailySummaryModal,
  userRole
}) => {
  const t = mandalTranslations[lang];
  const [activeSubTab, setActiveSubTab] = useState<'receipts' | 'donors' | 'pending' | 'tenDays'>('receipts');
  
  // Local state fallbacks for Donors and Pending Vargani
  const [localDonors, setLocalDonors] = useState<DonorProfile[]>(propDonors || initialDonors);
  const [localPending, setLocalPending] = useState<PendingVarganiEntry[]>(propPending || initialPendingVargani);
  const [localDayWise, setLocalDayWise] = useState<DayWiseCollection[]>(propDayWise || initialDayWiseCollections);

  const donors = propDonors || localDonors;
  const pendingVargani = propPending || localPending;
  const dayWiseCollections = propDayWise || localDayWise;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Edit Modal State
  const [editingPavati, setEditingPavati] = useState<DigitalPavati | null>(null);
  const [editFormData, setEditFormData] = useState({
    donorName: '',
    phone: '',
    email: '',
    address: '',
    amount: '',
    paymentMode: 'upi' as PaymentMode,
    category: 'General Donation (देणगी)' as IncomeCategory,
    date: '',
    time: '',
    transactionRef: '',
    panNumber: '',
    notes: '',
    is80GExempt: false,
    receivedBy: ''
  });

  // Cancel Modal State
  const [cancellingPavati, setCancellingPavati] = useState<DigitalPavati | null>(null);
  const [cancelReason, setCancelReason] = useState('चुकीची नोंद / Entry Error');

  // Delete Confirmation Modal State
  const [deletingPavati, setDeletingPavati] = useState<DigitalPavati | null>(null);

  // New Pavati Form State
  const [formData, setFormData] = useState({
    donorName: '',
    phone: '',
    email: '',
    address: '',
    amount: '',
    paymentMode: 'upi' as PaymentMode,
    category: 'General Donation (देणगी)' as IncomeCategory,
    transactionRef: '',
    panNumber: '',
    notes: '',
    is80GExempt: false,
    receivedBy: 'सचिन कुलकर्णी (सचिव)'
  });

  // Calculate Real-time Financial Metrics (Active vs Cancelled)
  const metrics = useMemo(() => {
    const activePavatis = pavatis.filter(p => !p.isCancelled);
    const cancelledPavatis = pavatis.filter(p => p.isCancelled);

    const totalIncome = activePavatis.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netBalance = totalIncome - totalExpenses;

    const cashIncome = activePavatis.filter(p => p.paymentMode === 'cash').reduce((sum, p) => sum + p.amount, 0);
    const cashExpense = expenses.filter(e => e.paymentMode === 'cash').reduce((sum, e) => sum + e.amount, 0);
    const cashInHand = cashIncome - cashExpense;

    const digitalIncome = activePavatis.filter(p => p.paymentMode !== 'cash').reduce((sum, p) => sum + p.amount, 0);
    const digitalExpense = expenses.filter(e => e.paymentMode !== 'cash').reduce((sum, e) => sum + e.amount, 0);
    const bankBalance = digitalIncome - digitalExpense;

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      cashInHand,
      bankBalance,
      totalDonors: activePavatis.length,
      cancelledCount: cancelledPavatis.length,
      avgDonation: activePavatis.length > 0 ? Math.round(totalIncome / activePavatis.length) : 0
    };
  }, [pavatis, expenses]);

  // Filtered Pavatis
  const filteredPavatis = useMemo(() => {
    return pavatis.filter(p => {
      const matchSearch = 
        p.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery) ||
        (p.address && p.address.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchMode = selectedMode === 'all' || p.paymentMode === selectedMode;
      
      const matchStatus = 
        statusFilter === 'all' 
          ? true 
          : statusFilter === 'cancelled' 
            ? p.isCancelled === true 
            : !p.isCancelled;

      return matchSearch && matchCategory && matchMode && matchStatus;
    });
  }, [pavatis, searchQuery, selectedCategory, selectedMode, statusFilter]);

  // Handle New Pavati Submit
  const handleSubmitPavati = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.donorName || !formData.amount) {
      alert('कृपया देणगीदाराचे नाव आणि रक्कम भरा.');
      return;
    }

    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('कृपया योग्य रक्कम भरा.');
      return;
    }

    const now = new Date();
    const nextReceiptNum = generateUniquePavatiNumber(pavatis, null, 'globalSerial');
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newPavatiEntry: Omit<DigitalPavati, 'id'> = {
      receiptNumber: nextReceiptNum,
      donorName: formData.donorName.trim(),
      phone: formData.phone.trim() || '9800000000',
      email: formData.email.trim() || undefined,
      address: formData.address.trim() || undefined,
      amount: numAmount,
      paymentMode: formData.paymentMode,
      category: formData.category,
      date: dateStr,
      time: timeStr,
      transactionRef: formData.transactionRef.trim() || undefined,
      panNumber: formData.panNumber.trim() || undefined,
      is80GExempt: formData.is80GExempt,
      notes: formData.notes.trim() || undefined,
      receivedBy: formData.receivedBy,
      bookNumber: 'HQ-MAIN',
      bookPrefix: 'HQ01',
      isVerified: true,
      isCancelled: false,
      status: 'Active',
      syncStatus: 'Synced'
    };

    onAddPavati(newPavatiEntry);
    setIsFormOpen(false);
    
    // Reset Form
    setFormData({
      donorName: '',
      phone: '',
      email: '',
      address: '',
      amount: '',
      paymentMode: 'upi',
      category: 'General Donation (देणगी)',
      transactionRef: '',
      panNumber: '',
      notes: '',
      is80GExempt: false,
      receivedBy: mandal.secretaryName ? `${mandal.secretaryName} (सचिव)` : 'सचिन कुलकर्णी (सचिव)'
    });
  };

  // Open Edit Modal
  const handleStartEdit = (pavati: DigitalPavati) => {
    setEditingPavati(pavati);
    setEditFormData({
      donorName: pavati.donorName,
      phone: pavati.phone,
      email: pavati.email || '',
      address: pavati.address || '',
      amount: String(pavati.amount),
      paymentMode: pavati.paymentMode,
      category: pavati.category,
      date: pavati.date,
      time: pavati.time,
      transactionRef: pavati.transactionRef || '',
      panNumber: pavati.panNumber || '',
      notes: pavati.notes || '',
      is80GExempt: !!pavati.is80GExempt,
      receivedBy: pavati.receivedBy
    });
  };

  // Submit Edit Form
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPavati) return;

    const numAmount = parseFloat(editFormData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('कृपया योग्य रक्कम भरा.');
      return;
    }

    const updated: DigitalPavati = {
      ...editingPavati,
      donorName: editFormData.donorName.trim(),
      phone: editFormData.phone.trim(),
      email: editFormData.email.trim() || undefined,
      address: editFormData.address.trim() || undefined,
      amount: numAmount,
      paymentMode: editFormData.paymentMode,
      category: editFormData.category,
      date: editFormData.date,
      time: editFormData.time,
      transactionRef: editFormData.transactionRef.trim() || undefined,
      panNumber: editFormData.panNumber.trim() || undefined,
      notes: editFormData.notes.trim() || undefined,
      is80GExempt: editFormData.is80GExempt,
      receivedBy: editFormData.receivedBy.trim() || editingPavati.receivedBy,
      lastEditedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    onUpdatePavati(updated);
    setEditingPavati(null);
  };

  // Handle Cancel / Void
  const handleConfirmCancel = () => {
    if (!cancellingPavati) return;
    if (onCancelPavati) {
      onCancelPavati(cancellingPavati.id, cancelReason);
    } else {
      // fallback to update pavati
      onUpdatePavati({
        ...cancellingPavati,
        isCancelled: true,
        status: 'Cancelled',
        cancellationReason: cancelReason
      });
    }
    setCancellingPavati(null);
  };

  // Handle Restore
  const handleRestore = (pavati: DigitalPavati) => {
    if (onRestorePavati) {
      onRestorePavati(pavati.id);
    } else {
      onUpdatePavati({
        ...pavati,
        isCancelled: false,
        status: 'Active',
        cancellationReason: undefined
      });
    }
  };

  // Handle Delete Permanent
  const handleConfirmDelete = () => {
    if (!deletingPavati) return;
    onDeletePavati(deletingPavati.id);
    setDeletingPavati(null);
  };

  // Export to Excel (XLSX)
  const handleExportExcel = () => {
    const dataToExport = pavatis.map((p, idx) => ({
      'अ.क्र.': idx + 1,
      'पावती क्र.': p.receiptNumber,
      'स्थिती (Status)': p.isCancelled ? `रद्द (${p.cancellationReason || 'Void'})` : 'सक्रिय (Active)',
      'दिनांक': p.date,
      'वेळ': p.time,
      'देणगीदार': p.donorName,
      'मोबाईल': p.phone,
      'पत्ता': p.address || '-',
      'रक्कम (₹)': p.amount,
      'भरणा पद्धत': p.paymentMode.toUpperCase(),
      'वर्गवारी': p.category,
      'UTR / संदर्भ': p.transactionRef || '-',
      'पॅन क्र.': p.panNumber || '-',
      'पावती देणारा': p.receivedBy,
      'शेरा': p.notes || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pavati_Ledger_2026');
    XLSX.writeFile(workbook, `Shivtej_Ganpati_Pavati_Book_2026.xlsx`);
  };

  // Donor selection for creating Pavati
  const handleSelectDonorForPavati = (donor: DonorProfile) => {
    setFormData({
      donorName: donor.name,
      phone: donor.phone,
      email: donor.email || '',
      address: donor.address || '',
      amount: donor.totalDonated > 0 ? String(Math.round(donor.totalDonated / (donor.donationsCount || 1))) : '',
      paymentMode: 'upi' as PaymentMode,
      category: donor.category?.includes('Business') ? 'Advertisement / Sponsor (जाहिरात/प्रायोजक)' as IncomeCategory : 'General Donation (देणगी)' as IncomeCategory,
      transactionRef: '',
      panNumber: donor.panNumber || '',
      notes: `मागील देणगीदार (${donor.donorId})`,
      is80GExempt: false,
      receivedBy: mandal.secretaryName ? `${mandal.secretaryName} (सचिव)` : 'सचिन कुलकर्णी (सचिव)'
    });
    setActiveSubTab('receipts');
    setIsFormOpen(true);
  };

  // Pending vargani collect & issue pavati
  const handleCollectAndIssueReceipt = (entry: PendingVarganiEntry) => {
    setFormData({
      donorName: entry.targetName,
      phone: entry.phone,
      email: '',
      address: entry.address || entry.area || '',
      amount: String(entry.expectedAmount),
      paymentMode: 'upi' as PaymentMode,
      category: entry.targetType.includes('Shop') ? 'Advertisement / Sponsor (जाहिरात/प्रायोजक)' as IncomeCategory : 'General Donation (देणगी)' as IncomeCategory,
      transactionRef: '',
      panNumber: '',
      notes: `पाठपुरावा: ${entry.assignedVolunteer || 'कार्यकर्ता'}`,
      is80GExempt: false,
      receivedBy: entry.assignedVolunteer || (mandal.secretaryName ? `${mandal.secretaryName} (सचिव)` : 'सचिन कुलकर्णी (सचिव)')
    });
    setActiveSubTab('receipts');
    setIsFormOpen(true);
  };

  // Add Donor handler
  const handleAddDonor = (newDonor: Omit<DonorProfile, 'id'>) => {
    if (onAddDonor) {
      onAddDonor(newDonor);
    } else {
      const donor: DonorProfile = {
        ...newDonor,
        id: `donor-${Date.now()}`
      };
      setLocalDonors(prev => [donor, ...prev]);
    }
  };

  // Add Pending Entry handler
  const handleAddPendingEntry = (newEntry: Omit<PendingVarganiEntry, 'id'>) => {
    if (onAddPendingEntry) {
      onAddPendingEntry(newEntry);
    } else {
      const entry: PendingVarganiEntry = {
        ...newEntry,
        id: `pv-${Date.now()}`
      };
      setLocalPending(prev => [entry, ...prev]);
    }
  };

  // Update Pending Status handler
  const handleUpdatePendingStatus = (id: string, status: PendingVarganiEntry['status'], collected?: number) => {
    if (onUpdatePendingStatus) {
      onUpdatePendingStatus(id, status, collected);
    } else {
      setLocalPending(prev => prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            status,
            collectedAmount: collected !== undefined ? collected : p.collectedAmount,
            lastFollowUpDate: new Date().toISOString().split('T')[0]
          };
        }
        return p;
      }));
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Subtabs Switcher Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-2 sm:p-2.5 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          
          <button
            onClick={() => setActiveSubTab('receipts')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeSubTab === 'receipts'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Receipt size={15} />
            <span>पावती नोंदवही (Pavati Book)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/30 dark:bg-black/20">
              {pavatis.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('donors')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeSubTab === 'donors'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Users size={15} />
            <span>दानशूर डेटाबेस (Donor Directory)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/30 dark:bg-black/20">
              {donors.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('pending')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeSubTab === 'pending'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Clock size={15} />
            <span>घरोघरी/दुकान पाठपुरावा (Pending)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/30 dark:bg-black/20">
              {pendingVargani.filter(p => p.status === 'Pending' || p.status === 'FollowUp').length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('tenDays')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeSubTab === 'tenDays'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            <TrendingUp size={15} />
            <span>१० दिवसीय उत्सव प्रगती (10-Day Progress)</span>
          </button>

        </div>

        {/* Quick New Receipt trigger */}
        <button
          onClick={() => {
            setActiveSubTab('receipts');
            setIsFormOpen(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all ml-auto"
        >
          <PlusCircle size={15} />
          <span>नवीन पावती</span>
        </button>
      </div>

      {/* RENDER CONDITIONAL SUB-VIEWS */}
      {activeSubTab === 'donors' && (
        <DonorDatabaseView
          donors={donors}
          pavatis={pavatis}
          mandal={mandal}
          lang={lang}
          onAddDonor={handleAddDonor}
          onSelectDonorForPavati={handleSelectDonorForPavati}
        />
      )}

      {activeSubTab === 'pending' && (
        <PendingVarganiView
          entries={pendingVargani}
          mandal={mandal}
          lang={lang}
          onAddEntry={handleAddPendingEntry}
          onUpdateStatus={handleUpdatePendingStatus}
          onCollectAndIssueReceipt={handleCollectAndIssueReceipt}
        />
      )}

      {activeSubTab === 'tenDays' && (
        <TenDayDashboardView
          dayWiseData={dayWiseCollections}
          pavatis={pavatis}
          expenses={expenses}
          mandal={mandal}
          lang={lang}
          onOpenDailySummaryModal={onOpenDailySummaryModal}
        />
      )}

      {/* MAIN PAVATI REGISTER VIEW */}
      {activeSubTab === 'receipts' && (
        <>
          {/* Top Financial Dashboard Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Income */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent rounded-3xl border border-emerald-500/20 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <ArrowUpRight size={16} /> {t.pavati.totalCollection}
            </span>
            <div className="p-2 bg-emerald-500/20 text-emerald-600 rounded-xl">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-main-text tracking-tight">
            ₹ {metrics.totalIncome.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-emerald-500/10">
            <span>सक्रिय पावत्या: {metrics.totalDonors} {metrics.cancelledCount > 0 && <span className="text-rose-500 font-bold">({metrics.cancelledCount} रद्द)</span>}</span>
            <span className="text-emerald-600 font-bold">सरासरी: ₹{metrics.avgDonation.toLocaleString()}</span>
          </div>
        </motion.div>

        {/* Total Expenses */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-5 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent rounded-3xl border border-rose-500/20 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <ArrowDownRight size={16} /> {t.pavati.totalExpenses}
            </span>
            <div className="p-2 bg-rose-500/20 text-rose-600 rounded-xl">
              <TrendingUp size={16} className="rotate-180" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-main-text tracking-tight">
            ₹ {metrics.totalExpenses.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-rose-500/10">
            <span>एकूण खर्च व्हाऊचर्स: {expenses.length} नोंदी</span>
          </div>
        </motion.div>

        {/* Net Balance (Treasury) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-3xl border border-amber-500/20 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Wallet size={16} /> {t.pavati.netBalance}
            </span>
            <div className="p-2 bg-amber-500/20 text-primary rounded-xl">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-main-text tracking-tight">
            ₹ {metrics.netBalance.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-amber-500/10 flex justify-between">
            <span>रोख: ₹{metrics.cashInHand.toLocaleString()}</span>
            <span>बँक: ₹{metrics.bankBalance.toLocaleString()}</span>
          </div>
        </motion.div>

        {/* Cash vs Online Breakdown */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-5 bg-surface rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
        >
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            भरणा पद्धतीनुसार शिल्लक
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <Banknote size={14} className="text-emerald-500" /> {t.pavati.cashInHand}:
              </span>
              <span className="font-bold text-main-text">₹ {metrics.cashInHand.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <Building size={14} className="text-blue-500" /> {t.pavati.bankBalance}:
              </span>
              <span className="font-bold text-main-text">₹ {metrics.bankBalance.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="pt-2 text-[10px] text-gray-400 text-right">
            १००% ऑडिट योग्य डिजिटल लेजर
          </div>
        </motion.div>

      </div>

      {/* Action Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-surface p-4 md:p-6 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder={t.pavati.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/80 rounded-2xl text-xs text-main-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Status Filter (All / Active / Cancelled) */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-main-text focus:outline-none"
          >
            <option value="all">सर्व पावत्या (All)</option>
            <option value="active">सक्रिय पावत्या (Active Only)</option>
            <option value="cancelled">रद्द केलेल्या पावत्या (Cancelled Only)</option>
          </select>

          {/* Category Filter */}
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text focus:outline-none"
          >
            <option value="all">सर्व वर्गवारी (All Categories)</option>
            <option value="General Donation (देणगी)">General Donation (देणगी)</option>
            <option value="Aarti / Puja Yajman (आरती/पूजा)">Aarti / Puja Yajman</option>
            <option value="Mahaprasad Sponsor (महाप्रसाद)">Mahaprasad Sponsor</option>
            <option value="Decoration & Murti Seva (देखावा/मूर्ती)">Decoration & Murti Seva</option>
            <option value="Advertisement / Sponsor (जाहिरात/प्रायोजक)">Advertisement / Sponsor</option>
            <option value="Vargani / Member Contribution (वर्गणी)">Vargani / Member Fee</option>
          </select>

          {/* Payment Mode Filter */}
          <select 
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text focus:outline-none"
          >
            <option value="all">सर्व भरणा माध्यम</option>
            <option value="cash">रोख (Cash)</option>
            <option value="upi">UPI / QR कोड</option>
            <option value="bank_transfer">NetBanking (NEFT/RTGS)</option>
            <option value="cheque">धनादेश (Cheque)</option>
          </select>

          {/* Export Excel Button */}
          <button 
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-all"
            title="Export to Excel"
          >
            <FileSpreadsheet size={16} />
            <span className="hidden sm:inline">Excel Export</span>
          </button>

          {/* Issue New Pavati Button */}
          <button 
            onClick={() => setIsFormOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-900/20 transition-all transform active:scale-95"
          >
            <PlusCircle size={16} />
            <span>{t.pavati.newReceipt}</span>
          </button>

        </div>

      </div>

      {/* New Pavati Issue Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-amber-300 dark:border-zinc-800 relative my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800 mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 text-primary rounded-xl">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-main-text">नवीन डिजिटल पावती नोंदणी</h3>
                    <p className="text-xs text-gray-500">पावती क्र. आपोआप पुढील अनुक्रमांकानुसार तयार होईल.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitPavati} className="space-y-4">
                
                {/* Donor Name & Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {t.pavati.donorName} *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="उदा. श्री. विकास महादेव पाटील"
                      value={formData.donorName}
                      onChange={e => setFormData({ ...formData, donorName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {t.pavati.amount} *
                    </label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      placeholder="उदा. 1001"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-black text-emerald-600 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Phone & Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {t.pavati.donorPhone} (WhatsApp SMS साठी)
                    </label>
                    <input 
                      type="tel" 
                      placeholder="9822012345"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-main-text outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {t.pavati.addressLabel}
                    </label>
                    <input 
                      type="text" 
                      placeholder="उदा. सदाशिव पेठ, पुणे"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    />
                  </div>
                </div>

                {/* Payment Mode & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {t.pavati.paymentMode} *
                    </label>
                    <select 
                      value={formData.paymentMode}
                      onChange={e => setFormData({ ...formData, paymentMode: e.target.value as PaymentMode })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    >
                      <option value="upi">UPI / QR कोड (PhonePe, GPay, Paytm)</option>
                      <option value="cash">रोख भरणा (Cash in Hand)</option>
                      <option value="bank_transfer">NetBanking (NEFT / RTGS)</option>
                      <option value="cheque">धनादेश (Cheque)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {t.pavati.category} *
                    </label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as IncomeCategory })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    >
                      <option value="General Donation (देणगी)">General Donation (देणगी)</option>
                      <option value="Aarti / Puja Yajman (आरती/पूजा)">Aarti / Puja Yajman (आरती/पूजा)</option>
                      <option value="Mahaprasad Sponsor (महाप्रसाद)">Mahaprasad Sponsor (महाप्रसाद)</option>
                      <option value="Decoration & Murti Seva (देखावा/मूर्ती)">Decoration & Murti Seva</option>
                      <option value="Advertisement / Sponsor (जाहिरात/प्रायोजक)">Advertisement / Sponsor</option>
                      <option value="Vargani / Member Contribution (वर्गणी)">Vargani / Member Contribution</option>
                      <option value="Other Income (इतर जमा)">Other Income (इतर जमा)</option>
                    </select>
                  </div>
                </div>

                {/* UTR / Ref & Received By */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {t.pavati.utrLabel} (UPI / Cheque No.)
                    </label>
                    <input 
                      type="text" 
                      placeholder="उदा. UPI-41098234"
                      value={formData.transactionRef}
                      onChange={e => setFormData({ ...formData, transactionRef: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-main-text outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {t.pavati.receivedBy}
                    </label>
                    <input 
                      type="text" 
                      value={formData.receivedBy}
                      onChange={e => setFormData({ ...formData, receivedBy: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    संकल्प / विशेष शेरा (ऐच्छिक)
                  </label>
                  <input 
                    type="text" 
                    placeholder="उदा. महाप्रसाद वाटप संकल्प, कुलदेवता स्मरण..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="w-1/3 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                  >
                    रद्द करा
                  </button>
                  <button 
                    type="submit"
                    className="w-2/3 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl text-xs font-bold hover:from-orange-700 hover:to-amber-700 flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 transition-all"
                  >
                    <CheckCircle2 size={16} />
                    {t.pavati.generateBtn}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Pavati Modal */}
      <AnimatePresence>
        {editingPavati && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-blue-400 dark:border-zinc-800 relative my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800 mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                    <FileEdit size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-main-text">पावती दुरुस्ती (Edit Pavati)</h3>
                    <p className="text-xs text-gray-500">पावती क्र: <span className="font-mono font-bold text-primary">{editingPavati.receiptNumber}</span></p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingPavati(null)}
                  className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                
                {/* Donor Name & Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      देणगीदाराचे नाव *
                    </label>
                    <input 
                      type="text" 
                      required
                      value={editFormData.donorName}
                      onChange={e => setEditFormData({ ...editFormData, donorName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      रक्कम (₹) *
                    </label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={editFormData.amount}
                      onChange={e => setEditFormData({ ...editFormData, amount: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-black text-emerald-600 dark:text-emerald-400 outline-none"
                    />
                  </div>
                </div>

                {/* Phone & Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      मोबाईल नंबर
                    </label>
                    <input 
                      type="tel" 
                      value={editFormData.phone}
                      onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-main-text outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      पत्ता / शहर
                    </label>
                    <input 
                      type="text" 
                      value={editFormData.address}
                      onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    />
                  </div>
                </div>

                {/* Payment Mode & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      भरणा माध्यम
                    </label>
                    <select 
                      value={editFormData.paymentMode}
                      onChange={e => setEditFormData({ ...editFormData, paymentMode: e.target.value as PaymentMode })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    >
                      <option value="upi">UPI / QR कोड</option>
                      <option value="cash">रोख भरणा (Cash)</option>
                      <option value="bank_transfer">NetBanking (NEFT / RTGS)</option>
                      <option value="cheque">धनादेश (Cheque)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      देणगी वर्गवारी
                    </label>
                    <select 
                      value={editFormData.category}
                      onChange={e => setEditFormData({ ...editFormData, category: e.target.value as IncomeCategory })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    >
                      <option value="General Donation (देणगी)">General Donation (देणगी)</option>
                      <option value="Aarti / Puja Yajman (आरती/पूजा)">Aarti / Puja Yajman (आरती/पूजा)</option>
                      <option value="Mahaprasad Sponsor (महाप्रसाद)">Mahaprasad Sponsor (महाप्रसाद)</option>
                      <option value="Decoration & Murti Seva (देखावा/मूर्ती)">Decoration & Murti Seva</option>
                      <option value="Advertisement / Sponsor (जाहिरात/प्रायोजक)">Advertisement / Sponsor</option>
                      <option value="Vargani / Member Contribution (वर्गणी)">Vargani / Member Contribution</option>
                      <option value="Other Income (इतर जमा)">Other Income (इतर जमा)</option>
                    </select>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      दिनांक (Date)
                    </label>
                    <input 
                      type="date" 
                      value={editFormData.date}
                      onChange={e => setEditFormData({ ...editFormData, date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      वेळ (Time)
                    </label>
                    <input 
                      type="text" 
                      value={editFormData.time}
                      onChange={e => setEditFormData({ ...editFormData, time: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    />
                  </div>
                </div>

                {/* UTR / Ref & Received By */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      UPI / Cheque संदर्भ क्र.
                    </label>
                    <input 
                      type="text" 
                      value={editFormData.transactionRef}
                      onChange={e => setEditFormData({ ...editFormData, transactionRef: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-main-text outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      पावती देणारा / कारकून
                    </label>
                    <input 
                      type="text" 
                      value={editFormData.receivedBy}
                      onChange={e => setEditFormData({ ...editFormData, receivedBy: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    संकल्प / विशेष शेरा
                  </label>
                  <input 
                    type="text" 
                    value={editFormData.notes}
                    onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setEditingPavati(null)}
                    className="w-1/3 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                  >
                    रद्द करा
                  </button>
                  <button 
                    type="submit"
                    className="w-2/3 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Check size={16} />
                    बदल जतन करा (Save Changes)
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel / Void Pavati Modal */}
      <AnimatePresence>
        {cancellingPavati && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-2xl border border-amber-400 dark:border-zinc-800 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-600 rounded-2xl">
                  <Ban size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-main-text">पावती रद्द करा (Void / Cancel Receipt)</h3>
                  <p className="text-xs text-gray-500">पावती क्र: {cancellingPavati.receiptNumber} • ₹{cancellingPavati.amount}</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200 dark:border-amber-900/40">
                पावती रद्द केल्यावर ही रक्कम एकूण संकलनातून वजा केली जाईल, परंतु ऑडिट नोंदीसाठी ही पावती लेजरमध्ये लाल रंगात राहील.
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  रद्द करण्याचे कारण (Reason for Cancellation) *
                </label>
                <select 
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                >
                  <option value="चुकीची रक्कम नोंदवली (Incorrect Amount)">चुकीची रक्कम नोंदवली (Incorrect Amount)</option>
                  <option value="रक्कम परत केली (Donation Refunded)">रक्कम परत केली (Donation Refunded)</option>
                  <option value="ड्युप्लिकेट नोंद (Duplicate Entry)">ड्युप्लिकेट नोंद (Duplicate Entry)</option>
                  <option value="देणगीदाराची दुरुस्ती विनंती (Donor Request)">देणगीदाराची दुरुस्ती विनंती (Donor Request)</option>
                  <option value="इतर तांत्रिक कारण (Other Technical Reason)">इतर तांत्रिक कारण (Other)</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setCancellingPavati(null)}
                  className="w-1/2 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold"
                >
                  मागे जा
                </button>
                <button 
                  type="button"
                  onClick={handleConfirmCancel}
                  className="w-1/2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Ban size={15} />
                  होय, पावती रद्द करा
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Permanent Modal */}
      <AnimatePresence>
        {deletingPavati && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-2xl border border-rose-400 dark:border-zinc-800 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500/20 text-rose-600 rounded-2xl">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-main-text">पावती नष्ट करा (Delete Pavati)</h3>
                  <p className="text-xs text-rose-500 font-bold">ही कृती पूर्ववत करता येणार नाही.</p>
                </div>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/40 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                <p><span className="font-bold">पावती क्र:</span> {deletingPavati.receiptNumber}</p>
                <p><span className="font-bold">देणगीदार:</span> {deletingPavati.donorName}</p>
                <p><span className="font-bold">रक्कम:</span> ₹{deletingPavati.amount.toLocaleString('en-IN')}</p>
              </div>

              <div className="pt-3 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setDeletingPavati(null)}
                  className="w-1/2 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold"
                >
                  रद्द करा
                </button>
                <button 
                  type="button"
                  onClick={handleConfirmDelete}
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-900/20"
                >
                  <Trash2 size={15} />
                  कायमस्वरूपी डिलीट करा
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pavati Table & Cards */}
      <div className="bg-surface rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs text-main-text">
            <thead className="bg-gray-50 dark:bg-zinc-800/80 uppercase tracking-wider text-[10px] text-gray-500 font-bold border-b border-gray-100 dark:border-zinc-700">
              <tr>
                <th className="py-4 px-6">पावती क्र.</th>
                <th className="py-4 px-6">दिनांक / वेळ</th>
                <th className="py-4 px-6">देणगीदाराचे नाव</th>
                <th className="py-4 px-6">वर्गवारी</th>
                <th className="py-4 px-6">भरणा पद्धत</th>
                <th className="py-4 px-6 text-right">रक्कम (₹)</th>
                <th className="py-4 px-6 text-center">कृती (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {filteredPavatis.map((pavati) => {
                const isCancelled = !!pavati.isCancelled;
                return (
                  <tr 
                    key={pavati.id} 
                    className={`transition-colors ${
                      isCancelled 
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 opacity-75' 
                        : 'hover:bg-gray-50/50 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <td className="py-4 px-6 font-mono font-bold text-primary">
                      <div className="flex items-center gap-1.5">
                        <span className={isCancelled ? 'line-through text-rose-500' : ''}>{pavati.receiptNumber}</span>
                        {isCancelled && (
                          <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] rounded font-sans font-bold">
                            रद्द
                          </span>
                        )}
                        {pavati.lastEditedAt && !isCancelled && (
                          <span className="text-[9px] text-blue-500 font-sans" title={`दुरुस्ती: ${pavati.lastEditedAt}`}>
                            ✎
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-500">
                      <div>{pavati.date}</div>
                      <div className="text-[10px] text-gray-400">{pavati.time}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`font-bold text-main-text ${isCancelled ? 'line-through text-gray-400' : ''}`}>
                        {pavati.donorName}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">+91 {pavati.phone} {pavati.address ? `• ${pavati.address}` : ''}</div>
                      {isCancelled && pavati.cancellationReason && (
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">कारण: {pavati.cancellationReason}</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 rounded-lg text-[10px] font-bold border border-amber-200 dark:border-amber-900/40">
                        {pavati.category.split(' ')[0]}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 font-bold uppercase text-[10px] text-gray-600 dark:text-gray-300">
                        {pavati.paymentMode === 'cash' ? <Banknote size={12} className="text-emerald-500" /> : <Smartphone size={12} className="text-blue-500" />}
                        {pavati.paymentMode}
                      </span>
                    </td>
                    <td className={`py-4 px-6 text-right font-black text-sm ${isCancelled ? 'line-through text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      ₹ {pavati.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* View Receipt */}
                        <button 
                          onClick={() => onViewReceipt(pavati)}
                          className="p-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl transition-all"
                          title="पावती पहा (View)"
                        >
                          <Eye size={15} />
                        </button>

                        {/* WhatsApp Share */}
                        <button 
                          onClick={() => {
                            const text = encodeURIComponent(
                              `🚩 *${mandal.nameMr}* 🚩\nपावती क्र: ${pavati.receiptNumber}\nदेणगीदार: ${pavati.donorName}\nरक्कम: ₹${pavati.amount}\n|| गणपती बाप्पा मोरया ||`
                            );
                            window.open(`https://wa.me/91${pavati.phone}?text=${text}`, '_blank');
                          }}
                          className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                          title="WhatsApp वर पाठवा"
                        >
                          <Share2 size={15} />
                        </button>

                        {/* Edit Pavati */}
                        <button 
                          onClick={() => handleStartEdit(pavati)}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                          title="पावती दुरुस्ती करा (Edit)"
                        >
                          <Edit3 size={15} />
                        </button>

                        {/* Cancel / Restore Pavati */}
                        {isCancelled ? (
                          <button 
                            onClick={() => handleRestore(pavati)}
                            className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-xl transition-all"
                            title="पुन्हा सक्रिय करा (Restore)"
                          >
                            <RotateCcw size={15} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => setCancellingPavati(pavati)}
                            className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-xl transition-all"
                            title="पावती रद्द करा (Void / Cancel)"
                          >
                            <Ban size={15} />
                          </button>
                        )}

                        {/* Delete Pavati Permanent */}
                        <button 
                          onClick={() => setDeletingPavati(pavati)}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                          title="कायमस्वरूपी नष्ट करा (Delete)"
                        >
                          <Trash2 size={15} />
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile / Tablet Responsive Cards */}
        <div className="lg:hidden p-4 space-y-3">
          {filteredPavatis.map(pavati => {
            const isCancelled = !!pavati.isCancelled;
            return (
              <div 
                key={pavati.id} 
                className={`p-4 rounded-2xl border space-y-3 ${
                  isCancelled 
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' 
                    : 'bg-gray-50/70 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono text-xs font-bold text-primary block ${isCancelled ? 'line-through text-rose-500' : ''}`}>
                        {pavati.receiptNumber}
                      </span>
                      {isCancelled && (
                        <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] rounded font-bold">
                          रद्द
                        </span>
                      )}
                    </div>
                    <h4 className={`font-bold text-sm text-main-text ${isCancelled ? 'line-through text-gray-400' : ''}`}>
                      {pavati.donorName}
                    </h4>
                    <span className="text-[11px] text-gray-500">{pavati.date} • {pavati.time}</span>
                    {isCancelled && pavati.cancellationReason && (
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">कारण: {pavati.cancellationReason}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-base font-black block ${isCancelled ? 'line-through text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      ₹ {pavati.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">{pavati.paymentMode}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200/60 dark:border-zinc-700/60 text-xs">
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    {pavati.category}
                  </span>

                  <div className="flex items-center gap-1.5">
                    
                    {/* View */}
                    <button 
                      onClick={() => onViewReceipt(pavati)}
                      className="px-2.5 py-1.5 bg-primary/10 text-primary rounded-xl font-bold text-xs flex items-center gap-1"
                    >
                      <Eye size={13} /> पहा
                    </button>

                    {/* WhatsApp */}
                    <button 
                      onClick={() => {
                        const text = encodeURIComponent(
                          `🚩 *${mandal.nameMr}* 🚩\nपावती क्र: ${pavati.receiptNumber}\nदेणगीदार: ${pavati.donorName}\nरक्कम: ₹${pavati.amount}\n|| गणपती बाप्पा मोरया ||`
                        );
                        window.open(`https://wa.me/91${pavati.phone}?text=${text}`, '_blank');
                      }}
                      className="p-1.5 bg-emerald-500 text-white rounded-xl"
                    >
                      <Share2 size={13} />
                    </button>

                    {/* Edit */}
                    <button 
                      onClick={() => handleStartEdit(pavati)}
                      className="p-1.5 bg-blue-500 text-white rounded-xl"
                      title="Edit"
                    >
                      <Edit3 size={13} />
                    </button>

                    {/* Cancel / Restore */}
                    {isCancelled ? (
                      <button 
                        onClick={() => handleRestore(pavati)}
                        className="p-1.5 bg-amber-500 text-white rounded-xl"
                        title="Restore"
                      >
                        <RotateCcw size={13} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => setCancellingPavati(pavati)}
                        className="p-1.5 bg-amber-500 text-white rounded-xl"
                        title="Cancel/Void"
                      >
                        <Ban size={13} />
                      </button>
                    )}

                    {/* Delete */}
                    <button 
                      onClick={() => setDeletingPavati(pavati)}
                      className="p-1.5 bg-rose-500 text-white rounded-xl"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>

                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredPavatis.length === 0 && (
          <div className="text-center py-16 px-4">
            <Receipt className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={48} />
            <h4 className="font-bold text-gray-600 dark:text-gray-300 text-sm">कोणतीही पावती सापडली नाही</h4>
            <p className="text-xs text-gray-400 mt-1">कृपया शोध निकष बदला किंवा नवीन पावती नोंदवा.</p>
          </div>
        )}

      </div>
      </>
      )}

    </div>
  );
};
