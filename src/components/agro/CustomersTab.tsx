import React, { useState } from 'react';
import { 
  Search, Plus, Settings, Receipt, X, 
  User, MapPin, Phone, History, CreditCard, Save, DollarSign, Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { AgroState, AgroCustomer } from './types';

export const CustomersTab: React.FC<{ state: AgroState; shopId: string | null }> = ({ state, shopId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLedgerCust, setSelectedLedgerCust] = useState<AgroCustomer | null>(null);
  const [editingCust, setEditingCust] = useState<AgroCustomer | null>(null);
  const [custForm, setCustForm] = useState({ name: '', contact: '', village: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [payForm, setPayForm] = useState({ amount: 0, method: 'Cash', date: new Date().toISOString().split('T')[0], note: '' });

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLedgerCust || !shopId || payForm.amount <= 0) return;
    try {
      await addDoc(collection(db, 'agro_shops', shopId, 'transactions'), {
        partyId: selectedLedgerCust.id,
        partyName: selectedLedgerCust.name,
        partyType: 'Customer',
        type: 'Receipt',
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

  const filteredCustomers = state.customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact.includes(searchTerm)
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !shopId) return;
    const shopRef = doc(db, 'agro_shops', shopId);
    
    try {
      if (editingCust) {
        await updateDoc(doc(shopRef, 'customers', editingCust.id), custForm);
      } else {
        await addDoc(collection(shopRef, 'customers'), {
          ...custForm,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setEditingCust(null);
      setCustForm({ name: '', contact: '', village: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `agro_shops/${shopId}/customers`);
    }
  };

  const openEdit = (cust: AgroCustomer) => {
    setEditingCust(cust);
    setCustForm({ name: cust.name, contact: cust.contact, village: cust.village });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!auth.currentUser || !shopId || !window.confirm('Delete this customer? This action is irreversible.')) return;
    const shopRef = doc(db, 'agro_shops', shopId);
    try {
      await deleteDoc(doc(shopRef, 'customers', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `agro_shops/${shopId}/customers/${id}`);
    }
  };

  const customerBills = state.bills.filter(b => 
    b.customerId === selectedLedgerCust?.id
  );

  const customerTransactions = state.transactions.filter(t => 
    t.partyId === selectedLedgerCust?.id && t.partyType === 'Customer'
  );

  const unifiedHistory = [
    ...customerBills.map(b => ({
      id: b.id,
      date: b.date,
      createdAt: b.createdAt,
      type: 'Sale',
      amount: b.totalAmount,
      method: b.paymentMethod,
      status: b.paymentStatus,
      description: `Invoice #${b.invoiceNo || b.id.slice(-6)}`
    })),
    ...customerTransactions.map(t => ({
      id: t.id,
      date: t.date,
      createdAt: t.createdAt,
      type: t.type === 'Receipt' ? 'Payment Received' : 'Balance Adj.',
      amount: t.amount,
      method: t.method || 'Cash',
      status: 'Settled',
      description: t.description || (t.type === 'Receipt' ? 'Customer Payment' : 'Internal Adjustment')
    }))
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const totalSales = customerBills.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalPaid = customerTransactions.filter(t => t.type === 'Receipt').reduce((acc, curr) => acc + curr.amount, 0);
  const currentBalance = totalSales - totalPaid + (selectedLedgerCust?.openingBalance || 0);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic">Customer <span className="text-primary italic">Directory</span></h2>
           <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Manage relationships & credit history</p>
        </div>
        <div className="flex flex-1 max-w-2xl items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Search by name, contact or village..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] pl-16 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none shadow-sm dark:text-white"
            />
          </div>
          <button 
            onClick={() => {
              setEditingCust(null);
              setCustForm({ name: '', contact: '', village: '' });
              setIsModalOpen(true);
            }}
            className="whitespace-nowrap px-8 py-4 bg-black text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-primary transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Add Customer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.loading ? (
          <div className="col-span-full">
            <LoadingSpinner label="Fetching Customer Directory..." />
          </div>
        ) : filteredCustomers.map(c => (
          <motion.div 
            layout
            key={c.id} 
            className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
               <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-gray-400 group-hover:text-primary transition-colors">
                  <User size={24} />
               </div>
               <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-2 text-gray-300 hover:text-primary transition-colors"><Settings size={18}/></button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><X size={18}/></button>
               </div>
            </div>
            
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">{c.name}</h3>
            
            <div className="space-y-3 mb-8">
               <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <MapPin size={14} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{c.village}</span>
               </div>
               <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Phone size={14} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{c.contact}</span>
               </div>
            </div>

            <button 
              onClick={() => setSelectedLedgerCust(c)}
              className="w-full py-4 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-all"
            >
              <History size={14} /> View Shopping Ledger
            </button>
          </motion.div>
        ))}
        {!state.loading && filteredCustomers.length === 0 && (
          <div className="col-span-full py-32 text-center">
             <User size={64} className="mx-auto text-gray-100 mb-6" />
             <p className="text-gray-400 font-bold text-lg italic tracking-tight">Zero customers matched your search.</p>
          </div>
        )}
      </div>

       <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
               className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[3rem] p-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic">
                  {editingCust ? 'Edit' : 'New'} <span className="text-primary italic">Customer</span>
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-50 rounded-full"><X size={20}/></button>
              </div>
              <form onSubmit={handleSave} className="space-y-6">
                <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                   <input required value={custForm.name} onChange={e => setCustForm({...custForm, name: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold mt-1 outline-none" placeholder="Enter name" />
                </div>
                <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Number</label>
                   <input required value={custForm.contact} onChange={e => setCustForm({...custForm, contact: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold mt-1 outline-none" placeholder="0000000000" />
                </div>
                <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Village / Town</label>
                   <input required value={custForm.village} onChange={e => setCustForm({...custForm, village: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold mt-1 outline-none" placeholder="Enter location" />
                </div>
                <button className="w-full py-5 bg-black text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-primary transition-all mt-4">
                  {editingCust ? 'Update Record' : 'Save Customer Profile'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
      {selectedLedgerCust && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-10 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase">Ledger Statement</h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{selectedLedgerCust.name} • {selectedLedgerCust.village}</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsRecordingPayment(!isRecordingPayment)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${isRecordingPayment ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-primary text-white shadow-primary/20 hover:bg-black'}`}
                >
                  {isRecordingPayment ? <X size={14} /> : <Plus size={14} />} {isRecordingPayment ? 'Cancel' : 'Record Payment'}
                </button>
                <button onClick={() => { setSelectedLedgerCust(null); setIsRecordingPayment(false); }} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-full transition-transform hover:rotate-90">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              {isRecordingPayment && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  className="bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-800/20"
                >
                  <form onSubmit={handleRecordPayment} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div>
                      <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-1">Received Amount</label>
                      <input required type="number" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: Number(e.target.value)})} className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-sm font-bold mt-1 outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="₹ Amount" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-1">Payment Method</label>
                      <select value={payForm.method} onChange={e => setPayForm({...payForm, method: e.target.value})} className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-sm font-bold mt-1 outline-none">
                        <option>Cash</option>
                        <option>PhonePe</option>
                        <option>GPay</option>
                        <option>Card</option>
                        <option>Bank Transfer</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-1">Date</label>
                      <input type="date" value={payForm.date} onChange={e => setPayForm({...payForm, date: e.target.value})} className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-sm font-bold mt-1 outline-none" />
                    </div>
                    <button type="submit" className="py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                      <Save size={14} /> Post Receipt
                    </button>
                  </form>
                </motion.div>
              )}
              <div className="bg-primary/5 dark:bg-primary/10 rounded-[2.5rem] p-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center border border-primary/10">
                <div>
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3">Total Outstanding Balance</p>
                   <p className={`text-5xl font-black italic tracking-tighter ${currentBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>₹{currentBalance.toLocaleString()}</p>
                </div>
                <div className="flex justify-between md:justify-end gap-10">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Sales</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">₹{totalSales.toLocaleString()}</p>
                  </div>
                   <div className="text-right">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Total Paid</p>
                    <p className="text-2xl font-black text-emerald-500 tracking-tight">₹{totalPaid.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Combined History & Payments</h4>
                 {unifiedHistory.map(entry => (
                   <div key={entry.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-3xl flex items-center justify-between hover:shadow-xl hover:shadow-primary/5 transition-all cursor-default">
                      <div className="flex gap-6 items-center">
                        <div className={`p-4 rounded-2xl flex items-center justify-center ${entry.type === 'Sale' ? 'bg-primary/10 text-primary' : 'bg-emerald-100 text-emerald-600'}`}>
                           {entry.type === 'Sale' ? <Receipt size={20} /> : <DollarSign size={20} />}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{entry.description}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{entry.date} • {entry.type} • {entry.method}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-black italic tracking-tight ${entry.type === 'Sale' ? 'text-primary' : 'text-emerald-500'}`}>
                          {entry.type === 'Sale' ? '' : '-' }₹{entry.amount.toLocaleString()}
                        </p>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${entry.status === 'Paid' || entry.status === 'Settled' ? 'text-emerald-500' : 'text-orange-500'}`}>{entry.status}</span>
                      </div>
                   </div>
                 ))}
                 {unifiedHistory.length === 0 && (
                   <div className="py-24 text-center">
                      <Receipt className="mx-auto mb-6 text-gray-100" size={64} />
                      <p className="font-black text-gray-400 uppercase tracking-widest text-xs italic">This customer has no recorded transactions.</p>
                   </div>
                 )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </div>
  );
};
