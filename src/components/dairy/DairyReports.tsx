import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  Search, 
  Filter,
  ArrowRight,
  TrendingUp,
  Milk,
  IndianRupee
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { MilkCollection, Farmer } from './types';
import { useAuth } from '../AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export const DairyReports: React.FC = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<'dairy' | 'farmer' | 'fortnight' | 'monthly'>('dairy');
  const [collections, setCollections] = useState<MilkCollection[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>('');
  const [selectedFortnight, setSelectedFortnight] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Fetch all collections
    const q = query(collection(db, 'dairies', user.uid, 'collections'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setCollections(snap.docs.map(d => ({ id: d.id, ...d.data() } as MilkCollection)));
    });

    // Fetch farmers for selection
    const fUnsub = onSnapshot(collection(db, 'dairies', user.uid, 'farmers'), (snap) => {
      setFarmers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Farmer)));
    });

    setLoading(false);
    return () => { unsub(); fUnsub(); };
  }, [user]);

  const getFortnightData = () => {
    if (!selectedFortnight) return [];
    const [year, month, part] = selectedFortnight.split('-');
    return collections.filter(c => {
      const cDate = new Date(c.date);
      const isCorrectMonth = cDate.getFullYear() === parseInt(year) && (cDate.getMonth() + 1) === parseInt(month);
      if (!isCorrectMonth) return false;
      const day = cDate.getDate();
      return part === '1' ? (day >= 1 && day <= 15) : (day >= 16);
    });
  };

  const getFortnightOptions = () => {
    const options: string[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const monthStr = months[d.getMonth()];
      options.push(`${year}-${monthNum}-2|${monthStr} ${year} (16-End)`);
      options.push(`${year}-${monthNum}-1|${monthStr} ${year} (1-15)`);
    }
    return options;
  };

  const filteredData = (() => {
    if (reportType === 'farmer' && selectedFarmerId) {
      return collections.filter(c => c.farmerId === selectedFarmerId);
    }
    if (reportType === 'fortnight') {
      return getFortnightData();
    }
    return collections;
  })();

  // Monthly logic
  const getMonthlyStats = () => {
    const monthly: Record<string, { month: string, total: number, liters: number }> = {};
    collections.forEach(c => {
      if (!c.date) return;
      const month = c.date.substring(0, 7); // YYYY-MM
      if (!monthly[month]) {
        monthly[month] = { month, total: 0, liters: 0 };
      }
      monthly[month].total += c.amount;
      monthly[month].liters += c.quantity;
    });
    return Object.values(monthly).sort((a,b) => a.month.localeCompare(b.month));
  };

  const stats = {
    totalLiters: filteredData.reduce((acc, c) => acc + c.quantity, 0),
    totalAmount: filteredData.reduce((acc, c) => acc + c.amount, 0),
    entryCount: filteredData.length
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Report Selector */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
          {[
            { id: 'dairy', label: 'Dairy Sheet', icon: FileText },
            { id: 'farmer', label: 'Farmer Sheet', icon: Users },
            { id: 'fortnight', label: '15-Day Sheet', icon: Calendar },
            { id: 'monthly', label: 'Monthly Summary', icon: TrendingUp },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setReportType(type.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                reportType === type.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <type.icon size={18} />
              {type.label}
            </button>
          ))}
        </div>

        <button 
          onClick={() => {
            const csv = filteredData.map(d => `${d.date},${d.shift},${d.farmerName},${d.quantity},${d.fat},${d.snf},${d.amount}`).join('\n');
            const blob = new Blob([`Date,Shift,Farmer,Qty,Fat,SNF,Amount\n${csv}`], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', `${reportType}_report.csv`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* View Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {reportType === 'farmer' && (
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex-1 flex items-center gap-4">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-widest min-w-fit">Select Farmer:</label>
            <select
              value={selectedFarmerId}
              onChange={(e) => setSelectedFarmerId(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold"
            >
              <option value="">Choose Farmer...</option>
              {farmers.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.uniqueId})</option>
              ))}
            </select>
          </div>
        )}

        {reportType === 'fortnight' && (
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex-1 flex items-center gap-4">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-widest min-w-fit">Select Period:</label>
            <select
              value={selectedFortnight}
              onChange={(e) => setSelectedFortnight(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold"
            >
              <option value="">Choose 15-Day Period...</option>
              {getFortnightOptions().map(opt => {
                const [val, label] = opt.split('|');
                return <option key={val} value={val}>{label}</option>;
              })}
            </select>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Milk size={32} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Milk</p>
            <h4 className="text-3xl font-black text-gray-900">{stats.totalLiters.toFixed(1)} <span className="text-lg font-bold">Ltr</span></h4>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6"
        >
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <IndianRupee size={32} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Billing</p>
            <h4 className="text-3xl font-black text-gray-900">₹{stats.totalAmount.toLocaleString()}</h4>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6"
        >
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
            <FileText size={32} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Entries</p>
            <h4 className="text-3xl font-black text-gray-900">{stats.entryCount}</h4>
          </div>
        </motion.div>
      </div>

      {reportType === 'monthly' ? (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-xl overflow-hidden h-96">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
             <TrendingUp className="text-primary" />
             Monthly Revenue Progress
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={getMonthlyStats()}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="total" stroke="var(--color-primary, #6366f1)" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Date / Shift</th>
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Farmer</th>
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Qty (L)</th>
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Fat / SNF</th>
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.slice(0, 20).map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-gray-900">{entry.date}</div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-primary mt-1">{entry.shift}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-gray-900">{entry.farmerName}</div>
                      <div className="text-xs font-mono text-gray-500">#{entry.uniqueId}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-black text-lg">{entry.quantity.toFixed(1)}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-gray-600">{entry.fat}% fat / {entry.snf}% snf</div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="text-lg font-black text-primary">₹{entry.amount.toFixed(2)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredData.length === 0 && (
            <div className="py-20 text-center">
               <Milk className="mx-auto text-gray-200 mb-4" size={64} />
               <p className="text-gray-400 font-bold">No records found for this view</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
