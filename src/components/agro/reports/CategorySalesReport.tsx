import React, { useMemo } from 'react';
import { AgroState } from '../types';
import { ReportLayout } from './ReportLayout';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

export const CategorySalesReport: React.FC<{ state: AgroState }> = ({ state }) => {
  const categoryData = useMemo(() => {
    const map = new Map();
    state.bills.forEach(bill => {
      bill.items.forEach(item => {
        const cat = item.category || 'Other';
        const current = map.get(cat) || { category: cat, revenue: 0, quantity: 0 };
        map.set(cat, {
          category: cat,
          revenue: current.revenue + item.total,
          quantity: current.quantity + item.quantity
        });
      });
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [state.bills]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

  const columns = [
    { header: 'Product Category', accessor: 'category' as const, className: 'font-black uppercase italic' },
    { header: 'Units Sold', accessor: 'quantity' as const, className: 'text-center' },
    { 
      header: 'Total Revenue', 
      accessor: (item: any) => `₹${item.revenue.toLocaleString()}`, 
      className: 'text-right font-black',
      footer: (data: any[]) => `Total: ₹${data.reduce((s, i) => s + i.revenue, 0).toLocaleString()}`
    },
    {
      header: 'Market Share',
      accessor: (item: any) => {
        const total = categoryData.reduce((s, i) => s + i.revenue, 0);
        const percent = ((item.revenue / total) * 100).toFixed(1);
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-[10px] w-8">{percent}%</span>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8 text-center">Revenue Distribution</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="revenue"
                  nameKey="category"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => `₹${value.toLocaleString()}`}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8 text-center">Sold Units by Category</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis type="number" fontSize={10} hide />
                <YAxis dataKey="category" type="category" fontSize={10} axisLine={false} tickLine={false} width={80} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="quantity" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <ReportLayout 
        title="Category Performance Analysis"
        data={categoryData}
        columns={columns}
        exportFileName="category_sales_report"
      />
    </div>
  );
};
