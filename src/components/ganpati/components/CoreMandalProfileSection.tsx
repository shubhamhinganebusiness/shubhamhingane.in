import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  Award, 
  Phone, 
  Mail, 
  MapPin, 
  Instagram, 
  Youtube, 
  Facebook, 
  MessageSquare, 
  Sparkles, 
  Clock, 
  Bell, 
  Plus, 
  Share2, 
  ShieldCheck, 
  HeartHandshake, 
  Calendar,
  Flame,
  Edit3,
  CheckCircle2,
  Users,
  UserPlus,
  Crown,
  ShieldAlert,
  Wallet,
  Settings,
  Upload,
  Image as ImageIcon,
  Check,
  Building2,
  UserCheck,
  Landmark,
  BadgePercent,
  TrendingUp,
  CreditCard,
  Smartphone,
  Banknote
} from 'lucide-react';
import { MandalProfile, Announcement, MandalLanguage, Member } from '../types';
import { mandalTranslations } from '../translations/mandalTranslations';

interface CoreMandalProfileSectionProps {
  mandal: MandalProfile;
  announcements: Announcement[];
  members: Member[];
  lang: MandalLanguage;
  onAddAnnouncement: (announcement: Omit<Announcement, 'id'>) => void;
  onUpdateMandal: (updatedMandal: MandalProfile) => void;
  onAddMember: (newMember: Omit<Member, 'id'>) => void;
  onUpdateMember: (updatedMember: Member) => void;
  userRole: string;
}

