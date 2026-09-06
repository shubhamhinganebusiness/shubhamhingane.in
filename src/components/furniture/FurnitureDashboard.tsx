import React, { useState } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, Warehouse, 
  Layers, Globe, Leaf, Truck, Receipt, 
  BarChart3, Megaphone, Bell, ClipboardCheck, 
  Settings, LogOut, Menu, X, Search, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';
import { SmartBilling } from './SmartBilling';
import { InventoryManager } from './InventoryManager';
import { WarehouseControl } from './WarehouseControl';
import { SalesInsights } from './SalesInsights';
import { InventorySync } from './InventorySync';
import { SupplierManager } from './SupplierManager';
import { Accounting } from './Accounting';
import { Promotions } from './Promotions';
import { StockAudit } from './StockAudit';
import { Overview } from './Overview';
import { ExpenseManager } from './ExpenseManager';
import { GlobalSettings } from './GlobalSettings';

// Lazy load modules (placeholders for now)
const ModulePlaceholder = ({ name }: { name: string }) => (
  <div className="p-8 bg-white rounded-3xl border border-gray-100 min-h-[400px] flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
        <LayoutDashboard size={32} />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{name}</h2>
      <p className="text-gray-500">Module under development...</p>
    </div>
  </div>
);

const modules = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'billing', label: 'Smart Billing', icon: ShoppingCart },
  { id: 'showroom', label: 'Showroom Stock', icon: Package },
  { id: 'warehouse', label: 'Warehouse Control', icon: Warehouse },
  { id: 'variants', label: 'Product Variants', icon: Layers },
  { id: 'sync', label: 'Online Sync', icon: Globe },
  { id: 'materials', label: 'Raw Materials', icon: Leaf },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
  { id: 'accounting', label: 'Accounting', icon: Receipt },
  { id: 'insights', label: 'Sales Insights', icon: BarChart3 },
  { id: 'promotions', label: 'Promotions', icon: Megaphone },
  { id: 'expenses', label: 'Expense Tracker', icon: Receipt },
  { id: 'notifications', label: 'Alerts', icon: Bell },
  { id: 'audit', label: 'Stock Audit', icon: ClipboardCheck },
  { id: 'settings', label: 'Global Settings', icon: Settings },
];

export const FurnitureDashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1280;
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-[60] md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Collapsible Tablet Dock & Desktop Drawer */}
      <aside 
        className={`${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } fixed md:relative inset-y-0 left-0 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col z-[70]`}
      >
        <div className="p-5 flex items-center justify-between border-b border-gray-50">
          {(isSidebarOpen || isMobileMenuOpen) ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <Package size={18} />
              </div>
              <span className="font-bold text-gray-900 tracking-tight">FurniElec</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white mx-auto">
              <Package size={18} />
            </div>
          )}
          
          {(isSidebarOpen || isMobileMenuOpen) && (
            <button 
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsMobileMenuOpen(false);
                } else {
                  setIsSidebarOpen(!isSidebarOpen);
                }
              }}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {modules.map((mod) => {
            const isActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => {
                  setActiveModule(mod.id);
                  setIsMobileMenuOpen(false);
                }}
                title={mod.label}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-gray-500 hover:bg-gray-100'
                } ${!isSidebarOpen && !isMobileMenuOpen ? 'justify-center px-0' : ''}`}
              >
                <mod.icon size={18} className="shrink-0" />
                {(isSidebarOpen || isMobileMenuOpen) && (
                  <span className="font-medium text-xs whitespace-nowrap">{mod.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
           <button 
            onClick={() => logout()}
            title="Logout"
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all ${
              !isSidebarOpen && !isMobileMenuOpen ? 'justify-center px-0' : ''
            }`}
           >
             <LogOut size={18} className="shrink-0" />
             {(isSidebarOpen || isMobileMenuOpen) && <span className="font-medium text-xs">Logout</span>}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-20 px-4 md:px-8 flex items-center justify-between z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-2xl w-48 md:w-96 border border-transparent focus-within:border-gray-200 focus-within:bg-white transition-all">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none focus:ring-0 text-sm w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-all">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-2 md:pl-6 border-l border-gray-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">{user?.displayName || 'Admin User'}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Store Manager</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold shrink-0">
                {user?.displayName?.[0] || <User size={20} />}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Section */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeModule === 'dashboard' && <Overview />}
              {activeModule === 'billing' && <SmartBilling />}
              {activeModule === 'showroom' && <InventoryManager />}
              {activeModule === 'warehouse' && <WarehouseControl />}
              {activeModule === 'sync' && <InventorySync />}
              {activeModule === 'suppliers' && <SupplierManager />}
              {activeModule === 'accounting' && <Accounting />}
              {activeModule === 'insights' && <SalesInsights />}
              {activeModule === 'promotions' && <Promotions />}
              {activeModule === 'expenses' && <ExpenseManager />}
              {activeModule === 'audit' && <StockAudit />}
              {activeModule === 'settings' && <GlobalSettings />}
              
              {!['dashboard', 'billing', 'showroom', 'warehouse', 'sync', 'suppliers', 'accounting', 'insights', 'promotions', 'audit', 'expenses', 'settings'].includes(activeModule) && (
                <ModulePlaceholder name={modules.find(m => m.id === activeModule)?.label || ''} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
