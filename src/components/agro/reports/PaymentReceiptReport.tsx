import React, { useState } from 'react';
import { AgroState, AgroTransaction } from '../types';
import { ReportLayout } from './ReportLayout';

export const PaymentReceiptReport: React.FC<{ state: AgroState }> = ({ state }) => {
  const [typeFilter, setTypeFilter] = useState<'All' | 'Payment' | 'Receipt'>('All');

  const filteredData = (state.transactions || []).filter(item => {
    return typeFilter === 'All' || item.type === typeFilter;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const columns = [
    { header: 'Date', accessor: 'date' as const },
    { header: 'Voucher No', accessor: (item: any) => `#${item.id.slice(-6).toUpperCase()}` },
    { header: 'Party Type', accessor: 'partyType' as const },
    { header: 'Type', accessor: (item: AgroTransaction) => (
      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${item.type === 'Receipt' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
        {item.type}
      </span>
    )},
    { header: 'Method', accessor: 'method' as const },
    { header: 'Amount', accessor: (item: AgroTransaction) => `₹${item.amount.toLocaleString()}`, className: 'text-right font-black', footer: (data: AgroTransaction[]) => `Net: ₹${data.reduce((s, i) => s + (i.type === 'Receipt' ? i.amount : -i.amount), 0).toLocaleString()}` },
  ];

  return (
    <ReportLayout 
      title="Financial Vouchers (Payments/Receipts)"
      data={filteredData}
      columns={columns}
      exportFileName="payment_receipt_report"
      filters={
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none"
        >
          <option value="All">All Vouchers</option>
          <option value="Payment">Payments Only</option>
          <option value="Receipt">Receipts Only</option>
        </select>
      }
    />
  );
};
