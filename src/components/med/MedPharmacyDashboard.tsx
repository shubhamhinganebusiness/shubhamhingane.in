import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pill, Search, CheckCircle2, History, TrendingUp, Calendar, Clock,
  MapPin, Phone, User, Package, Stethoscope,
  ArrowLeft, FileText, ExternalLink, Filter, LogOut,
  Receipt, Database, Bell, LineChart, ShoppingCart, 
  Plus, Edit, Trash2, Download, Upload, AlertCircle, 
  Check, FileJson, Mail, ChevronRight, RefreshCw, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Prescription, Medication } from './types';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, doc, updateDoc, setDoc, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Type declarations
export interface StockMedicine {
  id: string;
  name: string;
  genericName: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  quantity: number;
  unitPrice: number;
  supplierName: string;
}

export interface BillingCartItem {
  id: string;
  medicine: StockMedicine | { id: string; name: string; unitPrice: number; batchNumber: string };
  quantity: number;
  unitPrice: number;
}

export interface AlertLog {
  id: string;
  medicineName: string;
  currentStock: number;
  threshold: number;
  timestamp: string;
  simulatedEmailSentTo: string;
}

export interface SalesHistoryRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  items: { name: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'UPI';
}

const DEFAULT_MEDICINES: Omit<StockMedicine, 'id'>[] = [
  { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin Trihydrate', batchNumber: 'AMX-912', expiryDate: '2026-12-15', quantity: 45, unitPrice: 90, supplierName: 'Astra Pharmaceuticals' },
  { name: 'Paracetamol 650mg', genericName: 'Acetaminophen', batchNumber: 'PCM-401', expiryDate: '2026-06-02', quantity: 8, unitPrice: 15, supplierName: "Dr. Reddy's Lab" }, // expiring in ~12 days & low stock
  { name: 'Cetirizine 10mg', genericName: 'Cetirizine Dihydrochloride', batchNumber: 'CTZ-012', expiryDate: '2026-11-20', quantity: 4, unitPrice: 25, supplierName: 'Cipla Ltd' }, // low stock
  { name: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', batchNumber: 'MET-909', expiryDate: '2027-04-18', quantity: 120, unitPrice: 45, supplierName: 'Sun Pharma' },
  { name: 'Amlodipine 5mg', genericName: 'Amlodipine Besylate', batchNumber: 'AML-112', expiryDate: '2026-06-15', quantity: 12, unitPrice: 35, supplierName: 'Abbott India' }, // expiring in ~25 days
  { name: 'Azithromycin 500mg', genericName: 'Azithromycin', batchNumber: 'AZI-761', expiryDate: '2027-01-10', quantity: 55, unitPrice: 120, supplierName: 'Lupin Ltd' },
  { name: 'Pantoprazole 40mg', genericName: 'Pantoprazole Sodium', batchNumber: 'PAN-502', expiryDate: '2026-09-04', quantity: 6, unitPrice: 60, supplierName: 'Alkem Labs' }, // low stock
  { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', batchNumber: 'IBU-302', expiryDate: '2027-08-30', quantity: 90, unitPrice: 18, supplierName: 'Torrent Pharma' }
];

export const MedPharmacyDashboard: React.FC = () => {
  const { isPharmacy, pharmacyId, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isPharmacy) {
      navigate('/med-login');
    }
  }, [authLoading, isPharmacy, navigate]);

  // Root States
  const [activeTab, setActiveTab] = useState<'emr' | 'billing' | 'inventory' | 'alerts' | 'report'>('emr');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  
  // Inventory state (Persisted in localStorage)
  const [inventory, setInventory] = useState<StockMedicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);
  const [showAddMedicineForm, setShowAddMedicineForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<StockMedicine | null>(null);

  // Form State for Adding / Editing Medicine
  const [medForm, setMedForm] = useState({
    name: '',
    genericName: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 10,
    unitPrice: 10,
    supplierName: ''
  });

  // Billing States
  const [billingCart, setBillingCart] = useState<BillingCartItem[]>([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [billingQuantity, setBillingQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [taxRate, setTaxRate] = useState<5 | 12 | 0>(5); // 5% or 12% GST or Excluded (0%)
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI'>('Cash');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [finalizedReceipt, setFinalizedReceipt] = useState<SalesHistoryRecord | null>(null);
  const [activePrescriptionReferral, setActivePrescriptionReferral] = useState<string | null>(null);

  // Dispensed prescriptions tracker (saves IDs of prescriptions that local user has dispensed to match on-screen status updates instantly)
  const [dispensedRxIds, setDispensedRxIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pharmacy_dispensed_rx_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Alert Log State (Persisted in localStorage)
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([]);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Sales Log State (Persisted in localStorage)
  const [salesHistory, setSalesHistory] = useState<SalesHistoryRecord[]>([]);

  // Simulation Inbox Prescriptions (Local state supporting simulation trigger)
  const [localPrescriptions, setLocalPrescriptions] = useState<Prescription[]>([]);
  const [showSimulateInboxModal, setShowSimulateInboxModal] = useState(false);
  const [simPatientName, setSimPatientName] = useState('');
  const [simMedicineName, setSimMedicineName] = useState('Paracetamol 650mg');
  const [simDosage, setSimDosage] = useState('1-0-1');
  const [simQtyPrescribed, setSimQtyPrescribed] = useState(10);
  const [simInstructions, setSimInstructions] = useState('Take post meals.');

  // Visual Progress & Spinner simulation states for Adding Medicine / Finalizing Bill
  const [salesReportGrouping, setSalesReportGrouping] = useState<'day' | 'month'>('day');
  const [isProcessingBill, setIsProcessingBill] = useState(false);
  const [billProgress, setBillProgress] = useState(0);
  const [isSavingMedicine, setIsSavingMedicine] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial Data Loading & Persistence
  useEffect(() => {
    // Load Inventory standard setup
    const savedInventory = localStorage.getItem('pharmacy_inventory');
    if (savedInventory) {
      setInventory(JSON.parse(savedInventory));
    } else {
      resetDemoInventory();
    }

    // Load Alert Logs
    const savedAlerts = localStorage.getItem('pharmacy_alert_logs');
    if (savedAlerts) {
      setAlertLogs(JSON.parse(savedAlerts));
    }

    // Load Sales History
    const savedSales = localStorage.getItem('pharmacy_sale_history');
    if (savedSales) {
      setSalesHistory(JSON.parse(savedSales));
    }

    // Load threshold preference
    const savedThreshold = localStorage.getItem('pharmacy_low_threshold');
    if (savedThreshold) {
      setLowStockThreshold(Number(savedThreshold));
    }

    // Load simulated prescriptions
    const savedLocalRx = localStorage.getItem('pharmacy_local_rx');
    if (savedLocalRx) {
      setLocalPrescriptions(JSON.parse(savedLocalRx));
    }
  }, []);

  // 1b. Real-time Doctor Prescription synchronized updates handler
  useEffect(() => {
    const handleSyncPrescriptions = () => {
      const savedLocalRx = localStorage.getItem('pharmacy_local_rx');
      if (savedLocalRx) {
        setLocalPrescriptions(JSON.parse(savedLocalRx));
      }
    };
    window.addEventListener('storage', handleSyncPrescriptions);
    return () => window.removeEventListener('storage', handleSyncPrescriptions);
  }, []);

  // Update Inventory Helper
  const updateInventoryState = (newInv: StockMedicine[]) => {
    setInventory(newInv);
    localStorage.setItem('pharmacy_inventory', JSON.stringify(newInv));
  };

  // Helper: Reset Demo Data
  const resetDemoInventory = () => {
    const formatted: StockMedicine[] = DEFAULT_MEDICINES.map((m, i) => ({
      id: `MED-${1000 + i}`,
      ...m
    }));
    updateInventoryState(formatted);

    // Seed default simulated EMR prescriptions
    const seedRx: Prescription[] = [
      {
        id: 'RX-7720-A',
        doctorId: 'dr_david',
        doctorName: 'Dr. David Fischer',
        patientId: 'p1',
        patientName: 'Rahul Sharma',
        date: new Date().toISOString(),
        status: 'Pending',
        medications: [
          { id: 'm1', name: 'Paracetamol 650mg', dosage: '1-0-1', instructions: 'Take after meals', duration: '5 days' },
          { id: 'm2', name: 'Cetirizine 10mg', dosage: '0-0-1', instructions: 'Before sleep', duration: '3 days' }
        ],
        category: 'General',
        signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10 20 Q 30 5, 50 35 T 90 10" fill="none" stroke="red" stroke-width="2"/></svg>'
      },
      {
        id: 'RX-9905-B',
        doctorId: 'dr_david',
        doctorName: 'Dr. David Fischer',
        patientId: 'p2',
        patientName: 'Amit Patil',
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        status: 'Pending',
        medications: [
          { id: 'm3', name: 'Amoxicillin 500mg', dosage: '1-1-1', instructions: 'Complete full course', duration: '7 days' }
        ],
        category: 'Other',
        signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M15 15 C 35 3, 40 38, 70 20 T 95 30" fill="none" stroke="blue" stroke-width="2"/></svg>'
      }
    ];
    setLocalPrescriptions(seedRx);
    localStorage.setItem('pharmacy_local_rx', JSON.stringify(seedRx));

    // Clear alert logs & sales logs representing original demo reset
    setAlertLogs([]);
    setSalesHistory([]);
    localStorage.removeItem('pharmacy_alert_logs');
    localStorage.removeItem('pharmacy_sale_history');

    showNotification("Demo clinical stocks, EMR prescription queues and logs initialized!");
  };

  // Automated notification handler
  const showNotification = (message: string) => {
    setToastNotification(message);
    setTimeout(() => setToastNotification(null), 5500);
  };

  // 2. Fetch Prescriptions (Firestore Integration isolated by Pharmacy ID)
  useEffect(() => {
    const activePharmacyId = pharmacyId || 'Metro_rx';

    const q = query(
      collection(db, 'prescriptions'),
      where('pharmacyId', '==', activePharmacyId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Merge live Firestore prescriptions with any local demo prescriptions
      const fsList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Prescription));
      setPrescriptions(fsList);
    }, (err) => {
      console.warn('Firestore real-time subscription error:', err);
    });

    return () => unsubscribe();
  }, [pharmacyId]);

  // Combine live firestore prescriptions + local simulated ones to present in the EMR inbox (with deduplication)
  const allPrescriptions = React.useMemo(() => {
    const map = new Map<string, Prescription>();
    localPrescriptions.forEach(p => {
      if (p && p.id) map.set(p.id, p);
    });
    prescriptions.forEach(p => {
      if (p && p.id) {
        const existing = map.get(p.id);
        if (existing && existing.status === 'Dispensed' && p.status === 'Pending') {
          map.set(p.id, { ...p, status: 'Dispensed' });
        } else {
          map.set(p.id, p);
        }
      }
    });
    // Apply local dispensed rx overrides
    dispensedRxIds.forEach(id => {
      const existing = map.get(id);
      if (existing) {
        map.set(id, { ...existing, status: 'Dispensed' });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      return dateB - dateA;
    });
  }, [localPrescriptions, prescriptions, dispensedRxIds]);

  // Grouped sales history statistics (day-wise vs month-wise)
  const groupedSalesReportData = React.useMemo(() => {
    const dayGroups: { [key: string]: { date: string, txCount: number, revenue: number, itemsCount: number, transactions: SalesHistoryRecord[] } } = {};
    const monthGroups: { [key: string]: { month: string, txCount: number, revenue: number, itemsCount: number, transactions: SalesHistoryRecord[] } } = {};

    salesHistory.forEach((rec) => {
      const dateObj = new Date(rec.date);
      if (isNaN(dateObj.getTime())) return;

      const dayKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
      const monthKey = dayKey.substring(0, 7); // YYYY-MM

      const itemsSum = rec.items.reduce((sum, item) => sum + item.quantity, 0);

      // Day aggregation
      if (!dayGroups[dayKey]) {
        dayGroups[dayKey] = { date: dayKey, txCount: 0, revenue: 0, itemsCount: 0, transactions: [] };
      }
      dayGroups[dayKey].txCount += 1;
      dayGroups[dayKey].revenue += rec.total;
      dayGroups[dayKey].itemsCount += itemsSum;
      dayGroups[dayKey].transactions.push(rec);

      // Month aggregation
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = { month: monthKey, txCount: 0, revenue: 0, itemsCount: 0, transactions: [] };
      }
      monthGroups[monthKey].txCount += 1;
      monthGroups[monthKey].revenue += rec.total;
      monthGroups[monthKey].itemsCount += itemsSum;
      monthGroups[monthKey].transactions.push(rec);
    });

    const formattedDays = Object.values(dayGroups).map((d) => ({
      period: d.date,
      txCount: d.txCount,
      revenue: d.revenue,
      itemsCount: d.itemsCount,
      transactions: d.transactions
    })).sort((a, b) => b.period.localeCompare(a.period));

    const formattedMonths = Object.values(monthGroups).map((m) => ({
      period: m.month,
      txCount: m.txCount,
      revenue: m.revenue,
      itemsCount: m.itemsCount,
      transactions: m.transactions
    })).sort((a, b) => b.period.localeCompare(a.period));

    return { days: formattedDays, months: formattedMonths };
  }, [salesHistory]);

  // 3. Low-Stock Monitoring System
  const triggerLowStockLog = (medName: string, currentAmount: number) => {
    const alertId = `ALT-${Date.now()}`;
    const emailTarget = 'admin@pharmacy.com';
    const alertRecord: AlertLog = {
      id: alertId,
      medicineName: medName,
      currentStock: currentAmount,
      threshold: lowStockThreshold,
      timestamp: new Date().toISOString(),
      simulatedEmailSentTo: emailTarget
    };
    
    const updatedAlerts = [alertRecord, ...alertLogs];
    setAlertLogs(updatedAlerts);
    localStorage.setItem('pharmacy_alert_logs', JSON.stringify(updatedAlerts));

    // Trigger Simulator toaster/modal popup
    showNotification(`Email sent to admin@pharmacy.com: Medicine ${medName} low stock (current: ${currentAmount})`);
  };

  // Helper helper to deduct quantity and trigger alert if low
  const deductInventoryStock = (medName: string, deductQty: number) => {
    const matched = inventory.find(i => i.name.toLowerCase() === medName.toLowerCase());
    if (matched) {
      const newQty = Math.max(0, matched.quantity - deductQty);
      const updated = inventory.map(item => {
        if (item.id === matched.id) {
          return { ...item, quantity: newQty };
        }
        return item;
      });
      updateInventoryState(updated);
      
      // Fire simulated low stock alert
      if (newQty < lowStockThreshold) {
        triggerLowStockLog(matched.name, newQty);
      }
    }
  };

  // 4. Pharmacy EMR "Accept Prescription -> Auto-Fill Billing Cart"
  const handleAcceptPrescriptionToCart = (rx: Prescription) => {
    const newCartItems: BillingCartItem[] = [];
    
    rx.medications.forEach((med, idx) => {
      // Find matching medicine in our live inventory
      const inStock = inventory.find(item => item.name.toLowerCase() === med.name.toLowerCase());
      
      // Parse quantity: e.g. "10" or "5 days" * dosage quantity count. Let's look up standard or default to 10.
      const rawCount = parseFloat(med.duration) || 10;
      
      if (inStock) {
        newCartItems.push({
          id: `BI-${Date.now()}-${idx}`,
          medicine: inStock,
          quantity: rawCount,
          unitPrice: inStock.unitPrice
        });
      } else {
        // Fallback: Create dynamic medication not listed yet
        newCartItems.push({
          id: `BI-${Date.now()}-${idx}`,
          medicine: {
            id: `M-TEMP-${idx}`,
            name: med.name,
            unitPrice: 50, // standard default
            batchNumber: 'GEN-MOCK'
          },
          quantity: rawCount,
          unitPrice: 50
        });
      }
    });

    setBillingCart(newCartItems);
    setCustomerName(rx.patientName);
    setActivePrescriptionReferral(rx.id);
    setActiveTab('billing'); // Change to Billing tab!
    showNotification(`Prescription ${rx.id} contents imported. Switched to Tax Billing panel.`);
  };

  // 5. Billing Operations
  const handleAddMedicineToCart = () => {
    if (!selectedMedicineId) return;
    const med = inventory.find(i => i.id === selectedMedicineId);
    if (!med) return;

    // Check if medication is already in cart
    const existing = billingCart.find(c => {
      const cMed = c.medicine as StockMedicine;
      return cMed.id === med.id;
    });

    if (existing) {
      const updated = billingCart.map(c => {
        const cMed = c.medicine as StockMedicine;
        if (cMed.id === med.id) {
          return { ...c, quantity: c.quantity + billingQuantity };
        }
        return c;
      });
      setBillingCart(updated);
    } else {
      setBillingCart([
        ...billingCart,
        {
          id: `BI-${Date.now()}`,
          medicine: med,
          quantity: billingQuantity,
          unitPrice: med.unitPrice
        }
      ]);
    }

    setBillingQuantity(1);
    showNotification(`Added ${med.name} to checkout cart.`);
  };

  // Calculate Subtotals & Totals
  const billingSubtotal = billingCart.reduce((total, c) => total + (c.unitPrice * c.quantity), 0);
  const billingTaxAmount = (billingSubtotal - discountAmount) * (taxRate / 100);
  const billingGrandTotal = Math.max(0, billingSubtotal - discountAmount + billingTaxAmount);

  // Complete Billing Checkout
  const handleFinalizeSale = async () => {
    if (billingCart.length === 0) {
      alert("Billing cart is empty.");
      return;
    }

    setIsProcessingBill(true);
    setBillProgress(0);

    // Simulate high-contrast visual status & progress bar increments for verification
    const interval = setInterval(() => {
      setBillProgress(p => {
        if (p >= 90) {
          return p;
        }
        return p + 15;
      });
    }, 100);

    setTimeout(async () => {
      clearInterval(interval);
      setBillProgress(100);

      // Deduction logic
      billingCart.forEach((item) => {
        deductInventoryStock(item.medicine.name, item.quantity);
      });

      // Generate record
      const saleRecord: SalesHistoryRecord = {
        id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        customerName: customerName.trim() || 'Walk-In Customer',
        customerPhone: customerPhone.trim() || 'N/A',
        date: new Date().toISOString(),
        items: billingCart.map(c => ({
          name: c.medicine.name,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          total: c.unitPrice * c.quantity
        })),
        subtotal: billingSubtotal,
        taxRate: taxRate,
        taxAmount: billingTaxAmount,
        discount: discountAmount,
        total: billingGrandTotal,
        paymentMethod: paymentMethod
      };

      // Save
      const updatedSales = [saleRecord, ...salesHistory];
      setSalesHistory(updatedSales);
      localStorage.setItem('pharmacy_sale_history', JSON.stringify(updatedSales));

      // Update prescription state in Firestore/local list if referral active
      if (activePrescriptionReferral) {
        // Save to locally-known dispensed IDs right away so UI updates dynamically
        const updatedDispensedRxIds = [...dispensedRxIds, activePrescriptionReferral];
        setDispensedRxIds(updatedDispensedRxIds);
        localStorage.setItem('pharmacy_dispensed_rx_ids', JSON.stringify(updatedDispensedRxIds));

        // Update selected prescription state in UI so details modal responds instantly
        if (selectedPrescription && selectedPrescription.id === activePrescriptionReferral) {
          setSelectedPrescription(prev => prev ? { ...prev, status: 'Dispensed' as const } : null);
        }

        // 1. Check local
        const inLocal = localPrescriptions.some(l => l.id === activePrescriptionReferral);
        if (inLocal) {
          const updatedLocal = localPrescriptions.map(l => {
            if (l.id === activePrescriptionReferral) {
              return { ...l, status: 'Dispensed' as const };
            }
            return l;
          });
          setLocalPrescriptions(updatedLocal);
          localStorage.setItem('pharmacy_local_rx', JSON.stringify(updatedLocal));
        }

        // 2. Try Firestore update
        try {
          const rxRef = doc(db, 'prescriptions', activePrescriptionReferral);
          await updateDoc(rxRef, {
            status: 'Dispensed',
            dispensedAt: new Date().toISOString(),
            dispensedByPharmacyId: pharmacyId || 'local_pharmacy'
          });
        } catch (err) {
          console.warn('Note: Prescriptions was updated in memory but not Firebase. Full flow simulated.');
        }

        setActivePrescriptionReferral(null);
      }

      // Set finalized receipt to show modal
      setFinalizedReceipt(saleRecord);
      setBillingCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountAmount(0);
      setIsProcessingBill(false);
      setBillProgress(0);
      showNotification("Transaction processed successfully! Prescribed medications dispensed.");
    }, 1000);
  };

  // Export Inventory as CSV File
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Medicine,Generic Name,Batch,Expiry,Quantity,Unit Price (INR),Supplier\n';

    inventory.forEach((m) => {
      const row = `"${m.name}","${m.genericName}","${m.batchNumber}","${m.expiryDate}",${m.quantity},${m.unitPrice},"${m.supplierName}"`;
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Inventory as PDF Report via jsPDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add header branding
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("MedPrescription Ecosystem", 14, 20);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Live Pharmacy Inventory Stock Valuation Report", 14, 26);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
    
    // Add Summary Blocks
    const totalQty = inventory.reduce((acc, current) => acc + current.quantity, 0);
    const valuation = inventory.reduce((acc, current) => acc + (current.quantity * current.unitPrice), 0);
    
    doc.setFontSize(10);
    doc.text(`Total Unique Medicines: ${inventory.length}`, 14, 42);
    doc.text(`Total Stock Quantity on Hand: ${totalQty} Units`, 14, 47);
    doc.text(`Asset Portfolio Valuation: Rs. ${valuation.toLocaleString()}`, 14, 52);

    const checkExpiring = (dateStr: string) => {
      const expDate = new Date(dateStr);
      const diffTime = expDate.getTime() - Date.now();
      return diffTime > 0 && diffTime < (30 * 24 * 60 * 60 * 1000);
    };
    const expiringCount = inventory.filter(m => checkExpiring(m.expiryDate)).length;
    doc.text(`Expiring Items (30-day window): ${expiringCount} molecules`, 14, 57);

    // Create table content
    const tableRows = inventory.map((m) => [
      m.name,
      m.genericName,
      m.batchNumber,
      m.expiryDate,
      m.quantity.toString(),
      `Rs. ${m.unitPrice}`,
      m.supplierName
    ]);

    (doc as any).autoTable({
      head: [['Medicine', 'Generic Name', 'Batch', 'Expiry', 'Qty', 'Unit Price', 'Supplier']],
      body: tableRows,
      startY: 65,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }, // Emerald header
      styles: { fontSize: 8 },
      columnStyles: {
        0: { fontStyle: 'bold', width: 35 },
        1: { width: 35 },
        4: { halign: 'center' },
        5: { halign: 'right' }
      }
    });

    doc.save(`MedPharmacy_Inventory_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Handle CSV/JSON Import from Dropzone/File input
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      
      try {
        if (file.name.endsWith('.json')) {
          // Parse JSON directly
          const parsed = JSON.parse(text);
          if (!Array.isArray(parsed)) throw new Error("JSON must be an array of medicine objects");
          
          const newMeds: StockMedicine[] = parsed.map((m: any, idx: number) => ({
            id: m.id || `M-IMP-${Date.now()}-${idx}`,
            name: m.name || 'Unnamed Drug',
            genericName: m.genericName || 'N/A',
            batchNumber: m.batchNumber || 'UNKNOWN',
            expiryDate: m.expiryDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            quantity: Number(m.quantity) || 0,
            unitPrice: Number(m.unitPrice) || 0,
            supplierName: m.supplierName || 'Imported File'
          }));

          const updated = [...inventory, ...newMeds];
          updateInventoryState(updated);
          showNotification(`Successfully imported ${newMeds.length} medicines via JSON!`);
        } else if (file.name.endsWith('.csv')) {
          // Robust inline CSV Parser
          const lines = text.split('\n');
          const results: StockMedicine[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Handle comma split correctly supporting quotes
            const columns = [];
            let current = '';
            let inQuotes = false;
            
            for (let c = 0; c < line.length; c++) {
              const char = line[c];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                columns.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            columns.push(current.trim());

            if (columns.length >= 5) {
              results.push({
                id: `M-CSV-${Date.now()}-${i}`,
                name: columns[0] || 'Unknown Drug',
                genericName: columns[1] || 'N/A',
                batchNumber: columns[2] || 'UNKNOWN',
                expiryDate: columns[3] || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                quantity: Number(columns[4]) || 0,
                unitPrice: Number(columns[5]) || 0,
                supplierName: columns[6] || 'Imported CSV'
              });
            }
          }

          const updated = [...inventory, ...results];
          updateInventoryState(updated);
          showNotification(`Successfully imported ${results.length} stocks from CSV file!`);
        } else {
          alert('Unsupported file format. Please upload a .json or .csv stock file.');
        }
      } catch (err) {
        alert(`Error parsing upload: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    reader.readAsText(file);
  };

  // Add or Edit Medicine Action
  const handleSaveMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medForm.name || !medForm.batchNumber || !medForm.expiryDate) {
      alert("Please complete the required medicine fields (Name, Batch, Expiry).");
      return;
    }

    setIsSavingMedicine(true);

    setTimeout(() => {
      if (editingMedicine) {
        const updated = inventory.map(item => {
          if (item.id === editingMedicine.id) {
            return {
              ...item,
              name: medForm.name,
              genericName: medForm.genericName,
              batchNumber: medForm.batchNumber,
              expiryDate: medForm.expiryDate,
              quantity: Number(medForm.quantity),
              unitPrice: Number(medForm.unitPrice),
              supplierName: medForm.supplierName
            };
          }
          return item;
        });
        updateInventoryState(updated);
        setEditingMedicine(null);
        showNotification(`Updated details for ${medForm.name}.`);
        if (Number(medForm.quantity) < lowStockThreshold) {
          triggerLowStockLog(medForm.name, Number(medForm.quantity));
        }
      } else {
        const item: StockMedicine = {
          id: `MED-${Date.now()}`,
          name: medForm.name,
          genericName: medForm.genericName,
          batchNumber: medForm.batchNumber,
          expiryDate: medForm.expiryDate,
          quantity: Number(medForm.quantity),
          unitPrice: Number(medForm.unitPrice),
          supplierName: medForm.supplierName || 'General Distributor'
        };
        
        const updated = [...inventory, item];
        updateInventoryState(updated);
        showNotification(`Successfully cataloged ${medForm.name}!`);
        if (Number(medForm.quantity) < lowStockThreshold) {
          triggerLowStockLog(medForm.name, Number(medForm.quantity));
        }
      }

      // Reset Form
      setMedForm({
        name: '',
        genericName: '',
        batchNumber: '',
        expiryDate: '',
        quantity: 10,
        unitPrice: 10,
        supplierName: ''
      });
      setShowAddMedicineForm(false);
      setIsSavingMedicine(false);
    }, 800);
  };

  const handleEditClick = (med: StockMedicine) => {
    setEditingMedicine(med);
    setMedForm({
      name: med.name,
      genericName: med.genericName,
      batchNumber: med.batchNumber,
      expiryDate: med.expiryDate,
      quantity: med.quantity,
      unitPrice: med.unitPrice,
      supplierName: med.supplierName
    });
    setShowAddMedicineForm(true);
  };

  const handleDeleteMedicine = (id: string, name: string) => {
    if (confirm(`Are you sure you want to retire medication card for: ${name}?`)) {
      const updated = inventory.filter(item => item.id !== id);
      updateInventoryState(updated);
      showNotification(`Retired medication ${name} from stock catalog.`);
    }
  };

  // EMR Simulated Prescription Injection
  const handleSimulateNewRx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simPatientName.trim() || !simMedicineName.trim()) {
      alert("Please provide the Patient Name and Drug Name!");
      return;
    }

    const newRx: Prescription = {
      id: `SIM-RX-${Math.floor(1000 + Math.random() * 8999)}`,
      doctorId: 'dr_david',
      doctorName: 'Dr. David Fischer (Simulated)',
      patientId: `p-${Date.now()}`,
      patientName: simPatientName,
      date: new Date().toISOString(),
      status: 'Pending',
      medications: [
        {
          id: `m-${Date.now()}`,
          name: simMedicineName,
          dosage: simDosage,
          instructions: simInstructions,
          duration: `${simQtyPrescribed} units`
        }
      ],
      notes: 'Simulated incoming wireless transmission',
      signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10 20 Q 30 5, 50 35 T 90 10" fill="none" stroke="red" stroke-width="2"/></svg>'
    };

    const updatedSimList = [newRx, ...localPrescriptions];
    setLocalPrescriptions(updatedSimList);
    localStorage.setItem('pharmacy_local_rx', JSON.stringify(updatedSimList));

    setShowSimulateInboxModal(false);
    setSimPatientName('');
    showNotification(`New Electronic Prescription received for ${simPatientName}.`);
  };

  // Calculate Report Analytics metrics
  const uniqueMoleculesCount = inventory.length;
  const totalStockQtyOnHand = inventory.reduce((acc, c) => acc + c.quantity, 0);
  const totalAssetsValuation = inventory.reduce((acc, c) => acc + (c.quantity * c.unitPrice), 0);
  const lowStockValCount = inventory.filter(item => item.quantity < lowStockThreshold).length;

  const checkExpiringSoon = (dateStr: string) => {
    const expDate = new Date(dateStr);
    const diffTime = expDate.getTime() - Date.now();
    return diffTime > 0 && diffTime < (30 * 24 * 60 * 60 * 1000);
  };
  const expiringMoleculesLimit = inventory.filter(item => checkExpiringSoon(item.expiryDate)).length;

  // Chart Formatting
  const barChartData = inventory.slice(0, 8).map(m => ({
    name: m.name.split(' ')[0], // only show molecule name first word
    quantity: m.quantity,
    value: m.quantity * m.unitPrice
  }));

  const pieChartData = [
    { name: 'Adequate Stock', value: inventory.filter(i => i.quantity >= lowStockThreshold).length, color: '#10b981' },
    { name: 'Low Stock Level', value: inventory.filter(i => i.quantity < lowStockThreshold).length, color: '#f59e0b' }
  ];

  if (authLoading || !isPharmacy) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-20 bg-emerald-950 text-white font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-400 mb-4"></div>
        <p className="font-bold text-emerald-300 uppercase tracking-widest text-xs">Verifying Pharmacy Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#070708] text-gray-800 dark:text-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Toast / Global Notification */}
        <AnimatePresence>
          {toastNotification && (
            <motion.div 
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.95 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-xl bg-emerald-500 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 border border-emerald-400"
            >
              <div className="w-6 h-6 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                <Bell size={14} className="animate-bounce" />
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-xs uppercase tracking-widest text-emerald-100">Live Network Broadcast</h5>
                <p className="text-sm font-semibold mt-1">{toastNotification}</p>
              </div>
              <button onClick={() => setToastNotification(null)} className="text-emerald-100 hover:text-white cursor-pointer hover:scale-110">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Dashboard Master Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/60 p-6 md:p-8 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center gap-4">
            <Link to="/med-demo" className="w-12 h-12 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-center text-gray-500 hover:text-emerald-500 transition-all hover:scale-105 shadow-inner">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <Pill size={18} />
                </div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">MedPrescription Portal</h1>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>Pharmacy Desk</span>
                <span className="text-gray-300 dark:text-gray-700">|</span>
                <span>ID: {pharmacyId || 'Metro_rx'}</span>
                <span className="text-emerald-500 flex items-center gap-1">● Live Syncing</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/med-doctor"
              className="flex items-center gap-2 px-5 py-3.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer"
            >
              <Stethoscope size={12} />
              Open Doctor Portal
            </Link>

            <button
              onClick={resetDemoInventory}
              title="Reload initial medicines list and logs"
              className="flex items-center gap-2 px-5 py-3.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer"
            >
              <RefreshCw size={12} />
              Reset Demo Data
            </button>

            <button 
              onClick={async () => {
                await logout();
                navigate('/med-login');
              }}
              className="flex items-center gap-2 px-5 py-3.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/15 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer"
            >
              <LogOut size={12} />
              Sign Out
            </button>
          </div>
        </div>

        {/* 2. Top Navigation Tabs */}
        <div className="flex flex-wrap bg-white dark:bg-gray-900 p-2.5 rounded-[2rem] border border-gray-100 dark:border-gray-800/80 shadow-md mb-8 gap-1.5">
          <button 
            onClick={() => setActiveTab('emr')}
            className={`flex-1 min-w-[145px] py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all outline-none cursor-pointer ${
              activeTab === 'emr' 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <FileText size={15} />
            EMR Inbox 
            {allPrescriptions.filter(p => p.status === 'Pending').length > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                {allPrescriptions.filter(p => p.status === 'Pending').length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('billing')}
            className={`flex-1 min-w-[145px] py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all outline-none cursor-pointer ${
              activeTab === 'billing' 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Receipt size={15} />
            Tax Billing 
            {billingCart.length > 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {billingCart.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 min-w-[145px] py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all outline-none cursor-pointer ${
              activeTab === 'inventory' 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Database size={15} />
            Stock Vault
          </button>

          <button 
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 min-w-[145px] py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all outline-none cursor-pointer ${
              activeTab === 'alerts' 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Bell size={15} />
            Stock Alerts
            {lowStockValCount > 0 && (
              <span className="w-5.3 h-5.3 bg-yellow-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {lowStockValCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('report')}
            className={`flex-1 min-w-[145px] py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all outline-none cursor-pointer ${
              activeTab === 'report' 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <LineChart size={15} />
            PDF Reports
          </button>
        </div>

        {/* 3. Panel Interfaces */}
        <div className="grid grid-cols-1 gap-8">
          
          {/* TAB A: EMR PRESCRIPTION INBOX */}
          {activeTab === 'emr' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Prescription Left Feed */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Trace patient EMR or RX reference..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-gray-905 border border-gray-100 dark:border-gray-800 px-12 py-4 rounded-2xl text-xs font-bold leading-none outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
                    />
                  </div>
                  
                  <button 
                    onClick={() => setShowSimulateInboxModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer border border-emerald-100 dark:border-emerald-500/15"
                  >
                    <Plus size={16} />
                    Simulate Transmit
                  </button>
                </div>

                {allPrescriptions.length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-16 text-center shadow-sm">
                    <FileText className="mx-auto text-gray-300 dark:text-gray-700 mb-4" size={48} />
                    <h4 className="text-lg font-black text-gray-900 dark:text-white">Active Queue Empty</h4>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Awaiting doctor telemetry nodes</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    {allPrescriptions
                      .filter(p => p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((p) => (
                        <motion.div
                          layoutId={p.id}
                          key={p.id}
                          onClick={() => setSelectedPrescription(p)}
                          className={`bg-white dark:bg-gray-900 p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${
                            selectedPrescription?.id === p.id 
                              ? 'border-emerald-500 shadow-xl' 
                              : 'border-transparent hover:border-gray-100 dark:hover:border-gray-800 select-none shadow-sm'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-emerald-50 dark:bg-gray-800 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                                <User size={20} />
                              </div>
                              <div>
                                <div className="text-[9px] font-black uppercase tracking-widest text-gray-400">Digitally Registered Patient</div>
                                <h4 className="text-lg font-black text-gray-900 dark:text-white mt-1">{p.patientName}</h4>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <span className={`px-4.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                p.status === 'Dispensed' 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' 
                                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 animate-pulse'
                              }`}>
                                {p.status}
                              </span>
                              <ChevronRight size={16} className="text-gray-300" />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                            <div>
                              <strong className="text-gray-400">Ref:</strong> {p.id}
                            </div>
                            <div>
                              <strong className="text-gray-400">Doctor:</strong> {p.doctorName}
                            </div>
                            <div>
                              <strong className="text-gray-400">Issued:</strong> {new Date(p.date).toLocaleDateString()} {new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prescription Side Drawer Details */}
              <div className="lg:col-span-1">
                {selectedPrescription ? (
                  <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 border border-gray-100 dark:border-gray-800 shadow-md">
                    <div className="text-center pb-6 border-b border-gray-100 dark:border-gray-800 mb-6">
                      <div className="w-16 h-16 bg-emerald-50 dark:bg-gray-800 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Package size={24} />
                      </div>
                      <h4 className="text-lg font-black text-gray-900 dark:text-white">Active Telemetry</h4>
                      <p className="text-[10px] uppercase font-mono tracking-widest text-gray-400 mt-1">{selectedPrescription.id}</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-2">Physician Authority</span>
                        <div className="flex items-center gap-3">
                          <Stethoscope size={16} className="text-emerald-500" />
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{selectedPrescription.doctorName}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-2">Patient</span>
                        <div className="flex items-center gap-3">
                          <User size={16} className="text-emerald-500" />
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{selectedPrescription.patientName}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-2">Issued Date & Time</span>
                        <div className="flex items-center gap-3">
                          <Calendar size={16} className="text-emerald-500" />
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                            {new Date(selectedPrescription.date).toLocaleDateString()} at {new Date(selectedPrescription.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {selectedPrescription.isHandwritten ? (
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-2">Handwritten Document Script</span>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-850 flex items-center justify-center overflow-hidden">
                            <img 
                              src={selectedPrescription.notes} 
                              alt="Transcription Script" 
                              className="max-h-56 object-contain dark:invert"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-2 font-black">Authorized Therapeutics</span>
                          <div className="space-y-3 mt-1 text-xs">
                            {selectedPrescription.medications.map((med, idx) => (
                              <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-850">
                                <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{med.name}</div>
                                <div className="text-[10px] text-gray-400 uppercase font-black tracking-wider mt-1">{med.dosage} • {med.duration}</div>
                                <div className="text-[10px] text-gray-500 italic mt-0.5 font-medium">"{med.instructions}"</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedPrescription.signature && (
                        <div className="pt-4 border-t border-gray-50 dark:border-gray-800 mt-4">
                          <span className="text-[8px] font-black uppercase tracking-widest text-gray-405 block mb-2">Verified Digital Cryptogram</span>
                          <img 
                            src={selectedPrescription.signature} 
                            alt="Physician Sign" 
                            className="h-10 object-contain dark:invert"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {selectedPrescription.status === 'Pending' ? (
                        <button
                          onClick={() => handleAcceptPrescriptionToCart(selectedPrescription)}
                          className="w-full py-4.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-extrabold text-xs uppercase tracking-widest transition-all hover:scale-105 shadow-md flex items-center justify-center gap-2 cursor-pointer border-none"
                        >
                          <ShoppingCart size={14} />
                          Accept & Auto-Fill Cart
                        </button>
                      ) : (
                        <div className="w-full py-4 bg-green-500/10 text-green-600 dark:text-emerald-400 text-center rounded-[2rem] font-bold text-xs uppercase tracking-widest border border-green-550/20">
                          Released / Dispensed
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100/40 dark:bg-gray-800/20 text-center p-12 border-2 border-dashed border-gray-200 dark:border-gray-800/80 rounded-[2.5rem] h-80 flex flex-col justify-center">
                    <FileText className="mx-auto text-gray-300 dark:text-gray-700 mb-3" size={32} />
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Select clinical transmission record to audit details</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB B: TAX BILLING & CASHIER */}
          {activeTab === 'billing' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Product Cart adding and list */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Billing Header Inputs */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User size={16} className="text-emerald-505" />
                    Customer Details (Active Billing Block)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Customer / Patient Name</label>
                      <input 
                        type="text"
                        placeholder="John Doe (Walk-in)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-850 border-none px-4 py-3 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Contact Phone Number</label>
                      <input 
                        type="text"
                        placeholder="+91 99999 88888"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-850 border-none px-4 py-3 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Adding Stock Molecule Panel */}
                <div className="bg-white dark:bg-gray-900 border border-gray-102 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Plus size={16} className="text-emerald-500" />
                    Charge Medicine Item to Checkout
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1.5">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Select Drug Molecule (Only Active Stock)</label>
                      <select
                        value={selectedMedicineId}
                        onChange={(e) => setSelectedMedicineId(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-850 text-xs font-bold p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 border-none"
                      >
                        <option value="">-- Choose Stock Medicine --</option>
                        {inventory.map((m) => (
                          <option key={m.id} value={m.id} disabled={m.quantity === 0}>
                            {m.name} [Exp: {m.expiryDate}] ({m.quantity} Unit left) - Rs.{m.unitPrice}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Quantity to bill</label>
                      <input
                        type="number"
                        min="1"
                        value={billingQuantity}
                        onChange={(e) => setBillingQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-gray-50 dark:bg-gray-850 block p-3 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 border-none outline-none"
                      />
                    </div>

                    <button 
                      onClick={handleAddMedicineToCart}
                      disabled={!selectedMedicineId}
                      className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer border-none"
                    >
                      Add To Basket
                    </button>
                  </div>
                </div>

                {/* Cart display */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm overflow-hidden">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <ShoppingCart size={16} className="text-emerald-501" />
                      Shopping basket layout
                    </h3>
                    {activePrescriptionReferral && (
                      <span className="px-3.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-purple-500/15">
                        Referenced: {activePrescriptionReferral}
                      </span>
                    )}
                  </div>

                  {billingCart.length === 0 ? (
                    <div className="text-center py-12 text-gray-404">
                      <ShoppingCart className="mx-auto text-gray-200 dark:text-gray-805 mb-3" size={32} />
                      <p className="text-xs font-black uppercase tracking-widest text-gray-400">Basket is completely empty</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-50 dark:bg-gray-850 text-gray-400 uppercase tracking-widest text-[8px] font-black">
                          <tr>
                            <th className="p-4 rounded-l-xl">Molecule Name</th>
                            <th className="p-4">Batch</th>
                            <th className="p-4 text-center">Quantity</th>
                            <th className="p-4 text-right">Unit Price</th>
                            <th className="p-4 text-right">Total Price</th>
                            <th className="p-4 rounded-r-xl text-center">Retract</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800 font-semibold text-gray-700 dark:text-gray-200">
                          {billingCart.map((item, index) => (
                            <tr key={item.id} className="hover:bg-gray-55/40 dark:hover:bg-gray-850/20">
                              <td className="p-4 font-bold text-gray-900 dark:text-white">{item.medicine.name}</td>
                              <td className="p-4 font-mono font-bold text-[10px]">{item.medicine.batchNumber || 'GEN'}</td>
                              <td className="p-4 text-center font-extrabold">{item.quantity}</td>
                              <td className="p-4 text-right">Rs.{item.unitPrice}</td>
                              <td className="p-4 text-right">Rs.{item.unitPrice * item.quantity}</td>
                              <td className="p-4 text-center">
                                <button 
                                  onClick={() => {
                                    setBillingCart(billingCart.filter(c => c.id !== item.id));
                                    showNotification(`Removed ${item.medicine.name} from billing session.`);
                                  }}
                                  className="text-red-500 hover:text-red-650 cursor-pointer p-1 hover:scale-105 border-none bg-transparent"
                                >
                                  <Trash2 size={14} />
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
              
              {/* Checkout Calculation and receipt generation */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-900 border border-gray-120 dark:border-gray-800 rounded-[2.5rem] p-6 shadow-md sticky top-8">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
                    Sales Tax Summary & Finalize
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-2">Configure GST Bracket</span>
                      <div className="flex gap-2 bg-gray-50 dark:bg-gray-850 p-1 rounded-xl">
                        {([5, 12, 0] as const).map((r) => (
                          <button
                            key={r}
                            onClick={() => setTaxRate(r)}
                            className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${
                              taxRate === r 
                                ? 'bg-emerald-500 text-white shadow-sm' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {r === 0 ? 'Exempt' : `${r}% GST`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-2">Discount value (Rs.)</span>
                      <input 
                        type="number"
                        min="0"
                        placeholder="0"
                        value={discountAmount || ''}
                        onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-gray-50 dark:bg-gray-850 p-3 rounded-2xl text-xs font-bold outline-none border-none focus:ring-2 focus:ring-emerald-505/20"
                      />
                    </div>

                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-2">Payment Instrument</span>
                      <div className="flex bg-gray-50 dark:bg-gray-850 p-1 rounded-xl">
                        {(['Cash', 'Card', 'UPI'] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setPaymentMethod(mode)}
                            className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${
                              paymentMethod === mode 
                                ? 'bg-emerald-500 text-white shadow-sm' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3 font-semibold text-xs leading-none">
                      <div className="flex justify-between">
                        <span className="text-gray-400 uppercase tracking-widest text-[9px]">Sale Subtotal</span>
                        <span className="text-gray-800 dark:text-gray-200">Rs.{billingSubtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 uppercase tracking-widest text-[9px]">Discount Allowed</span>
                        <span className="text-red-500">- Rs.{discountAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 uppercase tracking-widest text-[9px]">Tax CGST + SGST</span>
                        <span className="text-gray-800 dark:text-gray-200">Rs.{billingTaxAmount.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-gray-100 dark:border-gray-800 font-extrabold text-sm">
                        <span className="uppercase tracking-widest text-[10px] text-gray-900 dark:text-white">Amount Receivable</span>
                        <span className="text-emerald-500">Rs.{billingGrandTotal.toFixed(1)}</span>
                      </div>
                    </div>

                    {isProcessingBill && (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.1em] text-emerald-600 dark:text-emerald-400">
                          <span className="flex items-center gap-1.5">
                            <RefreshCw className="animate-spin" size={12} />
                            Securing medical ledger and updating stocks...
                          </span>
                          <span>{billProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-100 ease-out" 
                            style={{ width: `${billProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleFinalizeSale}
                      disabled={isProcessingBill}
                      className="w-full py-4.5 bg-emerald-500 hover:bg-emerald-600 border-none cursor-pointer text-white rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isProcessingBill ? (
                        <>
                          <RefreshCw className="animate-spin" size={14} />
                          Finalizing Ledger...
                        </>
                      ) : (
                        <>
                          <Receipt size={14} />
                          Release & Print Receipt
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB C: INVENTORY & STOCK MANAGEMENT */}
          {activeTab === 'inventory' && (
            <div className="space-y-8">
              
              {/* Search, Upload CSV/JSON Stock actions header */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  {/* CSV JSON Upload button */}
                  <div className="flex flex-wrap items-center gap-3">
                    <input 
                      type="file" 
                      accept=".json,.csv"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-5 py-3.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-505/15 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/15 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                    >
                      <Upload size={14} />
                      Upload Stock (CSV / JSON)
                    </button>

                    <div className="text-[10px] text-gray-404 font-bold max-w-xs">
                      Supports <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-red-500 font-mono">.csv</code> Columns (Name, Generic, Batch, Expiry, Qty, Price, Supplier) or <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-red-500 font-mono">.json</code> structure.
                    </div>
                  </div>

                  {/* Add stock trigger */}
                  <button 
                    onClick={() => {
                      setEditingMedicine(null);
                      setMedForm({
                        name: '',
                        genericName: '',
                        batchNumber: '',
                        expiryDate: '',
                        quantity: 10,
                        unitPrice: 10,
                        supplierName: ''
                      });
                      setShowAddMedicineForm(true);
                    }}
                    className="flex items-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <Plus size={16} />
                    Catalog New Medicine
                  </button>
                </div>
              </div>

              {/* Medicine adding / editing card drawer */}
              {showAddMedicineForm && (
                <div className="bg-white dark:bg-gray-900 border-2 border-emerald-500 rounded-[2.5rem] p-6 md:p-8 shadow-xl">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">
                      {editingMedicine ? `Edit Medicine details: ${editingMedicine.name}` : 'Catalog New Therapeutic Molecule'}
                    </h3>
                    <button 
                      onClick={() => setShowAddMedicineForm(false)}
                      className="text-gray-400 hover:text-gray-650 cursor-pointer p-1"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveMedicine} className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Medicine Name *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Amoxicillin 500mg"
                        value={medForm.name}
                        onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-850 border-none p-3.5 rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Generic Scientific Name</label>
                      <input 
                        type="text" 
                        placeholder="Amoxicillin Trihydrate"
                        value={medForm.genericName}
                        onChange={(e) => setMedForm({ ...medForm, genericName: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-850 border-none p-3.5 rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Manufacturing Batch # *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="AMX-912"
                        value={medForm.batchNumber}
                        onChange={(e) => setMedForm({ ...medForm, batchNumber: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-850 border-none p-3.5 rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Molecules Expiry Date *</label>
                      <input 
                        type="date" 
                        required
                        value={medForm.expiryDate}
                        onChange={(e) => setMedForm({ ...medForm, expiryDate: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-850 border-none p-3.5 rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Initial Stock Quantity</label>
                      <input 
                        type="number" 
                        min="0"
                        placeholder="10"
                        value={medForm.quantity}
                        onChange={(e) => setMedForm({ ...medForm, quantity: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full bg-gray-50 dark:bg-gray-850 border-none p-3.5 rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Unit Price (INR Rs.) *</label>
                      <input 
                        type="number" 
                        min="1"
                        required
                        placeholder="15"
                        value={medForm.unitPrice}
                        onChange={(e) => setMedForm({ ...medForm, unitPrice: Math.max(1, parseFloat(e.target.value) || 1) })}
                        className="w-full bg-gray-50 dark:bg-gray-850 border-none p-3.5 rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Contract Distributor / Supplier details</label>
                      <input 
                        type="text" 
                        placeholder="Cipla India Warehouse Ltd."
                        value={medForm.supplierName}
                        onChange={(e) => setMedForm({ ...medForm, supplierName: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-850 border-none p-3.5 rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      />
                    </div>

                    <div className="md:col-span-1 pt-4 flex gap-3">
                      <button 
                        type="submit"
                        disabled={isSavingMedicine}
                        className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 border-none text-white rounded-2xl font-black uppercase tracking-widest cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSavingMedicine ? (
                          <>
                            <RefreshCw className="animate-spin" size={16} />
                            Saving...
                          </>
                        ) : (
                          editingMedicine ? 'Update details' : 'Save Molecule'
                        )}
                      </button>
                      <button 
                        type="button" 
                        disabled={isSavingMedicine}
                        onClick={() => setShowAddMedicineForm(false)}
                        className="px-6 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black uppercase tracking-widest cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Inventory Table catalog view */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-830 rounded-[2.5rem] p-6 shadow-md overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <Database size={18} className="text-emerald-500" />
                    Interactive Pharmacy Stock Vault
                  </h3>

                  {/* Active inventory stock query */}
                  <div className="relative max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input 
                      type="text"
                      placeholder="Audit Molecule or Batch..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-850 border-none pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-550/20 outline-none"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-500 dark:text-gray-400">
                    <thead className="bg-gray-50 dark:bg-gray-850 text-gray-450 uppercase tracking-widest text-[8px] font-black">
                      <tr>
                        <th className="p-4 rounded-l-xl">Molecule / Drug Name</th>
                        <th className="p-4 mr-2">Generic Active Ingredient</th>
                        <th className="p-4 text-center">Batch ID</th>
                        <th className="p-4 text-center">Expiry</th>
                        <th className="p-4 text-center">In Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-4">Supplier Node</th>
                        <th className="p-4 rounded-r-xl text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800 font-semibold text-gray-700 dark:text-gray-250">
                      {inventory
                        .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((item) => {
                          const isLow = item.quantity < lowStockThreshold;
                          const isExpSoon = checkExpiringSoon(item.expiryDate);
                          
                          return (
                            <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/10">
                              <td className="p-4 font-bold text-gray-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                  {item.name}
                                  {isLow && (
                                    <span className="w-2.4 h-2.4 bg-yellow-500 rounded-full inline-block animate-ping" title="Low stock alert" />
                                  )}
                                  {isExpSoon && (
                                    <span className="w-2.4 h-2.4 bg-red-505 rounded-full inline-block animate-ping" title="Expiring within 30 days" />
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-gray-400 text-[11px] italic">{item.genericName || 'Unspecified'}</td>
                              <td className="p-4 text-center font-mono font-bold text-[10px] text-gray-500">{item.batchNumber}</td>
                              <td className="p-4 text-center text-[10px] uppercase font-mono">
                                <span className={`px-2.5 py-1 rounded-md ${isExpSoon ? 'bg-red-500/10 text-red-500 font-bold' : 'text-gray-500'}`}>
                                  {item.expiryDate}
                                </span>
                              </td>
                              <td className="p-4 text-center font-mono font-extrabold text-sm">
                                <span className={isLow ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-lg' : 'text-emerald-500 font-bold'}>
                                  {item.quantity}
                                </span>
                              </td>
                              <td className="p-3 text-right">Rs.{item.unitPrice}</td>
                              <td className="p-4 text-[11px] text-gray-400">{item.supplierName}</td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center gap-2">
                                  <button 
                                    onClick={() => handleEditClick(item)}
                                    className="p-1.5 text-blue-500 hover:text-blue-600 bg-blue-500/5 hover:bg-blue-500/10 rounded-lg transition-all cursor-pointer border-none"
                                    title="Edit settings"
                                  >
                                    <Edit size={12} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteMedicine(item.id, item.name)}
                                    className="p-1.5 text-red-500 hover:text-red-600 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer border-none"
                                    title="Retire card"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB D: STOCK ALERTS & MONITOR LOGS */}
          {activeTab === 'alerts' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Threshold Setter and alerts list */}
              <div className="md:col-span-1 space-y-6">
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-6 shadow-sm">
                  <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Bell className="text-yellow-501" size={18} />
                    Configure Threshold
                  </h3>
                  
                  <p className="text-xs text-gray-500 mt-2 font-medium mb-4">Set global stock level below which system triggers immediate low stock simulated emails and catalogs log entries.</p>
                  
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Standard stock levels critical amount</label>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      min="1"
                      placeholder="10"
                      value={lowStockThreshold}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setLowStockThreshold(val);
                        localStorage.setItem('pharmacy_low_threshold', String(val));
                      }}
                      className="flex-1 bg-gray-50 dark:bg-gray-850 p-3 text-xs font-bold rounded-2xl outline-none border-none"
                    />
                    <span className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center text-gray-650">Units</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-6 shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    <AlertCircle className="text-yellow-500" size={14} />
                    Current Out-of-Stock warnings
                  </h4>
                  <div className="space-y-3">
                    {inventory.filter(i => i.quantity < lowStockThreshold).length === 0 ? (
                      <p className="text-xs font-black text-green-500 uppercase tracking-widest text-center py-4 block">✔️ All medicines stocked adequately</p>
                    ) : (
                      inventory.filter(i => i.quantity < lowStockThreshold).map(m => (
                        <div key={m.id} className="p-3 bg-yellow-500/5 rounded-xl border border-yellow-500/10 text-xs font-bold flex justify-between items-center">
                          <div>
                            <span className="text-gray-900 dark:text-gray-200 block">{m.name}</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Stock level: {m.quantity} Unit</span>
                          </div>
                          <span className="px-2.5 py-1 bg-yellow-500/20 text-yellow-600 rounded-lg text-[8px] font-black uppercase tracking-widest">
                            REORDER
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Alert logs lists */}
              <div className="md:col-span-2">
                <div className="bg-white dark:bg-gray-900 border border-gray-101 dark:border-gray-800 rounded-[2.5rem] p-6 shadow-md h-full">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <Mail size={18} className="text-yellow-500" />
                      Simulated Email alert dispatch records
                    </h3>
                    <button
                      onClick={() => {
                        setAlertLogs([]);
                        localStorage.removeItem('pharmacy_alert_logs');
                        showNotification("Cleared simulated log events.");
                      }}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/15 text-red-500 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer border-none"
                    >
                      Clear Log
                    </button>
                  </div>

                  {alertLogs.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <Mail className="mx-auto text-gray-200 dark:text-gray-802 mb-3" size={40} />
                      <p className="text-xs font-black uppercase tracking-widest text-gray-400">No telemetry log entries triggered yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {alertLogs.map((log) => (
                        <div key={log.id} className="p-4 bg-gray-50 dark:bg-gray-850/60 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-start gap-3">
                          <div className="w-8 h-8 bg-yellow-550/10 text-yellow-550 rounded-xl flex items-center justify-center shrink-0">
                            <Mail size={14} className="animate-pulse" />
                          </div>
                          <div className="flex-1 text-xs">
                            <div className="flex justify-between items-center">
                              <strong className="text-gray-950 dark:text-gray-100 text-[13px]">{log.medicineName} (Stock warning!)</strong>
                              <span className="text-[9px] font-mono font-bold text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-gray-500 mt-1 dark:text-gray-400">
                              System captured a critical supply gap ({log.currentStock} Units left vs requirement target of {log.threshold}).
                            </p>
                            <div className="mt-2 text-[10px] text-green-600 dark:text-green-400 font-extrabold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                              SMTP Telemetry packet transmitted to {log.simulatedEmailSentTo} successfully.
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB E: RECHARTS STOCK REPORT & PDF/CSV EXPORT */}
          {activeTab === 'report' && (
            <div className="space-y-8">
              
              {/* Summary KPIs Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-white dark:bg-gray-90s border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm text-center">
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-402 block mb-2">Molecular Cards Cataloged</span>
                  <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{uniqueMoleculesCount}</p>
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black block mt-2">Active medicines</span>
                </div>

                <div className="bg-white dark:bg-gray-90s border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm text-center">
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-402 block mb-2">Total Units Inventory</span>
                  <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{totalStockQtyOnHand}</p>
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black block mt-2">Physical counts on hand</span>
                </div>

                <div className="bg-white dark:bg-gray-90s border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm text-center">
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-402 block mb-2">Critical Supply gaps</span>
                  <p className={`text-3xl font-black tracking-tight ${lowStockValCount > 0 ? 'text-yellow-500' : 'text-gray-900 dark:text-white'}`}>{lowStockValCount}</p>
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black block mt-2">Below Threshold limit</span>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm text-center">
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-402 block mb-2">30-Day Expiry Threats</span>
                  <p className={`text-3xl font-black tracking-tight ${expiringMoleculesLimit > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{expiringMoleculesLimit}</p>
                  <span className="text-[9px] text-gray-405 uppercase tracking-widest font-black block mt-2">Expiring molecules</span>
                </div>
              </div>

              {/* Dynamic Recharts visualizations */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Bar Chart stock quantities */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-6 shadow-md">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6">Audited Drug Molecule quantity counts</h3>
                  
                  <div className="h-80 w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:opacity-10" />
                        <XAxis dataKey="name" stroke="#a0a0a0" fontSize={10} tickLine={false} />
                        <YAxis stroke="#a0a0a0" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '15px', fontWeight: 'bold' }} />
                        <Bar dataKey="quantity" fill="#10b981" radius={[8, 8, 0, 0]}>
                          {barChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.quantity < lowStockThreshold ? '#f59e0b' : '#10b981'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Chart Stocks and Export Reports */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-6 shadow-md flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">Stock Valuation Profile</h3>
                    
                    <div className="py-4 border-b border-gray-100 dark:border-gray-800 mb-6 font-semibold text-xs leading-none">
                      <div className="flex justify-between py-2 text-gray-500">
                        <span className="uppercase tracking-widest text-[9px]">Inventory Portfolio Value</span>
                        <strong className="text-gray-950 dark:text-gray-105">Rs.{totalAssetsValuation.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between py-2 text-gray-650">
                        <span className="uppercase tracking-widest text-[9px] text-yellow-600 block">Critical gap valuation</span>
                        <strong className="text-yellow-600">Rs.{inventory.filter(i => i.quantity < lowStockThreshold).reduce((acc, current) => acc + (current.quantity * current.unitPrice), 0).toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block">Deploy Export Documents</span>
                    
                    <button
                      onClick={handleExportPDF}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 border-none text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download size={15} />
                      Download PDF Audit Report
                    </button>

                    <button
                      onClick={handleExportCSV}
                      className="w-full py-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-770 dark:text-gray-200 border-none rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download size={15} />
                      Download CSV Stock File
                    </button>
                  </div>
                </div>

              </div>

              {/* Dynamically Filterable Day-wise / Month-wise Sales Reports Panel */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-md space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-50 dark:border-gray-800">
                  <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <History size={18} className="text-emerald-500" />
                      Grouped Pharmacy Sales History Reports ({salesHistory.length} TXN)
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Select group filter for day-wise or month-wise sales audit</p>
                  </div>

                  <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-end">
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl border border-gray-200/40 dark:border-gray-750">
                      <button
                        onClick={() => setSalesReportGrouping('day')}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${salesReportGrouping === 'day' ? 'bg-white dark:bg-gray-900 text-emerald-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Day-Wise
                      </button>
                      <button
                        onClick={() => setSalesReportGrouping('month')}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${salesReportGrouping === 'month' ? 'bg-white dark:bg-gray-900 text-emerald-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Month-Wise
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setSalesHistory([]);
                        localStorage.removeItem('pharmacy_sale_history');
                        showNotification("Cleared billing checkout sales history.");
                      }}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer border-none"
                    >
                      Reset Sales
                    </button>
                  </div>
                </div>

                {/* Sales report timeline trends visualizer */}
                {salesHistory.length > 0 && (
                  <div className="bg-gray-50/50 dark:bg-gray-850/20 rounded-3xl p-6 border border-gray-100/50 dark:border-gray-800/40">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-emerald-500" />
                      Sales Trends ({salesReportGrouping === 'day' ? 'Days View' : 'Months View'})
                    </h4>
                    <div className="h-56 w-full text-[10px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesReportGrouping === 'day' ? groupedSalesReportData.days.slice(0, 10).reverse() : groupedSalesReportData.months.slice(0, 12).reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:opacity-10" />
                          <XAxis dataKey="period" stroke="#a0a0a0" fontSize={9} />
                          <YAxis stroke="#a0a0a0" fontSize={9} />
                          <Tooltip contentStyle={{ borderRadius: '15px', fontWeight: 'bold' }} />
                          <Area type="monotone" dataKey="revenue" name="Total Sales (Rs.)" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {salesHistory.length === 0 ? (
                  <p className="text-center py-12 text-xs font-black uppercase tracking-widest text-gray-400">No active checkout transactions found</p>
                ) : (
                  <div className="overflow-x-auto text-xs rounded-2xl border border-gray-100 dark:border-gray-800">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 dark:bg-gray-850 text-gray-400 uppercase tracking-widest text-[8px] font-black border-b border-gray-100 dark:border-gray-800">
                        <tr>
                          <th className="p-4">{salesReportGrouping === 'day' ? 'Sales Day' : 'Sales Month'}</th>
                          <th className="p-4 text-center">Transactions Count</th>
                          <th className="p-4 text-center">Medicine Dispensed</th>
                          <th className="p-4 text-right">Avg Ticket Size</th>
                          <th className="p-4 text-right">Aggregate Sales Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-semibold text-gray-700 dark:text-gray-200">
                        {(salesReportGrouping === 'day' ? groupedSalesReportData.days : groupedSalesReportData.months).map((row, idx) => (
                          <React.Fragment key={idx}>
                            <tr className="hover:bg-gray-50/30 dark:hover:bg-gray-850/5">
                              <td className="p-4 font-extrabold text-gray-900 dark:text-white">{row.period}</td>
                              <td className="p-4 text-center font-bold text-blue-500">{row.txCount} Checkouts</td>
                              <td className="p-4 text-center text-gray-500">{row.itemsCount} Qty Packages</td>
                              <td className="p-4 text-right font-mono">Rs.{(row.revenue / row.txCount).toFixed(1)}</td>
                              <td className="p-4 text-right text-emerald-500 font-extrabold font-mono">Rs.{row.revenue.toFixed(1)}</td>
                            </tr>
                            {/* Inner listed nested customers for full detail tracking */}
                            <tr className="bg-gray-50/10 dark:bg-gray-900/10">
                              <td colSpan={5} className="px-4 py-2">
                                <div className="flex flex-wrap gap-2 py-1">
                                  {row.transactions.map((t) => (
                                    <span key={t.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-850 hover:border-gray-300 border border-gray-150 dark:border-gray-800 rounded-lg text-[9px] text-gray-500 dark:text-gray-400 font-bold">
                                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                      <strong>{t.customerName}</strong> (Rs.{t.total.toFixed(0)})
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* MODAL 1: THERMAL PRINT RECEIPT */}
      <AnimatePresence>
        {finalizedReceipt && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white text-gray-800 w-full max-w-sm rounded-[2rem] shadow-2xl p-6 relative overflow-hidden"
            >
              {/* Receipt close button */}
              <button 
                onClick={() => setFinalizedReceipt(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 cursor-pointer hover:scale-110"
              >
                <X size={20} />
              </button>

              {/* Thermal Branding */}
              <div className="text-center border-b-2 border-dashed border-gray-200 pb-4 mb-4 select-none">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-black">
                  +
                </div>
                <h4 className="text-base font-black text-gray-900 uppercase tracking-wider">METRO PHARMACY CLINICS</h4>
                <p className="text-[9px] text-gray-400 mt-0.5">Healthcare Precinct Road, Metro City</p>
                <p className="text-[8px] text-gray-400">Node Ref: RX-201-91</p>
              </div>

              {/* Receipt Metadata */}
              <div className="text-[10px] space-y-1 font-semibold text-gray-500 border-b border-gray-100 pb-3 mb-3">
                <div className="flex justify-between">
                  <span>TXN REFERENCE:</span>
                  <strong className="text-gray-900 font-extrabold">{finalizedReceipt.id}</strong>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span className="text-gray-950 font-bold">{new Date(finalizedReceipt.date).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>BILL CUSTOMER:</span>
                  <span className="text-gray-950 font-bold uppercase">{finalizedReceipt.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>PAYMENT MODE:</span>
                  <span className="text-gray-950 font-bold">{finalizedReceipt.paymentMethod}</span>
                </div>
              </div>

              {/* Receipt Items list */}
              <div className="space-y-2 border-b border-gray-100 pb-3 mb-3 text-xs">
                {finalizedReceipt.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-gray-600 font-medium">
                    <div>
                      <span className="block text-gray-900 font-bold">{it.name}</span>
                      <span className="text-[10px] text-gray-400">{it.quantity} units x Rs.{it.unitPrice}</span>
                    </div>
                    <span className="text-gray-900 font-extrabold shrink-0">Rs.{it.total}</span>
                  </div>
                ))}
              </div>

              {/* Taxes subtotal details */}
              <div className="text-[10px] font-semibold text-gray-500 space-y-1.5 border-b-2 border-dashed border-gray-200 pb-4 mb-4">
                <div className="flex justify-between">
                  <span>SUBTOTAL AMOUNT:</span>
                  <span className="text-gray-950">Rs.{finalizedReceipt.subtotal}</span>
                </div>
                {finalizedReceipt.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>DISCOUNT REDUCTION:</span>
                    <span>- Rs.{finalizedReceipt.discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>CENTRAL TAX ({finalizedReceipt.taxRate / 2}% CGST):</span>
                  <span className="text-gray-950">Rs.{(finalizedReceipt.taxAmount / 2).toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>STATE TAX ({finalizedReceipt.taxRate / 2}% SGST):</span>
                  <span className="text-gray-950">Rs.{(finalizedReceipt.taxAmount / 2).toFixed(1)}</span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-black text-gray-900">
                  <span className="tracking-widest">RECEIVABLE TOTAL PAID:</span>
                  <span className="text-emerald-600">Rs.{finalizedReceipt.total.toFixed(1)}</span>
                </div>
              </div>

              {/* Receipt Footer barcodes */}
              <div className="text-center font-mono">
                <div className="text-[8px] tracking-[0.4em] font-bold text-gray-400 uppercase select-none">|| | ||| || |||| | | |||</div>
                <p className="text-[8.5px] font-black text-gray-400 uppercase tracking-wider mt-2">Release Authorized. Safe Use.</p>
                <p className="text-[7.5px] text-gray-400 italic mt-0.5">MedPrescription digital medical ecosystem</p>
              </div>

              {/* Action standard trigger */}
              <div className="flex gap-2.5 mt-6">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest border-none transition-all cursor-pointer text-center"
                >
                  Confirm & Print
                </button>
                <button
                  onClick={() => setFinalizedReceipt(null)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest border-none transition-all cursor-pointer text-center"
                >
                  Close Receipt
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: EMR SIMULATION INJECT */}
      <AnimatePresence>
        {showSimulateInboxModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-gray-905 border border-gray-100 dark:border-gray-800 text-gray-805 w-full max-w-md rounded-[3.5rem] shadow-2xl p-8 relative"
            >
              <button 
                onClick={() => setShowSimulateInboxModal(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-650 cursor-pointer p-1"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-emerald-55/15 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <Plus size={24} />
                </div>
                <h4 className="text-xl font-black text-gray-905 dark:text-white uppercase tracking-wider">Simulate Wireless Prescription</h4>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">Submit digital prescription to testing buffer</p>
              </div>

              <form onSubmit={handleSimulateNewRx} className="space-y-4 text-xs">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-450 block mb-1">Audit Patient Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="E.g. Shreya Sharma"
                    value={simPatientName}
                    onChange={(e) => setSimPatientName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-850 p-3 rounded-2xl font-bold outline-none border-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-450 block mb-1">Prescribed Molecule Name</label>
                  <select
                    value={simMedicineName}
                    onChange={(e) => setSimMedicineName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-850 p-3 rounded-2xl font-bold outline-none border-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {inventory.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                    <option value="Generics Custom Tablet 500mg">Generics Custom Tablet 500mg (Catalog Fallback)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-gray-450 block mb-1">Dosage Frequency</label>
                    <input 
                      type="text" 
                      placeholder="1-0-1"
                      value={simDosage}
                      onChange={(e) => setSimDosage(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-850 p-3 rounded-2xl font-bold outline-none border-none"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-gray-450 block mb-1">Qty Units</label>
                    <input 
                      type="number" 
                      min="1"
                      value={simQtyPrescribed}
                      onChange={(e) => setSimQtyPrescribed(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-gray-50 dark:bg-gray-850 p-3 rounded-2xl font-bold outline-none border-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-450 block mb-1">Therapeutic Instructions</label>
                  <input 
                    type="text" 
                    placeholder="Take with warm milk"
                    value={simInstructions}
                    onChange={(e) => setSimInstructions(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-850 p-3 rounded-2xl font-bold outline-none border-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all hover:scale-105 shadow-md border-none cursor-pointer mt-4"
                >
                  Transmit Telemetry Node
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
