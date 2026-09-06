import React, { useMemo } from 'react';
import { AgroState } from '../types';
import { ReportLayout } from './ReportLayout';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export const CustomerSalesReport: React.FC<{ state: AgroState }> = ({ state }) => {
  const customerData = useMemo(() => {
    const map = new Map();
    state.bills.forEach(bill => {
      const name = bill.customerName || 'Walk-in';
      const current = map.get(name) || { name, revenue: 0, orders: 0, lastOrder: '', phone: bill.customerPhone };
      map.set(name, {
        name,
        revenue: current.revenue + bill.totalAmount,
        orders: current.orders + 1,
        lastOrder: bill.date,
        phone: bill.customerPhone || current.phone
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 50); // Top 50 customers
  }, [state.bills]);

  const top10 = customerData.slice(0, 10);

  const columns = [
    { header: 'Customer Name', accessor: 'name' as const, className: 'font-black uppercase italic' },
    { header: 'Phone', accessor: 'phone' as const },
    { header: 'Total Orders', accessor: 'orders' as const, className: 'text-center' },
    { header: 'Last Purchased', accessor: 'lastOrder' as const },
    { 
      header: 'Total Value', 
      accessor: (item: any) => `₹${item.revenue.toLocaleString()}`, 
      className: 'text-right font-black',
      footer: (data: any[]) => `Total: ₹${data.reduce((s, i) => s + i.revenue, 0).toLocaleString()}`
    },
  ];

  return (
    <div className="space-y-10">
      <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Top 10 Valued Customers</h4>
        <div className="h-[350px]">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={top10}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                  {top10.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#3b82f6'} />
                  ))}
                </Bar>
             </BarChart>
           </ResponsiveContainer>
        </div>
      </div>

      <ReportLayout 
        title="Customer Revenue Leaderboard"
        data={customerData}
        columns={columns}
        exportFileName="customer_revenue_report"
      />
    </div>
  );
};
