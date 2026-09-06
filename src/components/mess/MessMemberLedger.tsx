import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Receipt, CreditCard, ChevronLeft, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';

interface Props {
  tenantId?: string;
  memberId: string;
  onBack: () => void;
}

export const MessMemberLedger: React.FC<Props> = ({ tenantId, memberId, onBack }) => {
  const [member, setMember] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenantId && memberId) {
      fetchData();
    }
  }, [tenantId, memberId]);

  const fetchData = async () => {
    setLoading(true);
    const billsPath = `messes/${tenantId}/bills`;
    const paymentsPath = `messes/${tenantId}/payments`;
    try {
      // Fetch member details
      const memberDocs = await getDocs(query(collection(db, `messes/${tenantId}/members`), where('id', '==', memberId)));
      if (!memberDocs.empty) {
        setMember(memberDocs.docs[0].data());
      }

      // Fetch Bills
      const billsSnap = await getDocs(query(collection(db, billsPath), where('memberId', '==', memberId)));
      const bills = billsSnap.docs.map(d => ({ ...d.data(), type: 'BILL' }));

      // Fetch Payments
      const paymentsSnap = await getDocs(query(collection(db, paymentsPath), where('memberId', '==', memberId)));
      const payments = paymentsSnap.docs.map(d => ({ ...d.data(), type: 'PAYMENT' }));

      // Combine and sort
      const combined = [...bills, ...payments].sort((a: any, b: any) => {
        const timeA = a.generatedAt ? a.generatedAt.toMillis() : a.date.toMillis();
        const timeB = b.generatedAt ? b.generatedAt.toMillis() : b.date.toMillis();
        return timeB - timeA;
      });

      setTransactions(combined);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, billsPath);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-400 font-bold">LOADING LEDGER...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-primary hover:bg-primary/5 transition-all">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">{member?.name}'s Ledger</h2>
          <p className="text-primary font-black uppercase text-[10px] tracking-widest">Member Financial History</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Current Balance</p>
          <h3 className={`text-4xl font-black tracking-tight ${member?.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
            ₹{member?.balance || 0}
          </h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Monthly Fee</p>
          <h3 className="text-4xl font-black text-gray-900 tracking-tight">₹{member?.monthlyFee || 0}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Joining Date</p>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">{member?.joinDate}</h3>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <Calendar className="text-primary" />
             Transaction History
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="py-6 px-10">Date</th>
                <th className="py-6 px-10">Type</th>
                <th className="py-6 px-10">Details</th>
                <th className="py-6 px-10 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr key={tx.id || idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-6 px-10">
                    <span className="font-bold text-gray-900">
                      {tx.type === 'BILL' 
                        ? tx.generatedAt.toDate().toLocaleDateString() 
                        : tx.date.toDate().toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-6 px-10">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex w-fit items-center gap-2 ${tx.type === 'BILL' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                      {tx.type === 'BILL' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-6 px-10">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-gray-600">
                        {tx.type === 'BILL' 
                          ? `${new Date(tx.year, tx.month).toLocaleString('default', { month: 'long' })} ${tx.year} Mess Fee`
                          : (tx.remark || `Payment via ${tx.method}`)}
                      </p>
                      {tx.type === 'BILL' && (
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base: ₹{tx.baseFee}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-6 px-10 text-right">
                    <span className={`text-lg font-black ${tx.type === 'BILL' ? 'text-red-500' : 'text-green-500'}`}>
                      {tx.type === 'BILL' ? '+' : '-'} ₹{tx.type === 'BILL' ? tx.totalAmount : tx.amount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
              No transactions found for this member.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
