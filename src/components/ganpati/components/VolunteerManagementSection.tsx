import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Smartphone, 
  ShieldCheck, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Share2, 
  Phone, 
  Edit3, 
  Trash2, 
  Check, 
  AlertTriangle, 
  Plus, 
  FileSpreadsheet, 
  Printer, 
  Sparkles,
  Lock,
  Wifi,
  WifiOff,
  Layers,
  Award,
  Radio,
  BookOpen
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  VolunteerCollector, 
  CashHandoverRecord, 
  DigitalPavati, 
  MandalProfile, 
  MandalLanguage 
} from '../types';
import { convertNumberToMarathiWords } from '../utils/receiptGenerator';

interface VolunteerManagementSectionProps {
  volunteers: VolunteerCollector[];
  handovers: CashHandoverRecord[];
  pavatis: DigitalPavati[];
  mandal: MandalProfile;
  lang: MandalLanguage;
  onAddVolunteer: (volunteer: Omit<VolunteerCollector, 'id'>) => void;
  onUpdateVolunteer: (volunteer: VolunteerCollector) => void;
  onDeleteVolunteer: (volunteerId: string) => void;
  onRecordHandover: (handover: Omit<CashHandoverRecord, 'id'>) => void;
  userRole: string;
  isCloudSyncActive?: boolean;
  activeDevicesCount?: number;
}

