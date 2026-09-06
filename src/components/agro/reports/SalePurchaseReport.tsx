import React, { useState } from 'react';
import { AgroState, AgroBill, AgroPurchase } from '../types';
import { ReportLayout } from './ReportLayout';

export const SalePurchaseReport: React.FC<{ state: AgroState }> = ({ state }) => {
  const [typeFilter, setTypeFilter] = useState<'All' | 'Sale' | 'Purchase'>('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const combinedData = [
    ...state.bills.map(b => ({
       ...b,
       type: 'Sale' as const,
       partyName: b.customerName,
       amount: b.totalAmount,
       itemsDisplay: b.items.map(i => `${i.name} (${i.quantity})`).join(', ')
    })),
    ...state.purchases.map(p => ({
       ...p,
       type: 'Purchase' as const,
       partyName: p.supplierName,
       amount: p.totalAmount,
       itemsDisplay: p.items.map(i => `${i.productName} (${i.qty})`).join(', ')
    }))
  ].filter(item => {
    const matchesType = typeFilter === 'All' || item.type === typeFilter;
    const itemDate = new Date(item.date);
    const start = dateRange.start ? new Date(dateRange.start) : null;
    const end = dateRange.end ? new Date(dateRange.end) : null;
    const matchesDate = (!start || itemDate >= start) && (!end || itemDate <= end);
    return matchesType && matchesDate;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const columns = [
    { header: 'Date', accessor: 'date' as const },
    { header: 'Type', accessor: (item: any) => (
      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${item.type === 'Sale' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
        {item.type}
      </span>
    )},
    { header: 'Party Name', accessor: 'partyName' as const },
    { header: 'Products (Qty)', accessor: 'itemsDisplay' as const, className: 'max-w-[200px] truncate' },
    { header: 'Amount', accessor: (item: any) => `₹${item.amount.toLocaleString()}`, className: 'text-right font-black', footer: (data: any[]) => `Total: ₹${data.reduce((s, i) => s + i.amount, 0).toLocaleString()}` },
  ];

  return (
    <ReportLayout 
      title="Sale & Purchase Master Report"
      data={combinedData}
      columns={columns}
      exportFileName="sale_purchase_report"
      filters={
        <>
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none"
          >
            <option value="All">All Transactions</option>
            <option value="Sale">Sales Only</option>
            <option value="Purchase">Purchases Only</option>
          </select>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-[10px] font-black outline-none"
            />
            <span className="text-gray-300 font-bold">-</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-[10px] font-black outline-none"
            />
          </div>
        </>
      }
    />
  );
};
