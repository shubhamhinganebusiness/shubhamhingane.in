import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Calendar, 
  Download, PieChart, Target, Zap, Bot, ArrowRight,
  Info, RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Cell, PieChart as RePieChart, Pie
} from 'recharts';
import { motion } from 'motion/react';

const data = [
  { name: 'Jan', sales: 4000, profit: 2400 },
  { name: 'Feb', sales: 3000, profit: 1398 },
  { name: 'Mar', sales: 2000, profit: 9800 },
  { name: 'Apr', sales: 2780, profit: 3908 },
  { name: 'May', sales: 1890, profit: 4800 },
  { name: 'Jun', sales: 2390, profit: 3800 },
  { name: 'Jul', sales: 3490, profit: 4300 },
];

const categoryData = [
  { name: 'Sofas', value: 400, color: '#3B82F6' },
  { name: 'Dining', value: 300, color: '#10B981' },
  { name: 'TVs', value: 300, color: '#F59E0B' },
  { name: 'Laptops', value: 200, color: '#8B5CF6' },
];

export const SalesInsights = () => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [reportType, setReportType] = useState('Overview');

  const runAiPrediction = () => {
    setIsAiLoading(true);
    setTimeout(() => setIsAiLoading(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* AI Header Section */}
      <div className="bg-gradient-to-r from-gray-900 to-indigo-950 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
         
         <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
                     <Bot size={24} className="text-primary md:w-7 md:h-7" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight">AI Sales Assistant</h2>
               </div>
               <h3 className="text-2xl md:text-4xl font-black mb-4 leading-tight">Predictive Restocking & <br className="hidden md:block"/>Sales Forecasting</h3>
               <p className="text-white/60 font-medium text-sm md:text-lg mb-8 leading-relaxed">
                  Our Gemini-powered engine analyzes 24 months of sales velocity, seasonal trends, and local demand to predict your inventory needs.
               </p>
               <button 
                onClick={runAiPrediction}
                disabled={isAiLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl shadow-black/20 shrink-0"
               >
                 {isAiLoading ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
                 {isAiLoading ? 'Analyzing Trends...' : 'Generate AI Insights'}
               </button>
            </div>

            <div className="flex-1 grid grid-cols-1 xs:grid-cols-2 gap-3 md:gap-4 w-full">
               {[
                 { label: 'Forecasted Revenue', value: '+18%', sub: 'Next 30 Days' },
                 { label: 'Demand Surge', value: 'Electronic', sub: 'Category Focus' },
                 { label: 'Churn Risk', value: '4.2%', sub: 'Customer Health' },
                 { label: 'Recommended Stock', value: '142', sub: 'Units Needed' },
               ].map((card, i) => (
                 <div key={i} className="bg-white/5 backdrop-blur border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-3xl group hover:bg-white/10 transition-all cursor-default">
                    <p className="text-[10px] font-black uppercase tracking-[2px] text-white/40 mb-2 truncate">{card.label}</p>
                    <p className="text-xl md:text-2xl font-black text-white group-hover:text-primary transition-all">{card.value}</p>
                    <p className="text-[10px] font-medium text-white/30 truncate">{card.sub}</p>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Sales Trend */}
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-xl font-black text-gray-900">Revenue Trends</h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Monthly performance</p>
               </div>
               <button className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-primary transition-all"><Download size={20}/></button>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>

         {/* Category Distribution */}
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-xl font-black text-gray-900">Category Share</h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Sales by department</p>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Qtr</span>
               </div>
            </div>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                 <span className="text-[10px] font-black text-gray-400 uppercase">Total Sales</span>
                 <span className="text-2xl font-black text-gray-900">1.2k</span>
              </div>
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 gap-4 mt-4">
               {categoryData.map(cat => (
                 <div key={cat.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs font-bold text-gray-900">{cat.name}</span>
                    <span className="text-[10px] text-gray-400 font-bold ml-auto">{cat.value} Orders</span>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* AI Table Recommendations */}
      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
         <div className="flex items-center gap-3 mb-8">
            <Zap className="text-primary" size={24} />
            <h3 className="text-xl font-black text-gray-900">AI Intelligent Recommendations</h3>
         </div>
         
         <div className="space-y-4">
            {[
              { type: 'Restock', product: 'Premium Tan Leather Sofa', msg: 'Stock velocity increased by 40% this week. Order 15 units immediately to avoid stockout.', urgency: 'High' },
              { type: 'Bundling', product: 'OLED TV + Home Theater', msg: 'Current sales data suggests customers prefer buying these together. Create a bundle for 5% discount.', urgency: 'Medium' },
              { type: 'Price Correction', product: 'Gaming Laptop Pro', msg: 'Competitor prices are 2% lower. Adjust price slightly to stay competitive during seasonal peak.', urgency: 'Low' },
            ].map((rec, i) => (
              <div key={i} className="flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-[2rem] bg-gray-50 border border-transparent hover:border-primary/20 transition-all">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                   rec.urgency === 'High' ? 'bg-red-100 text-red-500' : 
                   rec.urgency === 'Medium' ? 'bg-orange-100 text-orange-500' : 'bg-blue-100 text-blue-500'
                 }`}>
                    <Target size={20} />
                 </div>
                 <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{rec.type}</span>
                       <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${
                         rec.urgency === 'High' ? 'bg-red-500 text-white' : 
                         rec.urgency === 'Medium' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                       }`}>{rec.urgency}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-lg">{rec.product}</h4>
                    <p className="text-sm text-gray-500 mt-1">{rec.msg}</p>
                 </div>
                 <button className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest hover:gap-4 transition-all whitespace-nowrap">
                    Apply Action
                    <ArrowRight size={14} />
                 </button>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};
