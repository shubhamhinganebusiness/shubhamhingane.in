import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingDown, Plus, Trash2, Edit2, 
  X, Search, Filter, PieChart, Calendar,
  ArrowDownRight, CreditCard, Wallet
} from 'lucide-react';

interface Props {
  tenantId?: string;
}

export const MessExpenseTracker: React.FC<Props> = ({ tenantId }) => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Groceries',
    amount: 0,
    description: '',
    paymentMethod: 'Cash'
  });

  const categories = ['Groceries', 'Vegetables', 'Gas/Fuel', 'Rent', 'Electricity', 'Staff Salary', 'Maintenance', 'Other'];

  useEffect(() => {
    if (tenantId) fetchExpenses();
  }, [tenantId]);

  const fetchExpenses = async () => {
    try {
      const q = query(collection(db, `messes/${tenantId}/expenses`), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = `EXP_${Date.now()}`;
      await setDoc(doc(db, `messes/${tenantId}/expenses`, id), { ...formData, id, tenantId });
      setShowModal(false);
      fetchExpenses();
    } catch (err) { console.error(err); }
  };

  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
           <div className="relative z-10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Total Monthly Spend</p>
              <h3 className="text-4xl font-black tracking-tight">₹{totalExpense}</h3>
              <div className="mt-6 flex items-center gap-2 text-red-400">
                 <TrendingDown size={14} />
                 <span className="text-[10px] font-black uppercase tracking-widest">12% higher than last month</span>
              </div>
           </div>
           <div className="absolute top-[-20%] right-[-10%] opacity-10 rotate-12">
              <PieChart size={200} strokeWidth={1} />
           </div>
        </div>

        <div className="md:col-span-3 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
           <div className="flex justify-between items-center mb-8 pb-8 border-b border-gray-50">
              <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                 <ArrowDownRight className="text-primary" />
                 Expense Ledger
              </h3>
              <button 
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-105 transition-all"
              >
                 Add New Expense
              </button>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                   <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="py-4 px-2">Date</th>
                      <th className="py-4 px-2">Category</th>
                      <th className="py-4 px-2">Description</th>
                      <th className="py-4 px-2">Method</th>
                      <th className="py-4 px-2 text-right">Amount</th>
                   </tr>
                </thead>
                <tbody>
                   {expenses.map(exp => (
                      <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                         <td className="py-6 px-2 whitespace-nowrap text-xs font-bold text-gray-600">{exp.date}</td>
                         <td className="py-6 px-2">
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-[10px] font-black uppercase tracking-widest">{exp.category}</span>
                         </td>
                         <td className="py-6 px-2 text-sm font-medium text-gray-900">{exp.description}</td>
                         <td className="py-6 px-2">
                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase">
                               {exp.paymentMethod === 'Cash' ? <Wallet size={12} /> : <CreditCard size={12} />}
                               {exp.paymentMethod}
                            </div>
                         </td>
                         <td className="py-6 px-2 text-right font-black text-red-500 text-lg">₹{exp.amount}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white rounded-[3.5rem] shadow-2xl p-10"
            >
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black text-gray-900">Record Expense</h3>
                 <button onClick={() => setShowModal(false)} className="p-3 bg-gray-100 rounded-full"><X size={24} /></button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                       <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount (₹)</label>
                       <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                       <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold">
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Method</label>
                       <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold">
                          <option value="Cash">Cash</option>
                          <option value="Online">Online / Transfer</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold min-h-[100px]" placeholder="What was this for?" />
                 </div>
                 <button type="submit" className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:bg-black transition-all">Record Transaction</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
