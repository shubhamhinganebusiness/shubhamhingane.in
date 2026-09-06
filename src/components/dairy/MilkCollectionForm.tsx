import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ClipboardCheck, 
  Search, 
  Droplets, 
  Calculator, 
  Calendar,
  Clock,
  User,
  AlertCircle,
  TrendingUp,
  Hash
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { Farmer, MilkCollection, DairySettings } from './types';
import { useAuth } from '../AuthContext';

interface Props {
  settings: DairySettings | null;
}

export const MilkCollectionForm: React.FC<Props> = ({ settings }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<MilkCollection> & { time: string }>({
    uniqueId: '',
    quantity: 0,
    fat: 0,
    snf: 0,
    shift: 'Morning',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setFormData(prev => ({ 
        ...prev, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-fetch farmer when ID changes
  useEffect(() => {
    const fetchFarmer = async () => {
      if (formData.uniqueId && formData.uniqueId.length >= 1 && user) {
        const q = query(
          collection(db, 'dairies', user.uid, 'farmers'), 
          where('uniqueId', '==', formData.uniqueId)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const farmerData = { id: snap.docs[0].id, ...snap.docs[0].data() } as Farmer;
          setFarmer(farmerData);
          setFormData(prev => ({ ...prev, farmerId: farmerData.id, farmerName: farmerData.name }));
          setError(null);
        } else {
          setFarmer(null);
          setFormData(prev => ({ ...prev, farmerId: undefined, farmerName: undefined }));
        }
      } else {
        setFarmer(null);
      }
    };

    const timeout = setTimeout(fetchFarmer, 300);
    return () => clearTimeout(timeout);
  }, [formData.uniqueId]);

  // Calculate rate and amount automatically
  useEffect(() => {
    if (farmer && settings) {
      const baseRate = farmer.milkType === 'Cow' ? settings.cowRate : settings.buffaloRate;
      // Simple formula: baseRate + (fat over base) * fatRate
      // For this demo, we'll keep it simple: rate = cowRate/buffaloRate (could be more complex)
      const calculatedRate = baseRate; 
      const amount = (formData.quantity || 0) * calculatedRate;
      
      setFormData(prev => ({ ...prev, rate: calculatedRate, amount }));
    }
  }, [farmer, settings, formData.quantity, formData.fat, formData.snf]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmer) {
      setError('Please enter a valid Farmer ID');
      return;
    }
    
    // Stricter Numeric Validations
    if (!formData.quantity || formData.quantity <= 0 || formData.quantity > 500) {
      setError('Quantity must be between 0.1 and 500 Liters');
      return;
    }
    if (formData.fat !== undefined && (formData.fat < 2.0 || formData.fat > 15.0)) {
      setError('Fat percentage must be between 2.0 and 15.0');
      return;
    }
    if (formData.snf !== undefined && (formData.snf < 5.0 || formData.snf > 12.0)) {
      setError('SNF must be between 5.0 and 12.0');
      return;
    }

    setLoading(true);
    try {
      if (!user) throw new Error('Not authenticated');
      await addDoc(collection(db, 'dairies', user.uid, 'collections'), {
        ...formData,
        timestamp: serverTimestamp()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setFormData({
        uniqueId: '',
        quantity: 0,
        fat: 0,
        snf: 0,
        shift: 'Morning',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setFarmer(null);
    } catch (err) {
      setError('Failed to record collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-xl overflow-hidden">
        <div className="bg-primary p-8 text-white relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Record Milk Entry</h2>
              <p className="opacity-80 font-medium">Daily Morning collection - Auto-calculated</p>
            </div>
            <Droplets size={48} className="opacity-20 translate-x-4 translate-y-4" />
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Farmer ID Input */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Farmer Unique ID</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  required
                  placeholder="Enter ID (e.g. 101)"
                  value={formData.uniqueId}
                  onChange={(e) => setFormData({ ...formData, uniqueId: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-xl font-bold"
                />
              </div>
              {farmer && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-3 flex items-center gap-2 text-primary font-bold"
                >
                  <User size={16} />
                  <span>Farmer: {farmer.name} ({farmer.milkType})</span>
                </motion.div>
              )}
            </div>

            {/* Shift & Date Info (Auto-loaded) */}
            <div className="grid grid-cols-1 gap-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Session Info</label>
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 font-black uppercase text-xs tracking-widest">
                  <Clock size={18} />
                  {formData.shift} ({formData.time})
                </div>
                <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-gray-50 text-gray-700 rounded-2xl border border-gray-100 font-black uppercase text-xs tracking-widest">
                  <Calendar size={18} />
                  {formData.date}
                </div>
              </div>
            </div>

            {/* Quantity & Quality */}
            <div className="grid grid-cols-3 gap-4 md:col-span-2">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Liter (Qty)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="500"
                  required
                  placeholder="0.0"
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                  className={`w-full px-4 py-4 bg-gray-50 border rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-center text-xl ${(formData.quantity ?? 0) > 500 ? 'border-red-500 text-red-600' : 'border-gray-200'}`}
                />
                {(formData.quantity ?? 0) > 500 && (
                  <p className="text-[10px] text-red-500 font-bold mt-1 text-center">Max 500L</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Fat</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="15"
                  placeholder="0.0"
                  value={formData.fat || ''}
                  onChange={(e) => setFormData({ ...formData, fat: parseFloat(e.target.value) })}
                  className={`w-full px-4 py-4 bg-gray-50 border rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-center text-xl ${((formData.fat ?? 0) > 15 || ((formData.fat ?? 0) > 0 && (formData.fat ?? 0) < 2)) ? 'border-red-500 text-red-600' : 'border-gray-200'}`}
                />
                {((formData.fat ?? 0) > 15 || ((formData.fat ?? 0) > 0 && (formData.fat ?? 0) < 2)) && (
                  <p className="text-[10px] text-red-500 font-bold mt-1 text-center">2.0 - 15.0</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">SNF</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="12"
                  placeholder="0.0"
                  value={formData.snf || ''}
                  onChange={(e) => setFormData({ ...formData, snf: parseFloat(e.target.value) })}
                  className={`w-full px-4 py-4 bg-gray-50 border rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-center text-xl ${((formData.snf ?? 0) > 12 || ((formData.snf ?? 0) > 0 && (formData.snf ?? 0) < 5)) ? 'border-red-500 text-red-600' : 'border-gray-200'}`}
                />
                {((formData.snf ?? 0) > 12 || ((formData.snf ?? 0) > 0 && (formData.snf ?? 0) < 5)) && (
                  <p className="text-[10px] text-red-500 font-bold mt-1 text-center">5.0 - 12.0</p>
                )}
              </div>
            </div>
          </div>

          {/* Automated Billing Summary */}
          <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary">
                <Calculator size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Calculated Billing</h3>
                <p className="text-sm text-gray-500 mt-1 font-medium">Automatic calculation based on milk type rates</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 text-center md:text-right">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Rate / Ltr</p>
                <p className="text-2xl font-black text-gray-900">₹{formData.rate?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                <p className="text-3xl font-black text-primary">₹{formData.amount?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3 text-sm font-bold">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-100 text-green-600 px-6 py-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in zoom-in-95">
              <ClipboardCheck size={20} />
              Milk entry recorded successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !farmer}
            className="w-full py-5 bg-primary text-white rounded-2xl text-lg font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-primary/40 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            {loading ? 'Processing...' : (
              <>
                Record Collection
                <TrendingUp size={24} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
