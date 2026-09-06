import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Settings as SettingsIcon, 
  ClipboardList, 
  BarChart3, 
  ArrowLeft,
  Search,
  Plus,
  Droplets,
  TrendingUp,
  Package,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DairySettings, Farmer, MilkCollection } from './types';

const MOCK_SETTINGS: DairySettings = {
  dairyName: "Krishna Dairy Demo",
  ownerName: "Shubham Hingane",
  cowRate: 35.5,
  buffaloRate: 52.0
};

const MOCK_FARMERS: Farmer[] = [
  { id: '1', uniqueId: '101', name: 'Rahul Patil', contact: '9876543210', milkType: 'Cow' },
  { id: '2', uniqueId: '102', name: 'Sanjay Deshmukh', contact: '8877665544', milkType: 'Buffalo' },
  { id: '3', uniqueId: '103', name: 'Anita Pawar', contact: '7766554433', milkType: 'Cow' },
  { id: '4', uniqueId: '104', name: 'Vijay Kadam', contact: '9922334455', milkType: 'Buffalo' },
];

const MOCK_COLLECTIONS: MilkCollection[] = [
  { id: 'c1', farmerId: '1', farmerName: 'Rahul Patil', uniqueId: '101', quantity: 12.5, fat: 4.2, snf: 8.5, rate: 35.5, amount: 443.75, shift: 'Morning', date: new Date().toISOString(), timestamp: {} },
  { id: 'c2', farmerId: '2', farmerName: 'Sanjay Deshmukh', uniqueId: '102', quantity: 20.0, fat: 6.8, snf: 9.0, rate: 52.0, amount: 1040.0, shift: 'Morning', date: new Date().toISOString(), timestamp: {} },
  { id: 'c3', farmerId: '3', farmerName: 'Anita Pawar', uniqueId: '103', quantity: 8.0, fat: 3.9, snf: 8.4, rate: 35.5, amount: 284.0, shift: 'Morning', date: new Date().toISOString(), timestamp: {} },
];

