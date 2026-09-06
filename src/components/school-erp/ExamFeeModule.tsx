import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  IndianRupee, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Printer, 
  Check, 
  Plus, 
  FileText,
  X,
  CreditCard,
  Building
} from 'lucide-react';
import { Student, ExamFeeRecord } from './types';
import { CLASS_FEE_STRUCTURE } from './sampleData';

interface ExamFeeModuleProps {
  students: Student[];
  fees: ExamFeeRecord[];
  onUpdateFees: (updatedFees: ExamFeeRecord[]) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ExamFeeModule: React.FC<ExamFeeModuleProps> = ({
  students,
  fees,
  onUpdateFees,
  addToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Partial'>('All');
  
  // Payment Modal State
  const [payingRecord, setPayingRecord] = useState<ExamFeeRecord | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);

  // Receipt Modal State
  const [receiptRecord, setReceiptRecord] = useState<ExamFeeRecord | null>(null);

  // --- STATS CALCULATION ---
  const totalDueSum = fees.reduce((acc, f) => acc + f.amountDue, 0);
  const totalCollectedSum = fees.reduce((acc, f) => acc + f.amountPaid, 0);
  const totalPendingSum = totalDueSum - totalCollectedSum;
  const collectedPercentage = totalDueSum > 0 ? Math.round((totalCollectedSum / totalDueSum) * 100) : 0;

  // Filter values
  const filteredFees = fees.filter(fee => {
    const student = students.find(s => s.id === fee.studentId);
    const matchesFilter = statusFilter === 'All' || fee.status === statusFilter;
    
    // Search constraints
    const searchLower = searchQuery.toLowerCase();
    const studentName = fee.studentName.toLowerCase();
    const rollNo = fee.rollNumber.toLowerCase();
    const receiptNo = fee.receiptNumber?.toLowerCase() || '';

    const matchesSearch = studentName.includes(searchLower) || 
                          rollNo.includes(searchLower) || 
                          receiptNo.includes(searchLower);

    return matchesFilter && matchesSearch;
  });

  // RECORD PAYMENT CALLBACK
  const handleOpenPayModal = (record: ExamFeeRecord) => {
    setPayingRecord(record);
    // Suggest the remaining amount due to clear the balance
    const remainingDue = record.amountDue - record.amountPaid;
    setPayAmount(remainingDue);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingRecord) return;

    if (payAmount <= 0) {
      addToast('Please enter a valid amount greater than zero', 'error');
      return;
    }

    const currentTotalPaid = payingRecord.amountPaid + payAmount;
    if (currentTotalPaid > payingRecord.amountDue) {
      addToast(`Payment exceeds outstanding amount. Max balance due is ₹${payingRecord.amountDue - payingRecord.amountPaid}`, 'error');
      return;
    }

    // Generate unique receipt serial number
    const uniqueReceiptNo = payingRecord.receiptNumber || `REC-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const nextStatus: 'Paid' | 'Partial' = currentTotalPaid === payingRecord.amountDue ? 'Paid' : 'Partial';

    const updatedFees = fees.map(f => {
      if (f.id === payingRecord.id) {
        return {
          ...f,
          amountPaid: currentTotalPaid,
          status: nextStatus,
          receiptNumber: uniqueReceiptNo,
          paymentDate: new Date().toISOString().split('T')[0]
        };
      }
      return f;
    });

    onUpdateFees(updatedFees);
    addToast(`Successfully recorded collection of ₹${payAmount} for ${payingRecord.studentName}`, 'success');
    setPayingRecord(null);
  };

  // PRINT CORNER - REAL Receipt layout inside browser print window trigger
  const handlePrintReceipt = (record: ExamFeeRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addToast('Popup blocker prevented printing. Please enable popups.', 'error');
      return;
    }

    const html = `
      <html>
        <head>
          <title>Fee Receipt - ${record.receiptNumber}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; margin: 0; color: #1e293b; background-color: #fff; }
            .receipt-card { border: 4px double #cbd5e1; padding: 30px; border-radius: 12px; position: relative; max-width: 650px; margin: auto; }
            .watermark { position: absolute; font-size: 70px; opacity: 0.04; font-weight: 900; transform: rotate(-30deg); top: 38%; left: 10%; color: #000; pointer-events: none; text-transform: uppercase; }
            .header-info { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
            .school-title { font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
            .school-subtitle { font-size: 11px; text-transform: uppercase; color: #64748b; margin-top: 3px; font-weight: bold; }
            .receipt-meta { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 25px; color: #475569; border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px; }
            .details-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .details-table th { background: #f8fafc; text-align: left; padding: 10px; font-size: 10px; uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; color: #475569; }
            .details-table td { padding: 12px 10px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
            .total-row td { border-top: 2px solid #cbd5e1; font-weight: bold; font-size: 14px; color: #0f172a; }
            .footer-notes { font-size: 9px; text-align: center; color: #94a3b8; font-style: italic; margin-top: 30px; }
            .stamp-box { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; }
            .signature { border-top: 1px solid #cbd5e1; width: 150px; text-align: center; font-size: 11px; padding-top: 5px; color: #475569; }
          </style>
        </head>
        <body>
          <div class="receipt-card">
            <div class="watermark">Vidyalaya ERP</div>
            <div class="header-info">
              <div class="school-title">Vidyalaya Public School</div>
              <div class="school-subtitle">Affiliated to CBSE, Delhi • Exam Fees Transaction Voucher</div>
            </div>
            
            <div class="receipt-meta">
              <div>
                <strong>Receipt No:</strong> ${record.receiptNumber || 'N/A'}<br/>
                <strong>Payment Date:</strong> ${record.paymentDate || 'N/A'}
              </div>
              <div style="text-align: right;">
                <strong>Academic Session:</strong> 2026-27<br/>
                <strong>Payment Status:</strong> <span style="color: #16a34a; font-weight: 850;">${record.status.toUpperCase()}</span>
              </div>
            </div>

            <table class="details-table">
              <thead>
                <tr>
                  <th>Particular / Student Details</th>
                  <th style="text-align: right;">Amount Charged</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Student Name:</strong> ${record.studentName}<br/>
                    <span style="color: #64748b; font-size: 11px;">Roll Number: ${record.rollNumber} • Class: ${record.className}</span>
                  </td>
                  <td style="text-align: right; font-weight: 700;">₹${record.amountDue.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="color: #475569;">Prior Collected Balance</td>
                  <td style="text-align: right; color: #475569;">₹${(record.amountPaid).toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <td>Net Amount Cleared Ledger</td>
                  <td style="text-align: right; font-weight: 950; color: #16a34a;">₹${record.amountPaid.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="stamp-box">
              <div class="signature">Accounts Registrar Stamp</div>
              <div class="signature">Principal Authorised Sign</div>
            </div>

            <div class="footer-notes">
              Important: This is an automatically audited transaction slip. Keep it safe for final exam hall ticket generation eligibility verification.
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    addToast('Receipt triggered for print', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Quick Collection KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total collected</p>
            <h4 className="text-xl md:text-2xl font-black text-gray-950 mt-1">₹{totalCollectedSum.toLocaleString('en-IN')}</h4>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Outstanding Outstanding</p>
            <h4 className="text-xl md:text-2xl font-black text-amber-600 mt-1">₹{totalPendingSum.toLocaleString('en-IN')}</h4>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Audit Collection %</p>
            <h4 className="text-xl md:text-2xl font-black text-indigo-600 mt-1">{collectedPercentage}% Collected</h4>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <IndianRupee size={20} />
          </div>
        </div>
      </div>

      {/* Audit control headers */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl max-w-full overflow-x-auto no-scrollbar whitespace-nowrap">
          {['All', 'Paid', 'Pending', 'Partial'].map((filterItem) => (
            <button
              key={filterItem}
              onClick={() => setStatusFilter(filterItem as any)}
              className={`px-5 py-2 rounded-lg font-bold text-xs uppercase transition-all whitespace-nowrap ${
                statusFilter === filterItem ? 'bg-white text-gray-900 shadow-sm font-black' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {filterItem} Status
            </button>
          ))}
        </div>

        {/* Global Search form */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by name, roll no, receipt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-gray-200 py-3 pl-11 pr-4 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        </div>
      </div>

      {/* Main Student Fee Grid list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-[2px] text-gray-400">
                <th className="px-8 py-5">Roll & Name</th>
                <th className="px-8 py-5">Class Group</th>
                <th className="px-8 py-5">Due Amount</th>
                <th className="px-8 py-5">Collected</th>
                <th className="px-8 py-5">Status Badge</th>
                <th className="px-8 py-5">Receipt Serial</th>
                <th className="px-8 py-5 text-center">Receipt Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredFees.map((fee) => {
                const isOverdue = fee.status !== 'Paid';
                return (
                  <tr key={fee.id} className="hover:bg-slate-50/25 transition-all text-sm">
                    <td className="px-8 py-5">
                      <div>
                        <p className="font-extrabold text-gray-900">{fee.studentName}</p>
                        <p className="text-[10px] font-mono font-black text-gray-400 uppercase mt-0.5">Roll: {fee.rollNumber}</p>
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold">
                        {fee.className}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-bold text-gray-900">₹{fee.amountDue}</td>
                    <td className="px-8 py-5 font-bold text-emerald-600">₹{fee.amountPaid}</td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        fee.status === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : fee.status === 'Partial' 
                          ? 'bg-amber-50 text-amber-700 border-amber-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {fee.status === 'Paid' ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                        {fee.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-mono text-xs text-gray-500 font-bold">
                      {fee.receiptNumber ? (
                        <span className="bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-gray-700 text-[10px]">
                          {fee.receiptNumber}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2">
                        {/* Print Receipt Trigger */}
                        {fee.status !== 'Pending' ? (
                          <button
                            onClick={() => handlePrintReceipt(fee)}
                            className="p-2 bg-indigo-50 text-indigo-600 hover:bg-colors group hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
                            title="Print Transaction Slip"
                          >
                            <Printer size={14} className="group-hover:scale-110 transition-transform" />
                          </button>
                        ) : (
                          <button disabled className="p-2 bg-gray-50 text-gray-200 rounded-lg cursor-not-allowed">
                            <Printer size={14} />
                          </button>
                        )}
                        
                        {/* Collect Cash/Card Button */}
                        {fee.status !== 'Paid' ? (
                          <button
                            onClick={() => handleOpenPayModal(fee)}
                            className="bg-slate-900 border border-slate-950 text-white hover:bg-primary hover:border-primary px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                          >
                            Collect
                          </button>
                        ) : (
                          <span className="text-emerald-500 text-xs font-extrabold flex items-center gap-1 select-none">
                            <Check size={14} /> Cleared
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYMENT TRANSACTION OVERLAY MODAL */}
      <AnimatePresence>
        {payingRecord && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white max-w-md w-full rounded-2xl border border-gray-100 shadow-2xl relative overflow-hidden"
            >
              <div className="p-6 bg-slate-950 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CreditCard className="text-primary shrink-0" size={18} />
                  <h3 className="font-extrabold text-sm uppercase tracking-wide">Record Exam Fee Collection</h3>
                </div>
                <button 
                  onClick={() => setPayingRecord(null)}
                  className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitPayment} className="p-6 space-y-5">
                <div className="p-4 bg-slate-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Profile</p>
                  <p className="font-extrabold text-slate-900 text-base mt-1">{payingRecord.studentName}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">Roll No: {payingRecord.rollNumber} • {payingRecord.className}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-[9px] font-black uppercase text-red-500">Net Due Charge</p>
                    <p className="text-lg font-black text-slate-900 mt-1">₹{payingRecord.amountDue}</p>
                  </div>
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <p className="text-[9px] font-black uppercase text-indigo-600">Prior Collected</p>
                    <p className="text-lg font-black text-slate-900 mt-1">₹{payingRecord.amountPaid}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-gray-400">Payment Amount Collected (₹)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    max={payingRecord.amountDue - payingRecord.amountPaid}
                    min={1}
                    className="w-full bg-slate-50 border border-gray-200 font-extrabold text-lg py-3 px-4 rounded-xl text-center text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                  />
                  <p className="text-[10px] text-gray-400 text-center font-bold">Due amount to outstanding: ₹{payingRecord.amountDue - payingRecord.amountPaid}</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                >
                  Confirm payment transaction
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
