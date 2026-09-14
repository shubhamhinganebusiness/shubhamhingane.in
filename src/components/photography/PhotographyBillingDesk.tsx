import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Receipt, 
  FileText, 
  PlusCircle, 
  Search, 
  Printer, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowLeft,
  X,
  Layers,
  Camera,
  Filter,
  RefreshCw,
  Plus,
  ShieldCheck,
  ChevronRight,
  Bell,
  Send,
  Smartphone,
  MessageSquare,
  Globe,
  Percent,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { 
  PhotographyBill, 
  PhotographyBillItem, 
  PaymentStatus, 
  PaymentMethod,
  PaymentMilestone,
  PricingModel,
  LateFeeConfig,
  ReminderLog,
  OnlinePaymentTransaction,
  STUDIO_PROFILE, 
  STUDIO_CATALOG_PACKAGES, 
  STANDARD_TERMS,
  getStoredPhotographyBills, 
  saveStoredPhotographyBills, 
  generateNextBillNumber, 
  calculateBillFinancials,
  calculateLateFeeDetails,
  createMilestonePreset
} from './photographyBillTypes';
import { PhotographyBillPrintModal } from './PhotographyBillPrintModal';
import { OnlinePaymentGatewayModal } from './OnlinePaymentGatewayModal';
import { AutoReminderModal } from './AutoReminderModal';
import { MilestoneRetainerManager } from './MilestoneRetainerManager';

interface PhotographyBillingDeskProps {
  onDraftFromInquiry?: (inquiry: { name: string; email: string; service: string; message: string }) => void;
  className?: string;
}

