import React, { useState, useEffect } from 'react';
import { 
  Globe, RefreshCw, Smartphone, Monitor, 
  MapPin, CheckCircle2, AlertCircle, History, Clock,
  ArrowRight, ShieldCheck, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const InventorySync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'error'>('synced');
  const [view, setView] = useState<'status' | 'logs'>('status');

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus('synced');
    }, 3000);
  };

  return (
    <div className="space-y-8">
      {/* Sync Status Header */}
      <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-center gap-8">
               <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center relative ${
                 syncStatus === 'synced' ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-500'
               }`}>
                  <RefreshCw size={48} className={isSyncing ? 'animate-spin' : ''} />
                  {!isSyncing && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white border-4 border-gray-50 rounded-full flex items-center justify-center">
                       {syncStatus === 'synced' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    </div>
                  )}
               </div>
               <div>
                  <h2 className="text-3xl font-black text-gray-900 leading-tight">Unified Inventory Sync</h2>
                  <p className="text-gray-500 font-medium flex items-center gap-2 mt-2">
                    <span className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-green-500' : 'bg-orange-500'}`} />
                    Last synced: 2 minutes ago (Real-time enabled)
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <button 
                onClick={handleManualSync}
                className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:shadow-gray-900/40 transition-all flex items-center gap-3"
               >
                 {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <Database size={18} />}
                 {isSyncing ? 'Syncing...' : 'Force Global Resync'}
               </button>
            </div>
         </div>
      </div>

      {/* Sync Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Showroom View */}
         <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-gray-900 group-hover:scale-110 transition-transform">
               <MapPin size={120} />
            </div>
            <div className="relative z-10">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <MapPin size={20} className="text-gray-900" />
                     </div>
                     <h3 className="text-xl font-bold">Physical Showroom</h3>
                  </div>
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Master Pool</span>
               </div>

               <div className="space-y-6">
                  {[
                    { label: 'Active SKU Count', value: '1,420' },
                    { label: 'Low Stock Items', value: '12' },
                    { label: 'Pending Transfers', value: '04' },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between">
                       <span className="text-sm font-medium text-gray-500">{stat.label}</span>
                       <span className="font-black text-gray-900">{stat.value}</span>
                    </div>
                  ))}
               </div>

               <div className="mt-10 p-6 bg-white rounded-3xl border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                     <ShieldCheck size={18} className="text-green-500" />
                     <span className="text-xs font-black uppercase tracking-widest text-gray-400">Offline Authority</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">
                    Showroom stock is treated as the primary source of truth for physical availability.
                  </p>
               </div>
            </div>
         </div>

         {/* Online View */}
         <div className="bg-primary/5 p-8 rounded-[3rem] border border-primary/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-primary group-hover:scale-110 transition-transform">
               <Globe size={120} />
            </div>
            <div className="relative z-10">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Globe size={20} className="text-primary" />
                     </div>
                     <h3 className="text-xl font-bold">Global E-Store</h3>
                  </div>
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Active</span>
               </div>

               <div className="space-y-6">
                  {[
                    { label: 'Listed Products', value: '1,390' },
                    { label: 'Cart Abandonments', value: '82' },
                    { label: 'Online Reservations', value: '15' },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between">
                       <span className="text-sm font-medium text-primary/60">{stat.label}</span>
                       <span className="font-black text-gray-900">{stat.value}</span>
                    </div>
                  ))}
               </div>

               <div className="mt-10 p-6 bg-white rounded-3xl border border-primary/10">
                  <div className="flex items-center gap-3 mb-4">
                     <Smartphone size={18} className="text-primary" />
                     <span className="text-xs font-black uppercase tracking-widest text-primary/40">Sync Protocol</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">
                    Website stock updates immediately after POS transactions or Warehouse transfers.
                  </p>
               </div>
            </div>
         </div>
      </div>

      {/* Sync Log */}
      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
         <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <History size={24} className="text-gray-400" />
               <h3 className="text-xl font-black text-gray-900">Sync Activity Log</h3>
            </div>
            <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">View All Logs</button>
         </div>

         <div className="space-y-4">
            {[
              { time: '12:45 PM', event: 'POS Sale #8812', sku: 'FUR-SF-01', delta: '-1 Sold', status: 'Success' },
              { time: '11:20 AM', event: 'Wh Wholesale Inbound', sku: 'ELC-TV-55', delta: '+50 Received', status: 'Success' },
              { time: '09:00 AM', event: 'Nightly Global Resync', sku: 'ALL_SKUS', delta: 'Integrity Check', status: 'Success' },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all">
                 <div className="flex items-center gap-6">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{log.time}</span>
                    <div className="w-1 h-8 bg-gray-200 rounded-full" />
                    <div>
                       <p className="font-bold text-gray-900">{log.event}</p>
                       <p className="text-[10px] text-gray-400 font-bold uppercase">{log.sku}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-8">
                    <span className="font-black text-primary/80 uppercase text-xs tracking-widest">{log.delta}</span>
                    <div className="flex items-center gap-2 text-green-500 bg-green-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                       <CheckCircle2 size={12} />
                       {log.status}
                    </div>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};
