import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { TrendingUp, Users, Eye, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

export const AdminAnalytics: React.FC = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const q = query(collection(db, 'site_stats'), orderBy('date', 'desc'), limit(14));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => {
          const raw = d.data();
          // Format date for display
          const dateObj = new Date(raw.date);
          return {
            ...raw,
            displayDate: dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
          };
        }).reverse();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const totalVisits = stats.reduce((acc, curr) => acc + (curr.visits || 0), 0);
  const avgVisits = stats.length > 0 ? Math.round(totalVisits / stats.length) : 0;
  const todayVisits = stats.length > 0 ? stats[stats.length - 1].visits : 0;

  if (loading) {
    return (
      <div className="p-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Aggregating Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Eye size={24} />
            </div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Today's Visits</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-black text-gray-900">{todayVisits}</span>
            <span className="flex items-center gap-1 text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg">
              <ArrowUpRight size={14} /> Live
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Users size={24} />
            </div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">14d Total Traffic</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-black text-gray-900">{totalVisits}</span>
            <span className="text-gray-400 text-[10px] font-bold uppercase">Last 2 weeks</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Daily Average</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-black text-gray-900">{avgVisits}</span>
            <span className="text-gray-400 text-[10px] font-bold uppercase">Visits / Day</span>
          </div>
        </motion.div>
      </div>

      {/* Chart Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 p-10 rounded-[3rem] shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-1">Traffic Insights</h3>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Visitor trend for the last 14 days</p>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
             <span className="text-primary text-[10px] font-black uppercase tracking-widest">Real-time Data</span>
          </div>
        </div>

        <div className="h-[400px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats}>
              <defs>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="displayDate" 
                stroke="#64748b" 
                fontSize={10} 
                fontWeight="bold"
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                fontWeight="bold"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: 'none', 
                  borderRadius: '16px',
                  color: '#fff',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="visits" 
                stroke="#2563eb" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorVisits)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Breakdown Table */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Historical Log</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[...stats].reverse().map((day, idx) => (
             <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{day.displayDate}</span>
                <span className="text-xl font-black text-gray-900">{day.visits}</span>
                <div className="w-full mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-primary" 
                    style={{ width: `${Math.min((day.visits / (avgVisits * 2)) * 100, 100)}%` }}
                   ></div>
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};