export const PhotographyBillingDesk: React.FC<PhotographyBillingDeskProps> = ({
  className = ''
}) => {
  // All bills stored in client storage
  const [bills, setBills] = useState<PhotographyBill[]>(() => getStoredPhotographyBills());
  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active bill being printed
  const [printingBill, setPrintingBill] = useState<PhotographyBill | null>(null);

  // Active bill for Online Payment Gateway modal
  const [payingBill, setPayingBill] = useState<PhotographyBill | null>(null);

  // Active bill for Auto Reminders modal
  const [reminderBill, setReminderBill] = useState<PhotographyBill | null>(null);

  // Bill Editor Form State
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('Destination Wedding');
  const [eventDates, setEventDates] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  
  const [items, setItems] = useState<PhotographyBillItem[]>([]);
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(18);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer (NEFT/IMPS)');
  const [upiId, setUpiId] = useState(STUDIO_PROFILE.upiId);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState<string[]>(STANDARD_TERMS);

  // Milestones & Retainer State
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([]);

  // Automated Late Fee Policy State
  const [lateFeeConfig, setLateFeeConfig] = useState<LateFeeConfig>({
    enabled: true,
    feeType: 'percent',
    value: 2.5,
    gracePeriodDays: 5
  });
  const [lateFeeApplied, setLateFeeApplied] = useState<boolean>(false);
  const [lateFeeAmount, setLateFeeAmount] = useState<number>(0);

  // Toast / notification feedback
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Sync back state changes to localStorage
  const updateAndPersistBills = (updated: PhotographyBill[]) => {
    setBills(updated);
    saveStoredPhotographyBills(updated);
  };

  // Financial Stats summary computation
  const stats = useMemo(() => {
    const totalInvoiced = bills.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    const totalCollected = bills.reduce((sum, b) => sum + (Number(b.advancePaid) || 0), 0);
    const totalDues = bills.reduce((sum, b) => sum + (Number(b.balanceDue) || 0), 0);
    const countPaid = bills.filter(b => b.paymentStatus === 'PAID').length;
    const countPartial = bills.filter(b => b.paymentStatus === 'PARTIAL').length;
    const countPending = bills.filter(b => b.paymentStatus === 'PENDING').length;

    return {
      totalInvoiced,
      totalCollected,
      totalDues,
      countTotal: bills.length,
      countPaid,
      countPartial,
      countPending
    };
  }, [bills]);

  // Filtered bills for list view
  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      const matchesFilter = statusFilter === 'ALL' || bill.paymentStatus === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !q ||
        bill.billNumber.toLowerCase().includes(q) ||
        bill.clientName.toLowerCase().includes(q) ||
        bill.eventTitle.toLowerCase().includes(q) ||
        bill.eventVenue.toLowerCase().includes(q) ||
        bill.eventType.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [bills, statusFilter, searchQuery]);

  // Real-time Editor Financial Calculations
  const calculatedFinancials = useMemo(() => {
    return calculateBillFinancials(
      items,
      discountType,
      discountValue,
      taxRate,
      advancePaid
    );
  }, [items, discountType, discountValue, taxRate, advancePaid]);

  // Open Editor for brand-new bill
  const handleOpenNewBill = () => {
    const nextBillNum = generateNextBillNumber(bills);
    setEditingBillId(null);
    setBillNumber(nextBillNum);
    setBillDate(new Date().toISOString().split('T')[0]);
    
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().split('T')[0]);

    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setClientAddress('');

    setEventTitle('');
    setEventType('Destination Wedding');
    setEventDates('');
    setEventVenue('');

    // Default with 1 standard wedding package or empty
    const defaultPkg = STUDIO_CATALOG_PACKAGES[0];
    setItems([
      {
        id: `item-${Date.now()}-1`,
        serviceCategory: defaultPkg.category,
        description: defaultPkg.title,
        deliverables: defaultPkg.deliverables,
        quantity: 1,
        rate: defaultPkg.defaultRate,
        amount: defaultPkg.defaultRate
      }
    ]);

    setDiscountType('flat');
    setDiscountValue(0);
    setTaxRate(18);
    setAdvancePaid(0);
    setPaymentMethod('Bank Transfer (NEFT/IMPS)');
    setUpiId(STUDIO_PROFILE.upiId);
    setNotes('Standard raw footage archive & cloud draft delivery included.');
    setTerms(STANDARD_TERMS);

    // Default 50/50 milestones preset for new invoice
    setMilestones(createMilestonePreset('50_50', defaultPkg.defaultRate, new Date().toISOString().split('T')[0]));
    setLateFeeConfig({
      enabled: true,
      feeType: 'percent',
      value: 2.5,
      gracePeriodDays: 5
    });
    setLateFeeApplied(false);
    setLateFeeAmount(0);

    setActiveTab('editor');
  };

  // Open Editor for existing bill
  const handleEditBill = (bill: PhotographyBill) => {
    setEditingBillId(bill.id);
    setBillNumber(bill.billNumber);
    setBillDate(bill.billDate);
    setDueDate(bill.dueDate);

    setClientName(bill.clientName);
    setClientPhone(bill.clientPhone);
    setClientEmail(bill.clientEmail);
    setClientAddress(bill.clientAddress || '');

    setEventTitle(bill.eventTitle);
    setEventType(bill.eventType);
    setEventDates(bill.eventDates);
    setEventVenue(bill.eventVenue);

    setItems([...bill.items]);
    setDiscountType(bill.discountType);
    setDiscountValue(bill.discountValue);
    setTaxRate(bill.taxRate);
    setAdvancePaid(bill.advancePaid);
    setPaymentMethod(bill.paymentMethod);
    setUpiId(bill.upiId || STUDIO_PROFILE.upiId);
    setNotes(bill.notes || '');
    setTerms(bill.terms || STANDARD_TERMS);

    setMilestones(bill.milestones || []);
    setLateFeeConfig(bill.lateFeeConfig || {
      enabled: true,
      feeType: 'percent',
      value: 2.5,
      gracePeriodDays: 5
    });
    setLateFeeApplied(!!bill.lateFeeApplied);
    setLateFeeAmount(bill.lateFeeAmount || 0);

    setActiveTab('editor');
  };

  // Online Payment Verification Callback
  const handleOnlinePaymentSuccess = (transaction: OnlinePaymentTransaction) => {
    if (!payingBill) return;
    const nextBills = bills.map(b => {
      if (b.id === payingBill.id) {
        const newAdvance = Math.min(b.totalAmount, b.advancePaid + transaction.amount);
        const newBalance = Math.max(0, b.totalAmount - newAdvance);
        const newStatus: PaymentStatus = newBalance === 0 ? 'PAID' : 'PARTIAL';

        let updatedMilestones = b.milestones ? [...b.milestones] : [];
        if (transaction.milestoneId && updatedMilestones.length > 0) {
          updatedMilestones = updatedMilestones.map(m =>
            m.id === transaction.milestoneId
              ? { ...m, isPaid: true, paidDate: new Date().toISOString().split('T')[0], transactionId: transaction.id }
              : m
          );
        }

        return {
          ...b,
          advancePaid: newAdvance,
          balanceDue: newBalance,
          paymentStatus: newStatus,
          paymentMethod: `Credit / Debit Card` as PaymentMethod,
          milestones: updatedMilestones,
          transactions: [...(b.transactions || []), transaction],
          updatedAt: new Date().toISOString()
        };
      }
      return b;
    });

    updateAndPersistBills(nextBills);
    showNotification(`Payment of ₹${transaction.amount.toLocaleString('en-IN')} via ${transaction.gateway.toUpperCase()} verified!`, 'success');
    setPayingBill(null);
  };

  // Reminder Sent Callback
  const handleSendReminder = (log: ReminderLog) => {
    if (!reminderBill) return;
    const nextBills = bills.map(b => {
      if (b.id === reminderBill.id) {
        return {
          ...b,
          reminderLogs: [...(b.reminderLogs || []), log],
          updatedAt: new Date().toISOString()
        };
      }
      return b;
    });
    updateAndPersistBills(nextBills);
    showNotification(`Reminder alert dispatched for Invoice ${reminderBill.billNumber}`, 'success');
  };

  // Toggle Late Fee on Overdue Invoice
  const handleToggleLateFee = (bill: PhotographyBill) => {
    const lateFee = calculateLateFeeDetails(bill.dueDate, bill.balanceDue, bill.lateFeeConfig);
    const nextApplied = !bill.lateFeeApplied;
    const nextBills = bills.map(b => {
      if (b.id === bill.id) {
        return {
          ...b,
          lateFeeApplied: nextApplied,
          lateFeeAmount: nextApplied ? lateFee.amount : 0,
          updatedAt: new Date().toISOString()
        };
      }
      return b;
    });
    updateAndPersistBills(nextBills);
    showNotification(
      nextApplied 
        ? `Late surcharge of ₹${lateFee.amount.toLocaleString('en-IN')} added to invoice.` 
        : `Late surcharge waived for Invoice ${bill.billNumber}.`,
      'info'
    );
  };

  // Duplicate a bill to easily re-use client / package parameters
  const handleDuplicateBill = (bill: PhotographyBill) => {
    const nextBillNum = generateNextBillNumber(bills);
    const newBill: PhotographyBill = {
      ...bill,
      id: `bill-${Date.now()}`,
      billNumber: nextBillNum,
      billDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      advancePaid: 0,
      balanceDue: bill.totalAmount,
      paymentStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    updateAndPersistBills([newBill, ...bills]);
    showNotification(`Duplicated as new invoice ${nextBillNum}`, 'success');
  };

  // One-click mark as paid in full
  const handleMarkAsPaid = (bill: PhotographyBill) => {
    const updated = bills.map(b => {
      if (b.id === bill.id) {
        return {
          ...b,
          advancePaid: b.totalAmount,
          balanceDue: 0,
          paymentStatus: 'PAID' as PaymentStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return b;
    });
    updateAndPersistBills(updated);
    showNotification(`Invoice ${bill.billNumber} marked as Paid in full!`, 'success');
  };

  // Delete invoice with confirmation
  const handleDeleteBill = (id: string, billNum: string) => {
    if (window.confirm(`Are you sure you want to delete Invoice ${billNum}? This action cannot be undone.`)) {
      const updated = bills.filter(b => b.id !== id);
      updateAndPersistBills(updated);
      showNotification(`Invoice ${billNum} deleted`, 'info');
    }
  };

  // Append a package from catalog to current items
  const handleAddCatalogPackage = (pkg: typeof STUDIO_CATALOG_PACKAGES[0]) => {
    const newItem: PhotographyBillItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      serviceCategory: pkg.category,
      description: pkg.title,
      deliverables: pkg.deliverables,
      quantity: 1,
      rate: pkg.defaultRate,
      amount: pkg.defaultRate
    };
    setItems(prev => [...prev, newItem]);
    showNotification(`Added "${pkg.title}" to bill`, 'success');
  };

  // Add custom blank line item
  const handleAddCustomItem = () => {
    const newItem: PhotographyBillItem = {
      id: `item-${Date.now()}`,
      serviceCategory: 'custom',
      description: 'Custom Photographic Production Deliverable',
      deliverables: 'Deliverable details specified by director',
      quantity: 1,
      rate: 15000,
      amount: 15000
    };
    setItems(prev => [...prev, newItem]);
  };

  // Update item field
  const handleItemChange = (index: number, field: keyof PhotographyBillItem, val: any) => {
    setItems(prev => {
      const next = [...prev];
      const target = { ...next[index], [field]: val };
      if (field === 'quantity' || field === 'rate') {
        const qty = Number(field === 'quantity' ? val : target.quantity) || 0;
        const rate = Number(field === 'rate' ? val : target.rate) || 0;
        target.amount = Math.round(qty * rate);
      }
      next[index] = target;
      return next;
    });
  };

  // Remove line item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      showNotification('Invoice must have at least one line item.', 'error');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Save current bill from editor
  const handleSaveBill = (openPrintPreviewAfterSave: boolean = false) => {
    if (!clientName.trim()) {
      showNotification('Please provide the Client Name.', 'error');
      return;
    }
    if (!eventTitle.trim()) {
      showNotification('Please provide the Event Title (e.g. Royal Wedding).', 'error');
      return;
    }
    if (items.length === 0) {
      showNotification('Please add at least one line item to this invoice.', 'error');
      return;
    }

    const {
      subtotal,
      discountAmount,
      taxAmount,
      cgst,
      sgst,
      totalAmount,
      balanceDue,
      paymentStatus
    } = calculatedFinancials;

    const newOrUpdatedBill: PhotographyBill = {
      id: editingBillId || `bill-${Date.now()}`,
      billNumber: billNumber || generateNextBillNumber(bills),
      billDate,
      dueDate,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || '+91 98000 00000',
      clientEmail: clientEmail.trim() || 'client@lensandlightstudios.in',
      clientAddress: clientAddress.trim(),
      eventTitle: eventTitle.trim(),
      eventType,
      eventDates: eventDates.trim() || 'Dates Scheduled on Call',
      eventVenue: eventVenue.trim() || 'Pune / Destination Location',
      items,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      taxType: taxRate === 18 ? 'gst18' : taxRate === 12 ? 'gst12' : taxRate === 5 ? 'gst5' : 'none',
      taxRate,
      taxAmount,
      cgst,
      sgst,
      totalAmount,
      advancePaid: Math.min(Number(advancePaid) || 0, totalAmount),
      balanceDue,
      paymentStatus,
      paymentMethod,
      upiId: upiId || STUDIO_PROFILE.upiId,
      notes,
      terms,
      milestones,
      lateFeeConfig,
      lateFeeApplied,
      lateFeeAmount,
      transactions: editingBillId ? (bills.find(b => b.id === editingBillId)?.transactions || []) : [],
      reminderLogs: editingBillId ? (bills.find(b => b.id === editingBillId)?.reminderLogs || []) : [],
      createdAt: editingBillId ? (bills.find(b => b.id === editingBillId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let nextBills: PhotographyBill[];
    if (editingBillId) {
      nextBills = bills.map(b => b.id === editingBillId ? newOrUpdatedBill : b);
      showNotification(`Invoice ${newOrUpdatedBill.billNumber} successfully updated!`, 'success');
    } else {
      nextBills = [newOrUpdatedBill, ...bills];
      showNotification(`Invoice ${newOrUpdatedBill.billNumber} successfully created & saved!`, 'success');
    }

    updateAndPersistBills(nextBills);

    if (openPrintPreviewAfterSave) {
      setPrintingBill(newOrUpdatedBill);
    } else {
      setActiveTab('list');
    }
  };

  return (
    <div id="billing-desk-container" className={`bg-[#0A0A0A] text-gray-200 rounded-3xl border border-gray-900 p-6 md:p-10 shadow-2xl relative overflow-hidden ${className}`}>
      
      {/* Background Accent Gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border backdrop-blur-md ${
              notification.type === 'error'
                ? 'bg-red-950/90 text-red-200 border-red-800'
                : notification.type === 'info'
                ? 'bg-blue-950/90 text-blue-200 border-blue-800'
                : 'bg-neutral-900/90 text-[#D4AF37] border-[#D4AF37]/40 shadow-[#D4AF37]/10'
            }`}
          >
            {notification.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} className="text-[#D4AF37]" />}
            <span>{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP DESK HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-900">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[9.5px] font-black uppercase tracking-[0.3em] rounded-full">
              STUDIO DESK SYSTEM
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              TAX INVOICES & RECONCILIATION
            </span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-black text-white tracking-tight">
            Client Billing & Print Station
          </h2>
          <p className="text-gray-400 text-xs mt-1.5 font-light">
            Generate itemized A4 luxury invoices, calculate GST & advances, and print clean physical bills or export PDFs for your high-profile photography clients.
          </p>
        </div>

        {/* Action Button: Create New Invoice */}
        <div className="flex items-center gap-3">
          {activeTab === 'editor' ? (
            <button
              onClick={() => setActiveTab('list')}
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-gray-800"
            >
              <ArrowLeft size={14} />
              <span>Back to Invoices</span>
            </button>
          ) : (
            <button
              onClick={handleOpenNewBill}
              className="px-6 py-3 bg-[#D4AF37] hover:bg-white text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <PlusCircle size={16} />
              <span>Create New Bill</span>
            </button>
          )}
        </div>
      </div>

      {/* FINANCIAL STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-8 border-b border-gray-900">
        <div className="p-5 bg-black/50 border border-gray-900 rounded-2xl">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">
            TOTAL INVOICED
          </span>
          <div className="font-serif text-2xl font-black text-white">
            ₹{stats.totalInvoiced.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-gray-500 mt-1 block">
            Across {stats.countTotal} generated invoices
          </span>
        </div>

        <div className="p-5 bg-black/50 border border-gray-900 rounded-2xl">
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-1">
            ADVANCES COLLECTED
          </span>
          <div className="font-serif text-2xl font-black text-emerald-400">
            ₹{stats.totalCollected.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-gray-500 mt-1 block">
            Deposits secured on calendar
          </span>
        </div>

        <div className="p-5 bg-black/50 border border-gray-900 rounded-2xl">
          <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block mb-1">
            OUTSTANDING DUES
          </span>
          <div className="font-serif text-2xl font-black text-amber-400">
            ₹{stats.totalDues.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-gray-500 mt-1 block">
            Pending post-production settlement
          </span>
        </div>

        <div className="p-5 bg-black/50 border border-gray-900 rounded-2xl">
          <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest block mb-1">
            PAYMENT STATUS RATIO
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 text-[10px] font-bold rounded">
              {stats.countPaid} Paid
            </span>
            <span className="px-2 py-0.5 bg-amber-950 text-amber-300 text-[10px] font-bold rounded">
              {stats.countPartial} Partial
            </span>
            <span className="px-2 py-0.5 bg-rose-950 text-rose-300 text-[10px] font-bold rounded">
              {stats.countPending} Due
            </span>
          </div>
          <span className="text-[10px] text-gray-500 mt-2 block">
            Active production schedule
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW A: BILLS LIST / INVOICE REPOSITORY */}
      {/* ========================================================================= */}
      {activeTab === 'list' && (
        <div className="pt-8 space-y-6">
          
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Search input */}
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by client, bill #, venue..."
                className="w-full bg-black/60 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {(['ALL', 'PAID', 'PARTIAL', 'PENDING'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === filter
                      ? 'bg-[#D4AF37] text-black font-black'
                      : 'bg-black/50 text-gray-400 border border-gray-800 hover:border-gray-700 hover:text-white'
                  }`}
                >
                  {filter === 'ALL' ? 'All Invoices' : filter}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices List Display */}
          {filteredBills.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-gray-800 rounded-2xl bg-black/30 space-y-3">
              <FileText size={36} className="text-gray-600 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-white">No Invoices Found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {searchQuery ? `No invoices matched query "${searchQuery}".` : 'No bills in this category yet. Click "Create New Bill" to generate one!'}
              </p>
              <button
                onClick={handleOpenNewBill}
                className="px-5 py-2.5 bg-[#D4AF37] text-black text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer hover:bg-white transition-all"
              >
                Create Bill Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBills.map(bill => (
                <motion.div
                  layout
                  key={bill.id}
                  className="bg-[#111111] border border-gray-900 hover:border-gray-800 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-xl relative group overflow-hidden"
                >
                  <div className="space-y-4">
                    {/* Header: Bill number & status */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-black text-[#D4AF37] font-mono tracking-wider block">
                          {bill.billNumber}
                        </span>
                        <h4 className="font-serif text-base font-bold text-white mt-0.5 group-hover:text-[#D4AF37] transition-colors">
                          {bill.clientName}
                        </h4>
                      </div>

                      <div>
                        {bill.paymentStatus === 'PAID' && (
                          <span className="px-2.5 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 size={10} /> Paid
                          </span>
                        )}
                        {bill.paymentStatus === 'PARTIAL' && (
                          <span className="px-2.5 py-1 bg-amber-950/80 text-amber-400 border border-amber-800/60 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Clock size={10} /> Advance
                          </span>
                        )}
                        {bill.paymentStatus === 'PENDING' && (
                          <span className="px-2.5 py-1 bg-rose-950/80 text-rose-400 border border-rose-800/60 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                            <AlertCircle size={10} /> Due
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Event & Logistics Preview */}
                    <div className="p-3 bg-black/40 border border-gray-900 rounded-xl space-y-1.5 text-[11px] text-gray-400">
                      <p className="font-bold text-gray-200 truncate">
                        {bill.eventTitle}
                      </p>
                      <p className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <Calendar size={11} className="shrink-0 text-gray-400" />
                        <span className="truncate">{bill.eventDates}</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <MapPin size={11} className="shrink-0 text-gray-400" />
                        <span className="truncate">{bill.eventVenue}</span>
                      </p>
                    </div>

                    {/* Deliverables summary */}
                    <div className="text-[10px] text-gray-400">
                      <span className="font-bold text-gray-500 uppercase tracking-widest text-[8px] block mb-1">
                        INCLUDED DELIVERABLES ({bill.items.length})
                      </span>
                      <ul className="space-y-0.5 list-disc pl-3 text-gray-300 font-light truncate">
                        {bill.items.slice(0, 2).map((it, idx) => (
                          <li key={idx} className="truncate">{it.description}</li>
                        ))}
                        {bill.items.length > 2 && (
                          <li className="text-[#D4AF37] list-none pt-0.5">+{bill.items.length - 2} more services</li>
                        )}
                      </ul>
                    </div>

                    {/* Milestones & Retainer Status preview if present */}
                    {bill.milestones && bill.milestones.length > 0 && (
                      <div className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                          <span className="flex items-center gap-1 text-[#D4AF37]">
                            <Layers size={10} /> Retainer Schedule
                          </span>
                          <span>
                            {bill.milestones.filter(m => m.isPaid).length}/{bill.milestones.length} Cleared
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden flex">
                          {bill.milestones.map((m, idx) => (
                            <div
                              key={m.id || idx}
                              style={{ width: `${m.percentage}%` }}
                              className={`h-full ${m.isPaid ? 'bg-emerald-500' : 'bg-zinc-700'} border-r border-black/40`}
                              title={`${m.title}: ₹${m.amount} (${m.isPaid ? 'Paid' : 'Pending'})`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Automated Late Fee Warning if Overdue */}
                    {(() => {
                      const lateFee = calculateLateFeeDetails(bill.dueDate, bill.balanceDue, bill.lateFeeConfig);
                      if (lateFee.isOverdue) {
                        return (
                          <div className={`p-2.5 rounded-xl border text-[10px] space-y-1 ${
                            bill.lateFeeApplied
                              ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                              : 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                          }`}>
                            <div className="flex items-center justify-between font-bold">
                              <span className="flex items-center gap-1">
                                <AlertTriangle size={12} className={bill.lateFeeApplied ? 'text-rose-400' : 'text-amber-400'} />
                                Overdue by {lateFee.overdueDays} Days
                              </span>
                              <span className="font-mono">
                                {bill.lateFeeApplied ? `+₹${bill.lateFeeAmount || lateFee.amount} Surcharge` : `Eligible: +₹${lateFee.amount}`}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-0.5">
                              <span className="text-[9px] opacity-80">
                                {lateFee.daysPastGrace} days past grace period ({bill.lateFeeConfig?.gracePeriodDays || 5}d)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleLateFee(bill)}
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                                  bill.lateFeeApplied
                                    ? 'bg-rose-900/60 hover:bg-rose-800 text-white'
                                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300'
                                }`}
                              >
                                {bill.lateFeeApplied ? 'Waive Late Fee' : 'Apply Late Fee'}
                              </button>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Financial Figures */}
                    <div className="pt-3 border-t border-gray-900 flex justify-between items-end">
                      <div>
                        <span className="text-[8px] text-gray-500 uppercase tracking-widest block font-bold">Total Bill</span>
                        <span className="font-serif text-lg font-black text-white">
                          ₹{bill.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[8px] text-gray-500 uppercase tracking-widest block font-bold">
                          {bill.lateFeeApplied && (bill.lateFeeAmount || 0) > 0 ? 'Balance (w/ Late Fee)' : 'Balance Due'}
                        </span>
                        <span className={`font-mono text-sm font-black ${bill.balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {bill.balanceDue > 0 ? `₹${(bill.balanceDue + (bill.lateFeeApplied ? (bill.lateFeeAmount || 0) : 0)).toLocaleString('en-IN')}` : 'Settled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 mt-3 border-t border-gray-900 space-y-2">
                    {/* Primary Online Payment and Reminder Quick Triggers */}
                    {bill.balanceDue > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPayingBill(bill)}
                          className="py-1.5 px-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-950"
                          title="Pay via Stripe, Square, PayPal or UPI"
                        >
                          <CreditCard size={12} />
                          <span>Pay Online</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setReminderBill(bill)}
                          className="py-1.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-700 relative"
                          title="Send multi-channel reminders"
                        >
                          <Bell size={12} className="text-[#D4AF37]" />
                          <span>Remind</span>
                          {bill.reminderLogs && bill.reminderLogs.length > 0 && (
                            <span className="ml-0.5 px-1.5 py-0.2 bg-[#D4AF37] text-black text-[8px] font-black rounded-full">
                              {bill.reminderLogs.length}
                            </span>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => setPrintingBill(bill)}
                        className="flex-1 py-2 bg-[#D4AF37] hover:bg-white text-black text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-[#D4AF37]/10"
                      >
                        <Printer size={12} />
                        <span>Print Bill</span>
                      </button>

                      <button
                        onClick={() => handleEditBill(bill)}
                        className="p-2 bg-black/60 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl border border-gray-800 transition-all cursor-pointer"
                        title="Edit this invoice"
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        onClick={() => handleDuplicateBill(bill)}
                        className="p-2 bg-black/60 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl border border-gray-800 transition-all cursor-pointer"
                        title="Duplicate invoice"
                      >
                        <Copy size={13} />
                      </button>

                      {bill.paymentStatus !== 'PAID' && (
                        <button
                          onClick={() => handleMarkAsPaid(bill)}
                          className="p-2 bg-emerald-950/50 hover:bg-emerald-800 text-emerald-400 hover:text-white rounded-xl border border-emerald-800/40 transition-all cursor-pointer"
                          title="Mark as Paid in full"
                        >
                          <Check size={13} />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteBill(bill.id, bill.billNumber)}
                        className="p-2 bg-black/60 hover:bg-red-950 hover:text-red-400 text-gray-500 rounded-xl border border-gray-800 transition-all cursor-pointer"
                        title="Delete invoice"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: INTERACTIVE BILL MAKER & CUSTOMIZER FORM */}
      {/* ========================================================================= */}
      {activeTab === 'editor' && (
        <div className="pt-8 space-y-8">
          
          {/* Header Bar of Editor */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#111111] border border-gray-800 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <Receipt size={20} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white">
                  {editingBillId ? `Editing Invoice: ${billNumber}` : 'Draft New Client Invoice'}
                </h3>
                <p className="text-xs text-gray-400">
                  Fill client requirements, choose catalog packages, and review live A4 financials.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveBill(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Save Invoice
              </button>
              <button
                onClick={() => handleSaveBill(true)}
                className="px-5 py-2 bg-[#D4AF37] hover:bg-white text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#D4AF37]/20 active:scale-95"
              >
                <Printer size={13} />
                <span>Save & Print A4</span>
              </button>
            </div>
          </div>

          {/* Quick-Add Offering Chips from Studio Catalog */}
          <div className="p-5 bg-[#111111] rounded-2xl border border-gray-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Quick-Add from Studio Offerings Catalog (1-Click Package Insertion)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {STUDIO_CATALOG_PACKAGES.map(pkg => (
                <button
                  key={pkg.id}
                  onClick={() => handleAddCatalogPackage(pkg)}
                  className="px-3 py-2 bg-black/60 hover:bg-[#D4AF37]/20 border border-gray-800 hover:border-[#D4AF37] rounded-xl text-xs text-gray-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer group"
                >
                  <Plus size={12} className="text-[#D4AF37] group-hover:scale-125 transition-transform" />
                  <span className="font-semibold">{pkg.title}</span>
                  <span className="font-mono text-[#D4AF37] text-[11px]">₹{pkg.defaultRate.toLocaleString('en-IN')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* TWO COLUMN FORM: Client/Event Information & Invoice Metadata */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left 7/12: Client Information & Event Logistics */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Client Details Box */}
              <div className="p-6 bg-[#111111] rounded-2xl border border-gray-800 space-y-4">
                <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest block border-b border-gray-800 pb-2">
                  1. CLIENT DETAILS (BILLED TO)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Client Full Name *
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Amit & Priyanka Sharma"
                      className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Contact Phone Number
                    </label>
                    <input
                      type="text"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@gmail.com"
                      className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Billing Address / City
                    </label>
                    <input
                      type="text"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="Koregaon Park, Pune, Maharashtra"
                      className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>

              {/* Event Logistics Box */}
              <div className="p-6 bg-[#111111] rounded-2xl border border-gray-800 space-y-4">
                <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest block border-b border-gray-800 pb-2">
                  2. EVENT & PRODUCTION SCOPE
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="e.g. Royal Heritage Wedding & Reception"
                      className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Service Type
                    </label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="Destination Wedding">Destination Wedding</option>
                      <option value="Pre-Wedding Shoot">Pre-Wedding Shoot</option>
                      <option value="Commercial & Editorial">Commercial & Editorial</option>
                      <option value="Fashion Portraits">Fashion Portraits</option>
                      <option value="Cinematic Film Grading">Cinematic Film Grading</option>
                      <option value="Viral Reels Production">Viral Reels Production</option>
                      <option value="Corporate / Brand Shoot">Corporate / Brand Shoot</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Event Shoot Dates
                    </label>
                    <input
                      type="text"
                      value={eventDates}
                      onChange={(e) => setEventDates(e.target.value)}
                      placeholder="e.g. 14th - 16th November 2026"
                      className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Physical Shoot Venue & Location
                    </label>
                    <input
                      type="text"
                      value={eventVenue}
                      onChange={(e) => setEventVenue(e.target.value)}
                      placeholder="e.g. The Oberoi Udaivilas, Udaipur, Rajasthan"
                      className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right 5/12: Invoice Parameters & Payment Setup */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 bg-[#111111] rounded-2xl border border-gray-800 space-y-4">
                <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest block border-b border-gray-800 pb-2">
                  3. INVOICE PARAMETERS & DATES
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={billNumber}
                      onChange={(e) => setBillNumber(e.target.value)}
                      placeholder="LLS-2026-084"
                      className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-[#D4AF37] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Tax / GST Setting
                    </label>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value={18}>18% GST (Standard)</option>
                      <option value={12}>12% GST</option>
                      <option value={5}>5% GST</option>
                      <option value={0}>0% Tax Exempted</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Bill Issue Date
                    </label>
                    <input
                      type="date"
                      value={billDate}
                      onChange={(e) => setBillDate(e.target.value)}
                      className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Settlement Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Preferred Payment Mode
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="UPI / QR">UPI / QR Code</option>
                      <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT/IMPS)</option>
                      <option value="Credit / Debit Card">Credit / Debit Card</option>
                      <option value="Cash">Cash Handover</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Studio UPI ID
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="lensandlight@hdfcbank"
                      className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                    Production Notes & Client Directives
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Specific color grading requests, gear requirements, shoot timings..."
                    className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ITEMIZATION SECTION: Line Items Table & Custom Additions */}
          <div className="p-6 bg-[#111111] rounded-2xl border border-gray-800 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">
                4. PHOTOGRAPHIC DELIVERABLES & CHARGES ({items.length} ITEMS)
              </span>
              <button
                onClick={handleAddCustomItem}
                className="px-3 py-1.5 bg-black hover:bg-gray-800 border border-gray-700 text-gray-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Custom Line Item</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-[9px] font-black text-gray-500 uppercase tracking-wider">
                    <th className="py-2 px-2 w-8 text-center">#</th>
                    <th className="py-2 px-3 min-w-[200px]">Service Title</th>
                    <th className="py-2 px-3 min-w-[180px]">Deliverables Scope</th>
                    <th className="py-2 px-2 w-28">Pricing Model</th>
                    <th className="py-2 px-2 w-28">Category</th>
                    <th className="py-2 px-2 w-20 text-center">Qty / Units</th>
                    <th className="py-2 px-3 w-28 text-right">Unit Rate (₹)</th>
                    <th className="py-2 px-3 w-28 text-right">Total (₹)</th>
                    <th className="py-2 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-black/30 transition-colors">
                      <td className="py-3 px-2 text-center text-gray-500 font-mono text-[10px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          placeholder="Service name..."
                          className="w-full bg-black/60 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={item.deliverables}
                          onChange={(e) => handleItemChange(idx, 'deliverables', e.target.value)}
                          placeholder="Details..."
                          className="w-full bg-black/60 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-[#D4AF37]"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <select
                          value={item.pricingModel || 'flat'}
                          onChange={(e) => {
                            const model = e.target.value as PricingModel;
                            let defaultUnit = '';
                            if (model === 'hourly') defaultUnit = 'hr';
                            else if (model === 'daily') defaultUnit = 'day';
                            else if (model === 'per_image') defaultUnit = 'img';
                            else if (model === 'per_session') defaultUnit = 'session';
                            handleItemChange(idx, 'pricingModel', model);
                            handleItemChange(idx, 'unitLabel', defaultUnit);
                          }}
                          className="w-full bg-black/60 border border-gray-800 rounded px-2 py-1.5 text-[11px] text-amber-300 focus:outline-none"
                        >
                          <option value="flat">Flat Package</option>
                          <option value="hourly">Hourly Rate (/hr)</option>
                          <option value="daily">Day Rate (/day)</option>
                          <option value="per_image">Per-Image (/img)</option>
                          <option value="per_session">Per-Session (/sess)</option>
                        </select>
                      </td>
                      <td className="py-3 px-2">
                        <select
                          value={item.serviceCategory}
                          onChange={(e) => handleItemChange(idx, 'serviceCategory', e.target.value)}
                          className="w-full bg-black/60 border border-gray-800 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none"
                        >
                          <option value="wedding">Wedding</option>
                          <option value="pre-wedding">Pre-Wedding</option>
                          <option value="cinematography">Cinematography</option>
                          <option value="portraits">Portraits</option>
                          <option value="reels">Reels</option>
                          <option value="album">Album</option>
                          <option value="drone">Drone</option>
                          <option value="gear">Equipment</option>
                          <option value="custom">Custom</option>
                        </select>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-12 bg-black/60 border border-gray-800 rounded px-1.5 py-1.5 text-xs font-mono text-center text-white focus:outline-none"
                          />
                          {item.unitLabel && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              {item.unitLabel}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          min={0}
                          step={500}
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, 'rate', parseInt(e.target.value) || 0)}
                          className="w-24 bg-black/60 border border-gray-800 rounded px-2 py-1.5 text-xs font-mono text-right text-white focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Retainer & Milestone Split Manager Component */}
            <div className="pt-4 border-t border-gray-800">
              <MilestoneRetainerManager
                milestones={milestones}
                totalAmount={calculatedFinancials.totalAmount}
                billDate={billDate}
                onChange={(updated) => setMilestones(updated)}
                onSyncAdvance={(paidAdvance) => {
                  setAdvancePaid(paidAdvance);
                  showNotification(`Advance deposit synced: ₹${paidAdvance.toLocaleString('en-IN')}`, 'info');
                }}
              />
            </div>
          </div>

          {/* FINANCIAL SUMMARY & ADVANCE RECONCILIATION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left 6/12: Discount & Advance Inputs */}
            <div className="lg:col-span-6 p-6 bg-[#111111] rounded-2xl border border-gray-800 space-y-5">
              <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest block border-b border-gray-800 pb-2">
                5. DISCOUNTS, ADVANCE DEPOSIT & LATE FEES
              </span>

              {/* Discount inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percent' | 'flat')}
                    className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="flat">Flat Amount (₹)</option>
                    <option value="percent">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                    Discount Value ({discountType === 'percent' ? '%' : '₹'})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                    className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Advance Paid input */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1.5">
                  Advance Paid / Token Received (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                  placeholder="e.g. 50000"
                  className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10.5px] text-gray-500 mt-1">
                  Enter advance deposit amount client has paid to book shoot dates. You can also click "Sync Advance with Paid Milestones" above.
                </p>
              </div>

              {/* Automated Late Fee Policy Configuration */}
              <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={15} className="text-[#D4AF37]" />
                    <span className="text-xs font-bold text-white">Automated Late Fee Policy</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lateFeeConfig.enabled}
                      onChange={(e) => setLateFeeConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="accent-[#D4AF37] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-zinc-300">Enable</span>
                  </label>
                </div>

                {lateFeeConfig.enabled && (
                  <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          Fee Structure
                        </label>
                        <select
                          value={lateFeeConfig.feeType}
                          onChange={(e) => setLateFeeConfig(prev => ({ ...prev, feeType: e.target.value as 'percent' | 'flat' }))}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        >
                          <option value="percent">Percentage (%)</option>
                          <option value="flat">Flat Fee (₹)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          Fee Rate ({lateFeeConfig.feeType === 'percent' ? '%' : '₹'})
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={lateFeeConfig.feeType === 'percent' ? 0.5 : 500}
                          value={lateFeeConfig.value}
                          onChange={(e) => setLateFeeConfig(prev => ({ ...prev, value: Number(e.target.value) || 0 }))}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          Grace Period (Days)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={60}
                          value={lateFeeConfig.gracePeriodDays}
                          onChange={(e) => setLateFeeConfig(prev => ({ ...prev, gracePeriodDays: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-zinc-400 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                      💡 If balance remains unpaid <span className="text-[#D4AF37] font-bold">{lateFeeConfig.gracePeriodDays} days</span> past the due date ({dueDate || 'selected date'}), an automatic surcharge of <span className="text-[#D4AF37] font-bold">{lateFeeConfig.value}{lateFeeConfig.feeType === 'percent' ? '% / mo' : ' ₹'}</span> will be displayed on client payment links, reminders, and PDF prints.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right 6/12: Live Calculated Bill Output Card */}
            <div className="lg:col-span-6 p-6 bg-black/60 rounded-2xl border border-gray-800 space-y-3 font-sans">
              <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest block border-b border-gray-800 pb-2">
                6. FINAL BILL SUMMARY (LIVE RECONCILIATION)
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-400 py-1">
                  <span>Gross Subtotal</span>
                  <span className="font-mono font-bold text-white">
                    ₹{calculatedFinancials.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {calculatedFinancials.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 py-1">
                    <span>Discount Applied</span>
                    <span className="font-mono font-bold">
                      -₹{calculatedFinancials.discountAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {taxRate > 0 ? (
                  <>
                    <div className="flex justify-between text-gray-400 py-1">
                      <span>CGST ({taxRate / 2}%)</span>
                      <span className="font-mono">₹{calculatedFinancials.cgst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-gray-400 py-1 border-b border-gray-800">
                      <span>SGST ({taxRate / 2}%)</span>
                      <span className="font-mono">₹{calculatedFinancials.sgst.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-gray-500 py-1 border-b border-gray-800 text-[11px]">
                    <span>GST (Tax Exempted)</span>
                    <span className="font-mono">₹0</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-2 text-base font-black text-white border-b-2 border-gray-800">
                  <span>Grand Total</span>
                  <span className="font-serif text-xl font-bold text-[#D4AF37]">
                    ₹{calculatedFinancials.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between text-gray-300 py-1 text-xs">
                  <span>Advance Received</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ₹{calculatedFinancials.totalAmount > 0 ? Math.min(advancePaid, calculatedFinancials.totalAmount).toLocaleString('en-IN') : 0}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3.5 bg-neutral-900 rounded-xl text-sm font-black border border-gray-800 mt-2">
                  <span className="uppercase tracking-wider text-[11px] text-[#D4AF37]">Balance Due</span>
                  <span className="font-mono text-lg font-bold text-white">
                    ₹{calculatedFinancials.balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action Buttons in Card */}
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => handleSaveBill(true)}
                  className="flex-1 py-3 bg-[#D4AF37] hover:bg-white text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-[#D4AF37]/20 active:scale-95"
                >
                  <Printer size={15} />
                  <span>Save & Preview A4 Print</span>
                </button>

                <button
                  onClick={() => handleSaveBill(false)}
                  className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Save Bill
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINT PREVIEW INVOICE MODAL (A4 READY) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {printingBill && (
          <PhotographyBillPrintModal
            bill={printingBill}
            onClose={() => setPrintingBill(null)}
            onEdit={(b) => {
              setPrintingBill(null);
              handleEditBill(b);
            }}
          />
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: ONLINE PAYMENT GATEWAY (STRIPE, PAYPAL, SQUARE, UPI) */}
      {/* ========================================================================= */}
      <OnlinePaymentGatewayModal
        isOpen={!!payingBill}
        bill={payingBill}
        onClose={() => setPayingBill(null)}
        onPaymentSuccess={handleOnlinePaymentSuccess}
      />

      {/* ========================================================================= */}
      {/* MODAL: AUTO-REMINDER DISPATCHER (WHATSAPP, EMAIL, SMS) */}
      {/* ========================================================================= */}
      <AutoReminderModal
        isOpen={!!reminderBill}
        bill={reminderBill}
        onClose={() => setReminderBill(null)}
        onSendReminder={handleSendReminder}
      />

    </div>
  );
};
