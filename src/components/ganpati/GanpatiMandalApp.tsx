import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Receipt, 
  ReceiptText, 
  Users, 
  Flame, 
  Heart, 
  Package, 
  BarChart3, 
  Map, 
  Languages, 
  Shield, 
  UserCheck, 
  ArrowLeft, 
  PlusCircle, 
  Sparkles, 
  Bell, 
  Check, 
  Share2,
  Crown,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Smartphone,
  Banknote,
  Landmark,
  Scale,
  Calendar,
  Layers,
  RefreshCw,
  LogOut,
  Key,
  Lock,
  ChevronDown
} from 'lucide-react';

import { 
  DigitalPavati, 
  ExpenseEntry, 
  Member, 
  VolunteerDuty, 
  AartiSchedule, 
  MandalEvent, 
  MannatPrayer, 
  GalleryItem, 
  InventoryItem, 
  PandalZone, 
  MandalProfile, 
  MandalLanguage, 
  Announcement,
  DonorProfile,
  PendingVarganiEntry,
  DayWiseCollection,
  VolunteerCollector,
  CashHandoverRecord,
  NightlyVerificationRecord,
  MandalAccount,
  MandalDataset,
  MandalUserSession
} from './types';

import { 
  getActiveSession, 
  setActiveSession, 
  getMandalDataset, 
  saveMandalDataset, 
  getAllMandalAccounts, 
  getMandalAccount, 
  clearActiveSession 
} from './services/mandalStorageService';

import { mandalTranslations } from './translations/mandalTranslations';
import { PavatiBookSection } from './components/PavatiBookSection';
import { DigitalReceiptModal } from './components/DigitalReceiptModal';
import { ExpenseLedgerSection } from './components/ExpenseLedgerSection';
import { CoreMandalProfileSection } from './components/CoreMandalProfileSection';
import { MembershipVolunteerSection } from './components/MembershipVolunteerSection';
import { EventsAartiSection } from './components/EventsAartiSection';
import { DevoteeEngagementSection } from './components/DevoteeEngagementSection';
import { InventoryStockSection } from './components/InventoryStockSection';
import { ReportingAnalyticsSection } from './components/ReportingAnalyticsSection';
import { PandalMapAndProSection } from './components/PandalMapAndProSection';
import { VolunteerManagementSection } from './components/VolunteerManagementSection';
import { VolunteerCollectorWorkspace } from './components/VolunteerCollectorWorkspace';
import { DailySummaryVerificationModal } from './components/DailySummaryVerificationModal';
import { MultiMandalLoginModal } from './components/MultiMandalLoginModal';
import { MandalSwitchModal } from './components/MandalSwitchModal';

