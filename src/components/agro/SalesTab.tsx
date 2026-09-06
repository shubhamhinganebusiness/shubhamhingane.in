import React, { useState } from 'react';
import { 
  TrendingUp, Download, Calendar, Search, 
  ChevronRight, ArrowUpRight, Filter, Printer, Receipt, Edit3
} from 'lucide-react';
import { AgroState, AgroBill } from './types';

export const SalesTab: React.FC<{ 
  state: AgroState; 
  onPrint?: (bill: AgroBill) => void;
  onEdit?: (bill: AgroBill) => void;
}> = ({ state, onPrint, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filteredBills = state.bills
    .filter(b => b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || (b.invoiceNo && b.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())) || b.id.includes(searchTerm))
    .filter(b => !dateFilter || b.date === new Date(dateFilter).toLocaleDateString('en-IN'))
    .sort((a,b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight italic uppercase">Sales History <span className="text-primary tracking-tighter">& Records</span></h2>
          <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.2em] mt-1">Day-wise transaction management</p>
        </div>
        <button className="px-6 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 hover:bg-black hover:text-white transition-all uppercase tracking-widest">
          <Download size={16} />
          Export All Records
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by customer or invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] pl-16 pr-6 py-5 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none shadow-sm dark:text-white uppercase tracking-tighter"
          />
        </div>
        <div className="relative">
           <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] pl-16 pr-6 py-5 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none shadow-sm dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Date & Time</th>
                <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Invoice</th>
                <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredBills.map((bill) => (
                <tr key={`sales-bill-entry-${bill.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all cursor-default">
                  <td className="px-8 py-6">
                    <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">{bill.date}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{bill.time || 'N/A'}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[9px] font-black bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg text-gray-500 uppercase tracking-[0.2em]">#{bill.invoiceNo || bill.id.slice(-6)}</span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase italic tracking-tight">{bill.customerName}</p>
                    <p className="text-[8px] text-gray-400 font-bold tracking-widest">{bill.customerPhone}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xl font-black text-primary italic tracking-tight font-mono">₹{bill.totalAmount.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-sm ${bill.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
                      {bill.paymentStatus}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onEdit?.(bill)}
                      className="p-4 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                      title="Edit Invoice"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => onPrint?.(bill)}
                      className="p-4 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl hover:text-primary hover:bg-primary/10 transition-all"
                      title="Print Invoice"
                    >
                      <Printer size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBills.length === 0 && (
            <div className="py-32 text-center">
              <Receipt size={64} className="mx-auto text-gray-100 mb-6" />
              <p className="text-gray-400 font-bold italic text-lg tracking-tight">No sales records found filtering by current parameters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
