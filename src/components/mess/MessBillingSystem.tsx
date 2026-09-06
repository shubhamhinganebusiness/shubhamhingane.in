import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Receipt, Download, Search, Filter, 
  Calendar, CreditCard, CheckCircle2, 
  AlertTriangle, FileText, Send 
} from 'lucide-react';

interface Props {
  tenantId?: string;
}

export const MessBillingSystem: React.FC<Props> = ({ tenantId }) => {
  const [bills, setBills] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchBills();
      fetchMembers();
    }
  }, [tenantId, selectedMonth, selectedYear]);

  const fetchMembers = async () => {
    if (!tenantId) return;
    const path = `messes/${tenantId}/members`;
    try {
      const q = query(collection(db, path), where('status', '==', 'Active'));
      const snap = await getDocs(q);
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  };

  const fetchBills = async () => {
    if (!tenantId) return;
    setLoading(true);
    const path = `messes/${tenantId}/bills`;
    try {
      const q = query(collection(db, path), where('month', '==', selectedMonth), where('year', '==', selectedYear));
      const snap = await getDocs(q);
      setBills(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    } finally {
      setLoading(false);
    }
  };

  const generateBills = async () => {
    if (!tenantId) return;
    setIsGenerating(true);
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();
      
      for (const member of members) {
         const billId = `BILL_${selectedYear}_${selectedMonth}_${member.id}`;
         const billPath = `messes/${tenantId}/bills/${billId}`;
         
         const billData = {
           id: billId,
           memberId: member.id,
           memberName: member.name,
           roomNo: member.roomNo,
           month: selectedMonth,
           year: selectedYear,
           baseFee: member.monthlyFee,
           extraMealsCharge: 0,
           totalAmount: member.monthlyFee,
           paidAmount: 0,
           status: 'Unpaid',
           generatedAt: now,
           tenantId
         };
         
         batch.set(doc(db, `messes/${tenantId}/bills`, billId), billData);
         
         // Update member balance
         const memberRef = doc(db, `messes/${tenantId}/members`, member.id);
         batch.update(memberRef, { balance: (member.balance || 0) + member.monthlyFee });
      }

      await batch.commit();
      alert(`Success: Bills generated for ${members.length} members.`);
      fetchBills();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `messes/${tenantId}`);
      alert('Generation Failed: Possible permission or quota issue.');
    } finally {
      setIsGenerating(false);
    }
  };

  const recordPayment = async (bill: any) => {
    if (!tenantId) return;
    if (!confirm(`Record payment of ₹${bill.totalAmount} for ${bill.memberName}?`)) return;

    try {
      const batch = writeBatch(db);
      const paymentId = `PAY_${Date.now()}`;
      
      // 1. Create payment record
      batch.set(doc(db, `messes/${tenantId}/payments`, paymentId), {
        id: paymentId,
        memberId: bill.memberId,
        amount: bill.totalAmount,
        date: Timestamp.now(),
        method: 'Cash',
        remark: `Bill payment for ${months[bill.month]} ${bill.year}`,
        tenantId
      });

      // 2. Update bill status
      batch.update(doc(db, `messes/${tenantId}/bills`, bill.id), {
        status: 'Paid',
        paidAmount: bill.totalAmount
      });

      // 3. Update member balance
      const memberDocs = await getDocs(query(collection(db, `messes/${tenantId}/members`), where('id', '==', bill.memberId)));
      if (!memberDocs.empty) {
        const memberRef = memberDocs.docs[0].ref;
        const currentBalance = memberDocs.docs[0].data().balance || 0;
        batch.update(memberRef, { balance: Math.max(0, currentBalance - bill.totalAmount) });
      }

      await batch.commit();
      alert('Payment recorded and balance updated!');
      fetchBills();
    } catch (err) {
      console.error(err);
      alert('Payment recording failed.');
    }
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <Receipt size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Billing Center</h3>
                <p className="text-gray-400 font-medium text-xs font-bold uppercase tracking-widest mt-1">Generate and distribute monthly mess invoices.</p>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-gray-50 border-none outline-none font-bold text-gray-900 text-sm p-4 rounded-2xl focus:ring-4 focus:ring-primary/10"
              >
                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-gray-50 border-none outline-none font-bold text-gray-900 text-sm p-4 rounded-2xl focus:ring-4 focus:ring-primary/10"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>

              <button 
                onClick={generateBills}
                disabled={isGenerating || bills.length > 0}
                className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-xl shadow-primary/20 hover:bg-black transition-all disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : bills.length > 0 ? 'Bills Generated' : 'Run Monthly Billing'}
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {bills.map(bill => (
              <motion.div 
                layout
                key={bill.id}
                className="bg-gray-50 border border-gray-100 rounded-[2rem] p-8 group hover:bg-white hover:shadow-xl transition-all"
              >
                 <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                      <FileText size={20} />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${bill.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {bill.status}
                    </span>
                 </div>

                 <div className="space-y-1 mb-8">
                    <h4 className="font-black text-gray-900 tracking-tight">{bill.memberName}</h4>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Inv: #{bill.id.slice(-8)}</p>
                 </div>

                 <div className="space-y-3 pt-6 border-t border-gray-200">
                    <div className="flex justify-between">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Fee</span>
                       <span className="text-sm font-bold text-gray-600">₹{bill.baseFee}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                       <span className="text-xs font-black text-gray-900 uppercase">Total Amount</span>
                       <span className="text-lg font-black text-primary">₹{bill.totalAmount}</span>
                    </div>
                 </div>

                 <div className="mt-8 flex gap-2">
                    <button className="flex-1 py-3 bg-white text-gray-400 rounded-xl flex items-center justify-center hover:text-primary border border-gray-100 shadow-sm transition-all hover:scale-105 active:scale-95">
                       <Download size={16} />
                    </button>
                    <button className="flex-1 py-3 bg-white text-gray-400 rounded-xl flex items-center justify-center hover:text-green-500 border border-gray-100 shadow-sm transition-all hover:scale-105 active:scale-95">
                       <Send size={16} />
                    </button>
                 </div>
              </motion.div>
           ))}
        </div>

        {bills.length === 0 && !loading && (
          <div className="p-20 text-center">
             <AlertTriangle className="mx-auto text-orange-200 mb-6" size={64} />
             <h3 className="text-2xl font-black text-gray-300">No Bills for {months[selectedMonth]} {selectedYear}</h3>
             <p className="text-gray-400 font-medium mt-2">Generate bills to see them here.</p>
          </div>
        )}
      </div>

      <div className="p-10 bg-gray-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
               <CreditCard size={32} />
            </div>
            <div>
               <h4 className="text-2xl font-black tracking-tight">Need a Payment Gateway?</h4>
               <p className="text-white/50 text-sm font-medium mt-1">Enable UPI & Bank Transfer reconciliation for your mess members.</p>
            </div>
         </div>
         <button className="px-10 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-2xl shadow-primary/20">
            Contact Support
         </button>
      </div>
    </div>
  );
};
