import React, { useState } from 'react';
import { AgroState, AgroOrder } from '../types';
import { ReportLayout } from './ReportLayout';

export const OrdersReport: React.FC<{ state: AgroState }> = ({ state }) => {
  const [statusFilter, setStatusFilter] = useState('All');
  
  const filteredData = (state.orders || []).filter(item => {
    return statusFilter === 'All' || item.status === statusFilter;
  });

  const columns = [
    { header: 'Order No', accessor: (item: AgroOrder) => `#${item.orderNo}` },
    { header: 'Date', accessor: 'date' as const },
    { header: 'Type', accessor: (item: AgroOrder) => (
      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${item.type === 'Sale' ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-500'}`}>
        {item.type} Order
      </span>
    )},
    { header: 'Party', accessor: 'partyName' as const },
    { header: 'Amount', accessor: (item: AgroOrder) => `₹${item.totalAmount.toLocaleString()}`, className: 'font-black' },
    { header: 'Status', accessor: (item: AgroOrder) => (
      <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${
        item.status === 'Pending' ? 'bg-orange-50 text-orange-500' :
        item.status === 'Confirmed' ? 'bg-blue-50 text-blue-500' :
        item.status === 'Delivered' ? 'bg-emerald-50 text-emerald-500' :
        'bg-gray-50 text-gray-400'
      }`}>
        {item.status}
      </span>
    )},
    { header: 'Delivery By', accessor: (item: AgroOrder) => item.deliveryDate || 'TBD' }
  ];

  return (
    <ReportLayout 
      title="Sales & Purchase Order Pipeline"
      data={filteredData}
      columns={columns}
      exportFileName="orders_report"
      filters={
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      }
    />
  );
};
