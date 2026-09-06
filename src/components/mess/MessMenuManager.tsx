import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Utensils, Calendar as CalendarIcon, Plus, 
  Trash2, Edit2, X, Save, Clock
} from 'lucide-react';

interface Props {
  tenantId?: string;
}

export const MessMenuManager: React.FC<Props> = ({ tenantId }) => {
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    day: 'Monday',
    breakfast: '',
    lunch: '',
    dinner: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (tenantId) fetchMenus();
  }, [tenantId]);

  const fetchMenus = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, `messes/${tenantId}/menus`)));
      const menuList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by days order
      const sorted = days.map(day => menuList.find((m: any) => m.day === day) || { day, breakfast: '-', lunch: '-', dinner: '-' });
      setMenus(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    try {
      const menuId = formData.day;
      await setDoc(doc(db, `messes/${tenantId}/menus`, menuId), {
        ...formData,
        tenantId,
        updatedAt: new Date().toISOString()
      });
      setShowModal(false);
      fetchMenus();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Utensils className="text-primary" />
              Weekly Menu Plan
            </h2>
            <p className="text-gray-500 font-medium">Standardize meals and keep members informed.</p>
          </div>
          <button onClick={() => {setEditingMenu(null); setShowModal(true)}} className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-xl shadow-primary/20 hover:bg-black transition-all">
            <Plus size={18} />
            Update Daily Menu
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menus.map((menu, idx) => (
            <motion.div 
              key={menu.day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white border border-gray-100 rounded-[2rem] p-8 hover:shadow-xl transition-all group"
            >
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xl font-black text-gray-900">{menu.day}</h4>
                <button 
                  onClick={() => {
                    setEditingMenu(menu);
                    setFormData(menu);
                    setShowModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-primary transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                    <Clock size={12} /> Breakfast
                  </div>
                  <p className="text-sm font-bold text-gray-700 bg-amber-50/50 p-3 rounded-xl border border-amber-50">{menu.breakfast}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                    <Clock size={12} /> Lunch
                  </div>
                  <p className="text-sm font-bold text-gray-700 bg-blue-50/50 p-3 rounded-xl border border-blue-50">{menu.lunch}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-purple-500 uppercase tracking-widest">
                    <Clock size={12} /> Dinner
                  </div>
                  <p className="text-sm font-bold text-gray-700 bg-purple-50/50 p-3 rounded-xl border border-purple-50">{menu.dinner}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Configure Menu</h3>
                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white rounded-full transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleSave} className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Day of Week</label>
                  <select 
                    value={formData.day}
                    onChange={(e) => setFormData({...formData, day: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold"
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Breakfast Menu</label>
                  <textarea 
                    value={formData.breakfast}
                    onChange={(e) => setFormData({...formData, breakfast: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold min-h-[80px]"
                    placeholder="E.g. Poha, Jalebi, Tea"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lunch Menu</label>
                  <textarea 
                    value={formData.lunch}
                    onChange={(e) => setFormData({...formData, lunch: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold min-h-[80px]"
                    placeholder="E.g. Chapati, Paneer, Rice, Dal"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dinner Menu</label>
                  <textarea 
                    value={formData.dinner}
                    onChange={(e) => setFormData({...formData, dinner: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold min-h-[80px]"
                    placeholder="E.g. Paratha, Veg Mix, Curd"
                  />
                </div>
                <button type="submit" className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 hover:bg-black transition-all">
                   Save Plan
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
