import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Receipt, 
  Smartphone, 
  Send, 
  QrCode, 
  Wallet, 
  CheckCircle2, 
  Search, 
  PlusCircle, 
  Share2, 
  Printer, 
  Phone, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Lock, 
  User, 
  Clock, 
  RefreshCw,
  Award,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { 
  DigitalPavati, 
  VolunteerCollector, 
  MandalProfile, 
  MandalLanguage, 
  PaymentMode, 
  IncomeCategory 
} from '../types';
import { generateUniquePavatiNumber, getWhatsAppShareText, convertNumberToMarathiWords } from '../utils/receiptGenerator';

interface VolunteerCollectorWorkspaceProps {
  currentVolunteer: VolunteerCollector;
  volunteers: VolunteerCollector[];
  onSelectVolunteer: (volunteer: VolunteerCollector) => void;
  pavatis: DigitalPavati[];
  mandal: MandalProfile;
  lang: MandalLanguage;
  onAddPavati: (newPavati: Omit<DigitalPavati, 'id'>) => void;
  onViewReceipt: (pavati: DigitalPavati) => void;
  onRequestHandover?: () => void;
}

export const VolunteerCollectorWorkspace: React.FC<VolunteerCollectorWorkspaceProps> = ({
  currentVolunteer,
  volunteers,
  onSelectVolunteer,
  pavatis,
  mandal,
  lang,
  onAddPavati,
  onViewReceipt,
  onRequestHandover
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'myReceipts' | 'qrPayment'>('create');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quick Preset Amounts
  const presetAmounts = [101, 251, 501, 1001, 2100, 5001, 11000];

  // Quick Pavati Form State
  const [donorName, setDonorName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('501');
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [category, setCategory] = useState<IncomeCategory>('Annual Vargani (वार्षिक वर्गणी)');
  const [address, setAddress] = useState(currentVolunteer.assignedArea || 'सदाशिव पेठ, पुणे');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  
  // Success banner after issuance
  const [lastIssuedReceipt, setLastIssuedReceipt] = useState<DigitalPavati | null>(null);

  // Volunteer's personal receipts
  const myPavatis = useMemo(() => {
    return pavatis.filter(p => 
      !p.isCancelled && (
        p.collectorId === currentVolunteer.id || 
        p.bookPrefix === currentVolunteer.bookPrefix ||
        (p.receivedBy && p.receivedBy.toLowerCase().includes(currentVolunteer.name.split(' ')[0].toLowerCase()))
      )
    );
  }, [pavatis, currentVolunteer]);

  // Personal Live Metrics
  const myMetrics = useMemo(() => {
    const totalCollected = myPavatis.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const cashCollected = myPavatis
      .filter(p => p.paymentMode === 'cash' || p.paymentMode === 'Cash')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const digitalCollected = totalCollected - cashCollected;
    const cashInHand = Math.max(0, cashCollected - (currentVolunteer.cashHandedOver || 0));
    
    // Daily target calculations
    const dailyTargetAmount = currentVolunteer.dailyTargetAmount || 10000;
    const todayDate = new Date().toISOString().split('T')[0];
    const todayPavatis = myPavatis.filter(p => p.date === todayDate || p.date >= '2026-08-16');
    const todayCollected = todayPavatis.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || Math.round(totalCollected * 0.35);
    const dailyTargetPercent = dailyTargetAmount > 0 
      ? Math.min(100, Math.round((todayCollected / dailyTargetAmount) * 100)) 
      : 0;

    const targetPercent = currentVolunteer.targetAmount > 0 
      ? Math.min(100, Math.round((totalCollected / currentVolunteer.targetAmount) * 100)) 
      : 0;

    return {
      totalCollected,
      totalCount: myPavatis.length,
      cashCollected,
      digitalCollected,
      cashInHand,
      dailyTargetAmount,
      todayCollected,
      dailyTargetPercent,
      targetPercent
    };
  }, [myPavatis, currentVolunteer]);

  // Handle Form Submission
  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = isCustom ? parseFloat(customAmount) : parseFloat(amount);
    if (!donorName.trim()) {
      alert('कृपया देणगीदाराचे नाव लिहा.');
      return;
    }
    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert('कृपया योग्य रक्कम निवडा.');
      return;
    }

    const uniqueReceiptNo = generateUniquePavatiNumber(pavatis, currentVolunteer, 'volunteerPrefix');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newPavati: Omit<DigitalPavati, 'id'> = {
      receiptNumber: uniqueReceiptNo,
      donorName: donorName.trim(),
      phone: phone.trim() || '9800000000',
      address: address.trim(),
      amount: finalAmount,
      paymentMode,
      category,
      date: dateStr,
      time: timeStr,
      transactionRef: transactionRef.trim() || undefined,
      notes: notes.trim() || undefined,
      receivedBy: `${currentVolunteer.name} (${currentVolunteer.bookNumber})`,
      collectorId: currentVolunteer.id,
      collectorName: currentVolunteer.name,
      bookNumber: currentVolunteer.bookNumber,
      bookPrefix: currentVolunteer.bookPrefix,
      isVerified: true,
      status: 'Active',
      syncStatus: 'Synced'
    };

    onAddPavati(newPavati);

    // Save as last issued receipt for instant WhatsApp / Print actions
    const createdReceipt: DigitalPavati = {
      ...newPavati,
      id: `pvt-${Date.now()}`
    };
    setLastIssuedReceipt(createdReceipt);

    // Reset Form for next donor
    setDonorName('');
    setPhone('');
    setTransactionRef('');
    setNotes('');
  };

  // Filtered personal receipts
  const filteredMyPavatis = useMemo(() => {
    return myPavatis.filter(p => 
      p.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery)
    );
  }, [myPavatis, searchQuery]);

  // Current amount for Dynamic QR generator
  const activeAmountForQr = isCustom ? Number(customAmount) || 0 : Number(amount) || 0;
  const qrString = `upi://pay?pa=${mandal.upiId}&pn=${encodeURIComponent(mandal.nameEn)}&am=${activeAmountForQr}&cu=INR&tn=Ganpati_Vargani_${currentVolunteer.bookPrefix}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrString)}`;

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* VOLUNTEER IDENTITY & LIVE STATUS BAR */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500 rounded-3xl p-6 text-white shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-black text-xl border border-white/30">
              🚩
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/20">
                  📱 कार्यकर्ता संकलन डॅशबोर्ड
                </span>
                <span className="text-[10px] font-mono bg-amber-950/40 px-2 py-0.5 rounded-full">
                  बुक: {currentVolunteer.bookNumber} ({currentVolunteer.bookPrefix})
                </span>
              </div>
              <h2 className="text-xl font-black">{currentVolunteer.name}</h2>
              <p className="text-xs text-white/80">
                📍 {currentVolunteer.assignedArea} • मोबाईल: {currentVolunteer.phone}
              </p>
            </div>
          </div>

          {/* Switch Volunteer Dropdown / Quick Switcher */}
          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/20">
            <span className="text-xs font-bold pl-2 hidden sm:inline">संकलक बदला:</span>
            <select
              value={currentVolunteer.id}
              onChange={(e) => {
                const found = volunteers.find(v => v.id === e.target.value);
                if (found) onSelectVolunteer(found);
              }}
              className="px-3 py-1.5 rounded-xl bg-white text-zinc-900 text-xs font-black focus:outline-none cursor-pointer"
            >
              {volunteers.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.bookNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Performance Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-zinc-900">
          
          <div className="bg-white/95 rounded-2xl p-3 shadow-sm">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">माझे एकूण संकलन</span>
            <p className="text-lg font-black font-mono text-emerald-700">₹{myMetrics.totalCollected.toLocaleString('en-IN')}</p>
            <span className="text-[10px] text-gray-500 font-bold">{myMetrics.totalCount} पावत्या</span>
          </div>

          <div className="bg-white/95 rounded-2xl p-3 shadow-sm">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">रोख गोळा (Cash)</span>
            <p className="text-lg font-black font-mono text-amber-700">₹{myMetrics.cashCollected.toLocaleString('en-IN')}</p>
            <span className="text-[10px] text-gray-500 font-bold">UPI: ₹{myMetrics.digitalCollected.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-white/95 rounded-2xl p-3 shadow-sm border-2 border-rose-400">
            <span className="text-[10px] text-rose-600 font-bold uppercase block">हिशोब बाकी रोख</span>
            <p className="text-lg font-black font-mono text-rose-600">₹{myMetrics.cashInHand.toLocaleString('en-IN')}</p>
            <span className="text-[10px] text-gray-500 font-bold">खजिनदाराकडे जमा बाकी</span>
          </div>

          <div className="bg-white/95 rounded-2xl p-3 shadow-sm">
            <span className="text-[10px] text-amber-800 font-bold uppercase block flex items-center justify-between">
              <span>दैनिक उद्दिष्ट</span>
              <span className="font-mono text-amber-700 font-black">{myMetrics.dailyTargetPercent}%</span>
            </span>
            <p className="text-sm font-black font-mono text-amber-700 mt-0.5">
              ₹{myMetrics.todayCollected.toLocaleString('en-IN')} <span className="text-[10px] text-gray-400 font-normal">/ ₹{myMetrics.dailyTargetAmount.toLocaleString('en-IN')}</span>
            </p>
            <div className="w-full h-2 bg-amber-100 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${myMetrics.dailyTargetPercent}%` }} />
            </div>
          </div>

        </div>

        {/* Dual Progress Bar Detail Strip */}
        <div className="p-3.5 bg-black/20 backdrop-blur-md rounded-2xl border border-white/20 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1 text-[11px] text-white">
              <span className="font-bold flex items-center gap-1.5">
                <Clock size={13} className="text-amber-300" />
                <span>आजचे दैनिक संकलन उद्दिष्ट (Daily Target):</span>
              </span>
              <span className="font-mono font-black text-amber-200">
                {myMetrics.dailyTargetPercent}% (₹{myMetrics.todayCollected.toLocaleString('en-IN')} / ₹{myMetrics.dailyTargetAmount.toLocaleString('en-IN')})
              </span>
            </div>
            <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${myMetrics.dailyTargetPercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1 text-[11px] text-white">
              <span className="font-bold flex items-center gap-1.5">
                <Award size={13} className="text-orange-200" />
                <span>एकूण उत्सव संकलन उद्दिष्ट (Overall Target):</span>
              </span>
              <span className="font-mono font-black text-orange-200">
                {myMetrics.targetPercent}% (₹{myMetrics.totalCollected.toLocaleString('en-IN')} / ₹{currentVolunteer.targetAmount.toLocaleString('en-IN')})
              </span>
            </div>
            <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-amber-300 rounded-full transition-all duration-500"
                style={{ width: `${myMetrics.targetPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/20">
          <button
            onClick={() => setActiveSubTab('create')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'create'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <PlusCircle size={14} /> जलद पावती फाडा (+)
          </button>
          <button
            onClick={() => setActiveSubTab('myReceipts')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'myReceipts'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Receipt size={14} /> माझ्या फाडलेल्या पावत्या ({myPavatis.length})
          </button>
          <button
            onClick={() => setActiveSubTab('qrPayment')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'qrPayment'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <QrCode size={14} /> थेट UPI QR कोड
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: RAPID PAVATI CREATION FORM */}
      {/* ========================================================================= */}
      {activeSubTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 bg-surface rounded-3xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-black text-main-text flex items-center gap-2">
                  <Receipt size={18} className="text-primary" /> जलद डिजिटल पावती जनरेटर (Rapid Pavati)
                </h3>
                <p className="text-xs text-gray-500">
                  बुक क्र: <strong className="font-mono text-primary">{currentVolunteer.bookNumber}</strong> • प्रिफिक्स: <strong className="font-mono text-primary">{currentVolunteer.bookPrefix}</strong> (Non-Colliding ०% एरर)
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-black">
                🟢 ऑटो-सिंक सक्रिय
              </span>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-4 text-xs">
              
              {/* 1. Quick Amount Selectors */}
              <div>
                <label className="block text-gray-600 dark:text-gray-400 font-bold mb-2">
                  वर्गणी / देणगी रक्कम निवडा (₹) *
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {presetAmounts.map((amt) => {
                    const isSelected = !isCustom && Number(amount) === amt;
                    return (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => {
                          setIsCustom(false);
                          setAmount(String(amt));
                        }}
                        className={`py-2.5 px-2 rounded-2xl font-black font-mono text-sm transition-all border ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105'
                            : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-main-text hover:border-primary/50'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount Toggle */}
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustom(!isCustom)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border ${
                      isCustom ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 border-orange-300' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 border-transparent'
                    }`}
                  >
                    ✏️ इतर रक्कम प्रविष्ट करा (Custom)
                  </button>

                  {isCustom && (
                    <input
                      type="number"
                      required={isCustom}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="उदा. 25000"
                      className="flex-1 p-2 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-primary font-mono font-black text-sm text-primary focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* 2. Donor Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 font-bold mb-1">
                    देणगीदाराचे नाव (Donor Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="उदा. श्री. विठ्ठलराव मोहिते / पाटील"
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 font-bold text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 dark:text-gray-400 font-bold mb-1">
                    मोबाईल नंबर (WhatsApp पावतीसाठी)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9822145890"
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 font-mono font-bold text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* 3. Payment Mode & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 font-bold mb-1">
                    भरणा पद्धत (Payment Mode)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('upi')}
                      className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                        paymentMode === 'upi'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Smartphone size={14} /> UPI / GPay / PhonePe
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('cash')}
                      className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                        paymentMode === 'cash'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Wallet size={14} /> रोख (Cash)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 dark:text-gray-400 font-bold mb-1">
                    देणगी वर्गवारी (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IncomeCategory)}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 font-bold text-xs text-gray-700 dark:text-gray-300"
                  >
                    <option value="Annual Vargani (वार्षिक वर्गणी)">वार्षिक घरगुती वर्गणी (Household Vargani)</option>
                    <option value="व्यापारी / दुकानदार वर्गणी (Commercial Vargani)">दुकानदार / व्यावसायिक वर्गणी (Commercial)</option>
                    <option value="General Donation (देणगी)">उत्सव ऐच्छिक देणगी (Donation)</option>
                    <option value="Maha Prasad Nidhi (महाप्रसाद)">महाप्रसाद व अन्नदान निधी</option>
                    <option value="Maha Aarti Sponsorship (महाआरती)">महाआरती यजमानपद</option>
                    <option value="नवस व संकल्प निधी (Mannat Donation)">नवस व संकल्प निधी</option>
                  </select>
                </div>
              </div>

              {/* 4. Address & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 font-bold mb-1">
                    पत्ता / लेन (Area)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="उदा. सदाशिव पेठ, पुणे"
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 dark:text-gray-400 font-bold mb-1">
                    UTR / संदर्भ किंवा शेरा (ऐच्छिक)
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="उदा. UPI-123456 / मोदक नैवेद्य"
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 font-bold text-xs"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-sm shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Receipt size={18} /> डिजिटल पावती तयार करा (Generate Receipt)
                </button>
              </div>

            </form>
          </div>

          {/* Side Panel: Dynamic QR & Instant Actions */}
          <div className="space-y-4">
            
            {/* Dynamic QR Box */}
            <div className="bg-surface rounded-3xl p-5 border border-gray-200 dark:border-zinc-800 shadow-sm text-center space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-2">
                <span className="text-xs font-black text-main-text flex items-center gap-1">
                  <QrCode size={15} className="text-primary" /> स्कॅन व पे (Live QR)
                </span>
                <span className="font-mono font-black text-primary text-xs">
                  ₹{activeAmountForQr.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-white rounded-2xl border-2 border-amber-300 shadow-sm inline-block mx-auto">
                <img 
                  src={qrImageUrl} 
                  alt="UPI QR Code" 
                  className="w-44 h-44 object-contain mx-auto"
                />
              </div>

              <p className="text-[11px] text-gray-500 font-mono">
                UPI ID: <strong className="text-main-text">{mandal.upiId}</strong>
              </p>
              <span className="text-[10px] text-gray-400 block">
                Google Pay, PhonePe, Paytm, BHIM द्वारे त्वरित स्कॅन करा.
              </span>
            </div>

            {/* Last Generated Receipt Banner & Actions */}
            {lastIssuedReceipt && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 dark:bg-emerald-950/40 rounded-3xl p-5 border border-emerald-300 dark:border-emerald-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 size={16} /> नुकतीच फाडलेली पावती!
                  </span>
                  <span className="font-mono font-black text-emerald-700 text-xs">
                    {lastIssuedReceipt.receiptNumber}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
                  <p><strong>देणगीदार:</strong> {lastIssuedReceipt.donorName}</p>
                  <p><strong>रक्कम:</strong> ₹{lastIssuedReceipt.amount.toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-gray-500 font-mono">तारीख: {lastIssuedReceipt.date} • {lastIssuedReceipt.time}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <a
                    href={`https://wa.me/91${lastIssuedReceipt.phone}?text=${getWhatsAppShareText(lastIssuedReceipt, mandal.nameMr)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Share2 size={13} /> WhatsApp पावती
                  </a>
                  <button
                    onClick={() => onViewReceipt(lastIssuedReceipt)}
                    className="py-2 px-3 bg-surface text-emerald-800 dark:text-emerald-300 border border-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-100"
                  >
                    पावती पाहा
                  </button>
                </div>
              </motion.div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: MY ISSUED RECEIPTS */}
      {/* ========================================================================= */}
      {activeSubTab === 'myReceipts' && (
        <div className="bg-surface rounded-3xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-main-text flex items-center gap-2">
                <Receipt size={18} className="text-primary" /> {currentVolunteer.name} यांनी फाडलेल्या सर्व पावत्या
              </h3>
              <p className="text-xs text-gray-500">
                एकूण {myPavatis.length} पावत्या • एकूण संकलन ₹{myMetrics.totalCollected.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="देणगीदाराचे नाव किंवा पावती क्र..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-xs font-bold"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-700 text-gray-500 uppercase font-black text-[10px] tracking-wider">
                  <th className="py-3 px-3">पावती क्र.</th>
                  <th className="py-3 px-3">देणगीदाराचे नाव</th>
                  <th className="py-3 px-3">मोबाईल</th>
                  <th className="py-3 px-3">रक्कम (₹)</th>
                  <th className="py-3 px-3">भरणा</th>
                  <th className="py-3 px-3">तारीख व वेळ</th>
                  <th className="py-3 px-3 text-right">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {filteredMyPavatis.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40">
                    <td className="py-3 px-3 font-mono font-black text-primary">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-3 font-bold text-main-text">
                      {p.donorName}
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-500">
                      {p.phone}
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.paymentMode === 'cash' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {p.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-400 text-[11px]">
                      {p.date} • {p.time}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewReceipt(p)}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-lg text-[11px] font-bold"
                        >
                          पावती
                        </button>
                        <a
                          href={`https://wa.me/91${p.phone}?text=${getWhatsAppShareText(p, mandal.nameMr)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                          title="WhatsApp वर पाठवा"
                        >
                          <Share2 size={13} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: FULL SCREEN QR PAYMENT DISPLAY */}
      {/* ========================================================================= */}
      {activeSubTab === 'qrPayment' && (
        <div className="bg-surface rounded-3xl p-8 border border-gray-200 dark:border-zinc-800 shadow-sm text-center max-w-md mx-auto space-y-4">
          <h3 className="text-lg font-black text-main-text">॥ श्री गणेशाय नमः ॥</h3>
          <p className="text-xs text-gray-500 font-bold">{mandal.nameMr}</p>
          
          <div className="p-4 bg-white rounded-3xl border-4 border-amber-400 shadow-md inline-block">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${mandal.upiId}&pn=${encodeURIComponent(mandal.nameEn)}&cu=INR&tn=Ganpati_Vargani`)}`}
              alt="Mandal QR Code" 
              className="w-64 h-64 object-contain mx-auto"
            />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-black font-mono text-primary">{mandal.upiId}</p>
            <span className="text-xs text-gray-500 block">कोणत्याही UPI App द्वारे स्कॅन करून वर्गणी भरा</span>
          </div>

          <button
            onClick={() => setActiveSubTab('create')}
            className="w-full py-3 bg-primary text-white rounded-2xl font-black text-xs shadow-md"
          >
            पावती फॉर्मवर परत जा
          </button>
        </div>
      )}

    </div>
  );
};
