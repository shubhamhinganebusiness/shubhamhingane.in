import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Plus, Search, Trash2, Edit2, 
  X, Filter, Download, UserPlus, Phone, Home 
} from 'lucide-react';

import { MessMemberLedger } from './MessMemberLedger';

interface Props {
  tenantId?: string;
}

export const MessMemberManager: React.FC<Props> = ({ tenantId }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [selectedMemberLedger, setSelectedMemberLedger] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    roomNo: '',
    mobile: '',
    monthlyFee: 3000,
    joinDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    balance: 0
  });

  useEffect(() => {
    if (tenantId) fetchMembers();
  }, [tenantId]);

  const fetchMembers = async () => {
    if (!tenantId) return;
    setLoading(true);
    const path = `messes/${tenantId}/members`;
    try {
      const q = query(collection(db, path));
      const snap = await getDocs(q);
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    const memberId = editingMember?.id || `MEM_${Date.now()}`;
    const path = `messes/${tenantId}/members/${memberId}`;
    try {
      await setDoc(doc(db, `messes/${tenantId}/members`, memberId), {
        ...formData,
        id: memberId,
        tenantId,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      alert(editingMember ? 'Member updated!' : 'Member added!');
      setShowAddModal(false);
      setEditingMember(null);
      setFormData({ name: '', roomNo: '', mobile: '', monthlyFee: 3000, joinDate: new Date().toISOString().split('T')[0], status: 'Active', balance: 0 });
      fetchMembers();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member?')) return;
    try {
      await deleteDoc(doc(db, `messes/${tenantId}/members`, id));
      fetchMembers();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.roomNo.includes(searchTerm) ||
    m.mobile.includes(searchTerm)
  );

  if (selectedMemberLedger) {
    return (
      <MessMemberLedger 
        tenantId={tenantId} 
        memberId={selectedMemberLedger} 
        onBack={() => setSelectedMemberLedger(null)} 
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Users className="text-primary" />
              Member Directory
            </h2>
            <p className="text-gray-500 font-medium">Manage students, room numbers, and billing preferences.</p>
          </div>

          <div className="flex items-center gap-3">
             <button onClick={() => setShowAddModal(true)} className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-xl shadow-primary/20 hover:bg-black transition-all">
               <UserPlus size={18} />
               Enroll New Member
             </button>
             <button className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all border border-gray-100">
               <Download size={18} />
             </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
           <div className="flex-1 relative">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
             <input 
               type="text" 
               placeholder="Search by name, room or mobile..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-16 pr-6 py-5 bg-gray-50 border border-transparent rounded-[2rem] outline-none focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/10 font-bold transition-all"
             />
           </div>
           <div className="flex items-center gap-3 bg-gray-50 px-8 py-4 rounded-[2rem] border border-gray-50">
             <Filter size={18} className="text-gray-400" />
             <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Active Only</span>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {filteredMembers.map(member => (
              <motion.div 
                layout
                key={member.id}
                className="bg-white border border-gray-100 rounded-[2.5rem] p-8 group hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500"
              >
                 <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <Users size={24} />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => {
                           setEditingMember(member);
                           setFormData(member);
                           setShowAddModal(true);
                         }}
                         className="p-2 text-gray-400 hover:text-primary"
                       >
                         <Edit2 size={16} />
                       </button>
                       <button 
                         onClick={() => handleDelete(member.id)}
                         className="p-2 text-gray-400 hover:text-red-500"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                 </div>

                 <div className="space-y-1 mb-8">
                    <h4 className="text-lg font-black text-gray-900 tracking-tight">{member.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">Room {member.roomNo}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${member.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                        {member.status}
                      </span>
                    </div>
                 </div>

                 <div className="space-y-4 pt-6 border-t border-gray-50">
                    <div className="flex items-center gap-3 text-gray-400">
                       <Phone size={14} />
                       <span className="text-xs font-bold text-gray-600">{member.mobile}</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Fee</span>
                       <span className="font-black text-gray-900">₹{member.monthlyFee}</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Balance</span>
                       <span className={`font-black ${member.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                         {member.balance > 0 ? `₹${member.balance}` : 'Clear'}
                       </span>
                    </div>
                 </div>

                 <button 
                   onClick={() => setSelectedMemberLedger(member.id)}
                   className="w-full mt-8 py-3 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all"
                 >
                    View Full Ledger
                 </button>
              </motion.div>
           ))}
        </div>
      </div>

      {/* Enroll Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
             >
                <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                   <div>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                        {editingMember ? 'Edit Profile' : 'Enroll Student'}
                      </h3>
                      <p className="text-gray-400 font-medium text-sm mt-1">Fill in member details to manage their meals.</p>
                   </div>
                   <button onClick={() => {setShowAddModal(false); setEditingMember(null)}} className="p-3 hover:bg-gray-200 rounded-full transition-colors">
                      <X size={24} />
                   </button>
                </div>

                <form onSubmit={handleSave} className="p-10 space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                     <input 
                       type="text" required
                       value={formData.name}
                       onChange={(e) => setFormData({...formData, name: e.target.value})}
                       className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold" 
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Room Number</label>
                        <input 
                          type="text" required
                          value={formData.roomNo}
                          onChange={(e) => setFormData({...formData, roomNo: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
                        <input 
                          type="tel" required
                          value={formData.mobile}
                          onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold" 
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Joining Date</label>
                        <input 
                          type="date" required
                          value={formData.joinDate}
                          onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Monthly Fee (₹)</label>
                        <input 
                          type="number" required
                          value={formData.monthlyFee}
                          onChange={(e) => setFormData({...formData, monthlyFee: Number(e.target.value)})}
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold" 
                        />
                      </div>
                   </div>

                   <div className="pt-6 flex gap-4">
                      <button 
                        type="submit"
                        className="flex-1 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 hover:bg-black transition-all"
                      >
                        {editingMember ? 'Save Changes' : 'Enroll Now'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {setShowAddModal(false); setEditingMember(null)}}
                        className="px-10 py-5 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs"
                      >
                        Cancel
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
