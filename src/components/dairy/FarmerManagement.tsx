import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  Trash2, 
  Edit2,
  Search, 
  User, 
  Phone, 
  Hash, 
  Droplets,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  doc, 
  query, 
  orderBy,
  where,
  getDocs
} from 'firebase/firestore';
import { Farmer } from './types';
import { useAuth } from '../AuthContext';

export const FarmerManagement: React.FC = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newFarmer, setNewFarmer] = useState<Partial<Farmer>>({
    milkType: 'Cow'
  });
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { isDairyAdmin, user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'dairies', user.uid, 'farmers'), orderBy('uniqueId', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setFarmers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Farmer)));
    });
    return unsub;
  }, [user]);

  const handleAddFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!user) return;

    if (!newFarmer.uniqueId || !newFarmer.name) {
      setError('ID and Name are required');
      return;
    }

    if (newFarmer.name.trim().length < 3) {
      setError('Please enter a valid full name (min 3 characters)');
      return;
    }

    if (newFarmer.contact && !/^\d{10}$/.test(newFarmer.contact.replace(/\s+/g, ''))) {
      setError('Please enter a valid 10-digit contact number');
      return;
    }

    try {
      // Check if ID already exists
      const idQuery = query(collection(db, 'dairies', user.uid, 'farmers'), where('uniqueId', '==', newFarmer.uniqueId));
      const idSnap = await getDocs(idQuery);
      if (!idSnap.empty) {
        setError('Farmer ID already exists');
        return;
      }

      await addDoc(collection(db, 'dairies', user.uid, 'farmers'), newFarmer);
      setSuccess('Farmer added successfully');
      setNewFarmer({ milkType: 'Cow' });
      setShowAddModal(false);
    } catch (err) {
      setError('Failed to add farmer');
    }
  };

  const handleDeleteFarmer = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this farmer?')) return;
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'dairies', user.uid, 'farmers', id));
      setSuccess('Farmer removed successfully');
    } catch (err) {
      setError('Failed to remove farmer');
    }
  };

  const handleEditFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFarmer || !editingFarmer.id || !user) return;
    setError(null);
    setSuccess(null);

    if (editingFarmer.name.trim().length < 3) {
      setError('Please enter a valid full name (min 3 characters)');
      return;
    }

    if (editingFarmer.contact && !/^\d{10}$/.test(editingFarmer.contact.replace(/\s+/g, ''))) {
      setError('Please enter a valid 10-digit contact number');
      return;
    }

    try {
      // Check if ID already exists (if ID was changed)
      const existingFarmer = farmers.find(f => f.id === editingFarmer.id);
      if (existingFarmer?.uniqueId !== editingFarmer.uniqueId) {
        const idQuery = query(collection(db, 'dairies', user.uid, 'farmers'), where('uniqueId', '==', editingFarmer.uniqueId));
        const idSnap = await getDocs(idQuery);
        if (!idSnap.empty) {
          setError('Farmer ID already exists');
          return;
        }
      }

      const { id, ...updateData } = editingFarmer;
      const ref = doc(db, 'dairies', user.uid, 'farmers', id);
      const { ...data } = updateData;
      await updateDoc(ref, data as any);
      
      setSuccess('Farmer updated successfully');
      setShowEditModal(false);
      setEditingFarmer(null);
    } catch (err) {
      console.error(err);
      setError('Failed to update farmer');
    }
  };

  const filteredFarmers = farmers.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.uniqueId.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
        
        {isDairyAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/30 transition-all uppercase text-xs tracking-widest"
          >
            <UserPlus size={18} />
            Add Farmer
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFarmers.map((farmer) => (
          <motion.div
            layout
            key={farmer.id}
            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  {farmer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{farmer.name}</h3>
                  <span className="text-xs font-mono text-gray-500 uppercase tracking-tighter">ID: {farmer.uniqueId}</span>
                </div>
              </div>
              {isDairyAdmin && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingFarmer(farmer);
                      setShowEditModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    title="Edit Farmer"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteFarmer(farmer.id!)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone size={14} />
                {farmer.contact || 'No contact'}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Droplets size={14} className={farmer.milkType === 'Cow' ? 'text-blue-500' : 'text-gray-900'} />
                <span className={`font-medium ${farmer.milkType === 'Cow' ? 'text-blue-600' : 'text-gray-900'}`}>
                  {farmer.milkType} Milk
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Farmer Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Register New Farmer</h2>
              <form onSubmit={handleAddFarmer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Unique Farmer ID</label>
                  <input
                    type="text"
                    required
                    value={newFarmer.uniqueId || ''}
                    onChange={(e) => setNewFarmer({ ...newFarmer, uniqueId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="e.g. 101"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Farmer Name</label>
                  <input
                    type="text"
                    required
                    value={newFarmer.name || ''}
                    onChange={(e) => setNewFarmer({ ...newFarmer, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Contact Number</label>
                  <input
                    type="text"
                    value={newFarmer.contact || ''}
                    onChange={(e) => setNewFarmer({ ...newFarmer, contact: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="+91..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Milk Type</label>
                  <select
                    value={newFarmer.milkType}
                    onChange={(e) => setNewFarmer({ ...newFarmer, milkType: e.target.value as 'Cow' | 'Buffalo' })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                  >
                    <option value="Cow">Cow</option>
                    <option value="Buffalo">Buffalo</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:shadow-lg hover:shadow-primary/30 transition-all"
                  >
                    Save Farmer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Farmer Modal */}
      <AnimatePresence>
        {showEditModal && editingFarmer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Edit Farmer Details</h2>
              <form onSubmit={handleEditFarmer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Unique Farmer ID</label>
                  <input
                    type="text"
                    required
                    value={editingFarmer.uniqueId}
                    onChange={(e) => setEditingFarmer({ ...editingFarmer, uniqueId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="e.g. 101"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Farmer Name</label>
                  <input
                    type="text"
                    required
                    value={editingFarmer.name}
                    onChange={(e) => setEditingFarmer({ ...editingFarmer, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Contact Number</label>
                  <input
                    type="text"
                    value={editingFarmer.contact || ''}
                    onChange={(e) => setEditingFarmer({ ...editingFarmer, contact: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="+91..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Milk Type</label>
                  <select
                    value={editingFarmer.milkType}
                    onChange={(e) => setEditingFarmer({ ...editingFarmer, milkType: e.target.value as 'Cow' | 'Buffalo' })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                  >
                    <option value="Cow">Cow</option>
                    <option value="Buffalo">Buffalo</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingFarmer(null);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:shadow-lg hover:shadow-primary/30 transition-all"
                  >
                    Update Farmer
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