export const DairyDemoDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'collection' | 'farmers' | 'reports'>('collection');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'collection', label: 'Milk Collection', icon: ClipboardList },
    { id: 'farmers', label: 'Farmers', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-6 gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-gray-900 leading-none">
                    {MOCK_SETTINGS.dairyName}
                  </h1>
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                    Demo Mode
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  Owner: {MOCK_SETTINGS.ownerName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                    activeTab === tab.id 
                      ? 'bg-white text-primary shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'collection' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-8">
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-4 max-w-2xl">
                   <div className="bg-amber-100 p-2 rounded-xl text-amber-600 mt-1">
                      <Plus size={20} />
                   </div>
                   <div>
                      <h4 className="font-bold text-amber-900">Read-Only Experience</h4>
                      <p className="text-sm text-amber-700/80">You are viewing the live demo. Form submission and data persistence are disabled. Real users can use mobile apps or web portals to sync collection data directly to the ledger.</p>
                   </div>
                </div>
                
                <div className="text-right">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-1">Today's Rates</p>
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100">
                         <Droplets size={16} className="text-blue-500" />
                         <span className="text-sm font-bold">Cow: ₹{MOCK_SETTINGS.cowRate}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100">
                         <Droplets size={16} className="text-gray-900" />
                         <span className="text-sm font-bold">Buffalo: ₹{MOCK_SETTINGS.buffaloRate}</span>
                      </div>
                   </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden mb-8">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                   <h3 className="font-black text-gray-900 uppercase tracking-tighter text-xl">Recent Morning Collection</h3>
                   <button disabled className="text-[10px] font-black text-gray-400 bg-gray-50 px-4 py-2 rounded-xl uppercase tracking-widest">
                      Export Ledger
                   </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-[2px] text-gray-400">
                        <th className="px-8 py-6">Farmer</th>
                        <th className="px-8 py-6">ID</th>
                        <th className="px-8 py-6">Qty (L)</th>
                        <th className="px-8 py-6">Fat/SNF</th>
                        <th className="px-8 py-6">Rate</th>
                        <th className="px-8 py-6 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {MOCK_COLLECTIONS.map((c) => (
                        <tr key={c.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400">
                                   {c.farmerName.charAt(0)}
                                </div>
                                <span className="font-bold text-gray-900">{c.farmerName}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6 font-mono text-xs text-gray-500">{c.uniqueId}</td>
                          <td className="px-8 py-6 font-bold text-gray-900">{c.quantity}</td>
                          <td className="px-8 py-6 text-sm text-gray-500">{c.fat} / {c.snf}</td>
                          <td className="px-8 py-6 text-sm text-gray-500">₹{c.rate}</td>
                          <td className="px-8 py-6 text-right font-black text-primary">₹{c.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'farmers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by ID or Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>
                
                <button disabled className="px-6 py-3 bg-gray-100 text-gray-400 rounded-xl font-bold uppercase text-xs tracking-widest cursor-not-allowed">
                  Add Farmer (Disabled)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_FARMERS.map((farmer) => (
                  <div
                    key={farmer.id}
                    className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-tr from-blue-50 to-indigo-50 text-primary rounded-2xl flex items-center justify-center font-black text-xl border border-blue-100">
                          {farmer.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900 tracking-tight">{farmer.name}</h3>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Farmer ID: {farmer.uniqueId}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 py-4 border-y border-gray-50 mb-6">
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Milk Type</p>
                          <div className="flex items-center gap-2">
                             <Droplets size={14} className={farmer.milkType === 'Cow' ? 'text-blue-500' : 'text-gray-900'} />
                             <span className="font-bold text-sm">{farmer.milkType}</span>
                          </div>
                       </div>
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Contact</p>
                          <p className="font-bold text-sm text-gray-900">{farmer.contact}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-gray-50 p-3 rounded-xl">
                          <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Total Milk</p>
                          <p className="text-xs font-black text-gray-900">142.5 L</p>
                       </div>
                       <div className="bg-gray-50 p-3 rounded-xl">
                          <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Avg Fat</p>
                          <p className="text-xs font-black text-gray-900">4.2%</p>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { label: 'Total Volume', value: '1,240 L', sub: 'Last 7 Days', color: 'text-blue-600', bg: 'bg-blue-50', icon: Package },
                   { label: 'Total Payout', value: '₹54,200', sub: 'Last 7 Days', color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp },
                   { label: 'Average Fat', value: '4.8%', sub: 'Combined', color: 'text-amber-600', bg: 'bg-amber-50', icon: BarChart3 },
                 ].map((kpi, i) => (
                   <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-lg">
                      <div className="flex items-center gap-4 mb-4">
                         <div className={`w-12 h-12 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center`}>
                            <kpi.icon size={24} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{kpi.label}</p>
                            <h3 className="text-2xl font-black text-gray-900">{kpi.value}</h3>
                         </div>
                      </div>
                      <p className="text-xs text-gray-400 font-medium">{kpi.sub}</p>
                   </div>
                 ))}
              </div>

              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm text-center">
                 <div className="max-w-md mx-auto">
                    <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                    <h3 className="text-2xl font-black text-gray-900 mb-4">Analytics Engine Active</h3>
                    <p className="text-gray-500 font-medium mb-8">
                       Our demo analytics provide detailed insights into seasonal trends and farmer production efficiency. Professional users can generate customized PDF reports and export payroll information.
                    </p>
                    <button disabled className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-xs tracking-widest cursor-not-allowed">
                       Generate Detailed Analytics (View Subscription Models)
                    </button>
                 </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer Info */}
      <footer className="bg-gray-900 text-white py-6">
         <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[4px] text-white/40 mb-1">Experimental Sandbox</p>
            <p className="text-sm font-medium text-white/60">Krishna Dairy Management Demo Environment • Handcrafted by ANTIGRAVITY</p>
         </div>
      </footer>
    </div>
  );
};
