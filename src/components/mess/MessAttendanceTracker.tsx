import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ChevronLeft, ChevronRight, Check, X, Users, Search, AlertCircle, Save } from 'lucide-react';

interface Props {
  tenantId?: string;
}

export const MessAttendanceTracker: React.FC<Props> = ({ tenantId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [members, setMembers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchData();
    }
  }, [tenantId, selectedDate]);

  const fetchData = async () => {
    if (!tenantId) return;
    setLoading(true);
    const membersPath = `messes/${tenantId}/members`;
    const attPath = `messes/${tenantId}/attendance`;
    try {
      // Fetch Active Members
      const membersSnap = await getDocs(query(collection(db, membersPath), where('status', '==', 'Active')));
      const memList = membersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMembers(memList);

      // Fetch Attendance for selected date
      const attSnap = await getDocs(query(collection(db, attPath), where('date', '==', selectedDate)));
      const attMap: Record<string, any> = {};
      attSnap.forEach(doc => {
        attMap[doc.data().memberId] = { id: doc.id, ...doc.data() };
      });
      setAttendance(attMap);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, membersPath);
    } finally {
      setLoading(false);
    }
  };

  const toggleMeal = (memberId: string, meal: 'breakfast' | 'lunch' | 'dinner') => {
    setAttendance(prev => {
      const current = prev[memberId] || { 
        memberId, 
        date: selectedDate, 
        breakfast: false, 
        lunch: false, 
        dinner: false 
      };
      return {
        ...prev,
        [memberId]: {
          ...current,
          [meal]: !current[meal]
        }
      };
    });
  };

  const saveAttendance = async () => {
    if (!tenantId) {
      alert('Sync Error: Mess ID not found. Please re-login.');
      return;
    }
    setIsSaving(true);
    try {
      const batchPromises = Object.entries(attendance).map(async ([memberId, data]: [string, any]) => {
        const id = data.id || `${selectedDate}_${memberId}`;
        const path = `messes/${tenantId}/attendance/${id}`;
        
        if (!data.breakfast && !data.lunch && !data.dinner) {
          if (data.id) await deleteDoc(doc(db, `messes/${tenantId}/attendance`, id));
          return;
        }
        await setDoc(doc(db, `messes/${tenantId}/attendance`, id), {
          ...data,
          memberId,
          date: selectedDate,
          tenantId,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      });

      await Promise.all(batchPromises);
      alert('Attendance saved and synced to cloud!');
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `messes/${tenantId}/attendance`);
      alert('Cloud Sync Failed. Please check internet.');
    } finally {
      setIsSaving(false);
    }
  };

  const markAll = (type: 'all' | 'none') => {
    const newAtt = { ...attendance };
    filteredMembers.forEach(m => {
      newAtt[m.id] = {
        memberId: m.id,
        date: selectedDate,
        breakfast: type === 'all',
        lunch: type === 'all',
        dinner: type === 'all',
        id: attendance[m.id]?.id
      };
    });
    setAttendance(newAtt);
  };

  const moveDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.roomNo.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Calendar size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Today's Meal Log</h3>
                <p className="text-gray-400 font-medium text-xs font-bold uppercase tracking-widest mt-1">Mark attendance for breakfast, lunch, and dinner.</p>
              </div>
           </div>

           <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-[2rem] border border-gray-100">
              <button 
                onClick={() => moveDate(-1)}
                className="p-3 bg-white text-gray-400 hover:text-primary rounded-xl shadow-sm transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none outline-none font-black text-gray-900 text-sm focus:ring-0 uppercase tracking-tight"
              />
              <button 
                onClick={() => moveDate(1)}
                className="p-3 bg-white text-gray-400 hover:text-primary rounded-xl shadow-sm transition-all"
              >
                <ChevronRight size={20} />
              </button>
           </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
           <div className="flex-1 relative">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
             <input 
               type="text" 
               placeholder="Filter by name or room..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-16 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/10 font-bold transition-all text-sm"
             />
           </div>
           
           <button 
             onClick={saveAttendance}
             disabled={isSaving}
             className="px-10 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
           >
             {isSaving ? <Activity className="animate-spin" size={18} /> : <Save size={18} />}
             Save Daily Logs
           </button>
        </div>

        <div className="flex gap-2 mb-8 ml-1">
          <button 
            onClick={() => markAll('all')}
            className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100 shadow-sm hover:bg-green-100 transition-all font-bold"
          >
            Mark All Present
          </button>
          <button 
            onClick={() => markAll('none')}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 shadow-sm hover:bg-red-100 transition-all font-bold"
          >
            Clear All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="py-6 px-4">Member / Room</th>
                <th className="py-6 px-4 text-center">Breakfast</th>
                <th className="py-6 px-4 text-center">Lunch</th>
                <th className="py-6 px-4 text-center">Dinner</th>
                <th className="py-6 px-4 text-center">Total Meals</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(member => {
                const att = attendance[member.id] || { breakfast: false, lunch: false, dinner: false };
                const total = [att.breakfast, att.lunch, att.dinner].filter(Boolean).length;
                
                return (
                  <tr key={member.id} className="border-b border-gray-50/50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-6 px-4">
                      <div className="space-y-0.5">
                        <p className="font-black text-gray-900 tracking-tight">{member.name}</p>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Rm: {member.roomNo}</p>
                      </div>
                    </td>
                    <td className="py-6 px-4 text-center">
                       <button 
                         onClick={() => toggleMeal(member.id, 'breakfast')}
                         className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all ${att.breakfast ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-gray-100 text-gray-300'}`}
                       >
                         {att.breakfast ? <Check size={18} /> : <X size={18} />}
                       </button>
                    </td>
                    <td className="py-6 px-4 text-center">
                       <button 
                        onClick={() => toggleMeal(member.id, 'lunch')}
                        className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all ${att.lunch ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-gray-100 text-gray-300'}`}
                       >
                         {att.lunch ? <Check size={18} /> : <X size={18} />}
                       </button>
                    </td>
                    <td className="py-6 px-4 text-center">
                       <button 
                        onClick={() => toggleMeal(member.id, 'dinner')}
                        className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all ${att.dinner ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-gray-100 text-gray-300'}`}
                       >
                         {att.dinner ? <Check size={18} /> : <X size={18} />}
                       </button>
                    </td>
                    <td className="py-6 px-4 text-center">
                       <span className={`px-4 py-1.5 rounded-full text-xs font-black ${total > 0 ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                         {total} Meals
                       </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="py-20 text-center">
             <Users className="mx-auto text-gray-200 mb-4" size={48} />
             <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No matching members found.</p>
          </div>
        )}
      </div>

      <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-6">
         <div className="p-4 bg-white rounded-2xl text-blue-500 shadow-sm">
           <AlertCircle size={24} />
         </div>
         <div>
           <h4 className="text-lg font-black text-blue-900 tracking-tight">Quick Tip</h4>
           <p className="text-sm font-bold text-blue-700/70 leading-relaxed mt-1 max-w-2xl">
             You can mark attendance for previous days using the date selector. Remember to hit "Save Daily Logs" after marking meals to ensure billing accuracy.
           </p>
         </div>
      </div>
    </div>
  );
};

const Activity = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} height={size || 24} 
    viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);
