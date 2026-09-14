import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  X, 
  Download, 
  Share2, 
  Check, 
  Copy, 
  FileText, 
  QrCode, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard, 
  ShieldCheck, 
  Sparkles,
  Edit3,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  PhotographyBill, 
  STUDIO_PROFILE, 
  numberToWordsINR 
} from './photographyBillTypes';

interface PhotographyBillPrintModalProps {
  bill: PhotographyBill;
  onClose: () => void;
  onEdit?: (bill: PhotographyBill) => void;
}

export const PhotographyBillPrintModal: React.FC<PhotographyBillPrintModalProps> = ({
  bill,
  onClose,
  onEdit
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const summaryText = `
*LENS & LIGHT STUDIOS — INVOICE SUMMARY*
Invoice No: ${bill.billNumber}
Date: ${bill.billDate}
Client: ${bill.clientName}
Event: ${bill.eventTitle} (${bill.eventDates})
Venue: ${bill.eventVenue}

*FINANCIAL SUMMARY*
Total Amount: ₹${bill.totalAmount.toLocaleString('en-IN')}
Advance Paid: ₹${bill.advancePaid.toLocaleString('en-IN')}
*Balance Due: ₹${bill.balanceDue.toLocaleString('en-IN')}*
Status: ${bill.paymentStatus}
Payment Mode: ${bill.paymentMethod}

*UPI Payment ID:* ${bill.upiId || STUDIO_PROFILE.upiId}
*Bank Details:* ${STUDIO_PROFILE.bankName} | A/C: ${STUDIO_PROFILE.accountNumber} | IFSC: ${STUDIO_PROFILE.ifscCode}

For queries, contact ${STUDIO_PROFILE.phone} or ${STUDIO_PROFILE.email}.
    `.trim();

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${bill.billNumber}_${bill.clientName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF Generation failed, falling back to print dialog:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // UPI payment intent link for QR Code
  const upiPayAmount = bill.balanceDue > 0 ? bill.balanceDue : bill.totalAmount;
  const upiQrString = `upi://pay?pa=${encodeURIComponent(bill.upiId || STUDIO_PROFILE.upiId)}&pn=${encodeURIComponent(STUDIO_PROFILE.studioName)}&am=${upiPayAmount}&cu=INR&tn=${encodeURIComponent(`Bill-${bill.billNumber}`)}`;

  const statusBadge = () => {
    switch (bill.paymentStatus) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-black uppercase tracking-wider">
            <CheckCircle2 size={13} className="text-emerald-600" />
            PAID IN FULL
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-xs font-black uppercase tracking-wider">
            <Clock size={13} className="text-amber-600" />
            ADVANCE RECEIVED (PARTIAL)
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-xs font-black uppercase tracking-wider">
            <AlertCircle size={13} className="text-rose-600" />
            PAYMENT PENDING
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-sans">
      
      {/* Precision Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #photography-invoice-printable,
          #photography-invoice-printable * {
            visibility: visible !important;
          }
          #photography-invoice-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 auto !important;
            padding: 10mm 12mm !important;
            background: #ffffff !important;
            color: #111111 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print-element {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>

      {/* Outer Modal Container */}
      <div className="bg-[#141414] border border-gray-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden my-auto no-print-element">
        
        {/* Action Header Bar (Hidden in Print) */}
        <div className="px-6 py-4 bg-[#1a1a1a] border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-sm text-[#D4AF37] tracking-wider">{bill.billNumber}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded">
                  {bill.eventType}
                </span>
              </div>
              <p className="text-xs text-gray-400">Client: <strong className="text-white">{bill.clientName}</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onEdit && (
              <button
                onClick={() => onEdit(bill)}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Edit this invoice"
              >
                <Edit3 size={13} />
                <span>Edit Bill</span>
              </button>
            )}

            <button
              onClick={handleCopySummary}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Copy WhatsApp/Email summary"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download size={13} />
              <span>{isGeneratingPdf ? 'Rendering PDF...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#D4AF37] hover:bg-white text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Printer size={14} />
              <span>Print A4 Bill</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-gray-800/80 hover:bg-red-500 hover:text-white text-gray-400 rounded-xl transition-all cursor-pointer ml-1"
              aria-label="Close invoice modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-900/60 flex justify-center">
          
          {/* THE PRINTABLE INVOICE CANVAS (Strict A4 Layout & Clean Typography) */}
          <div
            id="photography-invoice-printable"
            ref={invoiceRef}
            className="w-full max-w-[210mm] bg-white text-gray-900 p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-200 text-xs leading-relaxed relative"
            style={{ minHeight: '275mm' }}
          >
            {/* Elegant Ambient Watermark in Center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
              <div className="font-serif font-black text-9xl tracking-widest select-none text-black">
                LENS & LIGHT
              </div>
            </div>

            {/* TOP HEADER: Studio Branding & Tax Invoice Metadata */}
            <div className="border-b-2 border-gray-900 pb-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                {/* Brand Logo & Address */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-black text-[#D4AF37] flex items-center justify-center font-serif font-black text-base">
                      L
                    </div>
                    <div>
                      <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-wider text-black leading-none">
                        {STUDIO_PROFILE.studioName}
                      </h1>
                      <span className="text-[8px] font-black uppercase tracking-[0.35em] text-[#997711] block mt-0.5">
                        {STUDIO_PROFILE.brandSubtext}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-gray-600 text-[11px] leading-tight space-y-0.5">
                    <p>{STUDIO_PROFILE.address}</p>
                    <p>{STUDIO_PROFILE.cityStateZip}</p>
                    <p className="pt-1">
                      <span className="font-semibold text-gray-900">Phone:</span> {STUDIO_PROFILE.phone} | <span className="font-semibold text-gray-900">Email:</span> {STUDIO_PROFILE.email}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900">GSTIN:</span> <span className="font-mono font-bold text-gray-900">{STUDIO_PROFILE.gstin}</span> | <span className="font-semibold text-gray-900">PAN:</span> <span className="font-mono text-gray-900">{STUDIO_PROFILE.panNumber}</span>
                    </p>
                  </div>
                </div>

                {/* Tax Invoice Identification Badge */}
                <div className="sm:text-right flex flex-col sm:items-end">
                  <span className="px-3 py-1 bg-black text-[#D4AF37] text-[10px] font-black tracking-[0.25em] uppercase rounded inline-block mb-3">
                    TAX INVOICE / CLIENT BILL
                  </span>
                  <div className="space-y-1 font-mono text-[11px]">
                    <p>
                      <span className="text-gray-500 font-sans uppercase text-[10px]">Invoice No:</span>{' '}
                      <strong className="text-sm font-black text-black">{bill.billNumber}</strong>
                    </p>
                    <p>
                      <span className="text-gray-500 font-sans uppercase text-[10px]">Bill Date:</span>{' '}
                      <span className="font-bold text-gray-800">{bill.billDate}</span>
                    </p>
                    <p>
                      <span className="text-gray-500 font-sans uppercase text-[10px]">Due Date:</span>{' '}
                      <span className="font-bold text-gray-800">{bill.dueDate}</span>
                    </p>
                    <div className="pt-1">
                      {statusBadge()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION: Billed To (Client) & Event Logistics Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6 text-[11px]">
              {/* Client Info */}
              <div>
                <span className="text-[9px] font-black text-[#997711] uppercase tracking-widest block mb-1.5">
                  BILLED TO (CLIENT DETAILS)
                </span>
                <h3 className="font-serif text-base font-bold text-gray-900 mb-1">
                  {bill.clientName}
                </h3>
                {bill.clientAddress && (
                  <p className="text-gray-600 mb-1">{bill.clientAddress}</p>
                )}
                <p className="text-gray-700 flex items-center gap-1">
                  <Phone size={11} className="text-gray-400 shrink-0" />
                  <span className="font-mono">{bill.clientPhone}</span>
                </p>
                <p className="text-gray-700 flex items-center gap-1">
                  <Mail size={11} className="text-gray-400 shrink-0" />
                  <span>{bill.clientEmail}</span>
                </p>
              </div>

              {/* Event Details */}
              <div className="sm:border-l sm:border-gray-200 sm:pl-4">
                <span className="text-[9px] font-black text-[#997711] uppercase tracking-widest block mb-1.5">
                  EVENT & SHOOT LOGISTICS
                </span>
                <h4 className="font-serif text-sm font-bold text-gray-900 mb-1">
                  {bill.eventTitle}
                </h4>
                <p className="text-gray-700 flex items-start gap-1 mb-1">
                  <Calendar size={11} className="text-gray-400 shrink-0 mt-0.5" />
                  <span><strong>Event Date(s):</strong> {bill.eventDates}</span>
                </p>
                <p className="text-gray-700 flex items-start gap-1 mb-1">
                  <MapPin size={11} className="text-gray-400 shrink-0 mt-0.5" />
                  <span><strong>Shoot Venue:</strong> {bill.eventVenue}</span>
                </p>
                <p className="text-gray-500 text-[10px]">
                  <strong>Service Category:</strong> {bill.eventType}
                </p>
              </div>
            </div>

            {/* SECTION: Itemized Photography & Production Deliverables Table */}
            <div className="mb-6 overflow-hidden rounded-xl border border-gray-300">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black text-white text-[10px] uppercase font-black tracking-wider">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Service & Deliverables Description</th>
                    <th className="py-2.5 px-3 w-24 text-center">Category</th>
                    <th className="py-2.5 px-2 w-20 text-center">Qty / Units</th>
                    <th className="py-2.5 px-3 w-24 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-[11px]">
                  {bill.items.map((item, idx) => {
                    const unitSuffix = item.unitLabel 
                      ? item.unitLabel 
                      : item.pricingModel === 'hourly' 
                      ? 'hrs' 
                      : item.pricingModel === 'daily' 
                      ? 'days' 
                      : item.pricingModel === 'per_image' 
                      ? 'images' 
                      : item.pricingModel === 'per_session' 
                      ? 'sessions' 
                      : 'pkg';

                    const rateSuffix = item.pricingModel === 'hourly'
                      ? '/hr'
                      : item.pricingModel === 'daily'
                      ? '/day'
                      : item.pricingModel === 'per_image'
                      ? '/img'
                      : item.pricingModel === 'per_session'
                      ? '/sess'
                      : '';

                    return (
                      <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                        <td className="py-3 px-3 text-center text-gray-500 font-mono font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-900">{item.description}</div>
                          {item.deliverables && (
                            <div className="text-[10px] text-gray-600 font-light mt-0.5 italic">
                              ↳ {item.deliverables}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-800 rounded text-[9px] font-bold uppercase tracking-wider">
                            {item.serviceCategory}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-gray-700 whitespace-nowrap">
                          {item.quantity} <span className="text-[9px] text-gray-500 font-sans">{unitSuffix}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-gray-700 whitespace-nowrap">
                          ₹{item.rate.toLocaleString('en-IN')}<span className="text-[9px] text-gray-500">{rateSuffix}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                          ₹{item.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* SECTION: Retainer & Payment Milestones Schedule (if configured) */}
            {bill.milestones && bill.milestones.length > 0 && (
              <div className="mb-6 rounded-xl border border-gray-300 overflow-hidden">
                <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300 flex justify-between items-center text-[10px]">
                  <span className="font-black uppercase tracking-wider text-gray-800">
                    RETAINER & PRODUCTION PAYMENT MILESTONE SCHEDULE
                  </span>
                  <span className="text-gray-500 font-medium">
                    {bill.milestones.filter(m => m.isPaid).length} of {bill.milestones.length} Cleared
                  </span>
                </div>
                <table className="w-full text-left border-collapse text-[10.5px]">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 uppercase text-[8.5px] font-bold border-b border-gray-200">
                      <th className="py-1.5 px-3">Milestone Stage / Purpose</th>
                      <th className="py-1.5 px-2 text-center w-16">Split</th>
                      <th className="py-1.5 px-3 text-center w-28">Due Date</th>
                      <th className="py-1.5 px-3 text-right w-28">Amount</th>
                      <th className="py-1.5 px-3 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bill.milestones.map((ms, idx) => (
                      <tr key={ms.id || idx} className={ms.isPaid ? 'bg-emerald-50/40' : 'bg-white'}>
                        <td className="py-2 px-3">
                          <span className="font-bold text-gray-900">{ms.title}</span>
                          {ms.notes && <p className="text-[9px] text-gray-500 italic mt-0.5">{ms.notes}</p>}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-gray-600">
                          {ms.percentage}%
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-gray-700">
                          {ms.dueDate}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                          ₹{ms.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {ms.isPaid ? (
                            <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ Paid
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SECTION: Financial Breakdown & Payment Reconciliation */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 mb-6">
              
              {/* Left Column: Bank Transfer & UPI QR Code (7/12) */}
              <div className="sm:col-span-7 flex flex-col justify-between space-y-4">
                
                {/* Amount in words */}
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <span className="text-[9px] font-black text-amber-900 uppercase tracking-widest block mb-0.5">
                    AMOUNT CHARGEABLE (IN WORDS)
                  </span>
                  <p className="font-serif font-bold text-gray-900 text-xs italic">
                    {numberToWordsINR(bill.totalAmount)}
                  </p>
                </div>

                {/* Instant UPI QR Code & Bank Details */}
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest block mb-2">
                    DIGITAL PAYMENT OPTIONS (UPI / NEFT / IMPS)
                  </span>
                  <div className="flex items-center gap-4">
                    {/* QR Code */}
                    <div className="bg-white p-2 rounded-lg border border-gray-300 shadow-sm shrink-0 flex flex-col items-center">
                      <QRCodeSVG
                        value={upiQrString}
                        size={84}
                        level="M"
                        includeMargin={false}
                      />
                      <span className="text-[7.5px] font-bold text-gray-500 uppercase mt-1">Scan To Pay</span>
                    </div>

                    {/* Bank Wire Details */}
                    <div className="text-[10px] text-gray-600 space-y-0.5 leading-tight">
                      <p><strong className="text-gray-900">UPI ID:</strong> <span className="font-mono text-black font-bold">{bill.upiId || STUDIO_PROFILE.upiId}</span></p>
                      <p><strong className="text-gray-900">Bank Name:</strong> {STUDIO_PROFILE.bankName}</p>
                      <p><strong className="text-gray-900">Account Name:</strong> {STUDIO_PROFILE.accountName}</p>
                      <p><strong className="text-gray-900">Account No:</strong> <span className="font-mono font-bold text-gray-900">{STUDIO_PROFILE.accountNumber}</span></p>
                      <p><strong className="text-gray-900">IFSC Code:</strong> <span className="font-mono font-bold text-gray-900">{STUDIO_PROFILE.ifscCode}</span></p>
                      <p className="text-[9px] text-gray-500 pt-0.5">Preferred Mode: {bill.paymentMethod}</p>
                    </div>
                  </div>

                  {/* Online Gateways Badges */}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-1.5 flex-wrap text-[8.5px]">
                      <span className="font-bold text-gray-700">ONLINE GATEWAYS:</span>
                      <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded font-bold">Stripe Card</span>
                      <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded font-bold">PayPal</span>
                      <span className="px-1.5 py-0.5 bg-sky-50 border border-sky-200 text-sky-700 rounded font-bold">Square</span>
                      <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded font-bold">Instant UPI</span>
                    </div>
                    <p className="text-[8px] text-gray-500 font-mono mt-1">
                      Direct Client Portal: https://lensandlightstudios.in/pay/{bill.billNumber}
                    </p>
                  </div>
                </div>

              </div>

              {/* Right Column: Financial Calculations Table (5/12) */}
              <div className="sm:col-span-5 bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-[11px]">
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-mono font-bold text-gray-800">
                    ₹{bill.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {bill.discountAmount > 0 && (
                  <div className="flex justify-between py-1 border-b border-gray-200 text-emerald-700">
                    <span>
                      Discount {bill.discountType === 'percent' ? `(${bill.discountValue}%)` : '(Special Offer)'}
                    </span>
                    <span className="font-mono font-bold">
                      -₹{bill.discountAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {bill.taxAmount > 0 ? (
                  <>
                    <div className="flex justify-between py-1 text-gray-600">
                      <span>CGST ({bill.taxRate / 2}%)</span>
                      <span className="font-mono">₹{bill.cgst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 text-gray-600 border-b border-gray-200">
                      <span>SGST ({bill.taxRate / 2}%)</span>
                      <span className="font-mono">₹{bill.sgst.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between py-1 border-b border-gray-200 text-gray-500 text-[10px]">
                    <span>GST (Tax Exempted)</span>
                    <span className="font-mono">₹0</span>
                  </div>
                )}

                {/* Total Invoice Value */}
                <div className="flex justify-between py-2 border-b-2 border-gray-900 text-sm font-black text-black">
                  <span>Grand Total</span>
                  <span className="font-mono text-base text-black">
                    ₹{bill.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Advance Paid */}
                <div className="flex justify-between py-1 text-gray-700">
                  <span>Advance / Retainers Paid</span>
                  <span className="font-mono font-bold text-emerald-700">
                    ₹{bill.advancePaid.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Late Fee Surcharge if applied */}
                {bill.lateFeeApplied && (bill.lateFeeAmount || 0) > 0 && (
                  <div className="flex justify-between py-1 text-rose-700 font-bold border-t border-rose-200 bg-rose-50/60 px-2 rounded">
                    <span>Overdue Late Surcharge</span>
                    <span className="font-mono">+₹{bill.lateFeeAmount?.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Balance Due */}
                <div className="flex justify-between py-2.5 px-3 bg-black text-white rounded-lg font-black text-sm">
                  <span className="uppercase tracking-wider text-[11px] text-[#D4AF37]">
                    {bill.lateFeeApplied && (bill.lateFeeAmount || 0) > 0 ? 'Total Due (w/ Late Fee)' : 'Balance Due'}
                  </span>
                  <span className="font-mono text-base text-[#D4AF37]">
                    ₹{(bill.balanceDue + (bill.lateFeeApplied ? (bill.lateFeeAmount || 0) : 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

            </div>

            {/* Custom Notes if provided */}
            {bill.notes && (
              <div className="mb-4 p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-[10.5px]">
                <strong className="text-blue-900 block mb-0.5 uppercase tracking-wider text-[9px]">Special Instructions & Notes:</strong>
                <p className="text-blue-950">{bill.notes}</p>
              </div>
            )}

            {/* SECTION: Studio Terms & Conditions & Signatures */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-4 border-t border-gray-300 text-[9.5px]">
              
              {/* Terms Column (8/12) */}
              <div className="sm:col-span-8 text-gray-500 space-y-1">
                <span className="font-black text-gray-800 uppercase tracking-wider block text-[10px]">
                  TERMS & PRODUCTION POLICIES:
                </span>
                <ol className="list-decimal pl-4 space-y-1 leading-snug">
                  {(bill.terms && bill.terms.length > 0 ? bill.terms : STUDIO_PROFILE ? [
                    '50% advance deposit confirms studio crew reservation on shooting dates.',
                    'Deliverables: Master retouched images within 21 working days; 4K films in 35 days.',
                    'RAW uncompressed footage preserved in studio cold-storage archive for 12 months.',
                    'Lens & Light Studios holds copyright and portfolio creative publication permissions.'
                  ] : []).map((term, i) => (
                    <li key={i}>{term}</li>
                  ))}
                </ol>
              </div>

              {/* Authorized Signatory & Digital Stamp (4/12) */}
              <div className="sm:col-span-4 flex flex-col justify-end items-end text-right">
                <div className="w-32 h-12 border-b border-gray-400 flex items-end justify-center pb-1">
                  <span className="font-serif italic text-base text-gray-800 tracking-wider">
                    {STUDIO_PROFILE.authorizedSignatory}
                  </span>
                </div>
                <div className="mt-1 text-[10px]">
                  <strong className="text-gray-900 block font-bold">{STUDIO_PROFILE.authorizedSignatory}</strong>
                  <span className="text-gray-500 block">{STUDIO_PROFILE.directorDesignation}</span>
                  <span className="font-bold text-[#997711] text-[9px] uppercase tracking-wider">LENS & LIGHT STUDIOS</span>
                </div>
              </div>

            </div>

            {/* Bottom Certification Footer */}
            <div className="mt-8 pt-3 border-t border-gray-200 flex justify-between items-center text-[9px] text-gray-400 font-mono">
              <span>This is a computer-generated tax invoice issued by Lens & Light Studios.</span>
              <span>Generated on {new Date().toLocaleDateString('en-IN')}</span>
            </div>

          </div>

        </div>

        {/* Footer controls inside modal (Hidden in Print) */}
        <div className="p-4 bg-[#141414] border-t border-gray-800 flex justify-between items-center text-xs text-gray-400">
          <span className="text-[11px] text-gray-500">
            Standard A4 size formatting compliant. Prints directly to paper or PDF without web margins.
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-[#D4AF37] hover:bg-white text-black font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-[#D4AF37]/20 flex items-center gap-1.5"
            >
              <Printer size={14} />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
