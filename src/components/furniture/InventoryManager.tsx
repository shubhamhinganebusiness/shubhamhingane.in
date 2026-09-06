import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Filter, Search, Edit3, Trash2, 
  Layers, ChevronDown, ChevronRight, Image as ImageIcon,
  AlertTriangle, CheckCircle2, TrendingDown, LayoutGrid, List,
  X, Save, Barcode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc, Timestamp, addDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { FurnitureProduct } from './types';

export const InventoryManager = () => {
  const { storeId } = useAuth();
  const [products, setProducts] = useState<FurnitureProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<FurnitureProduct> | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Low Stock' | 'In Stock'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Furniture', 'Electronics'];

  useEffect(() => {
    if (!storeId) return;

    const q = collection(db, `messes/${storeId}/products`);
    const unsubscribe = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as FurnitureProduct)));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'products');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [storeId]);

  const totalStock = (p: FurnitureProduct) => (p.showroomStock || 0) + (p.warehouseStock || 0);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !editingProduct) return;

    try {
      const productData = {
        ...editingProduct,
        updatedAt: Timestamp.now(),
        createdAt: editingProduct.createdAt || Timestamp.now(),
      };

      if (editingProduct.id) {
        await updateDoc(doc(db, `messes/${storeId}/products`, editingProduct.id), productData);
      } else {
        await addDoc(collection(db, `messes/${storeId}/products`), productData);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!storeId || !window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, `messes/${storeId}/products`, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'products');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isLowStock = totalStock(p) < (p.minStockLevel || 5);
    const matchesStatus = filterStatus === 'All' || 
                         (filterStatus === 'Low Stock' && isLowStock) ||
                         (filterStatus === 'In Stock' && !isLowStock);

    return matchesCategory && matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Action Bar */}
      <div className="flex flex-col xl:flex-row gap-6 items-center justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="p-2 md:p-3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-2 w-full justify-center sm:justify-start overflow-x-auto no-scrollbar">
              <span className="hidden sm:block text-[10px] font-black uppercase text-gray-400 px-2 border-r border-gray-100 mr-2 shrink-0">Filters</span>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    filterCategory === cat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <div className="w-px h-6 bg-gray-100 mx-2" />
              {['All', 'Low Stock', 'In Stock'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    filterStatus === status ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
           
           <div className="p-1 bg-white rounded-xl border border-gray-100 flex shadow-sm">
             <button 
               onClick={() => setViewMode('grid')}
               className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-primary' : 'text-gray-400'}`}
             >
               <LayoutGrid size={18} />
             </button>
             <button 
               onClick={() => setViewMode('table')}
               className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-gray-100 text-primary' : 'text-gray-400'}`}
             >
               <List size={18} />
             </button>
           </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 relative md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 text-sm font-medium"
            />
          </div>
          <button 
            onClick={() => {
              setEditingProduct({
                category: 'Furniture',
                showroomStock: 0,
                warehouseStock: 0,
                price: 0,
                costPrice: 0,
                minStockLevel: 5,
                gst: 18
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all uppercase tracking-widest text-xs"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border border-gray-100">
           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mb-4"></div>
           <p className="font-bold text-gray-500 uppercase tracking-widest text-xs">Syncing Cloud Inventory...</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={product.id}
                  className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
                >
                  <div className="absolute top-4 right-4 flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all z-10">
                    <button 
                      onClick={() => {
                        setEditingProduct(product);
                        setIsModalOpen(true);
                      }}
                      className="p-2 bg-white text-gray-600 rounded-lg shadow-lg hover:text-primary transition-all"
                    >
                      <Edit3 size={16}/>
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 bg-white text-gray-600 rounded-lg shadow-lg hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>

                  <div className="w-full h-48 bg-gray-50 rounded-2xl mb-6 flex items-center justify-center text-gray-300 relative overflow-hidden">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={48} />
                    )}
                    <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-gray-900 shadow-sm uppercase tracking-widest">
                       {product.category}
                    </span>
                  </div>

                  <h3 className="font-black text-gray-900 text-lg mb-1 leading-tight">{product.name}</h3>
                  <p className="text-gray-400 text-xs font-medium mb-6 uppercase tracking-wider">{product.variant || product.sku}</p>

                  <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                     <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Price</p>
                        <p className="text-xl font-black text-primary">₹{product.price?.toLocaleString()}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Total Stock</p>
                        <p className="text-xl font-black text-gray-900">{totalStock(product)}</p>
                     </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm">
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse min-w-[800px]">
                   <thead>
                     <tr className="bg-gray-50 border-b border-gray-100 font-black text-[10px] text-gray-400 uppercase tracking-[2px]">
                       <th className="px-4 md:px-8 py-6">Product & Category</th>
                       <th className="px-4 md:px-8 py-6">Variant/SKU</th>
                       <th className="px-4 md:px-8 py-6">Price</th>
                       <th className="px-4 md:px-8 py-6">Stock Status</th>
                       <th className="px-4 md:px-8 py-6 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 md:px-8 py-6">
                             <div className="flex items-center gap-3 md:gap-4">
                               <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 shrink-0">
                                 {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover rounded-xl" /> : <ImageIcon size={20}/>}
                               </div>
                               <div>
                                 <p className="font-bold text-gray-900 text-sm md:text-base">{p.name}</p>
                                 <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-black uppercase tracking-wider">{p.category}</span>
                               </div>
                             </div>
                          </td>
                          <td className="px-4 md:px-8 py-6 font-bold text-gray-500 text-xs">{p.variant || p.sku}</td>
                          <td className="px-4 md:px-8 py-6 font-black text-primary">₹{p.price?.toLocaleString()}</td>
                          <td className="px-4 md:px-8 py-6">
                             <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-gray-900">Sh: {p.showroomStock} | Wh: {p.warehouseStock}</span>
                                <div className="w-24 md:w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                   <div className={`h-full ${totalStock(p) < (p.minStockLevel || 5) ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, (totalStock(p) / 50) * 100)}%` }} />
                                </div>
                             </div>
                          </td>
                          <td className="px-4 md:px-8 py-6 text-right">
                             <div className="flex justify-end gap-1 md:gap-2">
                               <button 
                                 onClick={() => {
                                   setEditingProduct(p);
                                   setIsModalOpen(true);
                                 }}
                                 className="p-2 hover:bg-gray-100 text-gray-400 hover:text-primary rounded-xl transition-colors"
                               >
                                 <Edit3 size={18}/>
                               </button>
                               <button 
                                 onClick={() => handleDeleteProduct(p.id)}
                                 className="p-2 hover:bg-gray-100 text-gray-400 hover:text-red-500 rounded-xl transition-colors"
                               >
                                 <Trash2 size={18}/>
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                     {editingProduct?.id ? 'Edit Product' : 'Add New Product'}
                   </h3>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Cloud Inventory Management</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"
                >
                  <X size={24}/>
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
                    <input 
                      required
                      value={editingProduct?.name || ''}
                      onChange={e => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-gray-50 border border-transparent focus:border-primary focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold transition-all"
                      placeholder="e.g. Premium Leather Sofa"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SKU Code</label>
                    <div className="relative">
                      <Barcode size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        required
                        value={editingProduct?.sku || ''}
                        onChange={e => setEditingProduct(prev => ({ ...prev, sku: e.target.value }))}
                        className="w-full bg-gray-50 border border-transparent focus:border-primary focus:bg-white rounded-2xl pl-14 pr-6 py-4 text-sm font-bold transition-all"
                        placeholder="ELC-LP-889"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                    <select 
                      value={editingProduct?.category}
                      onChange={e => setEditingProduct(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full bg-gray-50 border border-transparent focus:border-primary focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold transition-all appearance-none"
                    >
                      <option value="Furniture">Furniture</option>
                      <option value="Electronics">Electronics</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Variant / Description</label>
                    <input 
                      value={editingProduct?.variant || ''}
                      onChange={e => setEditingProduct(prev => ({ ...prev, variant: e.target.value }))}
                      className="w-full bg-gray-50 border border-transparent focus:border-primary focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold transition-all"
                      placeholder="e.g. Tan / 3-Seater"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Showroom Price (₹)</label>
                    <input 
                      type="number"
                      required
                      value={editingProduct?.price || ''}
                      onChange={e => setEditingProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full bg-gray-50 border border-transparent focus:border-primary focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cost Price (₹)</label>
                    <input 
                      type="number"
                      value={editingProduct?.costPrice || ''}
                      onChange={e => setEditingProduct(prev => ({ ...prev, costPrice: Number(e.target.value) }))}
                      className="w-full bg-gray-50 border border-transparent focus:border-primary focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Showroom Stock</label>
                    <input 
                      type="number"
                      value={editingProduct?.showroomStock || ''}
                      onChange={e => setEditingProduct(prev => ({ ...prev, showroomStock: Number(e.target.value) }))}
                      className="w-full bg-gray-50 border border-transparent focus:border-primary focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Warehouse Stock</label>
                    <input 
                      type="number"
                      value={editingProduct?.warehouseStock || ''}
                      onChange={e => setEditingProduct(prev => ({ ...prev, warehouseStock: Number(e.target.value) }))}
                      className="w-full bg-gray-50 border border-transparent focus:border-primary focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold transition-all"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Images (URLs)</label>
                       <button 
                         type="button" 
                         onClick={() => setEditingProduct(prev => ({ ...prev, images: [...(prev?.images || []), ''] }))}
                         className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline"
                       >
                         Add Another Image
                       </button>
                    </div>
                    <div className="space-y-3">
                       {(editingProduct?.images || ['']).map((img, idx) => (
                         <div key={idx} className="flex gap-2">
                            <input 
                              value={img}
                              onChange={e => {
                                const newImages = [...(editingProduct?.images || [''])];
                                newImages[idx] = e.target.value;
                                setEditingProduct(prev => ({ ...prev, images: newImages }));
                              }}
                              className="flex-1 bg-gray-50 border border-transparent focus:border-primary focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold transition-all"
                              placeholder="https://example.com/image.jpg"
                            />
                            {idx > 0 && (
                              <button 
                                onClick={() => {
                                  const newImages = (editingProduct?.images || []).filter((_, i) => i !== idx);
                                  setEditingProduct(prev => ({ ...prev, images: newImages }));
                                }}
                                className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all"
                                type="button"
                              >
                                <X size={18} />
                              </button>
                            )}
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Discard Changes
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-5 bg-primary text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    Finalize Product
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
