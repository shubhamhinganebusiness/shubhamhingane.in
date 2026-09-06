import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  X, 
  Check, 
  MapPin, 
  Shield, 
  PlusCircle, 
  ArrowRight,
  LogOut,
  Sparkles,
  Lock,
  Layers
} from 'lucide-react';
import { MandalAccount, MandalUserSession } from '../types';
import { getAllMandalAccounts, authenticateMandal, clearActiveSession } from '../services/mandalStorageService';

interface MandalSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMandalId: string;
  onSwitchMandal: (session: MandalUserSession) => void;
  onOpenNewRegistration: () => void;
  onLogout: () => void;
}

export const MandalSwitchModal: React.FC<MandalSwitchModalProps> = ({
  isOpen,
  onClose,
  currentMandalId,
  onSwitchMandal,
  onOpenNewRegistration,
  onLogout
}) => {
  const [mandals] = useState<MandalAccount[]>(() => getAllMandalAccounts());
  const [selectedMandal, setSelectedMandal] = useState<MandalAccount | null>(() => {
    return mandals.find(m => m.id === currentMandalId) || mandals[0] || null;
  });
  const [role, setRole] = useState<'admin' | 'treasurer' | 'karyakarta' | 'devotee'>('admin');
  const [pin, setPin] = useState('123456');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = (m: MandalAccount) => {
    setSelectedMandal(m);
    setErrorMsg(null);
    if (role === 'admin') setPin(m.adminPin || '123456');
    else if (role === 'treasurer') setPin(m.treasurerPin || '555555');
    else if (role === 'karyakarta') setPin(m.karyakartaPin || '111111');
  };

  const handleSwitchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMandal) return;
    try {
      const session = authenticateMandal(selectedMandal.id, role, pin);
      onSwitchMandal(session);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'मंडळ बदलताना त्रुटी आली.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-zinc-900 border border-amber-500/30 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold">
              🔄
            </div>
            <div>
              <h3 className="text-base font-black">
                कार्यरत मंडळ बदला (Switch Active Mandal)
              </h3>
              <p className="text-[11px] text-orange-100">
                दुसऱ्या मंडळाच्या स्वतंत्र डेटाबेस व पावती पुस्तकात प्रवेश करा
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* Mandal Selection Grid */}
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">
              नोंदणीकृत मंडळे निवडा ({mandals.length})
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {mandals.map(m => {
                const isActive = m.id === currentMandalId;
                const isSelected = selectedMandal?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelect(m)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 ring-2 ring-orange-500/20 shadow-sm'
                        : 'bg-gray-50 dark:bg-zinc-800/60 border-gray-200 dark:border-zinc-700/80 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        🚩
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">
                            {m.profile.nameMr}
                          </h4>
                          {isActive && (
                            <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-800 text-[9px] font-bold shrink-0">
                              सध्या चालू
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-1">
                          <span>{m.profile.city}</span>
                          <span>•</span>
                          <span className="font-mono font-bold text-orange-600">{m.receiptPrefix}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role & PIN Confirmation */}
          {selectedMandal && (
            <form onSubmit={handleSwitchSubmit} className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-800 dark:text-gray-200">
                  {selectedMandal.profile.nameMr}
                </span>
                <span className="text-[10px] font-mono text-orange-600 font-bold bg-orange-100 dark:bg-zinc-700 px-2 py-0.5 rounded">
                  {selectedMandal.mandalCode}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { r: 'admin', label: '👑 ॲडमिन' },
                  { r: 'treasurer', label: '💰 खजिनदार' },
                  { r: 'karyakarta', label: '🚩 कार्यकर्ता' },
                  { r: 'devotee', label: '🪔 भाविक' }
                ].map(item => (
                  <button
                    key={item.r}
                    type="button"
                    onClick={() => {
                      const newR = item.r as any;
                      setRole(newR);
                      if (newR === 'admin') setPin(selectedMandal.adminPin || '123456');
                      else if (newR === 'treasurer') setPin(selectedMandal.treasurerPin || '555555');
                      else if (newR === 'karyakarta') setPin(selectedMandal.karyakartaPin || '111111');
                    }}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                      role === item.r 
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm' 
                        : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {role !== 'devotee' && (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="password"
                      placeholder="पिन प्रविष्ट करा (उदा. 123456)"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (role === 'admin') setPin('123456');
                      else if (role === 'treasurer') setPin('555555');
                      else setPin('111111');
                    }}
                    className="px-2.5 py-2 rounded-xl bg-orange-100 dark:bg-zinc-700 text-orange-700 dark:text-orange-300 text-[10px] font-bold whitespace-nowrap"
                  >
                    Demo PIN
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                <span>या मंडळात प्रवेश करा</span>
                <ArrowRight size={14} />
              </button>
            </form>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewRegistration();
              }}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <PlusCircle size={14} />
              नवीन मंडळ नोंदणी (Register New)
            </button>

            <button
              type="button"
              onClick={() => {
                clearActiveSession();
                onLogout();
                onClose();
              }}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <LogOut size={14} />
              सर्व सत्रातून लॉग आऊट
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
