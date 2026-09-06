import React, { useState, useEffect } from 'react';
import { 
  Warehouse, Truck, ArrowRight, History, Package, 
  MapPin, AlertCircle, CheckCircle2, ChevronRight, Plus, Search,
  Box, ArrowLeftRight, X, ArrowDown, ArrowUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, increment, Timestamp, addDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { FurnitureProduct } from './types';

export const WarehouseControl = () => {
  const { storeId } = useAuth();
  const [activeTab, setActiveTab] = useState<'stock' | 'transfers' | 'history'>('stock');
  const [products, setProducts] = useState<FurnitureProduct[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState<FurnitureProduct | null>(null);
  const [transferQty, setTransferQty] = useState(1);
  const [direction, setDirection] = useState<'wh_to_sr' | 'sr_to_wh'>('wh_to_sr');

  useEffect(() => {
    if (!storeId) return;

    const subProd = onSnapshot(collection(db, `messes/${storeId}/products`), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as FurnitureProduct)));
      setLoading(false);
    });

    const subTransfers = onSnapshot(collection(db, `messes/${storeId}/transfers`), (snap) => {
      setTransfers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      subProd();
      subTransfers();
    };
  }, [storeId]);

  const handleTransfer = async () => {
    if (!storeId || !selectedProduct) return;
    
    if (direction === 'wh_to_sr' && selectedProduct.warehouseStock < transferQty) {
      alert('Not enough stock in warehouse!');
      return;
    }
    if (direction === 'sr_to_wh' && selectedProduct.showroomStock < transferQty) {
      alert('Not enough stock in showroom!');
      return;
    }

    try {
      const productRef = doc(db, `messes/${storeId}/products`, selectedProduct.id);
      
      if (direction === 'wh_to_sr') {
        await updateDoc(productRef, {
          warehouseStock: increment(-transferQty),
          showroomStock: increment(transferQty),
          updatedAt: Timestamp.now()
        });
      } else {
        await updateDoc(productRef, {
          warehouseStock: increment(transferQty),
          showroomStock: increment(-transferQty),
          updatedAt: Timestamp.now()
        });
      }

      // Log transfer
      await addDoc(collection(db, `messes/${storeId}/transfers`), {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: transferQty,
        direction,
        timestamp: Timestamp.now()
      });

      setShowTransferModal(false);
      setSelectedProduct(null);
      setTransferQty(1);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'transfers');
    }
  };

  const totalWhValue = products.reduce((acc, p) => acc + ((p.warehouseStock || 0) * (p.costPrice || 0)), 0);
  const lowStockCount = products.filter(p => (p.warehouseStock + p.showroomStock) < (p.minStockLevel || 5)).length;

  const stats = [
    { label: 'Total Inventory Value', value: `₹${(totalWhValue / 100000).toFixed(1)}L`, icon: Warehouse, color: 'bg-blue-500' },
    { label: 'Warehouse Units', value: products.reduce((acc, p) => acc + (p.warehouseStock || 0), 0), icon: Box, color: 'bg-orange-500' },
    { label: 'Low Stock Alerts', value: lowStockCount, icon: AlertCircle, color: 'bg-red-500' },
    { label: 'Active Products', value: products.length, icon: Package, color: 'bg-green-500' },
  ];

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6">
             <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/5`}>
                <stat.icon size={24} />
             </div>
             <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-2 p-1.5 md:p-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar max-w-full">
            {(['stock', 'transfers', 'history'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 md:px-8 py-3 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

         <button 
           onClick={() => setShowTransferModal(true)}
           className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:shadow-gray-900/40 transition-all"
         >
           <Truck size={18} />
           Initiate Transfer
         </button>
      </div>

      {/* Main View Area */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden p-2">
         {activeTab === 'stock' && (
           <div className="p-6">
              <div className="flex items-center gap-4 mb-8 bg-gray-50 p-2 rounded-2xl w-full max-w-md">
                <Search size={18} className="text-gray-400 ml-4" />
                <input 
                  type="text" 
                  placeholder="Filter by product or category..." 
                  className="bg-transparent border-none focus:ring-0 text-sm w-full py-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                 {filteredProducts.map((item) => (
                   <div key={item.id} className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl border border-gray-50 hover:bg-gray-50/50 transition-all group">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-300">
                        {item.images?.[0] ? (
                          <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <Package size={24} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{item.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.sku} • {item.category}</p>
                      </div>

                      <div className="flex items-center gap-12 text-center">
                         <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Warehouse</p>
                            <span className="text-xl font-black text-gray-900">{item.warehouseStock}</span>
                         </div>
                         <ArrowRight className="text-gray-200" size={24} />
                         <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Showroom</p>
                            <span className="text-xl font-black text-primary">{item.showroomStock}</span>
                         </div>
                      </div>

                      <button 
                        onClick={() => {
                          setSelectedProduct(item);
                          setShowTransferModal(true);
                        }}
                        className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-xs hover:border-primary hover:text-primary transition-all"
                      >
                        Stock Move
                      </button>
                   </div>
                 ))}
              </div>
           </div>
         )}
         
         {activeTab === 'transfers' && (
           <div className="p-8">
              <div className="space-y-4">
                 {products.filter(p => (p.warehouseStock || 0) < (p.minStockLevel || 5)).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-6 bg-red-50 rounded-3xl border border-red-100">
                       <div className="flex items-center gap-4">
                          <AlertCircle className="text-red-500" size={24} />
                          <div>
                             <p className="font-bold text-red-900">{product.name} is Low on Warehouse Stock</p>
                             <p className="text-[10px] text-red-400 font-bold uppercase">Current: {product.warehouseStock} | Min: {product.minStockLevel || 5}</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => {
                            setSelectedProduct(product);
                            setDirection('sr_to_wh');
                            setShowTransferModal(true);
                         }}
                         className="px-6 py-2 bg-white text-red-500 border border-red-200 rounded-xl font-bold text-xs"
                       >
                         Replenish
                       </button>
                    </div>
                 ))}
                 {products.filter(p => (p.warehouseStock || 0) < (p.minStockLevel || 5)).length === 0 && (
                    <div className="text-center py-20 opacity-40">
                       <CheckCircle2 size={64} className="mx-auto mb-4 text-green-500" />
                       <p className="font-bold text-xl uppercase tracking-widest">Stock Healthy</p>
                       <p className="text-sm">No critical replenishments needed</p>
                    </div>
                 )}
              </div>
           </div>
         )}

         {activeTab === 'history' && (
           <div className="p-6">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-[2px] text-gray-400">
                       <th className="px-6 py-4">Date & Time</th>
                       <th className="px-6 py-4">Product</th>
                       <th className="px-6 py-4">Quantity</th>
                       <th className="px-6 py-4">Route</th>
                       <th className="px-6 py-4 text-right">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {[...transfers].sort((a,b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0)).map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50/50 transition-all text-xs font-medium">
                          <td className="px-6 py-4">
                             <div className="flex flex-col">
                                <span className="font-bold text-gray-900">{t.timestamp?.toDate().toLocaleDateString()}</span>
                                <span className="text-[10px] text-gray-400">{t.timestamp?.toDate().toLocaleTimeString()}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">{t.productName}</td>
                          <td className="px-6 py-4 font-black">{t.quantity}</td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                                {t.direction === 'wh_to_sr' ? 'WH' : 'SR'}
                                <ArrowRight size={10} />
                                {t.direction === 'wh_to_sr' ? 'SR' : 'WH'}
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className="px-3 py-1 bg-green-100 text-green-500 rounded-full text-[9px] font-black uppercase tracking-widest">Completed</span>
                          </td>
                        </tr>
                      ))}
                      {transfers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No transfer history found</td>
                        </tr>
                      )}
                   </tbody>
                 </table>
              </div>
           </div>
         )}
      </div>

      {/* Transfer Modal */}
      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900">Initiate Stock Move</h2>
                <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div>
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-4">Transfer Direction</label>
                   <div className="flex gap-4">
                      <button 
                        onClick={() => setDirection('wh_to_sr')}
                        className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                          direction === 'wh_to_sr' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400'
                        }`}
                      >
                         <ArrowDown size={20} />
                         <span className="text-[10px] font-bold">WH → SR</span>
                      </button>
                      <button 
                         onClick={() => setDirection('sr_to_wh')}
                         className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                           direction === 'sr_to_wh' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400'
                         }`}
                      >
                         <ArrowUp size={20} />
                         <span className="text-[10px] font-bold">SR → WH</span>
                      </button>
                   </div>
                </div>

                {!selectedProduct && (
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Search Product</label>
                    <div className="relative">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                       <input 
                         type="text" 
                         className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm"
                         placeholder="Type name or SKU..."
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                       />
                       {searchQuery && !selectedProduct && (
                         <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-xl mt-2 shadow-xl z-10 max-h-48 overflow-y-auto">
                            {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                              <button 
                                key={p.id}
                                onClick={() => setSelectedProduct(p)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-medium border-b border-gray-50 last:border-0"
                              >
                                {p.name} ({p.sku})
                              </button>
                            ))}
                         </div>
                       )}
                    </div>
                  </div>
                )}

                {selectedProduct && (
                   <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                      <div>
                         <p className="font-bold text-gray-900 text-sm">{selectedProduct.name}</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase">{selectedProduct.sku}</p>
                      </div>
                      <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-red-500">
                         <X size={16} />
                      </button>
                   </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                   <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Quantity</label>
                      <input 
                        type="number"
                        min="1"
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-lg font-black"
                        value={transferQty}
                        onChange={(e) => setTransferQty(parseInt(e.target.value))}
                      />
                   </div>
                   <div className="flex flex-col justify-end">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Available</p>
                      <p className="text-lg font-black text-gray-900">
                        {selectedProduct ? (direction === 'wh_to_sr' ? selectedProduct.warehouseStock : selectedProduct.showroomStock) : 0}
                      </p>
                   </div>
                </div>

                <button 
                  disabled={!selectedProduct || transferQty <= 0}
                  onClick={handleTransfer}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-50"
                >
                  Confirm Transfer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transfer Pulse Animation Simulation */}
      {activeTab === 'transfers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="p-8 bg-gray-900 rounded-[3rem] text-white">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                 Transit Monitor
              </h3>
              <div className="space-y-6">
                 {[1, 2].map(i => (
                    <div key={i} className="space-y-2">
                       <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                          <span className="text-gray-400">Truck ID: MH43-9921</span>
                          <span className="text-green-500">82% Est. 12 mins</span>
                       </div>
                       <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: '82%' }}
                             transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                             className="h-full bg-green-500" 
                          />
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
