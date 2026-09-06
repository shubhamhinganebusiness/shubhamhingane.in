import React, { useEffect, useState } from 'react';
import { Printer, X, Download, ShieldCheck, Landmark } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../AuthContext';

interface FurnitureBillPrintProps {
  bill: {
    billNumber: string;
    customerName: string;
    customerPhone: string;
    items: any[];
    subtotal: number;
    totalGst: number;
    total: number;
    paymentMethod: string;
    timestamp: any;
  } | null;
  onClose: () => void;
}

export const FurnitureBillPrint: React.FC<FurnitureBillPrintProps> = ({ bill, onClose }) => {
  const { storeId } = useAuth();
  const [shopName, setShopName] = useState('FurniElec Ltd');
  const [shopAddress, setShopAddress] = useState('Metro Plaza, Sector 62, Complex A, IN');
  const [shopGst, setShopGst] = useState('GSTIN: 27AAAAA1111A1Z1');

  useEffect(() => {
    // Dynamically retrieve actual store profile details if existing
    if (!storeId) return;
    const loadStoreDetails = async () => {
      try {
        const storeRef = doc(db, `messes/${storeId}`);
        const storeSnap = await getDoc(storeRef);
        if (storeSnap.exists()) {
          const data = storeSnap.data();
          if (data.name) setShopName(data.name);
          if (data.address) setShopAddress(data.address);
          if (data.gstin) setShopGst(`GSTIN: ${data.gstin}`);
        }
      } catch (e) {
        console.error('Error fetching store info for layout:', e);
      }
    };
    loadStoreDetails();
  }, [storeId]);

  if (!bill) return null;

  const orderDate = bill.timestamp?.toDate
    ? bill.timestamp.toDate()
    : bill.timestamp instanceof Date 
      ? bill.timestamp 
      : new Date();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans leading-relaxed">
      {/* Print styles injected right here to ensure cross-browser precision */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #furniture-print-invoice, #furniture-print-invoice * {
            visibility: visible;
          }
          #furniture-print-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 210mm;
            min-height: 297mm;
            padding: 12mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print-action {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 8mm;
          }
        }
      `}</style>

      <div className="bg-white rounded-[2rem] w-full max-w-3xl flex flex-col shadow-2xl relative max-h-[90vh] overflow-hidden no-print-action">
        {/* Modal Top Bar */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="text-xs font-black uppercase text-gray-500 tracking-wider">A4 Standard Compliant Print Preview</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150"
            >
              <Printer size={14} /> Print A4 Invoice
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Body Container */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 custom-scrollbar">
          <div 
            id="furniture-print-invoice" 
            className="bg-white w-full max-w-[210mm] mx-auto p-12 shadow-md border border-gray-200/80 rounded-2xl text-gray-800 text-xs"
          >
            {/* INVOICE HEADER SECTION */}
            <div className="flex justify-between items-start pb-8 border-b-2 border-gray-100 gap-6">
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase">{shopName}</h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{shopGst}</p>
                <div className="text-[10px] text-gray-500 font-medium max-w-sm mt-2 whitespace-pre-line leading-relaxed">
                  {shopAddress}
                </div>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-[9px] font-black uppercase tracking-wider rounded-md">
                  Tax Invoice
                </span>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-4">Invoice ID</p>
                <p className="text-sm font-black text-gray-900 uppercase">#INV-{bill.billNumber}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">DATED</p>
                <p className="text-[10px] text-gray-900 font-bold">{orderDate.toLocaleDateString()} {orderDate.toLocaleTimeString()}</p>
              </div>
            </div>

            {/* BILL TO & SERVICE METRICS */}
            <div className="grid grid-cols-2 gap-8 py-8 border-b border-gray-100">
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Billed Recipient</h3>
                <p className="text-xs font-black text-gray-900 uppercase">{bill.customerName}</p>
                <p className="text-[10px] text-gray-500 font-bold tracking-wider mt-1">PHONE: {bill.customerPhone}</p>
              </div>
              <div className="text-right">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Transaction Meta</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase">PAYMENT MODE: <span className="text-gray-900 font-black">{bill.paymentMethod}</span></p>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">STATUS: <span className="text-emerald-600 font-black">PAID - FULL</span></p>
              </div>
            </div>

            {/* ITEMIZATION TABLE */}
            <div className="py-8">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-[10px] font-black uppercase text-gray-400 tracking-wide">Product / Code</th>
                    <th className="pb-3 text-right text-[10px] font-black uppercase text-gray-400 tracking-wide w-24">Unit Rate</th>
                    <th className="pb-3 text-right text-[10px] font-black uppercase text-gray-400 tracking-wide w-16">Qty</th>
                    <th className="pb-3 text-right text-[10px] font-black uppercase text-gray-400 tracking-wide w-16">GST %</th>
                    <th className="pb-3 text-right text-[10px] font-black uppercase text-gray-400 tracking-wide w-28">Net Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bill.items.map((item, idx) => {
                    const gstAmount = item.price * item.quantity * ((item.gst || 18) / 100);
                    const lineTotal = (item.price * item.quantity) + gstAmount;
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3.5 pr-4">
                          <p className="font-extrabold text-xs text-gray-900 uppercase">{item.name}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{item.sku} {item.variant ? `• ${item.variant}` : ''}</p>
                        </td>
                        <td className="py-3.5 text-right font-semibold text-gray-900 font-mono">₹{item.price.toLocaleString()}</td>
                        <td className="py-3.5 text-right font-black text-gray-900 font-mono">{item.quantity}</td>
                        <td className="py-3.5 text-right font-semibold text-gray-400 font-mono">{item.gst || 18}%</td>
                        <td className="py-3.5 text-right font-black text-gray-900 font-mono">₹{lineTotal.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* TAX BREAKUP & FINAL TOTALS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t-2 border-gray-100">
              <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-100 self-start">
                <h4 className="font-black text-[9px] text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Landmark size={10} /> Statutory GST Breakdown (CGST + SGST)
                </h4>
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between text-gray-500 font-medium">
                    <span>Central GST (CGST) @{(18/2).toFixed(1)}%:</span>
                    <span className="font-mono text-gray-900 font-bold">₹{(bill.totalGst / 2).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 font-medium pb-2 border-b border-gray-200/50">
                    <span>State GST (SGST) @{(18/2).toFixed(1)}%:</span>
                    <span className="font-mono text-gray-900 font-bold">₹{(bill.totalGst / 2).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 font-black pt-1.5 uppercase">
                    <span>Total Tax Levy:</span>
                    <span className="font-mono text-primary">₹{bill.totalGst.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-right">
                <div className="flex justify-between items-center text-gray-500 font-medium text-[10px]">
                  <span>Untaxed Subtotal:</span>
                  <span className="font-mono text-gray-900 font-semibold">₹{bill.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-gray-500 font-medium text-[10px]">
                  <span>Aggregated Tax (GST):</span>
                  <span className="font-mono text-gray-900 font-semibold">₹{bill.totalGst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-gray-200 text-gray-900">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Grand Total Payable</span>
                  <span className="text-xl font-black font-mono text-primary leading-none">₹{bill.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* FOOTER & COMPLIANCE AGREEMENTS */}
            <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-end gap-8">
              <div className="max-w-md">
                <h4 className="font-black text-[9px] text-gray-400 uppercase tracking-widest mb-1">Standard Terms & Declarations</h4>
                <p className="text-[9px] text-gray-400 leading-relaxed font-medium">
                  We declare that this invoice shows the actual value of furniture and electronic goods described and that all particulars are true and accurate. Custom wood/fabric orders are non-refundable after statutory dispatch operations.
                </p>
                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 mt-2 rounded self-start w-max">
                  <ShieldCheck size={10} className="shrink-0" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Digitally Verified Document (2026)</span>
                </div>
              </div>
              <div className="text-center w-40 shrink-0">
                <div className="h-10 border-b border-gray-300 w-full mb-2"></div>
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Authorized Seal & Signature</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
