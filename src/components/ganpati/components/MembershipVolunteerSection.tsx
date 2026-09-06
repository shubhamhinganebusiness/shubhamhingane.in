import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  Clock, 
  Send, 
  Phone, 
  Heart, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Shield, 
  Sparkles, 
  MapPin, 
  Share2, 
  Award,
  Filter,
  Crown,
  Edit3,
  Trash2,
  Check,
  Building,
  UserCheck,
  ShieldCheck,
  FileSpreadsheet,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Member, VolunteerDuty, MandalLanguage, SabhasadType, MandalProfile } from '../types';
import { mandalTranslations } from '../translations/mandalTranslations';

interface MembershipVolunteerSectionProps {
  members: Member[];
  duties: VolunteerDuty[];
  mandal: MandalProfile;
  lang: MandalLanguage;
  onAddMember: (newMember: Omit<Member, 'id'>) => void;
  onUpdateMember: (updatedMember: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onAddDuty: (newDuty: Omit<VolunteerDuty, 'id'>) => void;
  onUpdateMemberFee: (memberId: string, status: 'Paid' | 'Pending') => void;
  onUpdateMandal?: (mandal: MandalProfile) => void;
  userRole: string;
}

export const MembershipVolunteerSection: React.FC<MembershipVolunteerSectionProps> = ({
  members,
  duties,
  mandal,
  lang,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onAddDuty,
  onUpdateMemberFee,
  onUpdateMandal,
  userRole
}) => {
  const t = mandalTranslations[lang];
  const [activeSubTab, setActiveSubTab] = useState<'members' | 'executive' | 'roster' | 'bloodBank'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [sabhasadFilter, setSabhasadFilter] = useState<string>('all');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'all' | 'Paid' | 'Pending'>('all');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('all');

  // Modals
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddAdhyakshOpen, setIsAddAdhyakshOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [isAddDutyOpen, setIsAddDutyOpen] = useState(false);

  // Preset Avatar Options
  const presetAvatars = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
  ];

