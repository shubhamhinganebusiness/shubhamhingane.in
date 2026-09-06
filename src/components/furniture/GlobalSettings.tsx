import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Check, ArrowLeft, ShieldAlert } from 'lucide-react';
import { db, handleFirestoreError, OperationType, isFirestoreQuotaExhausted } from '../../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../AuthContext';

export interface GstSettings {
  slabs: number[];
  defaultSlab: number;
}

export const GlobalSettings = () => {
  const { storeId } = useAuth();
  const [slabs, setSlabs] = useState<number[]>([5, 12, 18, 28]);
  const [defaultSlab, setDefaultSlab] = useState<number>(18);
  const [newSlab, setNewSlab] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!storeId) return;

    // Direct snapshot subscription for real-time reactive settings updates!
    const docRef = doc(db, `messes/${storeId}/settings`, 'gst');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GstSettings;
        if (data.slabs && Array.isArray(data.slabs)) {
          setSlabs(data.slabs.sort((a, b) => a - b));
        }
        if (data.defaultSlab) {
          setDefaultSlab(data.defaultSlab);
        }
      } else {
        // Bootstrap initial configuration on first load
        const initialSettings: GstSettings = { slabs: [5, 12, 18, 28], defaultSlab: 18 };
        if (!isFirestoreQuotaExhausted()) {
          setDoc(docRef, initialSettings).catch(() => {});
        }
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching GST settings:', err);
      // Fallback to localStorage or defaults
      const local = localStorage.getItem(`gst_settings_${storeId}`);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          setSlabs(parsed.slabs);
          setDefaultSlab(parsed.defaultSlab);
        } catch (_) {}
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [storeId]);

  const handleSave = async (updatedSlabs: number[], updatedDefault: number) => {
    if (!storeId) return;
    setSaving(true);
    setSuccess(false);
    try {
      const docRef = doc(db, `messes/${storeId}/settings`, 'gst');
      const payload: GstSettings = {
        slabs: updatedSlabs.sort((a,b) => a-b),
        defaultSlab: updatedDefault
      };
      await setDoc(docRef, payload);
      localStorage.setItem(`gst_settings_${storeId}`, JSON.stringify(payload));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings');
    } finally {
      setSaving(false);
    }
  };

  const addSlabValue = () => {
    const val = parseFloat(newSlab);
    if (isNaN(val) || val < 0 || val > 100) {
      alert('Please enter a valid GST slab percentage between 0 and 100.');
      return;
    }
    if (slabs.includes(val)) {
      alert('Slab already exists!');
      return;
    }
    const nextSlabs = [...slabs, val].sort((a, b) => a - b);
    setSlabs(nextSlabs);
    setNewSlab('');
    handleSave(nextSlabs, defaultSlab);
  };

  const removeSlabValue = (val: number) => {
    if (slabs.length <= 1) {
      alert('You must have at least one valid GST slab.');
      return;
    }
    const nextSlabs = slabs.filter(s => s !== val);
    let nextDefault = defaultSlab;
    if (defaultSlab === val) {
      nextDefault = nextSlabs[0];
      setDefaultSlab(nextDefault);
    }
    setSlabs(nextSlabs);
    handleSave(nextSlabs, nextDefault);
  };

  const selectDefault = (val: number) => {
    setDefaultSlab(val);
    handleSave(slabs, val);
  };

  if (loading) {
    return (
      <div className="p-8 bg-white rounded-3xl border border-gray-100 min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Settings Configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xs">
        <div>
          <span className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase rounded-full tracking-widest">Taxation Controls</span>
          <h2 className="text-2xl font-black text-gray-900 uppercase mt-1">Global System Settings</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Configure taxes, compliance Slabs, and business parameters</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center">
            <Settings size={20} />
          </div>
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Left explanation column */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
            <h3 className="font-bold text-gray-900 border-b pb-3 mb-3">GST Slabs & Compliance</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Define the official country-level GST slab rates applicable to products and furniture variants sold.
            </p>
            <p className="text-xs text-gray-500 leading-relaxed mt-2">
              Modifying these rates automatically re-calibrates active checkout forms, cart dropdown options, and financial reports.
            </p>
          </div>

          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-3 text-amber-800">
            <ShieldAlert size={20} className="shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs">A4 Invoice Compliance</h4>
              <p className="text-[10px] mt-1 leading-normal">
                Setting a precise tax slab is legally required for generating correct CGST + SGST breakups on standard printed tax memoranda accounts.
              </p>
            </div>
          </div>
        </div>

        {/* Configuration settings content (Right columns) */}
        <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-xs space-y-6">
          {/* Active Slabs List */}
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Configured GST Tax Slabs</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {slabs.map((slab) => {
                const isDefault = slab === defaultSlab;
                return (
                  <div 
                    key={slab}
                    className={`relative p-5 rounded-2xl border-2 transition-all flex flex-col justify-between items-start gap-4 ${
                      isDefault 
                        ? 'border-primary bg-primary/5 shadow-inner' 
                        : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <span className="text-2xl font-black text-gray-900">{slab}%</span>
                      <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Slab Rate Tag</p>
                    </div>

                    <div className="flex w-full justify-between items-center mt-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => selectDefault(slab)}
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-1.5 rounded-lg flex items-center gap-1 ${
                          isDefault 
                            ? 'bg-primary text-white' 
                            : 'bg-white text-gray-500 hover:text-primary hover:bg-primary/5 hover:border-primary border border-gray-100'
                        }`}
                      >
                        {isDefault && <Check size={8} />}
                        {isDefault ? 'Default' : 'Set Default'}
                      </button>

                      {!isDefault && (
                        <button
                          onClick={() => removeSlabValue(slab)}
                          className="p-1.5 hover:bg-red-50 hover:text-red-500 text-gray-400 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Delete compliance slab"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add custom GST slab input */}
          <div className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3">Add Custom Compliance Slab</h3>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  placeholder="e.g. 13.5"
                  step="0.01"
                  min="0"
                  max="100"
                  value={newSlab}
                  onChange={(e) => setNewSlab(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-xs font-semibold focus:ring-2 focus:ring-primary/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">%</span>
              </div>
              <button
                onClick={addSlabValue}
                className="px-6 py-3 bg-gray-900 hover:bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all leading-none"
              >
                <Plus size={14} /> Add Slab
              </button>
            </div>
          </div>

          {/* Status Save Indication */}
          {success && (
            <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 border border-emerald-100">
              <Check size={14} />
              GST tax compliance structure updated dynamically and saved to the Cloud Database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
