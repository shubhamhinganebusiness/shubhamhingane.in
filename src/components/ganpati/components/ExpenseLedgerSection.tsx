import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  TrendingDown, 
  ReceiptText, 
  Tag, 
  Calendar, 
  CheckCircle2, 
  Building2,
  Trash2,
  Edit3,
  Check,
  AlertTriangle,
  IndianRupee,
  CreditCard,
  Smartphone,
  Banknote,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ExpenseEntry, ExpenseCategory, PaymentMode, MandalLanguage } from '../types';
import { mandalTranslations } from '../translations/mandalTranslations';

interface ExpenseLedgerSectionProps {
  expenses: ExpenseEntry[];
  lang: MandalLanguage;
  onAddExpense: (newExpense: Omit<ExpenseEntry, 'id'>) => void;
  onUpdateExpense?: (updatedExpense: ExpenseEntry) => void;
  onDeleteExpense?: (expenseId: string) => void;
  userRole: string;
}

export const ExpenseLedgerSection: React.FC<ExpenseLedgerSectionProps> = ({
  expenses,
  lang,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  userRole
}) => {
  const t = mandalTranslations[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseEntry | null>(null);

  // New Expense Form State
  const [formData, setFormData] = useState({
    title: '',
    vendorName: '',
    amount: '',
    category: 'Decoration & Lighting (सजावट व रोषणाई)' as ExpenseCategory,
    paymentMode: 'upi' as PaymentMode,
    billNumber: '',
    approvedBy: 'राजेंद्र तांबडे (अध्यक्ष)',
    notes: '',
    hasReceiptImage: false
  });

  // Edit Expense Form State
  const [editFormData, setEditFormData] = useState({
    title: '',
    vendorName: '',
    amount: '',
    category: 'Decoration & Lighting (सजावट व रोषणाई)' as ExpenseCategory,
    paymentMode: 'upi' as PaymentMode,
    billNumber: '',
    approvedBy: '',
    notes: ''
  });

  // Automatic Financial Calculations
  const metrics = useMemo(() => {
    let total = 0;
    let cash = 0;
    let upi = 0;
    let bank = 0;
    let cheque = 0;

    expenses.forEach(e => {
      total += e.amount;
      if (e.paymentMode === 'cash') cash += e.amount;
      else if (e.paymentMode === 'upi' || e.paymentMode === 'gpay' || e.paymentMode === 'phonepe') upi += e.amount;
      else if (e.paymentMode === 'netbanking') bank += e.amount;
      else if (e.paymentMode === 'cheque') cheque += e.amount;
    });

    return { total, cash, upi, bank, cheque };
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch = 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.billNumber && e.billNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = selectedCategory === 'all' || e.category === selectedCategory;
      const matchMode = selectedPaymentMode === 'all' || e.paymentMode === selectedPaymentMode;

      return matchSearch && matchCategory && matchMode;
    });
  }, [expenses, searchQuery, selectedCategory, selectedPaymentMode]);

  // Create Expense Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.vendorName) {
      alert('कृपया खर्चाचे नाव, रक्कम व पुरवठादाराचे नाव भरा.');
      return;
    }

    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('कृपया योग्य रक्कम भरा.');
      return;
    }

    const nextVoucher = `EXP-2026-${String(expenses.length + 1).padStart(3, '0')}`;
    const dateStr = new Date().toISOString().split('T')[0];

    const newEntry: Omit<ExpenseEntry, 'id'> = {
      voucherNumber: nextVoucher,
      title: formData.title.trim(),
      vendorName: formData.vendorName.trim(),
      amount: numAmount,
      category: formData.category,
      paymentMode: formData.paymentMode,
      date: dateStr,
      billNumber: formData.billNumber.trim() || undefined,
      approvedBy: formData.approvedBy.trim(),
      notes: formData.notes.trim() || undefined,
      hasReceiptImage: formData.hasReceiptImage
    };

    onAddExpense(newEntry);
    setIsAddModalOpen(false);
    setFormData({
      title: '',
      vendorName: '',
      amount: '',
      category: 'Decoration & Lighting (सजावट व रोषणाई)',
      paymentMode: 'upi',
      billNumber: '',
      approvedBy: 'राजेंद्र तांबडे (अध्यक्ष)',
      notes: '',
      hasReceiptImage: false
    });
  };

  // Open Edit Modal
  const handleStartEdit = (exp: ExpenseEntry) => {
    setEditingExpense(exp);
    setEditFormData({
      title: exp.title,
      vendorName: exp.vendorName,
      amount: String(exp.amount),
      category: exp.category,
      paymentMode: exp.paymentMode,
      billNumber: exp.billNumber || '',
      approvedBy: exp.approvedBy,
      notes: exp.notes || ''
    });
  };

  // Save Edited Expense
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !onUpdateExpense) return;

    const numAmount = parseFloat(editFormData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('कृपया योग्य रक्कम भरा.');
      return;
    }

    const updated: ExpenseEntry = {
      ...editingExpense,
      title: editFormData.title.trim(),
      vendorName: editFormData.vendorName.trim(),
      amount: numAmount,
      category: editFormData.category,
      paymentMode: editFormData.paymentMode,
      billNumber: editFormData.billNumber.trim() || undefined,
      approvedBy: editFormData.approvedBy.trim(),
      notes: editFormData.notes.trim() || undefined
    };

    onUpdateExpense(updated);
    setEditingExpense(null);
  };

  // Confirm Delete Expense
  const handleConfirmDelete = () => {
    if (!deletingExpense || !onDeleteExpense) return;
    onDeleteExpense(deletingExpense.id);
    setDeletingExpense(null);
  };

  // Export to Excel
  const handleExport = () => {
    const data = expenses.map((e, idx) => ({
      'अ.क्र.': idx + 1,
      'व्हाऊचर क्र.': e.voucherNumber,
      'खर्चाचे नाव': e.title,
      'पुरवठादार / विक्रेता': e.vendorName,
      'वर्गवारी': e.category,
      'रक्कम (₹)': e.amount,
      'भरणा पद्धत': e.paymentMode.toUpperCase(),
      'बिल क्र.': e.billNumber || '-',
      'मंजुरी देणारा': e.approvedBy,
      'तारीख': e.date,
      'शेरा': e.notes || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expense_Vouchers_2026');
    XLSX.writeFile(wb, 'Shivtej_Ganpati_Expenses_2026.xlsx');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-surface p-6 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-500/10 text-rose-600 rounded-xl">
              <ReceiptText size={22} />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-main-text tracking-tight">
              खर्च नोंदवही (Expense Ledger & Vouchers)
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            मंडप, रोषणाई, फुले, महाप्रसाद, ध्वनी यंत्रणा व विसर्जन खर्चाचे अधिकृत डिजिटल व्हाऊचर्स व्यवस्थापन.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">एकूण झालेला खर्च</span>
            <span className="text-lg font-black text-rose-700 dark:text-rose-300">₹ {metrics.total.toLocaleString('en-IN')}</span>
          </div>

          <button 
            onClick={handleExport}
            className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl hover:bg-emerald-100 transition-all text-xs font-bold flex items-center gap-1.5"
            title="Export to Excel"
          >
            <FileSpreadsheet size={16} />
            <span className="hidden sm:inline">Excel Export</span>
          </button>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-900/20 transition-all cursor-pointer"
          >
            <PlusCircle size={16} />
            नवीन खर्च नोंदवा (+)
          </button>
        </div>
      </div>

      {/* Automatic Expense Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        <div className="p-4 bg-surface rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="flex items-center gap-1"><Banknote size={14} className="text-emerald-500" /> रोख खर्च (Cash)</span>
          </div>
          <p className="text-base sm:text-lg font-black text-main-text">₹ {metrics.cash.toLocaleString('en-IN')}</p>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="flex items-center gap-1"><Smartphone size={14} className="text-blue-500" /> UPI / QR खर्च</span>
          </div>
          <p className="text-base sm:text-lg font-black text-main-text">₹ {metrics.upi.toLocaleString('en-IN')}</p>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="flex items-center gap-1"><CreditCard size={14} className="text-purple-500" /> बँक ट्रान्सफर</span>
          </div>
          <p className="text-base sm:text-lg font-black text-main-text">₹ {metrics.bank.toLocaleString('en-IN')}</p>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="flex items-center gap-1"><ReceiptText size={14} className="text-amber-500" /> धनादेश (Cheque)</span>
          </div>
          <p className="text-base sm:text-lg font-black text-main-text">₹ {metrics.cheque.toLocaleString('en-IN')}</p>
        </div>

      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="खर्चाचे नाव, पुरवठादार किंवा बिल क्र. ने शोधा..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-surface border border-gray-100 dark:border-zinc-800 rounded-2xl text-xs focus:ring-2 focus:ring-rose-500/20 outline-none text-main-text"
          />
        </div>

        <div className="sm:col-span-3">
          <select 
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-surface border border-gray-100 dark:border-zinc-800 rounded-2xl text-xs text-main-text outline-none font-bold"
          >
            <option value="all">सर्व खर्च वर्गवारी (All Categories)</option>
            <option value="Flower & Garlands (फुल व हार)">Flower & Garlands (फुल व हार)</option>
            <option value="Decoration & Lighting (सजावट व रोषणाई)">Decoration & Lighting (सजावट व रोषणाई)</option>
            <option value="Prasad & Ingredients (प्रसाद व अन्नदान)">Prasad & Ingredients (प्रसाद व अन्नदान)</option>
            <option value="Pandal & Mandap Setup (मंडप उभारणी)">Pandal & Mandap Setup (मंडप उभारणी)</option>
            <option value="Sound & Dhol Tasha (ध्वनी व ढोल-ताशा)">Sound & Dhol Tasha (ध्वनी व ढोल-ताशा)</option>
            <option value="Electricity & Generator (विद्युत व जनरेटर)">Electricity & Generator (विद्युत व जनरेटर)</option>
            <option value="Security & Bouncers (सुरक्षा)">Security & Bouncers (सुरक्षा)</option>
            <option value="Visarjan Procession (विसर्जन मिरवणूक)">Visarjan Procession (विसर्जन मिरवणूक)</option>
            <option value="Office & Miscellaneous (इतर खर्च)">Office & Miscellaneous (इतर खर्च)</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select 
            value={selectedPaymentMode}
            onChange={e => setSelectedPaymentMode(e.target.value)}
            className="w-full px-3 py-2.5 bg-surface border border-gray-100 dark:border-zinc-800 rounded-2xl text-xs text-main-text outline-none font-bold"
          >
            <option value="all">भरणा पद्धत: सर्व (All Modes)</option>
            <option value="cash">रोख (Cash)</option>
            <option value="upi">UPI / Online</option>
            <option value="netbanking">Net Banking</option>
            <option value="cheque">धनादेश (Cheque)</option>
          </select>
        </div>
      </div>

      {/* Expense Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExpenses.map((expense) => (
          <motion.div 
            key={expense.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 bg-surface rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all space-y-3 relative group"
          >
            <div className="flex justify-between items-start">
              <span className="px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-mono text-[10px] font-bold rounded-lg border border-rose-200 dark:border-rose-900/40">
                {expense.voucherNumber}
              </span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                ₹ {expense.amount.toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <h4 className="font-bold text-sm text-main-text leading-snug">{expense.title}</h4>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Building2 size={12} className="text-gray-400" /> {expense.vendorName}
              </p>
            </div>

            {expense.notes && (
              <p className="text-[11px] text-gray-500 bg-gray-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-gray-100 dark:border-zinc-800">
                {expense.notes}
              </p>
            )}

            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-500">
              <span className="font-medium bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-gray-600 dark:text-gray-300">
                {expense.category.split(' ')[0]}
              </span>
              <span>{expense.date} • {expense.paymentMode.toUpperCase()}</span>
            </div>

            <div className="text-[10px] text-gray-400 flex justify-between items-center bg-gray-50 dark:bg-zinc-800/40 p-2 rounded-xl">
              <span>मंजूर: {expense.approvedBy}</span>
              {expense.billNumber && <span>बिल: {expense.billNumber}</span>}
            </div>

            {/* Action Buttons for Edit and Delete */}
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-end gap-2">
              <button 
                onClick={() => handleStartEdit(expense)}
                className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                title="खर्च संपादित करा"
              >
                <Edit3 size={13} />
                <span>संपादित करा</span>
              </button>

              <button 
                onClick={() => setDeletingExpense(expense)}
                className="px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                title="खर्च काढून टाका"
              >
                <Trash2 size={13} />
                <span>काढून टाका</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredExpenses.length === 0 && (
        <div className="text-center py-12 bg-surface rounded-3xl border border-gray-100 dark:border-zinc-800">
          <ReceiptText className="mx-auto text-gray-300 mb-2" size={40} />
          <h4 className="font-bold text-gray-600 dark:text-gray-300 text-sm">कोणतेही खर्च सापडले नाहीत</h4>
          <p className="text-xs text-gray-400 mt-1">कृपया शोध निकष बदला किंवा नवीन खर्च नोंदवा.</p>
        </div>
      )}

      {/* Add New Expense Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-rose-200 dark:border-zinc-800 relative my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-zinc-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-500/10 text-rose-600 rounded-xl">
                    <PlusCircle size={20} />
                  </div>
                  <h3 className="text-lg font-black text-main-text">नवीन खर्च नोंदणी (Add Expense Voucher)</h3>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-main-text">✕</button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">खर्चाचे नाव / विवरण *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="उदा. आगमन दिवस फुले, हार व मंडप सजावट"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">रक्कम (₹) *</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      placeholder="रक्कम भरा"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-black text-rose-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">पुरवठादार / विक्रेता *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="दुकान किंवा व्यक्तीचे नाव"
                      value={formData.vendorName}
                      onChange={e => setFormData({ ...formData, vendorName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">वर्गवारी (Category)</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    >
                      <option value="Flower & Garlands (फुल व हार)">Flower & Garlands (फुल व हार)</option>
                      <option value="Decoration & Lighting (सजावट व रोषणाई)">Decoration & Lighting (सजावट व रोषणाई)</option>
                      <option value="Prasad & Ingredients (प्रसाद व अन्नदान)">Prasad & Ingredients (प्रसाद व अन्नदान)</option>
                      <option value="Pandal & Mandap Setup (मंडप उभारणी)">Pandal & Mandap Setup (मंडप उभारणी)</option>
                      <option value="Sound & Dhol Tasha (ध्वनी व ढोल-ताशा)">Sound & Dhol Tasha (ध्वनी व ढोल-ताशा)</option>
                      <option value="Electricity & Generator (विद्युत व जनरेटर)">Electricity & Generator (विद्युत व जनरेटर)</option>
                      <option value="Security & Bouncers (सुरक्षा)">Security & Bouncers (सुरक्षा)</option>
                      <option value="Visarjan Procession (विसर्जन मिरवणूक)">Visarjan Procession (विसर्जन मिरवणूक)</option>
                      <option value="Office & Miscellaneous (इतर खर्च)">Office & Miscellaneous (इतर खर्च)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">भरणा प्रकार</label>
                    <select 
                      value={formData.paymentMode}
                      onChange={e => setFormData({ ...formData, paymentMode: e.target.value as PaymentMode })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    >
                      <option value="upi">UPI / Online</option>
                      <option value="cash">रोख (Cash)</option>
                      <option value="cheque">धनादेश (Cheque)</option>
                      <option value="netbanking">Net Banking</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">बिल / इनव्हॉइस नंबर</label>
                    <input 
                      type="text" 
                      placeholder="उदा. BILL/2026/104"
                      value={formData.billNumber}
                      onChange={e => setFormData({ ...formData, billNumber: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">मंजुरी देणारा पदाधिकारी</label>
                    <input 
                      type="text" 
                      value={formData.approvedBy}
                      onChange={e => setFormData({ ...formData, approvedBy: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">शेरा / तपशील (Notes)</label>
                  <input 
                    type="text" 
                    placeholder="उदा. आरती साहित्याचे संपूर्ण पेमेंट पूर्ण झाले"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                  />
                </div>

                <div className="pt-3 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="w-1/3 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold"
                  >
                    रद्द करा
                  </button>
                  <button 
                    type="submit"
                    className="w-2/3 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 flex items-center justify-center gap-1.5 shadow-md shadow-rose-900/20"
                  >
                    <CheckCircle2 size={16} />
                    खर्च नोंद साठवा
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Expense Modal */}
      <AnimatePresence>
        {editingExpense && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-blue-400 dark:border-zinc-800 relative my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-zinc-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-main-text">खर्च नोंद संपादन (Edit Expense)</h3>
                    <p className="text-xs text-gray-500">{editingExpense.voucherNumber}</p>
                  </div>
                </div>
                <button onClick={() => setEditingExpense(null)} className="text-gray-400 hover:text-main-text">✕</button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">खर्चाचे नाव *</label>
                  <input 
                    type="text" 
                    required
                    value={editFormData.title}
                    onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-main-text outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">रक्कम (₹) *</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={editFormData.amount}
                      onChange={e => setEditFormData({ ...editFormData, amount: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-black text-rose-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">पुरवठादार / विक्रेता *</label>
                    <input 
                      type="text" 
                      required
                      value={editFormData.vendorName}
                      onChange={e => setEditFormData({ ...editFormData, vendorName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-main-text outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">वर्गवारी</label>
                    <select 
                      value={editFormData.category}
                      onChange={e => setEditFormData({ ...editFormData, category: e.target.value as ExpenseCategory })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    >
                      <option value="Flower & Garlands (फुल व हार)">Flower & Garlands (फुल व हार)</option>
                      <option value="Decoration & Lighting (सजावट व रोषणाई)">Decoration & Lighting (सजावट व रोषणाई)</option>
                      <option value="Prasad & Ingredients (प्रसाद व अन्नदान)">Prasad & Ingredients (प्रसाद व अन्नदान)</option>
                      <option value="Pandal & Mandap Setup (मंडप उभारणी)">Pandal & Mandap Setup (मंडप उभारणी)</option>
                      <option value="Sound & Dhol Tasha (ध्वनी व ढोल-ताशा)">Sound & Dhol Tasha (ध्वनी व ढोल-ताशा)</option>
                      <option value="Electricity & Generator (विद्युत व जनरेटर)">Electricity & Generator (विद्युत व जनरेटर)</option>
                      <option value="Security & Bouncers (सुरक्षा)">Security & Bouncers (सुरक्षा)</option>
                      <option value="Visarjan Procession (विसर्जन मिरवणूक)">Visarjan Procession (विसर्जन मिरवणूक)</option>
                      <option value="Office & Miscellaneous (इतर खर्च)">Office & Miscellaneous (इतर खर्च)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">भरणा प्रकार</label>
                    <select 
                      value={editFormData.paymentMode}
                      onChange={e => setEditFormData({ ...editFormData, paymentMode: e.target.value as PaymentMode })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    >
                      <option value="upi">UPI / Online</option>
                      <option value="cash">रोख (Cash)</option>
                      <option value="cheque">धनादेश (Cheque)</option>
                      <option value="netbanking">Net Banking</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">बिल नंबर</label>
                    <input 
                      type="text" 
                      value={editFormData.billNumber}
                      onChange={e => setEditFormData({ ...editFormData, billNumber: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">मंजुरी देणारा</label>
                    <input 
                      type="text" 
                      value={editFormData.approvedBy}
                      onChange={e => setEditFormData({ ...editFormData, approvedBy: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">शेरा (Notes)</label>
                  <input 
                    type="text" 
                    value={editFormData.notes}
                    onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                  />
                </div>

                <div className="pt-3 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setEditingExpense(null)}
                    className="w-1/3 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold"
                  >
                    रद्द करा
                  </button>
                  <button 
                    type="submit"
                    className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/20"
                  >
                    <Check size={16} />
                    बदल जतन करा
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingExpense && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-2xl border border-rose-400 dark:border-zinc-800 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500/20 text-rose-600 rounded-2xl">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-main-text">खर्च नोंद काढून टाका (Delete Expense)</h3>
                  <p className="text-xs text-gray-500">{deletingExpense.voucherNumber}</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-rose-50 dark:bg-rose-950/40 p-3 rounded-2xl border border-rose-200 dark:border-rose-900/40">
                तुम्हाला <span className="font-bold text-main-text">{deletingExpense.title}</span> (रक्कम: ₹{deletingExpense.amount.toLocaleString('en-IN')}) ही खर्च नोंद कायमस्वरूपी काढून टाकायची आहे का?
              </p>

              <div className="pt-3 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setDeletingExpense(null)}
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
                  होय, काढून टाका
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
