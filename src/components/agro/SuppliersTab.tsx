import React, { useState } from 'react';
import { 
  Plus, Search, Phone, Mail, MapPin, 
  Trash2, Settings, User, X, Briefcase, 
  History, CreditCard, Save, DollarSign, Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { AgroState, AgroSupplier } from './types';
import { handleFirestoreError, OperationType } from '../../lib/firebase';
import { LoadingSpinner } from './ui/LoadingSpinner';

export const SuppliersTab: React.FC<{ state: AgroState; shopId: string | null }> = ({ state, shopId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<AgroSupplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newSupplier, setNewSupplier] = useState<Partial<AgroSupplier>>({
    name: '',
    contact: '',
    email: '',
    address: '',
    gstin: '',
    openingBalance: 0
  });

  const filteredSuppliers = state.suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact.includes(searchTerm)
  );

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !shopId) return;

    const shopRef = doc(db, 'agro_shops', shopId);
    
    try {
      if (editingSupplier) {
        await updateDoc(doc(shopRef, 'suppliers', editingSupplier.id), newSupplier);
      } else {
        await addDoc(collection(shopRef, 'suppliers'), {
          ...newSupplier,
          createdAt: new Date().toISOString()
        });
      }
      
      setIsModalOpen(false);
      setEditingSupplier(null);
      setNewSupplier({ name: '', contact: '', email: '', address: '', gstin: '', openingBalance: 0 });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `agro_shops/${shopId}/suppliers`);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!auth.currentUser || !shopId || !window.confirm('Delete this supplier?')) return;
    try {
      await deleteDoc(doc(db, 'agro_shops', shopId, 'suppliers', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `agro_shops/${shopId}/suppliers/${id}`);
    }
  };

  const [selectedLedgerSupp, setSelectedLedgerSupp] = useState<AgroSupplier | null>(null);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [payForm, setPayForm] = useState({ amount: 0, method: 'Cash', date: new Date().toISOString().split('T')[0], note: '' });

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLedgerSupp || !shopId || payForm.amount <= 0) return;
    try {
      await addDoc(collection(db, 'agro_shops', shopId, 'transactions'), {
        partyId: selectedLedgerSupp.id,
        partyName: selectedLedgerSupp.name,
        partyType: 'Supplier',
        type: 'Payment',
        amount: payForm.amount,
        method: payForm.method,
        description: payForm.note,
        date: payForm.date,
        createdAt: new Date().toISOString()
      });
      setIsRecordingPayment(false);
      setPayForm({ amount: 0, method: 'Cash', date: new Date().toISOString().split('T')[0], note: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `agro_shops/${shopId}/transactions`);
    }
  };

  const supplierPurchases = state.purchases.filter(p => 
    p.supplierId === selectedLedgerSupp?.id
  );

  const supplierTransactions = state.transactions.filter(t => 
    t.partyId === selectedLedgerSupp?.id && t.partyType === 'Supplier'
  );

  const unifiedHistory = [
    ...supplierPurchases.map(p => ({
      id: p.id,
      date: p.date,
      createdAt: p.createdAt,
      type: 'Purchase',
      amount: p.totalAmount,
      method: 'Credit',
      status: 'Invoiced',
      description: `Purchase #${p.id.slice(-6).toUpperCase()}`
    })),
    ...supplierTransactions.map(t => ({
      id: t.id,
      date: t.date,
      createdAt: t.createdAt,
      type: t.type === 'Payment' ? 'Paid to Supplier' : 'Balance Adj.',
      amount: t.amount,
      method: t.method || 'Cash',
      status: 'Settled',
      description: t.description || (t.type === 'Payment' ? 'Supplier Payment' : 'Internal Adjustment')
    }))
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const totalPurchases = supplierPurchases.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalPaid = supplierTransactions.filter(t => t.type === 'Payment').reduce((acc, curr) => acc + curr.amount, 0);
  const currentBalance = totalPurchases - totalPaid + (selectedLedgerSupp?.openingBalance || 0);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Suppliers</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Manage partner records</p>
        </div>
        <button 
          onClick={() => {
            setEditingSupplier(null);
            setNewSupplier({ name: '', contact: '', email: '', address: '', gstin: '', openingBalance: 0 });
            setIsModalOpen(true);
          }}
          className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 hover:bg-primary transition-all"
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search by name or contact..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none shadow-sm dark:text-white font-bold"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.loading ? (
          <div className="col-span-full">
            <LoadingSpinner label="Auditing Suppliers..." />
          </div>
        ) : filteredSuppliers.map((supplier) => (
          <motion.div 
            layout
            key={supplier.id}
            className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm group hover:shadow-xl hover:shadow-primary/5 transition-all"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-primary">
                <Briefcase size={24} />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    setEditingSupplier(supplier);
                    setNewSupplier(supplier);
                    setIsModalOpen(true);
                  }}
                  className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-lg"
                >
                  <Settings size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteSupplier(supplier.id)}
                  className="p-2 bg-red-50 text-red-400 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 uppercase">{supplier.name}</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                <Phone size={14} className="text-primary" />
                {supplier.contact}
              </div>
              {supplier.email && (
                <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                  <Mail size={14} className="text-primary" />
                  {supplier.email}
                </div>
              )}
              {supplier.gstin && (
                <div className="flex items-center gap-3 text-xs font-black text-gray-400">
                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[8px] uppercase tracking-tighter">GSTIN</span>
                  {supplier.gstin}
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center mb-6">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Balance</p>
               <p className={`text-lg font-black ${supplier.openingBalance && supplier.openingBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>₹{supplier.openingBalance || 0}</p>
            </div>

            <button 
              onClick={() => setSelectedLedgerSupp(supplier)}
              className="w-full py-4 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-all"
            >
              <History size={14} /> View Purchase Ledger
            </button>
          </motion.div>
        ))}
      </div>

      {/* Modal Definitions */}
      <AnimatePresence>
      {selectedLedgerSupp && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-10 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase">Supplier Statement</h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{selectedLedgerSupp.name} • {selectedLedgerSupp.contact}</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsRecordingPayment(!isRecordingPayment)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${isRecordingPayment ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-primary text-white shadow-primary/20 hover:bg-black'}`}
                >
                  {isRecordingPayment ? <X size={14} /> : <Plus size={14} />} {isRecordingPayment ? 'Cancel' : 'Record Payment'}
                </button>
                <button onClick={() => { setSelectedLedgerSupp(null); setIsRecordingPayment(false); }} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-full transition-transform hover:rotate-90">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              {isRecordingPayment && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  className="bg-red-50 dark:bg-red-900/10 p-8 rounded-[2.5rem] border border-red-100 dark:border-red-800/20"
                >
                  <form onSubmit={handleRecordPayment} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div>
                      <label className="text-[9px] font-black text-red-600 uppercase tracking-widest ml-1">Payment Amount</label>
                      <input required type="number" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: Number(e.target.value)})} className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-sm font-bold mt-1 outline-none focus:ring-2 focus:ring-red-500/20" placeholder="₹ Amount" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-red-600 uppercase tracking-widest ml-1">Payment Method</label>
                      <select value={payForm.method} onChange={e => setPayForm({...payForm, method: e.target.value})} className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-sm font-bold mt-1 outline-none">
                        <option>Cash</option>
                        <option>Bank Transfer</option>
                        <option>UPI</option>
                        <option>Cheque</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-red-600 uppercase tracking-widest ml-1">Date</label>
                      <input type="date" value={payForm.date} onChange={e => setPayForm({...payForm, date: e.target.value})} className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-sm font-bold mt-1 outline-none" />
                    </div>
                    <button type="submit" className="py-3 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">
                      <Save size={14} /> Post Payment
                    </button>
                  </form>
                </motion.div>
              )}
              <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-[2.5rem] p-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center border border-emerald-100 dark:border-emerald-900/30">
                <div>
                   <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-3">Net Outstanding Payable</p>
                   <p className={`text-5xl font-black italic tracking-tighter ${currentBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>₹{currentBalance.toLocaleString()}</p>
                </div>
                <div className="flex justify-between md:justify-end gap-10">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Purchases</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">₹{totalPurchases.toLocaleString()}</p>
                  </div>
                   <div className="text-right">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Total Payments</p>
                    <p className="text-2xl font-black text-emerald-500 tracking-tight">₹{totalPaid.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Purchase History & Vouchers</h4>
                 {unifiedHistory.map(entry => (
                   <div key={entry.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-3xl flex items-center justify-between hover:shadow-xl hover:shadow-emerald-500/5 transition-all cursor-default">
                      <div className="flex gap-6 items-center">
                        <div className={`p-4 rounded-2xl flex items-center justify-center ${entry.type === 'Purchase' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                           {entry.type === 'Purchase' ? <Truck size={20} /> : <DollarSign size={20} />}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{entry.description}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{entry.date} • {entry.type} • {entry.method}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-black italic tracking-tight ${entry.type === 'Purchase' ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                          {entry.type === 'Purchase' ? '' : '-' }₹{entry.amount.toLocaleString()}
                        </p>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{entry.status}</span>
                      </div>
                   </div>
                 ))}
                 {unifiedHistory.length === 0 && (
                   <div className="py-24 text-center">
                      <Truck className="mx-auto mb-6 text-gray-100" size={64} />
                      <p className="font-black text-gray-400 uppercase tracking-widest text-xs italic">No purchase transactions found for this supplier.</p>
                   </div>
                 )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Supplier Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
               className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-[3rem] p-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{editingSupplier ? 'Edit' : 'New'} Supplier</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={24}/></button>
              </div>

              <form onSubmit={handleSaveSupplier} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Supplier/Company Name</label>
                  <input required type="text" value={newSupplier.name || ''} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile</label>
                    <input required type="text" value={newSupplier.contact || ''} onChange={e => setNewSupplier({...newSupplier, contact: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold mt-1" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">GSTIN</label>
                    <input type="text" value={newSupplier.gstin || ''} onChange={e => setNewSupplier({...newSupplier, gstin: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Opening Balance (₹)</label>
                  <input type="number" value={newSupplier.openingBalance || ''} onChange={e => setNewSupplier({...newSupplier, openingBalance: Number(e.target.value)})} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold mt-1" />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold text-gray-500 uppercase tracking-widest text-xs">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20">Save Record</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
