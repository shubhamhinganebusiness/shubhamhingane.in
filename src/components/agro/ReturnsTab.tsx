import React, { useState } from 'react';
import { 
  Undo2, Search, Plus, Filter, Calendar, 
  ArrowUpRight, ArrowDownLeft, X, AlertTriangle, 
  Box, User, FileText, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { AgroState, AgroReturn, AgroProduct } from './types';
import { handleFirestoreError, OperationType } from '../../lib/firebase';

export const ReturnsTab: React.FC<{ state: AgroState; shopId: string | null }> = ({ state, shopId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Sale' | 'Purchase'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [newReturn, setNewReturn] = useState<Partial<AgroReturn>>({
    type: 'Sale',
    originalInvoiceNo: '',
    partyName: '',
    productName: '',
    quantity: 0,
    amount: 0,
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });

  const filteredReturns = state.returns
    .filter(r => 
      r.partyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.originalInvoiceNo?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(r => typeFilter === 'All' || r.type === typeFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;
    setIsProcessing(true);
    
    try {
      // 1. Add return record
      await addDoc(collection(db, 'agro_shops', shopId, 'returns'), {
        ...newReturn,
        createdAt: new Date().toISOString()
      });

      // 2. Adjust inventory if product matches
      if (newReturn.productId) {
        const prod = state.products.find(p => p.id === newReturn.productId);
        if (prod) {
           const newStock = newReturn.type === 'Sale' 
            ? prod.stock + (newReturn.quantity || 0) 
            : prod.stock - (newReturn.quantity || 0);
            
           await updateDoc(doc(db, 'agro_shops', shopId, 'products', prod.id), {
             stock: Math.max(0, newStock)
           });
        }
      }

      setIsModalOpen(false);
      setNewReturn({
        type: 'Sale',
        originalInvoiceNo: '',
        partyName: '',
        productName: '',
        quantity: 0,
        amount: 0,
        reason: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `agro_shops/${shopId}/returns`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic">Returns & <span className="text-primary italic">Adjustments</span></h2>
          <p className="text-gray-500 text-xs font-black uppercase tracking-widest mt-1">Manage sale and purchase returns</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-primary text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2 hover:bg-black transition-all"
        >
          <Plus size={18} />
          New Return Entry
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search invoice, product, party..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-gray-900 border-none rounded-[2rem] pl-16 pr-8 py-5 text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-primary/5 transition-all"
          />
        </div>
        <div className="md:col-span-4 flex gap-2">
          <div className="flex-1 relative">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={16} />
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full bg-white dark:bg-gray-900 border-none rounded-[2rem] pl-14 pr-8 py-5 text-xs font-black uppercase tracking-widest shadow-sm outline-none appearance-none"
            >
              <option value="All">All Types</option>
              <option value="Sale">Sale Return</option>
              <option value="Purchase">Purchase Return</option>
            </select>
          </div>
        </div>
      </div>

      {state.loading ? (
        <LoadingSpinner label="Fetching Returns History..." />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry Info</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Party / Invoice</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product / Reason</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Quantity</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Credit Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredReturns.length > 0 ? filteredReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${r.type === 'Sale' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
                          {r.type === 'Sale' ? <Undo2 size={18} /> : <Box size={18} />}
                        </div>
                        <div>
                          <p className={`text-[8px] font-black uppercase tracking-widest ${r.type === 'Sale' ? 'text-emerald-500' : 'text-orange-500'}`}>{r.type} Return</p>
                          <p className="text-[8px] font-black text-gray-400 mt-0.5">{r.date}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tighter">{r.partyName}</p>
                      <p className="text-[8px] font-bold text-primary uppercase mt-0.5 tracking-widest flex items-center gap-1">
                        <FileText size={10} /> Inv: {r.originalInvoiceNo}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tight italic">{r.productName}</p>
                      <p className="text-[8px] font-medium text-gray-400 mt-1 italic line-clamp-1">{r.reason}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="text-[12px] font-black text-gray-900 dark:text-white font-mono">{r.quantity}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="text-[12px] font-black text-emerald-600 font-mono italic">₹{r.amount.toLocaleString()}</p>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <Undo2 size={48} className="mx-auto text-gray-200 mb-4" />
                      <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic">No return entries found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3.5rem] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleCreateReturn} className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic">New Return <span className="text-primary italic">Entry</span></h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Inventory Adjustment & Credit Note</p>
                  </div>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl hover:text-red-500 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Return Type</label>
                      <select 
                        required
                        value={newReturn.type}
                        onChange={(e) => setNewReturn({ ...newReturn, type: e.target.value as any })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/5 appearance-none"
                      >
                        <option value="Sale">Sale Return (to us)</option>
                        <option value="Purchase">Purchase Return (to supplier)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Return Date</label>
                        <input 
                          required
                          type="date"
                          value={newReturn.date}
                          onChange={(e) => setNewReturn({ ...newReturn, date: e.target.value })}
                          className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-primary/5"
                        />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Original Invoice #</label>
                      <input 
                        required
                        type="text"
                        placeholder="e.g., INV-1023"
                        value={newReturn.originalInvoiceNo}
                        onChange={(e) => setNewReturn({ ...newReturn, originalInvoiceNo: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-primary/5 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{newReturn.type === 'Sale' ? 'Customer Name' : 'Supplier Name'}</label>
                      <input 
                        required
                        type="text"
                        placeholder="Search party..."
                        value={newReturn.partyName}
                        onChange={(e) => setNewReturn({ ...newReturn, partyName: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Product</label>
                    <select 
                      required
                      value={newReturn.productId || ''}
                      onChange={(e) => {
                        const p = state.products.find(x => x.id === e.target.value);
                        setNewReturn({ ...newReturn, productId: e.target.value, productName: p?.name || '' });
                      }}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/5 appearance-none"
                    >
                      <option value="">Choose item...</option>
                      {state.products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Return Quantity</label>
                      <input 
                        required
                        type="number"
                        placeholder="0"
                        value={newReturn.quantity || ''}
                        onChange={(e) => setNewReturn({ ...newReturn, quantity: Number(e.target.value) })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-primary/5 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Credit Amount (Valuation)</label>
                      <input 
                        required
                        type="number"
                        placeholder="0.00"
                        value={newReturn.amount || ''}
                        onChange={(e) => setNewReturn({ ...newReturn, amount: Number(e.target.value) })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-primary/5 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason for Return</label>
                    <textarea 
                      required
                      rows={2}
                      placeholder="e.g., Expired, Damaged, Wrong Delivery..."
                      value={newReturn.reason}
                      onChange={(e) => setNewReturn({ ...newReturn, reason: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-medium outline-none focus:ring-4 focus:ring-primary/5 italic resize-none"
                    />
                  </div>
                </div>

                <div className="mt-10">
                  <button 
                    disabled={isProcessing}
                    className="w-full py-5 bg-primary text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isProcessing ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={18} />}
                    Post Return & Sync Inventory
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
