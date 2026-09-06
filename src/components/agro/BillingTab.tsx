import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, Receipt, Save, X, Trash2, 
  UserPlus, Calculator, Printer, Settings,
  CheckCircle2, AlertCircle, ShoppingCart, Layers,
  Phone, MapPin, Hash, FileText, User, CreditCard, Sparkles
} from 'lucide-react';

const toWords = (num: number) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: any) => {
    if ((n = n.toString()).length > 9) return 'Overflow';
    const n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_array) return '';
    let str = '';
    str += (Number(n_array[1]) !== 0) ? (a[Number(n_array[1])] || b[Number(n_array[1][0])] + ' ' + a[Number(n_array[1][1])]) + 'Crore ' : '';
    str += (Number(n_array[2]) !== 0) ? (a[Number(n_array[2])] || b[Number(n_array[2][0])] + ' ' + a[Number(n_array[2][1])]) + 'Lakh ' : '';
    str += (Number(n_array[3]) !== 0) ? (a[Number(n_array[3])] || b[Number(n_array[3][0])] + ' ' + a[Number(n_array[3][1])]) + 'Thousand ' : '';
    str += (Number(n_array[4]) !== 0) ? (a[Number(n_array[4])] || b[Number(n_array[4][0])] + ' ' + a[Number(n_array[4][1])]) + 'Hundred ' : '';
    str += (Number(n_array[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n_array[5])] || b[Number(n_array[5][0])] + ' ' + a[Number(n_array[5][1])]) : '';
    return str.trim() + ' Only';
  };
  return inWords(Math.floor(num));
};
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../lib/firebase';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { AgroState, BillItem, AgroBill, AgroCustomer, AgroProduct } from './types';
import { handleFirestoreError, OperationType } from '../../lib/firebase';

