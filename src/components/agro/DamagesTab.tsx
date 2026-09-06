import React, { useState } from 'react';
import { 
  ShieldAlert, Plus, Search, Trash2, 
  Settings, Package, X, Calendar, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { AgroState, AgroDamage } from './types';
import { handleFirestoreError, OperationType } from '../../lib/firebase';
import { LoadingSpinner } from './ui/LoadingSpinner';

export const DamagesTab: React.FC<{ state: AgroState; shopId: string | null }> = ({ state, shopId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adjType, setAdjType] = useState<'Add' | 'Remove'>('Remove');
  const [newDamage, setNewDamage] = useState<Partial<AgroDamage>>({
    productId: '',
    batchId: '',
    quantity: 0,
    reason: 'Expired'
  });

  const handleSaveDamage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !shopId || !newDamage.productId || !newDamage.batchId) return;

    const shopRef = doc(db, 'agro_shops', shopId);
    const product = state.products.find(p => p.id === newDamage.productId);
    const batch = state.batches.find(b => b.id === newDamage.batchId);
    
    if (!product || !batch) return;

    const adjustmentQty = adjType === 'Remove' ? -Math.abs(newDamage.quantity || 0) : Math.abs(newDamage.quantity || 0);

    try {
      await addDoc(collection(shopRef, 'damages'), {
        ...newDamage,
        quantity: Math.abs(newDamage.quantity || 0),
        type: adjType,
        productName: product.name,
        batchNumber: batch.batchNumber,
        date: new Date().toLocaleDateString('en-IN'),
        createdAt: new Date().toISOString()
      });

      // Update batch quantity
      await updateDoc(doc(shopRef, 'batches', batch.id), {
        quantity: (batch.quantity || 0) + adjustmentQty
      });

      // Update product overall stock
      await updateDoc(doc(shopRef, 'products', product.id), {
        stock: (product.stock || 0) + adjustmentQty
      });

      setIsModalOpen(false);
      setNewDamage({ productId: '', batchId: '', quantity: 0, reason: 'Expired' });
      setAdjType('Remove');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `agro_shops/${shopId}/damages`);
    }
  };

  const productBatches = state.batches.filter(b => b.productId === newDamage.productId);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Damage & Adjust</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Record waste or handle stock corrections</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 flex items-center gap-2 hover:bg-black transition-all"
        >
          <Plus size={18} />
          Record Damage
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {state.loading ? (
          <div className="bg-white dark:bg-gray-900 py-20 text-center rounded-[3rem] border border-gray-100 dark:border-gray-800">
             <LoadingSpinner label="Auditing Damages..." />
          </div>
        ) : state.damages.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 py-20 text-center rounded-[3rem] border border-gray-100 dark:border-gray-800">
            <ShieldAlert size={64} className="mx-auto text-gray-100 mb-6" />
            <p className="text-gray-400 font-bold italic text-lg tracking-tight">No damage records found. All stock looks good!</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Batch</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty Adjust</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {state.damages.map((dmg) => (
                    <tr key={dmg.id} className="hover:bg-red-50/20 dark:hover:bg-red-900/10">
                      <td className="px-8 py-5 text-sm font-bold text-gray-500">{dmg.date}</td>
                      <td className="px-8 py-5">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${dmg.type === 'Add' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {dmg.type || 'Remove'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm font-black text-gray-900 dark:text-white uppercase">{dmg.productName}</td>
                      <td className="px-8 py-5 text-xs text-gray-400 font-bold">{dmg.batchNumber}</td>
                      <td className={`px-8 py-5 text-sm font-black ${dmg.type === 'Add' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {dmg.type === 'Add' ? '+' : '-'}{dmg.quantity}
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-gray-500 italic underline decoration-red-200">{dmg.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
               initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
               className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">Record Stock Damage</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24}/></button>
              </div>

              <form onSubmit={handleSaveDamage} className="space-y-6">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                  <button type="button" onClick={() => setAdjType('Remove')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${adjType === 'Remove' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400'}`}>Remove Stock</button>
                  <button type="button" onClick={() => setAdjType('Add')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${adjType === 'Add' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400'}`}>Add Stock</button>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product</label>
                  <select 
                    required
                    value={newDamage.productId} 
                    onChange={e => setNewDamage({...newDamage, productId: e.target.value, batchId: ''})}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-6 py-4 text-sm font-bold mt-1"
                  >
                    <option value="">Select Product...</option>
                    {state.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Batch</label>
                  <select 
                    required
                    value={newDamage.batchId} 
                    onChange={e => setNewDamage({...newDamage, batchId: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-6 py-4 text-sm font-bold mt-1"
                  >
                    <option value="">Select Batch...</option>
                    {productBatches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.batchNumber} (Stock: {b.quantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Qty Damaged</label>
                    <input required type="number" value={newDamage.quantity || ''} onChange={e => setNewDamage({...newDamage, quantity: Number(e.target.value)})} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-4 text-sm font-bold mt-1" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason</label>
                    <select value={newDamage.reason} onChange={e => setNewDamage({...newDamage, reason: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-4 text-sm font-bold mt-1">
                      <option value="Expired">Expired</option>
                      <option value="Damaged in transit">Broken/Spilled</option>
                      <option value="Manual Correction">Correction</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-red-600/20 mt-4">Confirm Damage Entry</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
