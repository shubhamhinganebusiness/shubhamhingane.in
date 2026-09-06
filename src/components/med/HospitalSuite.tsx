import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, Activity, Package, Pill, Beaker, 
  Image as ImageIcon, IndianRupee, UserCheck, ShieldCheck, 
  Plus, Search, Download, Trash2, CheckCircle2, AlertTriangle, 
  ArrowRightLeft, FileText, BadgeAlert, PlusCircle, Printer, Eye, Lock
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line, Cell
} from 'recharts';

interface HospitalSuiteProps {
  onPrescribeClick?: (patientName: string) => void;
}

export const HospitalSuite: React.FC<HospitalSuiteProps> = ({ onPrescribeClick }) => {
  const [activeModule, setActiveModule] = useState<number>(0);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // 12 Modules metadata
  const modules = [
    { id: 1, name: 'OPD Management', desc: 'Appointments & Consultation Triage', icon: Calendar },
    { id: 2, name: 'IPD & Bed Control', desc: 'Admissions, Wards & Bed Transfers', icon: Activity },
    { id: 3, name: 'Emergency/Casualty', desc: 'Trauma ER, Triage Levels & EHR', icon: BadgeAlert },
    { id: 4, name: 'Inventory & Supplies', desc: 'Purchase Orders & Stock Alerts', icon: Package },
    { id: 5, name: 'Pharmacy Drug Store', desc: 'Drug Inventory, Expiry Warnings & Billing', icon: Pill },
    { id: 6, name: 'Laboratory LIS', desc: 'Lab Orders, Specs & Medical Reports', icon: Beaker },
    { id: 7, name: 'Radiology RIS/PACS', desc: 'Imaging Orders & Live PACs Viewer', icon: ImageIcon },
    { id: 8, name: 'Hospital Billing', desc: 'GST, Insurance Claims & Auditing', icon: IndianRupee },
    { id: 9, name: 'HR & Staff Payroll', desc: 'Staff Attendance, Leave & Salay Slips', icon: UserCheck },
    { id: 10, name: 'Hopsital Dashboard', desc: 'MIS Reports, KPIs & XLS Exporters', icon: FileText },
    { id: 11, name: 'Patient KYC Registration', desc: 'MRN Generators & Demographics', icon: Users },
    { id: 12, name: 'RBAC & Audit Trails', desc: 'Security Audits & Access Controls', icon: ShieldCheck }
  ];

  // Helper trigger messages
  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // State Declarations for all modules
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [ipdAdmissions, setIpdAdmissions] = useState<any[]>([]);
  const [emergencyPatients, setEmergencyPatients] = useState<any[]>([]);
  const [clinicalSupplies, setClinicalSupplies] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [radiologyOrders, setRadiologyOrders] = useState<any[]>([]);
  const [billingInvoices, setBillingInvoices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [pharmacyStocks, setPharmacyStocks] = useState<any[]>([]);
  
  const expiringBatchesCount = pharmacyStocks.filter(p => {
    if (!p.expiry) return false;
    const diffTime = new Date(p.expiry).getTime() - new Date().getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 30;
  }).length;
  
  // Custom GST Slabs State
  const [gstSlabs, setGstSlabs] = useState<{ rate: number, label: string }[]>([
    { rate: 5, label: '5% SGST + CGST' },
    { rate: 12, label: '12% Med Supplies' },
    { rate: 18, label: '18% Luxury Clinical' }
  ]);

  // PACS DICOM screen filters state
  const [pacsContrast, setPacsContrast] = useState<number>(100);
  const [pacsZoom, setPacsZoom] = useState<number>(100);
  const [pacsInverted, setPacsInverted] = useState<boolean>(false);
  const [selectedPacsImage, setSelectedPacsImage] = useState<string>('chest_xray');

  // Input states
  const [kycForm, setKycForm] = useState({ name: '', gender: 'Male', age: '', city: '', phone: '', email: '', insuranceProvider: '' });
  const [opdForm, setOpdForm] = useState({ patientName: '', docName: 'Dr. Robert Fischer', date: '', time: '', triageTemp: '98.6', triageBP: '120/80', triagePulse: '72', reason: '' });
  const [ipdForm, setIpdForm] = useState({ patientName: '', ward: 'General Ward', bedNumber: 'G-102', dmsNotes: '' });
  const [emergencyForm, setEmergencyForm] = useState({ patientName: '', triageLevel: 'Red (Critical)', traumaNotes: '', relativeContact: '' });
  const [supplyForm, setSupplyForm] = useState({ name: '', sku: '', currentStock: 100, minStockThreshold: 30, unitPrice: 45, category: 'Syringes & Needles' });
  const [poForm, setPoForm] = useState({ item: '', qty: 50, supplier: '' });
  const [drugForm, setDrugForm] = useState({ name: '', batch: '', qty: 200, price: 120, expiry: '2026-11-20', supplier: 'Zydus Corp' });
  const [labForm, setLabForm] = useState({ patientName: '', testName: 'Complete Blood Count (CBC)', notes: '' });
  const [radForm, setRadForm] = useState({ patientName: '', modality: 'X-Ray Chest', priority: 'Routine' });
  const [billForm, setBillForm] = useState({ patientName: '', itemDescription: 'Consultation Fee', basePrice: 500, gstRate: 18, insuranceClaimStatus: 'Initiated' });
  const [staffForm, setStaffForm] = useState({ name: '', role: 'Nurse Practitioner', department: 'ICU Care', basicSalary: 45000 });

  // Initial Seed Logic (loads from localStorage or presets on first visit)
  useEffect(() => {
    // 1. Load Patients & Seed
    const localPatients = localStorage.getItem('suite_patients');
    if (localPatients) {
      setPatients(JSON.parse(localPatients));
    } else {
      const initialPat = [
        { mrn: 'MRN-2026-9201', name: 'Albus Severus', age: '32', gender: 'Male', city: 'London', phone: '9089201290', email: 'albus@hogwarts.edu', insuranceProvider: 'Star Health Care' },
        { mrn: 'MRN-2026-4412', name: 'Luna Lovegood', age: '27', gender: 'Female', city: 'Wales', phone: '8701928372', email: 'luna@quibbler.org', insuranceProvider: 'HDFC Ergo' }
      ];
      setPatients(initialPat);
      localStorage.setItem('suite_patients', JSON.stringify(initialPat));
    }

    // 2. Load Appointments & Seed
    const localAppts = localStorage.getItem('suite_appointments');
    if (localAppts) {
      setAppointments(JSON.parse(localAppts));
    } else {
      const initialAppts = [
        { id: 'OPD-101', patientName: 'Albus Severus', docName: 'Dr. Robert Fischer', date: '2026-05-22', time: '10:30 AM', triageTemp: '98.8', triageBP: '122/81', triagePulse: '74', reason: 'Routine endocrine test review', status: 'Scheduled' },
        { id: 'OPD-102', patientName: 'Luna Lovegood', docName: 'Dr. Robert Fischer', date: '2026-05-22', time: '02:15 PM', triageTemp: '99.1', triageBP: '115/75', triagePulse: '80', reason: 'Acute migraine persistent feedback', status: 'Completed' }
      ];
      setAppointments(initialAppts);
      localStorage.setItem('suite_appointments', JSON.stringify(initialAppts));
    }

    // 3. Load Bed IPD
    const localIpdResult = localStorage.getItem('suite_ipd');
    if (localIpdResult) {
      setIpdAdmissions(JSON.parse(localIpdResult));
    } else {
      const initialIpd = [
        { id: 'IPD-201', mrn: 'MRN-2026-9201', patientName: 'Albus Severus', ward: 'General Ward', bedNumber: 'G-102', admissionDate: '2026-05-20', status: 'Admitted', dmsNotes: 'Oxygen levels consistent. BP stable.' },
        { id: 'IPD-202', mrn: 'MRN-2026-4412', patientName: 'Luna Lovegood', ward: 'ICU Care', bedNumber: 'ICU-03', admissionDate: '2026-05-21', status: 'Admitted', dmsNotes: 'Surgical recovery watch. Strictly nil-by-mouth.' }
      ];
      setIpdAdmissions(initialIpd);
      localStorage.setItem('suite_ipd', JSON.stringify(initialIpd));
    }

    // 4. Load ER Patients
    const localEr = localStorage.getItem('suite_er');
    if (localEr) {
      setEmergencyPatients(JSON.parse(localEr));
    } else {
      const initialEr = [
        { id: 'ER-901', patientName: 'John Watson', triageLevel: 'Red (Critical)', traumaNotes: 'Polytrauma following road traffic incident. External hemorrhaging present.', relativeContact: '9827392812', timestamp: '2026-05-21 11:30' }
      ];
      setEmergencyPatients(initialEr);
      localStorage.setItem('suite_er', JSON.stringify(initialEr));
    }

    // 5. Load Clinical Supplies
    const localSupplies = localStorage.getItem('suite_supplies');
    if (localSupplies) {
      setClinicalSupplies(JSON.parse(localSupplies));
    } else {
      const initialSupplies = [
        { id: 'SUP-401', name: 'Disposable Syringes 5ml', sku: 'DS-05ML', currentStock: 250, minStockThreshold: 50, unitPrice: 8, category: 'Syringes & Needles', poPending: false },
        { id: 'SUP-402', name: 'N95 Respirators Grade A', sku: 'N95-A', currentStock: 24, minStockThreshold: 40, unitPrice: 35, category: 'Personal Protective Equip', poPending: true }
      ];
      setClinicalSupplies(initialSupplies);
      localStorage.setItem('suite_supplies', JSON.stringify(initialSupplies));
    }

    // 6. Load Pharmacy Stocks
    const localPharmStocks = localStorage.getItem('suite_pharm_stocks');
    if (localPharmStocks) {
      setPharmacyStocks(JSON.parse(localPharmStocks));
    } else {
      const initialPharm = [
        { id: 'MED-701', name: 'Metformin HCl 500mg', batch: 'MET-402A', qty: 220, price: 4.5, expiry: '2026-11-20', supplier: 'Zydus Healthcare' },
        { id: 'MED-702', name: 'Azithromycin 250mg', batch: 'AZI-092X', qty: 8, price: 12.0, expiry: '2026-06-15', supplier: 'Cipla Ltd' },
        { id: 'MED-703', name: 'Paracetamol 650mg tablets', batch: 'PAR-331B', qty: 95, price: 1.8, expiry: '2026-04-10', supplier: 'GlaxoSmith' }
      ];
      setPharmacyStocks(initialPharm);
      localStorage.setItem('suite_pharm_stocks', JSON.stringify(initialPharm));
    }

    // 7. Load Lab Reports
    const localLabs = localStorage.getItem('suite_labs');
    if (localLabs) {
      setLabOrders(JSON.parse(localLabs));
    } else {
      const initialLabs = [
        { id: 'LAB-501', patientName: 'Albus Severus', testName: 'Lipid Profile Panels', specType: 'Serum Yellow Top', status: 'Authorized', resultNotes: 'Total Cholesterol: 184 mg/dL. HDL: 52 mg/dL. Normal range values.', orderedDate: '2026-05-19' },
        { id: 'LAB-502', patientName: 'Luna Lovegood', testName: 'Complete Blood Count (CBC)', specType: 'EDTA Purple Top', status: 'Testing', resultNotes: 'Processing in hematology analyzer...', orderedDate: '2026-05-21' }
      ];
      setLabOrders(initialLabs);
      localStorage.setItem('suite_labs', JSON.stringify(initialLabs));
    }

    // 8. Load Radiology RIS
    const localRads = localStorage.getItem('suite_rads');
    if (localRads) {
      setRadiologyOrders(JSON.parse(localRads));
    } else {
      const initialRads = [
        { id: 'RAD-601', patientName: 'Albus Severus', modality: 'X-Ray Chest PA View', status: 'Completed', reportFindings: 'Clear lung fields. Normal transverse cardiac diameter. No pleural effusion.', date: '2026-05-18' },
        { id: 'RAD-602', patientName: 'Luna Lovegood', modality: 'CT Brain Plain', status: 'Scheduled', reportFindings: 'Awaiting technician positioning.', date: '2026-05-21' }
      ];
      setRadiologyOrders(initialRads);
      localStorage.setItem('suite_rads', JSON.stringify(initialRads));
    }

    // 9. Hospital Billing Software
    const localBilling = localStorage.getItem('suite_billing');
    if (localBilling) {
      setBillingInvoices(JSON.parse(localBilling));
    } else {
      const initialBills = [
        { id: 'INV-10901', patientName: 'Albus Severus', totalAmount: 4500, taxAmount: 540, netAmount: 5040, gstRate: 12, itemDescription: 'Endocrine Panel Consult & Ward Suite Day 1', insuranceClaimStatus: 'Authorized', auditTrail: 'Generated on 2026-05-20 by super_admin' },
        { id: 'INV-10902', patientName: 'John Watson', totalAmount: '12000', taxAmount: '2160', netAmount: '14160', gstRate: 18, itemDescription: 'Emergency Trauma Triage & Suture Materials', insuranceClaimStatus: 'Initiated', auditTrail: 'Generated on 2026-05-21 by super_admin' }
      ];
      setBillingInvoices(initialBills);
      localStorage.setItem('suite_billing', JSON.stringify(initialBills));
    }

    // 10. HR & Payroll
    const localStaff = localStorage.getItem('suite_staff');
    if (localStaff) {
      setStaff(JSON.parse(localStaff));
    } else {
      const initialStaff = [
        { id: 'EMP-01', name: 'Sarah Jenkins', role: 'Head Emergency Nurse', department: 'ER Ward A', attendance: '92%', leaveBalance: 6, basicSalary: 64000 },
        { id: 'EMP-02', name: 'Dr. Amy Fowler', role: 'Chief Radiologist', department: 'Radiology/RIS', attendance: '96%', leaveBalance: 8, basicSalary: 145000 }
      ];
      setStaff(initialStaff);
      localStorage.setItem('suite_staff', JSON.stringify(initialStaff));
    }

    // 11. Security Audit Logs
    const localAudits = localStorage.getItem('suite_audits');
    if (localAudits) {
      setAuditLogs(JSON.parse(localAudits));
    } else {
      const initialAudits = [
        { timestamp: '2026-05-21 11:20:10', actor: 'Dr. Robert Fischer', action: 'KYC Record Read', resource: 'Patient MRN-2026-9201', severity: 'Info' },
        { timestamp: '2026-05-21 12:45:00', actor: 'Pharmacy Agent', action: 'Stock Dispatch', resource: 'Metformin HCl batch MET-402A', severity: 'Warning' }
      ];
      setAuditLogs(initialAudits);
      localStorage.setItem('suite_audits', JSON.stringify(initialAudits));
    }
  }, []);

  // Sync / reload custom GST Slabs from Settings whenever HospitalSuite switches focus or mounts
  useEffect(() => {
    const localSlabs = localStorage.getItem('gst_slabs');
    if (localSlabs) {
      try {
        const parsed = JSON.parse(localSlabs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGstSlabs(parsed);
          // Set pre-selected rate if not matching current
          setBillForm(prev => {
            const hasCurrent = parsed.some(s => Number(s.rate) === Number(prev.gstRate));
            return hasCurrent ? prev : { ...prev, gstRate: Number(parsed[0].rate) };
          });
        }
      } catch (e) {
        console.error("Error loading custom GST slabs: ", e);
      }
    }
  }, [activeModule]);

  // Sync utilities to save individual datasets
  const persist = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const addAuditLog = (action: string, resource: string, severity: 'Info' | 'Warning' | 'Critical' = 'Info') => {
    const log = {
      timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
      actor: 'Dr. Robert Fischer',
      action,
      resource,
      severity
    };
    const updated = [log, ...auditLogs];
    setAuditLogs(updated);
    persist('suite_audits', updated);
  };

  // Action methods
  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycForm.name) return;
    const newMRN = `MRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPat = { ...kycForm, mrn: newMRN };
    const updatedPatients = [...patients, newPat];
    setPatients(updatedPatients);
    persist('suite_patients', updatedPatients);
    addAuditLog('KYC Patient Saved', `${newPat.name} (MRN: ${newMRN})`, 'Info');
    showToast(`Successfully Generated Unique MRN: ${newMRN} and created profile.`);
    setKycForm({ name: '', gender: 'Male', age: '', city: '', phone: '', email: '', insuranceProvider: '' });
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opdForm.patientName) return;
    const newOPD = {
      id: `OPD-${Math.floor(100 + Math.random() * 900)}`,
      ...opdForm,
      status: 'Scheduled'
    };
    const updated = [...appointments, newOPD];
    setAppointments(updated);
    persist('suite_appointments', updated);
    addAuditLog('OPD Calendar Booked', `${newOPD.patientName} (${newOPD.id})`, 'Info');
    showToast(`OPD appointment created for ${newOPD.patientName}`);
    setOpdForm({ patientName: '', docName: 'Dr. Robert Fischer', date: '', time: '', triageTemp: '98.6', triageBP: '120/80', triagePulse: '72', reason: '' });
  };

  const handleTransferBed = (id: string, newBed: string, newWard: string) => {
    const updated = ipdAdmissions.map(adv => {
      if (adv.id === id) {
        addAuditLog('IPD Bed Transfer Action', `${adv.patientName} moved from ${adv.bedNumber} to ${newBed}`, 'Warning');
        return { ...adv, bedNumber: newBed, ward: newWard };
      }
      return adv;
    });
    setIpdAdmissions(updated);
    persist('suite_ipd', updated);
    showToast(`Patient transferred successfully to bed ${newBed} in ${newWard}.`);
  };

  const handleDischargeIPD = (id: string) => {
    const updated = ipdAdmissions.map(adv => {
      if (adv.id === id) {
        addAuditLog('Discharge Summary Executed', `${adv.patientName} discharged from ${adv.ward}`, 'Info');
        return { ...adv, status: 'Discharged' };
      }
      return adv;
    });
    setIpdAdmissions(updated);
    persist('suite_ipd', updated);
    showToast('Discharge report generated and bed vacated.');
  };

  const handleAddIPD = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipdForm.patientName) return;
    const newIpd = {
      id: `IPD-${Math.floor(200 + Math.random() * 800)}`,
      mrn: `MRN-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: ipdForm.patientName,
      ward: ipdForm.ward,
      bedNumber: ipdForm.bedNumber,
      admissionDate: new Date().toISOString().split('T')[0],
      status: 'Admitted',
      dmsNotes: ipdForm.dmsNotes
    };
    const updated = [...ipdAdmissions, newIpd];
    setIpdAdmissions(updated);
    persist('suite_ipd', updated);
    addAuditLog('IPD Bed Admission Intake', `${newIpd.patientName} in ${newIpd.ward}`, 'Info');
    showToast(`Admitted ${newIpd.patientName} to bed ${newIpd.bedNumber}.`);
    setIpdForm({ patientName: '', ward: 'General Ward', bedNumber: 'G-102', dmsNotes: '' });
  };

  const handleAddEmergency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyForm.patientName) return;
    const newEr = {
      id: `ER-${Math.floor(900 + Math.random() * 99)}`,
      patientName: emergencyForm.patientName,
      triageLevel: emergencyForm.triageLevel,
      traumaNotes: emergencyForm.traumaNotes,
      relativeContact: emergencyForm.relativeContact,
      timestamp: new Date().toISOString().replace('T', ' ').split('.')[0]
    };
    const updated = [...emergencyPatients, newEr];
    setEmergencyPatients(updated);
    persist('suite_er', updated);
    addAuditLog('Emergency Trauma Alert', `Critical patient ${newEr.patientName} admitted with level: ${newEr.triageLevel}`, 'Critical');
    showToast(`Trauma Incident logged. Emergency care staff dispatched.`);
    setEmergencyForm({ patientName: '', triageLevel: 'Red (Critical)', traumaNotes: '', relativeContact: '' });
  };

  const handleCreatePO = (itemName: string) => {
    const updated = clinicalSupplies.map(sup => {
      if (sup.name === itemName) {
        addAuditLog('Purchase Order (PO) Sent', `Requested restocking order for supply item: ${sup.name}`, 'Info');
        return { ...sup, poPending: true };
      }
      return sup;
    });
    setClinicalSupplies(updated);
    persist('suite_supplies', updated);
    showToast(`Restock Supply Purchase Order submitted for ${itemName}.`);
  };

  const handleCreateNewSupply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplyForm.name) return;
    const newSup = {
      id: `SUP-${Math.floor(400 + Math.random() * 500)}`,
      name: supplyForm.name,
      sku: supplyForm.sku || 'SKU-NEW',
      currentStock: Number(supplyForm.currentStock) || 0,
      minStockThreshold: Number(supplyForm.minStockThreshold) || 30,
      unitPrice: Number(supplyForm.unitPrice) || 5,
      category: supplyForm.category,
      poPending: false
    };
    const updated = [...clinicalSupplies, newSup];
    setClinicalSupplies(updated);
    persist('suite_supplies', updated);
    addAuditLog('Supply Inventory Added', `${newSup.name}`, 'Info');
    showToast(`Registered supply product: ${newSup.name} successfully.`);
    setSupplyForm({ name: '', sku: '', currentStock: 100, minStockThreshold: 30, unitPrice: 45, category: 'Syringes & Needles' });
  };

  const handleAddDrug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugForm.name) return;
    const newDrug = {
      id: `MED-${Math.floor(700 + Math.random() * 300)}`,
      ...drugForm
    };
    const updated = [...pharmacyStocks, newDrug];
    setPharmacyStocks(updated);
    persist('suite_pharm_stocks', updated);
    addAuditLog('Pharmacy Stock Restock', `${newDrug.name} registered`, 'Info');
    showToast(`Recorded healthcare pharmaceutical stock for ${newDrug.name}`);
    setDrugForm({ name: '', batch: '', qty: 100, price: 40, expiry: '2026-11-20', supplier: 'Mankind' });
  };

  const handleDispatchDrug = (id: string, dispatchQty: number) => {
    const updated = pharmacyStocks.map(dr => {
      if (dr.id === id) {
        const remaining = Math.max(0, dr.qty - dispatchQty);
        addAuditLog('Drug Dispense Logged', `Dispensed ${dispatchQty} units of ${dr.name}`, remaining < 10 ? 'Critical' : 'Info');
        return { ...dr, qty: remaining };
      }
      return dr;
    });
    setPharmacyStocks(updated);
    persist('suite_pharm_stocks', updated);
    showToast(`Dispensed drug successfully. Inventory updated.`);
  };

  const handleAddLabOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labForm.patientName) return;
    const newLab = {
      id: `LAB-${Math.floor(500 + Math.random() * 500)}`,
      patientName: labForm.patientName,
      testName: labForm.testName,
      specType: labForm.testName.includes('CBC') ? 'EDTA Blood' : 'Plasma Yellow-Cap',
      status: 'Ordered',
      resultNotes: 'Awaiting sample collection.',
      orderedDate: new Date().toISOString().split('T')[0]
    };
    const updated = [...labOrders, newLab];
    setLabOrders(updated);
    persist('suite_labs', updated);
    addAuditLog('Laboratory Order Sent', `${newLab.testName} requested for ${newLab.patientName}`, 'Info');
    showToast(`Lab order logged for ${newLab.patientName}. Patient requisition sheet issued.`);
    setLabForm({ patientName: '', testName: 'Complete Blood Count (CBC)', notes: '' });
  };

  const handleUpdateLabResult = (id: string, notes: string) => {
    const updated = labOrders.map(lab => {
      if (lab.id === id) {
        addAuditLog('Lab Result Authorized', `Result posted for ${lab.patientName}: ${lab.testName}`, 'Info');
        return { ...lab, resultNotes: notes, status: 'Authorized' };
      }
      return lab;
    });
    setLabOrders(updated);
    persist('suite_labs', updated);
    showToast(`Laboratory tests successfully posted & signed.`);
  };

  const handleAddRadiology = (e: React.FormEvent) => {
    e.preventDefault();
    if (!radForm.patientName) return;
    const newRad = {
      id: `RAD-${Math.floor(600 + Math.random() * 400)}`,
      patientName: radForm.patientName,
      modality: radForm.modality,
      status: 'Scheduled',
      reportFindings: 'Assigned to technician cue.',
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [...radiologyOrders, newRad];
    setRadiologyOrders(updated);
    persist('suite_rads', updated);
    addAuditLog('Radiology RIS Scan Booked', `${newRad.modality} scheduled for ${newRad.patientName}`, 'Info');
    showToast(`Radiology examination requested for ${newRad.patientName}.`);
  };

  const handleAddBillingInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billForm.patientName) return;
    const priceAmount = Number(billForm.basePrice);
    const taxValue = Math.round(priceAmount * (Number(billForm.gstRate) / 100));
    const netTotal = priceAmount + taxValue;
    const newInv = {
      id: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
      patientName: billForm.patientName,
      totalAmount: priceAmount,
      taxAmount: taxValue,
      netAmount: netTotal,
      gstRate: billForm.gstRate,
      itemDescription: billForm.itemDescription,
      insuranceClaimStatus: billForm.insuranceClaimStatus,
      auditTrail: `Created at ${new Date().toLocaleDateString()} by system administrator`
    };
    const updated = [...billingInvoices, newInv];
    setBillingInvoices(updated);
    persist('suite_billing', updated);
    addAuditLog('GST Invoiced Created', `Billing summary ${newInv.id} to ${newInv.patientName}`, 'Info');
    showToast(`Invoice generated for patient ${newInv.patientName}. Net total: ₹${netTotal}.`);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name) return;
    const newEmp = {
      id: `EMP-${Math.floor(10 + Math.random() * 90)}`,
      ...staffForm,
      attendance: '100%',
      leaveBalance: 12
    };
    const updated = [...staff, newEmp];
    setStaff(updated);
    persist('suite_staff', updated);
    addAuditLog('Staff Payroll Onboarding', `${newEmp.name} hired as ${newEmp.role}`, 'Info');
    showToast(`Registered HR contract profile for ${newEmp.name}`);
    setStaffForm({ name: '', role: 'Nurse Practitioner', department: 'ICU Care', basicSalary: 45000 });
  };

  const downloadCSVReport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Unique ID,Name/Description,Quantity/Price,Status/Expiry\n";
    pharmacyStocks.forEach(p => {
      csvContent += `${p.id},"${p.name}",${p.qty},${p.expiry}\n`;
    });
    clinicalSupplies.forEach(s => {
      csvContent += `${s.id},"${s.name}",${s.currentStock},${s.poPending ? 'PO Pending' : 'Omit'}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hospital_Suite_Rep_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded Hospital MIS summary CSV report!");
  };

  // PACs diagnostic images repository
  const pacsGallery = [
    { key: 'chest_xray', title: 'Chest Radiography PA', url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=1000' },
    { key: 'brain_mri', title: 'Brain MRI Axial T2', url: 'https://images.unsplash.com/photo-1559757175-0131424134a1?q=80&w=1000' },
    { key: 'abdomen_ct', title: 'Abdomino-pelvic Contrast CT', url: 'https://images.unsplash.com/photo-1579154204601-01588f351167?q=80&w=1000' }
  ];

  return (
    <div className="w-full mt-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[3rem] p-6 hover:shadow-2xl transition-all shadow-md">
      {/* Toast Alert Inside Widget */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl animate-bounce">
          <CheckCircle2 className="text-green-400" size={18} />
          <span className="text-xs font-bold tracking-tight uppercase">{successMsg}</span>
        </div>
      )}

      {/* Header and Mini Menu */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 mb-6 border-b border-gray-100 dark:border-gray-800 gap-4">
        <div>
          <span className="px-4 py-1 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest">Enterprise Suite Activated</span>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mt-1">Comprehensive Hospital HMS Controls</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">12 High Fidelity Modules Integrated with Local Storage Databases</p>
        </div>
        <button 
          onClick={downloadCSVReport}
          className="flex items-center gap-2 px-6 py-3 bg-secondary text-white hover:bg-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
        >
          <Download size={14} /> Export MIS Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Module Selector Sidebar */}
        <div className="lg:col-span-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-800/80 max-h-[720px] overflow-y-auto">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Clinical & Administrative Modules</p>
          <div className="space-y-1.5">
            {modules.map((m, index) => {
              const Icon = m.icon;
              const isActive = activeModule === index;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveModule(index);
                    setSuccessMsg('');
                  }}
                  className={`w-full p-4 rounded-2xl flex items-start gap-4 text-left transition-all relative ${
                    isActive 
                      ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' 
                      : 'hover:bg-white dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <div className={`mt-0.5 p-2 rounded-xl ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-primary'}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-black uppercase tracking-wide ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{m.name}</p>
                      {((m.id === 4 || m.id === 5) && expiringBatchesCount > 0) && (
                        <span className="shrink-0 px-1.5 py-0.5 text-[8px] font-black bg-red-500 text-white rounded-full animate-pulse">
                          {expiringBatchesCount} exp
                        </span>
                      )}
                    </div>
                    <p className={`text-[9px] mt-0.5 max-w-[200px] leading-relaxed ${isActive ? 'text-white/80' : 'text-gray-400'}`}>{m.desc}</p>
                  </div>
                  {isActive && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-yellow-300 rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Working Panel Container */}
        <div className="lg:col-span-8 bg-gray-50/50 dark:bg-gray-900/10 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 min-h-[500px]">
          
          {/* 1. OPD Management */}
          {activeModule === 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">OPD Daily Planner & Vitals Registry</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase">Out-Patient Department</span>
              </div>

              {/* Patient Appointments Registry Form */}
              <form onSubmit={handleCreateAppointment} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                <div className="col-span-full">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Add OPD Patient Appointment slot</p>
                </div>
                <div>
                  <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Select Patient Name Link</label>
                  <select 
                    value={opdForm.patientName}
                    onChange={(e) => setOpdForm({ ...opdForm, patientName: e.target.value })}
                    className="w-full text-xs font-bold bg-gray-50 dark:bg-gray-800 border-none outline-none rounded-xl p-3"
                  >
                    <option value="">-- Choose Registered Patient --</option>
                    {patients.map(p => <option key={p.mrn} value={p.name}>{p.name} ({p.mrn})</option>)}
                    {patients.length === 0 && <option value="Luna Lovegood">Luna Lovegood (Simulated Default)</option>}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Schedule date & time Slot</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={opdForm.date} onChange={(e) => setOpdForm({ ...opdForm, date: e.target.value })} className="bg-gray-50 dark:bg-gray-800 p-2 text-xs rounded-xl border-none outline-none font-bold" />
                    <input type="text" placeholder="11:30 AM" value={opdForm.time} onChange={(e) => setOpdForm({ ...opdForm, time: e.target.value })} className="bg-gray-50 dark:bg-gray-800 p-2 text-xs rounded-xl border-none outline-none font-bold" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Vitals Triage (Temp, BP, Pulse)</label>
                  <div className="grid grid-cols-3 gap-1">
                    <input type="text" placeholder="98.6 °F" value={opdForm.triageTemp} onChange={(e) => setOpdForm({ ...opdForm, triageTemp: e.target.value })} className="bg-gray-50 dark:bg-gray-800 p-2 text-[10px] rounded-xl border-none outline-none font-bold" />
                    <input type="text" placeholder="120/80" value={opdForm.triageBP} onChange={(e) => setOpdForm({ ...opdForm, triageBP: e.target.value })} className="bg-gray-50 dark:bg-gray-800 p-2 text-[10px] rounded-xl border-none outline-none font-bold" />
                    <input type="text" placeholder="72 bpm" value={opdForm.triagePulse} onChange={(e) => setOpdForm({ ...opdForm, triagePulse: e.target.value })} className="bg-gray-50 dark:bg-gray-800 p-2 text-[10px] rounded-xl border-none outline-none font-bold text-center" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Chief Consultation Reason</label>
                  <input type="text" placeholder="General physical exam & review..." value={opdForm.reason} onChange={(e) => setOpdForm({ ...opdForm, reason: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none outline-none font-bold" />
                </div>
                <button type="submit" className="col-span-full py-3 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:opacity-90">
                  Book Appointment & Lock Triage
                </button>
              </form>

              {/* Grid appointments list */}
              <div className="space-y-3">
                {appointments.map((a, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full font-bold">{a.id}</span>
                        <p className="font-extrabold text-xs text-gray-900 dark:text-white uppercase">{a.patientName}</p>
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold">{a.date} | Consultation Slot: {a.time}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[9px] text-red-500 font-bold bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded-md">🌡️ temp: {a.triageTemp}°F</span>
                        <span className="text-[9px] text-blue-500 font-bold bg-blue-50 dark:bg-blue-950/20 px-2 py-1 rounded-md">💓 pulse: {a.triagePulse}bpm</span>
                        <span className="text-[9px] text-green-500 font-bold bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded-md">🩺 BP: {a.triageBP}</span>
                      </div>
                      <p className="text-[9px] text-gray-500 mt-2 font-medium">Notes: {a.reason}</p>
                    </div>
                    {onPrescribeClick && (
                      <button 
                        type="button"
                        onClick={() => {
                          onPrescribeClick(a.patientName);
                          showToast(`Opened Digital Prescription generator pre-linked to ${a.patientName}`);
                        }}
                        className="py-2.5 px-4 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-colors shrink-0"
                      >
                        Issue E-Prescription
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. IPD & Bed Control */}
          {activeModule === 1 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">IPD Admissions & Ward Allocations</h3>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[9px] font-black uppercase">In-Patient Admissions</span>
              </div>

              {/* IPD intake form */}
              <form onSubmit={handleAddIPD} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                <div>
                  <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Patient Name Reference</label>
                  <input type="text" placeholder="Luna Lovegood" value={ipdForm.patientName} onChange={(e) => setIpdForm({ ...ipdForm, patientName: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none outline-none font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Ward Area</label>
                    <select value={ipdForm.ward} onChange={(e) => setIpdForm({ ...ipdForm, ward: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-[10px] rounded-xl font-bold">
                      <option>General Ward</option>
                      <option>Semi-Private</option>
                      <option>ICU Care</option>
                      <option>Deluxe Suite</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Bed No.</label>
                    <input type="text" placeholder="G-102" value={ipdForm.bedNumber} onChange={(e) => setIpdForm({ ...ipdForm, bedNumber: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none outline-none font-bold" />
                  </div>
                </div>
                <div className="col-span-full">
                  <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Initial Admission Intake Notes</label>
                  <input type="text" placeholder="Patient recovering following minor hernia. Vitals monitored hourly." value={ipdForm.dmsNotes} onChange={(e) => setIpdForm({ ...ipdForm, dmsNotes: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none outline-none font-bold" />
                </div>
                <button type="submit" className="col-span-full py-3 bg-purple-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:opacity-90">
                  Admit Patient & Book Bed
                </button>
              </form>

              {/* Table of active beds and discharge option */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="p-4 text-[9px] font-black uppercase text-gray-400">Patient / MRN</th>
                      <th className="p-4 text-[9px] font-black uppercase text-gray-400">Ward & Bed</th>
                      <th className="p-4 text-[9px] font-black uppercase text-gray-400">Status</th>
                      <th className="p-4 text-[9px] font-black uppercase text-gray-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {ipdAdmissions.map((i, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="p-4">
                          <p className="font-extrabold text-xs text-gray-900 dark:text-white uppercase">{i.patientName}</p>
                          <p className="text-[8px] text-gray-400 font-bold tracking-wider">{i.mrn}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-xs text-purple-600 font-black uppercase">{i.ward}</p>
                          <p className="text-[9px] text-gray-400 font-extrabold">Bed: {i.bedNumber}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${i.status === 'Admitted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{i.status}</span>
                        </td>
                        <td className="p-4 text-right space-y-1 sm:space-y-0 sm:space-x-1">
                          {i.status === 'Admitted' && (
                            <>
                              <button 
                                type="button" 
                                onClick={() => handleTransferBed(i.id, `T-${Math.floor(100+Math.random()*800)}`, 'Private Room')} 
                                className="bg-amber-100 text-amber-700 border-none p-1.5 rounded-xl text-[8px] font-bold uppercase inline-flex items-center gap-1 cursor-pointer"
                                title="Transfer Bed"
                              >
                                <ArrowRightLeft size={10} /> Transfer
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleDischargeIPD(i.id)} 
                                className="bg-red-50 text-red-600 border-none p-1.5 rounded-xl text-[8px] font-bold uppercase inline-flex items-center gap-1 cursor-pointer ml-1"
                              >
                                Discharge
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Emergency / Casualty */}
          {activeModule === 2 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">Trauma Emergency intake & Triage</h3>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[9px] font-black uppercase animate-pulse">Casualty Unit</span>
              </div>

              {/* Trauma register intake form */}
              <form onSubmit={handleAddEmergency} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Trauma Patient / Accidental Case Name</label>
                    <input type="text" placeholder="John Doe (unregistered fallback)" value={emergencyForm.patientName} onChange={(e) => setEmergencyForm({ ...emergencyForm, patientName: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none outline-none font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Triage Protocol Severity Level</label>
                    <select 
                      value={emergencyForm.triageLevel} 
                      onChange={(e) => setEmergencyForm({ ...emergencyForm, triageLevel: e.target.value })} 
                      className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs font-bold rounded-xl text-red-600"
                    >
                      <option>Red (Critical / Resuscitation)</option>
                      <option>Orange (Highly Emergent)</option>
                      <option>Yellow (Urgent / Stable)</option>
                      <option>Green (Non-Urgent / Walking)</option>
                    </select>
                  </div>
                  <div className="col-span-full">
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Emergency Trauma Case Findings</label>
                    <textarea rows={2} placeholder="Polytrauma, blood pressure dipping. Suspected left femur fracture..." value={emergencyForm.traumaNotes} onChange={(e) => setEmergencyForm({ ...emergencyForm, traumaNotes: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none outline-none font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Relative Contacts & KYC phone</label>
                    <input type="text" placeholder="+91 99282 89912" value={emergencyForm.relativeContact} onChange={(e) => setEmergencyForm({ ...emergencyForm, relativeContact: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none outline-none font-bold" />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all">
                  Publish Trauma Response Code
                </button>
              </form>

              {/* Trauma cases list */}
              <div className="space-y-3">
                {emergencyPatients.map(e => (
                  <div key={e.id} className="p-5 bg-red-50/30 border border-red-100 rounded-3xl dark:bg-gray-900/40">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                        <span className="text-[9px] font-black text-red-500 uppercase bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded-full">{e.triageLevel}</span>
                        <p className="font-extrabold text-xs text-gray-900 dark:text-white uppercase">{e.patientName}</p>
                      </div>
                      <p className="text-[9px] text-gray-400 font-bold">{e.timestamp}</p>
                    </div>
                    <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight font-medium"><strong>Clinical Notes:</strong> {e.traumaNotes}</p>
                    <div className="mt-3 text-[9px] text-gray-400 font-semibold uppercase">Relative Number: {e.relativeContact} | Emergency Record Locked</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Inventory & Stores */}
          {activeModule === 3 && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">Clinical Stores & Consumables</h3>
                  {expiringBatchesCount > 0 && (
                    <span className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 rounded-full text-[9px] font-black animate-pulse">
                      {expiringBatchesCount} batches expiring within 30 days
                    </span>
                  )}
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase">Stores Inventory</span>
              </div>

              {/* Add Inventory supply item */}
              <form onSubmit={handleCreateNewSupply} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                <div>
                  <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Consumable Product Name</label>
                  <input type="text" placeholder="Oxygen Valve Mask Grade I" value={supplyForm.name} onChange={(e) => setSupplyForm({ ...supplyForm, name: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none font-bold outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">SKU Identification</label>
                    <input type="text" placeholder="OVM-GR1" value={supplyForm.sku} onChange={(e) => setSupplyForm({ ...supplyForm, sku: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Catalog Category</label>
                    <input type="text" placeholder="Syringes" value={supplyForm.category} onChange={(e) => setSupplyForm({ ...supplyForm, category: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-[10px] rounded-xl font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 col-span-full">
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Current Quantity</label>
                    <input type="number" value={supplyForm.currentStock} onChange={(e) => setSupplyForm({ ...supplyForm, currentStock: Number(e.target.value) })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Min Threshold Alert</label>
                    <input type="number" value={supplyForm.minStockThreshold} onChange={(e) => setSupplyForm({ ...supplyForm, minStockThreshold: Number(e.target.value) })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Unit Price (₹)</label>
                    <input type="number" value={supplyForm.unitPrice} onChange={(e) => setSupplyForm({ ...supplyForm, unitPrice: Number(e.target.value) })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none font-bold" />
                  </div>
                </div>
                <button type="submit" className="col-span-full py-3 bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:opacity-90">
                  Register Supplying Consumable
                </button>
              </form>

              {/* Table of products */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="p-4 text-[9px] font-black uppercase text-gray-400">Consumable Item / SKU</th>
                      <th className="p-4 text-[9px] font-black uppercase text-gray-400">Qty Status</th>
                      <th className="p-4 text-[9px] font-black uppercase text-gray-400">PO Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {clinicalSupplies.map((s, idx) => {
                      const isLow = s.currentStock <= s.minStockThreshold;
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="p-4">
                            <p className="font-extrabold text-xs text-gray-900 dark:text-white uppercase">{s.name}</p>
                            <p className="text-[8px] text-gray-400 font-bold tracking-wider">{s.sku} • {s.category}</p>
                          </td>
                          <td className="p-4">
                            <p className={`text-xs font-black ${isLow ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{s.currentStock} Units</p>
                            {isLow && (
                              <span className="text-[7px] text-red-500 font-black tracking-widest uppercase flex items-center gap-1 mt-0.5 animate-pulse">
                                <AlertTriangle size={8} /> Needs Restock
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {s.poPending ? (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-[8px] font-black tracking-wider uppercase rounded-full">PO Queued</span>
                            ) : (
                              <button 
                                type="button" 
                                onClick={() => handleCreatePO(s.name)} 
                                className="px-3 py-1.5 bg-gray-100 hover:bg-primary hover:text-white rounded-xl text-[8px] font-black uppercase tracking-wider text-gray-500 border-none cursor-pointer duration-200"
                              >
                                Trigger PO Restock
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. Pharmacy Management */}
          {activeModule === 4 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">Clinical Pharmacy Drugs Registry</h3>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase">Pharmacy Stock Control</span>
              </div>

              {/* Add pharmaceutical drug form */}
              <form onSubmit={handleAddDrug} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 mb-6">
                <div className="col-span-full">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Register New Drug Entry (Pharmacy Stock)</p>
                </div>
                <div>
                  <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Medicinal Drug Name & Strength</label>
                  <input type="text" placeholder="Atorvastatin Ca 10mg" value={drugForm.name} onChange={(e) => setDrugForm({ ...drugForm, name: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Batch ID No.</label>
                    <input type="text" placeholder="ATO-902X" value={drugForm.batch} onChange={(e) => setDrugForm({ ...drugForm, batch: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Dispensing Price (₹)</label>
                    <input type="number" value={drugForm.price} onChange={(e) => setDrugForm({ ...drugForm, price: Number(e.target.value) })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-[10px] rounded-xl font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 col-span-full">
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Initial Qty</label>
                    <input type="number" value={drugForm.qty} onChange={(e) => setDrugForm({ ...drugForm, qty: Number(e.target.value) })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Batch Expiry Date</label>
                    <input type="date" value={drugForm.expiry} onChange={(e) => setDrugForm({ ...drugForm, expiry: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-[10px] rounded-xl font-bold" />
                  </div>
                </div>
                <button type="submit" className="col-span-full py-3 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:opacity-90">
                  Register Pharmacy Medicine Block
                </button>
              </form>

              {/* Table of drugs */}
              <div className="space-y-3">
                {pharmacyStocks.map((p, idx) => {
                  const isLow = p.qty < 10;
                  const isExpiring = new Date(p.expiry).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000;
                  return (
                    <div key={idx} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-xs">
                      <div>
                        <p className="font-extrabold text-xs text-gray-900 dark:text-white uppercase">{p.name}</p>
                        <p className="text-[9px] text-gray-400 font-bold">Batch: {p.batch} | Exp: {p.expiry}</p>
                        <div className="flex gap-2 mt-1">
                          {isLow && <span className="text-[7px] text-red-600 font-black bg-red-100 uppercase px-1.5 py-0.5 rounded">Low Stock Warning</span>}
                          {isExpiring && <span className="text-[7px] text-amber-600 font-black bg-amber-100 uppercase px-1.5 py-0.5 rounded">Expiry Caution</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-black text-gray-900 dark:text-white">{p.qty} Units</p>
                          <p className="text-[9px] text-gray-400 font-bold">₹{p.price}/unit</p>
                        </div>
                        <button 
                          onClick={() => handleDispatchDrug(p.id, 10)}
                          disabled={p.qty <= 0}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white duration-150 rounded-xl text-[9px] font-black uppercase border-none cursor-pointer disabled:opacity-50"
                        >
                          Dispense 10
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Laboratory (LIS) */}
          {activeModule === 5 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">Clinical Pathology & LIS Informatics</h3>
                <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-[9px] font-black uppercase">Lab Information System</span>
              </div>

              {/* Lab request builder */}
              <form onSubmit={handleAddLabOrder} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 md:grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Patient Name</label>
                  <select 
                    value={labForm.patientName}
                    onChange={(e) => setLabForm({ ...labForm, patientName: e.target.value })}
                    className="w-full text-xs font-bold bg-gray-50 dark:bg-gray-800 border-none outline-none rounded-xl p-3"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => <option key={p.mrn} value={p.name}>{p.name}</option>)}
                    {patients.length === 0 && <option value="Albus Severus">Albus Severus</option>}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Pathology Diagnostic Panel</label>
                  <select value={labForm.testName} onChange={(e) => setLabForm({ ...labForm, testName: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs font-bold rounded-xl border-none">
                    <option>Complete Blood Count (CBC)</option>
                    <option>Lipid Profile Panels</option>
                    <option>HBA1C Glycated Hemoglobin</option>
                    <option>Renal Kidney Function Test (KFT)</option>
                    <option>Thyroid Profile (T3, T4, TSH)</option>
                  </select>
                </div>
                <button type="submit" className="col-span-full mt-4 py-3 bg-cyan-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:opacity-90 w-full">
                  Publish Lab Ordered Voucher
                </button>
              </form>

              {/* Pathology tests ledger */}
              <div className="space-y-3">
                {labOrders.map((lab, index) => (
                  <div key={index} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-[8px] bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded font-black uppercase tracking-wider">{lab.id}</span>
                        <p className="font-extrabold text-xs text-gray-900 dark:text-white uppercase mt-1">{lab.patientName}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        lab.status === 'Authorized' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{lab.status}</span>
                    </div>
                    <p className="text-xs text-gray-900 dark:text-white font-extrabold tracking-tight italic">{lab.testName}</p>
                    <p className="text-[9px] text-gray-400 font-bold mt-1">Specimen: {lab.specType} | Ordered On: {lab.orderedDate}</p>
                    
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-[10px] text-gray-500 font-medium">
                      <strong>Clinician Lab Findings:</strong> {lab.resultNotes}
                    </div>

                    {lab.status !== 'Authorized' && (
                      <button 
                        type="button"
                        onClick={() => handleUpdateLabResult(lab.id, "Hb: 14.2 g/dL, WBC: 7600 cells/mcL, Platelets: 2.4 Lacs (Normal Diagnostic range verified)")}
                        className="mt-3 px-4 py-1.5 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg border-none cursor-pointer hover:bg-black"
                      >
                        Authorize Pathology Results
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Radiology RIS/PACS */}
          {activeModule === 6 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">Interactive RIS Diagnostic PACs Viewer</h3>
                <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-[9px] font-black">PACS Server v2.4</span>
              </div>

              {/* Layout for PACS image viewer */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* PACS controls sidebar */}
                <div className="md:col-span-4 bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">PACS Calibration Deck</p>
                  
                  <div>
                    <label className="text-[8px] text-gray-400 font-extrabold uppercase block mb-1">Select Study DICOM Image</label>
                    <select 
                      value={selectedPacsImage}
                      onChange={(e) => setSelectedPacsImage(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 p-2 text-[10px] font-bold rounded-lg border-none text-gray-800 dark:text-white"
                    >
                      {pacsGallery.map(g => <option key={g.key} value={g.key}>{g.title}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[8px] text-gray-400 font-extrabold uppercase block mb-1">Diagnostic Contrast ({pacsContrast}%)</label>
                    <input 
                      type="range" min="50" max="250" value={pacsContrast} 
                      onChange={(e) => setPacsContrast(Number(e.target.value))} 
                      className="w-full accent-primary cursor-pointer" 
                    />
                  </div>

                  <div>
                    <label className="text-[8px] text-gray-400 font-extrabold uppercase block mb-1">Zoom Magnifier ({pacsZoom}%)</label>
                    <input 
                      type="range" min="80" max="180" value={pacsZoom} 
                      onChange={(e) => setPacsZoom(Number(e.target.value))} 
                      className="w-full accent-secondary cursor-pointer" 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-gray-400 font-extrabold uppercase">Invert Gray Tones</span>
                    <button 
                      type="button"
                      onClick={() => setPacsInverted(!pacsInverted)}
                      className={`px-3 py-1 rounded text-[8px] font-black uppercase border-none cursor-pointer ${
                        pacsInverted ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {pacsInverted ? 'Inverted' : 'Standard'}
                    </button>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => {
                      setPacsContrast(100);
                      setPacsZoom(100);
                      setPacsInverted(false);
                      showToast("PACS Calibration filters reset.");
                    }}
                    className="w-full py-2 bg-gray-100 text-gray-500 hover:text-black rounded-lg text-[8px] font-black uppercase tracking-widest border-none cursor-pointer duration-150"
                  >
                    Reset Calibration
                  </button>
                </div>

                {/* DICOM viewer stage */}
                <div className="md:col-span-8 bg-black rounded-[2rem] p-4 border border-gray-800 flex flex-col items-center justify-center relative min-h-[350px] overflow-hidden select-none">
                  <div className="absolute top-4 left-4 text-white text-[8px] font-mono leading-tight bg-black/60 p-2 rounded border border-white/10">
                    ID: PAT-2026-X83 | SEX: M | AGE: 32Y<br />
                    DEVICE: SIEMENS DE-3000 PACS<br />
                    CONTRAST: {pacsContrast}% | ZOOM: {pacsZoom}% | MODE: MONO_VAR
                  </div>

                  <div className="absolute top-4 right-4 bg-red-600 text-white font-black text-[7px] px-2 py-0.5 rounded tracking-widest uppercase">
                    DIAGNOSTIC WORKSPACE ONLY / MOCK CERT
                  </div>

                  {/* DICOM Mock Image Container */}
                  <div className="overflow-hidden rounded-xl border border-white/10 w-full h-full max-h-[250px] flex items-center justify-center">
                    <img 
                      src={pacsGallery.find(g => g.key === selectedPacsImage)?.url} 
                      alt="DICOM scan viewer" 
                      className="object-cover rounded duration-150 shadow-inner"
                      style={{
                        filter: `contrast(${pacsContrast}%) ${pacsInverted ? 'invert(1)' : 'invert(0)'}`,
                        transform: `scale(${pacsZoom / 100})`,
                        width: '100%',
                        height: '100%'
                      }}
                    />
                  </div>

                  <p className="mt-4 text-gray-400 font-bold uppercase tracking-wider text-[8px]">
                    Use Left sliders to dynamically calibrate and zoom DICOM image
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 8. Hospital Billing Software */}
          {activeModule === 7 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">GST GST Tax Ledger & Claims Audit</h3>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-[9px] font-black uppercase">GST & Claims Software</span>
              </div>

              {/* Billing generation form */}
              <form onSubmit={handleAddBillingInvoice} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Receipt Recipient Patient</label>
                  <input type="text" placeholder="Albus Severus" value={billForm.patientName} onChange={(e) => setBillForm({ ...billForm, patientName: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none font-bold" />
                </div>
                <div>
                  <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Item Description / Services Provided</label>
                  <input type="text" placeholder="Therapeutic Room Suite Ward charges" value={billForm.itemDescription} onChange={(e) => setBillForm({ ...billForm, itemDescription: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none font-bold" />
                </div>
                <div className="grid grid-cols-3 gap-2 col-span-full">
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Base Price Amount (₹)</label>
                    <input type="number" value={billForm.basePrice} onChange={(e) => setBillForm({ ...billForm, basePrice: Number(e.target.value) })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">GST Tax Slab Type</label>
                    <select value={billForm.gstRate} onChange={(e) => setBillForm({ ...billForm, gstRate: Number(e.target.value) })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-[10px] rounded-xl font-bold border-none">
                      {gstSlabs.map((slab, index) => (
                        <option key={index} value={slab.rate}>
                          {slab.label.includes('%') ? slab.label : `${slab.rate}% ${slab.label}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Insurance Auth</label>
                    <select value={billForm.insuranceClaimStatus} onChange={(e) => setBillForm({ ...billForm, insuranceClaimStatus: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-[10px] rounded-xl font-bold border-none">
                      <option>Initiated</option>
                      <option>Approved</option>
                      <option>Declined</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="col-span-full py-3 bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:opacity-90">
                  Generate Invoiced Ledger Sheet
                </button>
              </form>

              {/* Billings LEDGER list */}
              <div className="space-y-4">
                {billingInvoices.map((b, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-black text-gray-400">{b.id}</p>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        b.insuranceClaimStatus === 'Authorized' || b.insuranceClaimStatus === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>Insurance: {b.insuranceClaimStatus}</span>
                    </div>
                    <p className="font-extrabold text-xs text-gray-900 dark:text-white uppercase">{b.patientName}</p>
                    <p className="text-xs text-gray-500 font-bold mt-1">{b.itemDescription}</p>

                    <div className="mt-4 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                      <div>
                        <span className="text-[8px] text-gray-400 font-bold uppercase block">Net Cost (incl. {b.gstRate}% GST)</span>
                        <span className="text-sm font-black text-primary">₹{b.netAmount}</span>
                      </div>
                      <div className="text-right text-[8px] text-gray-400 font-semibold leading-tight">
                        Base: ₹{b.totalAmount}<br />
                        Tax: ₹{b.taxAmount}
                      </div>
                    </div>
                    <p className="text-[8px] text-gray-400 mt-2 font-mono italic">Audit Trail: {b.auditTrail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. HR & Payroll */}
          {activeModule === 8 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">HR Payroll & Staff Rosters</h3>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[9px] font-black uppercase">Staff Directory & Salary slips</span>
              </div>

              {/* Staff onboarding form */}
              <form onSubmit={handleAddStaff} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Contractor Full Name</label>
                    <input type="text" placeholder="Sarah Jenkins" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none outline-none font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Role Type Title</label>
                    <input type="text" placeholder="Senior ICU Nurse" value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none font-bold animate-none" />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Assigned Ward Department</label>
                    <input type="text" placeholder="Pediatric Ward A" value={staffForm.department} onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black block mb-1">Basic Monthly Salary (₹)</label>
                    <input type="number" value={staffForm.basicSalary} onChange={(e) => setStaffForm({ ...staffForm, basicSalary: Number(e.target.value) })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-[10px] rounded-xl border-none font-bold" />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-yellow-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:opacity-90">
                  Onboard Contractor & Generate Payroll
                </button>
              </form>

              {/* Table of staff directory & slip builder trigger */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="p-4 text-[9px] font-black uppercase text-gray-400">Employee / Dept</th>
                      <th className="p-4 text-[9px] font-black uppercase text-gray-400">Basic / Slip</th>
                      <th className="p-4 text-[9px] font-black uppercase text-gray-400 text-right">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {staff.map((st, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="p-4">
                          <p className="font-extrabold text-xs text-gray-900 dark:text-white uppercase">{st.name}</p>
                          <p className="text-[8px] text-gray-400 font-bold tracking-wider">{st.id} • {st.role}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-xs text-gray-900 dark:text-white font-black">₹{st.basicSalary}</p>
                          <button 
                            type="button" 
                            onClick={() => {
                              showToast(`Payslip generated for ${st.name} successfully.`);
                              addAuditLog('Salary Pay Slip Processed', `${st.name} paid ₹${st.basicSalary}`, 'Info');
                            }}
                            className="text-[7px] text-primary hover:underline border-none bg-transparent cursor-pointer font-black uppercase tracking-widest mt-1 block"
                          >
                            Generate Pay-Slip
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-[10px] font-extrabold text-green-500 bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded-md">{st.attendance} Pres</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 10. Real-Time Hospital Dashboard */}
          {activeModule === 9 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">Executive MIS Charts & Revenue KPIs</h3>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[9px] font-black uppercase">MIS Performance Engine</span>
              </div>

              {/* KPI blocks */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
                  <p className="text-[8px] text-gray-400 font-extrabold uppercase tracking-widest">General Beds Occupied</p>
                  <p className="text-lg font-black text-primary mt-1">74.2%</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
                  <p className="text-[8px] text-gray-400 font-extrabold uppercase tracking-widest">Active Doctors Roster</p>
                  <p className="text-lg font-black text-purple-600 mt-1">12 Duty</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
                  <p className="text-[8px] text-gray-400 font-extrabold uppercase tracking-widest">Emergency ER Inflows</p>
                  <p className="text-lg font-black text-red-500 mt-1">4 Urgent</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
                  <p className="text-[8px] text-gray-400 font-extrabold uppercase tracking-widest">Total Active Revenue</p>
                  <p className="text-lg font-black text-green-500 mt-1">₹14,24,902</p>
                </div>
              </div>

              {/* Recharts Bar graph mockup representing hospital income segments */}
              <div className="bg-white dark:bg-gray-900 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-800 mb-6">
                <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest mb-4">Daily Department Income Splits (₹ Thousands)</p>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'OPD Services', value: 450 },
                      { name: 'IPD Rooms & ICU', value: 890 },
                      { name: 'Pathology Labs', value: 310 },
                      { name: 'RIS Radiology Scans', value: 290 },
                      { name: 'Pharmacy Sales', value: 540 }
                    ]}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} />
                      <YAxis stroke="#888888" fontSize={9} tickLine={false} />
                      <Tooltip formatter={(v) => `₹${v},000`} contentStyle={{ fontSize: '10px', borderRadius: '12px' }} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                        <Cell fill="#3b82f6" />
                        <Cell fill="#6366f1" />
                        <Cell fill="#06b6d4" />
                        <Cell fill="#0ea5e9" />
                        <Cell fill="#10b981" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-3xl flex justify-between items-center">
                <div>
                  <p className="text-xs font-black uppercase text-gray-900 dark:text-white">Need granular reports?</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">Click Export to retrieve multi-sheet financial and operational tables.</p>
                </div>
                <button type="button" onClick={downloadCSVReport} className="py-2.5 px-5 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-black">
                  Trigger XLSX Download
                </button>
              </div>
            </div>
          )}

          {/* 11. Patient KYC Registration */}
          {activeModule === 10 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">Clinical KYC Demographic Intake</h3>
                <span className="px-3 py-1 bg-yellow-105 text-yellow-700 bg-amber-50 rounded-full text-[9px] font-black uppercase">Unique MRN registry</span>
              </div>

              {/* Demographic Registration KYC Form */}
              <form onSubmit={handleRegisterPatient} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] text-gray-400 font-extrabold uppercase block mb-1">Full Legal Name</label>
                    <input type="text" placeholder="Harry Potter" value={kycForm.name} onChange={(e) => setKycForm({ ...kycForm, name: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs rounded-xl border-none outline-none font-bold text-gray-800 dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-gray-400 font-extrabold uppercase block mb-1">Gender</label>
                      <select value={kycForm.gender} onChange={(e) => setKycForm({ ...kycForm, gender: e.target.value })} className="w-full bg-gray-50 p-3 text-[10px] font-bold rounded-xl border-none text-gray-800">
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 font-extrabold uppercase block mb-1">Age in years</label>
                      <input type="number" placeholder="28" value={kycForm.age} onChange={(e) => setKycForm({ ...kycForm, age: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs font-bold rounded-xl border-none text-gray-800" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 font-extrabold uppercase block mb-1">Active Contact Mobile Phone No.</label>
                    <input type="text" placeholder="+91 99201 02910" value={kycForm.phone} onChange={(e) => setKycForm({ ...kycForm, phone: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs font-bold rounded-xl border-none text-gray-801" />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 font-extrabold uppercase block mb-1">Home Resident City</label>
                    <input type="text" placeholder="Gryffindor Tower" value={kycForm.city} onChange={(e) => setKycForm({ ...kycForm, city: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs font-bold rounded-xl border-none" />
                  </div>
                  <div className="col-span-full">
                    <label className="text-[9px] text-gray-400 font-extrabold uppercase block mb-1">Insurance Provider Broker Link</label>
                    <input type="text" placeholder="Aditya Birla Health Care Policy ID: 9028A" value={kycForm.insuranceProvider} onChange={(e) => setKycForm({ ...kycForm, insuranceProvider: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 p-3 text-xs font-bold rounded-xl border-none" />
                  </div>
                </div>
                <button type="submit" className="w-full py-3.5 bg-primary text-white font-black text-[10px] tracking-widest uppercase rounded-xl">
                  Register KYC Demographics & Query MRN
                </button>
              </form>

              {/* Registered Directory display */}
              <div className="space-y-3">
                {patients.map(p => (
                  <div key={p.mrn} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <div>
                      <span className="text-[8px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-black tracking-widest uppercase">{p.mrn}</span>
                      <p className="font-extrabold text-xs text-gray-900 dark:text-white uppercase mt-1">{p.name}</p>
                      <p className="text-[9px] text-gray-400 font-semibold">{p.gender} • {p.age} Yrs old • City: {p.city}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-gray-400 font-bold block">{p.phone}</span>
                      <span className="text-[8px] text-purple-600 font-black tracking-wider uppercase mt-0.5 block">Ins: {p.insuranceProvider || 'Nil Cashpayer'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 12. Role-Based Access Control & Audits */}
          {activeModule === 11 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">RBAC department Controls & Security logs</h3>
                <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-[9px] font-black uppercase">RBAC Audit Vault</span>
              </div>

              {/* Departments permission switches */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 mb-6">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Interactive System Privilege Switches</p>
                
                <div className="space-y-3">
                  {[
                    { label: 'Doctor Clinical Prescription Modification Access', role: 'Doctor Authority', state: true },
                    { label: 'Pharmacy Desk Inventory stock adjustments', role: 'Pharmacy desk', state: true },
                    { label: 'Laboratory Specimen results authorization and signoff', role: 'LIS Lab Tech', state: false },
                    { label: 'Full payroll ledger modification & payslip creation', role: 'Super administrator', state: false }
                  ].map((priv, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                      <div>
                        <p className="text-xs font-black text-gray-900 dark:text-white">{priv.label}</p>
                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{priv.role}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        priv.state ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {priv.state ? 'Granted' : 'Admin Lock'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic audits trails */}
              <div className="bg-slate-950 dark:bg-black p-5 rounded-3xl font-mono text-[9px] text-gray-300 space-y-2 border border-slate-850">
                <p className="text-primary font-black uppercase text-[10px] tracking-wider mb-2 flex items-center gap-2">
                  <Lock size={12} /> SECURE HARDENED SECURITY LOGGER
                </p>
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="border-b border-white/5 pb-2">
                    <span className="text-[8px] text-gray-500">[{log.timestamp}]</span>{' '}
                    <span className="text-sky-400">({log.actor})</span>{' '}
                    <span className="text-amber-400 font-bold">{log.action}</span> -{' '}
                    <span className="text-white font-medium">{log.resource}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
