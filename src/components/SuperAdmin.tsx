import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { updatePassword } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, deleteDoc, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Plus, Users, Trash2, ShieldCheck, Mail, Database, Settings as SettingsIcon, AlertCircle, MessageSquare, Phone, Clock, Store, Edit2, Eye, EyeOff, X, Sparkles, RefreshCw, Lock, Check, ShieldAlert, ChevronDown } from 'lucide-react';
import { useAuth } from './AuthContext';
import { SiteManagement } from './SiteManagement';
import { AdminAnalytics } from './AdminAnalytics';
import { MedPortalManagement } from './med/MedPortalManagement';
import { MessPortalManagement } from './mess/MessPortalManagement';
import { PlayerDirectoryDashboard } from './cricket/PlayerDirectoryDashboard';
import { SpectatorSliderAdmin } from './cricket/SpectatorSliderAdmin';
import { BroadcastThemeStudio } from './cricket/BroadcastThemeStudio';

interface PasswordStrength {
  score: number; // 0 to 4
  label: string;
  color: string;
  feedback: string[];
}

export const checkPasswordStrength = (pass: string): PasswordStrength => {
  const feedback: string[] = [];
  if (!pass) return { score: 0, label: 'None', color: 'bg-gray-100 text-gray-500', feedback: [] };

  let score = 0;
  if (pass.length >= 8) score++;
  else feedback.push('Make it at least 8 characters long');

  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
  else feedback.push('Include both uppercase and lowercase letters');

  if (/[0-9]/.test(pass)) score++;
  else feedback.push('Include at least one number');

  if (/[^A-Za-z0-9]/.test(pass)) score++;
  else feedback.push('Include at least one special character (!@#$%^&*)');

  // Check if it's in a known list of weak/leaked/default patterns
  const weakPatterns = [
    '123456', 'password', 'qwerty', 'admin', 'shubham', 'gullyscore', '77199', '123456789', 'password111', 'Shubham@7719', 'shubham@7719', 'shubham123', 'admin123'
  ];
  const normalized = pass.toLowerCase();
  const containsWeakPattern = weakPatterns.some(pattern => normalized.includes(pattern));
  
  if (containsWeakPattern && score > 0) {
    score = Math.max(1, score - 1);
    feedback.push('Warning: Contains a common or leaked pattern (highly vulnerable to Google Password Manager breach trigger!)');
  }

  let label = 'Very Weak';
  let color = 'bg-rose-500 text-rose-500';
  if (score === 2) {
    label = 'Weak';
    color = 'bg-amber-500 text-amber-550';
  } else if (score === 3) {
    label = 'Medium';
    color = 'bg-yellow-500 text-yellow-650';
  } else if (score === 4) {
    label = 'Strong & Secure';
    color = 'bg-emerald-500 text-emerald-600';
  }

  return { score, label, color, feedback };
};

export const generateSecurePassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%&*?_+-=';
  const allChars = uppercase + lowercase + digits + symbols;
  
  const getRandomValue = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return array[0] / (0xffffffff + 1);
    }
    return Math.random();
  };

  let password = '';
  password += uppercase[Math.floor(getRandomValue() * uppercase.length)];
  password += lowercase[Math.floor(getRandomValue() * lowercase.length)];
  password += digits[Math.floor(getRandomValue() * digits.length)];
  password += symbols[Math.floor(getRandomValue() * symbols.length)];
  
  for (let i = 4; i < 16; i++) {
    password += allChars[Math.floor(getRandomValue() * allChars.length)];
  }
  
  return password.split('').sort(() => 0.5 - getRandomValue()).join('');
};

