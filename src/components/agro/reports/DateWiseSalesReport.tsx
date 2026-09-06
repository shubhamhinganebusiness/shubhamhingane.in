import React, { useState, useMemo } from 'react';
import { AgroState, AgroBill } from '../types';
import { ReportLayout } from './ReportLayout';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';

export const DateWiseSalesReport: React.FC<{ state: AgroState }> = ({ state }) => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedCustomerId, setSelectedCustomerId] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredBills = useMemo(() => {
    return state.bills.filter(bill => {
      const matchCustomer = selectedCustomerId === 'All' || bill.customerId === selectedCustomerId;
      const matchCategory = selectedCategory === 'All' || bill.items.some(item => item.category === selectedCategory);
      
      const itemDate = new Date(bill.date);
      const start = dateRange.start ? new Date(dateRange.start) : null;
      const end = dateRange.end ? new Date(dateRange.end) : null;
      const matchDate = (!start || itemDate >= start) && (!end || itemDate <= end);
      
      return matchCustomer && matchCategory && matchDate;
    });
  }, [state.bills, selectedCustomerId, selectedCategory, dateRange]);

  const chartData = useMemo(() => {
    const dailyMap = new Map();
    filteredBills.forEach(bill => {
      const date = bill.date;
      const current = dailyMap.get(date) || { date, revenue: 0, orders: 0 };
      dailyMap.set(date, {
        date,
        revenue: current.revenue + bill.totalAmount,
        orders: current.orders + 1
      });
    });

    return Array.from(dailyMap.values())
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredBills]);

  const columns = [
    { header: 'Date', accessor: 'date' as const },
    { header: 'Total Orders', accessor: 'orders' as const, className: 'text-center' },
    { header: 'Average Order', accessor: (item: any) => `₹${Math.round(item.revenue / item.orders).toLocaleString()}` },
    { header: 'Daily Revenue', accessor: (item: any) => `₹${item.revenue.toLocaleString()}`, className: 'text-right font-black', footer: (data: any[]) => `Total: ₹${data.reduce((s, i) => s + i.revenue, 0).toLocaleString()}` },
  ];

  return (
    <div className="space-y-10">
      <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm">
         <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Sales Performance Trend</h4>
         <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

      <ReportLayout 
        title="Date-wise Efficiency Report"
        data={chartData}
        columns={columns}
        exportFileName="date_wise_sales"
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-[10px] font-black outline-none w-32"
            >
              <option value="All">All Customers</option>
              {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-[10px] font-black outline-none w-32"
            >
              <option value="All">All Categories</option>
              <option value="Seed">Seeds</option>
              <option value="Fertilizer">Fertilizers</option>
              <option value="Pesticide">Pesticides</option>
              <option value="Tool">Tools</option>
              <option value="Other">Other</option>
            </select>
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
        }
      />
    </div>
  );
};
