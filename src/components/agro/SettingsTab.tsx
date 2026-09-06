import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, User, Shield, 
  Trash2, Mail, Phone, Lock, Plus, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../lib/firebase';
import { collection, doc, setDoc, updateDoc, onSnapshot, addDoc } from 'firebase/firestore';
import { AgroState, AgroSettings, AgroUser, AgroRole } from './types';
import { handleFirestoreError, OperationType } from '../../lib/firebase';

export const SettingsTab: React.FC<{ state: AgroState; shopId: string | null }> = ({ state, shopId }) => {
  const [settings, setSettings] = useState<AgroSettings>(state.settings || {
    shopName: '',
    ownerName: '',
    address: '',
    gstin: '',
    contact: '',
    lowStockThreshold: 10,
    expiryWarningDays: 30
  });

  const [staff, setStaff] = useState<AgroUser[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    email: '',
    role: 'Cashier' as AgroRole
  });

  useEffect(() => {
    if (!shopId) return;
    const unsub = onSnapshot(collection(db, 'agro_shops', shopId, 'users'), (snap) => {
      setStaff(snap.docs.map(d => ({ ...d.data() } as AgroUser)));
    });
    return () => unsub();
  }, [shopId]);

  useEffect(() => {
    if (state.settings) setSettings(state.settings);
  }, [state.settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !shopId) return;

    try {
      await setDoc(doc(db, 'agro_shops', shopId), { settings }, { merge: true });
      alert('Settings updated successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `agro_shops/${shopId}`);
    }
  };

  const handleAddStaff = async () => {
    if (!auth.currentUser || !shopId || !newStaff.email) return;
    try {
       // In a real app we'd trigger a cloud function to invite
       // For this demo we just record who has access
       await addDoc(collection(db, 'agro_shops', shopId, 'users'), {
         email: newStaff.email,
         role: newStaff.role,
         shopId,
         createdAt: new Date().toISOString()
       });
       setIsStaffModalOpen(false);
    } catch (err) {
       handleFirestoreError(err, OperationType.WRITE, `agro_shops/${shopId}/users`);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight italic uppercase">Shop <span className="text-primary italic">Intelligence</span></h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Configure business rules & access control</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-xl hover:shadow-primary/5">
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-10 flex items-center gap-2">
            <Settings size={18} className="text-primary" /> Profile & Business Info
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Shop Name</label>
                <input 
                  type="text" 
                  value={settings.shopName}
                  onChange={e => setSettings({...settings, shopName: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold mt-1 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Owner Name</label>
                <input 
                  type="text" 
                  value={settings.ownerName}
                  onChange={e => setSettings({...settings, ownerName: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold mt-1 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">GSTIN</label>
                <input 
                  type="text" 
                  value={settings.gstin}
                  onChange={e => setSettings({...settings, gstin: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold mt-1 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fertilizer License</label>
                <input 
                  type="text" 
                  value={settings.fertilizerLicense || ''}
                  onChange={e => setSettings({...settings, fertilizerLicense: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold mt-1 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Seed License</label>
                <input 
                  type="text" 
                  value={settings.seedLicense || ''}
                  onChange={e => setSettings({...settings, seedLicense: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold mt-1 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Insecticide License</label>
                <input 
                  type="text" 
                  value={settings.insecticideLicense || ''}
                  onChange={e => setSettings({...settings, insecticideLicense: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold mt-1 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cotton License</label>
                <input 
                  type="text" 
                  value={settings.cottonLicense || ''}
                  onChange={e => setSettings({...settings, cottonLicense: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold mt-1 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">General Licence No</label>
                <input 
                  type="text" 
                  value={settings.licenceNo || ''}
                  onChange={e => setSettings({...settings, licenceNo: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold mt-1 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Business Address</label>
                <textarea 
                  value={settings.address}
                  onChange={e => setSettings({...settings, address: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold mt-1 focus:ring-2 focus:ring-primary/20 outline-none h-24"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Inventory Alert (Qty)</label>
                <input 
                  type="number" 
                  value={settings.lowStockThreshold}
                  onChange={e => setSettings({...settings, lowStockThreshold: Number(e.target.value)})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold mt-1 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Expiry Warning (Days)</label>
                <input 
                  type="number" 
                  value={settings.expiryWarningDays}
                  onChange={e => setSettings({...settings, expiryWarningDays: Number(e.target.value)})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold mt-1 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>

            <button type="submit" className="w-full py-5 bg-black text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-primary transition-all mt-4 flex items-center justify-center gap-2">
              <Save size={18}/> Update System Configuration
            </button>
          </form>
        </div>

        {/* User Access Control */}
        <div className="space-y-8">
           <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                   <Shield size={18} className="text-orange-500" /> Administrative Users
                 </h3>
                 <button onClick={() => setIsStaffModalOpen(true)} className="p-3 bg-gray-50 rounded-xl text-primary"><Plus size={18}/></button>
              </div>

              <div className="space-y-4">
                {staff.map((user, i) => (
                  <div key={user.email || i} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-50 dark:border-gray-800 group">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400">
                          <User size={20} />
                       </div>
                       <div>
                         <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{user.email}</p>
                         <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-0.5">{user.role}</p>
                       </div>
                    </div>
                    <button className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                  </div>
                ))}
                {staff.length === 0 && (
                  <div className="py-12 text-center">
                    <Lock size={48} className="mx-auto text-gray-100 mb-4" />
                    <p className="text-xs font-bold text-gray-400 italic">No additional staff members added.</p>
                  </div>
                )}
              </div>
           </div>

           {/* Stats Summary */}
           <div className="bg-primary/5 p-10 rounded-[3rem] border border-primary/10">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Security Protocol</p>
              <p className="text-gray-600 dark:text-gray-400 text-xs font-bold leading-relaxed italic">
                "System access is audited in real-time. Only authorized mobile devices can access billing modules. Multi-company state is preserved across sessions."
              </p>
           </div>
        </div>
      </div>

       <AnimatePresence>
        {isStaffModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
               className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 shadow-2xl"
            >
               <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-black text-gray-900 uppercase italic">Add <span className="text-primary italic">User</span></h3>
                 <button onClick={() => setIsStaffModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
               </div>
               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">User Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" placeholder="staff@agro.com" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl pl-12 pr-4 py-4 text-xs font-bold outline-none ring-1 ring-gray-100 focus:ring-primary transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Access Level</label>
                    <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value as any})} className="w-full bg-gray-50 border-none rounded-xl px-4 py-4 text-xs font-bold outline-none ring-1 ring-gray-100 focus:ring-primary transition-all">
                      <option value="Admin">Full Access (Admin)</option>
                      <option value="Manager">Inventory Manager</option>
                      <option value="Cashier">Cashier (Billing Only)</option>
                      <option value="Viewer">Read Only (Viewer)</option>
                    </select>
                  </div>
                  <button onClick={handleAddStaff} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20">Grant Access</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
