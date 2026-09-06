import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, UserPlus, Phone, IndianRupee, 
  Trash2, Edit2, X, Search, ShieldCheck, 
  Briefcase, Calendar, CheckSquare
} from 'lucide-react';

interface Props {
  tenantId?: string;
}

export const MessStaffManager: React.FC<Props> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'payroll'>('staff');
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'Cook',
    mobile: '',
    salary: 0,
    status: 'Active',
    joinDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (tenantId) fetchStaff();
  }, [tenantId]);

  const fetchStaff = async () => {
    try {
      const snap = await getDocs(query(collection(db, `messes/${tenantId}/staff`)));
      setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = `STAFF_${Date.now()}`;
      await setDoc(doc(db, `messes/${tenantId}/staff`, id), { ...formData, id, tenantId });
      setShowModal(false);
      fetchStaff();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-4 p-2 bg-white rounded-3xl border border-gray-100 shadow-sm w-fit">
        <button 
          onClick={() => setActiveTab('staff')}
          className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'staff' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-900'}`}
        >
          Staff Management
        </button>
        <button 
          onClick={() => setActiveTab('payroll')}
          className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'payroll' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-900'}`}
        >
          Payroll & Payments
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              {activeTab === 'staff' ? <Users className="text-primary" /> : <IndianRupee className="text-primary" />}
              {activeTab === 'staff' ? 'Mess Staff Directory' : 'Staff Salary Ledger'}
            </h2>
            <p className="text-gray-500 font-medium">Manage human resources and monthly disbursements.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-xl shadow-primary/20 hover:bg-black transition-all"
          >
            <UserPlus size={18} />
            Hire New Staff
          </button>
        </div>

        {activeTab === 'staff' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map(member => (
              <div key={member.id} className="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-8 hover:bg-white hover:shadow-xl transition-all group">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    <Briefcase size={28} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 tracking-tight text-lg">{member.name}</h4>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[8px] font-black uppercase tracking-widest">{member.role}</span>
                  </div>
                </div>
                
                <div className="space-y-4 pt-6 border-t border-gray-200/50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-gray-400">
                       <Phone size={14} />
                       <span className="text-xs font-bold text-gray-600">{member.mobile}</span>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Salary</p>
                       <p className="font-black text-gray-900">₹{member.salary}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${member.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {member.status}
                    </span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined: {member.joinDate}</span>
                  </div>
                </div>

                <button className="w-full mt-8 py-3 bg-white text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all border border-gray-100 shadow-sm">
                   View Performance Log
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                   <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="py-6 px-4">Staff Member</th>
                      <th className="py-6 px-4">Role</th>
                      <th className="py-6 px-4">Net Salary</th>
                      <th className="py-6 px-4">Last Paid</th>
                      <th className="py-6 px-4">Action</th>
                   </tr>
                </thead>
                <tbody>
                   {staff.map(member => (
                      <tr key={member.id} className="border-b border-gray-50">
                         <td className="py-6 px-4 font-bold text-gray-900">{member.name}</td>
                         <td className="py-6 px-4">
                            <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-[10px] font-black uppercase tracking-widest">{member.role}</span>
                         </td>
                         <td className="py-6 px-4 font-black text-primary">₹{member.salary}</td>
                         <td className="py-6 px-4 text-sm text-gray-400 font-bold">01 May 2026</td>
                         <td className="py-6 px-4">
                            <button className="px-4 py-2 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Pay Salary</button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white rounded-[3.5rem] shadow-2xl p-10"
            >
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black text-gray-900">New Hiring Record</h3>
                 <button onClick={() => setShowModal(false)} className="p-3 bg-gray-100 rounded-full"><X size={24} /></button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Staff Name</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role / Designation</label>
                       <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold">
                          <option value="Head Cook">Head Cook</option>
                          <option value="Asst. Cook">Asst. Cook</option>
                          <option value="Cleaner">Cleaner</option>
                          <option value="Helper">Helper</option>
                          <option value="Security">Security</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile No.</label>
                       <input type="tel" required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fixed Salary (₹)</label>
                       <input type="number" required value={formData.salary} onChange={e => setFormData({...formData, salary: Number(e.target.value)})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Joining Date</label>
                       <input type="date" required value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                    </div>
                 </div>
                 <button type="submit" className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:bg-black transition-all">Submit Record</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
