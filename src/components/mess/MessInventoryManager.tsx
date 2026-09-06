import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, Truck, Plus, Trash2, Edit2, 
  X, Search, Filter, ShoppingBag, AlertCircle
} from 'lucide-react';

interface Props {
  tenantId?: string;
}

export const MessInventoryManager: React.FC<Props> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'vendors'>('stock');
  const [items, setItems] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    itemName: '',
    category: 'Groceries',
    currentStock: 0,
    unit: 'kg',
    minimumLevel: 5,
    lastPurchasePrice: 0
  });

  const [vendorData, setVendorData] = useState({
    name: '',
    category: 'General',
    mobile: '',
    address: '',
    balance: 0
  });

  useEffect(() => {
    if (tenantId) {
      fetchItems();
      fetchVendors();
    }
  }, [tenantId]);

  const fetchItems = async () => {
    try {
      const snap = await getDocs(query(collection(db, `messes/${tenantId}/inventory`)));
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchVendors = async () => {
    try {
      const snap = await getDocs(query(collection(db, `messes/${tenantId}/vendors`)));
      setVendors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = editingItem?.id || `INV_${Date.now()}`;
      await setDoc(doc(db, `messes/${tenantId}/inventory`, id), { ...formData, id, tenantId });
      setShowModal(false);
      fetchItems();
    } catch (err) { console.error(err); }
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = editingItem?.id || `VND_${Date.now()}`;
      await setDoc(doc(db, `messes/${tenantId}/vendors`, id), { ...vendorData, id, tenantId });
      setShowModal(false);
      fetchVendors();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-4 p-2 bg-white rounded-3xl border border-gray-100 shadow-sm w-fit">
        <button 
          onClick={() => setActiveTab('stock')}
          className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'stock' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-900'}`}
        >
          Raw Stock
        </button>
        <button 
          onClick={() => setActiveTab('vendors')}
          className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'vendors' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-900'}`}
        >
          Vendors
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              {activeTab === 'stock' ? <Package className="text-primary" /> : <Truck className="text-primary" />}
              {activeTab === 'stock' ? 'Stock Management' : 'Our Suppliers'}
            </h2>
            <p className="text-gray-500 font-medium">Keep your mess running with zero shortages.</p>
          </div>
          <button 
            onClick={() => {setEditingItem(null); setShowModal(true)}}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-xl shadow-primary/20 hover:bg-black transition-all"
          >
            <Plus size={18} />
            Add {activeTab === 'stock' ? 'Item' : 'Vendor'}
          </button>
        </div>

        {activeTab === 'stock' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-gray-50 border border-gray-100 rounded-[2rem] p-8 group hover:bg-white hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.currentStock <= item.minimumLevel ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500'}`}>
                    <ShoppingBag size={20} />
                  </div>
                  {item.currentStock <= item.minimumLevel && (
                    <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[8px] font-black uppercase tracking-tighter animate-pulse">Low Stock</span>
                  )}
                </div>
                <h4 className="font-black text-gray-900 tracking-tight text-lg">{item.itemName}</h4>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">{item.category}</p>
                
                <div className="mt-8 space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Stock</p>
                      <p className="text-2xl font-black text-gray-900">{item.currentStock} <span className="text-sm font-medium text-gray-400 uppercase">{item.unit}</span></p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Min. Req</p>
                       <p className="font-bold text-gray-600">{item.minimumLevel}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {vendors.map(vendor => (
                <div key={vendor.id} className="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-8 flex items-center gap-6">
                   <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-gray-100">
                      <Truck size={28} />
                   </div>
                   <div className="flex-1">
                      <h4 className="font-black text-gray-900 tracking-tight">{vendor.name}</h4>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{vendor.category} Vendor</p>
                      <div className="mt-2 flex items-center gap-4">
                         <span className="text-xs font-bold text-gray-500">{vendor.mobile}</span>
                         <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                         <span className="text-xs font-black text-red-500">Balance: ₹{vendor.balance}</span>
                      </div>
                   </div>
                </div>
             ))}
          </div>
        )}
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
                 <h3 className="text-2xl font-black text-gray-900">Add {activeTab === 'stock' ? 'Inventory Item' : 'Supplier'}</h3>
                 <button onClick={() => setShowModal(false)} className="p-3 bg-gray-100 rounded-full"><X size={24} /></button>
              </div>

              {activeTab === 'stock' ? (
                <form onSubmit={handleSaveItem} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Item Name</label>
                      <input type="text" required value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit</label>
                        <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold">
                           <option value="kg">KG</option>
                           <option value="ltr">Liter</option>
                           <option value="pcs">Pieces</option>
                           <option value="pkt">Packet</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold">
                           <option value="Groceries">Groceries</option>
                           <option value="Vegetables">Vegetables</option>
                           <option value="Dairy">Dairy</option>
                           <option value="Cleaning">Cleaning</option>
                        </select>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Stock</label>
                        <input type="number" required value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: Number(e.target.value)})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Min Lev.</label>
                        <input type="number" required value={formData.minimumLevel} onChange={e => setFormData({...formData, minimumLevel: Number(e.target.value)})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                      </div>
                   </div>
                   <button type="submit" className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20">Save Item</button>
                </form>
              ) : (
                <form onSubmit={handleSaveVendor} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vendor Name</label>
                      <input type="text" required value={vendorData.name} onChange={e => setVendorData({...vendorData, name: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</label>
                      <input type="tel" required value={vendorData.mobile} onChange={e => setVendorData({...vendorData, mobile: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                   </div>
                   <button type="submit" className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20">Add Supplier</button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
