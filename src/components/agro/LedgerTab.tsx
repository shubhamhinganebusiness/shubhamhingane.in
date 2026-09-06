import React, { useState, useMemo } from 'react';
import { 
  FileCheck, Download, Calendar, Search, 
  ArrowUpRight, ArrowDownLeft, Filter, Printer,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';
import { AgroState } from './types';
import { LoadingSpinner } from './ui/LoadingSpinner';

export const LedgerTab: React.FC<{ state: AgroState; shopId: string | null }> = ({ state, shopId }) => {
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState<'Daybook' | 'Ledger'>('Daybook');
  const [selectedParty, setSelectedParty] = useState({ id: 'All', type: 'Customer' });

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner label="Compiling Financial Statements..." />
      </div>
    );
  }

  // Combined daily transactions for Daybook
  const dayTransactions = useMemo(() => {
    return [
      ...state.bills.filter(b => b.date.includes(filterDate)).map(b => ({
        id: b.id,
        date: b.date,
        party: b.customerName,
        type: 'Sale',
        amount: b.totalAmount,
        mode: b.paymentMethod,
        flow: 'In' as const
      })),
      ...state.purchases.filter(p => p.date.includes(filterDate)).map(p => ({
        id: p.id,
        date: p.date,
        party: p.supplierName,
        type: 'Purchase',
        amount: p.totalAmount,
        mode: 'Cash',
        flow: 'Out' as const
      })),
      ...state.transactions.filter(t => t.date.includes(filterDate)).map(t => ({
        id: t.id,
        date: t.date,
        party: t.partyName || t.description,
        type: t.type,
        amount: t.amount,
        mode: t.method,
        flow: t.flow as 'In' | 'Out'
      }))
    ].sort((a, b) => b.id.localeCompare(a.id));
  }, [state.bills, state.purchases, state.transactions, filterDate]);

  // Party Ledger View Logic
  const partyHistory = useMemo(() => {
    if (selectedParty.id === 'All') return [];
    
    if (selectedParty.type === 'Customer') {
      const customerBills = state.bills.filter(b => b.customerId === selectedParty.id);
      const customerPayments = state.transactions.filter(t => t.partyId === selectedParty.id);
      
      return [
        ...customerBills.map(b => ({
          date: b.date,
          desc: `Invoice #${b.id.slice(-6)}`,
          debit: b.totalAmount,
          credit: 0,
          balance: 0
        })),
        ...customerPayments.map(p => ({
          date: p.date,
          desc: p.description || 'Payment Received',
          debit: 0,
          credit: p.amount,
          balance: 0
        }))
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      const supplierPurchases = state.purchases.filter(p => p.supplierId === selectedParty.id);
      const supplierPayments = state.transactions.filter(t => t.partyId === selectedParty.id);
      
      return [
        ...supplierPurchases.map(p => ({
          date: p.date,
          desc: `Purchase Bill #${p.billNumber || p.id.slice(-6)}`,
          debit: 0,
          credit: p.totalAmount,
          balance: 0
        })),
        ...supplierPayments.map(pm => ({
          date: pm.date,
          desc: pm.description || 'Payment Made',
          debit: pm.amount,
          credit: 0,
          balance: 0
        }))
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  }, [selectedParty, state.bills, state.purchases, state.transactions]);

  const ledgerWithBalance = useMemo(() => {
    let runningBalance = 0;
    return partyHistory.map(item => {
      runningBalance += (item.debit - item.credit);
      return { ...item, balance: runningBalance };
    });
  }, [partyHistory]);

  const totalIn = dayTransactions.filter(t => t.flow === 'In').reduce((s, t) => s + t.amount, 0);
  const totalOut = dayTransactions.filter(t => t.flow === 'Out').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight italic uppercase">Financial <span className="text-primary italic">Statement</span></h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Audit-Ready Daybook & Party Ledgers</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-gray-400 hover:text-primary transition-all"
          >
            <Printer size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-2 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm w-fit gap-2">
        <button 
          onClick={() => setReportType('Daybook')}
          className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'Daybook' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Daily Daybook
        </button>
        <button 
          onClick={() => setReportType('Ledger')}
          className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'Ledger' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Party Ledger
        </button>
      </div>

      {reportType === 'Ledger' && (
        <div className="flex flex-wrap items-center gap-4 bg-gray-50/50 dark:bg-gray-800/20 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
           <div className="flex bg-white dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <button 
                onClick={() => setSelectedParty({ ...selectedParty, type: 'Customer', id: 'All' })}
                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedParty.type === 'Customer' ? 'bg-primary text-white shadow-md' : 'text-gray-400'}`}
              >
                Customers
              </button>
              <button 
                onClick={() => setSelectedParty({ ...selectedParty, type: 'Supplier', id: 'All' })}
                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedParty.type === 'Supplier' ? 'bg-primary text-white shadow-md' : 'text-gray-400'}`}
              >
                Suppliers
              </button>
           </div>
           
           <select 
             value={selectedParty.id}
             onChange={(e) => setSelectedParty({ ...selectedParty, id: e.target.value })}
             className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest outline-none shadow-sm min-w-[250px]"
           >
              <option value="All">Select {selectedParty.type}...</option>
              {selectedParty.type === 'Customer' 
                ? state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                : state.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
              }
           </select>

           {selectedParty.id !== 'All' && (
             <div className="flex-1 flex justify-end gap-10 pr-6 border-l border-gray-200 dark:border-gray-800 ml-4">
                <div>
                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Total {selectedParty.type === 'Customer' ? 'Purchased' : 'Supplied'}</p>
                   <p className="text-lg font-black text-gray-900 dark:text-white italic">₹{ledgerWithBalance.reduce((s,i) => s + (selectedParty.type === 'Customer' ? i.debit : i.credit), 0).toLocaleString()}</p>
                </div>
                <div>
                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Outstanding Balance</p>
                   <p className={`text-lg font-black italic ${ledgerWithBalance[ledgerWithBalance.length-1]?.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                     ₹{Math.abs(ledgerWithBalance[ledgerWithBalance.length-1]?.balance || 0).toLocaleString()} 
                     <span className="text-[10px] ml-1 uppercase">{ledgerWithBalance[ledgerWithBalance.length-1]?.balance > 0 ? '(Pending)' : '(Clear)'}</span>
                   </p>
                </div>
             </div>
           )}
        </div>
      )}

      {reportType === 'Daybook' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ArrowUpRight size={80}/></div>
               <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl text-emerald-500"><ArrowUpRight size={20}/></div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daily Receipts (In)</p>
               </div>
               <p className="text-3xl font-black text-emerald-600">₹{totalIn.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ArrowDownLeft size={80}/></div>
               <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl text-red-500"><ArrowDownLeft size={20}/></div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daily Payments (Out)</p>
               </div>
               <p className="text-3xl font-black text-red-600">₹{totalOut.toLocaleString()}</p>
            </div>
            <div className="bg-primary p-8 rounded-[2.5rem] shadow-xl shadow-primary/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><FileCheck size={80} className="text-white"/></div>
               <div className="flex items-center justify-between mb-4 text-white/60">
                 <div className="p-3 bg-white/20 rounded-2xl text-white"><FileCheck size={20}/></div>
                 <p className="text-[10px] font-black uppercase tracking-widest">Closing Balance</p>
               </div>
               <p className="text-3xl font-black text-white">₹{(totalIn - totalOut).toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <Search size={16} /> Daybook Log
              </h3>
              <div className="flex items-center gap-4">
                 <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest ring-1 ring-gray-100 dark:ring-gray-800 focus:ring-primary outline-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/10">
                    <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                    <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Particulars</th>
                    <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Out (Debit)</th>
                    <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">In (Credit)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {dayTransactions.map((t, idx) => (
                    <tr key={`daybook-v5-${t.type}-${t.id}-${idx}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${t.flow === 'In' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{t.type}</span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase italic">{t.party}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {t.id.slice(0, 8)} • {t.mode}</p>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-red-500 text-xs">{t.flow === 'Out' ? `₹${t.amount.toLocaleString()}` : '-'}</td>
                      <td className="px-8 py-5 text-right font-black text-emerald-500 text-xs">{t.flow === 'In' ? `₹${t.amount.toLocaleString()}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {dayTransactions.length === 0 && (
                <div className="py-20 text-center">
                  <Calendar size={48} className="mx-auto text-gray-100 mb-4" />
                  <p className="text-gray-400 font-bold italic text-sm">No activity recorded for this date.</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-gray-50 dark:border-gray-800">
             <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
               <FileCheck size={16} /> Detailed Statement {selectedParty.id !== 'All' ? ` - ${selectedParty.type}` : ''}
             </h3>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-gray-50 dark:bg-gray-800/10">
                   <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                   <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                   <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Debit (Dr)</th>
                   <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Credit (Cr)</th>
                   <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Balance</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-xs">
                 {ledgerWithBalance.map((item, idx) => (
                   <tr key={`ledger-v4-${selectedParty.id}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-8 py-5 text-gray-500 font-bold">{item.date}</td>
                     <td className="px-8 py-5 font-black text-gray-900 dark:text-white uppercase italic">{item.desc}</td>
                     <td className="px-8 py-5 text-right font-black text-red-500 italic">{item.debit > 0 ? `₹${item.debit.toLocaleString()}` : '-'}</td>
                     <td className="px-8 py-5 text-right font-black text-emerald-500 italic">{item.credit > 0 ? `₹${item.credit.toLocaleString()}` : '-'}</td>
                     <td className="px-8 py-5 text-right font-black text-gray-900 dark:text-white italic bg-gray-50/30 dark:bg-gray-800/20">₹{item.balance.toLocaleString()}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
             {selectedParty.id === 'All' && (
               <div className="py-20 text-center">
                 <Users size={48} className="mx-auto text-gray-100 mb-4" />
                 <p className="text-gray-400 font-bold italic text-sm underline decoration-primary/20 decoration-2">Please select a party to view their ledger statement.</p>
               </div>
             )}
             {selectedParty.id !== 'All' && ledgerWithBalance.length === 0 && (
               <div className="py-20 text-center">
                 <Filter size={48} className="mx-auto text-gray-100 mb-4" />
                 <p className="text-gray-400 font-bold italic text-sm">No ledger entries found for this party.</p>
               </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
};
