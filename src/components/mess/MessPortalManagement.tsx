import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Plus, Trash2, ShieldCheck, 
  Store, Edit2, Eye, EyeOff, X, 
  Search, Filter, Activity, UtensilsCrossed,
  AlertCircle 
} from 'lucide-react';

export const MessPortalManagement: React.FC = () => {
  const [messOwners, setMessOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOwner, setNewOwner] = useState({
    name: '',
    messName: '',
    email: '',
    mobile: '',
    password: ''
  });

  const [viewingOwner, setViewingOwner] = useState<any | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchMessOwners();
  }, []);

  const fetchMessOwners = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'mess_owners'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setMessOwners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching mess owners:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newOwner.password.trim().length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    try {
      // tenantId is mobile to keep it unique and easy for login
      const tenantId = newOwner.mobile.trim();
      
      await setDoc(doc(db, 'mess_owners', tenantId), {
        ...newOwner,
        tenantId,
        status: 'Active',
        role: 'MessOwner',
        createdAt: new Date().toISOString()
      });

      // Also create an authorized_account entry for the generic login system
      await setDoc(doc(db, 'authorized_accounts', tenantId), {
        username: tenantId,
        password: newOwner.password,
        role: 'mess_owner',
        createdAt: new Date().toISOString()
      });

      alert('Mess Owner created successfully!');
      setShowAddModal(false);
      setNewOwner({ name: '', messName: '', email: '', mobile: '', password: '' });
      fetchMessOwners();
    } catch (err) {
      console.error(err);
      alert('Failed to create account');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
      await setDoc(doc(db, 'mess_owners', id), { status: newStatus }, { merge: true });
      fetchMessOwners();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will delete the account and all associated mess data.')) return;
    try {
      await deleteDoc(doc(db, 'mess_owners', id));
      await deleteDoc(doc(db, 'authorized_accounts', id));
      fetchMessOwners();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOwners = messOwners.filter(o => 
    o.messName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.mobile?.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <UtensilsCrossed className="text-primary" />
              Mess Management
            </h2>
            <p className="text-gray-500 font-medium mt-1">Provision and manage multi-tenant mess accounts.</p>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-xl shadow-primary/20 hover:bg-black transition-all"
          >
            <Plus size={18} />
            Add New Mess
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by mess name, owner or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
            />
          </div>
          <div className="flex items-center gap-3 bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100">
            <Filter size={18} className="text-gray-400" />
            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">All Status</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOwners.map((owner) => (
            <motion.div 
              layout
              key={owner.id}
              className="bg-gray-50 border border-gray-100 rounded-[2rem] p-8 group hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <Store size={28} />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setViewingOwner(owner)}
                    className="p-2 bg-white rounded-lg text-gray-400 hover:text-blue-500 border border-gray-100 shadow-sm transition-all"
                    title="View Credentials"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={() => toggleStatus(owner.id, owner.status)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${owner.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                  >
                    {owner.status}
                  </button>
                  <button 
                    onClick={() => handleDelete(owner.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-black text-gray-900 leading-tight">{owner.messName}</h3>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{owner.name}</p>
              </div>

              <div className="space-y-3 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile</span>
                  <span className="font-mono font-bold text-gray-900">{owner.mobile}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Join Date</span>
                  <span className="text-sm font-bold text-gray-600">{new Date(owner.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ID (Tenant)</p>
                    <p className="font-mono text-xs text-gray-400">{owner.tenantId}</p>
                 </div>
                 <div className="flex items-center gap-2 text-gray-400">
                    <Activity size={14} />
                    <span className="text-[10px] font-black uppercase">Live</span>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredOwners.length === 0 && !loading && (
          <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
            <Users className="mx-auto text-gray-200 mb-4" size={64} />
            <h3 className="text-xl font-black text-gray-400">No Mess Accounts Found</h3>
            <p className="text-gray-400 font-medium">Try adjusting your search or add a new tenant.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 md:p-12 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Create Mess Account</h3>
                  <p className="text-gray-500 font-medium text-sm mt-1">Tenant provisioning & security setup.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateOwner} className="p-8 md:p-12 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Owner Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Anand Kumar"
                      value={newOwner.name}
                      onChange={(e) => setNewOwner({...newOwner, name: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mess Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Royal Student Mess"
                      value={newOwner.messName}
                      onChange={(e) => setNewOwner({...newOwner, messName: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number (Login ID)</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="e.g. 771999595"
                      value={newOwner.mobile}
                      onChange={(e) => setNewOwner({...newOwner, mobile: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email (Optional)</label>
                    <input 
                      type="email" 
                      placeholder="owner@mess.com"
                      value={newOwner.email}
                      onChange={(e) => setNewOwner({...newOwner, email: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Temporary Password</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Welcome@2024"
                      value={newOwner.password}
                      onChange={(e) => setNewOwner({...newOwner, password: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="pt-6 flex flex-col md:flex-row gap-4">
                  <button 
                    type="submit"
                    className="flex-1 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-2xl shadow-primary/20"
                  >
                    Generate Credentials
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-10 py-5 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Credentials Modal */}
      <AnimatePresence>
        {viewingOwner && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-primary text-white">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={24} />
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">Login Credentials</h3>
                    <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">Mess OS Security</p>
                  </div>
                </div>
                <button onClick={() => {
                  setViewingOwner(null);
                  setShowPassword(false);
                }} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Mess Name</label>
                    <p className="font-bold text-gray-900">{viewingOwner.messName}</p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Mobile (Login ID)</label>
                    <div className="flex items-center justify-between">
                      <p className="font-mono font-bold text-lg text-gray-900">{viewingOwner.mobile}</p>
                      <button 
                        onClick={() => navigator.clipboard.writeText(viewingOwner.mobile)}
                        className="text-[10px] font-black text-primary uppercase hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Password</label>
                    <div className="flex items-center justify-between">
                      <p className="font-mono font-bold text-lg text-primary tracking-wider">
                        {showPassword ? viewingOwner.password : '••••••••'}
                      </p>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-2 bg-white rounded-lg text-gray-400 hover:text-primary transition-colors border border-gray-100 shadow-sm"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button 
                          onClick={() => navigator.clipboard.writeText(viewingOwner.password)}
                          className="text-[10px] font-black text-primary uppercase hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <AlertCircle size={16} className="text-amber-500 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-700 leading-tight">
                      CAUTION: Sharing credentials manually over unsecure channels is not recommended. 
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setViewingOwner(null);
                      setShowPassword(false);
                    }}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all"
                  >
                    Done Viewing
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
