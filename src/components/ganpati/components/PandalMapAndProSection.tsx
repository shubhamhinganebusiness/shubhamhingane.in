import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Map, 
  MapPin, 
  Users, 
  Wifi, 
  ShieldAlert, 
  Smartphone, 
  Laptop, 
  Tablet, 
  RefreshCw, 
  PhoneCall, 
  Sparkles, 
  QrCode, 
  Share2, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PandalZone, MandalLanguage, MandalProfile } from '../types';
import { mandalTranslations } from '../translations/mandalTranslations';

interface PandalMapAndProSectionProps {
  zones: PandalZone[];
  mandal: MandalProfile;
  lang: MandalLanguage;
  userRole: string;
}

export const PandalMapAndProSection: React.FC<PandalMapAndProSectionProps> = ({
  zones,
  mandal,
  lang,
  userRole
}) => {
  const t = mandalTranslations[lang];
  const [selectedZone, setSelectedZone] = useState<PandalZone>(zones[0]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedTime, setSyncedTime] = useState('आत्ताच (Just now)');

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncedTime(new Date().toLocaleTimeString());
    }, 1200);
  };

  const getStatusColor = (status: PandalZone['status']) => {
    switch (status) {
      case 'Normal':
        return 'bg-emerald-500 text-white';
      case 'Moderate':
        return 'bg-amber-500 text-white';
      case 'Heavy':
        return 'bg-rose-500 text-white';
      case 'Closed':
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Multi-Device Cloud Sync Bar */}
      <div className="bg-surface p-6 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <Wifi size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-black text-main-text">मल्टी-डिव्हाइस रिअल-टाइम सिंक चालू</h4>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full">
                ऑनलाइन • ४ डिव्हाइसेस जोडलेली आहेत
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              काऊंटर १, २ व स्वयंसेवकांच्या मोबाईलवरून एकाच वेळी पावती फाडली तरी क्रमांक सुरक्षित राहतो.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">शेवटचे सिंक: {syncedTime}</span>
          <button 
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-main-text rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin text-primary' : ''} />
            {isSyncing ? 'सिंक होत आहे...' : 'तात्काळ सिंक करा'}
          </button>
        </div>
      </div>

      {/* Connected Devices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-surface rounded-2xl border border-gray-100 dark:border-zinc-800 flex items-center gap-3">
          <Laptop className="text-primary flex-shrink-0" size={20} />
          <div className="text-xs">
            <span className="font-bold text-main-text block">काऊंटर १ (मुख्य लॅपटॉप)</span>
            <span className="text-emerald-600 font-bold text-[10px]">● Active • सचिन कुलकर्णी</span>
          </div>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-gray-100 dark:border-zinc-800 flex items-center gap-3">
          <Laptop className="text-primary flex-shrink-0" size={20} />
          <div className="text-xs">
            <span className="font-bold text-main-text block">काऊंटर २ (प्रसाद काऊंटर)</span>
            <span className="text-emerald-600 font-bold text-[10px]">● Active • महेश गायकवाड</span>
          </div>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-gray-100 dark:border-zinc-800 flex items-center gap-3">
          <Smartphone className="text-primary flex-shrink-0" size={20} />
          <div className="text-xs">
            <span className="font-bold text-main-text block">गेट मोबाईल अॅप १</span>
            <span className="text-emerald-600 font-bold text-[10px]">● Active • रोहन शिंदे</span>
          </div>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-gray-100 dark:border-zinc-800 flex items-center gap-3">
          <Tablet className="text-primary flex-shrink-0" size={20} />
          <div className="text-xs">
            <span className="font-bold text-main-text block">अध्यक्ष डॅशबोर्ड (टॅबलेट)</span>
            <span className="text-emerald-600 font-bold text-[10px]">● Active • राजेंद्र तांबडे</span>
          </div>
        </div>
      </div>

      {/* Interactive Pandal Map & Live Crowd Density */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Pandal Zones List */}
        <div className="lg:col-span-7 bg-surface p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-xl font-black text-main-text tracking-tight flex items-center gap-2">
              <Map className="text-primary" size={22} />
              {t.pandalMap.title} व लाईव्ह गर्दी मॉनिटर
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {t.pandalMap.crowdMonitor}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {zones.map((zone) => {
              const isSelected = selectedZone.id === zone.id;

              return (
                <div 
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40 hover:bg-gray-100/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h5 className="font-bold text-sm text-main-text">{zone.name}</h5>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${getStatusColor(zone.status)}`}>
                      {zone.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <span>अनुमानित गर्दी:</span>
                    <span className="font-bold text-main-text font-mono">{zone.estimatedPeople} भाविक</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>प्रतीक्षा वेळ:</span>
                    <span className="font-bold text-primary font-mono">{zone.waitMinutes} मिनिटे</span>
                  </div>

                  <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-200/50 dark:border-zinc-700/50">
                    प्रभारी: {zone.incharge}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Zone Detail & Emergency Contact Hotlines */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Selected Zone Focus Box */}
          <div className="bg-surface p-6 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-3">
            <span className="text-[10px] uppercase font-bold text-primary tracking-widest block">निवडलेला झोन तपशील</span>
            <h4 className="text-xl font-black text-main-text">{selectedZone.name}</h4>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex justify-between">
                <span>गर्दी स्थिती:</span>
                <span className="font-bold">{selectedZone.status}</span>
              </div>
              <div className="flex justify-between">
                <span>सध्या उपस्थित:</span>
                <span className="font-bold text-main-text">{selectedZone.estimatedPeople} भाविक</span>
              </div>
              <div className="flex justify-between">
                <span>दर्शनासाठी लागणारा वेळ:</span>
                <span className="font-bold text-primary">{selectedZone.waitMinutes} मिनिटे</span>
              </div>
              <div className="flex justify-between">
                <span>सुरक्षा प्रमुख:</span>
                <span className="font-bold text-main-text">{selectedZone.incharge}</span>
              </div>
            </div>
          </div>

          {/* Emergency Hotline Numbers */}
          <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-[2.5rem] space-y-3">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
              <PhoneCall size={18} />
              आणीबाणी संपर्क क्रमांक (Emergency Hotlines)
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <a href="tel:112" className="p-2.5 bg-surface rounded-xl flex items-center justify-between font-medium text-main-text hover:shadow-sm">
                <span>पोलीस नियंत्रण कक्ष</span>
                <span className="font-mono font-bold text-rose-600">112</span>
              </a>
              <a href="tel:108" className="p-2.5 bg-surface rounded-xl flex items-center justify-between font-medium text-main-text hover:shadow-sm">
                <span>रुग्णवाहिका (Ambulance)</span>
                <span className="font-mono font-bold text-rose-600">108</span>
              </a>
              <a href="tel:101" className="p-2.5 bg-surface rounded-xl flex items-center justify-between font-medium text-main-text hover:shadow-sm">
                <span>अग्निशामक दल (Fire)</span>
                <span className="font-mono font-bold text-rose-600">101</span>
              </a>
              <a href={`tel:${mandal.phone}`} className="p-2.5 bg-surface rounded-xl flex items-center justify-between font-medium text-main-text hover:shadow-sm">
                <span>मंडळ नियंत्रण कक्ष</span>
                <span className="font-mono font-bold text-primary">९८२२०</span>
              </a>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