export const CoreMandalProfileSection: React.FC<CoreMandalProfileSectionProps> = ({
  mandal,
  announcements,
  members,
  lang,
  onAddAnnouncement,
  onUpdateMandal,
  onAddMember,
  onUpdateMember,
  userRole
}) => {
  const t = mandalTranslations[lang];
  const [newNoticeText, setNewNoticeText] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<'Event' | 'Urgent' | 'Traffic' | 'Prasad'>('Event');
  const [isAddingNotice, setIsAddingNotice] = useState(false);

  // Mandal Edit Modal State
  const [isEditMandalOpen, setIsEditMandalOpen] = useState(false);
  const [editMandalTab, setEditMandalTab] = useState<'basic' | 'committee' | 'theme' | 'bank'>('basic');
  const [mandalFormData, setMandalFormData] = useState<MandalProfile>(mandal);

  // Executive Bearer / Mukhya Sabhasad Add Modal State
  const [isAddOfficeBearerOpen, setIsAddOfficeBearerOpen] = useState(false);
  const [bearerForm, setBearerForm] = useState({
    name: '',
    role: 'Executive Member' as Member['role'],
    designationMr: 'मुख्य कार्यकारणी सदस्य / उत्सव प्रमुख',
    phone: '',
    email: '',
    bloodGroup: 'O+ve',
    address: 'सदाशिव पेठ, पुणे',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    responsibilities: 'उत्सव नियोजन, महाप्रसाद व स्वयंसेवक व्यवस्था'
  });

  // Preset Avatar Options
  const presetAvatars = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
  ];

  // Preset Logo Options
  const presetLogos = [
    'https://images.unsplash.com/photo-1567591414240-e2b2029707e5?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1609358905593-1d2ff2886f4a?auto=format&fit=crop&q=80&w=200'
  ];

  // Photo File Upload Helper (FileReader)
  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (base64Url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('कृपया 3MB पेक्षा लहान आकाराचा फोटो निवडा.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onSuccess(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeText.trim()) return;

    onAddAnnouncement({
      titleMr: newNoticeText.trim(),
      titleEn: newNoticeText.trim(),
      category: noticeCategory,
      timestamp: 'Just now',
      isActive: true
    });

    setNewNoticeText('');
    setIsAddingNotice(false);
  };

  const handleSaveMandalProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mandalFormData.nameMr.trim()) {
      alert('कृपया मंडळाचे नाव भरा.');
      return;
    }
    onUpdateMandal(mandalFormData);
    setIsEditMandalOpen(false);
  };

  const handleCreateOfficeBearer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bearerForm.name.trim() || !bearerForm.phone.trim()) {
      alert('कृपया नाव आणि मोबाईल नंबर भरा.');
      return;
    }

    const nextId = `SHIV-EX${String(members.length + 1).padStart(3, '0')}`;
    
    // Create new executive member
    onAddMember({
      memberId: nextId,
      name: bearerForm.name.trim(),
      role: bearerForm.role,
      designationMr: bearerForm.designationMr.trim(),
      sabhasadType: 'मुख्य कार्यकारणी सभासद (Executive Board)',
      isExecutiveBearer: true,
      executiveRank: bearerForm.role === 'President' ? 1 : bearerForm.role === 'Working President' ? 2 : bearerForm.role === 'Vice President' ? 3 : 5,
      phone: bearerForm.phone.trim(),
      email: bearerForm.email.trim() || `${nextId.toLowerCase()}@shivtejmandal.org`,
      bloodGroup: bearerForm.bloodGroup,
      address: bearerForm.address.trim(),
      joinYear: 2026,
      avatar: bearerForm.avatar,
      annualFeeStatus: 'Paid',
      feePaidAmount: 3000,
      dueAmount: 0,
      responsibilities: bearerForm.responsibilities
    });

    // If role is President, Secretary or Treasurer, update mandal profile too
    if (bearerForm.role === 'President') {
      onUpdateMandal({ ...mandal, presidentName: bearerForm.name.trim() });
    } else if (bearerForm.role === 'Secretary') {
      onUpdateMandal({ ...mandal, secretaryName: bearerForm.name.trim() });
    } else if (bearerForm.role === 'Treasurer') {
      onUpdateMandal({ ...mandal, treasurerName: bearerForm.name.trim() });
    }

    setIsAddOfficeBearerOpen(false);
    setBearerForm({
      name: '',
      role: 'Executive Member',
      designationMr: 'मुख्य कार्यकारणी सदस्य / उत्सव प्रमुख',
      phone: '',
      email: '',
      bloodGroup: 'O+ve',
      address: 'सदाशिव पेठ, पुणे',
      avatar: presetAvatars[0],
      responsibilities: 'उत्सव नियोजन, महाप्रसाद व स्वयंसेवक व्यवस्था'
    });
  };

  // Filter executive office bearers
  const executiveMembers = members.filter(m => m.isExecutiveBearer || ['President', 'Vice President', 'Working President', 'Secretary', 'Treasurer', 'Executive Member'].includes(m.role));

  return (
    <div className="space-y-8">
      
      {/* Real-time Notice Ticker */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white shadow-lg p-3 sm:p-4 flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-xl text-xs font-black uppercase tracking-wider flex-shrink-0 animate-pulse">
          <Bell size={14} className="text-amber-200" />
          <span>सूचना / Live Ticker</span>
        </div>

        <div className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-none">
          <div className="inline-flex gap-8 text-xs font-medium tracking-wide">
            {announcements.map((ann) => (
              <span key={ann.id} className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-300 inline-block" />
                {lang === 'mr' ? ann.titleMr : ann.titleEn}
              </span>
            ))}
          </div>
        </div>

        {userRole === 'admin' && (
          <button 
            onClick={() => setIsAddingNotice(!isAddingNotice)}
            className="p-1.5 bg-black/20 hover:bg-black/30 rounded-xl text-xs font-bold flex-shrink-0 flex items-center gap-1 cursor-pointer"
            title="Post New Announcement"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">नवीन सूचना</span>
          </button>
        )}
      </div>

      {/* Admin Notice Poster Box */}
      {isAddingNotice && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-5 bg-surface rounded-3xl border border-amber-300 dark:border-amber-900/60 shadow-sm"
        >
          <form onSubmit={handlePostNotice} className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              placeholder="नवीन सूचना / आरती / विसर्जन वेळ अपडेट लिहा..."
              value={newNoticeText}
              onChange={e => setNewNoticeText(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
            />
            <select 
              value={noticeCategory}
              onChange={e => setNoticeCategory(e.target.value as any)}
              className="px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text"
            >
              <option value="Event">Event (कार्यक्रम)</option>
              <option value="Urgent">Urgent (तातडीची)</option>
              <option value="Traffic">Traffic (वाहतूक/पार्किंग)</option>
              <option value="Prasad">Prasad (महाप्रसाद)</option>
            </select>
            <button 
              type="submit"
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90"
            >
              प्रसारित करा
            </button>
          </form>
        </motion.div>
      )}

      {/* Mandal Grand Hero Card */}
      <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent border-2 border-amber-500/30 p-6 md:p-10 shadow-sm">
        
        {/* Mandal Edit Trigger Button for Admin */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm">
              स्थापना वर्ष {mandal.establishedYear} • {new Date().getFullYear() - mandal.establishedYear} वे वर्ष
            </span>
            <span className="px-3.5 py-1.5 bg-surface border border-amber-300 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 rounded-full text-[11px] font-bold">
              नोंदणी क्र: {mandal.regNumber}
            </span>
          </div>

          <button 
            onClick={() => {
              setMandalFormData(mandal);
              setIsEditMandalOpen(true);
            }}
            className="px-5 py-2.5 bg-white dark:bg-zinc-800 border-2 border-orange-400 dark:border-zinc-700 text-primary hover:bg-orange-500 hover:text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer"
            title="Edit Mandal Name, Tagline, Logo & Profile"
          >
            <Edit3 size={16} />
            <span>मंडळ नाव, घोषवाक्य व लोगो बदला (Edit)</span>
          </button>
        </div>

        {/* Mandal Title with Logo & Tagline */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5 pb-6 border-b border-amber-500/20">
          {mandal.logoUrl ? (
            <img 
              src={mandal.logoUrl} 
              alt={mandal.nameMr} 
              className="w-20 h-20 md:w-24 md:h-24 rounded-3xl object-cover border-2 border-amber-400 shadow-md bg-white p-1"
            />
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-black text-3xl shadow-lg border-2 border-amber-300">
              🚩
            </div>
          )}

          <div className="space-y-1.5 flex-1">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-main-text tracking-tighter leading-tight">
              {lang === 'mr' ? mandal.nameMr : mandal.nameEn}
            </h2>
            
            {/* Tagline / घोषवाक्य */}
            <p className="text-base md:text-lg font-bold text-orange-600 dark:text-orange-400 italic">
              {mandal.taglineMr || '॥ सामाजिक प्रबोधन, सांस्कृतिक वारसा व लोकमान्य परंपरा ॥'}
            </p>

            {mandal.slogan && (
              <p className="text-xs md:text-sm font-semibold text-gray-500">
                {mandal.slogan}
              </p>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CRITICAL FEATURE: मंडळ अध्यक्ष व मुख्य कार्यकारिणी पदाधिकारी DETAILS BELOW MANDAL NAME */}
        {/* ========================================================================= */}
        <div className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm md:text-base font-black text-main-text flex items-center gap-2 uppercase tracking-wide">
              <Crown className="text-amber-500" size={18} />
              मंडळ अध्यक्ष व मुख्य कार्यकारिणी पदाधिकारी (Executive Committee)
            </h3>
            <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">
              थेट संपर्क व अधिकृत नेतृत्व
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* 1. Mandal President */}
            <div className="p-4 bg-white dark:bg-zinc-900/90 rounded-2xl border-2 border-amber-400 dark:border-amber-600 shadow-sm space-y-2.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase rounded-full tracking-wider flex items-center gap-1">
                  <Crown size={11} /> अध्यक्ष (President)
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">सर्वोच्च पद</span>
              </div>
              <div className="flex items-center gap-3">
                <img 
                  src={mandal.presidentName.includes('राजेंद्र') ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200" : (executiveMembers.find(m => m.role === 'President')?.avatar || presetAvatars[0])}
                  alt={mandal.presidentName}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-main-text truncate">{mandal.presidentName}</h4>
                  <a href={`tel:${mandal.phone}`} className="text-xs text-gray-500 hover:text-primary font-mono flex items-center gap-1">
                    <Phone size={11} className="text-amber-500" /> {mandal.phone}
                  </a>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 bg-amber-50/70 dark:bg-zinc-800/60 p-2 rounded-xl">
                मंडळाचे सर्व प्रशासकीय निर्णय, धर्मादाय व्यवहार व सार्वजनिक उत्सव नेतृत्व.
              </p>
            </div>

            {/* 2. Mandal Secretary */}
            <div className="p-4 bg-white dark:bg-zinc-900/90 rounded-2xl border-2 border-blue-400/80 dark:border-blue-600 shadow-sm space-y-2.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase rounded-full tracking-wider flex items-center gap-1">
                  सचिव / सरचिटणीस
                </span>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">प्रशासन</span>
              </div>
              <div className="flex items-center gap-3">
                <img 
                  src={mandal.secretaryName.includes('सचिन') ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200" : (executiveMembers.find(m => m.role === 'Secretary')?.avatar || presetAvatars[1])}
                  alt={mandal.secretaryName}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-blue-400 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-main-text truncate">{mandal.secretaryName}</h4>
                  <p className="text-xs text-gray-500 font-mono flex items-center gap-1">
                    <Phone size={11} className="text-blue-500" /> +91 98223 90123
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 bg-blue-50/70 dark:bg-zinc-800/60 p-2 rounded-xl">
                पोलीस परवानग्या, पावती बहीखाता नियंत्रण, पत्रव्यवहार व उत्सव नियोजन.
              </p>
            </div>

            {/* 3. Mandal Treasurer */}
            <div className="p-4 bg-white dark:bg-zinc-900/90 rounded-2xl border-2 border-emerald-400/80 dark:border-emerald-600 shadow-sm space-y-2.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black uppercase rounded-full tracking-wider flex items-center gap-1">
                  मुख्य खजिनदार (Treasurer)
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">हिशोब</span>
              </div>
              <div className="flex items-center gap-3">
                <img 
                  src={mandal.treasurerName.includes('महेश') ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200" : (executiveMembers.find(m => m.role === 'Treasurer')?.avatar || presetAvatars[2])}
                  alt={mandal.treasurerName}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-main-text truncate">{mandal.treasurerName}</h4>
                  <p className="text-xs text-gray-500 font-mono flex items-center gap-1">
                    <Phone size={11} className="text-emerald-500" /> +91 98224 81729
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 bg-emerald-50/70 dark:bg-zinc-800/60 p-2 rounded-xl">
                दैनिक देणगी जमा-खर्च ऑडिट, बँक व्यवहार व पावती पुस्तक पडताळणी.
              </p>
            </div>

            {/* 4. Working President / Other Key Bearer */}
            <div className="p-4 bg-white dark:bg-zinc-900/90 rounded-2xl border-2 border-purple-400/80 dark:border-purple-600 shadow-sm space-y-2.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-black uppercase rounded-full tracking-wider flex items-center gap-1">
                  कार्याध्यक्ष / उपाध्यक्ष
                </span>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">समन्वय</span>
              </div>
              <div className="flex items-center gap-3">
                <img 
                  src={executiveMembers.find(m => m.role === 'Working President' || m.role === 'Vice President')?.avatar || presetAvatars[3]}
                  alt="कार्याध्यक्ष"
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-purple-400 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-main-text truncate">
                    {executiveMembers.find(m => m.role === 'Working President' || m.role === 'Vice President')?.name || 'श्री. विकास (भाऊ) शिर्के'}
                  </h4>
                  <p className="text-xs text-gray-500 font-mono flex items-center gap-1">
                    <Phone size={11} className="text-purple-500" /> +91 98228 11223
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 bg-purple-50/70 dark:bg-zinc-800/60 p-2 rounded-xl">
                मंडप, रोषणाई, महाआरती व विसर्जन मिरवणूक प्रत्यक्ष व्यवस्थापन.
              </p>
            </div>

          </div>
        </div>

        {/* History and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-8 mt-6 border-t border-amber-500/20">
          <div className="lg:col-span-8 space-y-4">
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              {lang === 'mr' ? mandal.historyMr : mandal.historyEn}
            </p>

            {/* Address and Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-primary flex-shrink-0" />
                <span>{lang === 'mr' ? mandal.addressMr : mandal.addressEn}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-primary flex-shrink-0" />
                <span className="font-mono">{mandal.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-primary flex-shrink-0" />
                <span>{mandal.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-primary flex-shrink-0" />
                <span>UPI: <span className="font-mono font-bold text-main-text">{mandal.upiId}</span></span>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-amber-500/20">
              <a 
                href={mandal.socials.instagram} 
                target="_blank" 
                rel="noreferrer" 
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-90 shadow-sm"
              >
                <Instagram size={14} /> Instagram
              </a>
              <a 
                href={mandal.socials.youtube} 
                target="_blank" 
                rel="noreferrer" 
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-red-700 shadow-sm"
              >
                <Youtube size={14} /> YouTube Live
              </a>
              <a 
                href={mandal.socials.facebook} 
                target="_blank" 
                rel="noreferrer" 
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 shadow-sm"
              >
                <Facebook size={14} /> Facebook
              </a>
              <a 
                href={mandal.socials.whatsappGroup} 
                target="_blank" 
                rel="noreferrer" 
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-700 shadow-sm"
              >
                <MessageSquare size={14} /> उत्सव WhatsApp ग्रुप
              </a>
            </div>
          </div>

          {/* Theme Visual Spotlight */}
          <div className="lg:col-span-4 bg-surface p-6 rounded-[2.5rem] border border-amber-200 dark:border-amber-900/50 shadow-md space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Sparkles size={16} /> या वर्षीचा मुख्य देखावा (Yearly Theme)
            </div>

            <h3 className="text-xl font-black text-main-text leading-snug">
              {lang === 'mr' ? mandal.themeTitleMr : mandal.themeTitleEn}
            </h3>

            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {lang === 'mr' ? mandal.themeDescriptionMr : mandal.themeDescriptionEn}
            </p>

            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-800 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">मूर्तीची उंची:</span>
                <span className="font-bold text-main-text">{mandal.idolHeight}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">मूर्तिकार:</span>
                <span className="font-bold text-main-text">{mandal.sculptorName}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Mandal Edit Modal with Logo Upload / URL / Tagline */}
      <AnimatePresence>
        {isEditMandalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-amber-300 dark:border-zinc-800 relative my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800 mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-main-text">मंडळ नाव, घोषवाक्य, लोगो व माहिती संपादन</h3>
                    <p className="text-xs text-gray-500">येथे केलेले बदल संपूर्ण सिस्टीम, पावती व अहवालांमध्ये लागू होतील.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditMandalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl"
                >
                  ✕
                </button>
              </div>

              {/* Edit Sub-tabs */}
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-zinc-800 rounded-2xl mb-6 text-xs font-bold overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setEditMandalTab('basic')}
                  className={`px-3.5 py-2 rounded-xl transition-all ${editMandalTab === 'basic' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-main-text'}`}
                >
                  १. नाव, घोषवाक्य व लोगो
                </button>
                <button
                  type="button"
                  onClick={() => setEditMandalTab('committee')}
                  className={`px-3.5 py-2 rounded-xl transition-all ${editMandalTab === 'committee' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-main-text'}`}
                >
                  २. अध्यक्ष व मुख्य पदाधिकारी
                </button>
                <button
                  type="button"
                  onClick={() => setEditMandalTab('theme')}
                  className={`px-3.5 py-2 rounded-xl transition-all ${editMandalTab === 'theme' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-main-text'}`}
                >
                  ३. उत्सव देखावा व मूर्ती
                </button>
                <button
                  type="button"
                  onClick={() => setEditMandalTab('bank')}
                  className={`px-3.5 py-2 rounded-xl transition-all ${editMandalTab === 'bank' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-main-text'}`}
                >
                  ४. बँक व संपर्क माहिती
                </button>
              </div>

              <form onSubmit={handleSaveMandalProfile} className="space-y-4">
                
                {/* TAB 1: BASIC INFO, NAME, TAGLINE, LOGO */}
                {editMandalTab === 'basic' && (
                  <div className="space-y-4">
                    
                    {/* Mandal Logo Upload / URL */}
                    <div className="p-4 bg-orange-50/60 dark:bg-zinc-800/70 rounded-2xl border border-orange-200 dark:border-zinc-700 space-y-3">
                      <label className="block text-xs font-black text-gray-800 dark:text-gray-200">
                        मंडळ लोगो (Mandal Logo / Emblem)
                      </label>
                      <div className="flex items-center gap-4">
                        {mandalFormData.logoUrl ? (
                          <img 
                            src={mandalFormData.logoUrl} 
                            alt="Logo" 
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-400 bg-white p-1"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-orange-200 text-orange-800 flex items-center justify-center font-bold text-xl">
                            🚩
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="px-3 py-1.5 bg-orange-600 text-white hover:bg-orange-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm">
                              <Upload size={14} />
                              <span>डिव्हाइसमधून लोगो अपलोड करा</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden"
                                onChange={(e) => handlePhotoUpload(e, (url) => setMandalFormData({ ...mandalFormData, logoUrl: url }))}
                              />
                            </label>
                            {mandalFormData.logoUrl && (
                              <button 
                                type="button" 
                                onClick={() => setMandalFormData({ ...mandalFormData, logoUrl: '' })}
                                className="px-3 py-1.5 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold"
                              >
                                लोगो काढा
                              </button>
                            )}
                          </div>

                          {/* Logo URL Input */}
                          <input 
                            type="text" 
                            placeholder="किंवा लोगो इमेज URL टाका (https://...)" 
                            value={mandalFormData.logoUrl || ''} 
                            onChange={e => setMandalFormData({ ...mandalFormData, logoUrl: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                          />
                        </div>
                      </div>

                      {/* Preset logos */}
                      <div className="pt-2">
                        <span className="text-[10px] text-gray-500 font-bold block mb-1">पर्यायी रेडीमेड लोगो निवडा:</span>
                        <div className="flex gap-2">
                          {presetLogos.map((p, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setMandalFormData({ ...mandalFormData, logoUrl: p })}
                              className="w-8 h-8 rounded-xl overflow-hidden border border-orange-400 hover:scale-105 transition-all"
                            >
                              <img src={p} alt="Preset" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">मंडळाचे नाव (मराठी) *</label>
                      <input 
                        type="text" 
                        required
                        value={mandalFormData.nameMr}
                        onChange={e => setMandalFormData({ ...mandalFormData, nameMr: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-main-text outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Mandal Name (English)</label>
                      <input 
                        type="text" 
                        value={mandalFormData.nameEn}
                        onChange={e => setMandalFormData({ ...mandalFormData, nameEn: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">मंडळाचे घोषवाक्य / ब्रीदवाक्य (Tagline)</label>
                      <input 
                        type="text" 
                        placeholder="उदा. ॥ सामाजिक प्रबोधन, सांस्कृतिक वारसा व लोकमान्य परंपरा ॥"
                        value={mandalFormData.taglineMr || ''}
                        onChange={e => setMandalFormData({ ...mandalFormData, taglineMr: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-orange-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">उत्सव संदेश / स्लोगन (Slogan)</label>
                      <input 
                        type="text" 
                        placeholder="उदा. ॥ एकजुटीने उत्सव करूया, समाज समृद्ध घडवूया ॥"
                        value={mandalFormData.slogan || ''}
                        onChange={e => setMandalFormData({ ...mandalFormData, slogan: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">धर्मादाय नोंदणी क्र.</label>
                        <input 
                          type="text" 
                          value={mandalFormData.regNumber}
                          onChange={e => setMandalFormData({ ...mandalFormData, regNumber: e.target.value })}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">स्थापना वर्ष</label>
                        <input 
                          type="number" 
                          value={mandalFormData.establishedYear}
                          onChange={e => setMandalFormData({ ...mandalFormData, establishedYear: Number(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">मंडळाचा इतिहास व माहिती</label>
                      <textarea 
                        rows={3}
                        value={mandalFormData.historyMr}
                        onChange={e => setMandalFormData({ ...mandalFormData, historyMr: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: COMMITTEE LEADERSHIP */}
                {editMandalTab === 'committee' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">मंडळ अध्यक्ष (President Name) *</label>
                      <input 
                        type="text" 
                        required
                        value={mandalFormData.presidentName}
                        onChange={e => setMandalFormData({ ...mandalFormData, presidentName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-main-text outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">सरचिटणीस / सचिव (Secretary Name) *</label>
                      <input 
                        type="text" 
                        required
                        value={mandalFormData.secretaryName}
                        onChange={e => setMandalFormData({ ...mandalFormData, secretaryName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-main-text outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">मुख्य खजिनदार (Treasurer Name) *</label>
                      <input 
                        type="text" 
                        required
                        value={mandalFormData.treasurerName}
                        onChange={e => setMandalFormData({ ...mandalFormData, treasurerName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-main-text outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: THEME */}
                {editMandalTab === 'theme' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">या वर्षीचा मुख्य देखावा (Theme Title)</label>
                      <input 
                        type="text" 
                        value={mandalFormData.themeTitleMr}
                        onChange={e => setMandalFormData({ ...mandalFormData, themeTitleMr: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-main-text outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">देखावा माहिती (Theme Details)</label>
                      <textarea 
                        rows={3}
                        value={mandalFormData.themeDescriptionMr}
                        onChange={e => setMandalFormData({ ...mandalFormData, themeDescriptionMr: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">मूर्तीची उंची</label>
                        <input 
                          type="text" 
                          value={mandalFormData.idolHeight}
                          onChange={e => setMandalFormData({ ...mandalFormData, idolHeight: e.target.value })}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">मूर्तिकार</label>
                        <input 
                          type="text" 
                          value={mandalFormData.sculptorName}
                          onChange={e => setMandalFormData({ ...mandalFormData, sculptorName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: BANK & CONTACTS */}
                {editMandalTab === 'bank' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">अधिकृत फोन नंबर</label>
                        <input 
                          type="text" 
                          value={mandalFormData.phone}
                          onChange={e => setMandalFormData({ ...mandalFormData, phone: e.target.value })}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ईमेल</label>
                        <input 
                          type="email" 
                          value={mandalFormData.email}
                          onChange={e => setMandalFormData({ ...mandalFormData, email: e.target.value })}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">मंडळाचा पत्ता (मराठी)</label>
                      <input 
                        type="text" 
                        value={mandalFormData.addressMr}
                        onChange={e => setMandalFormData({ ...mandalFormData, addressMr: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">UPI ID (पावती व देणगीसाठी)</label>
                      <input 
                        type="text" 
                        value={mandalFormData.upiId}
                        onChange={e => setMandalFormData({ ...mandalFormData, upiId: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold text-main-text outline-none"
                      />
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-200 dark:border-zinc-700 space-y-3">
                      <h4 className="text-xs font-black text-main-text">बँक खाते तपशील (Bank Account)</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-0.5">खाते नाव</label>
                          <input 
                            type="text" 
                            value={mandalFormData.bankDetails.accountName}
                            onChange={e => setMandalFormData({ ...mandalFormData, bankDetails: { ...mandalFormData.bankDetails, accountName: e.target.value } })}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-0.5">खाते क्रमांक</label>
                          <input 
                            type="text" 
                            value={mandalFormData.bankDetails.accountNumber}
                            onChange={e => setMandalFormData({ ...mandalFormData, bankDetails: { ...mandalFormData.bankDetails, accountNumber: e.target.value } })}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3 border-t border-gray-100 dark:border-zinc-800">
                  <button 
                    type="button" 
                    onClick={() => setIsEditMandalOpen(false)}
                    className="w-1/3 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-bold"
                  >
                    रद्द करा
                  </button>
                  <button 
                    type="submit"
                    className="w-2/3 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20"
                  >
                    <CheckCircle2 size={16} />
                    बदल साठवा (Save Changes)
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Executive Officer Modal with Photo Upload */}
      <AnimatePresence>
        {isAddOfficeBearerOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-amber-300 dark:border-zinc-800 relative my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl">
                    <Crown size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-main-text">+ अध्यक्ष व मुख्य पदाधिकारी नेमणूक</h3>
                    <p className="text-xs text-gray-500">नवीन अध्यक्ष, उपाध्यक्ष, सचिव किंवा मुख्य कार्यकारणी सदस्य जोडा.</p>
                  </div>
                </div>
                <button onClick={() => setIsAddOfficeBearerOpen(false)} className="text-gray-400 hover:text-main-text">✕</button>
              </div>

              <form onSubmit={handleCreateOfficeBearer} className="space-y-4">
                
                {/* Photo Upload & Preview */}
                <div className="p-4 bg-amber-50/60 dark:bg-zinc-800/70 rounded-2xl border border-amber-200 dark:border-zinc-700 space-y-3">
                  <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                    पदाधिकाऱ्याचा फोटो (Photo Upload / URL)
                  </label>
                  <div className="flex items-center gap-3">
                    <img 
                      src={bearerForm.avatar} 
                      alt="Avatar" 
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400"
                    />
                    <div className="flex-1 space-y-2">
                      <label className="px-3 py-1.5 bg-amber-600 text-white hover:bg-amber-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm">
                        <Upload size={14} />
                        <span>फोटो निवडा (Upload)</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(e, (url) => setBearerForm({ ...bearerForm, avatar: url }))}
                        />
                      </label>
                      <input 
                        type="text" 
                        placeholder="किंवा फोटो URL टाका"
                        value={bearerForm.avatar}
                        onChange={e => setBearerForm({ ...bearerForm, avatar: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border rounded-xl text-xs text-main-text outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">पदाधिकाऱ्याचे संपूर्ण नाव *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="उदा. श्री. राहुल वसंतराव शिंदे"
                    value={bearerForm.name}
                    onChange={e => setBearerForm({ ...bearerForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-main-text outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">पद / हुद्दा (Designation)</label>
                    <select 
                      value={bearerForm.role}
                      onChange={e => {
                        const r = e.target.value as Member['role'];
                        let des = 'मुख्य कार्यकारणी सदस्य';
                        if (r === 'President') des = 'मंडळ अध्यक्ष';
                        else if (r === 'Working President') des = 'कार्याध्यक्ष';
                        else if (r === 'Vice President') des = 'उपाध्यक्ष';
                        else if (r === 'Secretary') des = 'सरचिटणीस / सचिव';
                        else if (r === 'Treasurer') des = 'मुख्य खजिनदार';
                        setBearerForm({ ...bearerForm, role: r, designationMr: des });
                      }}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-main-text outline-none"
                    >
                      <option value="President">अध्यक्ष (President)</option>
                      <option value="Working President">कार्याध्यक्ष (Working President)</option>
                      <option value="Vice President">उपाध्यक्ष (Vice President)</option>
                      <option value="Secretary">सरचिटणीस / सचिव (Secretary)</option>
                      <option value="Treasurer">मुख्य खजिनदार (Treasurer)</option>
                      <option value="Executive Member">मुख्य कार्यकारणी सदस्य (Executive Member)</option>
                      <option value="Festival Head">उत्सव प्रमुख (Festival Head)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">मोबाईल नंबर *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="+91 98..."
                      value={bearerForm.phone}
                      onChange={e => setBearerForm({ ...bearerForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold text-main-text outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">रक्तगट (Blood Group)</label>
                    <select 
                      value={bearerForm.bloodGroup}
                      onChange={e => setBearerForm({ ...bearerForm, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none font-bold"
                    >
                      {['A+ve', 'A-ve', 'B+ve', 'B-ve', 'O+ve', 'O-ve', 'AB+ve', 'AB-ve'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">पत्ता / रहिवासी</label>
                    <input 
                      type="text" 
                      value={bearerForm.address}
                      onChange={e => setBearerForm({ ...bearerForm, address: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">विशेष कार्यभार / जबाबदाऱ्या</label>
                  <input 
                    type="text" 
                    placeholder="उदा. मंडप उभारणी, ध्वनी परवानग्या व देणगी समन्वय"
                    value={bearerForm.responsibilities}
                    onChange={e => setBearerForm({ ...bearerForm, responsibilities: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text outline-none"
                  />
                </div>

                <div className="pt-3 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddOfficeBearerOpen(false)}
                    className="w-1/3 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold"
                  >
                    रद्द करा
                  </button>
                  <button 
                    type="submit"
                    className="w-2/3 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-orange-900/20"
                  >
                    <CheckCircle2 size={16} />
                    नेमणूक जतन करा
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
