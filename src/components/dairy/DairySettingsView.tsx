import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Save, 
  Store, 
  User, 
  TrendingUp, 
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { DairySettings } from './types';
import { useAuth } from '../AuthContext';

interface Props {
  settings: DairySettings | null;
}

export const DairySettingsView: React.FC<Props> = ({ settings }) => {
  const [formData, setFormData] = useState<DairySettings>({
    dairyName: '',
    ownerName: '',
    cowRate: 0,
    buffaloRate: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDairyAdmin, user } = useAuth();

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDairyAdmin || !user) {
      setError('Only Admin can change settings');
      return;
    }

    if (formData.dairyName.trim().length < 2) {
      setError('Dairy name is too short');
      return;
    }

    if (formData.ownerName.trim().length < 3) {
      setError('Please enter a valid owner name');
      return;
    }

    if (formData.cowRate <= 0 || formData.cowRate > 200) {
      setError('Cow milk rate must be between ₹1 and ₹200');
      return;
    }

    if (formData.buffaloRate <= 0 || formData.buffaloRate > 200) {
      setError('Buffalo milk rate must be between ₹1 and ₹200');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await setDoc(doc(db, 'dairies', user.uid, 'settings', 'config'), formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-xl overflow-hidden">
        <div className="p-12">
          <div className="flex items-center gap-6 mb-12">
            <div className="w-16 h-16 bg-gray-900 text-white rounded-[1.25rem] flex items-center justify-center">
              <Store size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Dairy Configuration</h2>
              <p className="text-gray-500 font-medium">Manage branding and milk pricing benchmarks</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Dairy Name</label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    required
                    value={formData.dairyName}
                    onChange={(e) => setFormData({ ...formData, dairyName: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                    placeholder="Enter Dairy Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Owner Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                    placeholder="Owner's Full Name"
                  />
                </div>
              </div>

              <div className="p-8 bg-blue-50/50 rounded-3xl border border-blue-100/50 space-y-6 md:col-span-2">
                 <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs">
                    <TrendingUp size={16} />
                    Milk Pricing Policy (Base Rates)
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-blue-400 uppercase tracking-wider mb-2">Cow Milk Rate (per Liter)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 font-bold">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.cowRate || ''}
                          onChange={(e) => setFormData({ ...formData, cowRate: parseFloat(e.target.value) })}
                          className="w-full pl-10 pr-4 py-4 bg-white border border-blue-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-200/20 font-black text-xl text-blue-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-blue-400 uppercase tracking-wider mb-2">Buffalo Milk Rate (per Liter)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 font-bold">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.buffaloRate || ''}
                          onChange={(e) => setFormData({ ...formData, buffaloRate: parseFloat(e.target.value) })}
                          className="w-full pl-10 pr-4 py-4 bg-white border border-blue-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-200/20 font-black text-xl text-blue-900"
                        />
                      </div>
                    </div>
                 </div>
              </div>
            </div>

            {success && (
              <div className="bg-green-50 border border-green-100 text-green-600 px-6 py-4 rounded-2xl flex items-center gap-3 font-bold animate-in slide-in-from-bottom-2">
                <CheckCircle2 size={20} />
                Settings saved successfully!
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3 font-bold">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isDairyAdmin}
              className="w-full py-5 bg-gray-900 text-white rounded-2xl text-lg font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  Update Configuration
                  <Save size={24} />
                </>
              )}
            </button>
            {!isDairyAdmin && (
              <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                Read-only mode (Admin access required to change rates)
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
