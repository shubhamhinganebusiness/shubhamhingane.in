import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Settings, 
  ClipboardList, 
  BarChart3, 
  Plus, 
  Search, 
  LayoutDashboard,
  ArrowLeft
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { FarmerManagement } from './FarmerManagement';
import { MilkCollectionForm } from './MilkCollectionForm';
import { DairyReports } from './DairyReports';
import { DairySettingsView } from './DairySettingsView';
import { DairySettings } from './types';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';

export const DairyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'collection' | 'farmers' | 'reports' | 'settings'>('collection');
  const [settings, setSettings] = useState<DairySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const path = `dairies/${user.uid}/settings/config`;
    const unsub = onSnapshot(doc(db, 'dairies', user.uid, 'settings', 'config'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as DairySettings);
      }
      setLoading(false);
    }, (err) => {
      console.error('Dairy Snapshot Error:', err);
      handleFirestoreError(err, OperationType.GET, path);
    });
    return unsub;
  }, [user]);

  const tabs = [
    { id: 'collection', label: 'Milk Collection', icon: ClipboardList },
    { id: 'farmers', label: 'Farmers', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-6 gap-4">
            <div className="flex items-center gap-4">
              <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={24} className="text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-none mb-1">
                  {settings?.dairyName || 'Dairy Management System'}
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Owner: {settings?.ownerName || 'Portfolio Owner'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                    activeTab === tab.id 
                      ? 'bg-white text-primary shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'collection' && <MilkCollectionForm settings={settings} />}
          {activeTab === 'farmers' && <FarmerManagement />}
          {activeTab === 'reports' && <DairyReports />}
          {activeTab === 'settings' && <DairySettingsView settings={settings} />}
        </motion.div>
      </main>
    </div>
  );
};
