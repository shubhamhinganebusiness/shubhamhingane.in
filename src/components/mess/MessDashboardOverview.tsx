import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Users, Utensils, Receipt, Wallet, TrendingUp, AlertCircle } from 'lucide-react';

interface Props {
  tenantId?: string;
}

export const MessDashboardOverview: React.FC<Props> = ({ tenantId }) => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    todayBreakfast: 0,
    todayLunch: 0,
    todayDinner: 0,
    monthlyCollection: 0,
    totalPending: 0
  });

  useEffect(() => {
    if (tenantId) {
      fetchStats();
    }
  }, [tenantId]);

  const fetchStats = async () => {
    if (!tenantId) return;
    try {
      // Fetch Total Members
      const membersSnap = await getDocs(query(collection(db, `messes/${tenantId}/members`), where('status', '==', 'Active')));
      const totalMembers = membersSnap.size;

      // Fetch Today's Attendance
      const today = new Date().toISOString().split('T')[0];
      const attendanceSnap = await getDocs(query(collection(db, `messes/${tenantId}/attendance`), where('date', '==', today)));
      let b = 0, l = 0, d = 0;
      attendanceSnap.forEach(doc => {
        const data = doc.data();
        if (data.breakfast) b++;
        if (data.lunch) l++;
        if (data.dinner) d++;
      });

      // Calculate Total Pending (Sum of member balances)
      let pending = 0;
      membersSnap.forEach(doc => {
        pending += (doc.data().balance || 0);
      });

      setStats({
        totalMembers,
        todayBreakfast: b,
        todayLunch: l,
        todayDinner: d,
        monthlyCollection: 0, // Simplified for now
        totalPending: pending
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const statCards = [
    { label: 'Total Members', value: stats.totalMembers, icon: Users, color: 'bg-blue-500', trend: '+12%' },
    { label: 'Today Attendance (L/D)', value: `${stats.todayLunch} / ${stats.todayDinner}`, icon: Utensils, color: 'bg-green-500', trend: 'Live' },
    { label: 'Pending Collections', value: `₹${stats.totalPending}`, icon: Wallet, color: 'bg-red-500', trend: 'Overdue' },
    { label: 'Monthly Sales', value: `₹${stats.monthlyCollection}`, icon: Receipt, color: 'bg-purple-500', trend: '+5%' },
  ];

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${card.color} opacity-5 blur-[40px] -translate-y-12 translate-x-12`} />
            
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 ${card.color.replace('500', '100')} rounded-2xl ${card.color.replace('bg-', 'text-')} group-hover:scale-110 transition-transform`}>
                <card.icon size={24} />
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${card.trend.includes('+') ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                {card.trend}
              </span>
            </div>
            
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
              <h3 className="text-3xl font-black text-gray-900 tracking-tight">{card.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <TrendingUp className="text-primary" />
              Growth Summary
            </h3>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500">Weekly</button>
              <button className="px-4 py-2 bg-primary/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary">Monthly</button>
            </div>
          </div>
          
          <div className="h-64 flex items-end gap-3">
             {[45, 60, 30, 80, 55, 90, 70, 85, 40, 75, 95, 100].map((v, i) => (
                <div key={i} className="flex-1 space-y-2 group">
                   <div className="relative h-full flex flex-col justify-end">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${v}%` }}
                        className="w-full bg-primary/10 group-hover:bg-primary rounded-lg transition-colors cursor-pointer"
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ₹{v * 1000}
                      </div>
                   </div>
                   <p className="text-[8px] font-bold text-gray-400 text-center uppercase">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}</p>
                </div>
             ))}
          </div>
        </div>

        {/* Alerts / Tasks */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
           <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-2">
              <AlertCircle className="text-primary" />
              Critical Tasks
           </h3>
           <div className="space-y-4">
              {[
                { label: 'Generate April Bills', desc: '14 members pending invoice generation.', status: 'urgent' },
                { label: 'Pending Payments', desc: '₹12,400 outstanding from room no. 102 & 204.', status: 'warning' },
                { label: 'Stock Low', desc: 'Check dairy supply levels for dinner.', status: 'info' }
              ].map((task, i) => (
                <div key={i} className="p-6 bg-gray-50 rounded-3xl group cursor-pointer hover:bg-gray-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${task.status === 'urgent' ? 'bg-red-500' : task.status === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                    <div>
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{task.label}</p>
                      <p className="text-xs text-gray-400 font-medium leading-relaxed mt-1">{task.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
