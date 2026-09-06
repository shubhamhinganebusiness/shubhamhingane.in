import React, { useState } from 'react';
import { 
  Plus, Search, Package, Settings, X, Calendar, 
  Trash2, AlertTriangle, Clock, AlertCircle, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../lib/firebase';
import { 
  collection, doc, setDoc, addDoc, updateDoc, 
  deleteDoc, query, where, getDocs 
} from 'firebase/firestore';
import { AgroState, AgroProduct, AgroBatch } from './types';
import { handleFirestoreError, OperationType } from '../../lib/firebase';

export const BatchesTab: React.FC<{ state: AgroState; shopId: string | null }> = ({ state, shopId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<AgroBatch | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('All');

  const [newBatch, setNewBatch] = useState<Partial<AgroBatch>>({
    batchNumber: '',
    packageSize: '',
    quantity: 0,
    mrp: 0,
    sellingPrice: 0,
    mfgDate: '',
    expDate: ''
  });

  const isExpired = (expDate: string) => {
    if (!expDate) return false;
    return new Date(expDate) < new Date();
  };

  const isNearExpiry = (expDate: string) => {
    if (!expDate) return false;
    const warningDays = state.settings?.expiryWarningDays || 30;
    const today = new Date();
    const exp = new Date(expDate);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= warningDays && diffDays > 0;
  };

  const filteredBatches = state.batches.filter(batch => {
    const product = state.products.find(p => p.id === batch.productId);
    const matchesSearch = (product?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (expiryFilter === 'Expired') return matchesSearch && isExpired(batch.expDate);
    if (expiryFilter === 'Near Expiry') return matchesSearch && isNearExpiry(batch.expDate);
    if (expiryFilter === 'Safe') return matchesSearch && !isExpired(batch.expDate) && !isNearExpiry(batch.expDate);
    
    return matchesSearch;
  });

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !shopId || (!editingBatch && !selectedProductId)) return;

    const shopRef = doc(db, 'agro_shops', shopId);
    const pId = editingBatch ? editingBatch.productId : selectedProductId;
    
    try {
      if (editingBatch) {
        await updateDoc(doc(shopRef, 'batches', editingBatch.id), newBatch);
      } else {
        await addDoc(collection(shopRef, 'batches'), {
          ...newBatch,
          productId: pId,
          createdAt: new Date().toISOString()
        });
      }

      // Recalculate product stock
      const batchesSnap = await getDocs(query(collection(shopRef, 'batches'), where('productId', '==', pId)));
      const totalStock = batchesSnap.docs.reduce((sum, d) => sum + (d.data().quantity || 0), 0);
      
      await updateDoc(doc(shopRef, 'products', pId), {
        stock: totalStock
      });
      
      setIsModalOpen(false);
      setEditingBatch(null);
      setNewBatch({});
      setSelectedProductId('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `agro_shops/${shopId}/batches`);
    }
  };

  const handleDeleteBatch = async (batch: AgroBatch) => {
    if (!auth.currentUser || !shopId || !window.confirm('Are you sure you want to delete this batch?')) return;
    const shopRef = doc(db, 'agro_shops', shopId);
    try {
      await deleteDoc(doc(shopRef, 'batches', batch.id));
      
      // Recalculate product stock
      const batchesSnap = await getDocs(query(collection(shopRef, 'batches'), where('productId', '==', batch.productId)));
      const totalStock = batchesSnap.docs.reduce((sum, d) => sum + (d.data().quantity || 0), 0);
      
      await updateDoc(doc(shopRef, 'products', batch.productId), {
        stock: totalStock
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `agro_shops/${shopId}/batches/${batch.id}`);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Global Batch Management</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Manage all product packages and tracking codes</p>
        </div>
        <button 
          onClick={() => {
            setEditingBatch(null);
            setNewBatch({});
            setSelectedProductId('');
            setIsModalOpen(true);
          }}
          className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-black transition-all"
        >
          <Plus size={18} />
          Create New Batch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by product name or batch number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none shadow-sm dark:text-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select 
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value)}
            className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none shadow-sm text-gray-500 font-bold"
          >
            <option value="All">All Expiry Status</option>
            <option value="Expired">Expired Items</option>
            <option value="Near Expiry">Nearing Expiry (30 days)</option>
            <option value="Safe">Safe Stock</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Batch No</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pkg Size</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">In Stock</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pricing (Sale/MRP)</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Expiry</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredBatches.map((batch) => {
                const product = state.products.find(p => p.id === batch.productId);
                const expired = isExpired(batch.expDate);
                const nearExp = isNearExpiry(batch.expDate);
                
                return (
                  <tr key={`batch-tab-row-${batch.id}`} className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 ${expired ? 'bg-red-50/30' : nearExp ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{product?.name || 'Unknown'}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{product?.category}</p>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-gray-600 dark:text-gray-400">{batch.batchNumber}</td>
                    <td className="px-8 py-5 text-xs text-gray-500">{batch.packageSize}</td>
                    <td className="px-8 py-5 text-center">
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-black tracking-tighter">
                        {batch.quantity}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-emerald-600">₹{batch.sellingPrice}</p>
                      <p className="text-[10px] font-bold text-gray-400 line-through">MRP: ₹{batch.mrp}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold ${expired ? 'text-red-500' : nearExp ? 'text-orange-500' : 'text-gray-500'}`}>
                          {batch.expDate || 'N/A'}
                        </span>
                        {expired && <span className="text-[8px] font-black uppercase text-red-500">EXPIRED</span>}
                        {nearExp && <span className="text-[8px] font-black uppercase text-orange-500">NEAR EXPIRY</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right space-x-2">
                       <button 
                        onClick={() => {
                          setEditingBatch(batch);
                          setNewBatch(batch);
                          setSelectedProductId(batch.productId);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Settings size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteBatch(batch)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
               className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 shadow-2xl my-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  {editingBatch ? 'Update' : 'Create'} Batch
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24}/></button>
              </div>

              <form onSubmit={handleSaveBatch} className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product</label>
                  <select 
                    disabled={!!editingBatch}
                    required
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none"
                  >
                    <option value="">Select Product...</option>
                    {state.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Batch Number</label>
                  <input required type="text" value={newBatch.batchNumber || ''} onChange={e => setNewBatch({...newBatch, batchNumber: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Package Size</label>
                  <input required type="text" value={newBatch.packageSize || ''} onChange={e => setNewBatch({...newBatch, packageSize: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Stock Quantity</label>
                  <input required type="number" value={newBatch.quantity || ''} onChange={e => setNewBatch({...newBatch, quantity: Number(e.target.value)})} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">MRP (₹)</label>
                  <input required type="number" value={newBatch.mrp || ''} onChange={e => setNewBatch({...newBatch, mrp: Number(e.target.value)})} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sale Price (₹)</label>
                  <input required type="number" value={newBatch.sellingPrice || ''} onChange={e => setNewBatch({...newBatch, sellingPrice: Number(e.target.value)})} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mfg Date</label>
                  <input type="date" value={newBatch.mfgDate || ''} onChange={e => setNewBatch({...newBatch, mfgDate: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Expiry Date</label>
                  <input required type="date" value={newBatch.expDate || ''} onChange={e => setNewBatch({...newBatch, expDate: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold" />
                </div>

                <div className="col-span-2 pt-4">
                  <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20">Save Batch Information</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
