import React, { useState } from 'react';
import { 
  ClipboardCheck, Scan, RefreshCw, AlertCircle, 
  CheckCircle2, Search, ArrowRight, Save, 
  FileText, History, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const StockAudit = () => {
  const [step, setStep] = useState<'selection' | 'counting' | 'summary'>('selection');
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
         <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 text-center sm:text-left">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
               <ClipboardCheck size={32} />
            </div>
            <div>
               <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">Physical Stock Audit</h2>
               <p className="text-gray-500 font-medium text-sm">Verify showroom & warehouse inventory integrity</p>
            </div>
         </div>

         <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <button className="flex items-center justify-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 w-full sm:w-auto">
               <History size={16} />
               Past Audits
            </button>
            <button 
              onClick={() => setStep('counting')}
              className="w-full sm:w-auto px-8 py-3 md:py-4 bg-primary text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all"
            >
              Start New Session
            </button>
         </div>
      </div>

      {step === 'selection' ? (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 to-indigo-950 p-6 sm:p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] text-white overflow-hidden relative shadow-2xl">
               <div className="absolute top-0 right-0 p-8 md:p-12 opacity-10 blur-xl">
                  <Scan size={140} />
               </div>
               <div className="relative z-10">
                  <h3 className="text-2xl md:text-3xl font-black mb-4">Ready for Audit?</h3>
                  <p className="text-indigo-200 text-sm md:text-lg mb-8 md:mb-10 max-w-lg leading-relaxed">
                     Select a category or zone to begin the physical verification process. Ensure you have your mobile scanner ready.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                     {[
                       { label: 'Category Wise', sub: 'Filter by category' },
                       { label: 'Zone Wise', sub: 'Showroom vs Warehouse' },
                       { label: 'Random Check', sub: 'Daily 10 items' },
                       { label: 'Full Audit', sub: 'Comprehensive sync' },
                     ].map((opt, i) => (
                       <button key={i} className="p-5 md:p-6 bg-white/5 backdrop-blur border border-white/10 rounded-2xl md:rounded-3xl text-left hover:bg-white/10 transition-all group active:scale-95">
                          <p className="font-bold text-white mb-1 group-hover:text-primary transition-colors text-sm md:text-base">{opt.label}</p>
                          <p className="text-[9px] md:text-[10px] text-white/40 uppercase font-black">{opt.sub}</p>
                       </button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
               <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <AlertCircle size={20} className="text-orange-500" />
                  Recent Discrepancies
               </h4>
               <div className="space-y-4">
                  {[
                    { item: 'Office Chair Pro', expected: 12, found: 10, date: 'Oct 20' },
                    { item: 'Samsung 55 TV', expected: 5, found: 5, date: 'Oct 18' },
                    { item: 'Teak Coffee Table', expected: 8, found: 9, date: 'Oct 15' },
                  ].map((d, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                       <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-gray-900 text-sm">{d.item}</span>
                          <span className={`text-[10px] font-black ${d.expected === d.found ? 'text-green-500' : 'text-red-500'}`}>
                             {d.expected === d.found ? 'MATCH' : 'MISMATCH'}
                          </span>
                       </div>
                       <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                          <span>Qty: {d.found} / {d.expected}</span>
                          <span>{d.date}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      ) : (
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-10">
               <div className="flex items-center gap-4">
                  <button onClick={() => setStep('selection')} className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900"><RefreshCw size={20}/></button>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Active Audit Context</h3>
               </div>
               <div className="flex items-center gap-3">
                  <div className="px-5 py-2 bg-gray-50 rounded-full text-xs font-black text-gray-500 border border-gray-100">8 / 42 ITEMS CHECKED</div>
                  <button className="px-6 py-2 bg-gray-900 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg">Finalize Batch</button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[
                 { name: 'Leather Sofa', sku: 'FUR-SF-01', expected: 5 },
                 { name: 'Teak Bed Frame', sku: 'FUR-BD-12', expected: 3 },
                 { name: 'Dining Table', sku: 'FUR-DT-09', expected: 8 },
               ].map((item, i) => (
                 <div key={i} className="p-8 bg-gray-50 rounded-[2.5rem] border-2 border-transparent hover:border-primary/20 transition-all group">
                    <div className="flex justify-between items-center mb-6">
                       <div>
                          <p className="font-black text-gray-900 text-lg leading-tight">{item.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.sku}</p>
                       </div>
                       <button className="p-3 bg-white rounded-2xl shadow-sm text-gray-300 group-hover:text-primary transition-colors">
                          <Scan size={24} />
                       </button>
                    </div>

                    <div className="space-y-4">
                       <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-400">
                          <span>Expected Stock</span>
                          <span className="text-gray-900">{item.expected} Units</span>
                       </div>
                       
                       <div className="relative">
                          <input 
                            type="number" 
                            placeholder="Physical Counted Qty"
                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 text-center text-lg font-black"
                          />
                       </div>

                       <button className="w-full py-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                          <Save size={16} />
                          Confirm Quantities
                       </button>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      )}
    </div>
  );
};