  // Helper for photo upload via file reader
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64Url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('कृपया 3MB पेक्षा लहान आकाराचा फोटो निवडा.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          callback(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // New Sabhasad Form State
  const [memberForm, setMemberForm] = useState({
    name: '',
    role: 'Committee Member' as Member['role'],
    designationMr: 'मंडळ सभासद',
    sabhasadType: 'सक्रिय सभासद (Active Member)' as SabhasadType,
    phone: '',
    email: '',
    bloodGroup: 'O+ve',
    address: 'सदाशिव पेठ, पुणे',
    joinYear: 2026,
    avatar: presetAvatars[0],
    feePaidAmount: '2000',
    responsibilities: 'उत्सव सहकार्य व आरती नियोजन'
  });

  // Adhyaksh / Executive Quick-Add Form State
  const [adhyakshForm, setAdhyakshForm] = useState({
    name: '',
    role: 'Executive Member' as Member['role'],
    designationMr: 'मुख्य कार्यकारणी सभासद / उत्सव प्रमुख',
    sabhasadType: 'मुख्य कार्यकारणी सभासद (Executive Board)' as SabhasadType,
    phone: '',
    email: '',
    bloodGroup: 'O+ve',
    address: 'सदाशिव पेठ, पुणे',
    joinYear: 2026,
    avatar: presetAvatars[1],
    feePaidAmount: '5000',
    responsibilities: 'एकूण मंडळ नेतृत्व, नियोजन व धर्मादाय समन्वय'
  });

  // Edit Member Form State
  const [editFormData, setEditFormData] = useState({
    name: '',
    role: 'Committee Member' as Member['role'],
    designationMr: '',
    sabhasadType: 'सक्रिय सभासद (Active Member)' as SabhasadType,
    phone: '',
    email: '',
    bloodGroup: 'O+ve',
    address: '',
    joinYear: 2026,
    avatar: '',
    feePaidAmount: '2000',
    annualFeeStatus: 'Paid' as 'Paid' | 'Pending' | 'Partial',
    responsibilities: ''
  });

  // New Duty Form State
  const [dutyForm, setDutyForm] = useState({
    volunteerName: '',
    volunteerPhone: '',
    dutyType: 'Morning Aarti' as VolunteerDuty['dutyType'],
    date: '2026-08-17',
    timeSlot: '06:30 AM - 08:30 AM',
    location: 'मुख्य गाभारा व आरती स्टेज'
  });

  // Filtered Members
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchQuery = 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.phone.includes(searchQuery) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.designationMr && m.designationMr.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.address && m.address.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchSabhasadType = 
        sabhasadFilter === 'all' 
          ? true 
          : sabhasadFilter === 'executive'
            ? m.isExecutiveBearer || ['President', 'Vice President', 'Working President', 'Secretary', 'Treasurer', 'Executive Member'].includes(m.role)
            : m.sabhasadType?.includes(sabhasadFilter) || m.role === sabhasadFilter;

      const matchFee = feeStatusFilter === 'all' || m.annualFeeStatus === feeStatusFilter;
      const matchBlood = bloodGroupFilter === 'all' || m.bloodGroup === bloodGroupFilter;

      return matchQuery && matchSabhasadType && matchFee && matchBlood;
    });
  }, [members, searchQuery, sabhasadFilter, feeStatusFilter, bloodGroupFilter]);

  // Executive Committee Members List
  const executiveMembers = useMemo(() => {
    return members.filter(m => m.isExecutiveBearer || ['President', 'Vice President', 'Working President', 'Secretary', 'Treasurer', 'Executive Member'].includes(m.role));
  }, [members]);

  // Handle Add Sabhasad Submit
  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim() || !memberForm.phone.trim()) {
      alert('कृपया नाव व मोबाईल नंबर भरा.');
      return;
    }

    const nextId = `SHIV-M${String(members.length + 1).padStart(3, '0')}`;
    const feeAmt = parseFloat(memberForm.feePaidAmount) || 0;

    onAddMember({
      memberId: nextId,
      name: memberForm.name.trim(),
      role: memberForm.role,
      designationMr: memberForm.designationMr.trim() || memberForm.role,
      sabhasadType: memberForm.sabhasadType,
      isExecutiveBearer: memberForm.sabhasadType === 'मुख्य कार्यकारणी सभासद (Executive Board)',
      phone: memberForm.phone.trim(),
      email: memberForm.email.trim() || `${nextId.toLowerCase()}@shivtejmandal.org`,
      bloodGroup: memberForm.bloodGroup,
      address: memberForm.address.trim(),
      joinYear: Number(memberForm.joinYear) || 2026,
      avatar: memberForm.avatar || presetAvatars[0],
      annualFeeStatus: feeAmt > 0 ? 'Paid' : 'Pending',
      feePaidAmount: feeAmt,
      dueAmount: feeAmt > 0 ? 0 : 2000,
      responsibilities: memberForm.responsibilities
    });

    setIsAddMemberOpen(false);
    setMemberForm({
      name: '',
      role: 'Committee Member',
      designationMr: 'मंडळ सभासद',
      sabhasadType: 'सक्रिय सभासद (Active Member)',
      phone: '',
      email: '',
      bloodGroup: 'O+ve',
      address: 'सदाशिव पेठ, पुणे',
      joinYear: 2026,
      avatar: presetAvatars[0],
      feePaidAmount: '2000',
      responsibilities: 'उत्सव सहकार्य व आरती नियोजन'
    });
  };

  // Handle Add Adhyaksh / Office Bearer Submit
  const handleCreateAdhyaksh = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adhyakshForm.name.trim() || !adhyakshForm.phone.trim()) {
      alert('कृपया नाव आणि मोबाईल नंबर भरा.');
      return;
    }

    const nextId = `SHIV-EX${String(members.length + 1).padStart(3, '0')}`;
    const feeAmt = parseFloat(adhyakshForm.feePaidAmount) || 5000;

    onAddMember({
      memberId: nextId,
      name: adhyakshForm.name.trim(),
      role: adhyakshForm.role,
      designationMr: adhyakshForm.designationMr.trim(),
      sabhasadType: 'मुख्य कार्यकारणी सभासद (Executive Board)',
      isExecutiveBearer: true,
      executiveRank: adhyakshForm.role === 'President' ? 1 : adhyakshForm.role === 'Working President' ? 2 : adhyakshForm.role === 'Vice President' ? 3 : 5,
      phone: adhyakshForm.phone.trim(),
      email: adhyakshForm.email.trim() || `${nextId.toLowerCase()}@shivtejmandal.org`,
      bloodGroup: adhyakshForm.bloodGroup,
      address: adhyakshForm.address.trim(),
      joinYear: Number(adhyakshForm.joinYear) || 2026,
      avatar: adhyakshForm.avatar || presetAvatars[1],
      annualFeeStatus: 'Paid',
      feePaidAmount: feeAmt,
      dueAmount: 0,
      responsibilities: adhyakshForm.responsibilities
    });

    // If Adhyaksh, Sachiv or Khajandar, update mandal
    if (onUpdateMandal) {
      if (adhyakshForm.role === 'President') {
        onUpdateMandal({ ...mandal, presidentName: adhyakshForm.name.trim() });
      } else if (adhyakshForm.role === 'Secretary') {
        onUpdateMandal({ ...mandal, secretaryName: adhyakshForm.name.trim() });
      } else if (adhyakshForm.role === 'Treasurer') {
        onUpdateMandal({ ...mandal, treasurerName: adhyakshForm.name.trim() });
      }
    }

    setIsAddAdhyakshOpen(false);
  };

  // Open Edit Modal
  const handleStartEditMember = (member: Member) => {
    setEditingMember(member);
    setEditFormData({
      name: member.name,
      role: member.role,
      designationMr: member.designationMr || member.role,
      sabhasadType: member.sabhasadType || 'सक्रिय सभासद (Active Member)',
      phone: member.phone,
      email: member.email || '',
      bloodGroup: member.bloodGroup,
      address: member.address || '',
      joinYear: member.joinYear,
      avatar: member.avatar || presetAvatars[0],
      feePaidAmount: String(member.feePaidAmount),
      annualFeeStatus: member.annualFeeStatus,
      responsibilities: member.responsibilities || ''
    });
  };

  // Submit Edit Member Form
  const handleSaveEditMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    const feeAmt = parseFloat(editFormData.feePaidAmount) || 0;
    const isExec = editFormData.sabhasadType === 'मुख्य कार्यकारणी सभासद (Executive Board)' || ['President', 'Vice President', 'Working President', 'Secretary', 'Treasurer', 'Executive Member'].includes(editFormData.role);

    const updated: Member = {
      ...editingMember,
      name: editFormData.name.trim(),
      role: editFormData.role,
      designationMr: editFormData.designationMr.trim(),
      sabhasadType: editFormData.sabhasadType,
      isExecutiveBearer: isExec,
      phone: editFormData.phone.trim(),
      email: editFormData.email.trim(),
      bloodGroup: editFormData.bloodGroup,
      address: editFormData.address.trim(),
      joinYear: Number(editFormData.joinYear) || editingMember.joinYear,
      avatar: editFormData.avatar || editingMember.avatar,
      annualFeeStatus: editFormData.annualFeeStatus,
      feePaidAmount: feeAmt,
      dueAmount: editFormData.annualFeeStatus === 'Paid' ? 0 : 2000,
      responsibilities: editFormData.responsibilities
    };

    onUpdateMember(updated);

    // If president/secretary/treasurer changed
    if (onUpdateMandal) {
      if (editFormData.role === 'President') {
        onUpdateMandal({ ...mandal, presidentName: editFormData.name.trim() });
      } else if (editFormData.role === 'Secretary') {
        onUpdateMandal({ ...mandal, secretaryName: editFormData.name.trim() });
      } else if (editFormData.role === 'Treasurer') {
        onUpdateMandal({ ...mandal, treasurerName: editFormData.name.trim() });
      }
    }

    setEditingMember(null);
  };

  // Delete Member Confirm
  const handleConfirmDeleteMember = () => {
    if (!deletingMember) return;
    onDeleteMember(deletingMember.id);
    setDeletingMember(null);
  };

  // Duty Create
  const handleCreateDuty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dutyForm.volunteerName || !dutyForm.volunteerPhone) {
      alert('कृपया स्वयंसेवकाचे नाव आणि फोन भरा.');
      return;
    }

    onAddDuty({
      volunteerName: dutyForm.volunteerName.trim(),
      volunteerPhone: dutyForm.volunteerPhone.trim(),
      dutyType: dutyForm.dutyType,
      date: dutyForm.date,
      timeSlot: dutyForm.timeSlot,
      status: 'Assigned',
      location: dutyForm.location,
      assignedBy: mandal.secretaryName ? `${mandal.secretaryName} (सचिव)` : 'सचिव'
    });

    setIsAddDutyOpen(false);
  };

  // WhatsApp Alert
  const sendWhatsAppReminder = (duty: VolunteerDuty) => {
    const text = encodeURIComponent(
      `🚩 *${mandal.nameMr} - उत्सव ड्युटी स्मरणपत्र* 🚩\n` +
      `----------------------------------------\n` +
      `नमस्कार *${duty.volunteerName}*,\n` +
      `आपणास श्री गणेशोत्सवासाठी खालील जबाबदारी सोपवण्यात आली आहे:\n\n` +
      `📌 *ड्युटी प्रकार:* ${duty.dutyType}\n` +
      `📅 *दिनांक:* ${duty.date}\n` +
      `⏰ *वेळ:* ${duty.timeSlot}\n` +
      `📍 *ठिकाण:* ${duty.location}\n\n` +
      `कृपया वेळेच्या १५ मिनिटे आधी उपस्थित राहावे ही नम्र विनंती.\n` +
      `संपर्क: ${mandal.secretaryName} (सचिव) - ${mandal.phone}\n` +
      `|| गणपती बाप्पा मोरया ||`
    );
    window.open(`https://wa.me/91${duty.volunteerPhone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  // Export Member Directory to Excel
  const handleExportMembers = () => {
    const dataToExport = members.map((m, idx) => ({
      'अ.क्र.': idx + 1,
      'सदस्यता क्र.': m.memberId,
      'नाव': m.name,
      'पदभार': m.designationMr || m.role,
      'सभासद वर्गवारी': m.sabhasadType || 'सामान्य सभासद',
      'मोबाईल': m.phone,
      'रक्तगट': m.bloodGroup,
      'पत्ता': m.address,
      'सभासद वर्ष': m.joinYear,
      'वार्षिक वर्गणी': m.annualFeeStatus,
      'भरलेली रक्कम (₹)': m.feePaidAmount,
      'जबाबदारी': m.responsibilities || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mandal_Sabhasad_2026');
    XLSX.writeFile(workbook, `Mandal_Sabhasad_List_2026.xlsx`);
  };

  return (
    <div className="space-y-8">
      
      {/* Top Header & Subtabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-main-text tracking-tight flex items-center gap-2.5">
            <Users className="text-primary" size={28} />
            {t.members.title}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            मंडळाचे अध्यक्ष, मुख्य कार्यकारणी पदाधिकारी, आजीवन व सक्रिय सभासद बहीखाता.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportMembers}
            className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-all shadow-sm"
          >
            <FileSpreadsheet size={15} />
            <span>Excel डाऊनलोड</span>
          </button>

          <button
            onClick={() => setIsAddAdhyakshOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-900/20 transition-all"
          >
            <Crown size={15} />
            <span>+ अध्यक्ष / पदाधिकारी जोडा</span>
          </button>

          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            <UserPlus size={15} />
            <span>+ नवीन सभासद नोंदणी</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-zinc-800/80 rounded-2xl w-full sm:w-fit overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('members')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'members' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-main-text'
          }`}
        >
          <Users size={14} />
          <span>सर्व सभासद सूची ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('executive')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'executive' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-main-text'
          }`}
        >
          <Crown size={14} />
          <span>मंडळ अध्यक्ष व मुख्य पदाधिकारी ({executiveMembers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('roster')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'roster' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-main-text'
          }`}
        >
          <Clock size={14} />
          <span>ड्युटी व स्वयंसेवक नियोजन ({duties.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('bloodBank')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'bloodBank' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-main-text'
          }`}
        >
          <Heart size={14} />
          <span>आणीबाणी रक्तगट डिरेक्टरी</span>
        </button>
      </div>

      {/* SUBTAB 1: MEMBERS DIRECTORY */}
      {activeSubTab === 'members' && (
        <div className="space-y-6">
          
          {/* Filters Bar */}
          <div className="p-4 bg-surface rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="नाव, मोबाईल, पद किंवा पत्ता शोधा..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
              <select 
                value={sabhasadFilter}
                onChange={e => setSabhasadFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
              >
                <option value="all">सर्व वर्गवारी (All Categories)</option>
                <option value="executive">मुख्य कार्यकारणी / पदाधिकारी</option>
                <option value="सक्रिय सभासद">सक्रिय सभासद</option>
                <option value="आजीवन सभासद">आजीवन सभासद</option>
                <option value="सर्वसाधारण सभासद">सर्वसाधारण सभासद</option>
              </select>

              <select 
                value={feeStatusFilter}
                onChange={e => setFeeStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
              >
                <option value="all">वर्गणी: सर्व स्थिती</option>
                <option value="Paid">फक्त भरलेले (Paid)</option>
                <option value="Pending">थकबाकी असलेले (Pending)</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-surface rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-zinc-800/60 text-gray-500 font-bold border-b border-gray-100 dark:border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-4">सभासद / फोटो</th>
                    <th className="py-3.5 px-4">पदभार / वर्गवारी</th>
                    <th className="py-3.5 px-4">संपर्क व पत्ता</th>
                    <th className="py-3.5 px-4">रक्तगट</th>
                    <th className="py-3.5 px-4">वार्षिक वर्गणी</th>
                    <th className="py-3.5 px-4 text-right">कृती</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={member.avatar || presetAvatars[0]} 
                            alt={member.name}
                            className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-zinc-700 flex-shrink-0"
                          />
                          <div>
                            <span className="font-black text-main-text block text-sm">{member.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{member.memberId} • वर्ष {member.joinYear}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 bg-orange-100 dark:bg-orange-950/60 text-primary font-bold rounded-md inline-block">
                            {member.designationMr || member.role}
                          </span>
                          <span className="text-[10px] text-gray-500 block">
                            {member.sabhasadType || 'मंडळ सभासद'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <a href={`tel:${member.phone}`} className="font-mono text-gray-700 dark:text-gray-300 hover:text-primary font-bold flex items-center gap-1">
                            <Phone size={11} className="text-primary" /> {member.phone}
                          </a>
                          <span className="text-[10px] text-gray-500 truncate max-w-[150px] block">
                            {member.address || 'पुणे'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-md font-black">
                          {member.bloodGroup}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            member.annualFeeStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}>
                            {member.annualFeeStatus === 'Paid' ? 'भरणा पूर्ण (Paid)' : 'थकबाकी (Pending)'}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono block">
                            ₹{member.feePaidAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEditMember(member)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-lg transition-all"
                            title="Edit Member"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => setDeletingMember(member)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 rounded-lg transition-all"
                            title="Delete Member"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB 2: EXECUTIVE COMMITTEE SHOWCASE */}
      {activeSubTab === 'executive' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {executiveMembers.map((member) => (
              <div 
                key={member.id} 
                className="p-5 bg-surface rounded-3xl border-2 border-amber-400/40 dark:border-amber-700/40 shadow-sm space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase rounded-full">
                    {member.designationMr || member.role}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">{member.memberId}</span>
                </div>

                <div className="flex items-center gap-3">
                  <img 
                    src={member.avatar || presetAvatars[0]} 
                    alt={member.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400"
                  />
                  <div>
                    <h4 className="text-base font-black text-main-text">{member.name}</h4>
                    <p className="text-xs text-gray-500 font-mono">{member.phone}</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">रक्तगट:</span>
                    <span className="font-bold text-rose-600">{member.bloodGroup}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">जबाबदारी:</span>
                    <span className="font-medium text-main-text text-right max-w-[180px] truncate">{member.responsibilities || 'नियोजन'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <a 
                    href={`tel:${member.phone}`}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Phone size={13} /> कॉल करा
                  </a>
                  <button 
                    onClick={() => handleStartEditMember(member)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Edit3 size={13} /> संपादन
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: VOLUNTEER ROSTER */}
      {activeSubTab === 'roster' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-main-text">उत्सव ड्युटी व आरती स्वयंसेवक नियोजन</h3>
            <button 
              onClick={() => setIsAddDutyOpen(true)}
              className="px-4 py-2 bg-primary text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20"
            >
              <UserPlus size={14} /> + नवीन ड्युटी जोडा
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {duties.map((duty) => (
              <div key={duty.id} className="p-5 bg-surface rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-950/60 text-primary rounded-xl text-xs font-bold">
                    {duty.dutyType}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">{duty.date}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-main-text">{duty.volunteerName}</h4>
                    <p className="text-xs text-gray-500 font-mono">{duty.volunteerPhone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">{duty.timeSlot}</span>
                    <span className="text-[11px] text-gray-400">{duty.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-800">
                  <span className="text-[11px] text-gray-400">नेमणूक: {duty.assignedBy}</span>
                  <button 
                    onClick={() => sendWhatsAppReminder(duty)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Send size={12} /> WhatsApp स्मरणपत्र पाठवा
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: BLOOD BANK */}
      {activeSubTab === 'bloodBank' && (
        <div className="space-y-6">
          <div className="p-6 bg-rose-50/70 dark:bg-rose-950/30 rounded-3xl border border-rose-200 dark:border-rose-900/60 space-y-2">
            <h3 className="text-lg font-black text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <Heart className="text-rose-600" size={20} />
              आणीबाणी रक्तदाता डिरेक्टरी (Emergency Blood Group Registry)
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-400">
              गणेशोत्सवाच्या काळात परिसरातील कोणालाही वैद्यकीय आणीबाणी प्रसंगी रक्तदाते तात्काळ उपलब्ध व्हावेत यासाठी मंडळाची रक्तदाता मदत कक्ष सूची.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredMembers.map((m) => (
              <div key={m.id} className="p-4 bg-surface rounded-2xl border border-gray-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-black text-sm">
                    {m.bloodGroup}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-main-text">{m.name}</h5>
                    <p className="text-xs text-gray-500 font-mono">{m.phone}</p>
                  </div>
                </div>

                <a 
                  href={`tel:${m.phone}`}
                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-all"
                  title="Call Volunteer"
                >
                  <Phone size={15} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Sabhasad Modal with Photo Upload */}
      <AnimatePresence>
        {isAddMemberOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-amber-300 dark:border-zinc-800 relative my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-zinc-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 text-primary rounded-xl">
                    <UserPlus size={20} />
                  </div>
                  <h3 className="text-lg font-black text-main-text">नवीन मंडळ सभासद नोंदणी (Add Sabhasad)</h3>
                </div>
                <button onClick={() => setIsAddMemberOpen(false)} className="text-gray-400 hover:text-main-text">✕</button>
              </div>

              <form onSubmit={handleCreateMember} className="space-y-4">
                
                {/* Photo Upload & Preview */}
                <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-200 dark:border-zinc-700 space-y-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    सभासदाचा फोटो (Photo Upload / URL)
                  </label>
                  <div className="flex items-center gap-3">
                    <img 
                      src={memberForm.avatar} 
                      alt="Avatar" 
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-orange-400"
                    />
                    <div className="flex-1 space-y-2">
                      <label className="px-3 py-1 bg-orange-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm">
                        <Upload size={13} />
                        <span>फोटो अपलोड करा</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(e, (url) => setMemberForm({ ...memberForm, avatar: url }))}
                        />
                      </label>
                      <input 
                        type="text" 
                        placeholder="किंवा फोटो URL टाका"
                        value={memberForm.avatar}
                        onChange={e => setMemberForm({ ...memberForm, avatar: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border rounded-xl text-xs text-main-text outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">सभासदाचे पूर्ण नाव *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="उदा. श्री. रोहन दीपक शिंदे"
                    value={memberForm.name}
                    onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-main-text outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">सभासद वर्गवारी (Category) *</label>
                    <select 
                      value={memberForm.sabhasadType}
                      onChange={e => setMemberForm({ ...memberForm, sabhasadType: e.target.value as SabhasadType })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    >
                      <option value="सक्रिय सभासद (Active Member)">सक्रिय सभासद (Active Member)</option>
                      <option value="आजीवन सभासद (Life Member)">आजीवन सभासद (Life Member)</option>
                      <option value="सर्वसाधारण सभासद (General Member)">सर्वसाधारण सभासद (General Member)</option>
                      <option value="मार्गदर्शक / जेष्ठ सभासद (Senior Advisor)">मार्गदर्शक / जेष्ठ सभासद</option>
                      <option value="मुख्य कार्यकारणी सभासद (Executive Board)">मुख्य कार्यकारणी सभासद</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">पद / जबाबदारी लेबल</label>
                    <input 
                      type="text" 
                      placeholder="उदा. मंडळ सभासद / कार्यकर्ते"
                      value={memberForm.designationMr}
                      onChange={e => setMemberForm({ ...memberForm, designationMr: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">मोबाईल नंबर *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="98XXXXXXXX"
                      value={memberForm.phone}
                      onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">रक्तगट (Blood Group)</label>
                    <select 
                      value={memberForm.bloodGroup}
                      onChange={e => setMemberForm({ ...memberForm, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    >
                      <option value="O+ve">O+ve</option>
                      <option value="O-ve">O-ve</option>
                      <option value="A+ve">A+ve</option>
                      <option value="A-ve">A-ve</option>
                      <option value="B+ve">B+ve</option>
                      <option value="B-ve">B-ve</option>
                      <option value="AB+ve">AB+ve</option>
                      <option value="AB-ve">AB-ve</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">पत्ता / पेठ / गाव</label>
                    <input 
                      type="text" 
                      placeholder="उदा. सदाशिव पेठ, पुणे"
                      value={memberForm.address}
                      onChange={e => setMemberForm({ ...memberForm, address: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">वार्षिक वर्गणी भरणा (₹)</label>
                    <input 
                      type="number" 
                      placeholder="2000"
                      value={memberForm.feePaidAmount}
                      onChange={e => setMemberForm({ ...memberForm, feePaidAmount: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">जबाबदारी व कार्यक्षेत्र</label>
                  <input 
                    type="text" 
                    placeholder="उदा. आरती नियोजन, देखावा मदत व विसर्जन सोहळा"
                    value={memberForm.responsibilities}
                    onChange={e => setMemberForm({ ...memberForm, responsibilities: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                  />
                </div>

                <div className="pt-3 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsAddMemberOpen(false)}
                    className="w-1/3 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold"
                  >
                    रद्द करा
                  </button>
                  <button 
                    type="submit"
                    className="w-2/3 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl text-xs font-bold hover:from-orange-700 hover:to-amber-700 flex items-center justify-center gap-1.5 shadow-md shadow-orange-900/20"
                  >
                    <CheckCircle size={15} />
                    सभासद नोंदवा
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Adhyaksh / Executive Bearer Modal with Photo Upload */}
      <AnimatePresence>
        {isAddAdhyakshOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-amber-300 dark:border-zinc-800 relative my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-zinc-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                    <Crown size={20} />
                  </div>
                  <h3 className="text-lg font-black text-main-text">अध्यक्ष व मुख्य पदाधिकारी नेमणूक</h3>
                </div>
                <button onClick={() => setIsAddAdhyakshOpen(false)} className="text-gray-400 hover:text-main-text">✕</button>
              </div>

              <form onSubmit={handleCreateAdhyaksh} className="space-y-4">
                
                {/* Photo Upload & Preview */}
                <div className="p-3 bg-amber-50/70 dark:bg-zinc-800/50 rounded-2xl border border-amber-200 dark:border-zinc-700 space-y-2">
                  <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                    पदाधिकाऱ्याचा फोटो (Photo Upload / URL)
                  </label>
                  <div className="flex items-center gap-3">
                    <img 
                      src={adhyakshForm.avatar} 
                      alt="Avatar" 
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400"
                    />
                    <div className="flex-1 space-y-2">
                      <label className="px-3 py-1 bg-amber-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm">
                        <Upload size={13} />
                        <span>फोटो अपलोड करा</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(e, (url) => setAdhyakshForm({ ...adhyakshForm, avatar: url }))}
                        />
                      </label>
                      <input 
                        type="text" 
                        placeholder="किंवा फोटो URL टाका"
                        value={adhyakshForm.avatar}
                        onChange={e => setAdhyakshForm({ ...adhyakshForm, avatar: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border rounded-xl text-xs text-main-text outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">पदाधिकाऱ्याचे पूर्ण नाव *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="उदा. श्री. विठ्ठलराव जाधव"
                    value={adhyakshForm.name}
                    onChange={e => setAdhyakshForm({ ...adhyakshForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-main-text outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">मंडळातील पद (Designation) *</label>
                    <select 
                      value={adhyakshForm.role}
                      onChange={e => {
                        const r = e.target.value as Member['role'];
                        let des = 'मुख्य कार्यकारणी सभासद';
                        if (r === 'President') des = 'अध्यक्ष (Mandal President)';
                        if (r === 'Working President') des = 'कार्याध्यक्ष (Working President)';
                        if (r === 'Vice President') des = 'उपाध्यक्ष (Vice President)';
                        if (r === 'Secretary') des = 'सरचिटणीस / सचिव (Secretary)';
                        if (r === 'Treasurer') des = 'मुख्य खजिनदार (Treasurer)';
                        if (r === 'Festival Head') des = 'उत्सव नियोजन प्रमुख';
                        if (r === 'Security Head') des = 'सुरक्षा व गर्दी नियंत्रण प्रमुख';
                        if (r === 'Prasad Incharge') des = 'महाप्रसाद वाटप प्रमुख';

                        setAdhyakshForm({
                          ...adhyakshForm,
                          role: r,
                          designationMr: des
                        });
                      }}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    >
                      <option value="President">अध्यक्ष (Mandal President)</option>
                      <option value="Working President">कार्याध्यक्ष (Working President)</option>
                      <option value="Vice President">उपाध्यक्ष (Vice President)</option>
                      <option value="Secretary">सचिव / सरचिटणीस (Secretary)</option>
                      <option value="Treasurer">मुख्य खजिनदार (Treasurer)</option>
                      <option value="Executive Member">मुख्य कार्यकारणी सभासद (Core Member)</option>
                      <option value="Festival Head">उत्सव प्रमुख (Festival Head)</option>
                      <option value="Security Head">सुरक्षा प्रमुख (Security Head)</option>
                      <option value="Prasad Incharge">प्रसाद प्रमुख (Prasad Incharge)</option>
                      <option value="Advisory Board">सल्लागार विश्वस्त (Advisor)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">मराठी पदनाम लेबल</label>
                    <input 
                      type="text" 
                      value={adhyakshForm.designationMr}
                      onChange={e => setAdhyakshForm({ ...adhyakshForm, designationMr: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">मोबाईल नंबर *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="98XXXXXXXX"
                      value={adhyakshForm.phone}
                      onChange={e => setAdhyakshForm({ ...adhyakshForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">रक्तगट (Blood Group)</label>
                    <select 
                      value={adhyakshForm.bloodGroup}
                      onChange={e => setAdhyakshForm({ ...adhyakshForm, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    >
                      <option value="O+ve">O+ve</option>
                      <option value="A+ve">A+ve</option>
                      <option value="B+ve">B+ve</option>
                      <option value="AB+ve">AB+ve</option>
                      <option value="O-ve">O-ve</option>
                      <option value="A-ve">A-ve</option>
                      <option value="B-ve">B-ve</option>
                      <option value="AB-ve">AB-ve</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">जबाबदारी व कार्यक्षेत्र</label>
                  <input 
                    type="text" 
                    placeholder="उदा. मंडळ नेतृत्व, नियोजन, देखावा व शासकीय समन्वय"
                    value={adhyakshForm.responsibilities}
                    onChange={e => setAdhyakshForm({ ...adhyakshForm, responsibilities: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                  />
                </div>

                <div className="pt-3 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsAddAdhyakshOpen(false)}
                    className="w-1/3 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold"
                  >
                    रद्द करा
                  </button>
                  <button 
                    type="submit"
                    className="w-2/3 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-bold hover:from-amber-600 hover:to-orange-700 flex items-center justify-center gap-1.5 shadow-md shadow-amber-900/20"
                  >
                    <Crown size={15} />
                    नेमणूक जतन करा
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Member Modal with Photo Upload */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-blue-400 dark:border-zinc-800 relative my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-zinc-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                    <Edit3 size={20} />
                  </div>
                  <h3 className="text-lg font-black text-main-text">सभासद माहिती संपादन</h3>
                </div>
                <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-main-text">✕</button>
              </div>

              <form onSubmit={handleSaveEditMember} className="space-y-4">
                
                {/* Photo Upload & Preview */}
                <div className="p-3 bg-blue-50/70 dark:bg-zinc-800/50 rounded-2xl border border-blue-200 dark:border-zinc-700 space-y-2">
                  <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                    सभासदाचा फोटो (Photo Upload / URL)
                  </label>
                  <div className="flex items-center gap-3">
                    <img 
                      src={editFormData.avatar || presetAvatars[0]} 
                      alt="Avatar" 
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-blue-400"
                    />
                    <div className="flex-1 space-y-2">
                      <label className="px-3 py-1 bg-blue-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm">
                        <Upload size={13} />
                        <span>नवीन फोटो अपलोड करा</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(e, (url) => setEditFormData({ ...editFormData, avatar: url }))}
                        />
                      </label>
                      <input 
                        type="text" 
                        placeholder="किंवा फोटो URL टाका"
                        value={editFormData.avatar}
                        onChange={e => setEditFormData({ ...editFormData, avatar: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border rounded-xl text-xs text-main-text outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">पूर्ण नाव *</label>
                  <input 
                    type="text" 
                    required
                    value={editFormData.name}
                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-main-text outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">मंडळातील पदभार (Role)</label>
                    <select 
                      value={editFormData.role}
                      onChange={e => setEditFormData({ ...editFormData, role: e.target.value as any })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    >
                      <option value="President">अध्यक्ष (President)</option>
                      <option value="Working President">कार्याध्यक्ष (Working President)</option>
                      <option value="Vice President">उपाध्यक्ष (Vice President)</option>
                      <option value="Secretary">सचिव / चिटणीस (Secretary)</option>
                      <option value="Treasurer">खजिनदार (Treasurer)</option>
                      <option value="Executive Member">मुख्य कार्यकारणी सभासद</option>
                      <option value="Committee Member">कार्यकारिणी सदस्य</option>
                      <option value="Volunteer">स्वयंसेवक (Volunteer)</option>
                      <option value="Advisory Board">सल्लागार मंडळ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">पदनाम लेबल</label>
                    <input 
                      type="text" 
                      value={editFormData.designationMr}
                      onChange={e => setEditFormData({ ...editFormData, designationMr: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">मोबाईल नंबर *</label>
                    <input 
                      type="tel" 
                      required
                      value={editFormData.phone}
                      onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">रक्तगट</label>
                    <select 
                      value={editFormData.bloodGroup}
                      onChange={e => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    >
                      <option value="O+ve">O+ve</option>
                      <option value="A+ve">A+ve</option>
                      <option value="B+ve">B+ve</option>
                      <option value="AB+ve">AB+ve</option>
                      <option value="O-ve">O-ve</option>
                      <option value="A-ve">A-ve</option>
                      <option value="B-ve">B-ve</option>
                      <option value="AB-ve">AB-ve</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">पत्ता</label>
                    <input 
                      type="text" 
                      value={editFormData.address}
                      onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">वर्गणी स्थिती</label>
                    <select 
                      value={editFormData.annualFeeStatus}
                      onChange={e => setEditFormData({ ...editFormData, annualFeeStatus: e.target.value as any })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    >
                      <option value="Paid">भरणा पूर्ण (Paid)</option>
                      <option value="Pending">थकबाकी (Pending)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setEditingMember(null)}
                    className="w-1/3 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold"
                  >
                    रद्द करा
                  </button>
                  <button 
                    type="submit"
                    className="w-2/3 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/20"
                  >
                    <CheckCircle size={15} />
                    बदल साठवा
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Member Confirmation Modal */}
      <AnimatePresence>
        {deletingMember && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Trash2 size={24} />
              </div>
              <div>
                <h4 className="text-base font-black text-main-text">सभासद नोंद हटवायची आहे का?</h4>
                <p className="text-xs text-gray-500 mt-1">
                  तुम्ही <strong>{deletingMember.name}</strong> ({deletingMember.memberId}) यांची नोंद कायमची काढून टाकत आहात.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setDeletingMember(null)}
                  className="w-1/2 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold"
                >
                  रद्द करा
                </button>
                <button 
                  onClick={handleConfirmDeleteMember}
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/20"
                >
                  होय, हटवा
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Duty Modal */}
      <AnimatePresence>
        {isAddDutyOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-zinc-800 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800">
                <h4 className="font-black text-base text-main-text">नवीन उत्सव ड्युटी सोपवा</h4>
                <button onClick={() => setIsAddDutyOpen(false)} className="text-gray-400">✕</button>
              </div>

              <form onSubmit={handleCreateDuty} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">स्वयंसेवकाचे नाव *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="उदा. राहुल शिंदे"
                    value={dutyForm.volunteerName}
                    onChange={e => setDutyForm({ ...dutyForm, volunteerName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">मोबाईल नंबर *</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="98XXXXXXXX"
                    value={dutyForm.volunteerPhone}
                    onChange={e => setDutyForm({ ...dutyForm, volunteerPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">ड्युटी प्रकार</label>
                  <select 
                    value={dutyForm.dutyType}
                    onChange={e => setDutyForm({ ...dutyForm, dutyType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border rounded-xl"
                  >
                    <option value="Morning Aarti">Morning Aarti (सकाळ आरती)</option>
                    <option value="Evening Aarti">Evening Aarti (संध्याकाळ आरती)</option>
                    <option value="Night Security">Night Security (रात्र सुरक्षा)</option>
                    <option value="Crowd Control">Crowd Control (गर्दी नियंत्रण व रांग)</option>
                    <option value="Prasad Distribution">Prasad Distribution (प्रसाद वाटप)</option>
                    <option value="VIP Escort">VIP Escort (महत्त्वाचे पाहुणे स्वागत)</option>
                    <option value="Traffic Management">Traffic Management (वाहतूक सहकार्य)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">दिनांक</label>
                    <input 
                      type="date" 
                      value={dutyForm.date}
                      onChange={e => setDutyForm({ ...dutyForm, date: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">वेळ</label>
                    <input 
                      type="text" 
                      value={dutyForm.timeSlot}
                      onChange={e => setDutyForm({ ...dutyForm, timeSlot: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">ठिकाण</label>
                  <input 
                    type="text" 
                    value={dutyForm.location}
                    onChange={e => setDutyForm({ ...dutyForm, location: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border rounded-xl"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsAddDutyOpen(false)}
                    className="w-1/3 py-2.5 bg-gray-100 dark:bg-zinc-800 rounded-xl"
                  >
                    रद्द
                  </button>
                  <button 
                    type="submit"
                    className="w-2/3 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md shadow-primary/20"
                  >
                    ड्युटी सोपवा
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
