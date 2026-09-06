import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  PlusCircle, 
  Phone, 
  MapPin, 
  Mail, 
  Award, 
  Sparkles, 
  Receipt, 
  Share2, 
  ArrowUpRight, 
  Building2, 
  Home, 
  Crown, 
  Briefcase, 
  Clock, 
  Eye, 
  Check, 
  ChevronRight,
  IndianRupee,
  MessageCircle,
  Tag
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DonorProfile, DigitalPavati, MandalProfile, MandalLanguage } from '../types';

interface DonorDatabaseViewProps {
  donors: DonorProfile[];
  pavatis: DigitalPavati[];
  mandal: MandalProfile;
  lang: MandalLanguage;
  onAddDonor: (newDonor: Omit<DonorProfile, 'id'>) => void;
  onSelectDonorForPavati: (donor: DonorProfile) => void;
  onViewReceipt: (pavati: DigitalPavati) => void;
}

export const DonorDatabaseView: React.FC<DonorDatabaseViewProps> = ({
  donors,
  pavatis,
  mandal,
  lang,
  onAddDonor,
  onSelectDonorForPavati,
  onViewReceipt
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [minAmountFilter, setMinAmountFilter] = useState<number>(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingDonorHistory, setViewingDonorHistory] = useState<DonorProfile | null>(null);

  // New Donor Form State
  const [newDonorForm, setNewDonorForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    area: 'सदाशिव पेठ',
    category: 'Household (कुटुंब/रहिवासी)' as DonorProfile['category'],
    notes: ''
  });

  // Calculate live donor statistics
  const metrics = useMemo(() => {
    const totalDonors = donors.length;
    const totalDonationsAmount = donors.reduce((sum, d) => sum + (Number(d.totalDonated) || 0), 0);
    const repeatDonorsCount = donors.filter(d => d.repeatDonor || d.donationsCount > 1).length;
    const householdCount = donors.filter(d => d.category?.includes('Household') || d.category?.includes('कुटुंब')).length;
    const businessCount = donors.filter(d => d.category?.includes('Business') || d.category?.includes('दुकानदार') || d.category?.includes('Sponsor')).length;
    const avgDonation = totalDonors > 0 ? Math.round(totalDonationsAmount / totalDonors) : 0;

    return {
      totalDonors,
      totalDonationsAmount,
      repeatDonorsCount,
      householdCount,
      businessCount,
      avgDonation
    };
  }, [donors]);

  // Extract unique areas
  const uniqueAreas = useMemo(() => {
    const set = new Set<string>();
    donors.forEach(d => {
      if (d.area) set.add(d.area);
    });
    return Array.from(set);
  }, [donors]);

  // Filtered Donors
  const filteredDonors = useMemo(() => {
    return donors.filter(d => {
      const matchSearch = 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.phone.includes(searchQuery) ||
        (d.address && d.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.area && d.area.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.donorId && d.donorId.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = selectedCategory === 'all' || d.category.includes(selectedCategory);
      const matchArea = selectedArea === 'all' || d.area === selectedArea;
      const matchAmount = d.totalDonated >= minAmountFilter;

      return matchSearch && matchCategory && matchArea && matchAmount;
    });
  }, [donors, searchQuery, selectedCategory, selectedArea, minAmountFilter]);

  // Handle New Donor Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonorForm.name || !newDonorForm.phone) {
      alert('कृपया देणगीदाराचे नाव आणि संपर्क क्रमांक भरा.');
      return;
    }

    const nextId = `DNR-${String(donors.length + 1).padStart(3, '0')}`;
    onAddDonor({
      donorId: nextId,
      name: newDonorForm.name.trim(),
      phone: newDonorForm.phone.trim(),
      email: newDonorForm.email.trim() || undefined,
      address: newDonorForm.address.trim() || undefined,
      area: newDonorForm.area.trim() || 'सदाशिव पेठ',
      category: newDonorForm.category,
      totalDonated: 0,
      donationsCount: 0,
      repeatDonor: false,
      status: 'Active',
      notes: newDonorForm.notes.trim() || undefined
    });

    setIsAddModalOpen(false);
    setNewDonorForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      area: 'सदाशिव पेठ',
      category: 'Household (कुटुंब/रहिवासी)',
      notes: ''
    });
  };

  // Export Donors to Excel
  const handleExportExcel = () => {
    const dataToExport = filteredDonors.map((d, idx) => ({
      'अ.क्र.': idx + 1,
      'देणगीदार आयडी': d.donorId,
      'नाव': d.name,
      'मोबाईल': d.phone,
      'ई-मेल': d.email || '-',
      'पत्ता': d.address || '-',
      'परिसर/पेठ': d.area || '-',
      'वर्गवारी प्रकार': d.category,
      'एकूण योगदान (₹)': d.totalDonated,
      'पावत्या संख्या': d.donationsCount,
      'अंतिम देणगी तारीख': d.lastDonationDate || '-',
      'वारंवार देणगीदार?': d.repeatDonor ? 'होय (Repeat)' : 'नवीन',
      'शेरा': d.notes || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Donor_Directory_2026');
    XLSX.writeFile(workbook, `Shivtej_Ganpati_Donors_Database_2026.xlsx`);
  };

  // WhatsApp Gratitude Message
  const handleSendWhatsAppGratitude = (donor: DonorProfile) => {
    const text = encodeURIComponent(
      `🚩 *॥ श्री गणेशाय नमः ॥*\n\n` +
      `सस्नेह जय गणेश,\n` +
      `आदरणीय *${donor.name}* जी,\n\n` +
      `*${mandal.nameMr}* तर्फे श्री गणेशोत्सव २०२६ निमित्त आपल्या अमूल्य योगदानाबद्दल मनःपूर्वक आभार! 🙏\n\n` +
      `🪙 *आपले एकूण सहकार्य:* ₹${donor.totalDonated.toLocaleString('en-IN')}/-\n` +
      `📜 *नोंदणीकृत पावत्या:* ${donor.donationsCount} पावत्या\n\n` +
      `बाप्पाच्या कृपेने आपल्या परिवारास सुख, शांती व उत्तम आरोग्य लाभो हीच श्रींच्या चरणी प्रार्थना.\n\n` +
      `🚩 *गणपती बाप्पा मोरया, मंगलमूर्ती मोरया!* 🚩\n` +
      `- *${mandal.presidentName} (अध्यक्ष)*\n` +
      `संपर्क: ${mandal.phone}`
    );
    window.open(`https://wa.me/91${donor.phone}?text=${text}`, '_blank');
  };

  // Find all pavatis for a specific donor
  const getDonorPavatis = (donor: DonorProfile) => {
    return pavatis.filter(p => 
      p.phone === donor.phone || 
      p.donorName.toLowerCase().trim() === donor.name.toLowerCase().trim() ||
      (donor.receiptNumbers && donor.receiptNumbers.includes(p.receiptNumber))
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Statistical Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Registered Donors */}
        <div className="p-5 rounded-3xl bg-surface border border-gray-200/80 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-main-text">
              <Users size={16} className="text-amber-500" /> एकूण नोंदणीकृत दानशूर
            </span>
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full text-[10px] font-bold">
              डेटाबेस
            </span>
          </div>
          <p className="text-3xl font-black text-main-text font-mono">
            {metrics.totalDonors}
          </p>
          <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2">
            <span>घरगुती: {metrics.householdCount}</span>
            <span>व्यावसायिक: {metrics.businessCount}</span>
          </div>
        </div>

        {/* Total Donated Amount */}
        <div className="p-5 rounded-3xl bg-surface border border-gray-200/80 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <IndianRupee size={16} /> एकूण प्राप्त योगदान
            </span>
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full text-[10px] font-bold">
              एकत्रित निधी
            </span>
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ₹{metrics.totalDonationsAmount.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-gray-500 block mt-2">
            सरासरी देणगी: ₹{metrics.avgDonation.toLocaleString('en-IN')} प्रति कुटुंब
          </span>
        </div>

        {/* Repeat / Loyal Donors */}
        <div className="p-5 rounded-3xl bg-surface border border-gray-200/80 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
              <Award size={16} /> निष्ठावंत देणगीदार (Repeat)
            </span>
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-full text-[10px] font-bold">
              वारंवार
            </span>
          </div>
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {metrics.repeatDonorsCount}
          </p>
          <span className="text-[11px] text-gray-500 block mt-2">
            दरवर्षी उत्सव वर्गणी देणारे कुटुंब व व्यावसायिक
          </span>
        </div>

        {/* Quick Add & Direct Actions */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent border border-amber-300/80 dark:border-amber-900/60 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider block mb-1">
              द्रुत व्यवस्थापन (Quick Action)
            </span>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              नवीन देणगीदार जोडा किंवा एक्सेल मध्ये बॅकअप डाऊनलोड करा.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <PlusCircle size={14} /> नवीन देणगीदार
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

      {/* Filter & Search Bar */}
      <div className="bg-surface p-4 md:p-5 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="नाव, मोबाईल, पत्ता किंवा पेठ/परिसर द्वारे शोधा..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl text-xs text-main-text focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-main-text focus:outline-none"
            >
              <option value="all">सर्व वर्गवारी (All Categories)</option>
              <option value="Household">घरगुती (Household)</option>
              <option value="Business">दुकानदार / व्यावसायिक (Business)</option>
              <option value="Sponsor">प्रायोजक (Sponsor)</option>
              <option value="VIP">विशेष देणगीदार (VIP / Trust)</option>
            </select>

            {/* Area Filter */}
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-main-text focus:outline-none"
            >
              <option value="all">सर्व पेठा/परिसर (All Areas)</option>
              {uniqueAreas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {/* Amount Slab */}
            <select
              value={minAmountFilter}
              onChange={(e) => setMinAmountFilter(Number(e.target.value))}
              className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-main-text focus:outline-none"
            >
              <option value={0}>सर्व रकमा (All Amounts)</option>
              <option value={5000}>₹५,०००+ देणगीदार</option>
              <option value={10000}>₹१०,०००+ देणगीदार</option>
              <option value={25000}>₹२५,०००+ मुख्य प्रायोजक</option>
            </select>
          </div>

        </div>
      </div>

      {/* Donors List / Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDonors.map((donor) => {
          const donorPavatis = getDonorPavatis(donor);

          return (
            <motion.div
              key={donor.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-3xl p-5 border border-gray-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group"
            >
              {/* Header Badges */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                    {donor.donorId}
                  </span>

                  <div className="flex items-center gap-1">
                    {donor.repeatDonor && (
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-[9px] font-bold">
                        ★ Repeat Donor
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded-full text-[9px] font-bold">
                      {donor.category}
                    </span>
                  </div>
                </div>

                {/* Donor Name & Contact */}
                <h4 className="text-sm font-black text-main-text leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {donor.name}
                </h4>

                <div className="space-y-1 mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-emerald-600" />
                    <span className="font-mono font-medium">+91 {donor.phone}</span>
                  </div>

                  {donor.address && (
                    <div className="flex items-start gap-2">
                      <MapPin size={12} className="text-rose-500 shrink-0 mt-0.5" />
                      <span className="truncate">{donor.address}</span>
                    </div>
                  )}

                  {donor.area && (
                    <div className="flex items-center gap-2">
                      <Tag size={12} className="text-amber-500 shrink-0" />
                      <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">{donor.area}</span>
                    </div>
                  )}
                </div>

                {/* Contribution Highlight Box */}
                <div className="mt-3.5 p-3 rounded-2xl bg-amber-50/60 dark:bg-zinc-800/60 border border-amber-200/60 dark:border-zinc-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">एकूण योगदान</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      ₹ {donor.totalDonated.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">पावत्या</span>
                    <span className="text-xs font-black text-main-text">
                      {donor.donationsCount || donorPavatis.length} पावत्या
                    </span>
                  </div>
                </div>

                {donor.notes && (
                  <p className="text-[10px] italic text-gray-400 mt-2 truncate">
                    टीप: {donor.notes}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between gap-1.5">
                
                {/* Send WhatsApp Gratitude */}
                <button
                  onClick={() => handleSendWhatsAppGratitude(donor)}
                  className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 transition-all"
                  title="WhatsApp आभार संदेश पाठवा"
                >
                  <MessageCircle size={14} />
                  <span className="hidden sm:inline text-[11px]">WhatsApp</span>
                </button>

                {/* View History Receipts */}
                <button
                  onClick={() => setViewingDonorHistory(donor)}
                  className="p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 text-xs font-bold flex items-center gap-1 transition-all"
                  title="पावती इतिहास पहा"
                >
                  <Receipt size={14} />
                  <span className="text-[11px]">इतिहास ({donorPavatis.length})</span>
                </button>

                {/* Fast New Pavati Pre-fill */}
                <button
                  onClick={() => onSelectDonorForPavati(donor)}
                  className="py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center gap-1 transition-all shadow-sm"
                  title="या देणगीदारासाठी नवी पावती फाडा"
                >
                  <PlusCircle size={13} />
                  <span className="text-[11px]">नवी पावती</span>
                </button>

              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredDonors.length === 0 && (
        <div className="bg-surface rounded-3xl p-12 text-center border border-gray-200/80 dark:border-zinc-800 space-y-3">
          <Users size={36} className="mx-auto text-gray-400" />
          <h4 className="text-base font-bold text-main-text">कोणतेही देणगीदार आढळले नाहीत</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            आपण शोधत असलेले देणगीदार सापडले नाहीत. कृपया शोध शब्द किंवा फिल्टर्स तपासा.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD NEW DONOR MODAL */}
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
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-main-text">नवीन देणगीदार नोंदणी</h3>
                    <p className="text-xs text-gray-500">गणेशोत्सव २०२६ देणगीदार डेटाबेस</p>
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
                    देणगीदाराचे पूर्ण नाव (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. श्री. विठ्ठलराव मोहिते / मे. सह्याद्री कन्स्ट्रक्शन"
                    value={newDonorForm.name}
                    onChange={(e) => setNewDonorForm({ ...newDonorForm, name: e.target.value })}
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
                      value={newDonorForm.phone}
                      onChange={(e) => setNewDonorForm({ ...newDonorForm, phone: e.target.value })}
                      className="w-full p-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-main-text focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-main-text mb-1">
                      ई-मेल (Email)
                    </label>
                    <input
                      type="email"
                      placeholder="donor@example.com"
                      value={newDonorForm.email}
                      onChange={(e) => setNewDonorForm({ ...newDonorForm, email: e.target.value })}
                      className="w-full p-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-main-text focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-main-text mb-1">
                      वर्गवारी प्रकार (Category)
                    </label>
                    <select
                      value={newDonorForm.category}
                      onChange={(e) => setNewDonorForm({ ...newDonorForm, category: e.target.value as any })}
                      className="w-full p-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-main-text focus:outline-none"
                    >
                      <option value="Household (कुटुंब/रहिवासी)">घरगुती (Household)</option>
                      <option value="Business (दुकानदार/व्यावसायिक)">दुकानदार / व्यावसायिक (Business)</option>
                      <option value="Sponsor (प्रायोजक)">प्रायोजक (Sponsor)</option>
                      <option value="VIP / Trust (विशेष देणगीदार)">विशेष देणगीदार (VIP / Trust)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-main-text mb-1">
                      परिसर / पेठ (Area/Peth)
                    </label>
                    <input
                      type="text"
                      placeholder="उदा. सदाशिव पेठ, टिळक रस्ता"
                      value={newDonorForm.area}
                      onChange={(e) => setNewDonorForm({ ...newDonorForm, area: e.target.value })}
                      className="w-full p-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-main-text focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-main-text mb-1">
                    संपूर्ण पत्ता (Full Address)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. फ्लॅट क्र. ३०२, सिद्धिविनायक हाइट्स, पुणे"
                    value={newDonorForm.address}
                    onChange={(e) => setNewDonorForm({ ...newDonorForm, address: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-main-text focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-main-text mb-1">
                    विशेष टीप / नोंद (Notes)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="उदा. दरवर्षी आरतीचे यजमानपद घेतात..."
                    value={newDonorForm.notes}
                    onChange={(e) => setNewDonorForm({ ...newDonorForm, notes: e.target.value })}
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
                    देणगीदार जतन करा
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DONOR RECEIPT HISTORY MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {viewingDonorHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-main-text flex items-center gap-2">
                    <Receipt className="text-amber-500" size={18} />
                    {viewingDonorHistory.name} - पावती इतिहास
                  </h3>
                  <p className="text-xs text-gray-500">
                    मोबाईल: +91 {viewingDonorHistory.phone} • एकूण देणगी: ₹{viewingDonorHistory.totalDonated.toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={() => setViewingDonorHistory(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 hover:text-main-text"
                >
                  ✕
                </button>
              </div>

              {/* List of Pavatis for this donor */}
              <div className="space-y-2">
                {getDonorPavatis(viewingDonorHistory).length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400">
                    या देणगीदारासाठी अद्याप कोणतीही पावती नोंदवली गेलेली नाही.
                  </div>
                ) : (
                  getDonorPavatis(viewingDonorHistory).map(p => (
                    <div
                      key={p.id}
                      className="p-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-gray-200/80 dark:border-zinc-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                            {p.receiptNumber}
                          </span>
                          <span className="px-2 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-[9px] font-bold">
                            {p.paymentMode.toUpperCase()}
                          </span>
                          <span className="text-gray-400 text-[10px]">
                            {p.date} • {p.time}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-[11px]">
                          वर्गवारी: {p.category} {p.notes ? `• ${p.notes}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          ₹ {p.amount.toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => {
                            setViewingDonorHistory(null);
                            onViewReceipt(p);
                          }}
                          className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all"
                          title="डिजिटल पावती उघडा"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    const donor = viewingDonorHistory;
                    setViewingDonorHistory(null);
                    onSelectDonorForPavati(donor);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle size={14} /> या देणगीदारासाठी नवी पावती फाडा
                </button>
                <button
                  onClick={() => setViewingDonorHistory(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold"
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
