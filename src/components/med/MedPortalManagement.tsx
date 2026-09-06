import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, deleteDoc, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, UserPlus, Trash2, ShieldCheck, Mail, Database, 
  Settings as SettingsIcon, AlertCircle, Phone, Clock, 
  Plus, Search, Shield, ShieldAlert, Star, Store, MapPin, 
  Camera, Calendar, User, Eye, EyeOff, X, Briefcase, FileText
} from 'lucide-react';

interface MedUser {
  id: string;
  uid: string;
  name: string;
  role: 'Doctor' | 'Pharmacy';
  email: string;
  mobile: string;
  username: string;
  birthdate: string;
  photo: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  status: 'Active' | 'Blocked';
  clinicName?: string;
  pharmacyName?: string;
  pharmacyId?: string;
  createdAt: string;
}

export const MedPortalManagement: React.FC = () => {
  const [users, setUsers] = useState<MedUser[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'pharmacies'>('users');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddPharmacyModal, setShowAddPharmacyModal] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState<string | null>(null);
  const [isEditingPharmacy, setIsEditingPharmacy] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    role: 'Doctor' as 'Doctor' | 'Pharmacy',
    email: '',
    mobile: '',
    username: '',
    password: '',
    birthdate: '',
    photo: '',
    subscriptionStart: new Date().toISOString().split('T')[0],
    subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    clinicName: '',
    pharmacyName: '',
    pharmacyId: ''
  });
  const [newPharmacy, setNewPharmacy] = useState({
    name: '',
    address: '',
    mobile: '',
    licenseNumber: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersQuery = query(collection(db, 'users'), where('role', 'in', ['Doctor', 'Pharmacy']));
      const usersSnap = await getDocs(usersQuery);
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as MedUser)));

      const pharmaciesSnap = await getDocs(collection(db, 'pharmacies'));
      setPharmacies(pharmaciesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanEmail = newUser.email.trim().toLowerCase();
      const rawMobile = newUser.mobile.replace(/\D/g, '');
      // Take last 10 digits for normalization if it's a mobile number
      const cleanMobile = rawMobile.length >= 10 ? rawMobile.slice(-10) : rawMobile;
      const cleanUsername = (newUser.username.trim() || cleanMobile || cleanEmail.split('@')[0]).toLowerCase();

      // Create/Update authorization account record
      // Primary key priority: existing ID > mobile digits > email
      const authKey = isEditingUser || cleanMobile || cleanEmail;
      
      await setDoc(doc(db, 'authorized_accounts', authKey), {
        username: cleanUsername,
        email: cleanEmail || null,
        mobile: cleanMobile || null,
        password: newUser.password.trim() || '', 
        role: newUser.role,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Create internal user profile
      await setDoc(doc(db, 'users', authKey), {
        ...newUser,
        email: cleanEmail,
        mobile: cleanMobile,
        username: cleanUsername,
        password: '', // Don't store plain password in user profile
        status: isEditingUser ? undefined : 'Active', // Don't reset status on edit
        updatedAt: new Date().toISOString(),
        clinicName: newUser.role === 'Doctor' ? newUser.clinicName : '',
        pharmacyName: newUser.role === 'Pharmacy' ? newUser.pharmacyName : '',
        pharmacyId: newUser.role === 'Pharmacy' ? (newUser.pharmacyId || authKey) : ''
      }, { merge: true });

      alert(isEditingUser ? 'User updated successfully' : 'User created successfully');
      setShowAddUserModal(false);
      setIsEditingUser(null);
      resetUserForm();
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save user');
    }
  };

  const resetUserForm = () => {
    setNewUser({
      name: '',
      role: 'Doctor',
      email: '',
      mobile: '',
      username: '',
      password: '',
      birthdate: '',
      photo: '',
      subscriptionStart: new Date().toISOString().split('T')[0],
      subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      clinicName: '',
      pharmacyName: '',
      pharmacyId: ''
    });
  };

  const handleAddPharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = isEditingPharmacy || 'ph' + Date.now();
      await setDoc(doc(db, 'pharmacies', id), {
        ...newPharmacy,
        status: isEditingPharmacy ? undefined : 'Active',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert(isEditingPharmacy ? 'Pharmacy updated' : 'Pharmacy added');
      setShowAddPharmacyModal(false);
      setIsEditingPharmacy(null);
      setNewPharmacy({ name: '', address: '', mobile: '', licenseNumber: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditUser = (user: MedUser) => {
    setIsEditingUser(user.id);
    setNewUser({
      name: user.name,
      role: user.role,
      email: user.email,
      mobile: user.mobile,
      username: user.username || '',
      password: '', // Don't fill password for security, only if they want to change it
      birthdate: user.birthdate || '',
      photo: user.photo || '',
      subscriptionStart: user.subscriptionStart,
      subscriptionEnd: user.subscriptionEnd,
      clinicName: user.clinicName || '',
      pharmacyName: user.pharmacyName || '',
      pharmacyId: user.pharmacyId || ''
    });
    setShowAddUserModal(true);
  };

  const handleEditPharmacy = (ph: any) => {
    setIsEditingPharmacy(ph.id);
    setNewPharmacy({
      name: ph.name,
      address: ph.address,
      mobile: ph.mobile,
      licenseNumber: ph.licenseNumber
    });
    setShowAddPharmacyModal(true);
  };

  const toggleUserStatus = async (user: MedUser) => {
    try {
      const newStatus = user.status === 'Active' ? 'Blocked' : 'Active';
      await setDoc(doc(db, 'users', user.id), { status: newStatus }, { merge: true });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string, role: string) => {
    if (!confirm(`Delete this ${role}? This action is irreversible.`)) return;
    setLoading(true);
    try {
      // 1. Get the current user data to find linked info (UID-based profiles)
      const userSnap = await getDoc(doc(db, 'users', id));
      const authSnap = await getDoc(doc(db, 'authorized_accounts', id));
      const userData = userSnap.exists() ? userSnap.data() : (authSnap.exists() ? authSnap.data() : null);

      // 2. Delete primary records
      await deleteDoc(doc(db, 'users', id));
      await deleteDoc(doc(db, 'authorized_accounts', id));

      // 3. Find and delete desynced records (e.g. UID-based profiles created on first login)
      if (userData) {
        const { email, mobile } = userData;
        const cleanupQueries = [];
        if (email) cleanupQueries.push(query(collection(db, 'users'), where('email', '==', email)));
        if (mobile) {
          const m10 = mobile.slice(-10);
          cleanupQueries.push(query(collection(db, 'users'), where('mobile', '==', mobile)));
          cleanupQueries.push(query(collection(db, 'users'), where('mobile', '==', m10)));
        }

        for (const q of cleanupQueries) {
          const qSnap = await getDocs(q);
          for (const d of qSnap.docs) {
            if (d.id !== id) {
              await deleteDoc(doc(db, 'users', d.id));
            }
          }
        }
      }
      
      alert(`${role} deleted successfully.`);
      fetchData();
    } catch (err: any) {
      console.error('Delete error:', err);
      const errMsg = err.message || 'Permission Denied';
      alert(`Failed to delete profile: ${errMsg}. Check if you still have administrative permissions.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePharmacy = async (id: string) => {
    if (!confirm('Delete this pharmacy from master list?')) return;
    try {
      await deleteDoc(doc(db, 'pharmacies', id));
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `pharmacies/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="text-primary" />
            Digital Prescription Portal
          </h2>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Manage Roles, Subscriptions & Pharmacy Directory</p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
          >
            User Management
          </button>
          <button 
            onClick={() => setActiveTab('pharmacies')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pharmacies' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
          >
            Master Pharmacy List
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Doctors</p>
          <p className="text-3xl font-black text-gray-900">{users.filter(u => u.role === 'Doctor').length}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pharmacies</p>
          <p className="text-3xl font-black text-gray-900">{users.filter(u => u.role === 'Pharmacy').length}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Subscriptions</p>
          <p className="text-3xl font-black text-green-500">{users.filter(u => u.status === 'Active').length}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Blocked Users</p>
          <p className="text-3xl font-black text-red-500">{users.filter(u => u.status === 'Blocked').length}</p>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-gray-900">Manage Doctors & Pharmacies</h3>
            <button 
              onClick={() => {
                setIsEditingUser(null);
                resetUserForm();
                setShowAddUserModal(true);
              }}
              className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              <UserPlus size={16} /> Add New User
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="py-4 text-left">User Profile</th>
                  <th className="py-4 text-left">Role</th>
                  <th className="py-4 text-left">Subscription</th>
                  <th className="py-4 text-left">Status</th>
                  <th className="py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="group hover:bg-gray-50/50 transition-all">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-primary font-black">
                          {u.photo ? <img src={u.photo} alt="" className="w-full h-full rounded-full object-cover" /> : u.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{u.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">@{u.username} | {u.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.role === 'Doctor' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 text-xs font-medium text-gray-500">
                      <div>Start: {u.subscriptionStart}</div>
                      <div>End: {u.subscriptionEnd}</div>
                    </td>
                    <td className="py-4">
                      <button 
                        onClick={() => toggleUserStatus(u)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${u.status === 'Active' ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                      >
                        {u.status}
                      </button>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditUser(u)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit User"
                        >
                          <FileText size={18} />
                        </button>
                        <button 
                          onClick={() => toggleUserStatus(u)}
                          className={`p-2 rounded-lg transition-all ${u.status === 'Active' ? 'text-green-500 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
                          title={u.status === 'Active' ? 'Block User' : 'Unblock User'}
                        >
                          {u.status === 'Active' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.role)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-gray-900">Pharmacy Master Directory</h3>
            <button 
              onClick={() => {
                setIsEditingPharmacy(null);
                setNewPharmacy({ name: '', address: '', mobile: '', licenseNumber: '' });
                setShowAddPharmacyModal(true);
              }}
              className="px-6 py-3 bg-secondary text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              <Store size={16} /> Add Pharmacy
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pharmacies.map(ph => (
              <div key={ph.id} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4 relative group">
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => handleEditPharmacy(ph)}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-white rounded-full shadow-sm"
                  >
                    <FileText size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeletePharmacy(ph.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-full shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-secondary shadow-sm">
                  <Store size={24} />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 tracking-tight mb-1 uppercase">{ph.name}</h4>
                  <p className="text-xs text-gray-500 font-medium flex items-start gap-2">
                    <MapPin size={12} className="mt-0.5 shrink-0" />
                    {ph.address}
                  </p>
                  <p className="text-xs text-gray-500 font-medium flex items-start gap-2 mt-2">
                    <Phone size={12} className="mt-0.5 shrink-0" />
                    {ph.mobile}
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span>Lic: {ph.licenseNumber}</span>
                  <span className="text-green-500">{ph.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                    {isEditingUser ? 'Edit Portal User' : 'New Portal User'}
                  </h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Credentials & Identity Profile</p>
                </div>
                <button onClick={() => {
                  setShowAddUserModal(false);
                  setIsEditingUser(null);
                }} className="p-3 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddUser} className="p-10 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. John Doe"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">User Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                    >
                      <option value="Doctor">Doctor</option>
                      <option value="Pharmacy">Pharmacy</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Username (Login ID)</label>
                    <input
                      type="text"
                      required
                      placeholder="johndoe123"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password {isEditingUser && '(Leave blank to keep current)'}</label>
                    <input
                      type="text"
                      required={!isEditingUser}
                      placeholder="••••••••"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="dr.john@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                    />
                  </div>
                   <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 9876543210"
                      value={newUser.mobile}
                      onChange={(e) => setNewUser({...newUser, mobile: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Birthdate</label>
                    <input
                      type="date"
                      required
                      value={newUser.birthdate}
                      onChange={(e) => setNewUser({...newUser, birthdate: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subscription End</label>
                    <input
                      type="date"
                      required
                      value={newUser.subscriptionEnd}
                      onChange={(e) => setNewUser({...newUser, subscriptionEnd: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {newUser.role === 'Doctor' ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Clinic Name</label>
                      <input
                        type="text"
                        placeholder="e.g. City Care Clinic"
                        value={newUser.clinicName}
                        onChange={(e) => setNewUser({...newUser, clinicName: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pharmacy Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Health Plus Pharmacy"
                        value={newUser.pharmacyName}
                        onChange={(e) => setNewUser({...newUser, pharmacyName: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Photo URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={newUser.photo}
                      onChange={(e) => setNewUser({...newUser, photo: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                    />
                  </div>
                </div>

                {newUser.role === 'Pharmacy' && (
                  <div className="space-y-1 text-center p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Standalone Pharmacy Account</p>
                    <p className="text-[9px] text-gray-400 mt-1">This user will login to manage prescriptions matching their Name/ID.</p>
                  </div>
                )}

                <div className="pt-6 space-y-4">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-relaxed">
                      Sync Note: Changing a password here updates the portal registry. If the user has already logged in once, they may need to use their old password or use "Forgot Password" to sync with Google Authentication.
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {isEditingUser ? 'Update Profile & Permissions' : 'Authorize Account & Create Profile'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Pharmacy Modal */}
      <AnimatePresence>
        {showAddPharmacyModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-secondary/10">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                    {isEditingPharmacy ? 'Edit Pharmacy Record' : 'Master Pharmacy Record'}
                  </h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Directory Entry for Doctors</p>
                </div>
                <button onClick={() => {
                  setShowAddPharmacyModal(false);
                  setIsEditingPharmacy(null);
                }} className="p-3 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddPharmacy} className="p-10 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pharmacy Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. City Life Medicals"
                    value={newPharmacy.name}
                    onChange={(e) => setNewPharmacy({...newPharmacy, name: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-secondary/10 font-bold text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">License Number</label>
                  <input
                    type="text"
                    required
                    placeholder="LIC-12345-6789"
                    value={newPharmacy.licenseNumber}
                    onChange={(e) => setNewPharmacy({...newPharmacy, licenseNumber: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-secondary/10 font-bold text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Contact</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 99999 88888"
                    value={newPharmacy.mobile}
                    onChange={(e) => setNewPharmacy({...newPharmacy, mobile: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-secondary/10 font-bold text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Address</label>
                  <textarea
                    required
                    placeholder="Full pharmacy address here..."
                    value={newPharmacy.address}
                    onChange={(e) => setNewPharmacy({...newPharmacy, address: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-secondary/10 font-bold text-sm h-24 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-5 bg-secondary text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-secondary/30 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {isEditingPharmacy ? 'Update Directory Entry' : 'Add to Master Directory'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
