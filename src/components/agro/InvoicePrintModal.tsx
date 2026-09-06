import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Download } from 'lucide-react';
import { AgroBill } from './types';
// @ts-ignore - html2pdf doesn't have good types in some environments
import html2pdf from 'html2pdf.js';

interface InvoicePrintModalProps {
  bill: AgroBill | null;
  settings: AgroBill['shopDetails'] | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (bill: AgroBill) => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ bill, settings, isOpen, onClose, onEdit }) => {
  if (!bill) return null;

  const shop = bill.shopDetails || settings;

  const handleDownloadPDF = () => {
    const element = document.getElementById('print-section');
    if (!element) return;

    const opt = {
      margin: 0,
      filename: `Invoice_${bill.invoiceNo}_${bill.customerName}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true, logging: false },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    // Hide control buttons temporarily for the capture
    const controls = element.querySelector('.control-buttons');
    if (controls) (controls as HTMLElement).style.opacity = '0';
    const closeBtns = element.querySelectorAll('.preview-close-btn');
    closeBtns.forEach(btn => (btn as HTMLElement).style.opacity = '0');

    html2pdf().set(opt).from(element).save().then(() => {
      if (controls) (controls as HTMLElement).style.opacity = '1';
      closeBtns.forEach(btn => (btn as HTMLElement).style.opacity = '1');
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:block">
          <style>
            {`
              @media print {
                @page {
                  size: A4;
                  margin: 0;
                }
                body {
                  background: white !important;
                  color: black !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                .print-no-bg {
                  background: transparent !important;
                }
                nav, footer, aside, .print-hidden {
                  display: none !important;
                }
                #print-section {
                  width: 100% !important;
                  max-width: none !important;
                  box-shadow: none !important;
                  transform: none !important;
                }
              }
            `}
          </style>
          
          <div className="min-h-full w-full flex flex-col items-center py-8">
            <div className="sticky top-4 mb-4 flex gap-4 print:hidden z-[220] control-buttons">
              <button 
                onClick={() => window.print()} 
                className="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary transition-all shadow-xl rounded-xl"
              >
                <Printer size={16} /> Print
              </button>
              <button 
                onClick={handleDownloadPDF} 
                className="px-6 py-3 bg-white border-2 border-black text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black hover:text-white transition-all shadow-xl rounded-xl"
              >
                <Download size={16} /> PDF
              </button>
              {onEdit && (
                <button 
                  onClick={() => onEdit(bill)}
                  className="px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-black transition-all rounded-xl"
                >
                  Edit
                </button>
              )}
              <button 
                onClick={onClose} 
                className="px-6 py-3 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl rounded-xl"
              >
                <X size={16} /> Close
              </button>
            </div>

            <motion.div 
              id="print-section"
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-[95vw] lg:max-w-[210mm] bg-white text-black shadow-2xl rounded-none flex flex-col relative print:shadow-none print:p-0 print:max-w-none origin-top transition-all"
            >
              {/* No fixed close button here, using sticky header instead */}

              {['Customer Copy', 'Shop Copy'].map((copyType, copyIdx) => (
                <div key={copyIdx} className={`px-4 sm:px-10 py-6 flex flex-col min-h-[148.5mm] relative ${copyIdx === 0 ? 'border-b border-dashed border-gray-400 print:border-black' : ''} print:px-8 print:py-4`}>
                <div className="absolute top-2 right-10 text-[7px] font-black uppercase tracking-widest text-gray-300 print:text-black italic">
                  {copyType}
                </div>

                {/* Header */}
                <div className="border-b-2 border-black pb-2 mb-2 flex justify-between items-start">
                  <div className="flex-1">
                    <h1 className="text-2xl font-black tracking-tighter uppercase mb-0.5 print:text-xl text-gray-900 leading-none">{shop?.name}</h1>
                    <p className="text-[8px] font-bold opacity-80 mb-0.5 italic">{shop?.address}</p>
                    <p className="text-[8px] font-black">Ph: {shop?.contact} | Owner: {shop?.owner}</p>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2 bg-gray-50 print:bg-transparent p-1 rounded">
                      <p className="text-[7px] font-bold uppercase"><span className="opacity-50">GSTIN:</span> {shop?.gstin || 'N/A'}</p>
                      <p className="text-[7px] font-bold uppercase"><span className="opacity-50">Fert. Lic:</span> {shop?.fertilizerLicense || 'N/A'}</p>
                      <p className="text-[7px] font-bold uppercase"><span className="opacity-50">Seed Lic:</span> {shop?.seedLicense || 'N/A'}</p>
                      <p className="text-[7px] font-bold uppercase"><span className="opacity-50">Insect. Lic:</span> {shop?.insecticideLicense || 'N/A'}</p>
                      <p className="text-[7px] font-bold uppercase"><span className="opacity-50">Licence No:</span> {shop?.licenceNo || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <h2 className="text-xl font-black uppercase mb-1 italic tracking-tighter print:text-lg">{bill.isEstimate ? 'Estimate' : 'Tax Invoice'}</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest border-2 border-black px-3 py-1 inline-block mb-1 bg-black text-white print:bg-transparent print:text-black">No: {bill.invoiceNo}</p>
                    <div className="flex flex-col text-[7px] font-black text-gray-500 print:text-black uppercase text-right leading-relaxed">
                      <span>Date: {bill.date}</span>
                      <span>Time: {bill.time}</span>
                    </div>
                  </div>
                </div>

                {/* Party Details */}
                <div className="grid grid-cols-2 gap-4 mb-2 py-2 px-4 border border-black rounded-none">
                  <div>
                    <p className="text-[6px] font-black text-gray-400 print:text-black uppercase tracking-widest mb-0.5">To / Customer Details</p>
                    <p className="text-sm font-black uppercase mb-0.5 tracking-tight">{bill.customerName}</p>
                    <p className="text-[8px] font-bold mb-0.5">{bill.customerAddress}</p>
                    <p className="text-[8px] font-black text-primary print:text-black tracking-widest leading-none mt-1">MOBILE: {bill.customerPhone}</p>
                  </div>
                  <div className="flex flex-col justify-end text-right">
                    <p className="text-[6px] font-black text-gray-400 print:text-black uppercase tracking-widest mb-0.5">Payment Info</p>
                    <p className="text-[10px] font-black uppercase italic">{bill.paymentMethod}</p>
                    <div className="mt-1 flex justify-end gap-2">
                       <span className={`text-[6px] font-black px-2 py-0.5 border border-black uppercase ${bill.paymentStatus === 'Paid' ? 'bg-black text-white' : ''}`}>{bill.paymentStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="flex-1 overflow-visible">
                  <table className="w-full text-left text-[8px] border-collapse border border-black">
                    <thead>
                      <tr className="border-b border-black bg-gray-50 print:bg-transparent">
                        <th className="p-1 border-r border-black font-black uppercase text-[6px]">SN</th>
                        <th className="p-1 border-r border-black font-black uppercase text-[6px] w-[40%]">Product Description</th>
                        <th className="p-1 border-r border-black font-black uppercase text-[6px]">Batch</th>
                        <th className="p-1 border-r border-black font-black uppercase text-[6px] text-center">Qty</th>
                        <th className="p-1 border-r border-black font-black uppercase text-[6px] text-right">Rate</th>
                        <th className="p-1 border-r border-black font-black uppercase text-[6px] text-right">GST%</th>
                        <th className="p-1 border-r border-black font-black uppercase text-[6px] text-right">CGST</th>
                        <th className="p-1 border-r border-black font-black uppercase text-[6px] text-right">SGST</th>
                        <th className="p-1 font-black uppercase text-[6px] text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      {bill.items.map((item, idx) => (
                        <tr key={`invoice-${copyIdx}-item-${item.productId}-${item.batchNumber}-${idx}`} className="border-b border-black align-top">
                          <td className="p-1 border-r border-black text-center font-bold">{idx + 1}</td>
                          <td className="p-1 border-r border-black">
                            <p className="font-black uppercase leading-none mb-0.5">{item.name}</p>
                            <p className="text-[5px] text-gray-500 print:text-black italic font-bold">{item.companyName}</p>
                          </td>
                          <td className="p-1 border-r border-black text-center font-black">{item.batchNumber}</td>
                          <td className="p-1 border-r border-black text-center font-black">{item.quantity}</td>
                          <td className="p-1 border-r border-black text-right">₹{(item.price - ((item.cgst || 0) + (item.sgst || 0)) / item.quantity).toFixed(2)}</td>
                          <td className="p-1 border-r border-black text-right font-bold">{item.gst}%</td>
                          <td className="p-1 border-r border-black text-right italic">₹{item.cgst?.toFixed(2) || '0.00'}</td>
                          <td className="p-1 border-r border-black text-right italic">₹{item.sgst?.toFixed(2) || '0.00'}</td>
                          <td className="p-1 text-right font-black">₹{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                      {/* Filler rows to maintain height if items are few */}
                      {bill.items.length < 5 && Array.from({ length: 5 - bill.items.length }).map((_, i) => (
                        <tr key={`filler-${copyIdx}-${i}`} className="h-6 border-b border-black">
                          <td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Summary */}
                <div className="mt-1 border-t-2 border-black pt-1 flex justify-between">
                  <div className="max-w-[60%]">
                    <div className="flex gap-2 items-baseline mb-1">
                       <p className="text-[6px] font-black text-gray-400 print:text-black uppercase">Amt in Words:</p>
                       <p className="text-[8px] font-black italic text-black uppercase leading-tight">Rupees {bill.totalInWords} Only</p>
                    </div>
                    
                    <div className="text-[6px] font-bold border border-black p-1.5 leading-tight uppercase bg-gray-50 print:bg-transparent min-h-[30px]">
                      Terms & Notes: {bill.footerNote || 'Goods once sold will not be taken back.'}
                    </div>
                  </div>
                  <div className="w-36 space-y-0.5 text-[8px]">
                    <div className="flex justify-between text-[7px] border-b border-black border-dotted pb-0.5">
                      <span className="font-bold">TAXABLE VALUE</span>
                      <span className="font-black">₹{bill.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[7px] border-b border-black border-dotted pb-0.5">
                      <span className="font-bold">TOTAL GST AMT</span>
                      <span className="font-black">₹{bill.totalGst.toFixed(2)}</span>
                    </div>
                    {bill.discount > 0 && (
                      <div className="flex justify-between text-red-500 print:text-black text-[7px] border-b border-black border-dotted pb-0.5">
                        <span className="font-bold">CASH DISCOUNT</span>
                        <span className="font-black">-₹{bill.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black border-t-2 border-black pt-0.5 mt-0.5 leading-none">
                      <span className="text-[8px] self-center">NET TOTAL</span>
                      <span className="tracking-tighter italic">₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="mt-2 flex justify-between items-end border-t border-black pt-1">
                  <div className="text-center w-24 border-t border-dashed border-gray-400 print:border-black pt-0.5">
                    <p className="text-[6px] font-bold uppercase italic">Customer Sign</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] font-black uppercase leading-tight italic mb-4">For {shop?.name}</p>
                    <p className="text-[6px] font-black border-t border-black pt-0.5 uppercase tracking-tighter">( Authorized Signatory )</p>
                  </div>
                </div>
              </div>
            ))}

            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
