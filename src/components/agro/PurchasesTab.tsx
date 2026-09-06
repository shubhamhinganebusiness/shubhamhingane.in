import React, { useState } from 'react';
import { 
  Plus, Search, Truck, ShoppingCart, Calendar, 
  ChevronRight, Trash2, Save, X, Printer, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../lib/firebase';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { collection, doc, addDoc, updateDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { AgroState, AgroPurchase, AgroSupplier, AgroProduct } from './types';
import { handleFirestoreError, OperationType } from '../../lib/firebase';

export const PurchasesTab: React.FC<{ state: AgroState; shopId: string | null }> = ({ state, shopId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  
  const [purchaseItems, setPurchaseItems] = useState<{
    productId: string;
    productName: string;
    batchNumber: string;
    qty: number;
    costPrice: number;
    expDate: string;
    packageSize: string;
  }[]>([]);

  const [newItem, setNewItem] = useState({
    productId: '',
    batchNumber: '',
    qty: 1,
    costPrice: 0,
    expDate: '',
    packageSize: ''
  });

  const handleAddPurchase = async () => {
    if (!auth.currentUser || !shopId || !selectedSupplierId || purchaseItems.length === 0) return;

    const supplier = state.suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier) return;

    const shopRef = doc(db, 'agro_shops', shopId);

    try {
      const totalAmount = purchaseItems.reduce((sum, item) => sum + (item.qty * item.costPrice), 0);
      
      const purchaseData: Partial<AgroPurchase> = {
        supplierId: selectedSupplierId,
        supplierName: supplier.name,
        items: purchaseItems,
        totalAmount,
        date: new Date().toLocaleDateString('en-IN'),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(shopRef, 'purchases'), purchaseData);

      // Important: For each item in purchase, add a new batch or update stock
      for (const item of purchaseItems) {
        // Add new batch for this product
        await addDoc(collection(shopRef, 'batches'), {
          productId: item.productId,
          batchNumber: item.batchNumber,
          packageSize: item.packageSize,
          quantity: item.qty,
          mrp: item.costPrice * 1.2, // Default markup 20% for MRP
          sellingPrice: item.costPrice * 1.1, // Default 10% profit
          mfgDate: '', // User would fill later or add in purchase
          expDate: item.expDate,
          createdAt: new Date().toISOString()
        });

        // Update product overall stock
        const product = state.products.find(p => p.id === item.productId);
        if (product) {
          await updateDoc(doc(shopRef, 'products', item.productId), {
            stock: (product.stock || 0) + item.qty
          });
        }
      }

      setIsModalOpen(false);
      setPurchaseItems([]);
      setSelectedSupplierId('');
      alert('Purchase recorded and inventory updated!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `agro_shops/${shopId}/purchases`);
    }
  };

  const addPurchaseItem = () => {
    if (!newItem.productId || !newItem.batchNumber || newItem.qty <= 0) return;
    
    const product = state.products.find(p => p.id === newItem.productId);
    if (!product) return;

    setPurchaseItems([...purchaseItems, {
      ...newItem,
      productName: product.name
    }]);

    setNewItem({
      productId: '',
      batchNumber: '',
      qty: 1,
      costPrice: 0,
      expDate: '',
      packageSize: ''
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Purchases</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Record new stock arrivals</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 hover:bg-primary transition-all"
        >
          <Plus size={18} />
          New Purchase
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Purchase Summary Cards */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Purchases</p>
           <p className="text-2xl font-black text-gray-900 dark:text-white">₹{state.purchases.reduce((s, p) => s + p.totalAmount, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Entries This Month</p>
           <p className="text-2xl font-black text-gray-900 dark:text-white">{state.purchases.length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {state.loading ? (
          <div className="p-20">
            <LoadingSpinner label="Loading Purchase Book..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Supplier</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Items Count</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {state.purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <td className="px-8 py-5 text-sm font-bold text-gray-900 dark:text-white">{purchase.date}</td>
                  <td className="px-8 py-5 text-sm font-bold text-gray-600 uppercase">{purchase.supplierName}</td>
                  <td className="px-8 py-5 text-sm">{purchase.items.length} Products</td>
                  <td className="px-8 py-5 font-black text-primary">₹{purchase.totalAmount.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-xs font-black text-blue-500 hover:underline uppercase tracking-widest">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {state.purchases.length === 0 && (
            <div className="py-20 text-center">
              <Truck size={48} className="mx-auto text-gray-100 mb-4" />
              <p className="text-gray-400 font-bold">No purchase records found.</p>
            </div>
          )}
        </div>
        )}
      </div>

      {/* New Purchase Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
            <motion.div 
               initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
               className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-[3rem] p-10 shadow-2xl my-8 h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">New Stock <span className="text-primary tracking-tighter">Arrival</span></h3>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl"><X size={24}/></button>
              </div>

              <div className="space-y-8">
                {/* Supplier Select */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Select Supplier</label>
                  <select 
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-4 text-sm font-bold shadow-sm"
                  >
                    <option value="">Choose Supplier...</option>
                    {state.suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.contact})</option>)}
                  </select>
                </div>

                {/* Single Item Add Form */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Add Item Detail</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="col-span-2">
                       <select 
                        value={newItem.productId}
                        onChange={(e) => setNewItem({...newItem, productId: e.target.value})}
                        className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-4 text-sm font-bold"
                      >
                        <option value="">Select Product from Inventory...</option>
                        {state.products.map(p => <option key={p.id} value={p.id}>{p.name} (Current: {p.stock})</option>)}
                      </select>
                    </div>
                    <div>
                      <input type="text" placeholder="Batch No" value={newItem.batchNumber} onChange={(e) => setNewItem({...newItem, batchNumber: e.target.value})} className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-4 text-sm font-bold" />
                    </div>
                    <div>
                      <input type="text" placeholder="Pkg Size (e.g. 5kg)" value={newItem.packageSize} onChange={(e) => setNewItem({...newItem, packageSize: e.target.value})} className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-4 text-sm font-bold" />
                    </div>
                    <div>
                      <input type="number" placeholder="Qty" value={newItem.qty} onChange={(e) => setNewItem({...newItem, qty: Number(e.target.value)})} className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-4 text-sm font-bold" />
                    </div>
                    <div>
                      <input type="number" placeholder="Cost Price" value={newItem.costPrice} onChange={(e) => setNewItem({...newItem, costPrice: Number(e.target.value)})} className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-4 text-sm font-bold" />
                    </div>
                    <div>
                      <input type="date" placeholder="Expiry" value={newItem.expDate} onChange={(e) => setNewItem({...newItem, expDate: e.target.value})} className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-4 text-sm font-bold" />
                    </div>
                  </div>
                  <button onClick={addPurchaseItem} className="mt-6 w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">Add To List</button>
                </div>

                {/* Items List */}
                {purchaseItems.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Entry Summary</p>
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                       <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                          <tr>
                            <th className="px-6 py-4 text-[8px] font-black uppercase">Product</th>
                            <th className="px-6 py-4 text-[8px] font-black uppercase">Batch</th>
                            <th className="px-6 py-4 text-[8px] font-black uppercase text-center">Qty</th>
                            <th className="px-6 py-4 text-[8px] font-black uppercase">Price</th>
                            <th className="px-6 py-4 text-[8px] font-black uppercase">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                          {purchaseItems.map((item, idx) => (
                            <tr key={idx} className="text-xs">
                              <td className="px-6 py-3 font-bold">{item.productName}</td>
                              <td className="px-6 py-3">{item.batchNumber}</td>
                              <td className="px-6 py-3 text-center font-black">{item.qty}</td>
                              <td className="px-6 py-3 font-bold">₹{item.costPrice}</td>
                              <td className="px-6 py-3 font-black text-primary">₹{item.qty * item.costPrice}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-gray-800/50 font-black">
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-right uppercase tracking-widest text-[10px]">Grand Total</td>
                            <td className="px-6 py-4 text-primary text-lg">₹{purchaseItems.reduce((s, i) => s + (i.qty * i.costPrice), 0).toLocaleString()}</td>
                          </tr>
                        </tfoot>
                       </table>
                    </div>
                    <button onClick={handleAddPurchase} className="w-full py-5 bg-black text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-primary transition-all">Record Final Purchase</button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
