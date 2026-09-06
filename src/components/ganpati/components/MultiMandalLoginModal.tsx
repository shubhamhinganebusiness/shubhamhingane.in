import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Shield, 
  Key, 
  Lock, 
  UserCheck, 
  Sparkles, 
  PlusCircle, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Crown, 
  Wallet, 
  Users, 
  Heart, 
  X, 
  Info,
  MapPin,
  Calendar,
  Layers,
  FileText,
  Flame,
  Check
} from 'lucide-react';
import { MandalAccount, MandalUserSession, MandalProfile } from '../types';
import { 
  getAllMandalAccounts, 
  registerNewMandal, 
  authenticateMandal 
} from '../services/mandalStorageService';

interface MultiMandalLoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (session: MandalUserSession) => void;
  currentMandalId?: string;
}

export const MultiMandalLoginModal: React.FC<MultiMandalLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentMandalId
}) => {
  const [activeTab, setActiveTab] = useState<'select' | 'code' | 'register' | 'security'>('select');
  const [mandalList, setMandalList] = useState<MandalAccount[]>(() => getAllMandalAccounts());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  
  // Login Form State
  const [selectedMandal, setSelectedMandal] = useState<MandalAccount | null>(() => {
    const list = getAllMandalAccounts();
    return list.find(m => m.id === currentMandalId) || list[0] || null;
  });
  const [mandalCodeInput, setMandalCodeInput] = useState('');
  const [role, setRole] = useState<'admin' | 'treasurer' | 'karyakarta' | 'devotee'>('admin');
  const [pin, setPin] = useState('123456');
  const [devoteeName, setDevoteeName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // New Mandal Registration State
  const [regStep, setRegStep] = useState<1 | 2 | 3 | 4>(1);
  const [newMandalForm, setNewMandalForm] = useState({
    nameMr: '',
    nameEn: '',
    city: 'Pune',
    pincode: '411030',
    addressMr: '',
    addressEn: '',
    regNumber: '',
    establishedYear: 2026,
    presidentName: '',
    secretaryName: '',
    treasurerName: '',
    phone: '',
    email: '',
    mandalCode: '',
    receiptPrefix: '',
    adminPin: '123456',
    treasurerPin: '555555',
    karyakartaPin: '111111',
    upiId: '',
    themeTitleMr: '',
    themeDescriptionMr: '',
    idolHeight: '10 Feet',
    categoryTier: 'A-Grade (अ वर्ग)' as MandalAccount['categoryTier']
  });

  if (!isOpen) return null;

  const cities = ['All', ...Array.from(new Set(mandalList.map(m => m.profile.city)))];

  const filteredMandals = mandalList.filter(m => {
    const matchesSearch = 
      m.profile.nameMr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.profile.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.mandalCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.profile.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.receiptPrefix.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === 'All' || m.profile.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  const handleSelectMandal = (m: MandalAccount) => {
    setSelectedMandal(m);
    setErrorMsg(null);
    if (role === 'admin') setPin(m.adminPin || '123456');
    else if (role === 'treasurer') setPin(m.treasurerPin || '555555');
    else if (role === 'karyakarta') setPin(m.karyakartaPin || '111111');
  };

  const handleRoleChange = (newRole: 'admin' | 'treasurer' | 'karyakarta' | 'devotee') => {
    setRole(newRole);
    setErrorMsg(null);
    if (selectedMandal) {
      if (newRole === 'admin') setPin(selectedMandal.adminPin || '123456');
      else if (newRole === 'treasurer') setPin(selectedMandal.treasurerPin || '555555');
      else if (newRole === 'karyakarta') setPin(selectedMandal.karyakartaPin || '111111');
      else setPin('');
    }
  };

  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      let targetIdentifier = '';
      if (activeTab === 'code') {
        if (!mandalCodeInput.trim()) {
          throw new Error('कृपया मंडळ कोड प्रविष्ट करा (Please enter Mandal Code)');
        }
        targetIdentifier = mandalCodeInput.trim().toUpperCase();
      } else {
        if (!selectedMandal) {
          throw new Error('कृपया मंडळ निवडा (Please select a Mandal)');
        }
        targetIdentifier = selectedMandal.id;
      }

      const session = authenticateMandal(targetIdentifier, role, pin, undefined, devoteeName);
      setIsLoading(false);
      onLoginSuccess(session);
      if (onClose) onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'लॉगिन अयशस्वी झाले. कृपया तपशील तपासा.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (!newMandalForm.nameMr.trim()) throw new Error('मंडळाचे मराठी नाव आवश्यक आहे.');
      if (!newMandalForm.mandalCode.trim()) throw new Error('मंडळ कोड आवश्यक आहे (उदा. SHIVAJI_NAGAR)');
      if (!newMandalForm.receiptPrefix.trim()) throw new Error('पावती क्रमांक प्रीफिक्स आवश्यक आहे (उदा. SNM-2026-)');
      if (!newMandalForm.presidentName.trim()) throw new Error('अध्यक्षांचे नाव आवश्यक आहे.');

      const newProfile: MandalProfile = {
        nameMr: newMandalForm.nameMr,
        nameEn: newMandalForm.nameEn || newMandalForm.nameMr,
        nameHi: newMandalForm.nameMr,
        taglineMr: '॥ एकजुटीने उत्सव करूया, समाज समृद्ध घडवूया ॥',
        taglineEn: 'Preserving Heritage & Unity',
        regNumber: newMandalForm.regNumber || `MAHA/${newMandalForm.establishedYear}/${newMandalForm.city.toUpperCase()}/F-${Math.floor(1000 + Math.random() * 9000)}`,
        establishedYear: Number(newMandalForm.establishedYear) || 2026,
        presidentName: newMandalForm.presidentName,
        secretaryName: newMandalForm.secretaryName || 'श्री. सचिव',
        treasurerName: newMandalForm.treasurerName || 'श्री. खजिनदार',
        phone: newMandalForm.phone || '+91 98000 00000',
        email: newMandalForm.email || `${newMandalForm.mandalCode.toLowerCase()}@ganpati.org`,
        addressMr: newMandalForm.addressMr || `${newMandalForm.city}, महाराष्ट्र`,
        addressEn: newMandalForm.addressEn || `${newMandalForm.city}, Maharashtra`,
        city: newMandalForm.city,
        pincode: newMandalForm.pincode,
        themeTitleMr: newMandalForm.themeTitleMr || 'भव्य सांस्कृतिक देखावा व इको-फ्रेंडली गणेशोत्सव',
        themeTitleEn: 'Grand Cultural Decor & Eco-Friendly Celebrations',
        themeDescriptionMr: newMandalForm.themeDescriptionMr || 'यंदाच्या उत्सवात पर्यावरणपूरक मूर्ती व सामाजिक उपक्रम राबवण्यात येत आहेत.',
        themeDescriptionEn: 'Eco-friendly celebrations focusing on social awareness.',
        idolHeight: newMandalForm.idolHeight,
        sculptorName: 'स्थानिक मूर्तिकार',
        socials: {
          instagram: '',
          youtube: '',
          facebook: '',
          whatsappGroup: ''
        },
        historyMr: 'स्थानिक भाविक व कार्यकर्त्यांच्या सहकार्याने स्थापन झालेले अग्रगण्य मंडळ.',
        historyEn: 'Community organization serving local devotees with cultural celebrations.',
        upiId: newMandalForm.upiId || `${newMandalForm.mandalCode.toLowerCase()}@sbi`,
        bankDetails: {
          accountName: `${newMandalForm.nameMr} Trust`,
          accountNumber: '300010002000',
          ifsc: 'SBIN0000123',
          bankName: 'State Bank of India',
          branch: newMandalForm.city
        }
      };

      const registered = registerNewMandal({
        mandalCode: newMandalForm.mandalCode.toUpperCase().replace(/\s+/g, '_'),
        profile: newProfile,
        receiptPrefix: newMandalForm.receiptPrefix.toUpperCase().endsWith('-') ? newMandalForm.receiptPrefix.toUpperCase() : `${newMandalForm.receiptPrefix.toUpperCase()}-`,
        adminPin: newMandalForm.adminPin || '123456',
        treasurerPin: newMandalForm.treasurerPin || '555555',
        karyakartaPin: newMandalForm.karyakartaPin || '111111',
        categoryTier: newMandalForm.categoryTier
      });

      // Update list
      setMandalList(getAllMandalAccounts());

      // Auto login as admin of the newly created mandal
      const session = authenticateMandal(registered.id, 'admin', newMandalForm.adminPin);
      setIsLoading(false);
      onLoginSuccess(session);
      if (onClose) onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'नोंदणी करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-zinc-900 border border-amber-500/30 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 p-5 sm:p-6 text-white relative">
          {onClose && (
            <button 
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all"
            >
              <X size={18} />
            </button>
          )}

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/30">
              🚩
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/30 border border-amber-300/40 text-[11px] font-black tracking-wider uppercase">
                  Multi-Mandal Cloud ERP
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-200">
                  <Shield size={12} /> 100% डेटा पृथक्करण (Isolated Tenants)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                गणपती मंडळ डिजिटल पावती व ईआरपी लॉगिन
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-orange-100 max-w-2xl">
            अनेक स्वतंत्र मंडळांसाठी सुरक्षित बहु-मंडळ प्रणाली. आपले मंडळ निवडा, भूमिका निश्चित करा आणि थेट कारभार सुरू करा.
          </p>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mt-5">
            <button
              onClick={() => { setActiveTab('select'); setErrorMsg(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'select'
                  ? 'bg-white text-orange-700 shadow-md font-black'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <Building2 size={15} />
              नोंदणीकृत मंडळे ({mandalList.length})
            </button>

            <button
              onClick={() => { setActiveTab('code'); setErrorMsg(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'bg-white text-orange-700 shadow-md font-black'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <Key size={15} />
              मंडळ कोड द्वारे प्रवेश
            </button>

            <button
              onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-amber-300 text-orange-900 shadow-md font-black'
                  : 'bg-amber-400/25 hover:bg-amber-400/40 text-amber-100'
              }`}
            >
              <PlusCircle size={15} />
              नवीन मंडळ नोंदणी (२ मिनिटांत)
            </button>

            <button
              onClick={() => { setActiveTab('security'); setErrorMsg(null); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ml-auto ${
                activeTab === 'security'
                  ? 'bg-white text-orange-700 shadow-md font-black'
                  : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
            >
              <Shield size={14} />
              सुरक्षा संरचना
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-gray-50/50 dark:bg-zinc-900/50">
          
          {/* Error Message Toast */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-300 text-xs font-bold animate-shake">
              <AlertCircle size={18} className="shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: SELECT REGISTERED MANDAL */}
          {activeTab === 'select' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Mandal Directory & Search */}
              <div className="lg:col-span-6 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider">
                    १. मंडळ निवडा (Select Mandal)
                  </h3>
                  <span className="text-[11px] text-orange-600 dark:text-orange-400 font-bold">
                    {filteredMandals.length} मंडळे उपलब्ध
                  </span>
                </div>

                {/* Search & City Filter */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input 
                      type="text"
                      placeholder="मंडळ नाव, शहर किंवा कोड शोधा..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl text-xs font-semibold focus:outline-none focus:border-orange-500 shadow-sm"
                    />
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {cities.map(city => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setSelectedCity(city)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                          selectedCity === city
                            ? 'bg-orange-600 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {city === 'All' ? 'सर्व शहरे' : city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mandal Cards List */}
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {filteredMandals.map(m => {
                    const isSelected = selectedMandal?.id === m.id;
                    return (
                      <div 
                        key={m.id}
                        onClick={() => handleSelectMandal(m)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected 
                            ? 'bg-orange-50/90 dark:bg-orange-950/30 border-orange-500 shadow-md ring-2 ring-orange-500/20' 
                            : 'bg-white dark:bg-zinc-800/80 border-gray-200 dark:border-zinc-700/80 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {m.profile.logoUrl ? (
                            <img 
                              src={m.profile.logoUrl} 
                              alt="Logo" 
                              className="w-10 h-10 rounded-xl object-cover border border-amber-400 bg-white p-0.5 shrink-0" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                              🚩
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">
                                {m.profile.nameMr}
                              </h4>
                              {isSelected && (
                                <span className="p-1 rounded-full bg-orange-600 text-white shrink-0">
                                  <Check size={10} />
                                </span>
                              )}
                            </div>
                            
                            <p className="text-[11px] text-gray-500 truncate">
                              {m.profile.nameEn}
                            </p>

                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 text-[10px] font-black flex items-center gap-0.5">
                                <MapPin size={10} /> {m.profile.city}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-mono font-bold">
                                {m.receiptPrefix}
                              </span>
                              <span className="px-1.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 text-[9px] font-black uppercase">
                                {m.mandalCode}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Role Selection & PIN Authentication */}
              <div className="lg:col-span-6 bg-white dark:bg-zinc-800 p-5 rounded-3xl border border-gray-200 dark:border-zinc-700 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-zinc-700">
                    <div>
                      <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider block">
                        निवडलेले मंडळ (Selected Tenant)
                      </span>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white line-clamp-1">
                        {selectedMandal?.profile.nameMr || 'मंडळ निवडा'}
                      </h4>
                    </div>
                    {selectedMandal && (
                      <span className="px-2.5 py-1 rounded-xl bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-[10px] font-bold border border-green-300 dark:border-green-800 flex items-center gap-1">
                        <CheckCircle2 size={11} /> सक्रिय मंडळ
                      </span>
                    )}
                  </div>

                  {/* 2. Choose Role */}
                  <div className="space-y-2 mb-4">
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center justify-between">
                      <span>२. आपली भूमिका निवडा (Select Role)</span>
                      <span className="text-[10px] text-gray-400 font-normal">Role-Based Access</span>
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleRoleChange('admin')}
                        className={`p-2.5 rounded-2xl border text-left transition-all ${
                          role === 'admin'
                            ? 'bg-orange-500 text-white border-orange-600 shadow-md font-bold'
                            : 'bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-black">
                          <Crown size={14} className={role === 'admin' ? 'text-amber-200' : 'text-amber-500'} />
                          मुख्य प्रशासक (Admin)
                        </div>
                        <div className={`text-[10px] mt-0.5 ${role === 'admin' ? 'text-orange-100' : 'text-gray-400'}`}>
                          पूर्ण नियंत्रण व हिशोब
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRoleChange('treasurer')}
                        className={`p-2.5 rounded-2xl border text-left transition-all ${
                          role === 'treasurer'
                            ? 'bg-orange-500 text-white border-orange-600 shadow-md font-bold'
                            : 'bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-black">
                          <Wallet size={14} className={role === 'treasurer' ? 'text-amber-200' : 'text-emerald-500'} />
                          खजिनदार (Treasurer)
                        </div>
                        <div className={`text-[10px] mt-0.5 ${role === 'treasurer' ? 'text-orange-100' : 'text-gray-400'}`}>
                          तिजोरी, कॅश व ऑडिट
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRoleChange('karyakarta')}
                        className={`p-2.5 rounded-2xl border text-left transition-all ${
                          role === 'karyakarta'
                            ? 'bg-orange-500 text-white border-orange-600 shadow-md font-bold'
                            : 'bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-black">
                          <Users size={14} className={role === 'karyakarta' ? 'text-amber-200' : 'text-blue-500'} />
                          संकलन कार्यकर्ता (Volunteer)
                        </div>
                        <div className={`text-[10px] mt-0.5 ${role === 'karyakarta' ? 'text-orange-100' : 'text-gray-400'}`}>
                          पावती फाडणे व संकलन
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRoleChange('devotee')}
                        className={`p-2.5 rounded-2xl border text-left transition-all ${
                          role === 'devotee'
                            ? 'bg-orange-500 text-white border-orange-600 shadow-md font-bold'
                            : 'bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-black">
                          <Heart size={14} className={role === 'devotee' ? 'text-amber-200' : 'text-red-500'} />
                          भाविक / देणगीदार (Devotee)
                        </div>
                        <div className={`text-[10px] mt-0.5 ${role === 'devotee' ? 'text-orange-100' : 'text-gray-400'}`}>
                          दर्शन, आरती व प्रार्थना
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 3. Credentials Form */}
                  <form onSubmit={handleDirectLogin} className="space-y-3">
                    {role === 'devotee' ? (
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          आपले शुभ नाव (Optional)
                        </label>
                        <input 
                          type="text"
                          placeholder="उदा. राहुल तांबडे"
                          value={devoteeName}
                          onChange={(e) => setDevoteeName(e.target.value)}
                          className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                        />
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          * भाविक लॉगिनसाठी कोणत्याही पासवर्डची आवश्यकता नाही.
                        </span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <Lock size={12} className="text-orange-500" />
                            सुरक्षा पिन / पासवर्ड (Security PIN)
                          </label>
                          <span className="text-[10px] font-mono text-orange-600 bg-orange-50 dark:bg-zinc-900 px-2 py-0.5 rounded-lg border border-orange-200 dark:border-zinc-700">
                            Demo: {role === 'admin' ? '123456' : role === 'treasurer' ? '555555' : '111111'}
                          </span>
                        </div>
                        <input 
                          type="password"
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          placeholder="पिन प्रविष्ट करा..."
                          className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold tracking-wider focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    )}

                    {/* Quick Demo Credentials Autofill Button */}
                    {role !== 'devotee' && (
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (role === 'admin') setPin('123456');
                            else if (role === 'treasurer') setPin('555555');
                            else setPin('111111');
                          }}
                          className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                        >
                          <Sparkles size={11} /> १-क्लिक चाचणी पिन भरा (Auto-fill Demo PIN)
                        </button>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span>प्रमाणीकरण सुरू आहे...</span>
                      ) : (
                        <>
                          <span>मंडळ प्रणालीत सुरक्षित प्रवेश करा</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-700/60 flex items-center justify-between text-[11px] text-gray-400">
                  <span>डेटाबेस: {selectedMandal?.id}</span>
                  <span className="font-mono text-orange-600">v2026.1 Secured</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DIRECT MANDAL CODE LOGIN */}
          {activeTab === 'code' && (
            <div className="max-w-md mx-auto bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-gray-200 dark:border-zinc-700 shadow-md">
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center mx-auto mb-2 font-black text-xl">
                  #
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  मंडळ कोड द्वारे थेट लॉगिन
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  आपल्या मंडळाचा विशिष्ट युनिक कोड प्रविष्ट करा.
                </p>
              </div>

              <form onSubmit={handleDirectLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    मंडळ युनिक कोड (Mandal Code)
                  </label>
                  <input 
                    type="text"
                    placeholder="उदा. SHIVTEJ_PUNE, LALBAUG_MUMBAI"
                    value={mandalCodeInput}
                    onChange={(e) => setMandalCodeInput(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-black uppercase tracking-wider focus:outline-none focus:border-orange-500"
                    required
                  />
                  
                  {/* Quick Code suggestions */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] text-gray-400 self-center mr-1">चाचणी कोड:</span>
                    {mandalList.slice(0, 3).map(m => (
                      <button
                        key={m.mandalCode}
                        type="button"
                        onClick={() => setMandalCodeInput(m.mandalCode)}
                        className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 text-[10px] font-mono hover:bg-orange-100 hover:text-orange-700"
                      >
                        {m.mandalCode}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    आपली भूमिका (Role)
                  </label>
                  <select 
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500"
                  >
                    <option value="admin">👑 मुख्य प्रशासक / अध्यक्ष (Admin)</option>
                    <option value="treasurer">💰 खजिनदार (Treasurer)</option>
                    <option value="karyakarta">🚩 संकलन कार्यकर्ता (Volunteer)</option>
                    <option value="devotee">🪔 भाविक (Devotee)</option>
                  </select>
                </div>

                {role !== 'devotee' && (
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      सुरक्षा पिन (PIN)
                    </label>
                    <input 
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="पिन प्रविष्ट करा (उदा. 123456)"
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold tracking-wider focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <span>मंडळ पोर्टल उघडा</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: REGISTER NEW MANDAL WIZARD */}
          {activeTab === 'register' && (
            <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-amber-300 dark:border-zinc-700 shadow-md">
              
              {/* Wizard Steps indicator */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-zinc-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-xs">
                    {regStep}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white">
                      नवीन मंडळ नोंदणी (New Mandal Registration)
                    </h3>
                    <span className="text-[10px] text-gray-400">
                      पायरी {regStep} / ४
                    </span>
                  </div>
                </div>

                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRegStep(s as any)}
                      className={`w-6 h-1.5 rounded-full transition-all ${
                        regStep === s ? 'bg-orange-600 w-8' : regStep > s ? 'bg-amber-400' : 'bg-gray-200 dark:bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                {/* STEP 1: MANDAL BASICS */}
                {regStep === 1 && (
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-black uppercase text-orange-600 tracking-wider">
                      पायरी १: मंडळाची मूलभूत माहिती
                    </h4>

                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        मंडळाचे पूर्ण नाव (मराठीत) *
                      </label>
                      <input 
                        type="text"
                        required
                        placeholder="उदा. श्री शिवतेज सार्वजनिक गणेशोत्सव मंडळ"
                        value={newMandalForm.nameMr}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewMandalForm({
                            ...newMandalForm,
                            nameMr: val,
                            // Auto-generate code & prefix if empty
                            mandalCode: newMandalForm.mandalCode || val.slice(0, 10).replace(/[^a-zA-Z0-9]/g, '_').toUpperCase(),
                            receiptPrefix: newMandalForm.receiptPrefix || 'GMP-2026-'
                          });
                        }}
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          नाव (इंग्रजीत / English)
                        </label>
                        <input 
                          type="text"
                          placeholder="Shree Shivtej Ganeshotsav Mandal"
                          value={newMandalForm.nameEn}
                          onChange={(e) => setNewMandalForm({ ...newMandalForm, nameEn: e.target.value })}
                          className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          शहर / जिल्हा (City) *
                        </label>
                        <input 
                          type="text"
                          required
                          placeholder="उदा. Pune, Mumbai, Thane, Nashik"
                          value={newMandalForm.city}
                          onChange={(e) => setNewMandalForm({ ...newMandalForm, city: e.target.value })}
                          className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          स्थापना वर्ष (Established Year)
                        </label>
                        <input 
                          type="number"
                          placeholder="1982"
                          value={newMandalForm.establishedYear}
                          onChange={(e) => setNewMandalForm({ ...newMandalForm, establishedYear: Number(e.target.value) })}
                          className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          धर्मादाय नोंदणी क्रमांक (Reg. No.)
                        </label>
                        <input 
                          type="text"
                          placeholder="MAHA/1982/PUNE/F-14258"
                          value={newMandalForm.regNumber}
                          onChange={(e) => setNewMandalForm({ ...newMandalForm, regNumber: e.target.value })}
                          className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        मंडप पत्ता व परिसर (Pandal Address)
                      </label>
                      <input 
                        type="text"
                        placeholder="उदा. टिळक रस्ता, अलका टॉकीज चौक, पुणे"
                        value={newMandalForm.addressMr}
                        onChange={(e) => setNewMandalForm({ ...newMandalForm, addressMr: e.target.value })}
                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setRegStep(2)}
                      className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all mt-3"
                    >
                      <span>पुढील पायरी: पदाधिकारी व संपर्क</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {/* STEP 2: LEADERSHIP & CONTACT */}
                {regStep === 2 && (
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-black uppercase text-orange-600 tracking-wider">
                      पायरी २: मुख्य पदाधिकारी व संपर्क माहिती
                    </h4>

                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        मंडळ अध्यक्ष (President Name) *
                      </label>
                      <input 
                        type="text"
                        required
                        placeholder="श्री. राजेंद्र तांबडे"
                        value={newMandalForm.presidentName}
                        onChange={(e) => setNewMandalForm({ ...newMandalForm, presidentName: e.target.value })}
                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          मंडळ सचिव (Secretary Name)
                        </label>
                        <input 
                          type="text"
                          placeholder="श्री. सचिन कुलकर्णी"
                          value={newMandalForm.secretaryName}
                          onChange={(e) => setNewMandalForm({ ...newMandalForm, secretaryName: e.target.value })}
                          className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          खजिनदार (Treasurer Name)
                        </label>
                        <input 
                          type="text"
                          placeholder="श्री. महेश गायकवाड"
                          value={newMandalForm.treasurerName}
                          onChange={(e) => setNewMandalForm({ ...newMandalForm, treasurerName: e.target.value })}
                          className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          अधिकृत मोबाईल क्रमांक
                        </label>
                        <input 
                          type="tel"
                          placeholder="+91 98220 14258"
                          value={newMandalForm.phone}
                          onChange={(e) => setNewMandalForm({ ...newMandalForm, phone: e.target.value })}
                          className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          ईमेल पत्ता (Email)
                        </label>
                        <input 
                          type="email"
                          placeholder="mandal@gmail.com"
                          value={newMandalForm.email}
                          onChange={(e) => setNewMandalForm({ ...newMandalForm, email: e.target.value })}
                          className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setRegStep(1)}
                        className="py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 font-bold text-xs"
                      >
                        मागे
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegStep(3)}
                        className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <span>पुढील पायरी: पावती व सुरक्षा कोड</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: CODE & SECURITY PIN */}
                {regStep === 3 && (
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-black uppercase text-orange-600 tracking-wider">
                      पायरी ३: पावती क्रमांक व सुरक्षा पिन
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          मंडळ कोड (Unique Handle) *
                        </label>
                        <input 
                          type="text"
                          required
                          placeholder="SHIVAJI_PUNE"
                          value={newMandalForm.mandalCode}
                          onChange={(e) => setNewMandalForm({ ...newMandalForm, mandalCode: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                          className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-black uppercase focus:outline-none focus:border-orange-500"
                        />
                        <span className="text-[10px] text-gray-400">लॉगिनसाठी वापरला जाणारा युनिक कोड</span>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          पावती प्रीफिक्स (Receipt Prefix) *
                        </label>
                        <input 
                          type="text"
                          required
                          placeholder="SMP-2026-"
                          value={newMandalForm.receiptPrefix}
                          onChange={(e) => setNewMandalForm({ ...newMandalForm, receiptPrefix: e.target.value.toUpperCase() })}
                          className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-black focus:outline-none focus:border-orange-500"
                        />
                        <span className="text-[10px] text-gray-400">उदा. SMP-2026-0001</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          ॲडमिन पिन (Admin PIN)
                        </label>
                        <input 
                          type="password"
                          value={newMandalForm.adminPin}
                          onChange={(e) => setNewMandalForm({ ...newMandalForm, adminPin: e.target.value })}
                          className="w-full px-2.5 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-orange-500 text-center"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          खजिनदार पिन
                        </label>
                        <input 
                          type="password"
                          value={newMandalForm.treasurerPin}
                          onChange={(e) => setNewMandalForm({ ...newMandalForm, treasurerPin: e.target.value })}
                          className="w-full px-2.5 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-orange-500 text-center"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          कार्यकर्ता पिन
                        </label>
                        <input 
                          type="password"
                          value={newMandalForm.karyakartaPin}
                          onChange={(e) => setNewMandalForm({ ...newMandalForm, karyakartaPin: e.target.value })}
                          className="w-full px-2.5 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-orange-500 text-center"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        ऑनलाइन देणगी UPI ID (Online QR)
                      </label>
                      <input 
                        type="text"
                        placeholder="mandal@sbi"
                        value={newMandalForm.upiId}
                        onChange={(e) => setNewMandalForm({ ...newMandalForm, upiId: e.target.value })}
                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setRegStep(2)}
                        className="py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 font-bold text-xs"
                      >
                        मागे
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegStep(4)}
                        className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <span>पुढील पायरी: देखावा व अंतिम खात्री</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: THEME & FINAL CONFIRMATION */}
                {regStep === 4 && (
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-black uppercase text-orange-600 tracking-wider">
                      पायरी ४: देखावा थीम व अंतिम नोंदणी
                    </h4>

                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        यंदाचा देखावा / संकल्प विषय (Theme Title)
                      </label>
                      <input 
                        type="text"
                        placeholder="उदा. काशी विश्वनाथ मंदिर प्रतिकृती देखावा"
                        value={newMandalForm.themeTitleMr}
                        onChange={(e) => setNewMandalForm({ ...newMandalForm, themeTitleMr: e.target.value })}
                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-2">
                      <h5 className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <CheckCircle2 size={14} />
                        मंडळ डेटाबेस सुरक्षितता खात्री (Tenant Isolation Summary)
                      </h5>
                      <ul className="text-[11px] text-amber-800 dark:text-amber-200/80 space-y-1 list-disc pl-4">
                        <li>या मंडळासाठी स्वतंत्र पावती बुक (#0001 पासून) तयार केले जाईल.</li>
                        <li>इतर कोणत्याही मंडळाचे पदाधिकारी आपला जमा-खर्च अथवा देणगीदार पाहू शकणार नाहीत.</li>
                        <li>नोंदणी पूर्ण होताच आपण थेट मुख्य प्रशासक (Admin) म्हणून लॉगिन व्हाल.</li>
                      </ul>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setRegStep(3)}
                        className="py-3 px-4 rounded-xl bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 font-bold text-xs"
                      >
                        मागे
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                      >
                        <Crown size={16} />
                        <span>मंडळ नोंदणी पूर्ण करा व सुरू करा</span>
                      </button>
                    </div>
                  </div>
                )}

              </form>
            </div>
          )}

          {/* TAB 4: MULTI-TENANT ARCHITECTURE & SECURITY EXPLANATION */}
          {activeTab === 'security' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white p-6 rounded-3xl border border-zinc-800 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight">
                      बहु-मंडळ सुरक्षा व डेटा पृथक्करण (Multi-Tenant Architecture)
                    </h3>
                    <p className="text-xs text-gray-400">
                      एकाच क्लाउड ॲपवर हजारो मंडळे पूर्णपणे स्वतंत्र व गोपनीय पद्धतीने कार्यरत राहू शकतात.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="p-3.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-400 mb-1">
                      <Layers size={14} /> स्वतंत्र पावती व हिशोब बकेट
                    </div>
                    <p className="text-[11px] text-gray-300">
                      प्रत्येक मंडळाचा पावती क्रमांक, खजिनदार तिजोरी, देणगीदार यादी आणि खर्च हे 100% त्या मंडळाच्या `mandalId` शी जोडलेले असतात.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60">
                    <div className="flex items-center gap-2 text-xs font-black text-emerald-400 mb-1">
                      <UserCheck size={14} /> 4-स्तरीय भूमिका प्रवेश (RBAC)
                    </div>
                    <p className="text-[11px] text-gray-300">
                      अध्यक्ष, खजिनदार, संकलन कार्यकर्ता आणि भाविक यांच्यासाठी स्वतंत्र सुरक्षा पिन व विशेष अधिकार निश्चित केलेले आहेत.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60">
                    <div className="flex items-center gap-2 text-xs font-black text-blue-400 mb-1">
                      <Lock size={14} /> शून्य डेटा गळती (Zero Data Cross-over)
                    </div>
                    <p className="text-[11px] text-gray-300">
                      मंडळ १ चे ऑपरेटर मंडळ २ चा एकही रुपया किंवा सदस्य पाहू अथवा बदलू शकत नाहीत.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60">
                    <div className="flex items-center gap-2 text-xs font-black text-purple-400 mb-1">
                      <Sparkles size={14} /> झटपट मंडळ बदल (Instant Switching)
                    </div>
                    <p className="text-[11px] text-gray-300">
                      ट्रस्टी अथवा जिल्हा समन्वयकांना एका क्लिकवर अधिकृत मंडळ बदलून ऑडिट करण्याची सोय.
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-gray-400">
                  <span>Firestore Isolation Protocol & Local Multi-Tenant Store</span>
                  <button 
                    onClick={() => setActiveTab('select')}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 text-black font-black text-xs hover:bg-amber-400 transition-all"
                  >
                    मंडळ लॉगिन कडे जा
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </motion.div>
    </div>
  );
};
