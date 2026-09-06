import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, User, Plus, Trash2, 
  CreditCard, IndianRupee, X, Save, 
  CheckCircle2, Printer, Users
} from 'lucide-react';

interface Props {
  tenantId?: string;
}

export const MessPosSystem: React.FC<Props> = ({ tenantId }) => {
  const [cart, setCart] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [customerName, setCustomerName] = useState('Guest Customer');
  const [customerMobile, setCustomerMobile] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState<any>(null);

  const menuItems = [
    { id: '1', name: 'Standard Thali', price: 80, category: 'Meal' },
    { id: '2', name: 'Special Thali', price: 120, category: 'Meal' },
    { id: '3', name: 'Egg Curry', price: 60, category: 'Add-on' },
    { id: '4', name: 'Extra Roti', price: 10, category: 'Add-on' },
    { id: '5', name: 'Sweet Dish', price: 30, category: 'Add-on' },
    { id: '6', name: 'Cold Drink', price: 20, category: 'Beverage' },
  ];

  useEffect(() => {
    const sum = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setTotal(sum);
  }, [cart]);

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const processSale = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const saleId = `SALE_${Date.now()}`;
      const saleData = {
        id: saleId,
        customerName,
        customerMobile,
        items: cart,
        total,
        date: Timestamp.now(),
        tenantId,
        type: 'Walk-In'
      };

      await setDoc(doc(db, `messes/${tenantId}/sales`, saleId), saleData);

      // Record as expense if it's not a sale? No, this is revenue.
      // We should record it in a transactions collection.
      
      setShowReceipt(saleData);
      setCart([]);
      setCustomerName('Guest Customer');
      setCustomerMobile('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-12rem)]">
      {/* Menu / Selection */}
      <div className="flex-[2] space-y-8 overflow-y-auto pr-4 custom-scrollbar">
        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <ShoppingBag className="text-primary" />
                Quick POS
              </h2>
              <p className="text-gray-500 font-medium">Walk-in & Guest Billing Terminal</p>
            </div>
            <div className="flex gap-2">
               {['All', 'Meals', 'Add-ons', 'Beverage'].map(cat => (
                 <button key={cat} className="px-5 py-2 bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all border border-gray-50">
                    {cat}
                 </button>
               ))}
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
            {menuItems.map(item => (
              <button 
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-gray-50 border border-transparent rounded-[2rem] p-8 text-left hover:bg-white hover:border-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white mb-6 shadow-sm transition-all text-xl font-black">
                   ₹
                </div>
                <h4 className="font-black text-gray-900 tracking-tight text-lg">{item.name}</h4>
                <div className="flex justify-between items-center mt-2">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.category}</p>
                   <p className="font-black text-primary text-xl">₹{item.price}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart / Checkout */}
      <div className="flex-1 flex flex-col gap-8">
        <div className="bg-gray-900 rounded-[3rem] p-10 text-white flex-1 flex flex-col shadow-2xl">
          <div className="flex items-center gap-4 mb-10 pb-8 border-b border-white/10">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
               <IndianRupee size={28} />
            </div>
            <div>
               <h3 className="text-2xl font-black tracking-tight">Active Cart</h3>
               <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Order Summary</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center group">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-black text-white/50 group-hover:bg-primary transition-all">
                       {item.quantity}
                    </div>
                    <div>
                       <p className="font-bold text-sm tracking-tight">{item.name}</p>
                       <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">₹{item.price} each</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-6">
                    <span className="font-black text-lg">₹{item.price * item.quantity}</span>
                    <button onClick={() => removeFromCart(item.id)} className="text-white/20 hover:text-red-500 transition-colors">
                       <Trash2 size={16} />
                    </button>
                 </div>
              </div>
            ))}
            {cart.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-4">
                  <ShoppingBag size={64} strokeWidth={1} />
                  <p className="font-black uppercase tracking-[0.2em] text-[10px]">Cart is Empty</p>
               </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 space-y-6">
            <div className="space-y-4">
               <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input 
                    type="text" 
                    placeholder="Customer Name" 
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold placeholder:text-white/20 focus:bg-white/10 transition-all text-sm"
                  />
               </div>
               <div className="flex justify-between items-center text-white/40 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest ml-1">Grand Total</span>
                  <span className="text-[10px] font-black uppercase tracking-widest mr-1">Inclusive of GST</span>
               </div>
               <div className="flex justify-between items-end bg-primary/20 p-6 rounded-[2rem] border border-primary/20">
                  <span className="text-sm font-black uppercase tracking-widest text-primary">Payable</span>
                  <span className="text-4xl font-black text-white">₹{total}</span>
               </div>
            </div>

            <button 
              onClick={processSale}
              disabled={cart.length === 0 || isProcessing}
              className="w-full py-6 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              <CreditCard size={18} />
              Complete Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
           <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm bg-white rounded-[3rem] shadow-2xl p-10 text-gray-900 relative"
              >
                 <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                       <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">Payment Success!</h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Transaction ID: {showReceipt.id.slice(-10)}</p>
                 </div>

                 <div className="space-y-4 mb-10 font-mono text-sm border-y border-dashed border-gray-200 py-8">
                    {showReceipt.items.map((item: any) => (
                       <div key={item.id} className="flex justify-between">
                          <span>{item.name} x {item.quantity}</span>
                          <span className="font-bold">₹{item.price * item.quantity}</span>
                       </div>
                    ))}
                    <div className="flex justify-between pt-4 border-t border-gray-100 font-bold text-lg">
                       <span>TOTAL PAID</span>
                       <span className="text-primary">₹{showReceipt.total}</span>
                    </div>
                 </div>

                 <div className="flex flex-col gap-3">
                    <button onClick={() => window.print()} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                       <Printer size={16} /> Print Tiny Receipt
                    </button>
                    <button onClick={() => setShowReceipt(null)} className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                       Done / New Order
                    </button>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
};
