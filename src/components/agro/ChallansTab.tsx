import React, { useState } from 'react';
import { 
  FileText, Plus, Search, Trash2, 
  Printer, X, Package, User, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../lib/firebase';
import { collection, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { AgroState, AgroChallan } from './types';
import { handleFirestoreError, OperationType } from '../../lib/firebase';
import { LoadingSpinner } from './ui/LoadingSpinner';

export const ChallansTab: React.FC<{ state: AgroState; shopId: string | null }> = ({ state, shopId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChallan, setNewChallan] = useState<Partial<AgroChallan>>({
    challanNo: `CH-${Date.now().toString().slice(-6)}`,
    partyId: '',
    items: []
  });

  const [tempItem, setTempItem] = useState({ productId: '', quantity: 1 });

  const handleCreateChallan = async () => {
    if (!auth.currentUser || !shopId || !newChallan.partyId || newChallan.items!.length === 0) return;
    
    const party = [...state.customers, ...state.suppliers as any].find(p => p.id === newChallan.partyId);
    if (!party) return;

    try {
      await addDoc(collection(db, 'agro_shops', shopId, 'challans'), {
        ...newChallan,
        partyName: party.name,
        date: new Date().toLocaleDateString('en-IN'),
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewChallan({ challanNo: `CH-${Date.now().toString().slice(-6)}`, partyId: '', items: [] });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `agro_shops/${shopId}/challans`);
    }
  };

  const addItemToChallan = () => {
    if (!tempItem.productId || tempItem.quantity <= 0) return;
    const product = state.products.find(p => p.id === tempItem.productId);
    if (!product) return;

    setNewChallan(prev => ({
      ...prev,
      items: [...(prev.items || []), { productId: product.id, name: product.name, quantity: tempItem.quantity }]
    }));
    setTempItem({ productId: '', quantity: 1 });
  };

  return (
    <div className="space-y-8 pb-20">
       <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Manual Challan</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Generate Delivery or Receipt memos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 hover:bg-primary transition-all"
        >
          <Plus size={18} />
          Create Challan
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {state.loading ? (
          <div className="py-32 text-center">
            <LoadingSpinner label="Auditing Challans..." />
          </div>
        ) : state.challans.length === 0 ? (
          <div className="py-32 text-center">
            <FileText size={64} className="mx-auto text-gray-100 mb-6" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No challans generated yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Challan No</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Party Name</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Items</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {state.challans.map((challan) => (
                  <tr key={challan.id} className="hover:bg-gray-50/30">
                    <td className="px-8 py-5 text-sm font-bold text-gray-500">{challan.date}</td>
                    <td className="px-8 py-5 text-sm font-black text-primary uppercase">{challan.challanNo}</td>
                    <td className="px-8 py-5 text-sm font-bold text-gray-700 dark:text-gray-300">{challan.partyName}</td>
                    <td className="px-8 py-5 text-xs text-gray-500 italic">{challan.items.length} items listed</td>
                    <td className="px-8 py-5 text-right">
                       <button className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-primary hover:text-white transition-all"><Printer size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
               className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-[3rem] p-10 shadow-2xl h-[85vh] overflow-y-auto"
            >
               <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Generate <span className="text-primary italic">Challan</span></h3>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={24}/></button>
               </div>

               <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Challan No</label>
                    <input type="text" value={newChallan.challanNo} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold mt-1 text-primary" readOnly />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Party (Customer or Supplier)</label>
                    <select 
                      value={newChallan.partyId} 
                      onChange={e => setNewChallan({...newChallan, partyId: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold mt-1"
                    >
                      <option value="">Select Party...</option>
                      <optgroup label="Customers">
                        {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </optgroup>
                      <optgroup label="Suppliers">
                        {state.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </optgroup>
                    </select>
                 </div>

                 <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Add Items</p>
                    <div className="flex gap-2">
                       <select 
                        value={tempItem.productId} 
                        onChange={e => setTempItem({...tempItem, productId: e.target.value})}
                        className="flex-1 bg-white dark:bg-gray-900 border-none rounded-xl px-3 py-3 text-xs font-bold"
                      >
                         <option value="">Select Product...</option>
                         {state.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input type="number" value={tempItem.quantity} onChange={e => setTempItem({...tempItem, quantity: Number(e.target.value)})} className="w-20 bg-white dark:bg-gray-900 border-none rounded-xl px-3 py-3 text-xs font-bold" placeholder="Qty" />
                      <button onClick={addItemToChallan} className="bg-primary text-white p-3 rounded-xl"><Plus size={18}/></button>
                    </div>
                 </div>

                 <div className="space-y-2">
                   {newChallan.items?.map((item, i) => (
                     <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-50 dark:border-gray-800 p-4 rounded-xl shadow-sm">
                       <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">{item.name}</p>
                       <p className="text-xs font-black text-primary">QTY: {item.quantity}</p>
                     </div>
                   ))}
                 </div>

                 <button onClick={handleCreateChallan} className="w-full py-5 bg-black text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl mt-4">Save & Print Challan</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
