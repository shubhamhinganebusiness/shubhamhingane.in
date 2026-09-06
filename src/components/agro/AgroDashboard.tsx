import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sprout, Wheat, Package, Users, Receipt, Settings, 
  LogOut, TrendingUp, Menu, X, Building2, Truck, Activity,
  FileCheck, ShieldAlert, FileText, Calendar, Layers, Bell,
  Undo2, ClipboardList, Wallet
} from 'lucide-react';
import { auth, db, onAuthStateChanged } from '../../lib/firebase';
import { 
  collection, query, onSnapshot, doc, getDoc, 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  AgroState, AgroProduct, AgroCustomer, AgroBill, 
  AgroSettings, AgroSupplier, AgroPurchase, 
  AgroDamage, AgroChallan, AgroBatch,
  AgroRole, AgroReturn, AgroOrder, AgroSalary, AgroTransaction
} from './types';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Tab Components
import { OverviewTab } from './OverviewTab';
import { InventoryTab } from './InventoryTab';
import { BillingTab } from './BillingTab';
import { PurchasesTab } from './PurchasesTab';
import { CustomersTab } from './CustomersTab';
import { SuppliersTab } from './SuppliersTab';
import { LedgerTab } from './LedgerTab';
import { DamagesTab } from './DamagesTab';
import { ChallansTab } from './ChallansTab';
import { SalesTab } from './SalesTab';
import { SettingsTab } from './SettingsTab';
import { ReportsTab } from './ReportsTab';
import { BatchesTab } from './BatchesTab';
import { OrdersTab } from './OrdersTab';
import { ReturnsTab } from './ReturnsTab';
import { EmployeesTab } from './EmployeesTab';
import { InvoicePrintModal } from './InvoicePrintModal';

