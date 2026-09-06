import React, { useState } from 'react';
import { 
  Wallet, Search, Plus, User, DollarSign, Calendar, 
  Trash2, Edit3, X, CheckCircle2, Building2, UserCircle,
  Briefcase, Phone, Clock, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { AgroState, AgroEmployee, AgroSalary } from './types';
import { handleFirestoreError, OperationType } from '../../lib/firebase';
import { LoadingSpinner } from './ui/LoadingSpinner';

export const EmployeesTab: React.FC<{ state: AgroState; shopId: string | null }> = ({ state, shopId }) => {
  const [activeSubTab, setActiveSubTab] = useState<'Employees' | 'Payroll'>('Employees');
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [newEmployee, setNewEmployee] = useState<Partial<AgroEmployee>>({
    name: '',
    contact: '',
    designation: '',
    salary: 0,
    status: 'Active',
    joiningDate: new Date().toISOString().split('T')[0]
  });

  const [newSalary, setNewSalary] = useState<Partial<AgroSalary>>({
    employeeId: '',
    employeeName: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    basicSalary: 0,
    allowances: 0,
    deductions: 0,
    netSalary: 0,
    paymentStatus: 'Pending',
    date: new Date().toISOString().split('T')[0]
  });

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;
    setIsProcessing(true);
    try {
      await addDoc(collection(db, 'agro_shops', shopId, 'employees'), {
        ...newEmployee,
        createdAt: new Date().toISOString()
      });
      setIsEmpModalOpen(false);
      setNewEmployee({
        name: '',
        contact: '',
        designation: '',
        salary: 0,
        status: 'Active',
        joiningDate: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `agro_shops/${shopId}/employees`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaySalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;
    setIsProcessing(true);
    try {
      await addDoc(collection(db, 'agro_shops', shopId, 'salaries'), {
        ...newSalary,
        createdAt: new Date().toISOString()
      });
      setIsSalaryModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `agro_shops/${shopId}/salaries`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic">Staff & <span className="text-primary italic">Payroll</span></h2>
          <p className="text-gray-500 text-xs font-black uppercase tracking-widest mt-1">Manage team and salary disbursements</p>
        </div>
        <div className="flex bg-white dark:bg-gray-900 p-1.5 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
          <button 
            onClick={() => setActiveSubTab('Employees')}
            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'Employees' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Staff List
          </button>
          <button 
            onClick={() => setActiveSubTab('Payroll')}
            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'Payroll' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Payroll
          </button>
        </div>
      </div>

      {activeSubTab === 'Employees' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search staff members..."
                className="w-full bg-white dark:bg-gray-900 border-none rounded-[2rem] pl-16 pr-8 py-5 text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-primary/5 transition-all"
              />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button 
                onClick={() => setIsEmpModalOpen(true)}
                className="px-8 py-4 bg-primary text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2 hover:bg-black transition-all"
              >
                <Plus size={18} /> Add Employee
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.loading ? (
              <div className="col-span-full">
                <LoadingSpinner label="Fetching Staff Records..." />
              </div>
            ) : state.employees.length > 0 ? state.employees.map((emp) => (
              <motion.div 
                key={emp.id}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 bg-primary/10 text-primary rounded-[2rem]">
                    <UserCircle size={32} />
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${emp.status === 'Active' ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-100 text-gray-400'}`}>
                    {emp.status}
                  </span>
                </div>
                <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tight">{emp.name}</h4>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 mt-1 italic">
                  <Briefcase size={12} /> {emp.designation}
                </p>
                <div className="mt-8 space-y-3">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <Phone size={12} /> Contact
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">{emp.contact}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <DollarSign size={12} /> Base Salary
                    </span>
                    <span className="font-black text-gray-900 dark:text-white italic">₹{emp.salary.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <Clock size={12} /> Joined
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">{emp.joiningDate}</span>
                  </div>
                </div>
                <div className="mt-8 flex gap-2">
                   <button 
                    onClick={() => {
                        setNewSalary({
                            employeeId: emp.id,
                            employeeName: emp.name,
                            basicSalary: emp.salary,
                            netSalary: emp.salary,
                            month: new Date().toISOString().slice(0, 7),
                            allowances: 0,
                            deductions: 0,
                            paymentStatus: 'Pending',
                            date: new Date().toISOString().split('T')[0]
                        });
                        setIsSalaryModalOpen(true);
                    }}
                    className="flex-1 py-4 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all border border-transparent shadow-sm"
                   >
                     Process Salary
                   </button>
                </div>
              </motion.div>
            )) : !state.loading && (
              <div className="col-span-full py-20 text-center">
                <User size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic">No staff members in database</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
           {state.loading ? (
             <LoadingSpinner label="Compiling Payroll Records..." />
           ) : (
             <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Month / Date</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Net Amount</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {state.salaries.length > 0 ? state.salaries.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((sal) => (
                      <tr key={sal.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/5 text-primary rounded-xl">
                              <User size={16} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase italic">{sal.employeeName}</p>
                              <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">{sal.department || 'Staff'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-[10px] font-black text-primary uppercase italic">{sal.month}</p>
                          <p className="text-[8px] font-medium text-gray-400 mt-1">{sal.date}</p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <p className="text-[12px] font-black text-gray-900 dark:text-white font-mono italic">₹{sal.netSalary.toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex justify-center">
                            <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${sal.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                              {sal.paymentStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex justify-end">
                              <button className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-xl hover:text-primary transition-colors">
                                  <FileText size={16} />
                              </button>
                           </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                          <DollarSign size={48} className="mx-auto text-gray-200 mb-4" />
                          <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic">No salary records found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
             </div>
           )}
        </div>
      )}

      {/* Employee Modal */}
      <AnimatePresence>
        {isEmpModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsEmpModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-[3.5rem] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleCreateEmployee} className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic">Add Team <span className="text-primary italic">Member</span></h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Onboard new employee</p>
                  </div>
                  <button type="button" onClick={() => setIsEmpModalOpen(false)} className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl hover:text-red-500 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      required
                      type="text"
                      placeholder="Enter employee name..."
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-primary/5 uppercase italic"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Number</label>
                      <input 
                        required
                        type="text"
                        placeholder="Mobile..."
                        value={newEmployee.contact}
                        onChange={(e) => setNewEmployee({ ...newEmployee, contact: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-primary/5"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Designation</label>
                      <input 
                        required
                        type="text"
                        placeholder="e.g., Sales, Manager..."
                        value={newEmployee.designation}
                        onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-primary/5 italic"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Monthly Salary</label>
                      <input 
                        required
                        type="number"
                        placeholder="₹..."
                        value={newEmployee.salary || ''}
                        onChange={(e) => setNewEmployee({ ...newEmployee, salary: Number(e.target.value) })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-primary/5 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Joining Date</label>
                      <input 
                        required
                        type="date"
                        value={newEmployee.joiningDate}
                        onChange={(e) => setNewEmployee({ ...newEmployee, joiningDate: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-primary/5"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <button 
                    disabled={isProcessing}
                    className="w-full py-5 bg-primary text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isProcessing ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <UserCircle size={18} />}
                    Complete Onboarding
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Salary Modal */}
      <AnimatePresence>
        {isSalaryModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSalaryModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-[3.5rem] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handlePaySalary} className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic">Process <span className="text-primary italic">Salary</span></h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Disburse payout for {newSalary.employeeName}</p>
                  </div>
                  <button type="button" onClick={() => setIsSalaryModalOpen(false)} className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl hover:text-red-500 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Salary Month</label>
                        <input 
                          required
                          type="month"
                          value={newSalary.month}
                          onChange={(e) => setNewSalary({ ...newSalary, month: e.target.value })}
                          className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-xs font-black outline-none focus:ring-4 focus:ring-primary/5"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Date</label>
                        <input 
                          required
                          type="date"
                          value={newSalary.date}
                          onChange={(e) => setNewSalary({ ...newSalary, date: e.target.value })}
                          className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-xs font-black outline-none focus:ring-4 focus:ring-primary/5"
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Basic</label>
                        <input 
                          required type="number" value={newSalary.basicSalary}
                          onChange={(e) => {
                            const basic = Number(e.target.value);
                            setNewSalary({ ...newSalary, basicSalary: basic, netSalary: basic + (newSalary.allowances || 0) - (newSalary.deductions || 0) });
                          }}
                          className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-xs font-black outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-emerald-500 uppercase tracking-widest ml-1">Allowances</label>
                        <input 
                          type="number" value={newSalary.allowances || ''}
                          onChange={(e) => {
                            const allow = Number(e.target.value);
                            setNewSalary({ ...newSalary, allowances: allow, netSalary: (newSalary.basicSalary || 0) + allow - (newSalary.deductions || 0) });
                          }}
                          className="w-full bg-emerald-50 text-emerald-600 border-none rounded-xl px-4 py-3 text-xs font-black outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-red-500 uppercase tracking-widest ml-1">Deductions</label>
                        <input 
                          type="number" value={newSalary.deductions || ''}
                          onChange={(e) => {
                            const ded = Number(e.target.value);
                            setNewSalary({ ...newSalary, deductions: ded, netSalary: (newSalary.basicSalary || 0) + (newSalary.allowances || 0) - ded });
                          }}
                          className="w-full bg-red-50 text-red-600 border-none rounded-xl px-4 py-3 text-xs font-black outline-none font-mono"
                        />
                      </div>
                   </div>

                   <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10">
                      <div className="flex items-center justify-between">
                         <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Net Payable</span>
                         <span className="text-2xl font-black text-primary italic font-mono transition-all animate-pulse">₹{(newSalary.netSalary || 0).toLocaleString()}</span>
                      </div>
                   </div>

                   <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Status</label>
                    <div className="flex gap-2">
                        {['Pending', 'Paid'].map((st) => (
                           <button 
                            key={st} type="button"
                            onClick={() => setNewSalary({ ...newSalary, paymentStatus: st as any })}
                            className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${newSalary.paymentStatus === st ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-50 text-gray-400'}`}
                           >
                             {st}
                           </button>
                        ))}
                    </div>
                   </div>
                </div>

                <div className="mt-8">
                  <button 
                    disabled={isProcessing}
                    className="w-full py-5 bg-black text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-primary transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isProcessing ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <DollarSign size={18} />}
                    Disburse & Record Payment
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