export const VolunteerManagementSection: React.FC<VolunteerManagementSectionProps> = ({
  volunteers,
  handovers,
  pavatis,
  mandal,
  lang,
  onAddVolunteer,
  onUpdateVolunteer,
  onDeleteVolunteer,
  onRecordHandover,
  userRole,
  isCloudSyncActive = true,
  activeDevicesCount = 4
}) => {
  const [activeTab, setActiveTab] = useState<'tracking' | 'volunteers' | 'handovers' | 'multidevice'>('tracking');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<VolunteerCollector | null>(null);
  const [handoverVolunteer, setHandoverVolunteer] = useState<VolunteerCollector | null>(null);
  const [handoverAmount, setHandoverAmount] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [viewingHandover, setViewingHandover] = useState<CashHandoverRecord | null>(null);

  // New Volunteer Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'volunteer' as VolunteerCollector['role'],
    pin: '1234',
    bookNumber: `BK-0${volunteers.length + 1}`,
    bookPrefix: `V0${volunteers.length + 1}`,
    assignedRangeStart: 1,
    assignedRangeEnd: 500,
    currentReceiptIndex: 0,
    assignedArea: 'सदाशिव पेठ परिसर',
    targetAmount: 50000,
    dailyTargetAmount: 10000,
    status: 'Active' as VolunteerCollector['status'],
    notes: ''
  });

  // Calculate Real-Time Dynamic Metrics for all Volunteers based on actual pavatis
  const volunteerStats = useMemo(() => {
    return volunteers.map(v => {
      // Find all active receipts issued by this volunteer or matching book prefix/name
      const volunteerPavatis = pavatis.filter(p => 
        !p.isCancelled && (
          p.collectorId === v.id || 
          p.bookPrefix === v.bookPrefix || 
          (p.receivedBy && p.receivedBy.toLowerCase().includes(v.name.split(' ')[0].toLowerCase()))
        )
      );

      const totalCollected = volunteerPavatis.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const cashCollected = volunteerPavatis
        .filter(p => p.paymentMode === 'cash' || p.paymentMode === 'Cash')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const digitalCollected = totalCollected - cashCollected;

      // Find total cash handed over to treasurer
      const handedOver = handovers
        .filter(h => h.volunteerId === v.id && h.status === 'Received')
        .reduce((sum, h) => sum + (Number(h.amount) || 0), 0);

      const cashInHand = Math.max(0, cashCollected - handedOver);
      const targetPercent = v.targetAmount > 0 ? Math.min(100, Math.round((totalCollected / v.targetAmount) * 100)) : 0;

      // Daily collection calculation (today or latest collection day)
      const dailyTarget = v.dailyTargetAmount || 10000;
      // Get today's or recent collections (simulated across active festival day)
      const todayDate = '2026-08-17';
      const todayPavatis = volunteerPavatis.filter(p => p.date === todayDate || p.date >= '2026-08-16');
      const todayCollected = todayPavatis.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || Math.round(totalCollected * 0.35);
      const dailyTargetPercent = dailyTarget > 0 ? Math.min(100, Math.round((todayCollected / dailyTarget) * 100)) : 0;

      return {
        ...v,
        dailyTargetAmount: dailyTarget,
        todayCollected,
        dailyTargetPercent,
        totalCollected: totalCollected > 0 ? totalCollected : v.totalCollected,
        totalReceiptsCount: volunteerPavatis.length > 0 ? volunteerPavatis.length : v.totalReceiptsCount,
        cashCollected: cashCollected > 0 ? cashCollected : v.cashCollected,
        digitalCollected: digitalCollected > 0 ? digitalCollected : v.digitalCollected,
        cashHandedOver: handedOver > 0 ? handedOver : v.cashHandedOver,
        cashInHand: cashCollected > 0 ? cashInHand : v.cashInHand,
        targetPercent
      };
    });
  }, [volunteers, pavatis, handovers]);

  // Global Aggregates
  const totals = useMemo(() => {
    const totalCollected = volunteerStats.reduce((sum, v) => sum + v.totalCollected, 0);
    const totalCash = volunteerStats.reduce((sum, v) => sum + v.cashCollected, 0);
    const totalDigital = volunteerStats.reduce((sum, v) => sum + v.digitalCollected, 0);
    const totalHandedOver = volunteerStats.reduce((sum, v) => sum + v.cashHandedOver, 0);
    const totalCashInHand = volunteerStats.reduce((sum, v) => sum + v.cashInHand, 0);
    const activeCount = volunteerStats.filter(v => v.status === 'Active' || v.status === 'OnField').length;

    return {
      totalCollected,
      totalCash,
      totalDigital,
      totalHandedOver,
      totalCashInHand,
      activeCount,
      totalVolunteers: volunteerStats.length
    };
  }, [volunteerStats]);

  // Filtered Volunteers
  const filteredVolunteers = useMemo(() => {
    return volunteerStats.filter(v => {
      const matchesSearch = 
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.phone.includes(searchQuery) ||
        v.bookNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.bookPrefix.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.assignedArea.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [volunteerStats, searchQuery, statusFilter]);

  // Handle Add Volunteer Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('कृपया नाव आणि मोबाईल नंबर भरा.');
      return;
    }

    onAddVolunteer({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      role: formData.role,
      pin: formData.pin.trim() || '1234',
      bookNumber: formData.bookNumber.trim(),
      bookPrefix: formData.bookPrefix.trim().toUpperCase(),
      assignedRangeStart: Number(formData.assignedRangeStart) || 1,
      assignedRangeEnd: Number(formData.assignedRangeEnd) || 500,
      currentReceiptIndex: 0,
      assignedArea: formData.assignedArea.trim(),
      targetAmount: Number(formData.targetAmount) || 50000,
      dailyTargetAmount: Number(formData.dailyTargetAmount) || 10000,
      status: formData.status,
      totalCollected: 0,
      totalReceiptsCount: 0,
      cashCollected: 0,
      digitalCollected: 0,
      cashHandedOver: 0,
      cashInHand: 0,
      deviceId: `DEV-${formData.bookPrefix}-${Date.now().toString().slice(-4)}`,
      lastActiveAt: new Date().toISOString(),
      notes: formData.notes.trim()
    });

    setIsAddModalOpen(false);
    setFormData({
      name: '',
      phone: '',
      role: 'volunteer',
      pin: '1234',
      bookNumber: `BK-0${volunteers.length + 2}`,
      bookPrefix: `V0${volunteers.length + 2}`,
      assignedRangeStart: 1,
      assignedRangeEnd: 500,
      currentReceiptIndex: 0,
      assignedArea: 'सदाशिव पेठ परिसर',
      targetAmount: 50000,
      dailyTargetAmount: 10000,
      status: 'Active',
      notes: ''
    });
  };

  // Handle Cash Handover Submit
  const handleHandoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverVolunteer) return;
    const amountNum = parseFloat(handoverAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('कृपया योग्य रक्कम प्रविष्ट करा.');
      return;
    }

    const now = new Date();
    const handoverNum = `HND-2026-${String(handovers.length + 1).padStart(3, '0')}`;

    onRecordHandover({
      handoverNumber: handoverNum,
      volunteerId: handoverVolunteer.id,
      volunteerName: handoverVolunteer.name,
      amount: amountNum,
      treasurerName: mandal.treasurerName || 'महेश चंद्रकांत गायकवाड (खजिनदार)',
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      receiptCount: handoverVolunteer.totalReceiptsCount,
      status: 'Received',
      notes: handoverNotes.trim() || 'नियमित रोख जमा'
    });

    setHandoverVolunteer(null);
    setHandoverAmount('');
    setHandoverNotes('');
  };

  // Export Excel of Volunteer Performance
  const exportToExcel = () => {
    const data = volunteerStats.map((v, idx) => ({
      'अ.क्र.': idx + 1,
      'कार्यकर्त्याचे नाव': v.name,
      'मोबाईल': v.phone,
      'पावती बुक क्र.': v.bookNumber,
      'प्रिफिक्स (Prefix)': v.bookPrefix,
      'नेमून दिलेला परिसर': v.assignedArea,
      'एकूण पावत्या': v.totalReceiptsCount,
      'रोख संकलन (₹)': v.cashCollected,
      'ऑनलाइन संकलन (₹)': v.digitalCollected,
      'एकूण संकलन (₹)': v.totalCollected,
      'टार्गेट (₹)': v.targetAmount,
      'प्रगती (%)': `${v.targetPercent}%`,
      'खजिनदाराकडे जमा (₹)': v.cashHandedOver,
      'हिशोब बाकी / रोख शिल्लक (₹)': v.cashInHand,
      'स्थिती': v.status
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Volunteers_Tracking');
    XLSX.writeFile(wb, `Ganpati_Volunteers_Tracking_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Metrics Banner */}
      <div className="bg-surface rounded-3xl p-6 border border-gray-200/80 dark:border-zinc-800 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-orange-600 to-amber-500 text-white rounded-2xl shadow-md">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-main-text flex items-center gap-2">
                <span>कार्यकर्ते व व्हॉलंटियर व्यवस्थापन व रिअल-टाईम ट्रॅकिंग</span>
                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-black flex items-center gap-1">
                  <Radio size={10} className="animate-pulse text-emerald-500" /> LIVE
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                प्रत्येक संकलकाचे थेट संकलन, रोख हिशोब बाकी, पावती बुक वाटप आणि मल्टि-डिव्हाइस अँटी-कोलिजन सिंक.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-primary text-white rounded-2xl text-xs font-bold hover:opacity-90 shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all"
            >
              <UserPlus size={15} /> नवीन कार्यकर्ता नोंदणी
            </button>
            <button
              onClick={exportToExcel}
              className="px-3.5 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" /> Excel रिपोर्ट
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          
          {/* Total Collected by Volunteers */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-200 dark:border-orange-900/40">
            <div className="flex items-center justify-between text-orange-700 dark:text-orange-400 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                <ArrowUpRight size={14} /> एकूण व्हॉलंटियर संकलन
              </span>
              <span className="text-[10px] font-bold">{totals.totalVolunteers} संकलक</span>
            </div>
            <p className="text-2xl font-black text-main-text font-mono">
              ₹{totals.totalCollected.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
              <span>रोख: ₹{totals.totalCash.toLocaleString('en-IN')}</span>
              <span>UPI: ₹{totals.totalDigital.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Cash In Hand (With Volunteers) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-200 dark:border-rose-900/40">
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                <Wallet size={14} /> कार्यकर्त्यांकडे रोख शिल्लक
              </span>
              <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-full text-[9px] font-bold">हिशोब बाकी</span>
            </div>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              ₹{totals.totalCashInHand.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-gray-500 block mt-1">खजिनदाराकडे जमा होणे बाकी रोख</span>
          </div>

          {/* Cash Deposited With Treasurer */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 dark:border-emerald-900/40">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={14} /> खजिनदाराकडे जमा रोख
              </span>
              <span className="text-[10px] font-bold">{handovers.length} जमा नोंदी</span>
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{totals.totalHandedOver.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-gray-500 block mt-1">पावतीसह अधिकृत जमा झालेली रक्कम</span>
          </div>

          {/* Multi-Device Live Status */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-200 dark:border-blue-900/40">
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                <Smartphone size={14} /> मल्टि-डिव्हाइस सिंक
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> सक्रिय
              </span>
            </div>
            <p className="text-lg font-black text-main-text">
              {activeDevicesCount} उपकरणे जोडलेली
            </p>
            <span className="text-[10px] text-gray-500 block mt-1 truncate">
              0 कोलिजन • युनिक बुक प्रिफिक्स सिंक
            </span>
          </div>

        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 border-t border-gray-100 dark:border-zinc-800 pt-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tracking'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Award size={15} /> रिअल-टाईम संकलन ट्रॅकर व लीडरबोर्ड
          </button>
          <button
            onClick={() => setActiveTab('volunteers')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'volunteers'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Users size={15} /> सर्व कार्यकर्ते व पावती बुक वाटप
          </button>
          <button
            onClick={() => setActiveTab('handovers')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'handovers'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Wallet size={15} /> खजिनदार रोख जमा नोंदवही ({handovers.length})
          </button>
          <button
            onClick={() => setActiveTab('multidevice')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'multidevice'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Layers size={15} /> मल्टि-डिव्हाइस अँटी-कोलिजन आर्किटेक्चर
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REAL-TIME TRACKING & LEADERBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'tracking' && (
        <div className="space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-gray-200 dark:border-zinc-800">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="कार्यकर्त्याचे नाव, बुक क्र, परिसर किंवा फोनने शोधा..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs font-bold focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs font-bold text-gray-700 dark:text-gray-300"
              >
                <option value="all">सर्व स्थिती (All Status)</option>
                <option value="OnField">प्रत्यक्ष फिरतीवर (On Field)</option>
                <option value="Active">सक्रिय (Active)</option>
                <option value="Break">विश्रांती (On Break)</option>
              </select>
            </div>
          </div>

          {/* Volunteer Leaderboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVolunteers.map((v, idx) => (
              <div 
                key={v.id}
                className="bg-surface rounded-3xl p-5 border border-gray-200 dark:border-zinc-800 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Rank, Name, Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                        idx === 0 ? 'bg-amber-400 text-amber-950 shadow-sm' :
                        idx === 1 ? 'bg-slate-300 text-slate-900' :
                        idx === 2 ? 'bg-amber-700 text-white' :
                        'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-main-text leading-tight">{v.name}</h4>
                        <span className="text-[11px] text-gray-500 font-mono font-bold flex items-center gap-1">
                          <BookOpen size={11} className="text-primary" /> {v.bookNumber} ({v.bookPrefix}) • PIN: {v.pin}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      v.status === 'OnField' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' :
                      v.status === 'Active' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' :
                      'bg-gray-100 dark:bg-zinc-800 text-gray-500'
                    }`}>
                      {v.status === 'OnField' ? '🟢 फिरतीवर' : v.status === 'Active' ? '🔵 सक्रिय' : '⚪ ब्रेक'}
                    </span>
                  </div>

                  {/* Area Tag */}
                  <p className="text-[11px] text-gray-500 bg-gray-50 dark:bg-zinc-800/60 p-2 rounded-xl border border-gray-100 dark:border-zinc-800 mb-3 truncate">
                    📍 {v.assignedArea}
                  </p>

                  {/* Daily Target Progress Bar */}
                  <div className="space-y-1 mb-2.5 p-2.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/30">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1">
                        <Clock size={11} className="text-amber-600" /> दैनिक उद्दिष्ट (Daily Target):
                      </span>
                      <span className="font-black text-amber-700 dark:text-amber-400 font-mono">
                        {v.dailyTargetPercent}% (₹{v.todayCollected.toLocaleString('en-IN')} / ₹{(v.dailyTargetAmount || 10000).toLocaleString('en-IN')})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-amber-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${v.dailyTargetPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Total Festival Target Progress Bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 font-bold">एकूण उत्सव उद्दिष्ट:</span>
                      <span className="font-black text-primary font-mono">{v.targetPercent}% (₹{v.totalCollected.toLocaleString('en-IN')} / ₹{v.targetAmount.toLocaleString('en-IN')})</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${v.targetPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Financial Mini Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="p-2.5 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-100 dark:border-zinc-800">
                      <span className="text-[10px] text-gray-500 block">एकूण पावत्या:</span>
                      <span className="font-mono font-black text-main-text">{v.totalReceiptsCount} पावत्या</span>
                    </div>
                    <div className="p-2.5 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-100 dark:border-zinc-800">
                      <span className="text-[10px] text-gray-500 block">UPI / ऑनलाइन:</span>
                      <span className="font-mono font-black text-blue-600 dark:text-blue-400">₹{v.digitalCollected.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-2.5 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-100 dark:border-zinc-800">
                      <span className="text-[10px] text-gray-500 block">एकूण रोख गोळा:</span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">₹{v.cashCollected.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60">
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-bold">हिशोब बाकी (रोख):</span>
                      <span className="font-mono font-black text-rose-600 dark:text-rose-400">₹{v.cashInHand.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <button
                    onClick={() => {
                      setHandoverVolunteer(v);
                      setHandoverAmount(v.cashInHand > 0 ? String(v.cashInHand) : '');
                    }}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Wallet size={13} /> रोख जमा घ्या
                  </button>

                  <a
                    href={`https://wa.me/91${v.phone}?text=${encodeURIComponent(`🚩 श्री शिवतेज गणेशोत्सव मंडळ, पुणे\nसस्नेह नमस्कार ${v.name},\nतुमचे आतापर्यंतचे वर्गणी संकलन ₹${v.totalCollected.toLocaleString('en-IN')} (पावत्या: ${v.totalReceiptsCount}) झाले आहे. हिशोब बाकी रोख ₹${v.cashInHand.toLocaleString('en-IN')} आहे.\nधन्यवाद!`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-100 transition-all border border-green-200 dark:border-green-800"
                    title="WhatsApp वर मेसेज पाठवा"
                  >
                    <Share2 size={15} />
                  </a>

                  <a
                    href={`tel:${v.phone}`}
                    className="p-2 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-all"
                    title="कॉल करा"
                  >
                    <Phone size={15} />
                  </a>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VOLUNTEERS MASTER TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'volunteers' && (
        <div className="bg-surface rounded-3xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-main-text flex items-center gap-2">
              <Users size={17} className="text-primary" /> अधिकृत पावती संकलक यादी व डिजिटल बुक वाटप
            </h3>
            <span className="text-xs text-gray-500 font-bold">एकूण {volunteers.length} कार्यकर्ते नोंदणीकृत</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-700 text-gray-500 uppercase font-black text-[10px] tracking-wider">
                  <th className="py-3 px-3">नाव व संपर्क</th>
                  <th className="py-3 px-3">पावती बुक क्र.</th>
                  <th className="py-3 px-3">प्रिफिक्स (Prefix)</th>
                  <th className="py-3 px-3">लॉगिन PIN</th>
                  <th className="py-3 px-3">नेमून दिलेला परिसर</th>
                  <th className="py-3 px-3">दैनिक उद्दिष्ट</th>
                  <th className="py-3 px-3">एकूण टार्गेट</th>
                  <th className="py-3 px-3">एकूण संकलन</th>
                  <th className="py-3 px-3">हिशोब बाकी</th>
                  <th className="py-3 px-3">स्थिती</th>
                  <th className="py-3 px-3 text-right">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {volunteerStats.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-main-text">{v.name}</p>
                      <span className="text-[11px] text-gray-500 font-mono">{v.phone}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-primary">
                      {v.bookNumber}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 rounded font-mono font-black text-[11px]">
                        {v.bookPrefix}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-gray-600 dark:text-gray-400">
                      •••• ({v.pin})
                    </td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-400 truncate max-w-[180px]">
                      {v.assignedArea}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-700 dark:text-amber-400">
                      ₹{(v.dailyTargetAmount || 10000).toLocaleString('en-IN')}/दिवस
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-gray-700 dark:text-gray-300">
                      ₹{v.targetAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                      ₹{v.totalCollected.toLocaleString('en-IN')} ({v.totalReceiptsCount})
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-rose-600 dark:text-rose-400">
                      ₹{v.cashInHand.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.status === 'OnField' ? 'bg-emerald-100 text-emerald-700' :
                        v.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingVolunteer(v);
                          }}
                          className="p-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200"
                          title="माहिती बदला"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`खात्री करा: '${v.name}' यांचे रेकॉर्ड काढून टाकायचे का?`)) {
                              onDeleteVolunteer(v.id);
                            }
                          }}
                          className="p-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-lg hover:bg-rose-100"
                          title="हटवा"
                        >
                          <Trash2 size={13} />
                        </button>
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
      {/* TAB 3: CASH HANDOVER LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'handovers' && (
        <div className="bg-surface rounded-3xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-main-text flex items-center gap-2">
              <Wallet size={17} className="text-emerald-600" /> खजिनदाराकडे अधिकृत रोख जमा नोंदवही (Cash Handover Ledger)
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-600">
              एकूण जमा: ₹{totals.totalHandedOver.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-700 text-gray-500 uppercase font-black text-[10px] tracking-wider">
                  <th className="py-3 px-3">जमा पावती क्र.</th>
                  <th className="py-3 px-3">कार्यकर्त्याचे नाव</th>
                  <th className="py-3 px-3">जमा रोख रक्कम (₹)</th>
                  <th className="py-3 px-3">स्वीकारणारा अधिकारी</th>
                  <th className="py-3 px-3">तारीख व वेळ</th>
                  <th className="py-3 px-3">नोंद / शेरा</th>
                  <th className="py-3 px-3">स्थिती</th>
                  <th className="py-3 px-3 text-right">स्लिप</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {handovers.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-black text-primary">
                      {h.handoverNumber}
                    </td>
                    <td className="py-3 px-3 font-bold text-main-text">
                      {h.volunteerName}
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      ₹{h.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                      {h.treasurerName}
                    </td>
                    <td className="py-3 px-3 text-gray-500 font-mono">
                      {h.date} • {h.time}
                    </td>
                    <td className="py-3 px-3 text-gray-500 truncate max-w-[200px]">
                      {h.notes || '-'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-bold">
                        अधिकृत जमा (Verified)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setViewingHandover(h)}
                        className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-lg text-[11px] font-bold"
                      >
                        पावती पाहा
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MULTI-DEVICE SYNC ARCHITECTURE EXPLAINER & STATUS */}
      {/* ========================================================================= */}
      {activeTab === 'multidevice' && (
        <div className="bg-surface rounded-3xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-main-text flex items-center gap-2">
                <Layers size={18} className="text-primary" /> मल्टि-डिव्हाइस रिअल-टाईम सिंक व ०% डुप्लिकेट पावती सुरक्षा
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                एकच वेळी ५० कार्यकर्ते वेगवेगळ्या मोबाईलवर पावत्या फाडत असताना नंबर कधीही डुप्लिकेट होत नाही.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-black flex items-center gap-1.5">
              <Wifi size={13} /> क्लाउड व लोकल सिंक सक्रिय
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 space-y-2">
              <span className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600 font-black flex items-center justify-center text-xs">
                १
              </span>
              <h4 className="text-xs font-black text-main-text">युनिक व्हॉलंटियर प्रिफिक्स (Book Prefixes)</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                प्रत्येक कार्यकर्त्याला स्वतःचे स्वतंत्र डिजिटल बुक व प्रिफिक्स वाटप केले जाते (उदा. <code>GMP-2026/V01-0001</code>, <code>GMP-2026/V02-0001</code>). यामुळे एकाच क्षणी पावती फाडल्यास एकाचा नंबर दुसऱ्याला धडकत नाही.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 space-y-2">
              <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 font-black flex items-center justify-center text-xs">
                २
              </span>
              <h4 className="text-xs font-black text-main-text">अँटी-कोलिजन नंबर जनरेटर (Pre-Validation)</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                पावती डेटाबेसमध्ये सेव्ह होण्यापूर्वी सिस्टीम विद्यमान सर्व पावत्या स्कॅन करून नंबर पूर्णपणे अद्वितीय (Unique) असल्याचे तपासूनच अंतिम पावती लॉक करते.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 space-y-2">
              <span className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 font-black flex items-center justify-center text-xs">
                ३
              </span>
              <h4 className="text-xs font-black text-main-text">ऑफलाइन सेफ्टी व ऑटोमॅटिक बॅकअप</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                मंडप परिसरात नेटवर्क नसले तरी पावती सुरक्षित स्थानिक मेमरीमध्ये तयार होते आणि इंटरनेट जोडणी येताच मुख्य सर्व्हरवर सिंक होते.
              </p>
            </div>
          </div>

          {/* Active Device Map Table */}
          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
            <h4 className="text-xs font-black text-main-text mb-3">सध्या कार्यरत असलेली उपकरणे व डिजिटल बुक्स (Active Registered Devices)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {volunteers.map(v => (
                <div key={v.id} className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-main-text">{v.name}</span>
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary font-mono font-bold text-[10px] rounded">
                      {v.bookPrefix}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono">डिव्हाइस: {v.deviceId}</p>
                  <p className="text-[10px] text-gray-400 mt-1">शेवटची हालचाल: {new Date(v.lastActiveAt).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW VOLUNTEER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-3xl p-6 max-w-lg w-full border border-gray-200 dark:border-zinc-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                <h3 className="text-base font-black text-main-text flex items-center gap-2">
                  <UserPlus size={18} className="text-primary" /> नवीन संकलक / कार्यकर्ता नोंदणी
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-500 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-gray-500 font-bold mb-1">कार्यकर्त्याचे पूर्ण नाव *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="उदा. अमोल सुरेश शिंदे"
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 font-bold focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-500 font-bold mb-1">मोबाईल नंबर *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="9822345678"
                      className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 font-bold mb-1">लॉगिन PIN (४ अंक)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                      placeholder="1234"
                      className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 font-mono font-bold text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-500 font-bold mb-1">पावती बुक क्र.</label>
                    <input
                      type="text"
                      value={formData.bookNumber}
                      onChange={(e) => setFormData({ ...formData, bookNumber: e.target.value })}
                      placeholder="BK-05"
                      className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 font-bold mb-1">प्रिफिक्स (Prefix)</label>
                    <input
                      type="text"
                      value={formData.bookPrefix}
                      onChange={(e) => setFormData({ ...formData, bookPrefix: e.target.value.toUpperCase() })}
                      placeholder="V05"
                      className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 font-bold font-mono text-center uppercase text-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-500 font-bold mb-1">नेमून दिलेला परिसर / लेन</label>
                    <input
                      type="text"
                      value={formData.assignedArea}
                      onChange={(e) => setFormData({ ...formData, assignedArea: e.target.value })}
                      placeholder="सदाशिव पेठ गल्ली १ ते ४"
                      className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 font-bold mb-1">एकूण उत्सव टार्गेट (₹)</label>
                    <input
                      type="number"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData({ ...formData, targetAmount: Number(e.target.value) })}
                      placeholder="50000"
                      className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 font-bold font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-amber-700 dark:text-amber-400 font-bold mb-1 flex items-center gap-1">
                      <Clock size={12} /> दैनिक संकलन उद्दिष्ट (Daily Target ₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.dailyTargetAmount}
                      onChange={(e) => setFormData({ ...formData, dailyTargetAmount: Number(e.target.value) })}
                      placeholder="10000"
                      className="w-full p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 font-bold font-mono text-amber-900 dark:text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 font-bold mb-1">स्थिती (Status)</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as VolunteerCollector['status'] })}
                      className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 font-bold"
                    >
                      <option value="Active">सक्रिय (Active)</option>
                      <option value="OnField">फिरतीवर (OnField)</option>
                      <option value="Inactive">निष्क्रिय (Inactive)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-600 rounded-xl font-bold"
                  >
                    रद्द करा
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-white rounded-xl font-bold shadow-md shadow-primary/20"
                  >
                    नोंदणी पूर्ण करा
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 1B: EDIT VOLUNTEER & DAILY TARGET */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {editingVolunteer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-3xl p-6 max-w-lg w-full border border-gray-200 dark:border-zinc-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                <h3 className="text-base font-black text-main-text flex items-center gap-2">
                  <Edit3 size={18} className="text-amber-500" /> कार्यकर्ता माहिती व संकलन उद्दिष्ट बदला
                </h3>
                <button
                  onClick={() => setEditingVolunteer(null)}
                  className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-500 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingVolunteer) {
                    onUpdateVolunteer(editingVolunteer);
                    setEditingVolunteer(null);
                  }
                }} 
                className="space-y-3.5 text-xs"
              >
                <div>
                  <label className="block text-gray-500 font-bold mb-1">कार्यकर्त्याचे नाव *</label>
                  <input
                    type="text"
                    required
                    value={editingVolunteer.name}
                    onChange={(e) => setEditingVolunteer({ ...editingVolunteer, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 font-bold focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-500 font-bold mb-1">मोबाईल नंबर *</label>
                    <input
                      type="tel"
                      required
                      value={editingVolunteer.phone}
                      onChange={(e) => setEditingVolunteer({ ...editingVolunteer, phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 font-bold mb-1">लॉगिन PIN (४ अंक)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={editingVolunteer.pin}
                      onChange={(e) => setEditingVolunteer({ ...editingVolunteer, pin: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 font-mono font-bold text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-500 font-bold mb-1">नेमून दिलेला परिसर / लेन</label>
                    <input
                      type="text"
                      value={editingVolunteer.assignedArea}
                      onChange={(e) => setEditingVolunteer({ ...editingVolunteer, assignedArea: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 font-bold mb-1">स्थिती</label>
                    <select
                      value={editingVolunteer.status}
                      onChange={(e) => setEditingVolunteer({ ...editingVolunteer, status: e.target.value as VolunteerCollector['status'] })}
                      className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 font-bold"
                    >
                      <option value="Active">सक्रिय (Active)</option>
                      <option value="OnField">फिरतीवर (OnField)</option>
                      <option value="Inactive">निष्क्रिय (Inactive)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/40">
                  <div>
                    <label className="block text-amber-800 dark:text-amber-300 font-bold mb-1 flex items-center gap-1">
                      <Clock size={12} /> दैनिक उद्दिष्ट (Daily Target ₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={editingVolunteer.dailyTargetAmount || 10000}
                      onChange={(e) => setEditingVolunteer({ ...editingVolunteer, dailyTargetAmount: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 font-mono font-black text-amber-900 dark:text-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                      एकूण उत्सव टार्गेट (₹)
                    </label>
                    <input
                      type="number"
                      value={editingVolunteer.targetAmount}
                      onChange={(e) => setEditingVolunteer({ ...editingVolunteer, targetAmount: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditingVolunteer(null)}
                    className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-600 rounded-xl font-bold"
                  >
                    रद्द करा
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md shadow-amber-950/30"
                  >
                    बदल सेव्ह करा
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: CASH HANDOVER TO TREASURER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {handoverVolunteer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-3xl p-6 max-w-md w-full border border-gray-200 dark:border-zinc-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                <h3 className="text-base font-black text-main-text flex items-center gap-2">
                  <Wallet size={18} className="text-emerald-600" /> खजिनदाराकडे रोख जमा नोंद (Cash Deposit)
                </h3>
                <button
                  onClick={() => setHandoverVolunteer(null)}
                  className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-500 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleHandoverSubmit} className="space-y-3.5 text-xs">
                <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700">
                  <p className="text-[11px] text-gray-500">संकलक / कार्यकर्ता:</p>
                  <p className="text-sm font-black text-main-text">{handoverVolunteer.name} ({handoverVolunteer.bookNumber})</p>
                  <p className="text-[11px] text-rose-600 font-bold mt-1">
                    सध्या हिशोब बाकी रोख: ₹{handoverVolunteer.cashInHand.toLocaleString('en-IN')}
                  </p>
                </div>

                <div>
                  <label className="block text-gray-500 font-bold mb-1">जमा करावयाची रोख रक्कम (₹) *</label>
                  <input
                    type="number"
                    required
                    value={handoverAmount}
                    onChange={(e) => setHandoverAmount(e.target.value)}
                    placeholder="उदा. 12000"
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 font-mono font-black text-base text-emerald-600 focus:outline-none focus:border-emerald-500"
                  />
                  {handoverAmount && !isNaN(Number(handoverAmount)) && (
                    <span className="text-[11px] text-emerald-600 font-bold block mt-1">
                      अक्षरी: {convertNumberToMarathiWords(Number(handoverAmount))}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-gray-500 font-bold mb-1">स्वीकारणारा खजिनदार / अधिकारी</label>
                  <input
                    type="text"
                    readOnly
                    value={mandal.treasurerName || 'महेश चंद्रकांत गायकवाड (खजिनदार)'}
                    className="w-full p-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 font-bold text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-bold mb-1">नोंद / शेरा</label>
                  <input
                    type="text"
                    value={handoverNotes}
                    onChange={(e) => setHandoverNotes(e.target.value)}
                    placeholder="उदा. दुपारचे संकलन जमा"
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 font-bold"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setHandoverVolunteer(null)}
                    className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-600 rounded-xl font-bold"
                  >
                    रद्द करा
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
                  >
                    रोख जमा पावती तयार करा
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW CASH HANDOVER SLIP */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {viewingHandover && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white text-zinc-900 rounded-3xl p-6 max-w-md w-full border border-amber-300 shadow-2xl space-y-4"
            >
              <div className="text-center border-b border-amber-200 pb-3">
                <p className="text-xs font-bold text-amber-800">॥ श्री गणेशाय नमः ॥</p>
                <h3 className="text-base font-black text-amber-950">{mandal.nameMr}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                  अधिकृत रोख जमा पावती (Cash Handover Slip)
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-100 font-mono">
                  <span className="text-gray-500">पावती क्र:</span>
                  <span className="font-black text-amber-900">{viewingHandover.handoverNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">जमा करणारा संकलक:</span>
                  <span className="font-bold">{viewingHandover.volunteerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">स्वीकारणारा अधिकारी:</span>
                  <span className="font-bold">{viewingHandover.treasurerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 font-mono">
                  <span className="text-gray-500">तारीख व वेळ:</span>
                  <span>{viewingHandover.date} | {viewingHandover.time}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center my-2">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block">जमा रोख रक्कम</span>
                  <p className="text-2xl font-black text-emerald-700 font-mono">₹{viewingHandover.amount.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-gray-600 font-bold mt-0.5">{convertNumberToMarathiWords(viewingHandover.amount)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 text-[10px] text-gray-500 border-t border-amber-200">
                <span>स्वाक्षरी: संकलक</span>
                <span>स्वाक्षरी: खजिनदार</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold"
                >
                  प्रिंट करा
                </button>
                <button
                  onClick={() => setViewingHandover(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold"
                >
                  बंद करा
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
