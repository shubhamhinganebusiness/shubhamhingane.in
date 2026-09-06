import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Calendar, Receipt, CreditCard, 
  Settings, LogOut, LayoutDashboard, ChevronRight,
  TrendingUp, Wallet, Bell, Menu, X, Plus, Utensils, ShoppingBag
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MessMemberManager } from './MessMemberManager';
import { MessAttendanceTracker } from './MessAttendanceTracker';
import { MessBillingSystem } from './MessBillingSystem';
import { MessPaymentHistory } from './MessPaymentHistory';
import { MessDashboardOverview } from './MessDashboardOverview';
import { MessMenuManager } from './MessMenuManager';
import { MessInventoryManager } from './MessInventoryManager';
import { MessStaffManager } from './MessStaffManager';
import { MessExpenseTracker } from './MessExpenseTracker';
import { MessPosSystem } from './MessPosSystem';

export const MessOwnerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [messConfig, setMessConfig] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      fetchMessConfig();
    }
  }, [user]);

  const fetchMessConfig = async () => {
    try {
      // Find mess config using the user's mobile/tenantId
      // Ensure we hit the right collection and ID
      const mobile = user?.mobile || user?.email?.split('@')[0];
      if (!mobile) return;
      
      const docSnap = await getDoc(doc(db, 'mess_owners', mobile));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMessConfig({
          ...data,
          tenantId: data.tenantId || mobile // Fallback to mobile if tenantId missing
        });
      } else {
        // Create default config if missing to ensure tenantId exists
        const defaultConfig = {
          messName: user.name + "'s Mess",
          tenantId: mobile,
          ownerName: user.name,
          mobile: mobile
        };
        setMessConfig(defaultConfig);
      }
    } catch (err) {
      console.error('Error fetching mess config:', err);
    }
  };

  const navItems = [
    { section: 'Main', items: [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'pos', label: 'Billing POS', icon: CreditCard },
      { id: 'members', label: 'Members', icon: Users },
      { id: 'attendance', label: 'Attendance', icon: Utensils },
    ]},
    { section: 'Operations', items: [
      { id: 'menu', label: 'Menu Plan', icon: Menu },
      { id: 'billing', label: 'Monthly Billing', icon: Receipt },
      { id: 'inventory', label: 'Inventory', icon: ShoppingBag },
    ]},
    { section: 'Admin', items: [
      { id: 'staff', label: 'Staff Management', icon: Users },
      { id: 'expenses', label: 'Expenses', icon: TrendingUp },
    ]}
  ];

  if (!user) return <div className="p-20 text-center">Unauthorized access.</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-100 transition-all duration-300 ${isSidebarOpen ? 'w-80' : 'w-20'} ${!isSidebarOpen && 'lg:w-20'} overflow-hidden flex flex-col shadow-2xl shadow-gray-200/50`}>
        <div className="p-8 pb-12 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
              <Utensils size={20} />
            </div>
            <div>
              <h2 className="font-black text-gray-900 tracking-tight leading-none">MESS<span className="text-primary italic">OS</span></h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Tenant Dashboard</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400">
            {isSidebarOpen ? <X size={20} className="lg:hidden" /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
          {navItems.map((group) => (
            <div key={group.section} className="space-y-2">
               <p className={`px-6 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4 ${!isSidebarOpen && 'hidden'}`}>{group.section}</p>
               {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                    activeTab === item.id 
                    ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon size={22} className={activeTab === item.id ? 'text-white' : ''} />
                  <span className={`transition-opacity duration-300 whitespace-nowrap ${!isSidebarOpen && 'hidden'}`}>{item.label}</span>
                </button>
               ))}
            </div>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <button 
            onClick={() => logout()}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={22} />
            <span className={!isSidebarOpen ? 'hidden' : ''}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
           <div className="flex items-center gap-4">
              <div className="lg:hidden">
                 <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-50 rounded-xl">
                   <Menu size={20} />
                 </button>
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                {messConfig?.messName || 'Your Mess Dashboard'}
              </h2>
           </div>

           <div className="flex items-center gap-4">
              <button className="relative p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-all">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
              </button>
              <div className="flex items-center gap-4 pl-4 border-l border-gray-100">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{user.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user.role}</p>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
              </div>
           </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-8 flex-1">
          <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.3 }}
             >
                {activeTab === 'overview' && <MessDashboardOverview tenantId={messConfig?.tenantId} />}
                {activeTab === 'pos' && <MessPosSystem tenantId={messConfig?.tenantId} />}
                {activeTab === 'members' && <MessMemberManager tenantId={messConfig?.tenantId} />}
                {activeTab === 'attendance' && <MessAttendanceTracker tenantId={messConfig?.tenantId} />}
                {activeTab === 'menu' && <MessMenuManager tenantId={messConfig?.tenantId} />}
                {activeTab === 'billing' && <MessBillingSystem tenantId={messConfig?.tenantId} />}
                {activeTab === 'inventory' && <MessInventoryManager tenantId={messConfig?.tenantId} />}
                {activeTab === 'staff' && <MessStaffManager tenantId={messConfig?.tenantId} />}
                {activeTab === 'expenses' && <MessExpenseTracker tenantId={messConfig?.tenantId} />}
                {activeTab === 'payments' && <MessPaymentHistory tenantId={messConfig?.tenantId} />}
             </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
