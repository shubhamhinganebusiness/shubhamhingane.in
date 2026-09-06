import React, { useState } from 'react';
import { AgroState, AgroReturn } from '../types';
import { ReportLayout } from './ReportLayout';

export const ReturnsReport: React.FC<{ state: AgroState }> = ({ state }) => {
  const [typeFilter, setTypeFilter] = useState<'All' | 'Sale' | 'Purchase'>('All');
  
  const filteredData = (state.returns || []).filter(item => {
    return typeFilter === 'All' || item.type === typeFilter;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const columns = [
    { header: 'Return Date', accessor: 'date' as const },
    { header: 'Original Inv', accessor: 'originalInvoiceNo' as const },
    { header: 'Type', accessor: (item: AgroReturn) => (
      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${item.type === 'Sale' ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>
        {item.type} Return
      </span>
    )},
    { header: 'Party', accessor: 'partyName' as const },
    { header: 'Product', accessor: 'productName' as const },
    { header: 'Qty', accessor: 'quantity' as const },
    { header: 'Reason', accessor: 'reason' as const, className: 'italic text-gray-400' },
    { header: 'Amount', accessor: (item: AgroReturn) => `₹${item.amount.toLocaleString()}`, className: 'text-right font-black', footer: (data: AgroReturn[]) => `Total: ₹${data.reduce((s, i) => s + i.amount, 0).toLocaleString()}` },
  ];

  return (
    <ReportLayout 
      title="Return Merch Authorization Log"
      data={filteredData}
      columns={columns}
      exportFileName="returns_report"
      filters={
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none"
        >
          <option value="All">All Returns</option>
          <option value="Sale">Sale Returns</option>
          <option value="Purchase">Purchase Returns</option>
        </select>
      }
    />
  );
};
