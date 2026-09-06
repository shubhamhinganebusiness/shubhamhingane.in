import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  Search, 
  Filter, 
  PlusCircle, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Share2, 
  FileSpreadsheet, 
  IndianRupee, 
  UserCheck, 
  MessageCircle, 
  Tag, 
  Calendar,
  Building2,
  Home,
  Check,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PendingVarganiEntry, MandalProfile, MandalLanguage } from '../types';

interface PendingVarganiViewProps {
  entries: PendingVarganiEntry[];
  mandal: MandalProfile;
  lang: MandalLanguage;
  onAddEntry: (newEntry: Omit<PendingVarganiEntry, 'id'>) => void;
  onUpdateStatus: (entryId: string, newStatus: PendingVarganiEntry['status'], collectedAmount?: number) => void;
  onCollectAndIssueReceipt: (entry: PendingVarganiEntry) => void;
}

export const PendingVarganiView: React.FC<PendingVarganiViewProps> = ({
  entries,
  mandal,
  lang,
  onAddEntry,
  onUpdateStatus,
  onCollectAndIssueReceipt
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    targetName: '',
    phone: '',
    address: '',
    area: 'सदाशिव पेठ',
    targetType: 'Household (घरगुती)' as PendingVarganiEntry['targetType'],
    expectedAmount: '',
    assignedVolunteer: 'प्रमोद शिंदे (कार्यकर्ता)',
    notes: ''
  });

  // Calculate Aggregates
  const stats = useMemo(() => {
    const totalEntries = entries.length;
    const totalExpected = entries.reduce((sum, e) => sum + (Number(e.expectedAmount) || 0), 0);
    const totalCollected = entries.reduce((sum, e) => sum + (Number(e.collectedAmount) || 0), 0);
    const pendingCount = entries.filter(e => e.status === 'Pending' || e.status === 'FollowUp').length;
    const collectedCount = entries.filter(e => e.status === 'Collected').length;

    return {
      totalEntries,
      totalExpected,
      totalCollected,
      pendingCount,
      collectedCount,
      collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0
    };
  }, [entries]);

  // Extract unique areas
  const uniqueAreas = useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => {
      if (e.area) set.add(e.area);
    });
    return Array.from(set);
  }, [entries]);

  // Filtered List
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchSearch = 
        e.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.phone.includes(searchQuery) ||
        (e.address && e.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.area && e.area.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.assignedVolunteer && e.assignedVolunteer.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchType = typeFilter === 'all' || e.targetType.includes(typeFilter);
      const matchArea = areaFilter === 'all' || e.area === areaFilter;

      return matchSearch && matchStatus && matchType && matchArea;
    });
  }, [entries, searchQuery, statusFilter, typeFilter, areaFilter]);

  // Submit New Entry
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.targetName || !formData.phone || !formData.expectedAmount) {
      alert('कृपया नाव, मोबाईल आणि अपेक्षित वर्गणी रक्कम भरा.');
      return;
    }

    const numExpected = parseFloat(formData.expectedAmount);
    if (isNaN(numExpected) || numExpected <= 0) {
      alert('कृपया योग्य रक्कम भरा.');
      return;
    }

    onAddEntry({
      targetName: formData.targetName.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim() || undefined,
      area: formData.area.trim() || 'सदाशिव पेठ',
      targetType: formData.targetType,
      expectedAmount: numExpected,
      collectedAmount: 0,
      status: 'Pending',
      assignedVolunteer: formData.assignedVolunteer.trim(),
      lastFollowUpDate: new Date().toISOString().split('T')[0],
      notes: formData.notes.trim() || undefined
    });

    setIsAddModalOpen(false);
    setFormData({
      targetName: '',
      phone: '',
      address: '',
      area: 'सदाशिव पेठ',
      targetType: 'Household (घरगुती)',
      expectedAmount: '',
      assignedVolunteer: 'प्रमोद शिंदे (कार्यकर्ता)',
      notes: ''
    });
  };

  // WhatsApp Reminder Sender
  const handleSendReminderWhatsApp = (entry: PendingVarganiEntry) => {
    const text = encodeURIComponent(
      `🚩 *॥ श्री गणेशाय नमः ॥*\n\n` +
      `सस्नेह जय गणेश,\n` +
      `आदरणीय *${entry.targetName}*,\n\n` +
      `*${mandal.nameMr}* तर्फे श्री गणेशोत्सव २०२६ ची पूर्वतयारी सुरू झाली आहे.\n\n` +
      `🪙 *आपल्या घरची/व्यापाराची नियोजित वर्गणी:* ₹${entry.expectedAmount.toLocaleString('en-IN')}/-\n` +
      `📍 *नियोजित पत्ता:* ${entry.address || entry.area || 'पुणे'}\n` +
      `🤝 *नियुक्त कार्यकर्ता:* ${entry.assignedVolunteer || 'मंडळ प्रतिनिधी'}\n\n` +
      `आपण आपली वर्गणी रोख किंवा UPI/QR द्वारे जमा करू शकता. त्वरित अधिकृत डिजिटल पावती दिली जाईल.\n\n` +
      `🚩 *गणपती बाप्पा मोरया, मंगलमूर्ती मोरया!* 🚩\n` +
      `- *कार्यकारिणी, ${mandal.nameMr}*\n` +
      `संपर्क: ${mandal.phone}`
    );
    window.open(`https://wa.me/91${entry.phone}?text=${text}`, '_blank');
  };

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = filteredEntries.map((e, idx) => ({
      'अ.क्र.': idx + 1,
      'घर/दुकान नाव': e.targetName,
      'मोबाईल': e.phone,
      'पत्ता': e.address || '-',
      'पेठ/परिसर': e.area || '-',
      'प्रकार': e.targetType,
      'अपेक्षित वर्गणी (₹)': e.expectedAmount,
      'जमा वर्गणी (₹)': e.collectedAmount,
      'स्थिती': e.status === 'Collected' ? 'जमा झाली (Paid)' : e.status === 'FollowUp' ? 'पाठपुरावा चालू' : 'प्रलंबित (Pending)',
      'नियुक्त कार्यकर्ता': e.assignedVolunteer || '-',
      'शेवटचा पाठपुरावा': e.lastFollowUpDate || '-',
      'शेरा': e.notes || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pending_Vargani_2026');
    XLSX.writeFile(workbook, `Shivtej_Ganpati_Pending_Vargani_2026.xlsx`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Target */}
        <div className="p-5 rounded-3xl bg-surface border border-gray-200/80 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-main-text">
              <Home size={16} className="text-amber-500" /> एकूण नियोजित घरे/दुकाने
            </span>
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full text-[10px] font-bold">
              टार्गेट
            </span>
          </div>
          <p className="text-3xl font-black text-main-text font-mono">
            {stats.totalEntries}
          </p>
          <span className="text-[11px] text-gray-500 block mt-2">
            अपेक्षित एकूण वर्गणी: ₹{stats.totalExpected.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Pending Follow-ups */}
        <div className="p-5 rounded-3xl bg-surface border border-gray-200/80 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
              <Clock size={16} /> प्रलंबित पाठपुरावा
            </span>
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full text-[10px] font-bold">
              Pending
            </span>
          </div>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {stats.pendingCount}
          </p>
          <span className="text-[11px] text-gray-500 block mt-2">
            कार्यकर्त्यांना भेटीसाठी नेमलेली घरे
          </span>
        </div>

        {/* Collected So Far */}
        <div className="p-5 rounded-3xl bg-surface border border-gray-200/80 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 size={16} /> वर्गणी जमा झाली
            </span>
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full text-[10px] font-bold">
              {stats.collectionRate}%
            </span>
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ₹{stats.totalCollected.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-gray-500 block mt-2">
            {stats.collectedCount} घरांकडून पावती फाडून जमा
          </span>
        </div>

        {/* Action Panel */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent border border-amber-300/80 dark:border-amber-900/60 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider block mb-1">
              पाठपुरावा कृती (Actions)
            </span>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              नवीन घर/दुकान जोडा किंवा कार्यकर्त्यांची यादी डाऊनलोड करा.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <PlusCircle size={14} /> नवीन नोंद
            </button>
            <button
              onClick={handleExportExcel}
              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              title="एक्सेल डाऊनलोड"
            >
              <FileSpreadsheet size={14} /> Excel
            </button>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-4 md:p-5 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="नाव, मोबाईल, पत्ता किंवा कार्यकर्त्याचे नाव शोधा..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl text-xs text-main-text focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-main-text focus:outline-none"
            >
              <option value="all">सर्व स्थिती (All Statuses)</option>
              <option value="Pending">प्रलंबित (Pending)</option>
              <option value="FollowUp">पाठपुरावा चालू (Follow-up)</option>
              <option value="Collected">जमा झाली (Paid)</option>
              <option value="Declined">नाकारली (Declined)</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-main-text focus:outline-none"
            >
              <option value="all">सर्व प्रकार (All Types)</option>
              <option value="Household">घरगुती (Household)</option>
              <option value="Shop">दुकानदार (Shop/Business)</option>
              <option value="Apartment">सोसायटी / अपार्टमेंट</option>
            </select>

            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-main-text focus:outline-none"
            >
              <option value="all">सर्व पेठा (All Areas)</option>
              {uniqueAreas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-surface rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-200 dark:border-zinc-700 text-gray-500 font-bold">
                <th className="py-3 px-4">घर / दुकानदार नाव व पत्ता</th>
                <th className="py-3 px-4">संपर्क व पेठ</th>
                <th className="py-3 px-4">अपेक्षित वर्गणी</th>
                <th className="py-3 px-4">स्थिती</th>
                <th className="py-3 px-4">नियुक्त कार्यकर्ता</th>
                <th className="py-3 px-4 text-right">कृती / पावती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                  
                  {/* Name & Address */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-main-text leading-tight">{entry.targetName}</div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-rose-500 shrink-0" />
                      <span className="truncate">{entry.address || entry.area}</span>
                    </div>
                    {entry.notes && (
                      <div className="text-[10px] italic text-gray-400 mt-0.5">
                        टीप: {entry.notes}
                      </div>
                    )}
                  </td>

                  {/* Phone & Area */}
                  <td className="py-3 px-4">
                    <div className="font-mono font-medium text-main-text flex items-center gap-1">
                      <Phone size={11} className="text-emerald-500" />
                      +91 {entry.phone}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {entry.area} • {entry.targetType}
                    </div>
                  </td>

                  {/* Expected Amount */}
                  <td className="py-3 px-4">
                    <div className="font-black text-amber-800 dark:text-amber-300 font-mono text-sm">
                      ₹ {entry.expectedAmount.toLocaleString('en-IN')}
                    </div>
                    {entry.collectedAmount > 0 && (
                      <div className="text-[10px] text-emerald-600 font-bold">
                        जमा: ₹{entry.collectedAmount.toLocaleString('en-IN')}
                      </div>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    {entry.status === 'Collected' ? (
                      <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-black flex items-center gap-1 w-fit">
                        <CheckCircle2 size={11} /> जमा झाली (Paid)
                      </span>
                    ) : entry.status === 'FollowUp' ? (
                      <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-black flex items-center gap-1 w-fit">
                        <Clock size={11} /> पाठपुरावा चालू
                      </span>
                    ) : entry.status === 'Declined' ? (
                      <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-full text-[10px] font-black flex items-center gap-1 w-fit">
                        <AlertCircle size={11} /> नाकारली
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full text-[10px] font-black flex items-center gap-1 w-fit">
                        <Clock size={11} /> प्रलंबित (Pending)
                      </span>
                    )}
                  </td>

                  {/* Volunteer Assigned */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-700 dark:text-gray-300 text-xs">
                      {entry.assignedVolunteer || 'कार्यकर्ता नेमलेला नाही'}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      अपडेट: {entry.lastFollowUpDate || '-'}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      {/* Send WhatsApp Reminder */}
                      <button
                        onClick={() => handleSendReminderWhatsApp(entry)}
                        className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg transition-all"
                        title="WhatsApp स्मरणपत्र पाठवा"
                      >
                        <MessageCircle size={14} />
                      </button>

                      {/* Collect & Issue Pavati */}
                      {entry.status !== 'Collected' ? (
                        <button
                          onClick={() => onCollectAndIssueReceipt(entry)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-all shadow-sm"
                        >
                          <PlusCircle size={13} />
                          <span>पावती फाडा</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check size={13} /> पूर्ण
                        </span>
                      )}

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEntries.length === 0 && (
          <div className="p-12 text-center text-xs text-gray-400">
            कोणतीही प्रलंबित वर्गणी नोंद आढळली नाही.
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD TARGET MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                    <Home size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-main-text">नवीन घरोघरी/दुकान वर्गणी नोंद</h3>
                    <p className="text-xs text-gray-500">पाठपुरावा व नियोजित संकलन</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 hover:text-main-text"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-main-text mb-1">
                    घर / दुकान / व्यवसायाचे नाव *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. श्री. गजानन बापट / मे. पुणे इलेक्ट्रॉनिक्स"
                    value={formData.targetName}
                    onChange={(e) => setFormData({ ...formData, targetName: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-main-text focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-main-text mb-1">
                      मोबाईल क्र. (Mobile) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="९८२२XXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-main-text focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-main-text mb-1">
                      अपेक्षित वर्गणी रक्कम (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="उदा. २१००"
                      value={formData.expectedAmount}
                      onChange={(e) => setFormData({ ...formData, expectedAmount: e.target.value })}
                      className="w-full p-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-main-text focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-main-text mb-1">
                      प्रकार (Target Type)
                    </label>
                    <select
                      value={formData.targetType}
                      onChange={(e) => setFormData({ ...formData, targetType: e.target.value as any })}
                      className="w-full p-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-main-text focus:outline-none"
                    >
                      <option value="Household (घरगुती)">घरगुती (Household)</option>
                      <option value="Shop / Business (दुकानदार)">दुकानदार / व्यवसाय (Shop)</option>
                      <option value="Apartment / Society">सोसायटी / अपार्टमेंट</option>
                      <option value="Corporate / Sponsor">कॉर्पोरेट / प्रायोजक</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-main-text mb-1">
                      परिसर / पेठ (Area/Peth)
                    </label>
                    <input
                      type="text"
                      placeholder="उदा. सदाशिव पेठ, टिळक रस्ता"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full p-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-main-text focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-main-text mb-1">
                    पत्ता / फ्लॅट क्र. / गल्ली
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. फ्लॅट क्र. ४०२, सिद्धिविनायक हाइट्स"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-main-text focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-main-text mb-1">
                    नियुक्त कार्यकर्ता (Assigned Volunteer)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. प्रमोद शिंदे (कार्यकर्ता)"
                    value={formData.assignedVolunteer}
                    onChange={(e) => setFormData({ ...formData, assignedVolunteer: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-main-text focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-main-text mb-1">
                    पाठपुरावा टीप (Follow-up Notes)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="उदा. संध्याकाळी ७ वाजता घरी भेट देण्यास सांगितले आहे..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-main-text focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-xl font-bold"
                  >
                    रद्द करा
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black shadow-sm"
                  >
                    नोंद जतन करा
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
