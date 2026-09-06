import React, { useState, useEffect } from 'react';
import { 
  Truck, Leaf, Plus, Search, Filter, 
  ChevronDown, ArrowUpRight, ArrowDownRight, 
  History, AlertCircle, Calendar, BarChart, X, Star, MapPin, Phone, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { FurnitureSupplier, FurnitureRawMaterial } from './types';

export const SupplierManager = () => {
  const { storeId } = useAuth();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'raw_materials' | 'pos'>('suppliers');
  const [suppliers, setSuppliers] = useState<FurnitureSupplier[]>([]);
  const [materials, setMaterials] = useState<FurnitureRawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!storeId) return;

    const subSuppliers = onSnapshot(collection(db, `messes/${storeId}/suppliers`), (snap) => {
      setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() } as FurnitureSupplier)));
    });

    const subMaterials = onSnapshot(collection(db, `messes/${storeId}/raw_materials`), (snap) => {
      setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() } as FurnitureRawMaterial)));
      setLoading(false);
    });

    return () => {
      subSuppliers();
      subMaterials();
    };
  }, [storeId]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-2 p-1.5 md:p-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: 'suppliers', label: 'Suppliers', icon: Truck },
              { id: 'raw_materials', label: 'Raw Materials', icon: Leaf },
              { id: 'pos', label: 'Purchase Orders', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 md:px-8 py-3 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                <tab.icon size={16} className="shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

         <div className="flex items-center gap-4">
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input 
                 type="text" 
                 placeholder="Search..."
                 className="pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            <button 
              className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all"
            >
              <Plus size={18} />
              Add {activeTab === 'suppliers' ? 'Supplier' : activeTab === 'raw_materials' ? 'Material' : 'PO'}
            </button>
         </div>
      </div>

      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {loading ? (
                <div className="py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Suppliers...</div>
              ) : suppliers.length === 0 ? (
                <div className="py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No suppliers registered yet</div>
              ) : suppliers.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((s) => (
                <div key={s.id} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 group hover:border-primary transition-all">
                   <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 text-center sm:text-left">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100 group-hover:bg-primary/5 transition-all shrink-0">
                         <Truck size={28} />
                      </div>
                      <div>
                         <h3 className="text-lg md:text-xl font-black text-gray-900">{s.name}</h3>
                         <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{s.category} • {s.gstin || 'No GST'}</p>
                      </div>
                   </div>
                   <div className="text-right flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0">
                      <button className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-primary transition-all active:scale-95 whitespace-nowrap">
                         View Profile
                      </button>
                   </div>
                </div>
             ))}
          </div>

           <div className="space-y-6">
              <div className="bg-gray-900 p-8 rounded-[3rem] text-white">
                 <h4 className="text-lg font-bold mb-6">Supplier Analytics</h4>
                 <div className="space-y-6">
                    <div>
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                          <span>Verified Suppliers</span>
                          <span className="text-white">{suppliers.length}</span>
                       </div>
                       <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-[65%]" />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'raw_materials' && (
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left min-w-[600px]">
               <thead>
                 <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-[2px] text-gray-400">
                   <th className="px-6 md:px-8 py-6">Material Name</th>
                   <th className="px-6 md:px-8 py-6">Current Stock</th>
                   <th className="px-6 md:px-8 py-6">Category</th>
                   <th className="px-6 md:px-8 py-6">Last Price</th>
                   <th className="px-6 md:px-8 py-6 text-right">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50 text-sm">
                  {loading ? (
                    <tr><td colSpan={5} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Inventory...</td></tr>
                  ) : materials.length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No materials registered</td></tr>
                  ) : materials.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-all">
                      <td className="px-6 md:px-8 py-6 font-bold text-gray-900">{m.name}</td>
                      <td className="px-6 md:px-8 py-6 font-medium text-gray-500">{m.currentStock} {m.unit}</td>
                      <td className="px-6 md:px-8 py-6">
                        <div className="flex items-center gap-2">
                          <BarChart size={14} className="text-primary" />
                          <span className="font-bold">{m.category}</span>
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-6 text-gray-900 font-black">₹{m.lastPurchasePrice.toLocaleString()}</td>
                      <td className="px-6 md:px-8 py-6 text-right">
                         <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${
                           m.currentStock > m.minStockLevel ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'
                         }`}>
                           {m.currentStock > m.minStockLevel ? 'Optimal' : 'Low Stock'}
                         </span>
                      </td>
                    </tr>
                  ))}
               </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};
