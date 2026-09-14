import React from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  DollarSign, 
  Lock, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  PaymentMilestone, 
  MilestonePresetType, 
  createMilestonePreset 
} from './photographyBillTypes';

interface MilestoneRetainerManagerProps {
  milestones: PaymentMilestone[];
  totalAmount: number;
  billDate: string;
  onChange: (updated: PaymentMilestone[]) => void;
}

export const MilestoneRetainerManager: React.FC<MilestoneRetainerManagerProps> = ({
  milestones = [],
  totalAmount,
  billDate,
  onChange
}) => {
  const safeMilestones = Array.isArray(milestones) ? milestones : [];

  const handleApplyPreset = (preset: MilestonePresetType) => {
    const newMilestones = createMilestonePreset(preset, totalAmount, billDate);
    onChange(newMilestones);
  };

  const handleUpdateMilestone = (index: number, updates: Partial<PaymentMilestone>) => {
    const updated = [...safeMilestones];
    const target = { ...updated[index], ...updates };

    // If percentage was changed, re-calculate amount
    if (updates.percentage !== undefined) {
      target.amount = Math.round((totalAmount * updates.percentage) / 100);
    }
    // If amount was changed, re-calculate percentage
    else if (updates.amount !== undefined && totalAmount > 0) {
      target.percentage = Math.round((updates.amount / totalAmount) * 100);
    }

    updated[index] = target;
    onChange(updated);
  };

  const handleAddMilestone = () => {
    const newId = `ms-${Date.now()}`;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 14);

    const newMilestone: PaymentMilestone = {
      id: newId,
      title: `Milestone Stage ${safeMilestones.length + 1}`,
      percentage: 20,
      amount: Math.round(totalAmount * 0.2),
      dueDate: nextDate.toISOString().split('T')[0],
      isPaid: false,
      notes: ''
    };
    onChange([...safeMilestones, newMilestone]);
  };

  const handleRemoveMilestone = (index: number) => {
    const updated = safeMilestones.filter((_, i) => i !== index);
    onChange(updated);
  };

  const totalPercentage = safeMilestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);
  const totalMilestoneAmount = safeMilestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  const paidMilestoneAmount = safeMilestones.filter(m => m.isPaid).reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Header with Presets */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <Layers size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Retainer & Payment Milestone Schedule
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-[#D4AF37] font-mono">
                {safeMilestones.length} Stages
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400">
              Split total contract into advance booking retainers and production milestone settlements.
            </p>
          </div>
        </div>

        {/* Quick Presets Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase text-zinc-500 mr-1">Presets:</span>
          <button
            type="button"
            onClick={() => handleApplyPreset('50_50')}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="50% Initial Booking Retainer, 50% Final Settlement"
          >
            50 / 50 Retainer
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('25_50_25')}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="25% Booking Lock, 50% Shoot Day Production, 25% Final Delivery"
          >
            25 / 50 / 25
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('30_40_30')}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="30% Retainer, 40% Shoot Wrap, 30% Post-Production"
          >
            30 / 40 / 30
          </button>
        </div>
      </div>

      {/* Visual Progress Bar */}
      {milestones.length > 0 && (
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800">
            {milestones.map((m, idx) => {
              const widthPct = totalMilestoneAmount > 0 ? (m.amount / totalMilestoneAmount) * 100 : 0;
              const bgColors = [
                'bg-amber-500',
                'bg-[#D4AF37]',
                'bg-emerald-500',
                'bg-sky-500',
                'bg-indigo-500'
              ];
              const color = m.isPaid ? 'bg-emerald-500' : bgColors[idx % bgColors.length];

              return (
                <div
                  key={m.id || idx}
                  style={{ width: `${widthPct}%` }}
                  className={`${color} relative group transition-all duration-300 hover:opacity-90`}
                  title={`${m.title}: ₹${m.amount.toLocaleString('en-IN')} (${m.percentage}%) - ${m.isPaid ? 'PAID' : 'PENDING'}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>Collected: <strong className="text-emerald-400">₹{paidMilestoneAmount.toLocaleString('en-IN')}</strong></span>
            <span>Total Allocated: <strong className="text-white">₹{totalMilestoneAmount.toLocaleString('en-IN')}</strong> ({totalPercentage}%)</span>
            <span>Invoice Total: <strong className="text-[#D4AF37]">₹{totalAmount.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      )}

      {/* Milestone List Rows */}
      <div className="space-y-2.5">
        {milestones.map((milestone, idx) => (
          <div
            key={milestone.id || idx}
            className={`p-3.5 rounded-xl border transition-all ${
              milestone.isPaid 
                ? 'bg-emerald-950/20 border-emerald-500/40' 
                : 'bg-zinc-950 border-zinc-800/90 hover:border-zinc-700'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Stage Badge & Title */}
              <div className="md:col-span-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    idx === 0 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                      : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {idx === 0 ? 'Initial Retainer' : `Stage ${idx + 1}`}
                  </span>
                  {milestone.isPaid && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Paid
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={milestone.title}
                  onChange={e => handleUpdateMilestone(idx, { title: e.target.value })}
                  className="w-full text-xs font-bold text-white bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-[#D4AF37] outline-none transition-colors"
                  placeholder="Milestone description"
                />
              </div>

              {/* Percentage & Amount */}
              <div className="md:col-span-3 flex items-center gap-2">
                <div className="w-16">
                  <label className="text-[9px] uppercase font-bold text-zinc-500 block">Split %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={milestone.percentage}
                    onChange={e => handleUpdateMilestone(idx, { percentage: Number(e.target.value) || 0 })}
                    className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-white text-center focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] uppercase font-bold text-zinc-500 block">Amount (₹)</label>
                  <input
                    type="number"
                    value={milestone.amount}
                    onChange={e => handleUpdateMilestone(idx, { amount: Number(e.target.value) || 0 })}
                    className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono font-bold text-[#D4AF37] focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              {/* Due Date */}
              <div className="md:col-span-2">
                <label className="text-[9px] uppercase font-bold text-zinc-500 block">Due Date</label>
                <input
                  type="date"
                  value={milestone.dueDate}
                  onChange={e => handleUpdateMilestone(idx, { dueDate: e.target.value })}
                  className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:border-[#D4AF37] outline-none"
                />
              </div>

              {/* Status Toggle & Delete */}
              <div className="md:col-span-3 flex items-center justify-end gap-2 pt-1 md:pt-0">
                <button
                  type="button"
                  onClick={() => handleUpdateMilestone(idx, { 
                    isPaid: !milestone.isPaid,
                    paidDate: !milestone.isPaid ? new Date().toISOString().split('T')[0] : undefined
                  })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                    milestone.isPaid
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={milestone.isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
                >
                  <CheckCircle2 size={12} />
                  <span>{milestone.isPaid ? 'Paid' : 'Mark Paid'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveMilestone(idx)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Remove milestone"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Milestone Button */}
      <button
        type="button"
        onClick={handleAddMilestone}
        className="w-full py-2 border border-dashed border-zinc-800 hover:border-[#D4AF37]/50 rounded-xl text-xs font-bold text-zinc-400 hover:text-[#D4AF37] transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-zinc-950/40"
      >
        <Plus size={14} />
        <span>Add Custom Payment Milestone</span>
      </button>
    </div>
  );
};