export const BillingTab: React.FC<{ 
  state: AgroState; 
  shopId: string | null; 
  onBillGenerated?: (bill: AgroBill) => void;
  billToEdit?: AgroBill | null;
  onResetEdit?: () => void;
}> = ({ state, shopId, onBillGenerated, billToEdit, onResetEdit }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    address: '',
    aadhar: ''
  });

  const [isEstimate, setIsEstimate] = useState(false);
  const [items, setItems] = useState<BillItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<AgroBill['paymentMethod']>('Cash');
  const [discount, setDiscount] = useState(0);
  const [hamali, setHamali] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [isSmartSearching, setIsSmartSearching] = useState(false);
  const [smartResults, setSmartResults] = useState<{id: string, reason: string}[]>([]);

  const handleSmartSearch = async () => {
    if (!productSearch || productSearch.length < 3) return;
    setIsSmartSearching(true);
    try {
      const response = await fetch('/api/ai/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: productSearch,
          products: state.products.map(p => ({
            id: p.id,
            name: p.name,
            manufacturer: p.manufacturer || '',
            category: p.category || '',
            description: p.description || ''
          }))
        })
      });
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSmartResults(data.results || []);
    } catch (error) {
      console.error("Smart Search failed:", error);
    } finally {
      setIsSmartSearching(false);
    }
  };

  const [newItem, setNewItem] = useState({
    productId: '',
    batchId: '',
    quantity: 1,
    gst: 0,
    // Manual fields
    manualName: '',
    manualPrice: 0,
    manualCompany: ''
  });

  // Handle bill editing
  useEffect(() => {
    if (billToEdit) {
      setIsEstimate(!!billToEdit.isEstimate);
      setItems(billToEdit.items);
      setPaymentMethod(billToEdit.paymentMethod);
      setDiscount(billToEdit.discount || 0);
      setHamali(billToEdit.hamali || 0);
      
      if (billToEdit.customerId) {
        setSelectedCustomerId(billToEdit.customerId);
        const cust = state.customers.find(c => c.id === billToEdit.customerId);
        if (cust) {
          setCustomerSearch(cust.name);
          setCustomerData({
            name: cust.name,
            phone: cust.contact,
            address: cust.address || cust.village || '',
            aadhar: cust.aadharId || ''
          });
        }
      } else {
        setCustomerData({
          name: billToEdit.customerName || '',
          phone: billToEdit.customerPhone || '',
          address: billToEdit.customerAddress || '',
          aadhar: billToEdit.customerAadhar || ''
        });
        setCustomerSearch(billToEdit.customerName || '');
      }
    }
  }, [billToEdit, state.customers]);

  const recentProducts = useMemo(() => {
    const allItems = state.bills.flatMap(b => b.items);
    const productFrequency: Record<string, { count: number; name: string; productId: string }> = {};
    
    allItems.forEach(item => {
      const key = item.productId || item.name;
      if (!productFrequency[key]) {
        productFrequency[key] = { count: 1, name: item.name, productId: item.productId || '' };
      } else {
        productFrequency[key].count += 1;
      }
    });

    return Object.values(productFrequency)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [state.bills]);

  const generateInvoiceNo = () => {
    const year = new Date().getFullYear();
    const count = (state.bills.length + 1).toString().padStart(5, '0');
    return `AGR-${year}-${count}`;
  };

  useEffect(() => {
    const selectedCustomer = state.customers.find(c => c.id === selectedCustomerId);
    if (selectedCustomer) {
      setCustomerData({
        name: selectedCustomer.name,
        phone: selectedCustomer.contact,
        address: selectedCustomer.address || selectedCustomer.village || '',
        aadhar: selectedCustomer.aadharId || ''
      });
    } else {
      setCustomerData(prev => ({ ...prev, name: customerSearch }));
    }
  }, [selectedCustomerId, customerSearch, state.customers]);

  const filteredCustomers = state.customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.contact.includes(customerSearch)
  );

  const selectedCustomerBalance = useMemo(() => {
    if (!selectedCustomerId || selectedCustomerId === 'NEW') return 0;
    const customer = state.customers.find(c => c.id === selectedCustomerId);
    if (!customer) return 0;

    const customerBills = state.bills.filter(b => b.customerId === selectedCustomerId);
    const customerTransactions = state.transactions.filter(t => t.partyId === selectedCustomerId && t.partyType === 'Customer');
    
    const totalSales = customerBills.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalPaid = customerTransactions.filter(t => t.type === 'Receipt').reduce((acc, curr) => acc + curr.amount, 0);
    return totalSales - totalPaid + (customer.openingBalance || 0);
  }, [selectedCustomerId, state.bills, state.transactions, state.customers]);

  const addItem = () => {
    if (isManualEntry) {
      if (!newItem.manualName || newItem.manualPrice <= 0 || newItem.quantity <= 0) return;
      
      const price = newItem.manualPrice;
      const gstRate = newItem.gst || 0;
      const basePrice = price / (1 + gstRate / 100);
      const gstTotal = price - basePrice;

      const newItemEntry: BillItem = {
        productId: 'MANUAL',
        batchId: 'MANUAL',
        name: newItem.manualName,
        companyName: newItem.manualCompany,
        batchNumber: 'N/A',
        expDate: '',
        packageSize: 'N/A',
        category: 'Other' as any,
        quantity: newItem.quantity,
        price: price,
        gst: gstRate,
        cgst: (gstTotal * newItem.quantity) / 2,
        sgst: (gstTotal * newItem.quantity) / 2,
        total: price * newItem.quantity
      };

      setItems([...items, newItemEntry]);
      setNewItem({ ...newItem, manualName: '', manualPrice: 0, manualCompany: '', quantity: 1, gst: 0 });
      return;
    }

    if (!newItem.productId || !newItem.batchId || newItem.quantity <= 0) return;
    
    const product = state.products.find(p => p.id === newItem.productId);
    const batch = state.batches.find(b => b.id === newItem.batchId);
    
    if (!product || !batch) return;

    if (batch.expDate && new Date(batch.expDate) < new Date()) {
      alert('This batch has expired and cannot be sold!');
      return;
    }

    if (batch.quantity < newItem.quantity) {
      alert(`Insufficient stock in this batch! Only ${batch.quantity} available.`);
      return;
    }

    const price = batch.sellingPrice || product.price;
    const gstRate = newItem.gst || 0;
    
    const basePrice = price / (1 + gstRate / 100);
    const gstTotal = price - basePrice;
    
    const newItemEntry: BillItem = {
      productId: product.id,
      batchId: batch.id,
      name: product.name,
      companyName: product.manufacturer || '',
      batchNumber: batch.batchNumber,
      expDate: batch.expDate,
      packageSize: batch.packageSize,
      category: product.category,
      quantity: newItem.quantity,
      price: price,
      gst: gstRate,
      cgst: (gstTotal * newItem.quantity) / 2,
      sgst: (gstTotal * newItem.quantity) / 2,
      total: price * newItem.quantity
    };

    setItems([...items, newItemEntry]);
    setNewItem({ ...newItem, productId: '', batchId: '', quantity: 1, gst: 0 });
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.total - (item.cgst || 0) - (item.sgst || 0)), 0);
    const totalGst = items.reduce((sum, item) => sum + (item.cgst || 0) + (item.sgst || 0), 0);
    const grandTotal = items.reduce((sum, item) => sum + item.total, 0) - discount + hamali;
    return { subtotal, totalGst, grandTotal };
  }, [items, discount, hamali]);

  const handleGenerateBill = async () => {
    if (!auth.currentUser || !shopId || items.length === 0) return;
    setIsProcessing(true);

    const shopRef = doc(db, 'agro_shops', shopId);
    
    try {
      // 1. If customer doesn't exist, auto-create
      let finalCustomerId = selectedCustomerId;
      if (!selectedCustomerId && customerData.name) {
        const custRef = await addDoc(collection(shopRef, 'customers'), {
          name: customerData.name,
          contact: customerData.phone,
          address: customerData.address,
          aadharId: customerData.aadhar,
          village: customerData.address.split(',')[0],
          createdAt: new Date().toISOString()
        });
        finalCustomerId = custRef.id;
      }

      const billData: AgroBill = {
        id: '', // Will be set by Firestore or we use addDoc
        invoiceNo: generateInvoiceNo(),
        customerId: finalCustomerId || null,
        customerName: customerData.name || 'Walk-in Customer',
        customerPhone: customerData.phone || '',
        customerAddress: customerData.address || '',
        customerAadhar: customerData.aadhar || '',
        items,
        subtotal: totals.subtotal,
        totalGst: totals.totalGst,
        discount,
        hamali,
        totalAmount: totals.grandTotal,
        totalInWords: toWords(totals.grandTotal),
        paymentStatus: (isEstimate || paymentMethod === 'Credit') ? 'Pending' : 'Paid',
        paymentMethod,
        isEstimate,
        date: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN'),
        footerNote: "Goods once sold will not be returned. Use pesticides carefully.",
        createdAt: new Date().toISOString(),
        shopDetails: {
          name: state.settings?.shopName || 'Agro Shop',
          address: state.settings?.address || '',
          owner: state.settings?.ownerName || '',
          contact: state.settings?.contact || '',
          gstin: state.settings?.gstin,
          fertilizerLicense: state.settings?.fertilizerLicense,
          seedLicense: state.settings?.seedLicense,
          insecticideLicense: state.settings?.insecticideLicense,
          cottonLicense: state.settings?.cottonLicense,
          licenceNo: state.settings?.licenceNo
        }
      };

      const billRef = await addDoc(collection(shopRef, 'bills'), billData);
      const finalBill = { ...billData, id: billRef.id };

      // 2. If not credit, record an immediate receipt transaction to clear the balance
      if (paymentMethod !== 'Credit' && !isEstimate && finalCustomerId) {
        await addDoc(collection(shopRef, 'transactions'), {
          partyId: finalCustomerId,
          partyName: customerData.name,
          partyType: 'Customer',
          type: 'Receipt',
          amount: totals.grandTotal,
          method: paymentMethod,
          description: `Auto-receipt for Invoice #${billData.invoiceNo}`,
          date: new Date().toLocaleDateString('en-IN'),
          createdAt: new Date().toISOString()
        });
      }

      if (!isEstimate) {
        for (const item of items) {
          if (item.batchId) {
             const batch = state.batches.find(b => b.id === item.batchId);
             if (batch) {
               await updateDoc(doc(shopRef, 'batches', item.batchId), {
                 quantity: batch.quantity - item.quantity
               });
             }
          }
          const product = state.products.find(p => p.id === item.productId);
          if (product) {
            await updateDoc(doc(shopRef, 'products', item.productId), {
              stock: (product.stock || 0) - item.quantity
            });
          }
        }
      }

      setItems([]);
      setSelectedCustomerId('');
      setCustomerSearch('');
      setDiscount(0);
      setHamali(0);

      if (onBillGenerated) {
        onBillGenerated(finalBill);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `agro_shops/${shopId}/bills`);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!productSearch) return state.products;
    const search = productSearch.toLowerCase();
    return state.products.filter(p => 
      p.name.toLowerCase().includes(search) ||
      p.manufacturer?.toLowerCase().includes(search) ||
      p.category?.toLowerCase().includes(search) ||
      p.description?.toLowerCase().includes(search)
    ).sort((a, b) => {
      // Prioritize name matches
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      if (aName.startsWith(search) && !bName.startsWith(search)) return -1;
      if (!aName.startsWith(search) && bName.startsWith(search)) return 1;
      return 0;
    });
  }, [state.products, productSearch]);

  const searchResults = useMemo(() => {
    if (smartResults.length > 0 && productSearch.length >= 3) {
      return smartResults.map(res => {
        const prod = state.products.find(p => p.id === res.id);
        return prod ? { ...prod, aiReason: res.reason } : null;
      }).filter(Boolean) as (AgroProduct & { aiReason?: string })[];
    }
    return filteredProducts;
  }, [smartResults, filteredProducts, state.products, productSearch]);

  const currentProductBatches = state.batches.filter(b => b.productId === newItem.productId && b.quantity > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      {/* Left Column: Form */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white dark:bg-gray-900 p-10 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight italic uppercase">Point of <span className="text-primary italic">Sale</span></h2>
            <div className="flex items-center gap-4">
              {billToEdit && onResetEdit && (
                <button 
                  onClick={onResetEdit}
                  className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2"
                >
                  <X size={14} /> Cancel Editing
                </button>
              )}
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                 <button onClick={() => setIsEstimate(false)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isEstimate ? 'bg-primary text-white shadow-lg' : 'text-gray-400'}`}>GST Bill</button>
                 <button onClick={() => setIsEstimate(true)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isEstimate ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400'}`}>Estimate</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="md:col-span-1 lg:col-span-1 relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Party Name/Mobile</label>
              <div className="relative">
                <UserPlus size={16} className="absolute left-4 top-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Select or enter name..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onFocus={() => setSelectedCustomerId('')}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl pl-12 pr-4 py-4 text-xs font-bold outline-none"
                />
                <AnimatePresence>
                  {customerSearch && !selectedCustomerId && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto p-2"
                    >
                      {filteredCustomers.length > 0 ? filteredCustomers.map((c, idx) => (
                        <button 
                          key={`${c.id}-${idx}`} 
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setCustomerSearch(c.name);
                          }}
                          className="w-full text-left p-3 hover:bg-primary/5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-between"
                        >
                          <span>{c.name}</span>
                          <span className="text-[8px] text-gray-400">{c.contact}</span>
                        </button>
                      )) : (
                        <p className="text-center py-4 text-[10px] font-bold text-gray-400 cursor-pointer" onClick={() => setSelectedCustomerId('NEW')}>+ Add as new customer</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Party Mobile</label>
              <input 
                type="text" 
                placeholder="Mobile number..."
                value={customerData.phone}
                onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-4 text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Aadhar / ID</label>
              <input 
                type="text" 
                placeholder="Farmer ID..."
                value={customerData.aadhar}
                onChange={(e) => setCustomerData({...customerData, aadhar: e.target.value})}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-4 text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Payment Mode</label>
              <select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-4 text-xs font-bold outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="GPay">GPay / UPI</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Card">Card Payment</option>
                <option value="Credit">Udhaar (Credit)</option>
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Party Address</label>
              <input 
                type="text" 
                placeholder="Complete address with village, city, etc."
                value={customerData.address}
                onChange={(e) => setCustomerData({...customerData, address: e.target.value})}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-4 text-xs font-bold outline-none"
              />
            </div>
          </div>

          <div className="p-8 bg-gray-50/50 dark:bg-gray-800/20 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 ring-1 ring-primary/5">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Plus size={20} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Add Products to Cart</label>
                    <p className="text-[9px] font-black text-primary uppercase tracking-tighter">GST Inclusive Pricing</p>
                  </div>
                </div>
                <div className="flex bg-white dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                   <button 
                     onClick={() => setIsManualEntry(false)} 
                     className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isManualEntry ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                   >
                     Inventory
                   </button>
                   <button 
                     onClick={() => setIsManualEntry(true)} 
                     className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isManualEntry ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                   >
                     Manual Entry
                   </button>
                </div>
             </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                {!isManualEntry ? (
                  <>
                    <div className="md:col-span-4 relative">
                      <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block ml-1 tracking-widest">1. Select Product</label>
                      <div className="relative">
                        <ShoppingCart className="absolute left-4 top-4 text-gray-400" size={16} />
                        <input 
                          type="text" 
                          placeholder="Search product..."
                          value={newItem.productId ? (state.products.find(p => p.id === newItem.productId)?.name || '') : productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            if (newItem.productId) setNewItem({ ...newItem, productId: '', batchId: '' });
                            if (smartResults.length > 0) setSmartResults([]);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && productSearch.length >= 3) {
                              e.preventDefault();
                              handleSmartSearch();
                            }
                          }}
                          onFocus={() => {
                            if (newItem.productId) {
                              setProductSearch('');
                              setNewItem({ ...newItem, productId: '', batchId: '' });
                            }
                          }}
                          className="w-full bg-white dark:bg-gray-900 border-none rounded-xl pl-12 pr-12 py-4 text-xs font-black shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono italic"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                           <button 
                            onClick={handleSmartSearch}
                            disabled={isSmartSearching || productSearch.length < 3}
                            className={`p-2 rounded-lg transition-all ${isSmartSearching ? 'text-primary' : 'text-gray-300 hover:text-primary hover:bg-primary/10'}`}
                            title="AI Smart Search"
                           >
                            {isSmartSearching ? <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> : <Sparkles size={16} />}
                           </button>
                        </div>
                        <AnimatePresence>
                          {(productSearch || (!newItem.productId && productSearch === '')) && !newItem.productId && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                              className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2"
                            >
                              {searchResults.length > 0 ? searchResults.map((p, idx) => (
                                <button 
                                  key={`bill-prod-search-${p.id}-${idx}`} 
                                  onClick={() => {
                                    setNewItem({ ...newItem, productId: p.id, batchId: '' });
                                    setProductSearch('');
                                    setSmartResults([]);
                                  }}
                                  className="w-full text-left p-3 hover:bg-primary/5 rounded-lg text-[10px] font-black transition-all flex flex-col"
                                >
                                  <div className="flex justify-between items-start">
                                    <span className="uppercase italic tracking-tighter text-gray-900 dark:text-white">{p.name}</span>
                                    {p.aiReason && <Sparkles size={10} className="text-primary mt-0.5" />}
                                  </div>
                                  {p.aiReason && <p className="text-[7px] text-primary italic mt-0.5 mb-1 leading-tight">{p.aiReason}</p>}
                                  <div className="flex justify-between items-center mt-1">
                                    <span className="text-[7px] text-primary">{p.manufacturer}</span>
                                    <span className="text-[7px] text-gray-400">{p.category}</span>
                                  </div>
                                </button>
                              )) : (
                                <p className="text-center py-4 text-[10px] font-bold text-gray-400">No products found</p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <p className="text-[7px] text-gray-400 mt-2 ml-1 font-bold uppercase tracking-widest">{smartResults.length > 0 ? 'AI-Matched Results (Press Clear to Reset)' : 'Smart AI Search Grounding Enabled'}</p>
                    </div>
                    <div className="md:col-span-4">
                      <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block ml-1 tracking-widest">2. Select Batch</label>
                      <div className="relative">
                        <Layers className="absolute left-4 top-4 text-gray-400" size={16} />
                        <select 
                          value={newItem.batchId}
                          disabled={!newItem.productId}
                          onChange={(e) => {
                            const batch = state.batches.find(b => b.id === e.target.value);
                            setNewItem({ 
                              ...newItem, 
                              batchId: e.target.value,
                              gst: batch?.gst || 0 
                            });
                          }}
                          className="w-full bg-white dark:bg-gray-900 border-none rounded-xl pl-12 pr-4 py-4 text-xs font-black shadow-sm disabled:opacity-50 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                        >
                          <option value="">Choose batch...</option>
                          {currentProductBatches.map(b => {
                             const diffDays = (new Date(b.expDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
                             const isNearExp = diffDays <= (state.settings?.expiryWarningDays || 30);
                             return (
                               <option key={b.id} value={b.id}>
                                 {b.batchNumber} (₹{b.sellingPrice}) — {b.quantity} Left {isNearExp ? '⚠️ EXP' : ''}
                               </option>
                             );
                          })}
                        </select>
                      </div>
                      <p className="text-[7px] text-primary mt-2 ml-1 font-black uppercase tracking-widest">Includes GST</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="md:col-span-5">
                      <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block ml-1 tracking-widest">1. Name & Company</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          placeholder="Product..."
                          value={newItem.manualName}
                          onChange={(e) => setNewItem({ ...newItem, manualName: e.target.value })}
                          className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-4 text-xs font-black shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                        <input 
                          type="text" 
                          placeholder="Mfg..."
                          value={newItem.manualCompany}
                          onChange={(e) => setNewItem({ ...newItem, manualCompany: e.target.value })}
                          className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-4 text-xs font-black shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block ml-1 tracking-widest">2. Selling Price</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-4 text-gray-400" size={16} />
                        <input 
                          type="number" 
                          placeholder="0.00"
                          value={newItem.manualPrice || ''}
                          onChange={(e) => setNewItem({ ...newItem, manualPrice: Number(e.target.value) })}
                          className="w-full bg-white dark:bg-gray-900 border-none rounded-xl pl-10 pr-4 py-4 text-xs font-black shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                      <p className="text-[7px] text-primary mt-2 ml-1 font-black uppercase tracking-widest">Final Amount per unit</p>
                    </div>
                  </>
                )}
                
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black text-gray-900 dark:text-white uppercase mb-2 block ml-1 tracking-widest flex items-center gap-1">
                    <Calculator size={10} className="text-primary" /> 3. QTY
                  </label>
                  <input 
                    type="number" 
                    placeholder="Qty"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-full bg-primary/5 dark:bg-primary/10 border-2 border-primary/20 rounded-xl px-4 py-4 text-sm font-black text-primary shadow-sm text-center outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                  <p className="text-[7px] text-primary mt-2 text-center font-black uppercase tracking-widest">Quantity</p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block ml-1 tracking-widest leading-none">4. GST %</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select 
                        value={newItem.gst}
                        onChange={(e) => setNewItem({ ...newItem, gst: Number(e.target.value) })}
                        className="w-full bg-emerald-50 dark:bg-emerald-900/10 border-none rounded-xl px-3 py-4 text-xs font-black text-emerald-600 shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>
                    <button 
                      onClick={addItem}
                      className="aspect-square w-12 bg-primary text-white rounded-xl shadow-xl shadow-primary/20 hover:scale-110 active:scale-95 transition-all flex items-center justify-center p-0"
                      title="Add to Bill"
                    >
                      <Plus size={24} strokeWidth={3} />
                    </button>
                  </div>
                  <p className="text-[7px] text-emerald-500 mt-2 ml-1 font-black uppercase tracking-widest">Tax</p>
                </div>
              </div>

             {/* Quick Product List */}
             {recentProducts.length > 0 && (
               <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                 <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Recently Sold / Quick Add</label>
                 <div className="flex flex-wrap gap-2">
                   {recentProducts.map((p, idx) => (
                     <button
                       key={`recent-${idx}`}
                       onClick={() => {
                         if (p.productId) {
                           setNewItem({ ...newItem, productId: p.productId, batchId: '' });
                           setIsManualEntry(false);
                         } else {
                           setNewItem({ ...newItem, manualName: p.name, manualPrice: 0 });
                           setIsManualEntry(true);
                         }
                       }}
                       className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg text-[9px] font-bold text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary transition-all shadow-sm"
                     >
                       {p.name}
                     </button>
                   ))}
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* Selected Items List */}
        <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden min-h-[400px]">
          <div className="p-8 border-b border-gray-50 dark:border-gray-800">
             <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs flex items-center gap-2">
               <ShoppingCart size={16} /> Bill Summary
             </h3>
          </div>
          <div className="p-4">
            {items.length === 0 ? (
              <div className="py-20 text-center">
                <Receipt size={48} className="mx-auto text-gray-100 mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No items added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                    key={`billing-cart-item-${item.productId}-${item.batchId}-${idx}`} 
                    className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl group"
                  >
                    <div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase">{item.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{item.quantity} x ₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-lg font-black text-primary italic tracking-tighter">₹{item.total}</span>
                      <button onClick={() => removeItem(idx)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Calculations */}
      <div className="space-y-8">
        <div className="bg-primary p-10 rounded-[3.5rem] shadow-2xl shadow-primary/20 text-white sticky top-24">
          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-4">Total Payable</p>
          <div className="flex items-baseline gap-2 mb-8">
            <span className="text-sm font-bold opacity-80 italic">INR</span>
            <span className="text-5xl font-black tracking-tighter font-mono italic">₹{totals.grandTotal.toLocaleString()}</span>
          </div>

          <div className="space-y-4 pt-8 border-t border-white/10">
            <div className="flex justify-between text-[10px] font-black uppercase opacity-60">
              <span>Subtotal (Base)</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase opacity-60">
              <span>GST Total</span>
              <span>₹{totals.totalGst.toFixed(2)}</span>
            </div>
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase opacity-60">Discount</span>
                <input 
                  type="number" 
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-20 bg-white/10 border-none rounded-lg px-2 py-1 text-xs font-bold text-right outline-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase opacity-60">Hamali/Labour</span>
                <input 
                  type="number" 
                  value={hamali}
                  onChange={(e) => setHamali(Number(e.target.value))}
                  className="w-20 bg-white/10 border-none rounded-lg px-2 py-1 text-xs font-bold text-right outline-none"
                />
              </div>
            </div>
            <div className="flex justify-between text-2xl font-black pt-6 border-t border-white/10">
              <span>Grand Total</span>
              <span>₹{totals.grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <button 
            disabled={isProcessing || items.length === 0}
            onClick={handleGenerateBill}
            className="w-full mt-10 py-5 bg-white text-primary rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black hover:text-white transition-all transform hover:-translate-y-1 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : isEstimate ? 'Save Estimate' : 'Generate & Print'}
          </button>
          
          <p className="text-center text-[10px] font-black italic opacity-40 uppercase tracking-widest mt-6">Secure Cloud Processing v4.2</p>
        </div>

        {/* Quick Contacts */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800">
           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 block">Target Party Details</h4>
           {customerData.name ? (
             <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight italic">{customerData.name}</p>
                 {selectedCustomerId !== 'NEW' && selectedCustomerId && (
                   <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${selectedCustomerBalance > 0 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                     Bal: ₹{selectedCustomerBalance.toLocaleString()}
                   </span>
                 )}
               </div>
               <p className="text-xs font-bold text-primary">{customerData.phone}</p>
               <div className="pt-4 flex gap-2">
                 <span className="px-2 py-1 bg-emerald-50 text-emerald-500 rounded text-[9px] font-black uppercase">Verified Partner</span>
                 <span className="px-2 py-1 bg-blue-50 text-blue-500 rounded text-[9px] font-black uppercase">{customerData.address.split(',')[0]}</span>
               </div>
             </div>
           ) : (
             <p className="text-xs font-bold text-gray-400 italic">No customer selected. Defaulting to Walk-in.</p>
           )}
        </div>
      </div>
    </div>
  );
};