export const GanpatiMandalApp: React.FC = () => {
  // App Session State
  const [activeSession, setActiveSessionState] = useState<MandalUserSession>(() => getActiveSession());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

  // App UI State
  const [lang, setLang] = useState<MandalLanguage>('mr');
  const [userRole, setUserRole] = useState<'admin' | 'karyakarta' | 'devotee'>(() => {
    const s = getActiveSession();
    return s.role === 'treasurer' ? 'admin' : (s.role as any);
  });
  const [activeTab, setActiveTab] = useState<
    'pavati' | 'expenses' | 'volunteers' | 'profile' | 'members' | 'events' | 'devotee' | 'inventory' | 'reports' | 'pandal'
  >('pavati');

  // Multi-Tenant Isolated Dataset State
  const [dataset, setDataset] = useState<MandalDataset>(() => {
    const s = getActiveSession();
    return getMandalDataset(s.mandalId);
  });

  // Current Volunteer for Collector Workspace
  const [currentVolunteer, setCurrentVolunteer] = useState<VolunteerCollector>(() => {
    const s = getActiveSession();
    const d = getMandalDataset(s.mandalId);
    return d.volunteers[0] || {
      id: 'vol-default',
      name: 'स्वयंसेवक',
      phone: '9800000000',
      role: 'Collection Volunteer',
      assignedZone: 'Main Zone',
      bookPrefix: 'HQ01',
      allocatedReceiptsRange: '1-100',
      currentReceiptIndex: 0,
      totalCollected: 0,
      cashCollected: 0,
      digitalCollected: 0,
      cashInHand: 0,
      cashHandedOver: 0,
      totalReceiptsCount: 0,
      status: 'Active'
    };
  });

  // Daily Summary & Nightly Verification Records
  const [isDailySummaryModalOpen, setIsDailySummaryModalOpen] = useState<boolean>(false);
  const [dailySummarySelectedDate, setDailySummarySelectedDate] = useState<string>('2026-08-15');

  // Active Receipt Modal
  const [viewingReceipt, setViewingReceipt] = useState<DigitalPavati | null>(null);

  // Sync / Persist helper: updates state & saves to active mandal dataset
  const updateDataset = (updater: (prev: MandalDataset) => MandalDataset) => {
    setDataset(prev => {
      const next = updater(prev);
      saveMandalDataset(activeSession.mandalId, next);
      return next;
    });
  };

  // Helper to switch active mandal
  const handleSessionChange = (newSession: MandalUserSession) => {
    setActiveSessionState(newSession);
    setUserRole(newSession.role === 'treasurer' ? 'admin' : (newSession.role as any));
    const loaded = getMandalDataset(newSession.mandalId);
    setDataset(loaded);
    if (loaded.volunteers && loaded.volunteers.length > 0) {
      setCurrentVolunteer(loaded.volunteers[0]);
    }
    setViewingReceipt(null);
    setIsDailySummaryModalOpen(false);
  };

  const mandal = dataset.profile;
  const pavatis = dataset.pavatis;
  const expenses = dataset.expenses;
  const members = dataset.members;
  const duties = dataset.duties;
  const aartis = dataset.aartis;
  const events = dataset.events;
  const mannats = dataset.mannats;
  const gallery = dataset.gallery;
  const inventory = dataset.inventory;
  const zones = dataset.zones;
  const announcements = dataset.announcements;
  const donors = dataset.donors;
  const pendingVargani = dataset.pendingVargani;
  const dayWiseCollections = dataset.dayWiseCollections;
  const volunteers = dataset.volunteers;
  const handovers = dataset.handovers;
  const verifications = dataset.verifications;

  const t = mandalTranslations[lang];

  // =========================================================================
  // AUTOMATIC REAL-TIME FINANCIAL & COMMITTEE CALCULATIONS
  // =========================================================================
  const financialStats = useMemo(() => {
    // Active pavatis only (ignoring cancelled ones)
    const activePavatis = pavatis.filter(p => !p.isCancelled && p.status !== 'Cancelled');
    const totalIncome = activePavatis.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netBalance = totalIncome - totalExpense;

    // Income breakdown by mode (case-insensitive)
    const isMode = (mode: string, targets: string[]) => targets.some(t => mode?.toLowerCase() === t.toLowerCase());

    const incomeCash = activePavatis.filter(p => isMode(p.paymentMode, ['cash'])).reduce((sum, p) => sum + p.amount, 0);
    const incomeUpi = activePavatis.filter(p => isMode(p.paymentMode, ['upi', 'gpay', 'phonepe', 'paytm', 'online', 'qr'])).reduce((sum, p) => sum + p.amount, 0);
    const incomeBank = activePavatis.filter(p => isMode(p.paymentMode, ['bank transfer', 'neft', 'rtgs', 'netbanking', 'imps', 'bank'])).reduce((sum, p) => sum + p.amount, 0);
    const incomeCheque = activePavatis.filter(p => isMode(p.paymentMode, ['cheque', 'check', 'dd'])).reduce((sum, p) => sum + p.amount, 0);

    // Expense breakdown by mode
    const expenseCash = expenses.filter(e => isMode(e.paymentMode, ['cash'])).reduce((sum, e) => sum + e.amount, 0);
    const expenseUpi = expenses.filter(e => isMode(e.paymentMode, ['upi', 'gpay', 'phonepe', 'paytm', 'online', 'qr'])).reduce((sum, e) => sum + e.amount, 0);
    const expenseBank = expenses.filter(e => isMode(e.paymentMode, ['bank transfer', 'neft', 'rtgs', 'netbanking', 'imps', 'bank'])).reduce((sum, e) => sum + e.amount, 0);
    const expenseCheque = expenses.filter(e => isMode(e.paymentMode, ['cheque', 'check', 'dd'])).reduce((sum, e) => sum + e.amount, 0);

    // Net balance breakdown by mode
    const balanceCash = incomeCash - expenseCash;
    const balanceUpi = incomeUpi - expenseUpi;
    const balanceBank = incomeBank - expenseBank;
    const balanceCheque = incomeCheque - expenseCheque;

    // Executive bearers count
    const executiveCount = members.filter(m => m.isExecutiveBearer || ['President', 'Vice President', 'Working President', 'Secretary', 'Treasurer', 'Executive Member'].includes(m.role)).length;

    return {
      totalIncome,
      totalExpense,
      netBalance,
      incomeCash,
      incomeUpi,
      incomeBank,
      incomeCheque,
      expenseCash,
      expenseUpi,
      expenseBank,
      expenseCheque,
      balanceCash,
      balanceUpi,
      balanceBank,
      balanceCheque,
      totalPavatisCount: activePavatis.length,
      totalExpensesCount: expenses.length,
      executiveCount,
      totalMembersCount: members.length
    };
  }, [pavatis, expenses, members]);

  // =====================
  // MANDAL PROFILE HANDLERS
  // =====================
  const handleUpdateMandal = (updatedMandal: MandalProfile) => {
    updateDataset(prev => ({
      ...prev,
      profile: updatedMandal
    }));
  };

  // =====================
  // PAVATI (RECEIPT) HANDLERS
  // =====================
  const handleAddPavati = (newPavati: Omit<DigitalPavati, 'id'>) => {
    const created: DigitalPavati = {
      ...newPavati,
      id: `pavati-${Date.now()}`
    };

    updateDataset(prev => {
      let updatedVolunteers = prev.volunteers;
      if (newPavati.collectorId || newPavati.bookPrefix) {
        updatedVolunteers = prev.volunteers.map(v => {
          if (v.id === newPavati.collectorId || v.bookPrefix === newPavati.bookPrefix) {
            const amt = Number(newPavati.amount) || 0;
            const isCash = newPavati.paymentMode === 'cash' || newPavati.paymentMode === 'Cash';
            return {
              ...v,
              totalCollected: v.totalCollected + amt,
              totalReceiptsCount: v.totalReceiptsCount + 1,
              cashCollected: isCash ? v.cashCollected + amt : v.cashCollected,
              digitalCollected: !isCash ? v.digitalCollected + amt : v.digitalCollected,
              cashInHand: isCash ? v.cashInHand + amt : v.cashInHand,
              currentReceiptIndex: v.currentReceiptIndex + 1,
              lastActiveAt: new Date().toISOString()
            };
          }
          return v;
        });
      }

      return {
        ...prev,
        pavatis: [created, ...prev.pavatis],
        volunteers: updatedVolunteers
      };
    });

    setViewingReceipt(created);
  };

  // =====================
  // VOLUNTEER & CASH HANDOVER HANDLERS
  // =====================
  const handleAddVolunteer = (newVol: Omit<VolunteerCollector, 'id'>) => {
    const created: VolunteerCollector = {
      ...newVol,
      id: `vol-${Date.now()}`
    };
    updateDataset(prev => ({
      ...prev,
      volunteers: [...prev.volunteers, created]
    }));
  };

  const handleUpdateVolunteer = (updatedVol: VolunteerCollector) => {
    updateDataset(prev => ({
      ...prev,
      volunteers: prev.volunteers.map(v => v.id === updatedVol.id ? updatedVol : v)
    }));
    if (currentVolunteer.id === updatedVol.id) {
      setCurrentVolunteer(updatedVol);
    }
  };

  const handleDeleteVolunteer = (volunteerId: string) => {
    updateDataset(prev => ({
      ...prev,
      volunteers: prev.volunteers.filter(v => v.id !== volunteerId)
    }));
  };

  const handleRecordHandover = (newHandover: Omit<CashHandoverRecord, 'id'>) => {
    const created: CashHandoverRecord = {
      ...newHandover,
      id: `hnd-${Date.now()}`
    };

    updateDataset(prev => ({
      ...prev,
      handovers: [created, ...prev.handovers],
      volunteers: prev.volunteers.map(v => {
        if (v.id === newHandover.volunteerId) {
          return {
            ...v,
            cashHandedOver: v.cashHandedOver + newHandover.amount,
            cashInHand: Math.max(0, v.cashInHand - newHandover.amount),
            lastActiveAt: new Date().toISOString()
          };
        }
        return v;
      })
    }));
  };

  const handleUpdatePavati = (updatedPavati: DigitalPavati) => {
    updateDataset(prev => ({
      ...prev,
      pavatis: prev.pavatis.map(p => p.id === updatedPavati.id ? updatedPavati : p)
    }));
    if (viewingReceipt?.id === updatedPavati.id) {
      setViewingReceipt(updatedPavati);
    }
  };

  const handleDeletePavati = (pavatiId: string) => {
    updateDataset(prev => ({
      ...prev,
      pavatis: prev.pavatis.filter(p => p.id !== pavatiId)
    }));
    if (viewingReceipt?.id === pavatiId) {
      setViewingReceipt(null);
    }
  };

  const handleCancelPavati = (pavatiId: string, reason: string) => {
    updateDataset(prev => ({
      ...prev,
      pavatis: prev.pavatis.map(p => {
        if (p.id === pavatiId) {
          return {
            ...p,
            isCancelled: true,
            status: 'Cancelled',
            cancellationReason: reason,
            lastEditedAt: new Date().toISOString()
          };
        }
        return p;
      })
    }));
  };

  const handleRestorePavati = (pavatiId: string) => {
    updateDataset(prev => ({
      ...prev,
      pavatis: prev.pavatis.map(p => {
        if (p.id === pavatiId) {
          return {
            ...p,
            isCancelled: false,
            status: 'Active',
            cancellationReason: undefined,
            lastEditedAt: new Date().toISOString()
          };
        }
        return p;
      })
    }));
  };

  // =====================
  // MEMBERSHIP & SABHASAD HANDLERS
  // =====================
  const handleAddMember = (newMember: Omit<Member, 'id'>) => {
    const created: Member = {
      ...newMember,
      id: `m-${Date.now()}`
    };
    updateDataset(prev => ({
      ...prev,
      members: [...prev.members, created]
    }));
  };

  const handleUpdateMember = (updatedMember: Member) => {
    updateDataset(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === updatedMember.id ? updatedMember : m)
    }));
  };

  const handleDeleteMember = (memberId: string) => {
    updateDataset(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== memberId)
    }));
  };

  const handleUpdateMemberFee = (memberId: string, status: 'Paid' | 'Pending') => {
    updateDataset(prev => ({
      ...prev,
      members: prev.members.map(m => {
        if (m.id === memberId) {
          return {
            ...m,
            annualFeeStatus: status,
            feePaidAmount: status === 'Paid' ? (m.feePaidAmount > 0 ? m.feePaidAmount : 2000) : 0,
            dueAmount: status === 'Paid' ? 0 : 2000
          };
        }
        return m;
      })
    }));
  };

  // =====================
  // EXPENSES HANDLERS
  // =====================
  const handleAddExpense = (newExpense: Omit<ExpenseEntry, 'id'>) => {
    const created: ExpenseEntry = {
      ...newExpense,
      id: `exp-${Date.now()}`
    };
    updateDataset(prev => ({
      ...prev,
      expenses: [created, ...prev.expenses]
    }));
  };

  const handleUpdateExpense = (updatedExpense: ExpenseEntry) => {
    updateDataset(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e)
    }));
  };

  const handleDeleteExpense = (expenseId: string) => {
    updateDataset(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== expenseId)
    }));
  };

  const handleAddDuty = (newDuty: Omit<VolunteerDuty, 'id'>) => {
    const created: VolunteerDuty = {
      ...newDuty,
      id: `duty-${Date.now()}`
    };
    updateDataset(prev => ({
      ...prev,
      duties: [...prev.duties, created]
    }));
  };

  const handleAddAnnouncement = (ann: Omit<Announcement, 'id'>) => {
    const created: Announcement = {
      ...ann,
      id: `ann-${Date.now()}`
    };
    updateDataset(prev => ({
      ...prev,
      announcements: [created, ...prev.announcements]
    }));
  };

  const handleAddMannat = (m: Omit<MannatPrayer, 'id'>) => {
    const created: MannatPrayer = {
      ...m,
      id: `man-${Date.now()}`
    };
    updateDataset(prev => ({
      ...prev,
      mannats: [created, ...prev.mannats]
    }));
  };

  const handleAddInventory = (inv: Omit<InventoryItem, 'id'>) => {
    const created: InventoryItem = {
      ...inv,
      id: `inv-${Date.now()}`
    };
    updateDataset(prev => ({
      ...prev,
      inventory: [...prev.inventory, created]
    }));
  };

  const handleUpdateInventoryQty = (id: string, newQty: number) => {
    updateDataset(prev => ({
      ...prev,
      inventory: prev.inventory.map(i => i.id === id ? { ...i, quantity: newQty } : i)
    }));
  };

  // =====================
  // DONOR & PENDING VARGANI HANDLERS
  // =====================
  const handleAddDonor = (newDonor: Omit<DonorProfile, 'id'>) => {
    const created: DonorProfile = {
      ...newDonor,
      id: `donor-${Date.now()}`
    };
    updateDataset(prev => ({
      ...prev,
      donors: [created, ...prev.donors]
    }));
  };

  const handleAddPendingEntry = (newEntry: Omit<PendingVarganiEntry, 'id'>) => {
    const created: PendingVarganiEntry = {
      ...newEntry,
      id: `pv-${Date.now()}`
    };
    updateDataset(prev => ({
      ...prev,
      pendingVargani: [created, ...prev.pendingVargani]
    }));
  };

  const handleUpdatePendingStatus = (id: string, status: PendingVarganiEntry['status'], collected?: number) => {
    updateDataset(prev => ({
      ...prev,
      pendingVargani: prev.pendingVargani.map(p => {
        if (p.id === id) {
          return {
            ...p,
            status,
            collectedAmount: collected !== undefined ? collected : p.collectedAmount,
            lastFollowUpDate: new Date().toISOString().split('T')[0]
          };
        }
        return p;
      })
    }));
  };

  // =====================
  // DAILY SUMMARY & NIGHTLY VERIFICATION HANDLERS
  // =====================
  const handleSaveVerification = (newOrUpdated: NightlyVerificationRecord) => {
    updateDataset(prev => {
      const exists = prev.verifications.some(v => v.id === newOrUpdated.id || v.date === newOrUpdated.date);
      let updatedList = prev.verifications;
      if (exists) {
        updatedList = prev.verifications.map(v => (v.id === newOrUpdated.id || v.date === newOrUpdated.date) ? newOrUpdated : v);
      } else {
        updatedList = [...prev.verifications, newOrUpdated];
      }
      return {
        ...prev,
        verifications: updatedList
      };
    });
  };

  const handleOpenDailySummary = (date?: string) => {
    if (date) setDailySummarySelectedDate(date);
    setIsDailySummaryModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-main-text selection:bg-orange-500 selection:text-white transition-colors duration-300">
      
      {/* Top Application Bar with Multi-Mandal Switcher */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 shadow-sm">
        
        {/* Upper Bar: Multi-Mandal Tenant Badge & Global Switcher */}
        <div className="bg-gradient-to-r from-orange-700 via-amber-700 to-orange-800 text-white px-4 sm:px-6 lg:px-8 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            
            {/* Active Tenant Code & Multi-Mandal Security Badge */}
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-white/20 border border-white/30 text-[10px] font-black tracking-widest font-mono uppercase flex items-center gap-1">
                <Shield size={11} className="text-amber-300" />
                MANDAL: {activeSession.mandalCode}
              </span>
              <span className="hidden sm:inline-flex text-[11px] text-orange-100 items-center gap-1">
                <Layers size={12} className="text-amber-300" />
                100% डेटा पृथक्करण (Isolated Tenant Storage)
              </span>
            </div>

            {/* Switch Mandal & Registration Quick Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSwitchModalOpen(true)}
                className="px-3 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border border-white/20"
              >
                <RefreshCw size={12} />
                <span>मंडळ बदला (Switch Mandal)</span>
              </button>

              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-orange-950 text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <PlusCircle size={12} />
                <span>नवीन मंडळ नोंदणी</span>
              </button>
            </div>

          </div>
        </div>

        {/* Main Header Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand & Back Button */}
          <div className="flex items-center gap-3">
            <Link 
              to="/projects"
              className="p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 transition-all flex items-center gap-1.5 text-xs font-bold"
              title="Back to Portfolio Projects"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Portfolio</span>
            </Link>

            <div className="flex items-center gap-2.5">
              {mandal.logoUrl ? (
                <img 
                  src={mandal.logoUrl} 
                  alt="Logo" 
                  className="w-10 h-10 rounded-xl object-cover border border-amber-400 shadow-sm bg-white p-0.5" 
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-orange-900/20 text-base">
                  🚩
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black text-main-text leading-tight tracking-tight">
                    {lang === 'mr' ? mandal.nameMr : mandal.nameEn}
                  </h1>
                  <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 text-[10px] font-black">
                    {mandal.city}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                  {t.appTitle} • स्थापना {mandal.establishedYear} • {mandal.taglineMr ? mandal.taglineMr.slice(0, 32) + '...' : 'डिजिटल पावती व ईआरपी'}
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Mandal Switcher, Role Selector & Language Switcher */}
          <div className="flex items-center flex-wrap gap-2.5">
            
            {/* Multi-Mandal Switcher Button */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSwitchModalOpen(true)}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/80 dark:border-amber-600/60 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="मंडळ बदला किंवा दुसरे मंडळ निवडा"
              >
                <Layers size={13} className="text-amber-600 dark:text-amber-400" />
                <span className="max-w-[110px] sm:max-w-[160px] truncate">{mandal.nameMr || activeSession.mandalName}</span>
                <ChevronDown size={12} className="opacity-70" />
              </button>

              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="p-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-zinc-700 transition-all text-xs cursor-pointer"
                title="मंडळ लॉगिन / नवीन मंडळ नोंदणी (Register/Login Mandal)"
              >
                <Key size={14} className="text-primary" />
              </button>
            </div>

            {/* User Role Selector */}
            <div className="flex items-center bg-gray-100 dark:bg-zinc-800 p-1 rounded-2xl border border-gray-200 dark:border-zinc-700 text-xs font-bold">
              <button 
                onClick={() => setUserRole('admin')}
                className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1 ${
                  userRole === 'admin' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-main-text'
                }`}
              >
                <Crown size={12} />
                <span>{t.roles.admin}</span>
              </button>
              <button 
                onClick={() => setUserRole('karyakarta')}
                className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1 ${
                  userRole === 'karyakarta' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-main-text'
                }`}
              >
                <Users size={12} />
                <span>{t.roles.volunteer}</span>
              </button>
              <button 
                onClick={() => setUserRole('devotee')}
                className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1 ${
                  userRole === 'devotee' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-main-text'
                }`}
              >
                <Heart size={12} />
                <span>{t.roles.devotee}</span>
              </button>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-gray-100 dark:bg-zinc-800 p-1 rounded-2xl border border-gray-200 dark:border-zinc-700 text-xs font-bold">
              <button 
                onClick={() => setLang('mr')}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  lang === 'mr' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-500 hover:text-main-text'
                }`}
              >
                मराठी
              </button>
              <button 
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  lang === 'en' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-500 hover:text-main-text'
                }`}
              >
                EN
              </button>
              <button 
                onClick={() => setLang('hi')}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  lang === 'hi' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-500 hover:text-main-text'
                }`}
              >
                हिंदी
              </button>
            </div>

          </div>

        </div>

        {/* Feature Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-100 dark:border-zinc-800/80 overflow-x-auto scrollbar-none py-1">
          <nav className="flex space-x-1 sm:space-x-2 py-1 min-w-max">
            
            <button
              onClick={() => setActiveTab('pavati')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'pavati'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Receipt size={15} />
              {t.nav.pavatiBook}
            </button>

            <button
              onClick={() => setActiveTab('volunteers')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'volunteers'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Users size={15} />
              कार्यकर्ते व थेट संकलन ट्रॅकिंग
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'expenses'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <ReceiptText size={15} />
              {t.nav.expenses}
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Building2 size={15} />
              {t.nav.mandalProfile}
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'members'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <UserCheck size={15} />
              {t.nav.membership}
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'events'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Flame size={15} />
              {t.nav.events}
            </button>

            <button
              onClick={() => setActiveTab('devotee')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'devotee'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Heart size={15} />
              {t.nav.devoteeCorner}
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'inventory'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Package size={15} />
              {t.nav.inventory}
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'reports'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <BarChart3 size={15} />
              {t.nav.reports}
            </button>

            <button
              onClick={() => setActiveTab('pandal')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'pandal'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Map size={15} />
              {t.nav.pandalMap}
            </button>

          </nav>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* AUTOMATED FINANCIAL & EXECUTIVE BOARD SUMMARY BANNER */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-surface rounded-3xl p-5 md:p-6 border border-gray-200/80 dark:border-zinc-800 shadow-sm space-y-4">
          
          {/* Header row with Adhyaksh details & Auto calculated badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-2xl shadow-sm">
                <Crown size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-main-text flex items-center gap-2">
                  <span>मंडळ अध्यक्ष व मुख्य कार्यकारिणी: <strong className="text-primary">{mandal.presidentName}</strong></span>
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full text-[10px] font-bold">
                    {financialStats.executiveCount} पदाधिकारी
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500">
                  सचिव: {mandal.secretaryName} • खजिनदार: {mandal.treasurerName} • एकूण सभासद: {financialStats.totalMembersCount}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenDailySummary()}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-stone-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <Calendar size={14} />
                <span>दैनिक संकलन व रात्री पडताळणी (Daily Verification)</span>
              </button>
              <span className="hidden sm:inline-flex px-3 py-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-black items-center gap-1">
                <Scale size={12} /> रिअल-टाईम स्वयंचलित हिशोब
              </span>
            </div>
          </div>

          {/* 4 Core Financial Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* 1. Total Collections */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-300 dark:border-emerald-800/60">
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <ArrowUpRight size={15} /> एकूण जमा निधी (Income)
                </span>
                <span className="text-[10px] font-bold">{financialStats.totalPavatisCount} पावत्या</span>
              </div>
              <p className="text-2xl font-black text-main-text font-mono">
                ₹{financialStats.totalIncome.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-gray-500 block mt-1">पावती पुस्तक व देणग्या</span>
            </div>

            {/* 2. Total Expenses */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-300 dark:border-rose-800/60">
              <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 mb-1">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <ArrowDownRight size={15} /> एकूण झालेला खर्च (Expense)
                </span>
                <span className="text-[10px] font-bold">{financialStats.totalExpensesCount} खर्च नोंदी</span>
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                ₹{financialStats.totalExpense.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-gray-500 block mt-1">खर्च नोंदवही एकूण देयक</span>
            </div>

            {/* 3. Net Balance */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-transparent border-2 border-blue-400 dark:border-blue-700">
              <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 mb-1">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <Wallet size={15} /> शिल्लक निधी (Net Balance)
                </span>
                <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[9px] font-black">बॅलन्स</span>
              </div>
              <p className={`text-2xl font-black font-mono ${financialStats.netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'}`}>
                ₹{financialStats.netBalance.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-gray-500 block mt-1">एकूण जमा वजा एकूण खर्च</span>
            </div>

            {/* 4. Executive & Mandal Status */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-300 dark:border-amber-800/60">
              <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <Crown size={15} /> कार्यकारिणी व बँक
                </span>
                <span className="text-[10px] font-mono font-bold">वर्ष २०२६</span>
              </div>
              <p className="text-lg font-black text-main-text truncate">
                {mandal.presidentName}
              </p>
              <span className="text-[10px] text-gray-500 block truncate mt-1">
                UPI: <strong className="font-mono text-gray-700 dark:text-gray-300">{mandal.upiId}</strong>
              </span>
            </div>

          </div>

          {/* Payment Mode Balance Breakdown (भरणा पद्धतीनुसार शिल्लक) */}
          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <CreditCard size={14} className="text-primary" /> भरणा पद्धतीनुसार शिल्लक बॅलन्स (Mode-wise Net Balance)
              </span>
              <span className="text-[10px] text-gray-500 font-bold">
                (प्रत्येक पद्धतीतील जमा वजा खर्च)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              
              {/* Cash */}
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700">
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                  <span className="flex items-center gap-1 font-bold"><Banknote size={13} className="text-emerald-500" /> रोख शिल्लक (Cash)</span>
                </div>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-sm font-black text-main-text">₹{financialStats.balanceCash.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-gray-400">जमा ₹{financialStats.incomeCash.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* UPI */}
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700">
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                  <span className="flex items-center gap-1 font-bold"><Smartphone size={13} className="text-blue-500" /> UPI / QR शिल्लक</span>
                </div>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-sm font-black text-main-text">₹{financialStats.balanceUpi.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-gray-400">जमा ₹{financialStats.incomeUpi.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Bank Transfer */}
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700">
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                  <span className="flex items-center gap-1 font-bold"><Landmark size={13} className="text-purple-500" /> बँक ट्रान्सफर</span>
                </div>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-sm font-black text-main-text">₹{financialStats.balanceBank.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-gray-400">जमा ₹{financialStats.incomeBank.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Cheque */}
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700">
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                  <span className="flex items-center gap-1 font-bold"><CreditCard size={13} className="text-amber-500" /> धनादेश (Cheque)</span>
                </div>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-sm font-black text-main-text">₹{financialStats.balanceCheque.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-gray-400">जमा ₹{financialStats.incomeCheque.toLocaleString('en-IN')}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dedicated Role-Based Collector Workspace */}
        {userRole === 'karyakarta' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-600 text-white rounded-lg font-black">📱</span>
                <div>
                  <h3 className="font-black text-amber-950 dark:text-amber-200">कार्यकर्ता / व्हॉलंटियर संकलन मोड (Receipt Creation Mode)</h3>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">फक्त स्वतःचे पावती पुस्तक, जलद पावती जनरेटर आणि थेट WhatsApp शेअरिंग उपलब्ध आहे.</p>
                </div>
              </div>
              <button
                onClick={() => setUserRole('admin')}
                className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold rounded-xl hover:bg-amber-100"
              >
                👑 ॲडमिन मोडवर जा
              </button>
            </div>

            <VolunteerCollectorWorkspace
              currentVolunteer={currentVolunteer}
              volunteers={volunteers}
              onSelectVolunteer={(v) => setCurrentVolunteer(v)}
              pavatis={pavatis}
              mandal={mandal}
              lang={lang}
              onAddPavati={handleAddPavati}
              onViewReceipt={(p) => setViewingReceipt(p)}
            />
          </div>
        ) : (
          <>
            {/* Active Tab View for Admin & Devotee */}
            {activeTab === 'pavati' && (
              <PavatiBookSection 
                pavatis={pavatis}
                expenses={expenses}
                mandal={mandal}
                lang={lang}
                donors={donors}
                pendingVargani={pendingVargani}
                dayWiseCollections={dayWiseCollections}
                volunteers={volunteers}
                onAddPavati={handleAddPavati}
                onUpdatePavati={handleUpdatePavati}
                onDeletePavati={handleDeletePavati}
                onCancelPavati={handleCancelPavati}
                onRestorePavati={handleRestorePavati}
                onAddDonor={handleAddDonor}
                onAddPendingEntry={handleAddPendingEntry}
                onUpdatePendingStatus={handleUpdatePendingStatus}
                onViewReceipt={(p) => setViewingReceipt(p)}
                onOpenDailySummaryModal={handleOpenDailySummary}
                userRole={userRole}
              />
            )}

            {activeTab === 'volunteers' && (
              <VolunteerManagementSection
                volunteers={volunteers}
                handovers={handovers}
                pavatis={pavatis}
                mandal={mandal}
                lang={lang}
                onAddVolunteer={handleAddVolunteer}
                onUpdateVolunteer={handleUpdateVolunteer}
                onDeleteVolunteer={handleDeleteVolunteer}
                onRecordHandover={handleRecordHandover}
                userRole={userRole}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpenseLedgerSection 
                expenses={expenses}
                lang={lang}
                onAddExpense={handleAddExpense}
                onUpdateExpense={handleUpdateExpense}
                onDeleteExpense={handleDeleteExpense}
                userRole={userRole}
              />
            )}

            {activeTab === 'profile' && (
              <CoreMandalProfileSection 
                mandal={mandal}
                announcements={announcements}
                members={members}
                lang={lang}
                onAddAnnouncement={handleAddAnnouncement}
                onUpdateMandal={handleUpdateMandal}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                userRole={userRole}
              />
            )}

            {activeTab === 'members' && (
              <MembershipVolunteerSection 
                members={members}
                duties={duties}
                mandal={mandal}
                lang={lang}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
                onAddDuty={handleAddDuty}
                onUpdateMemberFee={handleUpdateMemberFee}
                onUpdateMandal={handleUpdateMandal}
                userRole={userRole}
              />
            )}

            {activeTab === 'events' && (
              <EventsAartiSection 
                aartis={aartis}
                events={events}
                mandal={mandal}
                lang={lang}
                userRole={userRole}
              />
            )}

            {activeTab === 'devotee' && (
              <DevoteeEngagementSection 
                mannats={mannats}
                gallery={gallery}
                mandal={mandal}
                lang={lang}
                onAddMannat={handleAddMannat}
                onTriggerDonation={() => setActiveTab('pavati')}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryStockSection 
                inventory={inventory}
                lang={lang}
                onAddInventory={handleAddInventory}
                onUpdateQuantity={handleUpdateInventoryQty}
                userRole={userRole}
              />
            )}

            {activeTab === 'reports' && (
              <ReportingAnalyticsSection 
                pavatis={pavatis}
                expenses={expenses}
                mandal={mandal}
                lang={lang}
                userRole={userRole}
                volunteers={volunteers}
                dayWiseCollections={dayWiseCollections}
                verifications={verifications}
                onSaveVerification={handleSaveVerification}
                onViewReceipt={(p) => setViewingReceipt(p)}
              />
            )}

            {activeTab === 'pandal' && (
              <PandalMapAndProSection 
                zones={zones}
                mandal={mandal}
                lang={lang}
                userRole={userRole}
              />
            )}
          </>
        )}

      </main>

      {/* Viewing Digital Pavati Modal */}
      <AnimatePresence>
        {viewingReceipt && (
          <DigitalReceiptModal 
            pavati={viewingReceipt}
            mandal={mandal}
            lang={lang}
            onClose={() => setViewingReceipt(null)}
          />
        )}
      </AnimatePresence>

      {/* Daily Summary & Nightly Verification Modal */}
      <AnimatePresence>
        {isDailySummaryModalOpen && (
          <DailySummaryVerificationModal
            initialDate={dailySummarySelectedDate}
            pavatis={pavatis}
            expenses={expenses}
            volunteers={volunteers}
            dayWiseCollections={dayWiseCollections}
            verifications={verifications}
            mandal={mandal}
            lang={lang}
            userRole={userRole}
            onSaveVerification={handleSaveVerification}
            onClose={() => setIsDailySummaryModalOpen(false)}
            onViewReceipt={(p) => setViewingReceipt(p)}
          />
        )}
      </AnimatePresence>

      {/* Multi-Mandal Authentication & Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <MultiMandalLoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            onLoginSuccess={(session) => {
              handleSessionChange(session);
              setIsLoginModalOpen(false);
            }}
            currentMandalId={activeSession.mandalId}
          />
        )}
      </AnimatePresence>

      {/* Quick Mandal Switch Modal */}
      <AnimatePresence>
        {isSwitchModalOpen && (
          <MandalSwitchModal
            isOpen={isSwitchModalOpen}
            onClose={() => setIsSwitchModalOpen(false)}
            currentMandalId={activeSession.mandalId}
            onSwitchMandal={(session) => {
              handleSessionChange(session);
              setIsSwitchModalOpen(false);
            }}
            onOpenNewRegistration={() => {
              setIsSwitchModalOpen(false);
              setIsLoginModalOpen(true);
            }}
            onLogout={() => {
              clearActiveSession();
              const defaultSession = getActiveSession();
              handleSessionChange(defaultSession);
            }}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-100 dark:border-zinc-800 text-center text-xs text-gray-500 bg-surface">
        <p className="font-serif">
          ॥ श्री गणेशाय नमः • {mandal.nameMr} (स्थापना {mandal.establishedYear}) ॥
        </p>
        <p className="text-[11px] text-gray-400 mt-1">
          Digital Pavati & Mandal Management ERP System • {mandal.taglineMr || '॥ सामाजिक प्रबोधन, सांस्कृतिक वारसा व लोकमान्य परंपरा ॥'}
        </p>
      </footer>

    </div>
  );
};

