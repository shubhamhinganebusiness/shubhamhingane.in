import React from 'react';
import { 
  TrendingUp, Package, Users, Receipt, 
  ArrowUpRight, AlertTriangle, ChevronRight,
  ShieldAlert, Clock, AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { AgroState } from './types';
import { LoadingSpinner } from './ui/LoadingSpinner';

export const OverviewTab: React.FC<{ state: AgroState; setActiveTab: (tab: string) => void }> = ({ state, setActiveTab }) => {
  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner label="Aggregating Shop Data..." />
      </div>
    );
  }
  const stats = [
    { label: 'Total Sales', value: `₹${state.bills.reduce((s, b) => s + b.totalAmount, 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Total Products', value: state.products.length, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Active Parties', value: state.customers.length + state.suppliers.length, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Total Invoices', value: state.bills.length, icon: Receipt, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  const lowStockProducts = state.products.filter(p => p.stock <= (p.reorderLevel || state.settings?.lowStockThreshold || 10));
  
  const expiryAlerts = state.batches.filter(b => {
    if (!b.expDate) return false;
    const diffDays = (new Date(b.expDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= (state.settings?.expiryWarningDays || 30);
  }).sort((a,b) => new Date(a.expDate).getTime() - new Date(b.expDate).getTime());

  return (
    <div className="space-y-10 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm"
          >
            <div className={`p-4 ${stat.bg} w-fit rounded-2xl mb-6 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Critical Alerts */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-4">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert size={18} className="text-red-500" /> Critical Expiry Alerts
            </h3>
            <span className="px-2 py-1 bg-red-50 text-red-500 rounded-lg text-[10px] font-black">{expiryAlerts.length} Warnings</span>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
             {expiryAlerts.length === 0 ? (
               <p className="p-20 text-center text-xs font-bold text-gray-400 italic">No products near expiry. Good job!</p>
             ) : (
               <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {expiryAlerts.slice(0, 5).map(batch => {
                  const product = state.products.find(p => p.id === batch.productId);
                  const isExp = new Date(batch.expDate) < new Date();
                  return (
                    <div key={batch.id} className={`p-6 flex items-center justify-between group cursor-default ${isExp ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${isExp ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                           <Clock size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white uppercase line-clamp-1">{product?.name || 'Unknown'}</p>
                          <p className="text-[10px] font-bold text-gray-400">Batch: {batch.batchNumber} • Exp: {batch.expDate}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-[10px] font-black uppercase tracking-widest ${isExp ? 'text-red-600 animate-pulse' : 'text-orange-500'}`}>{isExp ? 'Expired' : 'Near Expiry'}</p>
                         <p className="text-xs font-bold text-gray-400">Stock: {batch.quantity}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
             )}
          </div>

          {/* Stock Level Alerts */}
          <div className="flex items-center justify-between px-4 pt-4">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={18} className="text-primary" /> Stock Level Alerts
            </h3>
          </div>
           <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
             {lowStockProducts.length === 0 ? (
               <p className="p-20 text-center text-xs font-bold text-gray-400 italic">Inventory is healthy!</p>
             ) : (
               <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {lowStockProducts.slice(0, 5).map(product => (
                  <div key={product.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-50 rounded-xl text-primary">
                         <Package size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase">{product.name}</p>
                        <p className="text-[10px] font-bold text-gray-400">Unit: {product.unit} • Threshold: {product.reorderLevel || state.settings?.lowStockThreshold || 10}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-red-500 lowercase italic">{product.stock <= 0 ? 'Out of stock' : 'Low stock'}</p>
                       <p className="text-xs font-bold text-gray-400">Current: {product.stock}</p>
                    </div>
                  </div>
                ))}
              </div>
             )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Recent Activity</h3>
            <button 
              onClick={() => setActiveTab('sales')}
              className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-1 hover:gap-2 transition-all"
            >
              View History <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
            {state.bills.slice(0, 8).map((bill) => (
              <div key={bill.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-all cursor-default">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-primary">
                    <ArrowUpRight size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{bill.customerName}</h4>
                    <p className="text-[10px] text-gray-400 font-bold">{bill.date} • {bill.time || '00:00'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-primary truncate italic tracking-tighter">₹{bill.totalAmount.toLocaleString()}</p>
                  <p className={`text-[9px] font-black uppercase tracking-widest ${bill.paymentStatus === 'Paid' ? 'text-emerald-500' : 'text-orange-500'}`}>
                    {bill.paymentStatus} via {bill.paymentMethod}
                  </p>
                </div>
              </div>
            ))}
            {state.bills.length === 0 && (
              <div className="p-20 text-center">
                <Receipt size={48} className="mx-auto text-gray-100 mb-4" />
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">No recent transactions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