export const AgroDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);
  const [printBill, setPrintBill] = useState<AgroBill | null>(null);
  const [billToEdit, setBillToEdit] = useState<AgroBill | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [state, setState] = useState<AgroState>({
    settings: null,
    products: [],
    customers: [],
    suppliers: [],
    bills: [],
    purchases: [],
    damages: [],
    challans: [],
    batches: [],
    returns: [],
    orders: [],
    salaries: [],
    transactions: [],
    loading: true
  });
  const navigate = useNavigate();

  useEffect(() => {
    let unsubProducts: (() => void) | null = null;
    let unsubCustomers: (() => void) | null = null;
    let unsubBills: (() => void) | null = null;
    let unsubSuppliers: (() => void) | null = null;
    let unsubPurchases: (() => void) | null = null;
    let unsubDamages: (() => void) | null = null;
    let unsubChallans: (() => void) | null = null;
    let unsubBatches: (() => void) | null = null;
    let unsubReturns: (() => void) | null = null;
    let unsubOrders: (() => void) | null = null;
    let unsubSalaries: (() => void) | null = null;
    let unsubEmployees: (() => void) | null = null;
    let unsubTransactions: (() => void) | null = null;
    let unsubSettings: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubProducts?.();
      unsubCustomers?.();
      unsubBills?.();
      unsubSuppliers?.();
      unsubPurchases?.();
      unsubDamages?.();
      unsubChallans?.();
      unsubBatches?.();
      unsubReturns?.();
      unsubOrders?.();
      unsubSalaries?.();
      unsubEmployees?.();
      unsubTransactions?.();
      unsubSettings?.();

      if (!user) {
        setState(prev => ({ ...prev, loading: false }));
        navigate('/agro-login');
        return;
      }

      const adminEmails = [
        'jamkhednewsnetwork@gmail.com', 
        'shubhamingane7719@gmail.com', 
        'shubhamhingane@gmail.com', 
        'admin@agroshop.com', 
        '7719959593@admin.com',
        'shubhamhinganebusiness@gmail.com'
      ];
      const email = user.email?.toLowerCase() || '';
      const mobileFromEmail = email.split('@')[0];
      
      const isAdminUser = adminEmails.map(e => e.toLowerCase()).includes(email);
      
      if (!email.includes('@agroshop.com') && !isAdminUser) {
          setState(prev => ({ ...prev, loading: false }));
          navigate('/agro-login');
          return;
      }

      const shopQueryId = searchParams.get('shop');
      
      const resolveShopAndListen = async () => {
        // Reset state before switching shops to avoid ghost data
        setState({
          settings: null,
          products: [],
          customers: [],
          suppliers: [],
          bills: [],
          purchases: [],
          damages: [],
          challans: [],
          batches: [],
          returns: [],
          orders: [],
          employees: [],
          salaries: [],
          transactions: [],
          loading: true
        });

        let shopId = mobileFromEmail;
        
        if (!isAdminUser || !shopQueryId) {
          try {
            const ownerDoc = await getDoc(doc(db, 'shop_owners', mobileFromEmail));
            if (ownerDoc.exists()) {
              shopId = ownerDoc.data().shopId || mobileFromEmail;
            }
          } catch (err) {
            console.error('Error resolving shopId:', err);
          }
        } else if (isAdminUser && shopQueryId) {
          shopId = shopQueryId;
        }

        if (!shopId && isAdminUser) {
           shopId = user.uid;
        }

        setCurrentShopId(shopId);
        const shopRef = doc(db, 'agro_shops', shopId);

        // Fetch User Role
        try {
          const userDoc = await getDoc(doc(shopRef, 'users', user.uid));
          if (userDoc.exists()) {
             setState(prev => ({ ...prev, userRole: userDoc.data().role as AgroRole }));
          } else if (isAdminUser) {
             setState(prev => ({ ...prev, userRole: 'Admin' }));
          } else {
             // Default for newly registered mobile owners is Admin
             setState(prev => ({ ...prev, userRole: 'Admin' }));
          }
        } catch (err) {
          console.warn('Role fetch failed', err);
        }

        // Fetch settings - Use onSnapshot for real-time updates from root document
        try {
          unsubSettings = onSnapshot(shopRef, (snap) => {
            if (snap.exists() && snap.data().settings) {
              setState(prev => ({ ...prev, settings: snap.data().settings as AgroSettings }));
            } else if (isAdminUser) {
              setState(prev => ({ ...prev, settings: { shopName: 'Shop Overview (Admin)', ownerName: 'Admin', address: '', gstin: '', contact: '' } }));
            }
          }, (err) => {
            console.warn('Settings access restricted', err.message);
          });
        } catch (err: any) {
          console.warn('Settings setup failed', err.message);
        }

        // Subscriptions
        try {
          unsubProducts = onSnapshot(collection(shopRef, 'products'), (snap) => {
            const products = snap.docs.map(d => ({ id: d.id, ...d.data() } as AgroProduct));
            setState(prev => ({ ...prev, products }));
          }, (err) => {
            handleFirestoreError(err, OperationType.LIST, `agro_shops/${shopId}/products`);
          });

          unsubCustomers = onSnapshot(collection(shopRef, 'customers'), (snap) => {
            const customers = snap.docs.map(d => ({ id: d.id, ...d.data() } as AgroCustomer));
            setState(prev => ({ ...prev, customers }));
          }, (err) => {
            handleFirestoreError(err, OperationType.LIST, `agro_shops/${shopId}/customers`);
          });

          unsubBills = onSnapshot(collection(shopRef, 'bills'), (snap) => {
            const bills = snap.docs.map(d => ({ id: d.id, ...d.data() } as AgroBill));
            setState(prev => ({ ...prev, bills }));
          }, (err) => {
            handleFirestoreError(err, OperationType.LIST, `agro_shops/${shopId}/bills`);
          });

          unsubSuppliers = onSnapshot(collection(shopRef, 'suppliers'), (snap) => {
            const suppliers = snap.docs.map(d => ({ id: d.id, ...d.data() } as AgroSupplier));
            setState(prev => ({ ...prev, suppliers }));
          }, (err) => {
            handleFirestoreError(err, OperationType.LIST, `agro_shops/${shopId}/suppliers`);
          });

          unsubPurchases = onSnapshot(collection(shopRef, 'purchases'), (snap) => {
            const purchases = snap.docs.map(d => ({ id: d.id, ...d.data() } as AgroPurchase));
            setState(prev => ({ ...prev, purchases }));
          }, (err) => {
            handleFirestoreError(err, OperationType.LIST, `agro_shops/${shopId}/purchases`);
          });

          unsubDamages = onSnapshot(collection(shopRef, 'damages'), (snap) => {
            const damages = snap.docs.map(d => ({ id: d.id, ...d.data() } as AgroDamage));
            setState(prev => ({ ...prev, damages }));
          }, (err) => {
            handleFirestoreError(err, OperationType.LIST, `agro_shops/${shopId}/damages`);
          });

          unsubChallans = onSnapshot(collection(shopRef, 'challans'), (snap) => {
            const challans = snap.docs.map(d => ({ id: d.id, ...d.data() } as AgroChallan));
            setState(prev => ({ ...prev, challans }));
          }, (err) => {
            handleFirestoreError(err, OperationType.LIST, `agro_shops/${shopId}/challans`);
          });

          unsubBatches = onSnapshot(collection(shopRef, 'batches'), (snap) => {
            const batches = snap.docs.map(d => ({ id: d.id, ...d.data() } as AgroBatch));
            setState(prev => ({ ...prev, batches }));
          }, (err) => {
            handleFirestoreError(err, OperationType.LIST, `agro_shops/${shopId}/batches`);
          });

          unsubReturns = onSnapshot(collection(shopRef, 'returns'), (snap) => {
            const returns = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            setState(prev => ({ ...prev, returns }));
          });

          unsubOrders = onSnapshot(collection(shopRef, 'orders'), (snap) => {
            const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            setState(prev => ({ ...prev, orders }));
          });

          unsubSalaries = onSnapshot(collection(shopRef, 'salaries'), (snap) => {
            const salaries = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            setState(prev => ({ ...prev, salaries }));
          });

          unsubEmployees = onSnapshot(collection(shopRef, 'employees'), (snap) => {
            const employees = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            setState(prev => ({ ...prev, employees }));
          }, (err) => {
            handleFirestoreError(err, OperationType.LIST, `agro_shops/${shopId}/employees`);
          });

          unsubTransactions = onSnapshot(collection(shopRef, 'transactions'), (snap) => {
            const transactions = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            setState(prev => ({ ...prev, transactions, loading: false }));
          }, (err) => {
            console.error('Transactions load fail', err);
            setState(prev => ({ ...prev, loading: false }));
          });
        } catch (subErr) {
          console.error('Subscription setup failed:', subErr);
          setState(prev => ({ ...prev, loading: false }));
        }
      };

      resolveShopAndListen();
    });

    const timeoutId = setTimeout(() => {
      setState(prev => ({ ...prev, loading: false }));
    }, 10000);

    return () => {
      unsubscribeAuth();
      unsubProducts?.();
      unsubCustomers?.();
      unsubBills?.();
      unsubSuppliers?.();
      unsubPurchases?.();
      unsubDamages?.();
      unsubChallans?.();
      unsubBatches?.();
      unsubEmployees?.();
      unsubSettings?.();
      clearTimeout(timeoutId);
    };
  }, [navigate, searchParams]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const [availableShops, setAvailableShops] = useState<{id: string, name: string}[]>([]);
  useEffect(() => {
    const fetchCompanies = async () => {
      const user = auth.currentUser;
      if (!user) return;
      
      const adminEmails = [
        'jamkhednewsnetwork@gmail.com', 
        'shubhamingane7719@gmail.com', 
        'shubhamhingane@gmail.com', 
        'admin@agroshop.com', 
        '7719959593@admin.com',
        'shubhamhinganebusiness@gmail.com'
      ];
      const email = user.email?.toLowerCase() || '';
      const mobileFromEmail = email.split('@')[0];
      const isAdminUser = adminEmails.map(e => e.toLowerCase()).includes(email);

      onSnapshot(collection(db, 'shop_owners'), (snap) => {
        let shops = snap.docs.map(d => ({ 
          id: d.data().shopId || d.id, 
          name: d.data().shopName || `Shop ${d.data().shopId || d.id}`,
          mobile: d.data().mobile
        }));

        // If not admin, only show shops where mobile matches the logged in user's mobile (from email)
        if (!isAdminUser) {
          shops = shops.filter(s => s.mobile === mobileFromEmail);
        }

        const uniqueShops = Array.from(new Map(shops.map(s => [s.id, { id: s.id, name: s.name }])).values());
        setAvailableShops(uniqueShops);
      });
    };
    fetchCompanies();
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Sprout, roles: ['Admin', 'Manager', 'Cashier', 'Viewer'] },
    { id: 'billing', label: 'New Bill/Estimate', icon: Receipt, roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['Admin', 'Manager', 'Cashier', 'Viewer'] },
    { id: 'batches', label: 'Product Batches', icon: Layers, roles: ['Admin', 'Manager', 'Cashier', 'Viewer'] },
    { id: 'purchases', label: 'Purchases', icon: Truck, roles: ['Admin', 'Manager'] },
    { id: 'customers', label: 'Customers (Parties)', icon: Users, roles: ['Admin', 'Manager', 'Cashier', 'Viewer'] },
    { id: 'orders', label: 'Orders & Booking', icon: ClipboardList, roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'returns', label: 'Returns', icon: Undo2, roles: ['Admin', 'Manager'] },
    { id: 'suppliers', label: 'Suppliers', icon: Activity, roles: ['Admin', 'Manager', 'Viewer'] },
    { id: 'ledger', label: 'Ledger & Daybook', icon: FileCheck, roles: ['Admin', 'Manager', 'Viewer'] },
    { id: 'payroll', label: 'Staff & Payroll', icon: Wallet, roles: ['Admin', 'Manager'] },
    { id: 'damages', label: 'Damages & Adjust', icon: ShieldAlert, roles: ['Admin', 'Manager'] },
    { id: 'challans', label: 'Challan Gen', icon: FileText, roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'sales', label: 'Sales History', icon: TrendingUp, roles: ['Admin', 'Manager', 'Cashier', 'Viewer'] },
    { id: 'reports', label: 'Advanced Reports', icon: FileText, roles: ['Admin', 'Manager'] },
    { id: 'settings', label: 'Settings & Access', icon: Settings, roles: ['Admin'] },
  ];

  const allowedNavItems = navItems.filter(item => 
    !state.userRole || item.roles.includes(state.userRole)
  );

  const lowStockItems = state.products.filter(p => p.stock <= (p.reorderLevel || state.settings?.lowStockThreshold || 10));
  const expiringSoonItems = state.batches.filter(b => {
    if (!b.expDate) return false;
    const diffDays = (new Date(b.expDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= (state.settings?.expiryWarningDays || 30) && diffDays > 0;
  });

  // Initial load still blocks if we have no settings yet, but we want better granularity
  if (state.loading && !state.settings) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing Cloud Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-[#050505] flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3 text-primary">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Wheat size={20} />
          </div>
          <span className="font-black text-lg tracking-tight text-gray-900 dark:text-white">AGRO<span className="text-primary italic">SHOP</span></span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-500"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen sticky top-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 hidden lg:block">
          <div className="flex items-center gap-3 text-primary">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Wheat size={24} />
            </div>
            <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white">AGRO<span className="text-primary italic">SHOP</span></span>
          </div>
          
          {availableShops.length > 1 && (
            <div className="mt-8 space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Switch Company</label>
              <select 
                value={currentShopId || ''} 
                onChange={(e) => navigate(`/agro-dashboard?shop=${e.target.value}`)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none"
              >
                {availableShops.map((shop, idx) => (
                  <option key={shop.id || `shop-${idx}`} value={shop.id || ''}>{shop.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 lg:mt-0 overflow-y-auto max-h-[calc(100vh-250px)]">
          {allowedNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-900 rounded-xl font-bold text-xs transition-all ${
                activeTab === item.id 
                  ? 'bg-primary! text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  {state.settings?.shopName || 'Agro Dashboard'}
                </h1>
                {state.loading && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
                  />
                )}
              </div>
              <p className="text-gray-500 text-sm font-medium">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm ${(lowStockItems.length > 0 || expiringSoonItems.length > 0) ? 'text-red-500' : 'text-gray-500'}`}
              >
                <Bell size={20} />
                {(lowStockItems.length > 0 || expiringSoonItems.length > 0) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-[350px] bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl z-[100] overflow-hidden"
                  >
                    <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Alerts & Notifications</h4>
                      <button onClick={() => setIsNotifOpen(false)}><X size={16} /></button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto p-2">
                      {lowStockItems.slice(0, 5).map((p, pIdx) => (
                        <div key={`notif-low-${p.id}-${pIdx}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl flex items-center gap-4 group">
                          <div className="p-3 bg-orange-50 dark:bg-orange-900/10 text-orange-500 rounded-xl">
                            <Package size={16} />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-black uppercase text-gray-900 dark:text-white">{p.name}</p>
                            <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest mt-0.5">Low Stock: {p.stock} Left</p>
                          </div>
                        </div>
                      ))}
                      {expiringSoonItems.slice(0, 5).map((b, bIdx) => (
                        <div key={`notif-exp-${b.id}-${bIdx}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl flex items-center gap-4 group">
                          <div className="p-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-xl">
                            <Calendar size={16} />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-black uppercase text-gray-900 dark:text-white">{state.products.find(p => p.id === b.productId)?.name || 'Product'}</p>
                            <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mt-0.5">Exp: {b.expDate} ({b.batchNumber})</p>
                          </div>
                        </div>
                      ))}
                      {lowStockItems.length === 0 && expiringSoonItems.length === 0 && (
                        <div className="py-12 text-center text-gray-400">
                          <FileCheck size={40} className="mx-auto mb-3 opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-widest italic">All systems clear.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm text-gray-500">
              <Calendar size={20} />
            </button>
          </div>
        </header>

        <div className="max-w-6xl pb-20">
          {activeTab === 'overview' && <OverviewTab state={state} setActiveTab={setActiveTab} />}
          {activeTab === 'inventory' && <InventoryTab state={state} shopId={currentShopId} />}
          {activeTab === 'batches' && <BatchesTab state={state} shopId={currentShopId} />}
          {activeTab === 'billing' && (
            <BillingTab 
              state={state} 
              shopId={currentShopId} 
              billToEdit={billToEdit}
              onResetEdit={() => setBillToEdit(null)}
              onBillGenerated={(bill) => setPrintBill(bill)} 
            />
          )}
          {activeTab === 'purchases' && <PurchasesTab state={state} shopId={currentShopId} />}
          {activeTab === 'customers' && <CustomersTab state={state} shopId={currentShopId} />}
          {activeTab === 'orders' && <OrdersTab state={state} shopId={currentShopId} />}
          {activeTab === 'returns' && <ReturnsTab state={state} shopId={currentShopId} />}
          {activeTab === 'suppliers' && <SuppliersTab state={state} shopId={currentShopId} />}
          {activeTab === 'ledger' && <LedgerTab state={state} shopId={currentShopId} />}
          {activeTab === 'payroll' && <EmployeesTab state={state} shopId={currentShopId} />}
          {activeTab === 'damages' && <DamagesTab state={state} shopId={currentShopId} />}
          {activeTab === 'challans' && <ChallansTab state={state} shopId={currentShopId} />}
          {activeTab === 'sales' && (
            <SalesTab 
              state={state} 
              onPrint={(bill) => setPrintBill(bill)} 
              onEdit={(bill) => {
                setBillToEdit(bill);
                setActiveTab('billing');
              }}
            />
          )}
          {activeTab === 'reports' && <ReportsTab state={state} />}
          {activeTab === 'settings' && <SettingsTab state={state} shopId={currentShopId} />}
        </div>
        
        <InvoicePrintModal 
          bill={printBill} 
          settings={state.settings ? {
            name: state.settings.shopName,
            address: state.settings.address,
            owner: state.settings.ownerName,
            contact: state.settings.contact,
            gstin: state.settings.gstin,
            fertilizerLicense: state.settings.fertilizerLicense,
            seedLicense: state.settings.seedLicense,
            insecticideLicense: state.settings.insecticideLicense,
            cottonLicense: state.settings.cottonLicense,
            licenceNo: state.settings.licenceNo
          } : null}
          isOpen={!!printBill} 
          onClose={() => setPrintBill(null)}
          onEdit={(bill) => {
            setPrintBill(null);
            setBillToEdit(bill);
            setActiveTab('billing');
          }}
        />
      </main>
    </div>
  );
};
