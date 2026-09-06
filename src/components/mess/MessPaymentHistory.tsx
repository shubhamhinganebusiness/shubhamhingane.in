import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, Timestamp, orderBy, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, Plus, Search, Trash2, 
  X, Filter, Calendar, Wallet, CheckCircle2,
  TrendingDown, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

interface Props {
  tenantId?: string;
}

export const MessPaymentHistory: React.FC<Props> = ({ tenantId }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    memberId: '',
    amount: 0,
    method: 'Cash',
    remark: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (tenantId) {
      fetchPayments();
      fetchMembers();
    }
  }, [tenantId]);

  const fetchMembers = async () => {
    if (!tenantId) return;
    const q = query(collection(db, `messes/${tenantId}/members`), where('status', '==', 'Active'));
    const snap = await getDocs(q);
    setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchPayments = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const q = query(collection(db, `messes/${tenantId}/payments`), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    try {
      const paymentId = `PAY_${Date.now()}`;
      const batch = writeBatch(db);
      
      const paymentData = {
        ...formData,
        id: paymentId,
        tenantId,
        date: Timestamp.fromDate(new Date(formData.date))
      };

      batch.set(doc(db, `messes/${tenantId}/payments`, paymentId), paymentData);
      
      // Update Member Balance
      const member = members.find(m => m.id === formData.memberId);
      if (member) {
        const memberRef = doc(db, `messes/${tenantId}/members`, formData.memberId);
        batch.update(memberRef, { balance: (member.balance || 0) - formData.amount });
      }

      await batch.commit();
      alert('Payment recorded successfully!');
      setShowAddModal(false);
      setFormData({ memberId: '', amount: 0, method: 'Cash', remark: '', date: new Date().toISOString().split('T')[0] });
      fetchPayments();
      fetchMembers();
    } catch (err) {
      console.error(err);
      alert('Error recording payment');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                <CreditCard size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Payment Ledger</h3>
                <p className="text-gray-400 font-medium text-xs font-bold uppercase tracking-widest mt-1">Record member payments and track collection history.</p>
              </div>
           </div>

           <button 
             onClick={() => setShowAddModal(true)}
             className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-xl shadow-primary/20 hover:bg-black transition-all"
           >
             <Plus size={18} />
             Record Payment
           </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="py-6 px-4">Transaction Details</th>
                <th className="py-6 px-4">Member Name</th>
                <th className="py-6 px-4 text-center">Method</th>
                <th className="py-6 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => {
                const member = members.find(m => m.id === payment.memberId);
                return (
                  <tr key={payment.id} className="border-b border-gray-50/50 hover:bg-gray-50/50 transition-colors group">
                    <td className="py-6 px-4">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                             <ArrowDownLeft size={18} />
                          </div>
                          <div>
                             <p className="text-xs font-black text-gray-400 uppercase tracking-widest">#{payment.id.slice(-8)}</p>
                             <p className="font-bold text-gray-900">{payment.date.toDate().toLocaleDateString()}</p>
                          </div>
                       </div>
                    </td>
                    <td className="py-6 px-4">
                       <p className="font-black text-gray-900 tracking-tight">{member?.name || 'Unknown'}</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">RM: {member?.roomNo}</p>
                    </td>
                    <td className="py-6 px-4 text-center">
                       <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${payment.method === 'Cash' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                         {payment.method}
                       </span>
                    </td>
                    <td className="py-6 px-4 text-right">
                       <p className="text-xl font-black text-gray-900 tracking-tight">₹{payment.amount}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {payments.length === 0 && !loading && (
          <div className="py-24 text-center">
             <Wallet className="mx-auto text-gray-100 mb-6" size={84} />
             <h3 className="text-xl font-black text-gray-300">No Payments Recorded Yet</h3>
             <p className="text-gray-400 font-medium">Click "Record Payment" to clear member balances.</p>
          </div>
        )}
      </div>

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
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">Record Collection</h3>
                      <p className="text-gray-400 font-medium text-sm mt-1">Enter payment details to sync member ledger.</p>
                   </div>
                   <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-gray-200 rounded-full transition-colors">
                      <X size={24} />
                   </button>
                </div>

                <form onSubmit={handleAddPayment} className="p-10 space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Member</label>
                     <select 
                       required
                       value={formData.memberId}
                       onChange={(e) => setFormData({...formData, memberId: e.target.value})}
                       className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold"
                     >
                       <option value="">Choose a member...</option>
                       {members.map(m => <option key={m.id} value={m.id}>{m.name} (RM {m.roomNo}) - Due: ₹{m.balance}</option>)}
                     </select>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Paid Amount (₹)</label>
                        <input 
                          type="number" required
                          value={formData.amount}
                          onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
                        <select 
                          required
                          value={formData.method}
                          onChange={(e) => setFormData({...formData, method: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold"
                        >
                          <option value="Cash">Cash</option>
                          <option value="Online">Online/UPI</option>
                        </select>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Date</label>
                      <input 
                        type="date" required
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold" 
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Remarks (Optional)</label>
                      <input 
                        type="text"
                        placeholder="e.g. Paid via GPay"
                        value={formData.remark}
                        onChange={(e) => setFormData({...formData, remark: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold" 
                      />
                   </div>

                   <div className="pt-6 flex gap-4">
                      <button 
                        type="submit"
                        className="flex-1 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 hover:bg-black transition-all"
                      >
                        Confirm Payment
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowAddModal(false)}
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
