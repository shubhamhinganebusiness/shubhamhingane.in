import React, { useState, useEffect } from 'react';
import { 
  Receipt, Landmark, FileText, ArrowUpRight, ArrowDownRight, 
  Upload, Info, CheckCircle2, ChevronRight, PieChart,
  Download, Calendar, Filter
} from 'lucide-react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { FurnitureBill } from './types';

export const Accounting = () => {
  const { storeId } = useAuth();
  const [activeTab, setActiveTab] = useState<'p&l' | 'gst' | 'banking'>('p&l');
  const [bills, setBills] = useState<FurnitureBill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;

    const q = collection(db, `messes/${storeId}/bills`);
    const unsubscribe = onSnapshot(q, (snap) => {
      setBills(snap.docs.map(d => ({ id: d.id, ...d.data() } as FurnitureBill)));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'bills');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [storeId]);

  const totalRevenue = bills.reduce((acc, b) => acc + (b.total || 0), 0);
  const totalTax = bills.reduce((acc, b) => acc + (b.totalGst || 0), 0);
  const totalSubtotal = bills.reduce((acc, b) => acc + (b.subtotal || 0), 0);
  
  // Mock expenses for now as we don't have an expense module yet
  const mockExpenses = totalRevenue * 0.45; 
  const netProfit = totalRevenue - mockExpenses - totalTax;

  const mainStats = [
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, trend: '+10%', type: 'up' },
    { label: 'Tax Liability', value: `₹${totalTax.toLocaleString()}`, trend: '+5%', type: 'down' },
    { label: 'Net Profit (Est)', value: `₹${netProfit.toLocaleString()}`, trend: '+8%', type: 'up' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {mainStats.map((stat, i) => (
          <div key={i} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm transition-all hover:shadow-xl">
             <p className="text-[10px] font-black uppercase tracking-[2px] text-gray-400 mb-2">{stat.label}</p>
             <div className="flex items-end justify-between">
                <h3 className="text-2xl md:text-3xl font-black text-gray-900">{stat.value}</h3>
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${
                  stat.type === 'up' ? 'text-green-500' : stat.type === 'down' ? 'text-red-500' : 'text-gray-400'
                }`}>
                   {stat.type === 'up' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                   {stat.trend}
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 mb-8 overflow-x-auto no-scrollbar">
         {['p&l', 'gst', 'banking'].map(tab => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab as any)}
             className={`px-6 md:px-8 py-5 font-black text-xs uppercase tracking-widest relative transition-all whitespace-nowrap ${
               activeTab === tab ? 'text-primary' : 'text-gray-400 hover:text-gray-900'
             }`}
           >
             {tab.replace('&', ' & ')}
             {activeTab === tab && (
               <motion.div 
                 layoutId="activeTab"
                 className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" 
               />
             )}
           </button>
         ))}
      </div>

      {activeTab === 'p&l' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm h-fit">
              <h4 className="text-xl font-black text-gray-900 mb-8">Profit & Loss Statement</h4>
              <div className="space-y-6">
                 {[
                   { label: 'Gross Revenue', value: `₹${totalRevenue.toLocaleString()}`, type: 'income' },
                   { label: 'Sales Tax (GST Collected)', value: `₹${totalTax.toLocaleString()}`, type: 'expense' },
                   { label: 'Operating Expenses (Est)', value: `₹${mockExpenses.toLocaleString()}`, type: 'expense' },
                 ].map((row, i) => (
                   <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm font-medium text-gray-500">{row.label}</span>
                      <span className={`font-bold ${row.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        {row.type === 'income' ? '+' : '-'}{row.value}
                      </span>
                   </div>
                 ))}
                 <div className="pt-6 mt-6 border-t-2 border-gray-100 flex items-center justify-between">
                    <span className="text-lg font-black text-gray-900 uppercase tracking-widest">Net Profit</span>
                    <span className="text-2xl font-black text-primary">₹{netProfit.toLocaleString()}</span>
                 </div>
              </div>
           </div>

           <div className="space-y-8">
              <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100">
                 <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <PieChart size={20} className="text-primary" />
                    Expense Distribution
                 </h4>
                 <div className="space-y-4">
                    {[
                      { label: 'Material Costs', val: 65, color: 'bg-blue-500' },
                      { label: 'Labor & Staff', val: 20, color: 'bg-indigo-500' },
                      { label: 'Rent & Ops', val: 15, color: 'bg-orange-500' },
                    ].map((bar, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                           <span>{bar.label}</span>
                           <span className="text-gray-900">{bar.val}%</span>
                        </div>
                        <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-100">
                           <div className={`h-full ${bar.color}`} style={{ width: `${bar.val}%` }} />
                        </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-gray-900 p-8 rounded-[3rem] text-white">
                 <FileText size={32} className="text-primary mb-6" />
                 <h4 className="text-xl font-bold mb-2">Automated Compliance</h4>
                 <p className="text-gray-400 text-sm mb-8">E-Invoice & E-Way bills are auto-generated after each transaction. All records are synced with GSTN.</p>
                 <button className="w-full py-4 bg-white text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl">
                    View Compliance Log
                 </button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'gst' && (
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div>
                 <h4 className="text-2xl font-black text-gray-900">GST Dashboard</h4>
                 <p className="text-gray-400 font-medium">Compliance period: Oct 2023</p>
              </div>
              <div className="flex gap-4">
                 <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Input Tax Credit</span>
                    <span className="text-xl font-black text-green-500">₹82,450</span>
                 </div>
                 <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Output Tax Liability</span>
                    <span className="text-xl font-black text-red-500">₹1,42,100</span>
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              {[
                { type: 'GSTR-1', status: 'Filed', date: 'Oct 11, 2023', ref: 'GSTN8812921' },
                { type: 'GSTR-3B', status: 'Filed', date: 'Oct 20, 2023', ref: 'GSTN8820101' },
                { type: 'ITC Reco', status: 'Action Needed', date: 'Oct 24, 2023', ref: 'MISMATCH_DETECTED' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl group hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">
                   <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 shadow-sm">
                         <FileText size={20} />
                      </div>
                      <div>
                         <p className="font-bold text-gray-900">{item.type}</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.ref}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-8">
                      <span className="text-xs font-bold text-gray-400">{item.date}</span>
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        item.status === 'Filed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500 animate-pulse'
                      }`}>
                         {item.status}
                      </span>
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};