export const SuperAdmin: React.FC = () => {
  const { role, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'site' | 'users' | 'messages' | 'analytics' | 'enterprise' | 'med' | 'mess' | 'cricket' | 'slider' | 'settings' | 'themestudio'>('site');
  const [users, setUsers] = useState<any[]>([]);
  const [shopOwners, setShopOwners] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingShopOwner, setEditingShopOwner] = useState<any | null>(null);
  const [viewingShopOwner, setViewingShopOwner] = useState<any | null>(null);
  const [showInvitePass, setShowInvitePass] = useState(false);
  const [showAgroPass, setShowAgroPass] = useState(false);

  // Score Managers State
  const [scoreManagers, setScoreManagers] = useState<any[]>([]);
  const [newSMName, setNewSMName] = useState('');
  const [newSMUsername, setNewSMUsername] = useState('');
  const [newSMPassword, setNewSMPassword] = useState('');
  const [creatingSM, setCreatingSM] = useState(false);
  const [showSMPass, setShowSMPass] = useState<Record<string, boolean>>({});
  const [cricketSubTab, setCricketSubTab] = useState<'players' | 'managers' | 'slider' | 'themestudio'>('players');

  // Account Security Tab States
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordFeedbackMessage, setPasswordFeedbackMessage] = useState<string | null>(null);
  const [passwordFeedbackType, setPasswordFeedbackType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    fetchUsers();
    fetchMessages();
    fetchShopOwners();
    fetchScoreManagers();
  }, []);

  const fetchScoreManagers = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'score_managers')));
      setScoreManagers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching score managers:', err);
      handleFirestoreError(err, OperationType.LIST, 'score_managers');
    }
  };

  const handleUpdateAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedbackMessage(null);

    if (newAdminPassword !== confirmAdminPassword) {
      setPasswordFeedbackType('error');
      setPasswordFeedbackMessage('New passwords do not match.');
      return;
    }

    const strength = checkPasswordStrength(newAdminPassword);
    if (strength.score < 3) {
      setPasswordFeedbackType('error');
      setPasswordFeedbackMessage('Password is too weak. Please include letters, numbers, and use a stronger combination.');
      return;
    }

    setUpdatingPassword(true);
    try {
      // 1. If we have a Firebase Auth User, try to update Firebase Auth session password
      const currentUser = auth.currentUser;
      let updateAuthSuccess = false;
      
      if (currentUser) {
        try {
          await updatePassword(currentUser, newAdminPassword);
          updateAuthSuccess = true;
          console.log('Firebase Auth password updated successfully.');
        } catch (authErr: any) {
          console.warn('Firebase updatePassword encountered an error (likely requires recent login):', authErr);
          if (authErr.code === 'auth/requires-recent-login') {
            console.log('Soft fallback to Database authorization key update due to Firebase re-auth constraint.');
          } else {
            throw authErr;
          }
        }
      }

      // 2. Identify and update active account record in 'authorized_accounts'
      let identifier = currentUser?.email || 
                       currentUser?.phoneNumber || 
                       '';

      try {
        const virtualStr = localStorage.getItem('erp_virtual_user');
        if (virtualStr) {
          const vu = JSON.parse(virtualStr);
          if (vu.email) {
            identifier = vu.email;
          }
        }
      } catch (_) {}
                         
      if (identifier) {
        const cleanId = identifier.replace('@admin.com', '');
        const authRef = doc(db, 'authorized_accounts', cleanId);
        const authSnap = await getDoc(authRef);
        
        if (authSnap.exists()) {
          await setDoc(authRef, { password: newAdminPassword }, { merge: true });
          console.log(`Shadow password synced for authorized account: ${cleanId}`);
        } else {
          const q = query(
            collection(db, 'authorized_accounts'),
            where('email', '==', identifier)
          );
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            const firstDocRef = doc(db, 'authorized_accounts', qSnap.docs[0].id);
            await setDoc(firstDocRef, { password: newAdminPassword }, { merge: true });
            console.log(`Shadow password synced from email query matching: ${identifier}`);
          }
        }
      }

      // Also support updating default admin master key in local storage virtual session if applicable
      try {
        const virtualStr = localStorage.getItem('erp_virtual_user');
        if (virtualStr) {
          const vu = JSON.parse(virtualStr);
          vu.password = newAdminPassword;
          localStorage.setItem('erp_virtual_user', JSON.stringify(vu));
        }
      } catch (_) {}

      setPasswordFeedbackType('success');
      setPasswordFeedbackMessage('Password updated successfully! Google Password Manager is safe and secure with your new unique credential.');
      
      setNewAdminPassword('');
      setConfirmAdminPassword('');
    } catch (err: any) {
      console.error('Password Update Error:', err);
      setPasswordFeedbackType('error');
      setPasswordFeedbackMessage(err.message || 'An error occurred while updating the password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleCreateScoreManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSMUsername.trim() || !newSMPassword.trim() || !newSMName.trim()) {
      alert('Please fill in all fields.');
      return;
    }
    const cleanUsername = newSMUsername.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanUsername.length < 3) {
      alert('Username must be at least 3 alphanumeric characters.');
      return;
    }
    if (newSMPassword.trim().length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    setCreatingSM(true);
    try {
      try {
        await setDoc(doc(db, 'score_managers', cleanUsername), {
          username: cleanUsername,
          name: newSMName.trim(),
          password: newSMPassword.trim(),
          createdAt: new Date().toISOString(),
          createdBy: 'super_admin'
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `score_managers/${cleanUsername}`);
      }

      // Sync authorized accounts so they can be securely identified as score_managers
      try {
        await setDoc(doc(db, 'authorized_accounts', cleanUsername), {
          username: cleanUsername,
          email: `${cleanUsername}@gullyscore.com`,
          password: newSMPassword.trim(),
          role: 'score_manager',
          createdAt: new Date().toISOString(),
          authorizedBy: 'super_admin'
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `authorized_accounts/${cleanUsername}`);
      }

      setNewSMName('');
      setNewSMUsername('');
      setNewSMPassword('');
      alert(`Score Manager "${cleanUsername}" created successfully!`);
      fetchScoreManagers();
    } catch (err) {
      console.error('Failed to create score manager:', err);
      alert('Failed to create Score Manager account');
    } finally {
      setCreatingSM(false);
    }
  };

  const handleDeleteScoreManager = async (username: string) => {
    if (!confirm(`Are you sure you want to delete Score Manager "${username}"? This will revoke all scorekeeping privileges.`)) {
      return;
    }
    try {
      try {
        await deleteDoc(doc(db, 'score_managers', username));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `score_managers/${username}`);
      }
      try {
        await deleteDoc(doc(db, 'authorized_accounts', username));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `authorized_accounts/${username}`);
      }
      alert(`Score Manager "${username}" deleted.`);
      fetchScoreManagers();
    } catch (err) {
      console.error('Error deleting score manager:', err);
      alert('Failed to delete score manager');
    }
  };

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMobile, setInviteMobile] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviting, setInviting] = useState(false);

  const handlePreAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteMobile && !inviteEmail) {
      alert('Please provide at least an Email or a Mobile Number');
      return;
    }
    if (invitePassword.trim().length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    
    setInviting(true);
    try {
      const cleanEmail = inviteEmail.trim().toLowerCase();
      const rawMobile = inviteMobile.replace(/\D/g, '');
      const cleanMobile = rawMobile.length >= 10 ? rawMobile.slice(-10) : rawMobile;
      
      // Create a unique key for the authorization record
      // Priority: cleaned mobile digits > cleaned email
      const authKey = cleanMobile || cleanEmail;
      
      await setDoc(doc(db, 'authorized_accounts', authKey), {
        username: (cleanMobile || cleanEmail.split('@')[0]).toLowerCase(),
        email: cleanEmail || null,
        mobile: cleanMobile || null,
        password: invitePassword.trim(),
        role: 'dairy_admin',
        createdAt: new Date().toISOString(),
        authorizedBy: 'super_admin'
      });
      
      setInviteEmail('');
      setInviteMobile('');
      setInvitePassword('');
      alert('Paid User account pre-authorized successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to pre-authorize');
    } finally {
      setInviting(false);
    }
  };

  const fetchShopOwners = async () => {
    try {
      const q = query(collection(db, 'shop_owners'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setShopOwners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching shop owners:', err);
    }
  };

  const [newAgroOwner, setNewAgroOwner] = useState({
    mobile: '',
    ownerName: '',
    shopName: '',
    password: ''
  });

  const handleCreateAgroOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgroOwner.mobile || !newAgroOwner.password) return;
    if (newAgroOwner.password.trim().length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    try {
      await setDoc(doc(db, 'shop_owners', newAgroOwner.mobile), {
        ...newAgroOwner,
        shopId: newAgroOwner.mobile, // Initial shopId is the mobile, but it will remain immutable
        isBlocked: false,
        createdAt: new Date().toISOString()
      });
      alert('Agro shop owner account created successfully!');
      setNewAgroOwner({ mobile: '', ownerName: '', shopName: '', password: '' });
      fetchShopOwners();
    } catch (err) {
      console.error(err);
      alert('Failed to create agro shop owner');
    }
  };

  const toggleAgroBlock = async (mobile: string, currentStatus: boolean) => {
    try {
      await setDoc(doc(db, 'shop_owners', mobile), { isBlocked: !currentStatus }, { merge: true });
      fetchShopOwners();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAgroOwner = async (mobile: string) => {
    if (!confirm('Are you sure you want to delete this Agro Shop Owner? This will revoke all access.')) return;
    try {
      await deleteDoc(doc(db, 'shop_owners', mobile));
      fetchShopOwners();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAgroOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShopOwner) return;
    if (editingShopOwner.password.trim().length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    const oldMobile = editingShopOwner.id;
    const newMobile = editingShopOwner.mobile;

    try {
      // If mobile changed, we must "migrate" the doc key
      if (newMobile !== oldMobile) {
        // 1. Create new document
        await setDoc(doc(db, 'shop_owners', newMobile), {
          ownerName: editingShopOwner.ownerName,
          shopName: editingShopOwner.shopName,
          password: editingShopOwner.password,
          mobile: newMobile,
          shopId: editingShopOwner.shopId || oldMobile, // Keep the same shop data link
          isBlocked: editingShopOwner.isBlocked || false,
          createdAt: editingShopOwner.createdAt || new Date().toISOString()
        });
        
        // 2. Delete old document
        await deleteDoc(doc(db, 'shop_owners', oldMobile));
      } else {
        // Normal update
        await setDoc(doc(db, 'shop_owners', oldMobile), {
          ownerName: editingShopOwner.ownerName,
          shopName: editingShopOwner.shopName,
          password: editingShopOwner.password,
          mobile: newMobile
        }, { merge: true });
      }
      
      setEditingShopOwner(null);
      fetchShopOwners();
      alert('Shop owner updated successfully! Data access is preserved.');
    } catch (err) {
      console.error(err);
      alert('Failed to update shop owner');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err: any) {
      console.error('Error fetching users:', err);
      if (err.code === 'permission-denied') {
        setError('System Permission Denied: Your administrative role is being synchronized. Please refresh in a moment.');
      } else {
        setError(`Fetch alert: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await deleteDoc(doc(db, 'messages', id));
      fetchMessages();
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This will revoke all access.')) return;
    setLoading(true);
    try {
      // 1. Get the current data to find linked info (UID desyncs)
      const userSnap = await getDoc(doc(db, 'users', id));
      const authSnap = await getDoc(doc(db, 'authorized_accounts', id));
      const userData = userSnap.exists() ? userSnap.data() : (authSnap.exists() ? authSnap.data() : null);

      // 2. Delete primary records
      await deleteDoc(doc(db, 'users', id));
      await deleteDoc(doc(db, 'authorized_accounts', id));

      // 3. Recursive cleanup for desynced UIDs
      if (userData) {
        const { email, mobile } = userData;
        const cleanupQueries = [];
        if (email) cleanupQueries.push(query(collection(db, 'users'), where('email', '==', email)));
        if (mobile) {
          const m10 = mobile.slice(-10);
          cleanupQueries.push(query(collection(db, 'users'), where('mobile', '==', mobile)));
          cleanupQueries.push(query(collection(db, 'users'), where('mobile', '==', m10)));
        }

        for (const q of cleanupQueries) {
          const qSnap = await getDocs(q);
          for (const d of qSnap.docs) {
            if (d.id !== id) {
              await deleteDoc(doc(db, 'users', d.id));
            }
          }
        }
      }
      
      alert('User deleted successfully.');
      fetchUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert(`Failed to delete user: ${err.message || 'Permission Denied'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleDairyAdmin = async (uid: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'dairy_admin' ? null : 'dairy_admin';
      await setDoc(doc(db, 'users', uid), { role: newRole }, { merge: true });
      fetchUsers();
    } catch (err) {
      console.error('Error toggling role:', err);
    }
  };

  if (role !== 'super_admin') {
    return <div className="p-20 text-center font-bold">Access Denied. Super Admin only.</div>;
  }

  const TABS = [
    { id: 'site', label: 'Site CMS' },
    { id: 'themestudio', label: '🎨 Broadcast Theme Studio' },
    { id: 'users', label: 'Users' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'messages', label: 'Messages' },
    { id: 'enterprise', label: 'Agro Enterprise' },
    { id: 'med', label: 'Med Portal' },
    { id: 'mess', label: 'Mess Management' },
    { id: 'cricket', label: 'Player Approvals' },
    { id: 'slider', label: 'Spectator Slider (16:9)' },
    { id: 'settings', label: 'Settings' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 pb-12 px-3 sm:px-6 w-full max-w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 sm:gap-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-primary/10 rounded-2xl text-primary shrink-0">
                <ShieldCheck size={28} className="sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Super Admin Panel</h1>
                <p className="text-gray-500 font-medium text-xs sm:text-sm">Manage Site Content & Users</p>
              </div>
            </div>

            <button 
              onClick={() => logout()}
              className="xl:hidden px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all shrink-0 cursor-pointer border-none"
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile Quick Dropdown for 1-tap switching */}
          <div className="block xl:hidden w-full">
            <div className="relative">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as any)}
                className="w-full bg-gray-100 hover:bg-gray-150 border border-gray-200 text-gray-900 font-bold text-xs sm:text-sm rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {TABS.map(tab => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {/* Horizontally Scrollable Tab Bar */}
          <div className="w-full xl:w-auto overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-1 px-1">
            <div className="flex items-center bg-gray-100 p-1.5 rounded-2xl gap-1 w-max min-w-full sm:min-w-0">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`whitespace-nowrap px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer border-none ${
                    activeTab === tab.id
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 bg-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => logout()}
            className="hidden xl:inline-flex px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all shrink-0 cursor-pointer border-none"
          >
            Sign Out
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'site' ? (
            <motion.div
              key="site"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SiteManagement />
            </motion.div>
          ) : activeTab === 'themestudio' ? (
            <motion.div
              key="themestudio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <BroadcastThemeStudio />
            </motion.div>
          ) : activeTab === 'analytics' ? (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AdminAnalytics />
            </motion.div>
          ) : activeTab === 'users' ? (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center gap-2">
                    <Database className="text-primary" size={20} />
                    Registered Users
                  </h2>
                  
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold uppercase tracking-tight">
                      <AlertCircle size={16} />
                      {error}
                    </div>
                  )}

                  <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                    <table className="w-full text-left min-w-[500px]">
                      <thead>
                        <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                          <th className="py-4">UID</th>
                          <th className="py-4">Email</th>
                          <th className="py-4">Role</th>
                          <th className="py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b border-gray-50/50">
                            <td className="py-4 font-mono text-xs text-gray-400 max-w-[120px] truncate" title={u.id}>{u.id}</td>
                            <td className="py-4 font-bold text-gray-900 text-xs sm:text-sm">{u.email}</td>
                            <td className="py-4">
                               <span className={`px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-600' : u.role === 'dairy_admin' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                 {u.role || 'user'}
                               </span>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {u.role !== 'super_admin' && (
                                  <button
                                    onClick={() => toggleDairyAdmin(u.id, u.role)}
                                    className={`p-2 rounded-lg transition-colors ${u.role === 'dairy_admin' ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-400 hover:text-blue-500'}`}
                                    title={u.role === 'dairy_admin' ? "Remove Dairy Admin Status" : "Make Dairy Admin (Paid)"}
                                  >
                                    <ShieldCheck size={18} />
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-2 text-red-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 size={18} />
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

              <div className="space-y-6 sm:space-y-8">
                <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                    <Mail className="text-primary" size={20} />
                    Pre-authorize Paid User
                  </h3>
                  <p className="text-gray-500 text-sm mb-6 font-medium">Create a new Paid User account by providing an email, mobile number, and password.</p>
                  
                  <form onSubmit={handlePreAuthorize} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address (Optional if Mobile is provided)</label>
                      <input
                        type="email"
                        placeholder="user@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number (Login ID)</label>
                      <input
                        type="tel"
                        placeholder="Enter mobile number"
                        value={inviteMobile}
                        onChange={(e) => setInviteMobile(e.target.value)}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Initial Password</label>
                      <div className="relative">
                        <input
                          type={showInvitePass ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={invitePassword}
                          onChange={(e) => setInvitePassword(e.target.value)}
                          className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowInvitePass(!showInvitePass)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                        >
                          {showInvitePass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={inviting}
                      className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-xs hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {inviting ? 'Creating Account...' : 'Create Paid User'}
                    </button>
                  </form>
                </div>

                <div className="bg-primary rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 text-white shadow-2xl">
                  <Users size={40} className="mb-4 sm:mb-6 opacity-50" />
                  <h3 className="text-3xl sm:text-4xl font-black mb-1 sm:mb-2">{users.length}</h3>
                  <p className="text-primary-foreground/70 font-bold uppercase tracking-widest text-xs">Total Registered Users</p>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'messages' ? (
            <motion.div
              key="messages"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 sm:space-y-8"
            >
              <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6 sm:mb-8">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="text-primary" size={20} />
                    Inquiry Messages
                  </h2>
                  <button 
                    onClick={fetchMessages}
                    className="text-xs font-bold text-primary uppercase tracking-widest hover:underline"
                  >
                    Refresh List
                  </button>
                </div>

                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="p-12 text-center bg-gray-50 rounded-3xl">
                      <p className="text-gray-400 font-medium tracking-tight">No messages received yet.</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-3xl border border-gray-100 group relative">
                        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-black text-gray-900 text-base sm:text-lg tracking-tight uppercase">{msg.name}</h4>
                              {msg.type === 'hire' && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-[9px] sm:text-[10px] font-black rounded-md uppercase tracking-widest">Hire Request</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              <span className="flex items-center gap-1"><Mail size={12} /> {msg.email}</span>
                              <span className="flex items-center gap-1"><Phone size={12} /> {msg.phone}</span>
                              <span className="flex items-center gap-1"><Clock size={12} /> {msg.createdAt?.toDate?.()?.toLocaleString() || 'Recently'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <a 
                              href={`https://wa.me/${msg.phone.replace(/\D/g, '')}?text=Hi ${msg.name}, I received your message: "${msg.subject}"`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-200 hover:scale-105 active:scale-95 transition-all"
                            >
                              Reply on WhatsApp
                            </a>
                            <button 
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Subject: {msg.subject}</p>
                          <p className="text-gray-600 text-sm leading-relaxed">{msg.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'enterprise' ? (
            <motion.div 
              key="enterprise"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 sm:space-y-8"
            >
              <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 lg:p-10 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="p-3 sm:p-4 bg-primary/10 rounded-2xl text-primary shrink-0">
                    <Database size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Enterprise Controls</h2>
                    <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Manage agro shop credentials and access levels.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">Create Shop Owner</h3>
                      <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">New Credential</span>
                    </div>
                    <form onSubmit={handleCreateAgroOwner} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Owner Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Rahul Patil"
                            value={newAgroOwner.ownerName}
                            onChange={(e) => setNewAgroOwner(p => ({ ...p, ownerName: e.target.value }))}
                            className="w-full px-4 sm:px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Shop Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Kisan Agro"
                            value={newAgroOwner.shopName}
                            onChange={(e) => setNewAgroOwner(p => ({ ...p, shopName: e.target.value }))}
                            className="w-full px-4 sm:px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number (Login ID)</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 9876543210"
                          value={newAgroOwner.mobile}
                          onChange={(e) => setNewAgroOwner(p => ({ ...p, mobile: e.target.value }))}
                          className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Initial Password</label>
                        <div className="relative">
                          <input
                            type={showAgroPass ? "text" : "password"}
                            required
                            placeholder="Enter password"
                            value={newAgroOwner.password}
                            onChange={(e) => setNewAgroOwner(p => ({ ...p, password: e.target.value }))}
                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAgroPass(!showAgroPass)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                          >
                            {showAgroPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-xs hover:shadow-lg hover:bg-black transition-all"
                      >
                        Authorize & Create
                      </button>
                    </form>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900">Credential Access Levels</h3>
                    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                      {shopOwners.length === 0 ? (
                        <div className="p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                          <Store className="mx-auto text-gray-200 mb-4" size={32} />
                          <p className="text-gray-400 text-sm italic">No accounts managed yet.</p>
                        </div>
                      ) : (
                        shopOwners.map(owner => (
                          <div key={owner.id} className="p-4 sm:p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:bg-white hover:shadow-md transition-all">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="p-2.5 sm:p-3 bg-white rounded-xl text-primary shadow-sm group-hover:scale-110 transition-transform shrink-0">
                                <Store size={18} />
                              </div>
                              <div>
                                <p className="font-black text-gray-900 tracking-tight text-sm sm:text-base">{owner.shopName}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase">{owner.ownerName}</span>
                                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                  <span className="text-[10px] font-mono text-gray-500">{owner.mobile}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap self-end sm:self-auto">
                               <button
                                 onClick={() => setViewingShopOwner(owner)}
                                 className="p-2 bg-white rounded-lg text-gray-400 hover:text-blue-500 border border-gray-100 shadow-sm transition-all"
                                 title="View Credentials"
                               >
                                 <Eye size={14} />
                               </button>
                               <button
                                 onClick={() => setEditingShopOwner(owner)}
                                 className="p-2 bg-white rounded-lg text-gray-400 hover:text-primary border border-gray-100 shadow-sm transition-all"
                                 title="Edit Account"
                               >
                                 <Edit2 size={14} />
                               </button>
                               <button
                                 onClick={() => toggleAgroBlock(owner.id, owner.isBlocked)}
                                 className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${owner.isBlocked ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-600'}`}
                                 title={owner.isBlocked ? "Unblock User" : "Block User"}
                               >
                                 {owner.isBlocked ? 'Blocked' : 'Active'}
                               </button>
                               <button
                                 onClick={() => handleDeleteAgroOwner(owner.id)}
                                 className="p-2 bg-white rounded-lg text-red-400 hover:text-red-600 border border-gray-100 shadow-sm transition-all"
                                 title="Delete Content & Access"
                               >
                                 <Trash2 size={14} />
                               </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit Modal */}
                <AnimatePresence>
                  {editingShopOwner && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="w-full max-w-lg bg-white rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                      >
                        <div className="p-4 sm:p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Edit Shop Credentials</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">ID: {editingShopOwner.id}</p>
                          </div>
                          <button onClick={() => setEditingShopOwner(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <X size={20} />
                          </button>
                        </div>
                        <form onSubmit={handleUpdateAgroOwner} className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 overflow-y-auto">
                           <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Owner Name</label>
                                  <input
                                    type="text"
                                    required
                                    value={editingShopOwner.ownerName}
                                    onChange={(e) => setEditingShopOwner({...editingShopOwner, ownerName: e.target.value})}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Shop Name</label>
                                  <input
                                    type="text"
                                    required
                                    value={editingShopOwner.shopName}
                                    onChange={(e) => setEditingShopOwner({...editingShopOwner, shopName: e.target.value})}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number (Login ID)</label>
                                <input
                                  type="text"
                                  required
                                  value={editingShopOwner.mobile}
                                  onChange={(e) => setEditingShopOwner({...editingShopOwner, mobile: e.target.value})}
                                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative">
                                  <input
                                    type={showAgroPass ? "text" : "password"}
                                    required
                                    value={editingShopOwner.password}
                                    onChange={(e) => setEditingShopOwner({...editingShopOwner, password: e.target.value})}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowAgroPass(!showAgroPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                  >
                                    {showAgroPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>
                                </div>
                              </div>
                           </div>
                           <div className="pt-4 flex gap-4">
                              <button
                                type="submit"
                                className="flex-1 py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-xs hover:shadow-lg transition-all"
                              >
                                Update Security Profile
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingShopOwner(null)}
                                className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest"
                              >
                                Cancel
                              </button>
                           </div>
                        </form>
                      </motion.div>
                    </div>
                  )}

                  {viewingShopOwner && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="w-full max-w-md bg-white rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                      >
                        <div className="p-4 sm:p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-primary text-white shrink-0">
                          <div className="flex items-center gap-3">
                            <Store size={24} />
                            <div>
                              <h3 className="text-lg sm:text-xl font-bold tracking-tight">{viewingShopOwner.shopName}</h3>
                              <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Ownership Credentials</p>
                            </div>
                          </div>
                          <button onClick={() => setViewingShopOwner(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <X size={20} />
                          </button>
                        </div>
                        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 overflow-y-auto">
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Owner Name</p>
                                <p className="font-bold text-gray-900 border-b border-gray-100 pb-2">{viewingShopOwner.ownerName}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${viewingShopOwner.isBlocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                  {viewingShopOwner.isBlocked ? 'Blocked' : 'Active'}
                                </span>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mobile (Login ID)</p>
                                <p className="font-bold text-gray-900 border-b border-gray-100 pb-2">{viewingShopOwner.mobile}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Password</p>
                                <p className="font-mono font-bold text-primary border-b border-gray-100 pb-2">{viewingShopOwner.password}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Shop ID (System)</p>
                                <p className="font-mono text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">{viewingShopOwner.shopId || viewingShopOwner.id}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Created</p>
                                <p className="text-gray-600 text-sm">{new Date(viewingShopOwner.createdAt).toLocaleString()}</p>
                              </div>
                           </div>
                           
                           <div className="pt-4 flex gap-3">
                              <button
                                onClick={() => {
                                  setEditingShopOwner(viewingShopOwner);
                                  setViewingShopOwner(null);
                                }}
                                className="flex-1 py-4 bg-gray-100 text-gray-900 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                              >
                                <Edit2 size={14} />
                                Edit Account
                              </button>
                              <button
                                onClick={() => {
                                  toggleAgroBlock(viewingShopOwner.id, viewingShopOwner.isBlocked);
                                  setViewingShopOwner(null);
                                }}
                                className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${viewingShopOwner.isBlocked ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-red-500 text-white shadow-lg shadow-red-100'}`}
                              >
                                {viewingShopOwner.isBlocked ? 'Unblock Now' : 'Block Access'}
                              </button>
                           </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : activeTab === 'med' ? (
            <motion.div
              key="med"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <MedPortalManagement />
            </motion.div>
          ) : activeTab === 'mess' ? (
            <motion.div
              key="mess"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <MessPortalManagement />
            </motion.div>
          ) : activeTab === 'cricket' ? (
            <motion.div
              key="cricket"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 sm:mb-8">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-3">
                      <ShieldCheck className="text-primary shrink-0" />
                      Cricket League Dashboard & Scoring
                    </h2>
                    <p className="text-gray-500 font-medium text-xs sm:text-sm mt-1">
                      Manage player directories, league settings, and GullyScore local scorekeeper credentials.
                    </p>
                  </div>
                  
                  {/* Sub tab selectors */}
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-100 p-1 rounded-2xl overflow-x-auto max-w-full no-scrollbar">
                    <button
                      onClick={() => setCricketSubTab('players')}
                      type="button"
                      className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer whitespace-nowrap ${cricketSubTab === 'players' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 bg-transparent'}`}
                    >
                      Player Approvals
                    </button>
                    <button
                      onClick={() => setCricketSubTab('managers')}
                      type="button"
                      className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer whitespace-nowrap ${cricketSubTab === 'managers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 bg-transparent'}`}
                    >
                      Scorekeepers & Managers
                    </button>
                    <button
                      onClick={() => setCricketSubTab('slider')}
                      type="button"
                      className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer whitespace-nowrap ${cricketSubTab === 'slider' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 bg-transparent'}`}
                    >
                      Spectator 16:9 Slider
                    </button>
                    <button
                      onClick={() => setCricketSubTab('themestudio')}
                      type="button"
                      className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer whitespace-nowrap ${cricketSubTab === 'themestudio' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 bg-transparent'}`}
                    >
                      🎨 Theme Studio
                    </button>
                  </div>
                </div>

                {cricketSubTab === 'players' ? (
                  <PlayerDirectoryDashboard forceAdminMode={true} />
                ) : cricketSubTab === 'slider' ? (
                  <SpectatorSliderAdmin />
                ) : cricketSubTab === 'themestudio' ? (
                  <BroadcastThemeStudio />
                ) : (
                  <div className="space-y-8">
                    {/* Score Manager creation form */}
                    <div className="bg-gray-50 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem] border border-gray-150">
                      <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2 flex items-center gap-2">
                        <Plus className="text-primary shrink-0" /> Create GullyScore Scorekeeper / Score Manager
                      </h3>
                      <p className="text-xs text-gray-500 font-medium mb-6">
                        Provide credentials below. Scorekeepers and score managers can log in on the dedicated GullyScore score management interface to update scores, start, edit, and manage matches.
                      </p>
                      
                      <form onSubmit={handleCreateScoreManager} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-end">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Full Name</label>
                          <input
                            type="text"
                            placeholder="e.g. John Doe (Scorekeeper)"
                            value={newSMName}
                            onChange={(e) => setNewSMName(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-primary/20"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Username (Login ID)</label>
                          <input
                            type="text"
                            placeholder="e.g. john_scorekeeper"
                            value={newSMUsername}
                            onChange={(e) => setNewSMUsername(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-primary/20"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2 relative">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Password</label>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setNewSMPassword(generateSecurePassword())}
                                className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-wider border-none bg-transparent cursor-pointer flex items-center gap-1"
                              >
                                <Sparkles size={12} /> Generate Strong
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowInvitePass(!showInvitePass)}
                                className="text-primary hover:underline text-[10px] font-bold uppercase tracking-wider border-none bg-transparent cursor-pointer"
                              >
                                {showInvitePass ? "Hide" : "Show"}
                              </button>
                            </div>
                          </div>
                          <input
                            type={showInvitePass ? "text" : "password"}
                            placeholder="Min 6 characters"
                            value={newSMPassword}
                            onChange={(e) => setNewSMPassword(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-primary/20"
                            required
                          />
                          {newSMPassword && (
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-extrabold text-gray-400 uppercase tracking-wider text-[9px]">Strength:</span>
                                <span className={`font-black uppercase tracking-wider text-[9px] ${
                                  checkPasswordStrength(newSMPassword).score <= 1 ? 'text-rose-500' :
                                  checkPasswordStrength(newSMPassword).score === 2 ? 'text-amber-500' :
                                  checkPasswordStrength(newSMPassword).score === 3 ? 'text-yellow-600' :
                                  'text-emerald-600'
                                }`}>
                                  {checkPasswordStrength(newSMPassword).label}
                                </span>
                              </div>
                              <div className="grid grid-cols-4 gap-1 h-1">
                                {[1, 2, 3, 4].map((step) => (
                                  <div
                                    key={step}
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      step <= checkPasswordStrength(newSMPassword).score
                                        ? checkPasswordStrength(newSMPassword).score <= 1 ? 'bg-rose-500' :
                                          checkPasswordStrength(newSMPassword).score === 2 ? 'bg-amber-500' :
                                          checkPasswordStrength(newSMPassword).score === 3 ? 'bg-yellow-500' :
                                          'bg-emerald-500'
                                        : 'bg-gray-150'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="md:col-span-3 flex justify-end">
                          <button
                            type="submit"
                            disabled={creatingSM}
                            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold uppercase tracking-wider text-xs shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 cursor-pointer border-none"
                          >
                            {creatingSM ? "Provisioning..." : "Add Scorekeeper"}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Existing Score Managers table list */}
                    <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-sm">
                      <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xs sm:text-sm font-black text-gray-800 uppercase tracking-wider">Authorized Scorekeeper Accounts</h3>
                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {scoreManagers.length} Total
                        </span>
                      </div>
                      
                      {scoreManagers.length === 0 ? (
                        <div className="p-8 sm:p-12 text-center">
                          <AlertCircle className="mx-auto text-gray-300 mb-2" size={32} />
                          <p className="text-sm text-gray-500 font-medium">No scorekeepers created yet.</p>
                          <p className="text-xs text-gray-400 mt-1">Use the form above to provision scorekeeper login credentials.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[520px]">
                            <thead>
                              <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="p-4 text-[10px] font-bold uppercase text-gray-450 tracking-wider">Full Name</th>
                                <th className="p-4 text-[10px] font-bold uppercase text-gray-450 tracking-wider">Username</th>
                                <th className="p-4 text-[10px] font-bold uppercase text-gray-450 tracking-wider">Password</th>
                                <th className="p-4 text-[10px] font-bold uppercase text-gray-450 tracking-wider">Created At</th>
                                <th className="p-4 text-right text-[10px] font-bold uppercase text-gray-450 tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {scoreManagers.map((sm) => (
                                <tr key={sm.username} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                  <td className="p-4 text-xs font-bold text-gray-800">{sm.name}</td>
                                  <td className="p-4 text-xs font-mono font-bold text-indigo-600">{sm.username}</td>
                                  <td className="p-4 text-xs font-mono font-bold text-gray-500">
                                    <div className="flex items-center gap-2">
                                      <span>{showSMPass[sm.username] ? sm.password : "• • • • • •"}</span>
                                      <button
                                        onClick={() => setShowSMPass(prev => ({ ...prev, [sm.username]: !prev[sm.username] }))}
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none bg-transparent border-none p-0.5 cursor-pointer"
                                        type="button"
                                      >
                                        {showSMPass[sm.username] ? <EyeOff size={14} /> : <Eye size={14} />}
                                      </button>
                                    </div>
                                  </td>
                                  <td className="p-4 text-xs text-gray-400">
                                    {sm.createdAt ? new Date(sm.createdAt).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="p-4 text-right">
                                    <button
                                      onClick={() => handleDeleteScoreManager(sm.username)}
                                      className="p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                                      title="Revoke Permission"
                                      type="button"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'slider' ? (
            <motion.div
              key="slider"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SpectatorSliderAdmin />
            </motion.div>
          ) : (
             <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              {/* Account Security & Password Manager Dashboard */}
              <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 shadow-sm border border-gray-100 animate-fade-in text-left">
                <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-8 flex-wrap gap-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      <SettingsIcon size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 leading-none">Security & Credentials</h2>
                      <p className="text-xs text-gray-400 mt-1">Upgrade passwords to protect against breach warnings.</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1.5 ml-auto">
                    <ShieldCheck size={12} /> Active Admin Session
                  </span>
                </div>

                <div className="mb-6 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-3 text-left">
                  <AlertCircle size={18} className="text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Why Google Password Manager Warns You</h4>
                    <p className="text-xs text-blue-800/80 mt-1 leading-relaxed">
                      Google Password Manager automatically crosses your submitted passcode against databases of public data breaches. 
                      If any other website ever leaked that same password, Google displays a warning advising an update. 
                      <strong> To solve this immediately, update your credentials below to a newly generated, unique secure passcode.</strong>
                    </p>
                  </div>
                </div>

                {passwordFeedbackMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-6 p-4 rounded-2xl border flex items-start gap-3 text-xs font-semibold ${
                      passwordFeedbackType === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                        : passwordFeedbackType === 'error'
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                        : 'bg-blue-500/10 border-blue-500/20 text-blue-600'
                    }`}
                  >
                    {passwordFeedbackType === 'success' ? (
                      <ShieldCheck size={18} className="shrink-0 text-emerald-500" />
                    ) : (
                      <AlertCircle size={18} className="shrink-0 text-rose-500" />
                    )}
                    <span className="leading-relaxed">{passwordFeedbackMessage}</span>
                  </motion.div>
                )}

                <form onSubmit={handleUpdateAdminPassword} className="space-y-6 text-left">
                  {/* Active User Information */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between flex-wrap gap-2 text-left">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Authorized Identity</span>
                      <span className="text-sm font-bold text-gray-700">
                        {auth.currentUser?.email || (JSON.parse(localStorage.getItem('erp_virtual_user') || '{}')).email || 'Super Administrator'}
                      </span>
                    </div>
                    <span className="bg-gray-200/50 text-gray-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Role: SuperAdmin
                    </span>
                  </div>

                  {/* New Password Input */}
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">New Security Password</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const securePass = generateSecurePassword();
                            setNewAdminPassword(securePass);
                            setConfirmAdminPassword(securePass);
                          }}
                          className="text-emerald-650 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-widest border-none bg-transparent cursor-pointer flex items-center gap-1.5"
                        >
                          <Sparkles size={12} /> Generate Strong
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAdminPass(!showAdminPass)}
                          className="text-primary hover:underline text-[10px] font-bold uppercase tracking-wider border-none bg-transparent cursor-pointer"
                        >
                          {showAdminPass ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-3.5 text-gray-400 font-medium" />
                      <input
                        type={showAdminPass ? "text" : "password"}
                        placeholder="Choose a strong unique credential"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        className="w-full bg-white border border-gray-250 rounded-2xl pl-12 pr-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-primary/20"
                        required
                        disabled={updatingPassword}
                      />
                    </div>

                    {/* Real-Time Password Strength meter */}
                    {newAdminPassword && (
                      <div className="mt-3 p-3 bg-gray-55 border border-gray-100 rounded-2xl space-y-2 text-left">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-gray-500 uppercase tracking-wider text-[10px]">
                            Password Entropy Level:
                          </span>
                          <span className={`font-black uppercase tracking-wider text-[10px] ${
                            checkPasswordStrength(newAdminPassword).score <= 1 ? 'text-rose-500' :
                            checkPasswordStrength(newAdminPassword).score === 2 ? 'text-amber-500' :
                            checkPasswordStrength(newAdminPassword).score === 3 ? 'text-yellow-600' :
                            'text-emerald-600'
                          }`}>
                            {checkPasswordStrength(newAdminPassword).label}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 h-1.5">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-full rounded-full transition-all duration-300 ${
                                step <= checkPasswordStrength(newAdminPassword).score
                                  ? checkPasswordStrength(newAdminPassword).score <= 1 ? 'bg-rose-500' :
                                    checkPasswordStrength(newAdminPassword).score === 2 ? 'bg-amber-500' :
                                    checkPasswordStrength(newAdminPassword).score === 3 ? 'bg-yellow-500' :
                                    'bg-emerald-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        {checkPasswordStrength(newAdminPassword).feedback.length > 0 && (
                          <div className="pt-1.5 border-t border-gray-200/50 mt-1.5">
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block mb-1">Requirements Checklist:</span>
                            <ul className="space-y-1 text-[11px] text-gray-500 font-semibold pl-4 list-disc">
                              {checkPasswordStrength(newAdminPassword).feedback.map((f, i) => (
                                <li key={i} className={f.includes('Warning') ? 'text-rose-500 font-bold list-none pl-0 -ml-4 flex items-center gap-1' : ''}>
                                  {f.includes('Warning') && <ShieldAlert size={12} className="shrink-0 text-rose-500" />}
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Confirm New Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-3.5 text-gray-400 font-medium" />
                      <input
                        type={showAdminPass ? "text" : "password"}
                        placeholder="Re-type your strong security key"
                        value={confirmAdminPassword}
                        onChange={(e) => setConfirmAdminPassword(e.target.value)}
                        className="w-full bg-white border border-gray-250 rounded-2xl pl-12 pr-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-primary/20"
                        required
                        disabled={updatingPassword}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={updatingPassword || !newAdminPassword || newAdminPassword !== confirmAdminPassword}
                    className="w-full py-4 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white rounded-2xl font-black uppercase tracking-wider text-xs shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
                  >
                    {updatingPassword ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Updating Security Credentials...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Confirm and Tighten Security</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Password Hygiene Best Practices */}
              <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-150 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <ShieldCheck size={16} className="text-emerald-500" /> Use Unique Passwords
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                    Reusing the same password across multiple online accounts is the number one cause of security compromises. Keep a distinct key for each portal.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-amber-500" /> Leverage Generator
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                    Our cryptographically safe 16-character generator produces high-complexity keys that automatic prying crawlers cannot easily guess.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
       </div>
    </div>
  );
};
