import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, Package, Settings, X, Calendar, 
  Trash2, AlertTriangle, ChevronRight, Layers,
  ShieldAlert, Clock, AlertCircle, Download, Sparkles, Barcode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../lib/firebase';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { 
  collection, doc, setDoc, addDoc, updateDoc, 
  deleteDoc, query, where, getDocs 
} from 'firebase/firestore';
import { AgroState, AgroProduct, AgroBatch, AgroCategory } from './types';
import { handleFirestoreError, OperationType } from '../../lib/firebase';
import { Html5Qrcode } from 'html5-qrcode';

export const InventoryTab: React.FC<{ state: AgroState; shopId: string | null }> = ({ state, shopId }) => {
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AgroProduct | null>(null);
  const [editingBatch, setEditingBatch] = useState<AgroBatch | null>(null);
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<AgroProduct | null>(null);
  
  // Scanning Feature States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<AgroProduct | null>(null);
  const [scannedBatchId, setScannedBatchId] = useState<string>('');
  const [adjustmentQty, setAdjustmentQty] = useState<number>(1);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [isUpdatingScanStock, setIsUpdatingScanStock] = useState(false);

  // Sub-tabs state
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'expiry_report'>('inventory');

  // Multi-unit Alert counters
  const lowStockCount = useMemo(() => {
    return state.products.filter(p => p.stock <= (p.reorderLevel ?? state.settings?.lowStockThreshold ?? 10)).length;
  }, [state.products, state.settings]);

  const nearExpiryCount = useMemo(() => {
    return state.batches.filter(b => {
      if (!b.expDate) return false;
      const today = new Date();
      const exp = new Date(b.expDate);
      const diffTime = exp.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= (state.settings?.expiryWarningDays || 30) && diffDays > 0;
    }).length;
  }, [state.batches, state.settings]);

  // 60-Day expiring batches
  const expiring60DaysBatches = useMemo(() => {
    return state.batches
      .filter(b => {
        if (!b.expDate) return false;
        const today = new Date();
        const exp = new Date(b.expDate);
        const diffTime = exp.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 60 && diffDays > 0;
      })
      .sort((a, b) => new Date(a.expDate).getTime() - new Date(b.expDate).getTime());
  }, [state.batches]);

  // Real-time camera scanner setup
  useEffect(() => {
    let html5Qrcode: Html5Qrcode | null = null;
    
    if (isScannerOpen) {
      const timer = setTimeout(async () => {
        try {
          html5Qrcode = new Html5Qrcode('qr-reader-container');
          await html5Qrcode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 },
            },
            (decodedText) => {
              handleSkuFound(decodedText);
            },
            (errorMessage) => {
              // Ignore failure frames noise
            }
          );
        } catch (err) {
          console.error("Camera startup error:", err);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (html5Qrcode && html5Qrcode.isScanning) {
          html5Qrcode.stop().catch(e => console.error("Error stopping scanner:", e));
        }
      };
    }
  }, [isScannerOpen]);

  const handleSkuFound = (decodedText: string) => {
    const matched = state.products.find(p => p.sku === decodedText || p.id === decodedText);
    if (matched) {
      setScannedProduct(matched);
      const matchedBatches = state.batches.filter(b => b.productId === matched.id);
      if (matchedBatches.length > 0) {
        setScannedBatchId(matchedBatches[0].id);
      } else {
        setScannedBatchId('new');
      }
      setIsScannerOpen(false);
    } else {
      alert(`Scanned code "${decodedText}" does not scan match any SKU or product ID in your inventory. Add an SKU to a product first.`);
    }
  };

  const handleUpdateScannedStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !shopId || !scannedProduct) return;
    setIsUpdatingScanStock(true);

    const shopRef = doc(db, 'agro_shops', shopId);

    try {
      if (scannedBatchId === 'new') {
        const batchNo = `QSCAN-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const newBatchItem = {
          productId: scannedProduct.id,
          batchNumber: batchNo,
          packageSize: scannedProduct.unit,
          quantity: Math.max(0, adjustmentQty),
          mrp: scannedProduct.price,
          sellingPrice: scannedProduct.price,
          mfgDate: new Date().toISOString().split('T')[0],
          expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };
        await addDoc(collection(shopRef, 'batches'), newBatchItem);
      } else {
        const batchRef = doc(shopRef, 'batches', scannedBatchId);
        const batchSnap = state.batches.find(b => b.id === scannedBatchId);
        if (batchSnap) {
          const currentQty = batchSnap.quantity || 0;
          const finalQty = adjustmentType === 'add' ? currentQty + adjustmentQty : Math.max(0, currentQty - adjustmentQty);
          await updateDoc(batchRef, { quantity: finalQty });
        }
      }

      const batchesSnap = await getDocs(query(collection(shopRef, 'batches'), where('productId', '==', scannedProduct.id)));
      const totalStock = batchesSnap.docs.reduce((sum, d) => sum + (d.data().quantity || 0), 0);
      
      await updateDoc(doc(shopRef, 'products', scannedProduct.id), {
        stock: totalStock
      });

      setScannedProduct(null);
      setAdjustmentQty(1);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `agro_shops/${shopId}/batches`);
    } finally {
      setIsUpdatingScanStock(false);
    }
  };

  const downloadExpiryReportCsv = () => {
    const headers = ['Product Name', 'Batch Number', 'Package Size', 'Current Quantity', 'Price', 'Expiry Date', 'Days to Expiration'];
    const rows = expiring60DaysBatches.map(b => {
      const product = state.products.find(p => p.id === b.productId);
      const diffTime = new Date(b.expDate).getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return [
        `"${product?.name || 'Unknown product'}"`,
        `"${b.batchNumber}"`,
        `"${b.packageSize || ''}"`,
        b.quantity,
        b.sellingPrice,
        `"${b.expDate}"`,
        diffDays
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Expiry_65_Days_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState('All');
  const [expiryStatusFilter, setExpiryStatusFilter] = useState('All');
  const [isSmartSearching, setIsSmartSearching] = useState(false);
  const [smartResults, setSmartResults] = useState<{id: string, reason: string}[]>([]);
  const [showSmartResults, setShowSmartResults] = useState(false);

  const handleSmartSearch = async () => {
    if (!searchTerm || searchTerm.length < 3) return;
    setIsSmartSearching(true);
    setShowSmartResults(true);
    try {
      const response = await fetch('/api/ai/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchTerm,
          products: state.products.map(p => ({
            id: p.id,
            name: p.name,
            manufacturer: p.manufacturer,
            category: p.category,
            description: p.description
          }))
        })
      });
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSmartResults(data.results || []);
    } catch (error) {
      console.error("Smart Search failed:", error);
      alert("AI Search encountered an error. Please try standard search.");
    } finally {
      setIsSmartSearching(false);
    }
  };

  const clearSmartSearch = () => {
    setShowSmartResults(false);
    setSmartResults([]);
  };

  const [newProduct, setNewProduct] = useState<Partial<AgroProduct>>({
    category: 'Seed',
    unit: 'Kg',
    price: 0,
    stock: 0,
    description: '',
    usageInstructions: '',
    reorderLevel: 10
  });

  const [newBatch, setNewBatch] = useState<Partial<AgroBatch>>({
    batchNumber: '',
    packageSize: '',
    quantity: 0,
    mrp: 0,
    sellingPrice: 0,
    mfgDate: '',
    expDate: ''
  });

  const filteredProducts = state.products
    .filter(p => categoryFilter === 'All' || p.category === categoryFilter)
    .filter(p => {
      if (stockStatusFilter === 'All') return true;
      const lowStockThresh = p.reorderLevel ?? state.settings?.lowStockThreshold ?? 10;
      if (stockStatusFilter === 'Low Stock') return p.stock > 0 && p.stock <= lowStockThresh;
      if (stockStatusFilter === 'Out of Stock') return p.stock <= 0;
      if (stockStatusFilter === 'In Stock') return p.stock > lowStockThresh;
      return true;
    })
    .filter(p => {
      if (expiryStatusFilter === 'All') return true;
      const productBatches = state.batches.filter(b => b.productId === p.id);
      if (expiryStatusFilter === 'Expired') return productBatches.some(b => isExpired(b.expDate));
      if (expiryStatusFilter === 'Near Expiry') return productBatches.some(b => isNearExpiry(b.expDate));
      return true;
    })
    .filter(p => {
      const search = searchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(search) || 
        p.category.toLowerCase().includes(search) ||
        p.manufacturer?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
      );
    });

  const displayedProducts = useMemo(() => {
    if (showSmartResults && smartResults.length > 0) {
      return smartResults.map(res => {
        const product = state.products.find(p => p.id === res.id);
        return product ? { ...product, aiReason: res.reason } : null;
      }).filter(Boolean) as (AgroProduct & { aiReason?: string })[];
    }
    return filteredProducts;
  }, [showSmartResults, smartResults, filteredProducts, state.products]);

  const exportInventory = () => {
    const headers = ['Product Name', 'Category', 'Manufacturer', 'Stock', 'Unit', 'Base Price'];
    const rows = filteredProducts.map(p => [
      p.name,
      p.category,
      p.manufacturer || '',
      p.stock,
      p.unit,
      p.price
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Inventory_Export_${new Date().toLocaleDateString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !shopId) return;

    if (!newProduct.name?.trim()) {
      alert('Product name is required.');
      return;
    }

    const shopRef = doc(db, 'agro_shops', shopId);
    
    try {
      if (editingProduct) {
        await updateDoc(doc(shopRef, 'products', editingProduct.id), newProduct);
      } else {
        await addDoc(collection(shopRef, 'products'), {
          ...newProduct,
          stock: 0, // Initial stock is 0, added via batches
          createdAt: new Date().toISOString()
        });
      }
      
      setIsModalOpen(false);
      setEditingProduct(null);
      setNewProduct({ category: 'Seed', unit: 'Kg', price: 0, stock: 0 });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `agro_shops/${shopId}/products`);
    }
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !shopId || !selectedProductForBatch) return;

    const shopRef = doc(db, 'agro_shops', shopId);
    
    try {
      if (editingBatch) {
        // Update batch
        await updateDoc(doc(shopRef, 'batches', editingBatch.id), newBatch);
      } else {
        // Add new batch
        await addDoc(collection(shopRef, 'batches'), {
          ...newBatch,
          productId: selectedProductForBatch.id,
          createdAt: new Date().toISOString()
        });
      }

      // Recalculate total product stock
      const batchesSnap = await getDocs(query(collection(shopRef, 'batches'), where('productId', '==', selectedProductForBatch.id)));
      const totalStock = batchesSnap.docs.reduce((sum, d) => sum + (d.data().quantity || 0), 0);
      
      await updateDoc(doc(shopRef, 'products', selectedProductForBatch.id), {
        stock: totalStock
      });
      
      setIsBatchModalOpen(false);
      setEditingBatch(null);
      setNewBatch({});
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `agro_shops/${shopId}/batches`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!auth.currentUser || !shopId || !window.confirm('Are you sure you want to delete this product? All batches will also be affected.')) return;
    const shopRef = doc(db, 'agro_shops', shopId);
    try {
      await deleteDoc(doc(shopRef, 'products', id));
      // Optionally delete batches too
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `agro_shops/${shopId}/products/${id}`);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight text-primary uppercase italic">Inventory & <span className="text-gray-900 dark:text-white">Batches</span></h2>
            {(lowStockCount > 0 || nearExpiryCount > 0) && (
              <span id="inventory-notification-badge" className="flex h-5 items-center gap-1.5 rounded-full bg-red-500 px-2.5 text-[10px] font-black uppercase text-white animate-pulse shadow-md shadow-red-500/20 w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                {lowStockCount + nearExpiryCount} Alerts
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Manage products, packages and expiries</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="px-6 py-3 bg-gray-950 border-2 border-transparent text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-sm"
          >
            <Barcode size={18} />
            Scan SKU
          </button>
          <button 
            onClick={exportInventory}
            className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button 
            onClick={() => {
              setEditingProduct(null);
              setNewProduct({ category: 'Seed', unit: 'Kg', price: 0, stock: 0, reorderLevel: 10, sku: '' });
              setIsModalOpen(true);
            }}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-black transition-all"
          >
            <Plus size={18} />
            New Product
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`px-6 py-3 font-black text-xs uppercase tracking-widest border-b-2 transition-all ${
            activeSubTab === 'inventory' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          Active Inventory
        </button>
        <button
          onClick={() => setActiveSubTab('expiry_report')}
          className={`px-6 py-3 font-black text-xs uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'expiry_report' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <Clock size={14} />
          Expiry Alerts (60 Days Report)
        </button>
      </div>

      {activeSubTab === 'inventory' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl pl-12 pr-32 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none shadow-sm dark:text-white font-bold"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {showSmartResults && (
                  <button 
                    onClick={clearSmartSearch}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Clear AI Results"
                  >
                    <X size={14} />
                  </button>
                )}
                <button 
                  onClick={handleSmartSearch}
                  disabled={isSmartSearching || searchTerm.length < 3}
                  className="px-3 py-2 bg-black text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSmartSearching ? <div className="w-2.5 h-2.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Sparkles size={12} />}
                  AI
                </button>
              </div>
            </div>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none text-gray-500 font-bold"
            >
              <option value="All">All Categories</option>
              {Object.values(AgroCategory).map(cat => <option key={cat} value={cat}>{cat}s</option>)}
            </select>
            <select 
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none text-gray-500 font-bold"
            >
              <option value="All">All Stock Levels</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            <select 
              value={expiryStatusFilter}
              onChange={(e) => setExpiryStatusFilter(e.target.value)}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none text-gray-500 font-bold"
            >
              <option value="All">All Expiry Status</option>
              <option value="Expired">Expired Items</option>
              <option value="Near Expiry">Near Expiry</option>
            </select>
          </div>

          {state.loading ? (
            <LoadingSpinner label="Fetching Live Inventory..." />
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {displayedProducts.map((product) => {
              const productBatches = state.batches.filter(b => b.productId === product.id);
              const hasExpired = productBatches.some(b => isExpired(b.expDate));
              const hasNearExpiry = productBatches.some(b => isNearExpiry(b.expDate));
              const lowStockThresh = product.reorderLevel ?? state.settings?.lowStockThreshold ?? 10;
              const isLowStock = product.stock > 0 && product.stock <= lowStockThresh;

              return (
                <motion.div 
                  layout
                  key={`inventory-prod-${product.id}`} 
                  className={`bg-white dark:bg-gray-900 rounded-[2.5rem] border shadow-sm overflow-hidden group ${hasExpired ? 'border-red-200 dark:border-red-900/50 shadow-red-50' : 'border-gray-100 dark:border-gray-800'}`}
                >
                  <div className="p-8 flex flex-col lg:flex-row lg:items-center gap-8">
                    <div className="flex-1 flex items-center gap-6">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <Package size={32} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-black text-gray-900 dark:text-white">{product.name}</h3>
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md text-[8px] font-black text-gray-400 uppercase tracking-widest">{product.category}</span>
                          {product.sku && (
                            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md text-[8px] font-black uppercase tracking-widest">SKU: {product.sku}</span>
                          )}
                        </div>
                        {product.aiReason && (
                          <div className="mb-3 p-3 bg-primary/5 border border-primary/10 rounded-xl max-w-lg">
                            <p className="text-[8px] font-black text-primary uppercase tracking-tighter flex items-center gap-1">
                              <Sparkles size={10} /> Smart Match Info
                            </p>
                            <p className="text-[9px] font-bold text-gray-600 dark:text-gray-400 mt-1 italic leading-tight">{product.aiReason}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs font-bold">
                           <p className={`flex items-center gap-1 ${isLowStock ? 'text-red-500' : 'text-gray-400'}`}>
                            {isLowStock && <AlertTriangle size={12} />}
                            Stock: {product.stock} {product.unit}
                          </p>
                          <p className="text-gray-400">Price: ₹{product.price}</p>
                          <div className="flex gap-1">
                            {hasExpired && <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[8px] font-black uppercase">Expired Batches</span>}
                            {hasNearExpiry && <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-[8px] font-black uppercase">Near Expiry</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          setSelectedProductForBatch(product);
                          setNewBatch({});
                          setIsBatchModalOpen(true);
                        }}
                        className="p-3 bg-primary/5 hover:bg-primary hover:text-white text-primary rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                      >
                        <Plus size={16} /> Add Batch
                      </button>
                      <button 
                        onClick={() => {
                          setEditingProduct(product);
                          setNewProduct(product);
                          setIsModalOpen(true);
                        }}
                        className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-xl hover:bg-gray-100 transition-all"
                      >
                        <Settings size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Batches Table */}
                  {productBatches.length > 0 && (
                    <div className="border-t border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-black/20">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr>
                              <th className="px-8 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Batch No</th>
                              <th className="px-8 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Pkg Size</th>
                              <th className="px-8 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Qty</th>
                              <th className="px-8 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Sale Price</th>
                              <th className="px-8 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Expiry</th>
                              <th className="px-8 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {productBatches.map(batch => {
                              const expired = isExpired(batch.expDate);
                              const nearExp = isNearExpiry(batch.expDate);
                              
                              return (
                                <tr key={batch.id} className={`${expired ? 'bg-red-50/50 dark:bg-red-900/10' : nearExp ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}>
                                  <td className="px-8 py-3 text-xs font-bold text-gray-700 dark:text-gray-300">
                                    {batch.batchNumber}
                                    {expired && <AlertCircle size={12} className="inline ml-2 text-red-500" />}
                                  </td>
                                  <td className="px-8 py-3 text-xs text-gray-500">{batch.packageSize}</td>
                                  <td className="px-8 py-3 text-xs font-black text-gray-900 dark:text-white">{batch.quantity}</td>
                                  <td className="px-8 py-3 text-xs font-black text-gray-900 dark:text-white">₹{batch.sellingPrice}</td>
                                  <td className={`px-8 py-3 text-xs font-bold ${expired ? 'text-red-500' : nearExp ? 'text-orange-500' : 'text-gray-500'}`}>
                                    {batch.expDate || 'N/A'}
                                  </td>
                                  <td className="px-8 py-3 text-right">
                                    <button 
                                      onClick={() => {
                                        setEditingBatch(batch);
                                        setNewBatch(batch);
                                        setSelectedProductForBatch(product);
                                        setIsBatchModalOpen(true);
                                      }}
                                      className="text-primary hover:underline text-[10px] font-black uppercase"
                                    >
                                      Edit
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-50 dark:border-gray-800 pb-6">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase flex items-center gap-2">
                <Clock className="text-primary" size={20} />
                Products Batches Near Expiring (Next 60 Days)
              </h3>
              <p className="text-gray-500 text-xs mt-1">This report dynamically tracks all packages and batches near their expiration sorted by nearest date.</p>
            </div>
            <button 
              onClick={downloadExpiryReportCsv}
              disabled={expiring60DaysBatches.length === 0}
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-md shadow-primary/10 disabled:opacity-40 disabled:hover:bg-primary whitespace-nowrap"
            >
              <Download size={14} /> Download Expiry CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-3 text-[10px] font-black uppercase text-gray-400 tracking-wider">Product Name</th>
                  <th className="pb-3 text-[10px] font-black uppercase text-gray-400 tracking-wider">Category</th>
                  <th className="pb-3 text-[10px] font-black uppercase text-gray-400 tracking-wider">Batch No</th>
                  <th className="pb-3 text-[10px] font-black uppercase text-gray-400 tracking-wider">Pkg Size</th>
                  <th className="pb-3 text-[10px] font-black uppercase text-gray-400 tracking-wider">Stock Qty</th>
                  <th className="pb-3 text-[10px] font-black uppercase text-gray-400 tracking-wider">Sale Price</th>
                  <th className="pb-3 text-[10px] font-black uppercase text-gray-400 tracking-wider">Expiry Date</th>
                  <th className="pb-3 text-[10px] font-black uppercase text-gray-400 tracking-wider text-right">Remaining Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {expiring60DaysBatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">No packages are expiring in the next 60 days. Awesome! No risk detected.</td>
                  </tr>
                ) : (
                  expiring60DaysBatches.map(b => {
                    const product = state.products.find(p => p.id === b.productId);
                    const diffTime = new Date(b.expDate).getTime() - new Date().getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/20">
                        <td className="py-4 pr-4">
                          <p className="font-extrabold text-xs text-gray-900 dark:text-white uppercase">{product?.name || 'Unknown Product'}</p>
                          <p className="text-[10px] text-gray-400">{product?.manufacturer || 'Unknown Manufacturer'}</p>
                        </td>
                        <td className="py-4 font-bold text-xs text-gray-500 uppercase">{product?.category || ''}</td>
                        <td className="py-4 font-bold text-xs text-gray-700 dark:text-gray-300 font-mono">{b.batchNumber}</td>
                        <td className="py-4 text-xs text-gray-500">{b.packageSize}</td>
                        <td className="py-4 font-black text-xs text-gray-900 dark:text-white">{b.quantity}</td>
                        <td className="py-4 font-black text-xs text-gray-900 dark:text-white font-mono">₹{b.sellingPrice}</td>
                        <td className="py-4 font-black text-xs text-red-500">{b.expDate}</td>
                        <td className="py-4 text-right">
                          <span className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 rounded-full text-[9px] font-black">
                            {diffDays} DAYS LEFT
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3rem] p-10 shadow-2xl my-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  {editingProduct ? 'Edit' : 'New'} Product
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
                  <input 
                    required type="text"
                    value={newProduct.name || ''}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Manufacturer / Company</label>
                  <input 
                    type="text"
                    value={newProduct.manufacturer || ''}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, manufacturer: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="E.g. Bayer, Syngenta, Rasi Seeds"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                  <select 
                    value={newProduct.category}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    {Object.values(AgroCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unit</label>
                  <select 
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, unit: e.target.value as any }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="Kg">Kg</option>
                    <option value="Ltr">Ltr</option>
                    <option value="Packet">Packet</option>
                    <option value="Unit">Unit</option>
                    <option value="Bag">Bag</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Base Price (₹)</label>
                  <input 
                    required type="number"
                    value={newProduct.price || ''}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reorder Level (Low Stock Alarm)</label>
                  <input 
                    type="number"
                    value={newProduct.reorderLevel || ''}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, reorderLevel: Number(e.target.value) }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea 
                    value={newProduct.description || ''}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none h-24"
                  ></textarea>
                </div>

                <div className="md:col-span-2 flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold text-gray-500">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20">Save Product</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Batch Modal */}
      <AnimatePresence>
        {isBatchModalOpen && selectedProductForBatch && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
               className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 shadow-2xl my-8"
            >
              <div className="mb-8">
                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                  {editingBatch ? 'Edit' : 'Add New'} Batch
                </h3>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{selectedProductForBatch.name}</p>
              </div>

              <form onSubmit={handleSaveBatch} className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Batch Number</label>
                  <input 
                    required type="text"
                    value={newBatch.batchNumber || ''}
                    onChange={(e) => setNewBatch(prev => ({ ...prev, batchNumber: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-gray-100 dark:ring-gray-800 focus:ring-primary"
                    placeholder="E.g. BTCH-2024"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Package Size</label>
                  <input 
                    required type="text"
                    value={newBatch.packageSize || ''}
                    onChange={(e) => setNewBatch(prev => ({ ...prev, packageSize: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none"
                    placeholder="E.g. 1kg, 500ml"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantity</label>
                  <input 
                    required type="number"
                    value={newBatch.quantity || ''}
                    onChange={(e) => setNewBatch(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">MRP (₹)</label>
                  <input 
                    required type="number"
                    value={newBatch.mrp || ''}
                    onChange={(e) => setNewBatch(prev => ({ ...prev, mrp: Number(e.target.value) }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sale Price (₹)</label>
                  <input 
                    required type="number"
                    value={newBatch.sellingPrice || ''}
                    onChange={(e) => setNewBatch(prev => ({ ...prev, sellingPrice: Number(e.target.value) }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mfg Date</label>
                  <input 
                    type="date"
                    value={newBatch.mfgDate || ''}
                    onChange={(e) => setNewBatch(prev => ({ ...prev, mfgDate: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Exp Date</label>
                  <input 
                    required type="date"
                    value={newBatch.expDate || ''}
                    onChange={(e) => setNewBatch(prev => ({ ...prev, expDate: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none"
                  />
                </div>

                <div className="col-span-2 flex gap-4 mt-4">
                  <button type="button" onClick={() => setIsBatchModalOpen(false)} className="flex-1 py-4 bg-gray-100 rounded-xl font-bold text-gray-500">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-black text-white rounded-xl font-bold">Save Batch</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
