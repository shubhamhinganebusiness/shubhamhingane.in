import React, { useState, useEffect } from 'react';
import { 
  BarChart3, ShoppingCart, Package, Warehouse, 
  TrendingUp, TrendingDown, Bell, Zap, 
  User, CheckCircle2, AlertCircle, Clock,
  Receipt, ClipboardCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { FurnitureBill, FurnitureProduct } from './types';

export const Overview = () => {
  const { storeId } = useAuth();
  const [bills, setBills] = useState<FurnitureBill[]>([]);
  const [products, setProducts] = useState<FurnitureProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;

    const billsQ = collection(db, `messes/${storeId}/bills`);
    const prodQ = collection(db, `messes/${storeId}/products`);

    const unsubBills = onSnapshot(billsQ, (snap) => {
      setBills(snap.docs.map(d => ({ id: d.id, ...d.data() } as FurnitureBill)));
    });

    const unsubProd = onSnapshot(prodQ, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as FurnitureProduct)));
      setLoading(false);
    });

    return () => {
      unsubBills();
      unsubProd();
    };
  }, [storeId]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayBills = bills.filter(b => b.timestamp.toDate() >= today);
  const todaySales = todayBills.reduce((acc, b) => acc + (b.total || 0), 0);
  const totalWhStock = products.reduce((acc, p) => acc + (p.warehouseStock || 0), 0);
  const totalSrStock = products.reduce((acc, p) => acc + (p.showroomStock || 0), 0);
  const lowStockProducts = products.filter(p => (p.showroomStock + p.warehouseStock) < (p.minStockLevel || 5));

  const kpis = [
    { label: "Today's Sales", value: `₹${(todaySales / 1000).toFixed(1)}K`, trend: '+12%', icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Invoices', value: bills.length.toString(), trend: '+5%', icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Showroom Stock', value: totalSrStock.toLocaleString(), trend: '-2%', icon: Package, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Warehouse Stock', value: totalWhStock.toLocaleString(), trend: '+18%', icon: Warehouse, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between h-40 md:h-48 transition-all hover:shadow-xl hover:-translate-y-1 group">
             <div className="flex items-center justify-between">
                <div className={`w-10 h-10 md:w-12 md:h-12 ${kpi.bg} ${kpi.color} rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                   <kpi.icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${
                  kpi.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'
                }`}>
                   {kpi.trend.startsWith('+') ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                   {kpi.trend}
                </div>
             </div>
             <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[2px] mb-1">{kpi.label}</p>
                <h3 className="text-3xl font-black text-gray-900">{kpi.value}</h3>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* AI Quick Insights */}
         <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-indigo-950 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 md:p-12 opacity-10 blur-xl">
               <Zap size={140} />
            </div>
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-6 md:mb-8">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                     <Zap size={20} className="text-primary" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold tracking-tight">AI Morning Summary</h3>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 md:gap-6 max-w-xl">
                  <div className="flex items-start gap-3 md:gap-4 p-4 md:p-5 bg-white/5 rounded-2xl md:rounded-3xl border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all cursor-default">
                     <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
                        <AlertCircle size={18} />
                     </div>
                     <div>
                        <p className="font-bold text-sm md:text-lg mb-1 leading-tight text-white group-hover:text-primary transition-colors">Stock Alert: 12 SKUs critical</p>
                        <p className="text-[10px] md:text-sm text-white/40">Expected stockout within 48 hours for Coffee Tables.</p>
                     </div>
                  </div>

                  <div className="flex items-start gap-3 md:gap-4 p-4 md:p-5 bg-white/5 rounded-2xl md:rounded-3xl border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all cursor-default">
                     <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center shrink-0 border border-green-500/20">
                        <TrendingUp size={18} />
                     </div>
                     <div>
                        <p className="font-bold text-sm md:text-lg mb-1 leading-tight text-white group-hover:text-primary transition-colors">Opportunity: Electronics Surge</p>
                        <p className="text-[10px] md:text-sm text-white/40">Laptop demand increased by 22% this week.</p>
                     </div>
                  </div>
               </div>

               <button className="mt-8 md:mt-10 w-full sm:w-auto py-3 md:py-4 px-8 md:px-10 bg-primary text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all">
                  Deep Dive Analytics
               </button>
            </div>
         </div>

         {/* Notifications / Alerts */}
         <div className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-gray-900 border-l-4 border-primary pl-4">Live Alerts</h3>
               <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-400"><Bell size={20}/></button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
               {lowStockProducts.length === 0 ? (
                 <div className="py-10 text-center">
                    <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                       <CheckCircle2 size={24} />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">All Stock Optimal</p>
                 </div>
               ) : lowStockProducts.map((p) => (
                 <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl bg-red-50/50 border border-red-100 hover:bg-red-50 transition-all cursor-pointer">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white text-red-500 shadow-sm shadow-red-100`}>
                       <AlertCircle size={16}/>
                    </div>
                    <div className="flex-1">
                       <p className="text-[14px] font-bold text-gray-900">{p.name}</p>
                       <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                          Low Stock: {p.showroomStock + p.warehouseStock} units left
                       </p>
                    </div>
                 </div>
               ))}
               
               {/* Recent activity placeholders if needed, but primary focus is alerts */}
               <div className="pt-4 border-t border-gray-100 opacity-40">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-2">Recent System Updates</p>
                  {[
                    { event: 'Warehouse Scan', time: '2m ago', icon: <Warehouse size={12}/> },
                    { event: 'POS Sync', time: '12m ago', icon: <Zap size={12}/> }
                  ].map((notif, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl">
                      <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center text-gray-400">
                        {notif.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-bold text-gray-600">{notif.event} • {notif.time}</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            <button className="w-full mt-10 py-5 bg-gray-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:shadow-gray-900/20 transition-all">
               View All Notifications
            </button>
         </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
         {[
           { label: 'E-Invoice', sub: 'Compliance', icon: Receipt },
           { label: 'E-Way Bill', sub: 'Transport', icon: Warehouse },
           { label: 'Supplier Pay', sub: 'Liability', icon: User },
           { label: 'GST Report', sub: 'Taxation', icon: BarChart3 },
           { label: 'Member Tier', sub: 'Loyalty', icon: Zap },
           { label: 'Stock Audit', sub: 'Integrity', icon: ClipboardCheck },
         ].map((tool, i) => (
           <button key={i} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm text-center hover:border-primary hover:shadow-lg transition-all group active:scale-95">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-50 rounded-lg md:rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-all mx-auto mb-3 md:mb-4">
                 <tool.icon size={18} className="md:w-5 md:h-5" />
              </div>
              <p className="text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-tighter mb-0.5 line-clamp-1">{tool.label}</p>
              <p className="text-[7px] md:text-[8px] font-bold text-gray-400 uppercase tracking-widest shrink-0">{tool.sub}</p>
           </button>
         ))}
      </div>
    </div>
  );
};
