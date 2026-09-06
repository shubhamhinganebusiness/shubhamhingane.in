import React, { useState, useMemo } from 'react';
import { AgroState, AgroBill, AgroCustomer } from '../types';
import { ReportLayout } from './ReportLayout';
import { User, CreditCard, Receipt } from 'lucide-react';

export const CustomerPaymentHistory: React.FC<{ state: AgroState }> = ({ state }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState(state.customers[0]?.id || '');

  const selectedCustomer = useMemo(() => 
    state.customers.find(c => c.id === selectedCustomerId),
    [state.customers, selectedCustomerId]
  );

  const customerData = useMemo(() => {
    if (!selectedCustomerId) return [];

    const bills = state.bills.filter(b => b.customerId === selectedCustomerId)
      .map(b => ({
         date: b.date,
         ref: `#INV-${b.invoiceNo || b.id.slice(-6)}`,
         type: 'Invoice',
         debit: b.totalAmount,
         credit: b.paymentStatus === 'Paid' ? b.totalAmount : 0,
         method: b.paymentMethod,
         balance: 0 // Will calculate in table or display separately
      }));

    const receipts = state.transactions.filter(t => t.partyId === selectedCustomerId && t.type === 'Receipt')
      .map(r => ({
         date: r.date,
         ref: `#REC-${r.id.slice(-6)}`,
         type: 'Payment Receipt',
         debit: 0,
         credit: r.amount,
         method: r.method,
         balance: 0
      }));

    return [...bills, ...receipts].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.bills, state.transactions, selectedCustomerId]);

  const summary = useMemo(() => {
     const totalInvoiced = customerData.reduce((s, i) => s + i.debit, 0);
     const totalPaid = customerData.reduce((s, i) => s + i.credit, 0);
     return {
       totalInvoiced,
       totalPaid,
       outstanding: totalInvoiced - totalPaid
     };
  }, [customerData]);

  const columns = [
    { header: 'Date', accessor: 'date' as const },
    { header: 'Reference', accessor: 'ref' as const },
    { header: 'Type', accessor: 'type' as const },
    { header: 'Invoiced Amt', accessor: (item: any) => item.debit > 0 ? `₹${item.debit.toLocaleString()}` : '-', className: 'text-red-500' },
    { header: 'Paid Amt', accessor: (item: any) => item.credit > 0 ? `₹${item.credit.toLocaleString()}` : '-', className: 'text-emerald-500' },
    { header: 'Method', accessor: 'method' as const },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Total Invoiced</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white italic tracking-tighter">₹{summary.totalInvoiced.toLocaleString()}</p>
         </div>
         <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm border-emerald-100">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Total Received</p>
            <p className="text-3xl font-black text-emerald-600 italic tracking-tighter">₹{summary.totalPaid.toLocaleString()}</p>
         </div>
         <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm border-red-100">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4">Outstanding Balance</p>
            <p className="text-3xl font-black text-red-600 italic tracking-tighter">₹{summary.outstanding.toLocaleString()}</p>
         </div>
      </div>

      <ReportLayout 
        title={`Ledger: ${selectedCustomer?.name || 'Select Customer'}`}
        data={customerData}
        columns={columns}
        exportFileName={`ledger_${selectedCustomer?.name || 'customer'}`}
        filters={
          <div className="relative">
             <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
             <select 
               value={selectedCustomerId} 
               onChange={(e) => setSelectedCustomerId(e.target.value)}
               className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl pl-12 pr-6 py-3 text-[10px] font-black uppercase tracking-widest outline-none shadow-sm"
             >
               <option value="">Select a Customer...</option>
               {state.customers.map(c => (
                 <option key={c.id} value={c.id}>{c.name} ({c.village})</option>
               ))}
             </select>
          </div>
        }
      />
    </div>
  );
};
