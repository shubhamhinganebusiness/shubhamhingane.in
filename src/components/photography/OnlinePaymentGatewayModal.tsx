import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Lock, 
  Sparkles, 
  Building2, 
  Smartphone,
  Globe,
  ArrowRight,
  Receipt
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  PhotographyBill, 
  STUDIO_PROFILE, 
  OnlinePaymentTransaction,
  PaymentMilestone
} from './photographyBillTypes';

interface OnlinePaymentGatewayModalProps {
  bill: PhotographyBill | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (transaction: OnlinePaymentTransaction, updatedMilestoneId?: string) => void;
}

type GatewayTab = 'stripe' | 'square' | 'paypal' | 'upi';

export const OnlinePaymentGatewayModal: React.FC<OnlinePaymentGatewayModalProps> = ({
  bill,
  isOpen,
  onClose,
  onPaymentSuccess
}) => {
  const [activeGateway, setActiveGateway] = useState<GatewayTab>('stripe');
  
  // Choose payment amount target: Full Balance or Next Retainer
  const unpaidMilestone = bill?.milestones?.find(m => !m.isPaid);
  const [targetType, setTargetType] = useState<'retainer' | 'full'>(
    unpaidMilestone && unpaidMilestone.amount > 0 ? 'retainer' : 'full'
  );

  const paymentAmount = targetType === 'retainer' && unpaidMilestone && bill
    ? Math.min(unpaidMilestone.amount, bill.balanceDue)
    : (bill?.balanceDue || 0);

  // Form fields for Card / Stripe
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardName, setCardName] = useState(bill?.clientName || 'Client Name');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<OnlinePaymentTransaction | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !bill) return null;

  const paymentUrl = `https://lensandlightstudios.in/pay/${bill.billNumber}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSimulatePayment = () => {
    if (paymentAmount <= 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      let gatewayName: OnlinePaymentTransaction['gateway'] = 'Stripe';
      let details = `Card ending in ${cardNumber.slice(-4) || '4242'}`;

      if (activeGateway === 'paypal') {
        gatewayName = 'PayPal';
        details = `PayPal Account: ${bill.clientEmail || 'client@paypal.com'}`;
      } else if (activeGateway === 'square') {
        gatewayName = 'Square';
        details = 'Square Card / Apple Pay Express';
      } else if (activeGateway === 'upi') {
        gatewayName = 'UPI';
        details = `Instant UPI: ${STUDIO_PROFILE.upiId}`;
      }

      const tx: OnlinePaymentTransaction = {
        id: `tx-${Date.now()}`,
        timestamp: new Date().toISOString(),
        gateway: gatewayName,
        amount: paymentAmount,
        currency: 'INR',
        paymentIntentId: `pi_${gatewayName.toLowerCase()}_${Math.random().toString(36).substring(2, 9)}`,
        clientEmail: bill.clientEmail,
        status: 'succeeded',
        paymentMethodDetails: details,
        milestoneTitle: targetType === 'retainer' && unpaidMilestone ? unpaidMilestone.title : 'Full Invoice Settlement'
      };

      setIsProcessing(false);
      setPaymentSuccessData(tx);
      onPaymentSuccess(tx, targetType === 'retainer' ? unpaidMilestone?.id : undefined);
    }, 1400);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-lg text-white">Online Payment Gateway</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                    256-BIT ENCRYPTED
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Invoice <strong className="text-zinc-200">{bill.billNumber}</strong> • Client: <strong className="text-zinc-200">{bill.clientName}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Success Screen */}
          {paymentSuccessData ? (
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 size={36} />
              </motion.div>
              <h4 className="text-2xl font-serif font-bold text-white mb-1">Payment Successfully Processed!</h4>
              <p className="text-sm text-zinc-400 mb-6">
                A confirmation receipt and updated statement have been recorded for this project.
              </p>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 text-left max-w-md mx-auto mb-6 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Amount Paid:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">₹{paymentSuccessData.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Payment Gateway:</span>
                  <span className="font-bold text-white">{paymentSuccessData.gateway}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Transaction Ref:</span>
                  <span className="font-mono text-zinc-300">{paymentSuccessData.paymentIntentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Milestone / Scope:</span>
                  <span className="text-zinc-300">{paymentSuccessData.milestoneTitle}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#D4AF37] hover:bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Return to Invoice Desk
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Payment Split Target Selector (Retainer vs Balance) */}
              <div className="bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Select Amount to Pay</span>
                  <span className="text-xs font-mono text-[#D4AF37]">Total Balance: ₹{bill.balanceDue.toLocaleString('en-IN')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {unpaidMilestone && (
                    <button
                      type="button"
                      onClick={() => setTargetType('retainer')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        targetType === 'retainer'
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/10'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">Next Retainer / Deposit</span>
                        <span className="text-[10px] px-2 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] rounded font-bold">
                          {unpaidMilestone.percentage}% Stage
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mb-1">{unpaidMilestone.title}</p>
                      <p className="text-base font-serif font-black text-[#D4AF37]">
                        ₹{unpaidMilestone.amount.toLocaleString('en-IN')}
                      </p>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setTargetType('full')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      targetType === 'full'
                        ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/10'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">Full Remaining Balance</span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-bold">
                        100% Settlement
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mb-1">Clears all upcoming dues & releases masters</p>
                    <p className="text-base font-serif font-black text-emerald-400">
                      ₹{bill.balanceDue.toLocaleString('en-IN')}
                    </p>
                  </button>
                </div>
              </div>

              {/* Gateway Channel Selector Tabs */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Choose Online Gateway
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'stripe', name: 'Stripe', desc: 'Credit / Debit Cards', color: 'from-indigo-600/30' },
                    { id: 'square', name: 'Square', desc: 'Instant & Apple Pay', color: 'from-sky-600/30' },
                    { id: 'paypal', name: 'PayPal', desc: 'ACH & Global Cards', color: 'from-blue-600/30' },
                    { id: 'upi', name: 'UPI QR', desc: 'PhonePe / GPay', color: 'from-amber-600/30' }
                  ].map(gw => (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => setActiveGateway(gw.id as GatewayTab)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        activeGateway === gw.id
                          ? 'bg-zinc-800 border-[#D4AF37] text-white shadow-md'
                          : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <span className="font-bold text-xs block text-white">{gw.name}</span>
                      <span className="text-[9px] text-zinc-400 block mt-0.5">{gw.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gateway Body */}
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                {activeGateway === 'stripe' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <CreditCard size={14} className="text-[#D4AF37]" />
                        Stripe Elements Secure Checkout
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">VISA / MASTERCARD / AMEX / RUPAY</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-zinc-400 mb-1 font-medium">Cardholder Name</label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={e => setCardName(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:border-[#D4AF37] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-1 font-medium">Card Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={e => setCardNumber(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono focus:border-[#D4AF37] outline-none"
                          />
                          <Lock size={13} className="absolute left-3 top-3 text-zinc-500" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-zinc-400 mb-1 font-medium">Expiration</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={e => setCardExpiry(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono focus:border-[#D4AF37] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-400 mb-1 font-medium">CVC / CVV</label>
                          <input
                            type="text"
                            value={cardCvc}
                            onChange={e => setCardCvc(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono focus:border-[#D4AF37] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeGateway === 'square' && (
                  <div className="space-y-4 text-center py-2">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto">
                      <Smartphone size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Square Web Payments SDK</h4>
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                        Instant 1-touch payment via Apple Pay, Google Pay, or direct ACH automated clearing house.
                      </p>
                    </div>
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between text-xs max-w-xs mx-auto">
                      <span className="text-zinc-400">Device Wallet:</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <Check size={12} /> Ready to authorize
                      </span>
                    </div>
                  </div>
                )}

                {activeGateway === 'paypal' && (
                  <div className="space-y-4 text-center py-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
                      <Globe size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">PayPal Global & Domestic Commerce</h4>
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                        Convenient for NRI & International destination wedding couples paying in USD/EUR with buyer protection.
                      </p>
                    </div>
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs max-w-xs mx-auto">
                      <p className="text-zinc-400">Recipient: <strong className="text-white">paypal@lensandlightstudios.in</strong></p>
                    </div>
                  </div>
                )}

                {activeGateway === 'upi' && (
                  <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                    <div className="p-3 bg-white rounded-2xl shrink-0 shadow-lg">
                      <QRCodeSVG
                        value={`upi://pay?pa=${encodeURIComponent(STUDIO_PROFILE.upiId)}&pn=${encodeURIComponent(STUDIO_PROFILE.studioName)}&am=${paymentAmount}&cu=INR&tn=${encodeURIComponent(`Bill-${bill.billNumber}`)}`}
                        size={120}
                        level="M"
                      />
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold text-[10px]">
                          INSTANT ZERO-FEE UPI
                        </span>
                      </div>
                      <p className="text-zinc-300 font-medium">
                        Scan from PhonePe, Google Pay, Paytm or any BHIM UPI application.
                      </p>
                      <p className="text-zinc-500">
                        VPA: <span className="font-mono text-zinc-300 font-bold">{STUDIO_PROFILE.upiId}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Shareable Client Link Generator */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Direct Client Payment Portal Link</span>
                  <p className="text-zinc-300 font-mono truncate text-[11px] mt-0.5">{paymentUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-bold text-[11px] flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Charge Amount</span>
                  <span className="text-xl font-serif font-black text-[#D4AF37]">
                    ₹{paymentAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    disabled={isProcessing || paymentAmount <= 0}
                    className="px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-white text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Authorizing...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={15} />
                        <span>Charge & Confirm ₹{paymentAmount.toLocaleString('en-IN')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
