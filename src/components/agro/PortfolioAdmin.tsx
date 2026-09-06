import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Plus, Search, Shield, ShieldOff, Trash2, 
  UserPlus, Store, Phone, Lock, LogOut, ChevronRight,
  TrendingUp, Package, Receipt
} from 'lucide-react';
import { auth, db, onAuthStateChanged } from '../../lib/firebase';
import { 
  collection, onSnapshot, doc, 
  setDoc, updateDoc, deleteDoc, 
  query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../../lib/firebase';

interface ShopOwnerAccount {
  mobile: string;
  ownerName: string;
  shopName: string;
  password?: string;
  isBlocked: boolean;
  createdAt: any;
}

export const PortfolioAdmin: React.FC = () => {
  const [shopOwners, setShopOwners] = useState<ShopOwnerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const adminEmails = ['jamkhednewsnetwork@gmail.com', 'shubhamhingane7719@gmail.com', 'shubhamingane7719@gmail.com', 'shubhamhingane@gmail.com', 'admin@agroshop.com', '7719959593@admin.com'];

  const [newOwner, setNewOwner] = useState({
    mobile: '',
    ownerName: '',
    shopName: '',
    password: ''
  });

  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // If we are already unmounted, don't do anything
      
      if (!user) {
        console.log('No user found, redirecting to login');
        setAuthChecking(false);
        navigate('/agro-login');
        return;
      }

      const email = user.email?.toLowerCase();
      if (!email || !adminEmails.map(e => e.toLowerCase()).includes(email)) {
        console.warn('Unauthorized admin access attempt:', email);
        alert('Access denied. This area is for administrators only.');
        setAuthChecking(false);
        navigate('/agro-login');
        return;
      }

      console.log('Admin authorized:', email);
      setAuthChecking(false);
      unsubSnapshot?.();
      
      unsubSnapshot = onSnapshot(query(collection(db, 'shop_owners'), orderBy('createdAt', 'desc')), (snap) => {
        setShopOwners(snap.docs.map(d => d.data() as ShopOwnerAccount));
        setLoading(false);
      }, (err) => {
        console.error('Portfolio Admin Snapshot Error:', err);
        setLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'shop_owners');
      });
    }, (err) => {
      console.error('Auth state change error:', err);
      setAuthChecking(false);
      navigate('/agro-login');
    });

    // Safety timeout to prevent infinite blank screen if Firebase hangs
    const timeoutId = setTimeout(() => {
      setAuthChecking(current => {
        if (current) {
          console.warn('Auth check timed out after 5s');
          return false;
        }
        return false;
      });
    }, 5000);

    return () => {
      unsubscribeAuth();
      unsubSnapshot?.();
      clearTimeout(timeoutId);
    };
  }, [navigate]);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] dark:bg-[#050505] flex flex-col items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-6"></div>
        <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-xs">Verifying Enterprise Credentials...</p>
      </div>
    );
  }

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwner.mobile || !newOwner.password) return;
    if (newOwner.password.trim().length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    try {
      if (isEditing) {
        await updateDoc(doc(db, 'shop_owners', newOwner.mobile), {
          ownerName: newOwner.ownerName,
          shopName: newOwner.shopName,
          password: newOwner.password
        });
        alert('Shop owner credentials updated successfully!');
      } else {
        // Create record in shop_owners
        await setDoc(doc(db, 'shop_owners', newOwner.mobile), {
          ...newOwner,
          isBlocked: false,
          createdAt: serverTimestamp()
        });
        alert('Shop owner account created successfully!');
      }

      setIsAddModalOpen(false);
      setIsEditing(false);
      setNewOwner({ mobile: '', ownerName: '', shopName: '', password: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `shop_owners/${newOwner.mobile}`);
    }
  };

  const openEditModal = (owner: ShopOwnerAccount) => {
    setNewOwner({
      mobile: owner.mobile,
      ownerName: owner.ownerName,
      shopName: owner.shopName,
      password: owner.password || ''
    });
    setIsEditing(true);
    setIsAddModalOpen(true);
  };

  const toggleBlockStatus = async (mobile: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'shop_owners', mobile), {
        isBlocked: !currentStatus
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `shop_owners/${mobile}`);
    }
  };

  const deleteAccount = async (mobile: string) => {
    if (!window.confirm('Are you sure you want to delete this shop owner account and all their data?')) return;
    try {
      await deleteDoc(doc(db, 'shop_owners', mobile));
      // Optionally delete their agro_shops/{mobile} data too
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `shop_owners/${mobile}`);
    }
  };

  const filteredOwners = shopOwners.filter(o => 
    o.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.mobile.includes(searchTerm) ||
    o.shopName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-[#050505] p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-primary mb-2">
              <Shield className="fill-primary/20" size={24} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Portfolio Management</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Enterprise Controls</h1>
            <p className="text-gray-500 font-medium mt-1">Manage agro shop credentials and access levels.</p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setNewOwner({ mobile: '', ownerName: '', shopName: '', password: '' });
                setIsEditing(false);
                setIsAddModalOpen(true);
              }}
              className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-black transition-all flex items-center gap-3"
            >
              <UserPlus size={18} />
              Create Credentials
            </button>
            <button 
              onClick={() => { auth.signOut(); navigate('/agro-login'); }}
              className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Total Shops', value: shopOwners.length, icon: Store, color: 'text-primary bg-primary/10' },
            { label: 'Active Users', value: shopOwners.filter(o => !o.isBlocked).length, icon: Users, color: 'text-green-600 bg-green-50' },
            { label: 'Blocked Accounts', value: shopOwners.filter(o => o.isBlocked).length, icon: ShieldOff, color: 'text-red-600 bg-red-50' }
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-6">
              <div className={`p-4 rounded-2xl ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Management Table */}
        <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex flex-col md:flex-row gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search by owner name, shop name or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-[1.5rem] px-16 py-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white"
              />
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowPasswords(!showPasswords)}
                className={`px-6 py-4 rounded-[1.5rem] text-sm font-bold transition-all flex items-center gap-2 ${
                  showPasswords 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-500'
                }`}
              >
                {showPasswords ? <Shield size={16} /> : <Lock size={16} />}
                {showPasswords ? 'Hide Passwords' : 'Show Passwords'}
              </button>
              <button className="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-[1.5rem] text-sm font-bold text-gray-500 hover:text-primary transition-all">
                Export Data
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/30">
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Shop Detail</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Credential Access</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Access Status</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredOwners.map((owner) => (
                  <tr key={owner.mobile} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary blur-0 group-hover:scale-110 transition-transform">
                          <Store size={24} />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 dark:text-white text-lg">{owner.shopName}</p>
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{owner.ownerName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300">
                          <Phone size={14} className="text-gray-400" />
                          {owner.mobile}
                        </div>
                        <div className={`flex items-center gap-2 text-[10px] font-mono transition-opacity ${showPasswords ? 'text-primary font-bold' : 'text-gray-400'}`}>
                          <Lock size={14} />
                          {showPasswords ? owner.password : owner.password?.replace(/./g, '*')}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        owner.isBlocked 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {owner.isBlocked ? 'Blocked' : 'Active Authorization'}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(owner)}
                          className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                          title="Edit Credentials"
                        >
                          <Lock size={18} />
                        </button>
                        <button 
                          onClick={() => toggleBlockStatus(owner.mobile, owner.isBlocked)}
                          className={`p-3 rounded-xl transition-all ${
                            owner.isBlocked 
                              ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                              : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                          }`}
                          title={owner.isBlocked ? 'Unblock Account' : 'Block Account'}
                        >
                          {owner.isBlocked ? <Shield size={18} /> : <ShieldOff size={18} />}
                        </button>
                        <button 
                          onClick={() => deleteAccount(owner.mobile)}
                          className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                          title="Delete Permanently"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && (
              <div className="p-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">Syncing Enterprise Data...</p>
              </div>
            )}
            {!loading && filteredOwners.length === 0 && (
              <div className="p-20 text-center">
                <Store size={48} className="mx-auto text-gray-100 mb-6" />
                <p className="text-gray-400 font-bold">No shop owner accounts found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <div className="flex items-center gap-4 text-primary mb-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    {isEditing ? <Lock size={24} /> : <UserPlus size={24} />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{isEditing ? 'Manage Credentials' : 'Create Shop Owner'}</h3>
                    <p className="text-gray-500 text-sm font-medium">{isEditing ? 'Update existing shop management access.' : 'Provision new shop management credentials.'}</p>
                  </div>
              </div>

              <form onSubmit={handleCreateOwner} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Owner Name</label>
                    <input 
                      required
                      type="text"
                      value={newOwner.ownerName}
                      onChange={(e) => setNewOwner(prev => ({ ...prev, ownerName: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                      placeholder="e.g. Rahul Patil"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Shop Name</label>
                    <input 
                      required
                      type="text"
                      value={newOwner.shopName}
                      onChange={(e) => setNewOwner(prev => ({ ...prev, shopName: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                      placeholder="e.g. Kisan Agro Center"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number (Username)</label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      required
                      disabled={isEditing}
                      type="text"
                      value={newOwner.mobile}
                      onChange={(e) => setNewOwner(prev => ({ ...prev, mobile: e.target.value }))}
                      className={`w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-14 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="10-digit mobile number"
                    />
                  </div>
                  {isEditing && <p className="text-[9px] text-gray-400 mt-1 italic ml-1">Username (Mobile) is immutable for security.</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Password</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      required
                      type="text"
                      value={newOwner.password}
                      onChange={(e) => setNewOwner(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-14 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                      placeholder="Enter login password"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-5 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:bg-black transition-all"
                  >
                    {isEditing ? 'Save Changes' : 'Authorize & Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
