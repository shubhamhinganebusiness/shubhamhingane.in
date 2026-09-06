import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  MapPin, 
  Search, 
  Layers, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { InventoryItem, MandalLanguage } from '../types';
import { mandalTranslations } from '../translations/mandalTranslations';

interface InventoryStockSectionProps {
  inventory: InventoryItem[];
  lang: MandalLanguage;
  onAddInventory: (item: Omit<InventoryItem, 'id'>) => void;
  onUpdateQuantity: (id: string, newQty: number) => void;
  userRole: string;
}

export const InventoryStockSection: React.FC<InventoryStockSectionProps> = ({
  inventory,
  lang,
  onAddInventory,
  onUpdateQuantity,
  userRole
}) => {
  const t = mandalTranslations[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'Puja Samagri' as InventoryItem['category'],
    quantity: '50',
    unit: 'Kg',
    minRequired: '20',
    location: 'मंडळ गोदाम रूम १',
    condition: 'Good' as InventoryItem['condition']
  });

  const lowStockCount = inventory.filter(i => i.quantity <= i.minRequired).length;

  const filteredItems = inventory.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    onAddInventory({
      name: form.name.trim(),
      category: form.category,
      quantity: Number(form.quantity) || 1,
      unit: form.unit.trim(),
      minRequired: Number(form.minRequired) || 1,
      location: form.location.trim(),
      condition: form.condition,
      lastCheckedDate: new Date().toISOString().split('T')[0]
    });

    setIsModalOpen(false);
    setForm({
      name: '',
      category: 'Puja Samagri',
      quantity: '50',
      unit: 'Kg',
      minRequired: '20',
      location: 'मंडळ गोदाम रूम १',
      condition: 'Good'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-surface p-6 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Package size={22} />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-main-text tracking-tight">
              {t.nav.inventory}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            पूजा साहित्य, मंडप सामुग्री, ढोल-ताशा संच व रोषणाई साहित्याचा डिजिटल साठा.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
              <AlertTriangle size={15} />
              <span>{lowStockCount} साहित्य साठा कमी आहे</span>
            </div>
          )}

          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-900/20"
          >
            <Plus size={16} />
            नवीन साहित्य जोडा (+)
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input 
          type="text" 
          placeholder="साहित्याचे नाव, वर्गवारी किंवा गोदाम स्थानाने शोधा..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-surface border border-gray-100 dark:border-zinc-800 rounded-2xl text-xs focus:ring-2 focus:ring-primary/20 outline-none text-main-text"
        />
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => {
          const isLow = item.quantity <= item.minRequired;

          return (
            <motion.div 
              key={item.id}
              layout
              className={`p-5 rounded-3xl border transition-all space-y-3 bg-surface ${
                isLow ? 'border-amber-300 dark:border-amber-900/60 shadow-amber-500/5' : 'border-gray-100 dark:border-zinc-800 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg uppercase">
                  {item.category}
                </span>

                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  item.condition === 'Good' 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                }`}>
                  स्थिती: {item.condition}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-base text-main-text">{item.name}</h4>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin size={12} className="text-gray-400" /> {item.location}
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">उपलब्ध साठा</span>
                  <span className={`text-lg font-black ${isLow ? 'text-amber-600' : 'text-main-text'}`}>
                    {item.quantity} {item.unit}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                    className="w-8 h-8 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 flex items-center justify-center"
                  >
                    -
                  </button>
                  <button 
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 flex items-center justify-center shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="text-[10px] text-gray-400 flex justify-between items-center">
                <span>किमान आवश्यक: {item.minRequired} {item.unit}</span>
                <span>तपासणी: {item.lastCheckedDate}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-2xl border border-gray-100 dark:border-zinc-800 relative my-8"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-zinc-800 mb-4">
                <h3 className="text-base font-black text-main-text">नवीन साहित्य साठा नोंद</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">साहित्याचे नाव *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="उदा. शुद्ध गाईचे तूप / मोदक पीठ"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">वर्गवारी</label>
                    <select 
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value as any })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text"
                    >
                      <option value="Puja Samagri">पूजा साहित्य</option>
                      <option value="Decoration Assets">सजावट साहित्य</option>
                      <option value="Audio / Visual">ध्वनी व विद्युत</option>
                      <option value="Prasad Raw Material">प्रसाद सामुग्री</option>
                      <option value="Security / Crowd Gear">सुरक्षा गियर</option>
                      <option value="Utensils">भांडी व स्वयंपाक</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">स्थान / गोदाम</label>
                    <input 
                      type="text" 
                      value={form.location}
                      onChange={e => setForm({ ...form, location: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">प्रमाण</label>
                    <input 
                      type="number" 
                      value={form.quantity}
                      onChange={e => setForm({ ...form, quantity: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">एकक (Unit)</label>
                    <input 
                      type="text" 
                      placeholder="Kg, Sets, Pcs"
                      value={form.unit}
                      onChange={e => setForm({ ...form, unit: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">किमान साठा</label>
                    <input 
                      type="number" 
                      value={form.minRequired}
                      onChange={e => setForm({ ...form, minRequired: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text"
                    />
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/3 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold"
                  >
                    रद्द करा
                  </button>
                  <button 
                    type="submit"
                    className="w-2/3 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90"
                  >
                    साठा साठवा
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
