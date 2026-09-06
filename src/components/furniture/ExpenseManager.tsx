import React, { useState, useEffect } from 'react';
import { 
  Receipt, Plus, Search, Trash2, Calendar, 
  Filter, IndianRupee, PieChart, TrendingDown,
  ChevronRight, X, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, Timestamp, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { FurnitureExpense } from './types';

export const ExpenseManager = () => {
  const { storeId } = useAuth();
  const [expenses, setExpenses] = useState<FurnitureExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Expense State
  const [newExpense, setNewExpense] = useState({
    category: 'Rent' as FurnitureExpense['category'],
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!storeId) return;

    const q = query(
      collection(db, `messes/${storeId}/expenses`),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() } as FurnitureExpense)));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'expenses');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [storeId]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;

    try {
      await addDoc(collection(db, `messes/${storeId}/expenses`), {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        date: Timestamp.fromDate(new Date(newExpense.date)),
        storeId
      });
      setShowAddModal(false);
      setNewExpense({
        category: 'Rent',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'expenses');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!storeId || !window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await deleteDoc(doc(db, `messes/${storeId}/expenses`, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'expenses');
    }
  };

  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const categories = ['Rent', 'Electricity', 'Staff', 'Marketing', 'Maintenance', 'Other'];

  const filteredExpenses = expenses.filter(exp => 
    exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 text-red-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <TrendingDown size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Total Expenses</p>
              <h3 className="text-xl md:text-2xl font-black text-gray-900">₹{totalExpenses.toLocaleString()}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-white transition-all hover:shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 text-white rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <PieChart size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-0.5">Total Entries</p>
              <h3 className="text-xl md:text-2xl font-black">{expenses.length}</h3>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="sm:col-span-2 lg:col-span-1 bg-primary p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-white flex flex-row lg:flex-col items-center justify-center gap-3 hover:shadow-xl hover:shadow-primary/20 transition-all group active:scale-95"
        >
          <Plus size={24} className="md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
          <span className="font-black uppercase tracking-widest text-[10px] md:text-xs">Record New Expense</span>
        </button>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h2 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-3">
            <Receipt className="text-primary shrink-0" />
            Expense Registry
          </h2>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-[2px] text-gray-400">
                <th className="px-8 py-6">Date</th>
                <th className="px-8 py-6">Category</th>
                <th className="px-8 py-6">Description</th>
                <th className="px-8 py-6">Amount</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Expenses...</td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No records found</td>
                </tr>
              ) : filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50/50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                        <Calendar size={18} />
                      </div>
                      <span className="font-bold text-gray-900">{exp.date.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm text-gray-500 font-medium">
                    {exp.description}
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-lg font-black text-gray-900">₹{exp.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-2xl font-black text-gray-900">New Expense Entry</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="p-8 space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Category</label>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewExpense(prev => ({ ...prev, category: cat as any }))}
                        className={`py-3 px-4 rounded-xl text-xs font-bold border-2 transition-all ${
                          newExpense.category === cat 
                            ? 'border-primary bg-primary/5 text-primary' 
                            : 'border-gray-100 text-gray-400 hover:border-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Amount (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        required
                        type="number"
                        placeholder="0.00"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl font-black text-lg focus:ring-2 focus:ring-primary/20"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px) font-black uppercase text-gray-400 tracking-widest block mb-2">Date</label>
                    <input 
                      required
                      type="date"
                      className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-primary/20"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Description / Notes</label>
                  <textarea 
                    required
                    placeholder="What was this for?"
                    rows={3}
                    className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl font-medium text-sm focus:ring-2 focus:ring-primary/20 resize-none"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-primary text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
                >
                  Confirm Entry
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
