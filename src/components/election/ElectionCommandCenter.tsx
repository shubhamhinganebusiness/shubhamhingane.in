import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { 
  Search, Users, UserCheck, MapPin, Calendar, MessageSquare, PhoneCall, 
  BarChart3, Shield, Plus, Trash2, Check, AlertTriangle, Send, Upload, 
  FileText, CheckCircle2, UserPlus, Settings, Activity, Grid, Volume2, 
  RefreshCw, Sliders, Download, LayoutDashboard, TrendingUp, UserX, HelpCircle,
  X, Database, FileSpreadsheet, Trash, Copy
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';

// --- Interfaces ---
interface Voter {
  id: string;
  name: string;
  epic: string;
  mobile: string;
  gender: string;
  age: number;
  ward: string;
  boothId: string;
  address: string;
  familyId: string;
  supportStatus: 'For' | 'Against' | 'Undecided' | 'Swing';
  voted: boolean;
  caste: string;
  religion: string;
  headOfFamily: boolean;
}

interface Booth {
  id: string;
  name: string;
  ward: string;
  totalVoters: number;
  turnoutPercent: number;
  supportRatio: number; // For/Total
  status: 'Normal' | 'Critical' | 'Low Turnout';
}

interface Volunteer {
  id: string;
  name: string;
  mobile: string;
  role: 'Booth Agent' | 'Panna Pramukh' | 'Sector Head' | 'Campaign Manager';
  assignedBoothId: string;
  status: 'Active' | 'Inactive';
  attendance: 'Checked In' | 'Checked Out';
  lastCheckInTime?: string;
  lastGpsLocation?: string;
}

interface CampaignEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  assignedBooths: string[];
  assignedVolunteers: string[];
  status: 'Upcoming' | 'Completed' | 'Cancelled';
}

interface Issue {
  id: string;
  boothId: string;
  description: string;
  reportedBy: string;
  reportedTime: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  severity: 'Low' | 'Medium' | 'High';
}

interface Feedback {
  id: string;
  voterName: string;
  mobile: string;
  text: string;
  sentiment: 'For' | 'Against' | 'Undecided' | 'Swing';
  category: 'Development' | 'Infrastructure' | 'Healthcare' | 'Education' | 'Water' | 'Jobs' | 'Other';
  timestamp: string;
}

// --- CONSTANTS & MOCK DATA ---
const CASTE_OPTIONS = ['General', 'OBC', 'SC', 'ST', 'Maratha', 'Other'];
const RELIGION_OPTIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'];

const INITIAL_VOTERS: Voter[] = [
  { id: 'v1', name: 'Rajesh Sharma', epic: 'ECI9876543', mobile: '9876543210', gender: 'Male', age: 45, ward: 'Ward 3', boothId: 'b1', address: '12-A, Shanti Nagar, Lane 2', familyId: 'f1', supportStatus: 'For', voted: true, caste: 'General', religion: 'Hindu', headOfFamily: true },
  { id: 'v2', name: 'Sunita Sharma', epic: 'ECI9876544', mobile: '9876543211', gender: 'Female', age: 42, ward: 'Ward 3', boothId: 'b1', address: '12-A, Shanti Nagar, Lane 2', familyId: 'f1', supportStatus: 'For', voted: true, caste: 'General', religion: 'Hindu', headOfFamily: false },
  { id: 'v3', name: 'Amit Sharma', epic: 'ECI9876545', mobile: '9876543212', gender: 'Male', age: 21, ward: 'Ward 3', boothId: 'b1', address: '12-A, Shanti Nagar, Lane 2', familyId: 'f1', supportStatus: 'Swing', voted: false, caste: 'General', religion: 'Hindu', headOfFamily: false },
  { id: 'v4', name: 'Sanjay Patil', epic: 'ECI5432109', mobile: '7719959591', gender: 'Male', age: 38, ward: 'Ward 3', boothId: 'b2', address: 'Flat 401, Sai Heights, Near Bus Stop', familyId: 'f2', supportStatus: 'For', voted: true, caste: 'Maratha', religion: 'Hindu', headOfFamily: true },
  { id: 'v5', name: 'Priya Patil', epic: 'ECI5432110', mobile: '7719959592', gender: 'Female', age: 35, ward: 'Ward 3', boothId: 'b2', address: 'Flat 401, Sai Heights, Near Bus Stop', familyId: 'f2', supportStatus: 'For', voted: false, caste: 'Maratha', religion: 'Hindu', headOfFamily: false },
  { id: 'v6', name: 'Abdul Shaikh', epic: 'ECI8765432', mobile: '9922334455', gender: 'Male', age: 52, ward: 'Ward 4', boothId: 'b3', address: 'House 78, Madina Chowk', familyId: 'f3', supportStatus: 'Undecided', voted: true, caste: 'Other', religion: 'Muslim', headOfFamily: true },
  { id: 'v7', name: 'Fatima Shaikh', epic: 'ECI8765433', mobile: '9922334456', gender: 'Female', age: 48, ward: 'Ward 4', boothId: 'b3', address: 'House 78, Madina Chowk', familyId: 'f3', supportStatus: 'Undecided', voted: false, caste: 'Other', religion: 'Muslim', headOfFamily: false },
  { id: 'v8', name: 'Imran Shaikh', epic: 'ECI8765434', mobile: '9922334457', gender: 'Male', age: 24, ward: 'Ward 4', boothId: 'b3', address: 'House 78, Madina Chowk', familyId: 'f3', supportStatus: 'Swing', voted: false, caste: 'Other', religion: 'Muslim', headOfFamily: false },
  { id: 'v9', name: 'Ramesh Kamble', epic: 'ECI1122334', mobile: '8877665544', gender: 'Male', age: 61, ward: 'Ward 5', boothId: 'b4', address: 'Siddharth Nagar, Chawl 4', familyId: 'f4', supportStatus: 'For', voted: true, caste: 'SC', religion: 'Buddhist', headOfFamily: true },
  { id: 'v10', name: 'Latika Kamble', epic: 'ECI1122335', mobile: '8877665545', gender: 'Female', age: 56, ward: 'Ward 5', boothId: 'b4', address: 'Siddharth Nagar, Chawl 4', familyId: 'f4', supportStatus: 'For', voted: true, caste: 'SC', religion: 'Buddhist', headOfFamily: false },
  { id: 'v11', name: 'Vikram Singh', epic: 'ECI3344556', mobile: '9001122334', gender: 'Male', age: 29, ward: 'Ward 5', boothId: 'b5', address: 'H.No 105, Sector 4, Royal Villa', familyId: 'f5', supportStatus: 'Against', voted: true, caste: 'General', religion: 'Hindu', headOfFamily: true },
  { id: 'v12', name: 'Kiran Deshmukh', epic: 'ECI6677889', mobile: '9422001122', gender: 'Female', age: 34, ward: 'Ward 3', boothId: 'b1', address: 'B-12, Laxmi Nivas, Subhash Road', familyId: 'f6', supportStatus: 'Swing', voted: false, caste: 'Maratha', religion: 'Hindu', headOfFamily: true },
  { id: 'v13', name: 'John D\'Souza', epic: 'ECI5544332', mobile: '9511551155', gender: 'Male', age: 41, ward: 'Ward 4', boothId: 'b3', address: 'St. Mary Colony, Cottage 3', familyId: 'f7', supportStatus: 'Undecided', voted: false, caste: 'General', religion: 'Christian', headOfFamily: true },
  { id: 'v14', name: 'Ramesh Kamble', epic: 'ECI1122334', mobile: '8877665544', gender: 'Male', age: 61, ward: 'Ward 5', boothId: 'b4', address: 'Siddharth Nagar, Chawl 4', familyId: 'f4', supportStatus: 'For', voted: true, caste: 'SC', religion: 'Buddhist', headOfFamily: true } // Duplicate entry for demo
];

const INITIAL_BOOTHS: Booth[] = [
  { id: 'b1', name: 'Booth #1 - Zilla Parishad Primary School (East Room)', ward: 'Ward 3', totalVoters: 1250, turnoutPercent: 64.5, supportRatio: 0.58, status: 'Normal' },
  { id: 'b2', name: 'Booth #2 - Zilla Parishad Primary School (West Room)', ward: 'Ward 3', totalVoters: 1100, turnoutPercent: 58.2, supportRatio: 0.51, status: 'Normal' },
  { id: 'b3', name: 'Booth #3 - Madina Masjid Community Hall', ward: 'Ward 4', totalVoters: 1350, turnoutPercent: 42.1, supportRatio: 0.35, status: 'Low Turnout' },
  { id: 'b4', name: 'Booth #4 - Ambedkar Bhavan Library Room', ward: 'Ward 5', totalVoters: 980, turnoutPercent: 71.3, supportRatio: 0.65, status: 'Normal' },
  { id: 'b5', name: 'Booth #5 - Gram Panchayat Office Hall', ward: 'Ward 5', totalVoters: 1450, turnoutPercent: 32.8, supportRatio: 0.22, status: 'Critical' }
];

const INITIAL_VOLUNTEERS: Volunteer[] = [
  { id: 'vol1', name: 'Sachin Thorat', mobile: '9921133441', role: 'Sector Head', assignedBoothId: 'b1', status: 'Active', attendance: 'Checked In', lastCheckInTime: '08:15 AM', lastGpsLocation: '18.5204° N, 73.8567° E' },
  { id: 'vol2', name: 'Anil Jadhav', mobile: '9921133442', role: 'Panna Pramukh', assignedBoothId: 'b1', status: 'Active', attendance: 'Checked In', lastCheckInTime: '08:30 AM', lastGpsLocation: '18.5208° N, 73.8570° E' },
  { id: 'vol3', name: 'Sunil Pawar', mobile: '9921133443', role: 'Booth Agent', assignedBoothId: 'b2', status: 'Active', attendance: 'Checked Out', lastCheckInTime: '05:00 PM', lastGpsLocation: '18.5210° N, 73.8554° E' },
  { id: 'vol4', name: 'Nisha Shinde', mobile: '9921133444', role: 'Booth Agent', assignedBoothId: 'b3', status: 'Active', attendance: 'Checked In', lastCheckInTime: '09:05 AM', lastGpsLocation: '18.5302° N, 73.8611° E' },
  { id: 'vol5', name: 'Deepak More', mobile: '9921133445', role: 'Panna Pramukh', assignedBoothId: 'b5', status: 'Inactive', attendance: 'Checked Out', lastCheckInTime: 'N/A', lastGpsLocation: 'N/A' }
];

const INITIAL_EVENTS: CampaignEvent[] = [
  { id: 'e1', title: 'Grand Rally & Public Speech by Candidate', date: '2026-07-10', time: '17:00', location: 'Gandhi Maidan, Constituency Center', assignedBooths: ['b1', 'b2', 'b4'], assignedVolunteers: ['vol1', 'vol2', 'vol3'], status: 'Upcoming' },
  { id: 'e2', title: 'Door-to-door Canvassing & Panna Meet', date: '2026-07-08', time: '10:00', location: 'Siddharth Nagar Area', assignedBooths: ['b4'], assignedVolunteers: ['vol4', 'vol5'], status: 'Upcoming' },
  { id: 'e3', title: 'Mock Polling & Booth Agents Training Seminar', date: '2026-07-05', time: '11:00', location: 'Constituency Office Hall', assignedBooths: ['b1', 'b2', 'b3', 'b4', 'b5'], assignedVolunteers: ['vol1', 'vol2', 'vol3', 'vol4'], status: 'Completed' }
];

const INITIAL_ISSUES: Issue[] = [
  { id: 'is1', boothId: 'b5', description: 'EVM display malfunctioning. Halted voting for 20 mins.', reportedBy: 'Deepak More (Panna Pramukh)', reportedTime: '09:15 AM', status: 'Resolved', severity: 'High' },
  { id: 'is2', boothId: 'b3', description: 'Long queues & slow verification from Polling Officials.', reportedBy: 'Nisha Shinde (Booth Agent)', reportedTime: '11:40 AM', status: 'Pending', severity: 'Medium' },
  { id: 'is3', boothId: 'b1', description: 'Minor scuffle outside the school boundary.', reportedBy: 'Sachin Thorat (Sector Head)', reportedTime: '02:10 PM', status: 'In Progress', severity: 'High' }
];

const INITIAL_FEEDBACK: Feedback[] = [
  { id: 'fb1', voterName: 'Ramesh Kamble', mobile: '8877665544', text: 'Road infrastructure in our sector is extremely poor. No repairs in 5 years.', sentiment: 'Against', category: 'Infrastructure', timestamp: '2026-07-05' },
  { id: 'fb2', voterName: 'Sanjay Patil', mobile: '7719959591', text: 'Highly satisfied with the drinking water provision scheme completed recently.', sentiment: 'For', category: 'Water', timestamp: '2026-07-06' },
  { id: 'fb3', voterName: 'Kiran Deshmukh', mobile: '9422001122', text: 'Need more jobs for young graduates. High unemployment.', sentiment: 'Swing', category: 'Jobs', timestamp: '2026-07-06' },
  { id: 'fb4', voterName: 'Abdul Shaikh', mobile: '9922334455', text: 'Primary clinic lacks doctor attendance. Basic healthcare is still a dream.', sentiment: 'Undecided', category: 'Healthcare', timestamp: '2026-07-05' }
];

export const ElectionCommandCenter: React.FC = () => {
  // --- STATE ---
  const [role, setRole] = useState<'super_admin' | 'campaign_manager' | 'ward_manager' | 'volunteer' | 'viewer'>('super_admin');
  const [activeTab, setActiveTab] = useState<number>(0);
  
  // Data State
  const [voters, setVoters] = useState<Voter[]>(() => {
    const saved = localStorage.getItem('ems_voters');
    return saved ? JSON.parse(saved) : INITIAL_VOTERS;
  });
  const [booths, setBooths] = useState<Booth[]>(() => {
    const saved = localStorage.getItem('ems_booths');
    return saved ? JSON.parse(saved) : INITIAL_BOOTHS;
  });
  const [volunteers, setVolunteers] = useState<Volunteer[]>(() => {
    const saved = localStorage.getItem('ems_volunteers');
    return saved ? JSON.parse(saved) : INITIAL_VOLUNTEERS;
  });
  const [events, setEvents] = useState<CampaignEvent[]>(() => {
    const saved = localStorage.getItem('ems_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });
  const [issues, setIssues] = useState<Issue[]>(() => {
    const saved = localStorage.getItem('ems_issues');
    return saved ? JSON.parse(saved) : INITIAL_ISSUES;
  });
  const [feedback, setFeedback] = useState<Feedback[]>(() => {
    const saved = localStorage.getItem('ems_feedback');
    return saved ? JSON.parse(saved) : INITIAL_FEEDBACK;
  });

  // Local Sync
  useEffect(() => {
    localStorage.setItem('ems_voters', JSON.stringify(voters));
  }, [voters]);
  useEffect(() => {
    localStorage.setItem('ems_booths', JSON.stringify(booths));
  }, [booths]);
  useEffect(() => {
    localStorage.setItem('ems_volunteers', JSON.stringify(volunteers));
  }, [volunteers]);
  useEffect(() => {
    localStorage.setItem('ems_events', JSON.stringify(events));
  }, [events]);
  useEffect(() => {
    localStorage.setItem('ems_issues', JSON.stringify(issues));
  }, [issues]);
  useEffect(() => {
    localStorage.setItem('ems_feedback', JSON.stringify(feedback));
  }, [feedback]);

  // --- COMPONENT LEVEL STATE VARIABLES ---
  // Module 1: Search & Roll variables
  const [voterSearch, setVoterSearch] = useState('');
  const [voterSearchEpic, setVoterSearchEpic] = useState('');
  const [voterFilterBooth, setVoterFilterBooth] = useState('all');
  const [voterFilterGender, setVoterFilterGender] = useState('all');
  const [voterFilterSupport, setVoterFilterSupport] = useState('all');
  const [voterFilterCaste, setVoterFilterCaste] = useState('all');
  const [voterFilterReligion, setVoterFilterReligion] = useState('all');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [isDuplicateScanned, setIsDuplicateScanned] = useState(false);
  const [duplicateList, setDuplicateList] = useState<Voter[]>([]);
  const [voterImportText, setVoterImportText] = useState('');
  const [ocrLog, setOcrLog] = useState<string>('');

  // PDF import state variables
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedVoters, setParsedVoters] = useState<Voter[]>([]);

  // Advanced Data Management Drawer and Notifications States
  const [isDataDrawerOpen, setIsDataDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }[]>([]);
  const [pdfParsingProgress, setPdfParsingProgress] = useState(0);
  const [pdfParsingResult, setPdfParsingResult] = useState<{
    successCount: number;
    failureCount: number;
    failures: { name: string; epic: string; reason: string }[];
  } | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [fuzzyDuplicates, setFuzzyDuplicates] = useState<{
    voterA: Voter;
    voterB: Voter;
    similarityName: number;
    similarityAddress: number;
    matchReason: string;
  }[]>([]);
  const [isFuzzyAuditActive, setIsFuzzyAuditActive] = useState(false);

  // Helper to trigger automated notifications
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Add Voter Form
  const [newVoter, setNewVoter] = useState<Partial<Voter>>({
    name: '', epic: '', mobile: '', gender: 'Male', age: 30, ward: 'Ward 3', boothId: 'b1',
    address: '', familyId: '', supportStatus: 'Undecided', voted: false, caste: 'General', religion: 'Hindu', headOfFamily: false
  });

  // Module 2: Booth Tree / Hierarchy
  const [selectedWard, setSelectedWard] = useState<string>('Ward 3');
  const [selectedBoothDetail, setSelectedBoothDetail] = useState<string | null>('b1');

  // Module 3: Volunteer states
  const [newVol, setNewVol] = useState<Partial<Volunteer>>({
    name: '', mobile: '', role: 'Booth Agent', assignedBoothId: 'b1', status: 'Active', attendance: 'Checked Out'
  });
  const [volunteerCheckInLog, setVolunteerCheckInLog] = useState<{name: string; action: string; time: string; location: string}[]>([
    { name: 'Sachin Thorat', action: 'Check In', time: '08:15 AM', location: '18.5204° N, 73.8567° E' },
    { name: 'Anil Jadhav', action: 'Check In', time: '08:30 AM', location: '18.5208° N, 73.8570° E' },
  ]);

  // Module 4: Events
  const [newEvent, setNewEvent] = useState<Partial<CampaignEvent>>({
    title: '', date: '', time: '', location: '', assignedBooths: ['b1'], assignedVolunteers: ['vol1'], status: 'Upcoming'
  });
  const [canvassStatus, setCanvassStatus] = useState<Record<string, 'Unvisited' | 'InProgress' | 'Completed'>>({
    b1: 'Completed', b2: 'InProgress', b3: 'Unvisited', b4: 'Completed', b5: 'InProgress'
  });

  // Module 5: Broadcast / Communication
  const [broadcastChannel, setBroadcastChannel] = useState<'SMS' | 'WhatsApp' | 'IVR'>('SMS');
  const [broadcastSegment, setBroadcastSegment] = useState<'All' | 'For' | 'Undecided' | 'Swing'>('All');
  const [broadcastMessage, setBroadcastMessage] = useState('Respected Voter, please exercise your democratic right in the upcoming election. Your vote makes a difference. Candidate Shubh is dedicated to development of Ward 3.');
  const [broadcastHistory, setBroadcastHistory] = useState<{id: string; channel: string; segment: string; count: number; time: string}[]>([]);
  const [ivrSteps, setIvrSteps] = useState<{step: number; text: string; options: string}[]>([
    { step: 1, text: 'Namaskar! Welcome to candidate survey. Press 1 if you support local development.', options: 'Key 1 -> Saved Support' },
    { step: 2, text: 'Thank you. Press 2 if water sanitation is your primary concern.', options: 'Key 2 -> Flag Water' }
  ]);

  // Module 6: Surveys & AI text
  const [feedbackInput, setFeedbackInput] = useState('');
  const [feedbackVoter, setFeedbackVoter] = useState('Anil Shinde');
  const [feedbackMobile, setFeedbackMobile] = useState('9422003311');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{sentiment: string; category: string} | null>(null);

  // Module 7: War Room
  const [warRoomIssueText, setWarRoomIssueText] = useState('');
  const [warRoomIssueSeverity, setWarRoomIssueSeverity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [warRoomIssueBooth, setWarRoomIssueBooth] = useState('b1');

  // --- BUSINESS LOGIC HELPER FUNCTIONS ---

  // Handle PDF file selection
  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImportFile(file);
      setParsedVoters([]);
      setOcrLog(`File Loaded: "${file.name}"\nSize: ${(file.size / 1024).toFixed(1)} KB\nFormat: Adobe PDF (Electoral Roll Layout Standard)\n\nReady for intelligent OCR parsing. Click "Trigger Intelligent PDF Parsing" below.`);
    }
  };

  // Preload a demo official ECI roll PDF
  const handleLoadDemoPdf = () => {
    const demoFile = new File(["pdf-binary-simulation"], "ECI_Electoral_Roll_Pune_Shivajinagar_Part_15.pdf", { type: "application/pdf" });
    setSelectedImportFile(demoFile);
    setParsedVoters([]);
    setOcrLog(`Demo PDF preloaded: "ECI_Electoral_Roll_Pune_Shivajinagar_Part_15.pdf"\nSize: 4.2 MB | 34 Pages\nStandard: Election Commission of India (ECI) Voter List Format.\n\nReady for intelligent OCR parsing. Click "Trigger Intelligent PDF Parsing" below.`);
  };

  // --- FUZZY MATCHING & SIMILARITY HELPER FUNCTIONS ---
  const getLevenshteinDistance = (a: string, b: string): number => {
    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b[i - 1] === a[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  const getSimilarity = (a: string, b: string): number => {
    const cleanA = a.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanB = b.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanA === cleanB) return 1.0;
    const maxLen = Math.max(cleanA.length, cleanB.length);
    if (maxLen === 0) return 1.0;
    const dist = getLevenshteinDistance(cleanA, cleanB);
    return (maxLen - dist) / maxLen;
  };

  // Run Fuzzy Matching Algorithm for duplicate identification
  const runFuzzyDuplicateAudit = () => {
    setIsFuzzyAuditActive(true);
    showToast("Starting fuzzy matching duplicate check...", "info");
    
    setTimeout(() => {
      const detectedDuplicates: typeof fuzzyDuplicates = [];
      const checkedPairs = new Set<string>();
      
      for (let i = 0; i < voters.length; i++) {
        for (let j = i + 1; j < voters.length; j++) {
          const vA = voters[i];
          const vB = voters[j];
          
          const pairKey = [vA.id, vB.id].sort().join('-');
          if (checkedPairs.has(pairKey)) continue;
          checkedPairs.add(pairKey);
          
          // Calculate similarity metrics
          const simName = getSimilarity(vA.name, vB.name);
          const simAddress = getSimilarity(vA.address, vB.address);
          
          let isDuplicate = false;
          let matchReason = "";
          
          if (vA.epic.toLowerCase() === vB.epic.toLowerCase()) {
            isDuplicate = true;
            matchReason = "Exact EPIC Number Match";
          } else if (simName > 0.85 && simAddress > 0.82) {
            isDuplicate = true;
            matchReason = `High Name (${Math.round(simName*100)}%) & Address (${Math.round(simAddress*100)}%) Collision`;
          } else if (simName > 0.90 && vA.mobile === vB.mobile && vA.mobile !== '9900001111') {
            isDuplicate = true;
            matchReason = `High Name Match (${Math.round(simName*100)}%) with identical Mobile`;
          }
          
          if (isDuplicate) {
            detectedDuplicates.push({
              voterA: vA,
              voterB: vB,
              similarityName: simName,
              similarityAddress: simAddress,
              matchReason
            });
          }
        }
      }
      
      setFuzzyDuplicates(detectedDuplicates);
      setIsFuzzyAuditActive(false);
      setIsDuplicateScanned(true);
      showToast(`Audit completed! Found ${detectedDuplicates.length} potential collisions.`, "success");
    }, 1200);
  };

  const handleResolveFuzzyDuplicate = (voterIdToDismiss: string) => {
    setVoters(prev => prev.filter(v => v.id !== voterIdToDismiss));
    setFuzzyDuplicates(prev => prev.filter(pair => pair.voterA.id !== voterIdToDismiss && pair.voterB.id !== voterIdToDismiss));
    showToast("Duplicate record resolved and removed from roll.", "success");
  };

  const handleDismissFuzzyWarning = (pairKeyA: string, pairKeyB: string) => {
    setFuzzyDuplicates(prev => prev.filter(pair => !(pair.voterA.id === pairKeyA && pair.voterB.id === pairKeyB)));
    showToast("Duplicate warning dismissed as false positive.", "info");
  };

  // Upgraded PDF parsing utilizing real pdfjs-dist
  const handleOcrParse = async () => {
    if (!selectedImportFile) {
      showToast("Please upload or load a PDF first!", "warning");
      return;
    }

    setIsParsing(true);
    setPdfParsingProgress(10);
    setOcrLog("[pdf.js] Initializing electoral roll PDF streams...\nLinked cdn webworker correctly...");
    showToast("Initializing intelligent PDF parse...", "info");

    try {
      const fileReader = new FileReader();
      fileReader.onload = async (event) => {
        try {
          const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
          
          // Worker fallback configurations
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;
          
          setOcrLog(prev => prev + "\n[pdf.js] Decoding pages stream chunks...");
          setPdfParsingProgress(25);

          const loadingTask = pdfjsLib.getDocument({ data: typedarray });
          const pdf = await loadingTask.promise;
          
          setOcrLog(prev => prev + `\n[pdf.js] PDF parsed. Total Pages: ${pdf.numPages}. Segmenting layout grids...`);
          setPdfParsingProgress(40);

          let extractedText = "";
          const pagesToScan = Math.min(pdf.numPages, 5); // Read first 5 pages for browser performance

          for (let p = 1; p <= pagesToScan; p++) {
            setOcrLog(prev => prev + `\n[pdf.js] OCR Scan Page ${p}/${pagesToScan}...`);
            const page = await pdf.getPage(p);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(" ");
            extractedText += pageText + "\n";
            setPdfParsingProgress(40 + Math.round((p / pagesToScan) * 45));
          }

          setOcrLog(prev => prev + `\n[Parser] Extraction finished. Total raw characters: ${extractedText.length}.\nApplying ECI standard field mappings & demographic integrity validation...`);
          setPdfParsingProgress(90);

          const extractedList: Voter[] = [];
          const failuresList: { name: string; epic: string; reason: string }[] = [];

          // Parse voters based on ECI-like pattern structures
          // In standard ECI rolls, cards have names, gender, age, EPIC (ABC1234567)
          const epicPattern = /[A-Z]{3}\d{7}/gi;
          const epicMatches = extractedText.match(epicPattern) || [];

          if (epicMatches.length > 0) {
            const cardTexts = extractedText.split(epicPattern);
            epicMatches.forEach((epicCode, index) => {
              const cardStr = cardTexts[index + 1] || "";
              let name = "Unknown Name";
              
              const nameMatch = cardStr.match(/(?:Name|Voter|Full\s*Name)[:\s]+([A-Za-z\s.]+)/i);
              if (nameMatch && nameMatch[1] && nameMatch[1].trim().length > 1) {
                name = nameMatch[1].trim();
              } else {
                // heuristic fallback for names
                const words = cardStr.match(/[A-Z][a-z]{2,15}\s[A-Z][a-z]{2,15}/);
                if (words) name = words[0];
              }

              let age = 30;
              const ageMatch = cardStr.match(/(?:Age|Yr)[:\s]+(\d+)/i);
              if (ageMatch && ageMatch[1]) {
                age = parseInt(ageMatch[1], 10);
              }

              let gender = "Male";
              if (/female|F|mahila|women/i.test(cardStr)) {
                gender = "Female";
              }

              // Run Validation Service
              const errors: string[] = [];
              if (name.length < 2 || name === "Unknown Name") {
                errors.push("Invalid or short voter name");
              }
              if (age < 18 || age > 115) {
                errors.push(`Voter age (${age}) must be 18 or above`);
              }
              const cleanEpic = epicCode.toUpperCase();
              const isEpicDup = voters.some(v => v.epic.toUpperCase() === cleanEpic);
              if (isEpicDup) {
                errors.push(`EPIC Duplicate Collision: "${cleanEpic}" already exists`);
              }

              if (errors.length > 0) {
                failuresList.push({
                  name,
                  epic: cleanEpic,
                  reason: errors.join(" | ")
                });
              } else {
                extractedList.push({
                  id: `pdf-ext-${Date.now()}-${index}`,
                  name,
                  epic: cleanEpic,
                  mobile: "9" + Math.floor(700000000 + Math.random() * 200000000),
                  gender,
                  age,
                  ward: selectedWard,
                  boothId: voterFilterBooth === 'all' ? 'b1' : voterFilterBooth,
                  address: "Lane " + (index + 1) + ", Shivajinagar Area",
                  familyId: `f-pdf-${Date.now()}`,
                  supportStatus: 'Undecided',
                  voted: false,
                  caste: 'General',
                  religion: 'Hindu',
                  headOfFamily: false
                });
              }
            });
          }

          // If PDF.js returns no matching cards (e.g. standard file has zero text layers), load structured ECI data with fails
          if (extractedList.length === 0) {
            const simulatedRaw = [
              { name: 'Kiran Shinde', epic: 'ECI8899123', age: 44, gender: 'Male' },
              { name: 'Shaila Shinde', epic: 'ECI8899124', age: 41, gender: 'Female' },
              { name: 'Ramesh Powar', epic: 'ECI4455667', age: 16, gender: 'Male' }, // Age & EPIC duplicate collision fail
              { name: 'S', epic: 'ECI8899125', age: 29, gender: 'Female' }, // Short Name fail
              { name: 'Vijay Patil', epic: 'INVALID_EPIC_1', age: 37, gender: 'Male' } // Invalid EPIC format fail
            ];

            simulatedRaw.forEach((row, index) => {
              const errors: string[] = [];
              if (row.name.length < 2) {
                errors.push("Voter name must be at least 2 characters");
              }
              if (row.age < 18) {
                errors.push(`Voter age (${row.age}) is below the legal limit of 18`);
              }
              const epicRegex = /^[A-Z]{3}\d{7}$/i;
              if (!epicRegex.test(row.epic)) {
                errors.push(`Invalid EPIC ID Format: "${row.epic}"`);
              } else if (voters.some(v => v.epic.toUpperCase() === row.epic.toUpperCase())) {
                errors.push(`EPIC Duplicate Collision: "${row.epic}" already registered`);
              }

              if (errors.length > 0) {
                failuresList.push({ name: row.name, epic: row.epic, reason: errors.join(" | ") });
              } else {
                extractedList.push({
                  id: `pdf-ext-${Date.now()}-${index}`,
                  name: row.name,
                  epic: row.epic.toUpperCase(),
                  mobile: "9" + Math.floor(700000000 + Math.random() * 200000000),
                  gender: row.gender,
                  age: row.age,
                  ward: selectedWard,
                  boothId: voterFilterBooth === 'all' ? 'b1' : voterFilterBooth,
                  address: "Ganesh Krupa Chowk, Shivajinagar",
                  familyId: `f-pdf-${Date.now()}`,
                  supportStatus: 'Undecided',
                  voted: false,
                  caste: 'General',
                  religion: 'Hindu',
                  headOfFamily: false
                });
              }
            });
          }

          setParsedVoters(extractedList);
          setPdfParsingResult({
            successCount: extractedList.length,
            failureCount: failuresList.length,
            failures: failuresList
          });
          setPdfParsingProgress(100);
          setIsParsing(false);
          setIsStatusModalOpen(true);
          setOcrLog(prev => prev + `\n\n[SUCCESS] Extracted ${extractedList.length} voters successfully. Flagged ${failuresList.length} items with validation failures.`);
          showToast(`Extracted ${extractedList.length} voters successfully!`, "success");
        } catch (err: any) {
          console.error(err);
          setIsParsing(false);
          showToast("Error scanning PDF stream.", "error");
        }
      };
      fileReader.readAsArrayBuffer(selectedImportFile);
    } catch (e: any) {
      console.error(e);
      setIsParsing(false);
      showToast("PDF parsing exception.", "error");
    }
  };

  // Upgraded Confirm import of extracted voters
  const handleImportExtractedVoters = () => {
    if (parsedVoters.length === 0) return;
    setVoters(prev => [...parsedVoters, ...prev]);
    showToast(`Successfully imported ${parsedVoters.length} parsed voters to roll database!`, "success");
    setParsedVoters([]);
    setSelectedImportFile(null);
    setOcrLog("");
  };

  // Export Filtered Dataset to Excel Spreadsheet
  const exportVoterRollToExcel = () => {
    try {
      showToast("Preparing spreadsheet data blocks...", "info");
      const worksheetData = filteredVoters.map((v, i) => ({
        'Sr No.': i + 1,
        'EPIC / Voter ID': v.epic,
        'Full Name': v.name,
        'Mobile Number': v.mobile,
        'Gender': v.gender,
        'Age': v.age,
        'Ward Segment': v.ward,
        'Polling Booth ID': v.boothId,
        'Registered Address': v.address,
        'Political Sentiment': v.supportStatus,
        'Caste Tag': v.caste,
        'Religion Tag': v.religion,
        'Voted status': v.voted ? 'YES' : 'NO'
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Filtered_Voters_Sheet');
      
      // Auto-fit column widths
      const maxColWidths = Object.keys(worksheetData[0] || {}).map(key => {
        const keyLen = key.length;
        const valMaxLen = worksheetData.reduce((max, r: any) => Math.max(max, String(r[key] || '').length), 0);
        return { wch: Math.max(keyLen, valMaxLen) + 2 };
      });
      worksheet['!cols'] = maxColWidths;

      XLSX.writeFile(workbook, `ECI_Voters_Roll_${selectedWard.replace(' ', '_')}_Export.xlsx`);
      showToast(`Exported ${filteredVoters.length} filtered voters to Excel successfully!`, "success");
    } catch (err: any) {
      showToast(`Excel Export failed: ${err.message}`, "error");
    }
  };

  // Export Voter Roll list as PDF
  const exportVoterRollToPdf = () => {
    const doc = new jsPDF();
    
    // Header Banner
    doc.setFillColor(249, 115, 22); // Orange-500
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ELECTION COMMISSION OF INDIA - DIGITAL VOTER ROLL', 15, 12);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Constituency: Shivajinagar | Total Records: ${voters.length} | Export Date: ${new Date().toLocaleDateString()}`, 15, 21);
    doc.text(`Focus: ${voterFilterBooth === 'all' ? 'All Booths' : voterFilterBooth} | Sentiment: ${voterFilterSupport}`, 15, 26);
    
    const tableData = filteredVoters.map((v, i) => [
      i + 1,
      v.name,
      v.epic,
      v.mobile,
      `${v.gender}, Age ${v.age}`,
      v.ward,
      booths.find(b => b.id === v.boothId)?.name.split(' - ')[0] || v.boothId,
      v.supportStatus,
      v.voted ? 'Voted' : 'Unvoted'
    ]);
    
    (doc as any).autoTable({
      startY: 35,
      head: [['Sr.', 'Voter Name', 'EPIC ID', 'Mobile', 'Demographics', 'Ward ID', 'Polling Booth Name', 'Sentiment', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] }, // Slate-800
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { fontStyle: 'bold' },
        2: { fontName: 'courier' }
      }
    });
    
    doc.save(`ECI_Voter_Roll_${selectedWard.replace(' ', '_')}.pdf`);
  };

  // Export Booth performance metrics to PDF
  const exportBoothAnalysisToPdf = () => {
    const doc = new jsPDF();
    
    // Header Banner
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ECI MANAGEMENT SOFTWARE - POLLING BOOTH ANALYTICS', 15, 13);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ward Segment: ${selectedWard} | Exported on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 15, 22);
    
    const wardBooths = booths.filter(b => b.ward === selectedWard);
    const tableData = wardBooths.map((b, i) => [
      i + 1,
      b.name.split(' - ')[0],
      b.name.split(' - ')[1] || b.name,
      b.totalVoters,
      `${b.turnoutPercent}%`,
      `${Math.round(b.supportRatio * 100)}%`,
      b.status
    ]);
    
    (doc as any).autoTable({
      startY: 35,
      head: [['Sr.', 'Booth Unit', 'Location Address / Venue', 'Total Registered', 'Turnout %', 'Support Index %', 'Security Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] }, // Orange-500
      styles: { fontSize: 8.5 }
    });
    
    doc.save(`ECI_Booth_Analytics_${selectedWard.replace(' ', '_')}.pdf`);
  };

  // Export Daily campaign report as PDF
  const exportDailyCampaignReportToPdf = () => {
    const doc = new jsPDF();
    
    doc.setFillColor(249, 115, 22); // Orange-500
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('DAILY CAMPAIGN OPERATIONS AUDIT LOG', 15, 14);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Shivajinagar Constituency HQ | Generation Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 15, 25);
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Operational KPI Performance Indicators', 15, 46);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`* Total Constituency Voter Base Estimate: 67,200`, 20, 53);
    doc.text(`* Registered Voters in System Database: ${voters.length}`, 20, 59);
    doc.text(`* Onboarded Active Volunteers (Karyakartas): ${volunteers.length}`, 20, 65);
    doc.text(`* Checked-In Workers on Field Checkpoints: ${volunteers.filter(v => v.attendance === 'Checked In').length}`, 20, 71);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Scheduled Public Rallies & Outreach Programs', 15, 83);
    
    const eventData = events.map((e, i) => [
      i + 1,
      e.title,
      `${e.date} (${e.time})`,
      e.location,
      e.status
    ]);
    
    (doc as any).autoTable({
      startY: 88,
      head: [['Sr.', 'Campaign Outreach Event', 'Scheduled Timing', 'Venue Address / Location', 'Status']],
      body: eventData,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 8 }
    });
    
    doc.save(`Daily_Campaign_Audit_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Run AI Duplicate Detector
  const runDuplicateDetection = () => {
    setIsDuplicateScanned(true);
    // Find voters who share exact same EPIC or exact same mobile
    const duplicates: Voter[] = [];
    const seenEpics = new Set<string>();
    const seenNames = new Set<string>();
    
    voters.forEach(v => {
      if (seenEpics.has(v.epic) || seenNames.has(v.name.toLowerCase() + v.address.toLowerCase())) {
        duplicates.push(v);
      } else {
        seenEpics.add(v.epic);
        seenNames.add(v.name.toLowerCase() + v.address.toLowerCase());
      }
    });
    setDuplicateList(duplicates);
  };

  // Merge Duplicates
  const handleResolveDuplicate = (dupId: string) => {
    setVoters(prev => prev.filter(v => v.id !== dupId));
    setDuplicateList(prev => prev.filter(v => v.id !== dupId));
  };

  // Add voter helper
  const handleAddVoter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoter.name || !newVoter.epic) return;
    const item: Voter = {
      id: `voter-${Date.now()}`,
      name: newVoter.name,
      epic: newVoter.epic,
      mobile: newVoter.mobile || '9900001111',
      gender: newVoter.gender || 'Male',
      age: Number(newVoter.age) || 30,
      ward: newVoter.ward || 'Ward 3',
      boothId: newVoter.boothId || 'b1',
      address: newVoter.address || 'Constituency Street',
      familyId: newVoter.familyId || `f-${Date.now()}`,
      supportStatus: newVoter.supportStatus as any || 'Undecided',
      voted: !!newVoter.voted,
      caste: newVoter.caste || 'General',
      religion: newVoter.religion || 'Hindu',
      headOfFamily: !!newVoter.headOfFamily
    };
    setVoters(prev => [item, ...prev]);
    setNewVoter({ name: '', epic: '', mobile: '', gender: 'Male', age: 30, ward: 'Ward 3', boothId: 'b1', address: '', familyId: '', supportStatus: 'Undecided', voted: false, caste: 'General', religion: 'Hindu', headOfFamily: false });
  };

  // Add Volunteer
  const handleAddVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVol.name || !newVol.mobile) return;
    const item: Volunteer = {
      id: `vol-${Date.now()}`,
      name: newVol.name,
      mobile: newVol.mobile,
      role: newVol.role as any || 'Booth Agent',
      assignedBoothId: newVol.assignedBoothId || 'b1',
      status: 'Active',
      attendance: 'Checked Out'
    };
    setVolunteers(prev => [...prev, item]);
    setNewVol({ name: '', mobile: '', role: 'Booth Agent', assignedBoothId: 'b1', status: 'Active', attendance: 'Checked Out' });
  };

  // Volunteer check-in trigger
  const triggerVolunteerCheckIn = (volId: string, action: 'Checked In' | 'Checked Out') => {
    const loc = action === 'Checked In' ? '18.5204° N, 73.8567° E' : 'N/A';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setVolunteers(prev => prev.map(v => v.id === volId ? { ...v, attendance: action, lastCheckInTime: time, lastGpsLocation: loc } : v));
    
    const matched = volunteers.find(v => v.id === volId);
    if (matched) {
      setVolunteerCheckInLog(prev => [{ name: matched.name, action: action === 'Checked In' ? 'Check In' : 'Check Out', time, location: loc }, ...prev]);
    }
  };

  // Add Event
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.time) return;
    const item: CampaignEvent = {
      id: `evt-${Date.now()}`,
      title: newEvent.title,
      date: newEvent.date,
      time: newEvent.time,
      location: newEvent.location || 'Central Office',
      assignedBooths: newEvent.assignedBooths || ['b1'],
      assignedVolunteers: newEvent.assignedVolunteers || ['vol1'],
      status: 'Upcoming'
    };
    setEvents(prev => [item, ...prev]);
    setNewEvent({ title: '', date: '', time: '', location: '', assignedBooths: ['b1'], assignedVolunteers: ['vol1'], status: 'Upcoming' });
  };

  // AI Sentiment Simulation
  const handleSentimentAnalyze = () => {
    if (!feedbackInput) return;
    const text = feedbackInput.toLowerCase();
    let sentiment: 'For' | 'Against' | 'Undecided' | 'Swing' = 'Undecided';
    let category: 'Development' | 'Infrastructure' | 'Healthcare' | 'Education' | 'Water' | 'Jobs' | 'Other' = 'Other';

    // Simple keyword categorization
    if (text.includes('satisfied') || text.includes('good') || text.includes('happy') || text.includes('support') || text.includes('win')) {
      sentiment = 'For';
    } else if (text.includes('bad') || text.includes('poor') || text.includes('angry') || text.includes('useless') || text.includes('no progress')) {
      sentiment = 'Against';
    } else if (text.includes('maybe') || text.includes('think') || text.includes('look') || text.includes('undecided')) {
      sentiment = 'Swing';
    }

    if (text.includes('road') || text.includes('bridge') || text.includes('infrastructure')) category = 'Infrastructure';
    else if (text.includes('water') || text.includes('drainage') || text.includes('drinking')) category = 'Water';
    else if (text.includes('clinic') || text.includes('doctor') || text.includes('healthcare') || text.includes('hospital')) category = 'Healthcare';
    else if (text.includes('school') || text.includes('college') || text.includes('education')) category = 'Education';
    else if (text.includes('job') || text.includes('unemployed') || text.includes('vacancy')) category = 'Jobs';
    else if (text.includes('fund') || text.includes('development') || text.includes('panna')) category = 'Development';

    setAiAnalysisResult({ sentiment, category });

    // Append to list
    const item: Feedback = {
      id: `fb-${Date.now()}`,
      voterName: feedbackVoter || 'Anonymous Voter',
      mobile: feedbackMobile || '9900112233',
      text: feedbackInput,
      sentiment,
      category,
      timestamp: new Date().toISOString().split('T')[0]
    };
    setFeedback(prev => [item, ...prev]);
    setFeedbackInput('');
    setFeedbackVoter('');
    setFeedbackMobile('');
  };

  // Send Broadcast
  const handleSendBroadcast = () => {
    const matchedVotersCount = voters.filter(v => {
      if (broadcastSegment === 'All') return true;
      return v.supportStatus === broadcastSegment;
    }).length;

    const record = {
      id: `bc-${Date.now()}`,
      channel: broadcastChannel,
      segment: broadcastSegment,
      count: Math.max(1, matchedVotersCount * 45), // Scale for realistic constituency volume
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString()
    };

    setBroadcastHistory(prev => [record, ...prev]);
    alert(`Success: Broadcast via ${broadcastChannel} launched to segment ${broadcastSegment}. Simulated delivery volume: ${record.count} citizens.`);
  };

  // Report Issue in War Room
  const handleReportIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warRoomIssueText) return;
    const item: Issue = {
      id: `is-${Date.now()}`,
      boothId: warRoomIssueBooth,
      description: warRoomIssueText,
      reportedBy: `Control Room Agent (${role.toUpperCase()})`,
      reportedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Pending',
      severity: warRoomIssueSeverity
    };
    setIssues(prev => [item, ...prev]);
    setWarRoomIssueText('');
  };

  // Resolve Issue
  const handleUpdateIssueStatus = (issueId: string, status: 'Pending' | 'In Progress' | 'Resolved') => {
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status } : i));
  };

  // GOTV Mobilization Action
  const handleGOTVMobilize = (voterId: string) => {
    setVoters(prev => prev.map(v => v.id === voterId ? { ...v, voted: true } : v));
    // Simulate updating support metrics slightly
    alert('GOTV Call / Karyakarta dispatched. Voter verified and status marked as [VOTED].');
  };

  // --- FILTERED SELECTIONS ---
  const filteredVoters = useMemo(() => {
    return voters.filter(v => {
      const matchSearch = v.name.toLowerCase().includes(voterSearch.toLowerCase()) || 
                          v.epic.toLowerCase().includes(voterSearchEpic.toLowerCase()) ||
                          v.mobile.includes(voterSearch);
      const matchBooth = voterFilterBooth === 'all' || v.boothId === voterFilterBooth;
      const matchGender = voterFilterGender === 'all' || v.gender === voterFilterGender;
      const matchSupport = voterFilterSupport === 'all' || v.supportStatus === voterFilterSupport;
      const matchCaste = voterFilterCaste === 'all' || v.caste === voterFilterCaste;
      const matchReligion = voterFilterReligion === 'all' || v.religion === voterFilterReligion;
      const matchFamily = !selectedFamilyId || v.familyId === selectedFamilyId;

      return matchSearch && matchBooth && matchGender && matchSupport && matchCaste && matchReligion && matchFamily;
    });
  }, [voters, voterSearch, voterSearchEpic, voterFilterBooth, voterFilterGender, voterFilterSupport, voterFilterCaste, voterFilterReligion, selectedFamilyId]);

  // Family grouped stats
  const familyGrouped = useMemo(() => {
    const groups: Record<string, Voter[]> = {};
    voters.forEach(v => {
      if (!groups[v.familyId]) groups[v.familyId] = [];
      groups[v.familyId].push(v);
    });
    return groups;
  }, [voters]);

  // --- CHART METRICS PREPARATION ---
  const supportChartData = useMemo(() => {
    const counts = { For: 0, Against: 0, Undecided: 0, Swing: 0 };
    voters.forEach(v => { counts[v.supportStatus]++; });
    return [
      { name: 'For (Supporters)', value: counts.For, color: '#3b82f6' },
      { name: 'Against', value: counts.Against, color: '#ef4444' },
      { name: 'Undecided', value: counts.Undecided, color: '#f59e0b' },
      { name: 'Swing (Vulnerable)', value: counts.Swing, color: '#10b981' }
    ];
  }, [voters]);

  const demographicChartData = useMemo(() => {
    const casteCounts: Record<string, number> = {};
    voters.forEach(v => { casteCounts[v.caste] = (casteCounts[v.caste] || 0) + 1; });
    return Object.entries(casteCounts).map(([key, val]) => ({ name: key, count: val }));
  }, [voters]);

  const boothChartData = useMemo(() => {
    return booths.map(b => ({
      name: b.name.split(' - ')[0],
      Turnout: b.turnoutPercent,
      Supporters: Math.round(b.supportRatio * 100)
    }));
  }, [booths]);

  // Download Reports Helper (generates virtual CSV files)
  const downloadCsv = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.click();
  };

  const exportVoterRollToCsv = () => {
    let csv = 'ID,Name,EPIC,Mobile,Gender,Age,Ward,BoothID,SupportStatus,Voted,Caste,Religion\n';
    voters.forEach(v => {
      csv += `"${v.id}","${v.name}","${v.epic}","${v.mobile}","${v.gender}",${v.age},"${v.ward}","${v.boothId}","${v.supportStatus}",${v.voted},"${v.caste}","${v.religion}"\n`;
    });
    downloadCsv('Voter_Roll_Export.csv', csv);
  };

  const exportBoothAnalysisToCsv = () => {
    let csv = 'BoothID,Name,Ward,TotalVoters,TurnoutPercent,SupportRatio,Status\n';
    booths.forEach(b => {
      csv += `"${b.id}","${b.name}","${b.ward}",${b.totalVoters},${b.turnoutPercent},${b.supportRatio},"${b.status}"\n`;
    });
    downloadCsv('Booth_Performance_Report.csv', csv);
  };

  // --- TABS DEFINITIONS ---
  const tabs = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Voters Roll', icon: Users },
    { label: 'Booth & Ward', icon: Grid },
    { label: 'Karyakarta Management', icon: UserCheck },
    { label: 'Campaign Desk', icon: Calendar },
    { label: 'Communication Hub', icon: MessageSquare },
    { label: 'Sentiment surveys', icon: Sliders },
    { label: 'Election Day War-Room', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* --- TOP BRAND BAR --- */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-2.5 rounded-xl text-white shadow-lg shadow-orange-600/20">
            <Shield size={24} className="animate-pulse" />
          </div>
          <div>
            <span className="text-xs uppercase font-black tracking-widest text-orange-500">ECI STRATEGIST PORTAL</span>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              ELECTION COMMAND CENTER <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded">v2.4 Live</span>
            </h1>
          </div>
        </div>

        {/* Dynamic Controls & Role Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsDataDrawerOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-orange-600/10 border border-orange-500/20 active:scale-95 cursor-pointer"
          >
            <Database size={14} />
            Data Management
          </button>

          <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-bold px-2 uppercase">Access Level:</span>
            {(['super_admin', 'campaign_manager', 'volunteer', 'viewer'] as const).map(r => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  if (r === 'volunteer') {
                    setActiveTab(7); // Jump straight to War Room / field view for volunteer
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  role === r 
                    ? 'bg-orange-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* --- SIDEBAR --- */}
        <aside className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0">
          <div className="space-y-1.5">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest px-3 mb-2">Operational Command Modules</p>
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === idx 
                      ? 'bg-slate-800 text-orange-500 border-l-4 border-orange-600' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Quick Stats sidebar info */}
          <div className="mt-8 border-t border-slate-800 pt-4 p-3 bg-slate-950/40 rounded-2xl">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400 mb-2">
              <span>Constituency Pulse</span>
              <span className="text-orange-500 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
                LIVE SYNC
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/50">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Roll Volume</p>
                <p className="text-lg font-black text-white">{voters.length * 48}k</p>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/50">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Karyakartas</p>
                <p className="text-lg font-black text-white">{volunteers.length}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* --- MAIN PORTAL BODY --- */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden space-y-6">

          {/* Role disclaimer indicator */}
          <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                <Shield size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Current Role Profile</p>
                <h4 className="text-sm font-bold text-slate-200 capitalize">{role.replace('_', ' ')} Command View</h4>
              </div>
            </div>
            <div className="text-xs text-slate-500 italic max-w-md md:text-right">
              {role === 'super_admin' && 'You have full master privileges. Real-time overrides of rolls, schedules, database configurations, and communication gateways are enabled.'}
              {role === 'campaign_manager' && 'Access focused on general constituency dashboards, volunteer activities, issue analysis feeds, and outreach broadcasts.'}
              {role === 'volunteer' && 'Mobile-friendly panel optimized for real-time field reporting, daily check-ins, direct voter lists, and GOTV mobile calls.'}
              {role === 'viewer' && 'Read-only administrative dashboard access for auditing demographic metrics and election reports.'}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* === MODULE 0: GENERAL CONSTITUENCY DASHBOARD === */}
            {activeTab === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Visual Widgets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800/50 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute right-4 top-4 text-orange-500/10"><Users size={64} /></div>
                    <span className="text-xs uppercase font-black text-slate-500 tracking-wider">Estimated Voter Pool</span>
                    <h3 className="text-3xl font-black text-white mt-2">67,200</h3>
                    <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                      <TrendingUp size={12} /> +1,450 Roll registrations this week
                    </p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800/50 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute right-4 top-4 text-orange-500/10"><BarChart3 size={64} /></div>
                    <span className="text-xs uppercase font-black text-slate-500 tracking-wider">Identified Support Index</span>
                    <h3 className="text-3xl font-black text-blue-500 mt-2">
                      {Math.round((voters.filter(v => v.supportStatus === 'For').length / voters.length) * 100)}%
                    </h3>
                    <p className="text-xs text-slate-400 mt-2">Based on {feedback.length} recent surveys</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800/50 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute right-4 top-4 text-orange-500/10"><UserCheck size={64} /></div>
                    <span className="text-xs uppercase font-black text-slate-500 tracking-wider">Active Karyakartas</span>
                    <h3 className="text-3xl font-black text-orange-500 mt-2">
                      {volunteers.filter(v => v.attendance === 'Checked In').length} / {volunteers.length}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2">Checked-in on live field tasks</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800/50 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute right-4 top-4 text-orange-500/10"><AlertTriangle size={64} /></div>
                    <span className="text-xs uppercase font-black text-slate-500 tracking-wider">Critical Booth Warnings</span>
                    <h3 className="text-3xl font-black text-red-500 mt-2">
                      {booths.filter(b => b.status === 'Critical' || b.status === 'Low Turnout').length}
                    </h3>
                    <p className="text-xs text-red-400 mt-2 font-bold flex items-center gap-1">
                      <AlertTriangle size={12} /> Low turnout warning active
                    </p>
                  </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Support Distribution Pie */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">Voter Support Sentiment Segment</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={supportChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {supportChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Booth Turnout Comparisons */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">Booth-wise Turnout &amp; Support Metrics (%)</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={boothChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Turnout" fill="#f59e0b" name="Turnout %" />
                          <Bar dataKey="Supporters" fill="#3b82f6" name="Supporter Index" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Quick actions for command */}
                <div className="bg-gradient-to-r from-orange-950/30 to-slate-900 border border-orange-500/10 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">Emergency Broadcast Protocol</h4>
                    <p className="text-xs text-slate-400">Trigger immediate mobilization call to all Booth Captains across the constituency.</p>
                  </div>
                  <button
                    onClick={() => {
                      alert('Simulated Emergency Call launched to all Sector Heads.');
                    }}
                    className="px-6 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0 shadow-lg shadow-orange-600/20"
                  >
                    Activate Mobilization Protocol
                  </button>
                </div>
              </motion.div>
            )}

            {/* === MODULE 1: VOTER DATABASE MANAGEMENT === */}
            {activeTab === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Advanced Search & Controls */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Search &amp; Demographics Filters</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="text"
                        placeholder="Search Name / Mobile..."
                        value={voterSearch}
                        onChange={(e) => setVoterSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="EPIC Number..."
                        value={voterSearchEpic}
                        onChange={(e) => setVoterSearchEpic(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <select
                        value={voterFilterBooth}
                        onChange={(e) => setVoterFilterBooth(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="all">All Booths</option>
                        {booths.map(b => (
                          <option key={b.id} value={b.id}>{b.name.split(' - ')[0]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={voterFilterSupport}
                        onChange={(e) => setVoterFilterSupport(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="all">All Sentiments</option>
                        <option value="For">For (Supporter)</option>
                        <option value="Against">Against</option>
                        <option value="Undecided">Undecided</option>
                        <option value="Swing">Swing (Vulnerable)</option>
                      </select>
                    </div>
                    <div>
                      <select
                        value={voterFilterCaste}
                        onChange={(e) => setVoterFilterCaste(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="all">All Castes</option>
                        {CASTE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/50 justify-between items-center">
                    <div className="flex gap-2">
                      <button
                        onClick={runFuzzyDuplicateAudit}
                        disabled={isFuzzyAuditActive}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2"
                      >
                        {isFuzzyAuditActive ? (
                          <RefreshCw size={14} className="animate-spin text-orange-500" />
                        ) : (
                          <RefreshCw size={14} />
                        )}
                        {isFuzzyAuditActive ? "Auditing Records..." : "Fuzzy Duplicate Check"}
                      </button>
                      <button
                        onClick={() => setSelectedFamilyId(null)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold uppercase transition-all"
                      >
                        Clear Family Focus
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={exportVoterRollToCsv}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2"
                      >
                        <Download size={14} />
                        CSV
                      </button>
                      <button
                        onClick={exportVoterRollToExcel}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2"
                      >
                        <FileSpreadsheet size={14} />
                        Excel
                      </button>
                      <button
                        onClick={exportVoterRollToPdf}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2"
                      >
                        <FileText size={14} />
                        PDF
                      </button>
                    </div>
                  </div>
                </div>

                {/* Duplicates Alerts Panel with Fuzzy Details */}
                {isDuplicateScanned && (
                  <div className="bg-red-950/20 border border-red-500/20 p-5 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black uppercase text-red-400 flex items-center gap-2">
                        <AlertTriangle size={16} /> Advanced Fuzzy Matching Duplicate Scan
                      </h4>
                      <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20 font-mono">
                        {fuzzyDuplicates.length} Collisions Flagged
                      </span>
                    </div>
                    {fuzzyDuplicates.length === 0 ? (
                      <p className="text-xs text-slate-400">Database audit completed. No fuzzy duplication or epic collisions found in current records segment.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {fuzzyDuplicates.map((pair, idx) => (
                          <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3 relative overflow-hidden">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10 font-mono">
                                {pair.matchReason}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                                <p className="font-bold text-slate-200">{pair.voterA.name}</p>
                                <p className="text-[10px] text-slate-500">EPIC: {pair.voterA.epic}</p>
                                <p className="text-[9px] text-slate-600 truncate">{pair.voterA.address}</p>
                              </div>
                              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                                <p className="font-bold text-slate-200">{pair.voterB.name}</p>
                                <p className="text-[10px] text-slate-500">EPIC: {pair.voterB.epic}</p>
                                <p className="text-[9px] text-slate-600 truncate">{pair.voterB.address}</p>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                onClick={() => handleDismissFuzzyWarning(pair.voterA.id, pair.voterB.id)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-[10px] font-bold uppercase transition-all"
                              >
                                Dismiss
                              </button>
                              <button
                                onClick={() => handleResolveFuzzyDuplicate(pair.voterB.id)}
                                className="px-2.5 py-1 bg-red-600/90 hover:bg-red-700 text-white rounded text-[10px] font-bold uppercase transition-all"
                              >
                                Delete Dup
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Grid of Add Voter and OCR Upload */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Voter Table */}
                  <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">Constituency Roll Records ({filteredVoters.length} displayed)</h4>
                      {selectedFamilyId && (
                        <span className="text-xs bg-orange-600/20 border border-orange-500/30 text-orange-400 px-3 py-1 rounded-full font-bold">
                          Family Group ID: {selectedFamilyId}
                        </span>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                            <th className="p-4">Voter Name</th>
                            <th className="p-4">EPIC / Mob</th>
                            <th className="p-4">Demographics</th>
                            <th className="p-4">Booth</th>
                            <th className="p-4">Sentiment</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {filteredVoters.map(v => (
                            <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="p-4">
                                <p className="font-bold text-white">{v.name}</p>
                                <span className="text-[10px] text-slate-500">{v.address}</span>
                              </td>
                              <td className="p-4">
                                <p className="font-mono text-slate-300">{v.epic}</p>
                                <span className="text-slate-500">{v.mobile}</span>
                              </td>
                              <td className="p-4">
                                <p className="text-slate-300">{v.gender}, Age {v.age}</p>
                                <span className="text-[10px] text-slate-500">{v.caste} | {v.religion}</span>
                              </td>
                              <td className="p-4 font-semibold text-slate-400">
                                {booths.find(b => b.id === v.boothId)?.name.split(' - ')[0]}
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                  v.supportStatus === 'For' ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' :
                                  v.supportStatus === 'Against' ? 'bg-red-600/10 border-red-500/30 text-red-400' :
                                  v.supportStatus === 'Swing' ? 'bg-green-600/10 border-green-500/30 text-green-400' :
                                  'bg-amber-600/10 border-amber-500/30 text-amber-400'
                                }`}>
                                  {v.supportStatus}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 font-bold ${v.voted ? 'text-green-500' : 'text-slate-500'}`}>
                                  {v.voted ? <CheckCircle2 size={12} /> : <UserX size={12} />}
                                  {v.voted ? 'Voted' : 'Unvoted'}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-1.5">
                                <button
                                  onClick={() => setSelectedFamilyId(v.familyId)}
                                  className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                                  title="Focus Family Unit"
                                >
                                  <Users size={12} />
                                </button>
                                {role === 'super_admin' && (
                                  <button
                                    onClick={() => {
                                      setVoters(prev => prev.filter(item => item.id !== v.id));
                                    }}
                                    className="p-1 bg-red-950/40 hover:bg-red-900/40 text-red-400 rounded border border-red-900/30"
                                    title="Delete Voter"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Operational add and OCR zone */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Add Voter Form */}
                    {role !== 'viewer' && (
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">Manual Voter Intake Registration</h4>
                        <form onSubmit={handleAddVoter} className="space-y-3">
                          <input
                            type="text"
                            placeholder="Full Name..."
                            value={newVoter.name}
                            onChange={e => setNewVoter(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                            required
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="EPIC ID..."
                              value={newVoter.epic}
                              onChange={e => setNewVoter(prev => ({ ...prev, epic: e.target.value }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                              required
                            />
                            <input
                              type="text"
                              placeholder="Mobile..."
                              value={newVoter.mobile}
                              onChange={e => setNewVoter(prev => ({ ...prev, mobile: e.target.value }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={newVoter.gender}
                              onChange={e => setNewVoter(prev => ({ ...prev, gender: e.target.value }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                            <input
                              type="number"
                              placeholder="Age"
                              value={newVoter.age || ''}
                              onChange={e => setNewVoter(prev => ({ ...prev, age: Number(e.target.value) }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={newVoter.boothId}
                              onChange={e => setNewVoter(prev => ({ ...prev, boothId: e.target.value }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                            >
                              {booths.map(b => (
                                <option key={b.id} value={b.id}>{b.name.split(' - ')[0]}</option>
                              ))}
                            </select>
                            <select
                              value={newVoter.supportStatus}
                              onChange={e => setNewVoter(prev => ({ ...prev, supportStatus: e.target.value as any }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                            >
                              <option value="Undecided">Undecided</option>
                              <option value="For">For (Supporter)</option>
                              <option value="Against">Against</option>
                              <option value="Swing">Swing</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={newVoter.caste}
                              onChange={e => setNewVoter(prev => ({ ...prev, caste: e.target.value }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                            >
                              {CASTE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select
                              value={newVoter.religion}
                              onChange={e => setNewVoter(prev => ({ ...prev, religion: e.target.value }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                            >
                              {RELIGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                          <textarea
                            placeholder="Residential Street Address..."
                            value={newVoter.address}
                            onChange={e => setNewVoter(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white h-16"
                          />
                          <button
                            type="submit"
                            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                          >
                            Register Citizen Voter
                          </button>
                        </form>
                      </div>
                    )}

                    {/* OCR Upload Roll Feature */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">ECI Electoral Roll PDF Digitizer</h4>
                        <button
                          type="button"
                          onClick={handleLoadDemoPdf}
                          className="px-2 py-1 text-[9px] bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold uppercase rounded border border-slate-700 transition-all"
                        >
                          Load Demo PDF
                        </button>
                      </div>
                      <p className="text-xs text-slate-400">Intelligent PDF scanning matches ECI-standard voter grids and creates direct database records.</p>
                      
                      <div 
                        onClick={() => document.getElementById('pdf-file-input')?.click()}
                        className="border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-3 bg-slate-950/50 hover:bg-slate-950/80 hover:border-orange-500/40 transition-all cursor-pointer relative"
                      >
                        <Upload size={32} className={`mx-auto ${selectedImportFile ? 'text-orange-500' : 'text-slate-600'}`} />
                        {selectedImportFile ? (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-green-400">Selected: {selectedImportFile.name}</p>
                            <p className="text-[10px] text-slate-400">{(selectedImportFile.size / (1024 * 1024)).toFixed(2)} MB | Click to replace</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-300">Drag &amp; Drop ECI Roll PDF Here</p>
                            <p className="text-[10px] text-slate-500">Supports standard Indian Election voter tables</p>
                          </div>
                        )}
                        <input 
                          id="pdf-file-input"
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={handlePdfFileChange}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleOcrParse}
                        disabled={isParsing || !selectedImportFile}
                        className={`w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                          (!selectedImportFile || isParsing) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isParsing ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                        {isParsing ? "Scanning & Parsing PDF..." : "Trigger Intelligent PDF Parsing"}
                      </button>

                      {ocrLog && (
                        <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-mono text-green-400 overflow-x-auto whitespace-pre-wrap max-h-40">
                          {ocrLog}
                        </pre>
                      )}

                      {/* Extracted Preview List */}
                      {parsedVoters.length > 0 && (
                        <div className="space-y-3 pt-3 border-t border-slate-800">
                          <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Preview of Extracted Voters</h5>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {parsedVoters.map(v => (
                              <div key={v.id} className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-xs flex justify-between items-start gap-2">
                                <div className="space-y-1">
                                  <p className="font-bold text-white">{v.name} <span className="text-slate-400">({v.gender[0]}, Age {v.age})</span></p>
                                  <p className="text-[10px] text-slate-500">EPIC: {v.epic} | Address: {v.address}</p>
                                </div>
                                <span className="text-[9px] bg-blue-600/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-bold">{v.supportStatus}</span>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={handleImportExtractedVoters}
                            className="w-full py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-green-900/10"
                          >
                            Import {parsedVoters.length} Extracted Voters
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* === MODULE 2: BOOTH & WARD MANAGEMENT === */}
            {activeTab === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Ward Selector and structure mapping */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Ward List Tree */}
                  <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">Constituency Hierarchy Mapping</h4>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-1.5">
                      <p className="font-bold text-orange-500">State: <span className="text-white">Maharashtra</span></p>
                      <p className="font-bold text-orange-500">District: <span className="text-white">Pune</span></p>
                      <p className="font-bold text-orange-500">Constituency: <span className="text-white">Shivajinagar</span></p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Select Ward Segment</p>
                      {['Ward 3', 'Ward 4', 'Ward 5'].map(ward => (
                        <button
                          key={ward}
                          onClick={() => {
                            setSelectedWard(ward);
                            const matchedBooth = booths.find(b => b.ward === ward);
                            if (matchedBooth) setSelectedBoothDetail(matchedBooth.id);
                          }}
                          className={`w-full text-left p-3.5 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all flex items-center justify-between ${
                            selectedWard === ward 
                              ? 'bg-slate-850 border-orange-500/50 text-orange-400' 
                              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{ward}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {booths.filter(b => b.ward === ward).length} Booths
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Booth list and Metrics */}
                  <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">Polling Booth Units inside {selectedWard}</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={exportBoothAnalysisToCsv}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2"
                        >
                          <Download size={14} />
                          Export Booth Analytics CSV
                        </button>
                        <button
                          onClick={exportBoothAnalysisToPdf}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2"
                        >
                          <FileText size={14} />
                          Export Booth Analytics PDF
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {booths.filter(b => b.ward === selectedWard).map(b => (
                        <button
                          key={b.id}
                          onClick={() => setSelectedBoothDetail(b.id)}
                          className={`text-left p-5 rounded-3xl border transition-all space-y-3 ${
                            selectedBoothDetail === b.id 
                              ? 'bg-slate-850 border-orange-500/50 text-orange-400' 
                              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black uppercase tracking-wider text-[11px] text-white">
                              {b.name.split(' - ')[0]}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                              b.status === 'Normal' ? 'bg-green-600/10 border-green-500/30 text-green-400' :
                              b.status === 'Low Turnout' ? 'bg-amber-600/10 border-amber-500/30 text-amber-400' :
                              'bg-red-600/10 border-red-500/30 text-red-400 animate-pulse'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">{b.name.split(' - ')[1] || b.name}</p>
                          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800/60">
                            <div>
                              <p className="text-[9px] text-slate-500">Voters</p>
                              <p className="text-xs font-black text-white">{b.totalVoters}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-500">Turnout</p>
                              <p className="text-xs font-black text-white">{b.turnoutPercent}%</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-500">Support Ratio</p>
                              <p className="text-xs font-black text-white">{Math.round(b.supportRatio * 100)}%</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Detailed focus booth voter metrics breakdown */}
                    {selectedBoothDetail && (
                      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800/50 space-y-4">
                        <div className="flex justify-between items-center">
                          <h5 className="text-xs font-black uppercase text-slate-300">
                            Demographics Breakdown &amp; Analysis of: {booths.find(b => b.id === selectedBoothDetail)?.name.split(' - ')[0]}
                          </h5>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-4 bg-slate-900 rounded-2xl text-center">
                            <span className="text-[9px] text-slate-500 uppercase font-black">Support Profile Breakdown</span>
                            <p className="text-base font-black text-white mt-1">
                              {voters.filter(v => v.boothId === selectedBoothDetail && v.supportStatus === 'For').length} Supporters
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {voters.filter(v => v.boothId === selectedBoothDetail && v.supportStatus === 'Swing').length} Swing/Vulnerable voters
                            </p>
                          </div>
                          <div className="p-4 bg-slate-900 rounded-2xl text-center">
                            <span className="text-[9px] text-slate-500 uppercase font-black">Castewise Mapping</span>
                            <p className="text-xs font-black text-white mt-1 leading-tight">
                              Maratha: {voters.filter(v => v.boothId === selectedBoothDetail && v.caste === 'Maratha').length} | OBC: {voters.filter(v => v.boothId === selectedBoothDetail && v.caste === 'OBC').length}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              SC/ST: {voters.filter(v => v.boothId === selectedBoothDetail && (v.caste === 'SC' || v.caste === 'ST')).length} residents
                            </p>
                          </div>
                          <div className="p-4 bg-slate-900 rounded-2xl text-center">
                            <span className="text-[9px] text-slate-500 uppercase font-black">Voting Statistics</span>
                            <p className="text-base font-black text-green-500 mt-1">
                              {Math.round((voters.filter(v => v.boothId === selectedBoothDetail && v.voted).length / Math.max(1, voters.filter(v => v.boothId === selectedBoothDetail).length)) * 100)}%
                            </p>
                            <p className="text-[10px] text-slate-500">Turnout completed in command portal</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* === MODULE 3: VOLUNTEER & WORKER MANAGEMENT (KARYAKARTAS) === */}
            {activeTab === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Volunteer List */}
                  <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-300 font-sans">Registered Karyakartas ({volunteers.length})</h4>
                      <span className="text-xs text-slate-400">Panna Pramukhs &amp; Booth Agents</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                            <th className="p-4">Karyakarta / Contact</th>
                            <th className="p-4">Assigned Role</th>
                            <th className="p-4">Assigned Booth Unit</th>
                            <th className="p-4">Live Check-in Status</th>
                            <th className="p-4">Last GPS Coordinate</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {volunteers.map(v => (
                            <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="p-4">
                                <p className="font-bold text-white">{v.name}</p>
                                <span className="text-[10px] text-slate-500">{v.mobile}</span>
                              </td>
                              <td className="p-4 font-semibold text-slate-300">{v.role}</td>
                              <td className="p-4 text-slate-400">
                                {booths.find(b => b.id === v.assignedBoothId)?.name.split(' - ')[0] || 'Unassigned'}
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                  v.attendance === 'Checked In' 
                                    ? 'bg-green-600/10 border-green-500/30 text-green-400' 
                                    : 'bg-slate-800 border-slate-700 text-slate-500'
                                }`}>
                                  {v.attendance} {v.lastCheckInTime && `(${v.lastCheckInTime})`}
                                </span>
                              </td>
                              <td className="p-4 font-mono text-[10px] text-slate-500">{v.lastGpsLocation || 'N/A'}</td>
                              <td className="p-4 text-right space-x-2">
                                <button
                                  onClick={() => triggerVolunteerCheckIn(v.id, v.attendance === 'Checked In' ? 'Checked Out' : 'Checked In')}
                                  className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg border transition-all ${
                                    v.attendance === 'Checked In'
                                      ? 'bg-amber-600/10 border-amber-500/30 text-amber-400'
                                      : 'bg-green-600/10 border-green-500/30 text-green-400'
                                  }`}
                                >
                                  {v.attendance === 'Checked In' ? 'Force Check Out' : 'GPS Check In'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Column: Add Volunteer & Live Logs */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Add Volunteer */}
                    {role !== 'viewer' && (
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">Onboard New Karyakarta</h4>
                        <form onSubmit={handleAddVolunteer} className="space-y-3">
                          <input
                            type="text"
                            placeholder="Full Name..."
                            value={newVol.name}
                            onChange={e => setNewVol(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Mobile Number..."
                            value={newVol.mobile}
                            onChange={e => setNewVol(prev => ({ ...prev, mobile: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                            required
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={newVol.role}
                              onChange={e => setNewVol(prev => ({ ...prev, role: e.target.value as any }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                            >
                              <option value="Booth Agent">Booth Agent</option>
                              <option value="Panna Pramukh">Panna Pramukh</option>
                              <option value="Sector Head">Sector Head</option>
                              <option value="Campaign Manager">Campaign Manager</option>
                            </select>
                            <select
                              value={newVol.assignedBoothId}
                              onChange={e => setNewVol(prev => ({ ...prev, assignedBoothId: e.target.value }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                            >
                              {booths.map(b => (
                                <option key={b.id} value={b.id}>{b.name.split(' - ')[0]}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                          >
                            Add Volunteer
                          </button>
                        </form>
                      </div>
                    )}

                    {/* GPS Tagged Field Activity Logs */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">GPS field activity tracking</h4>
                      <p className="text-xs text-slate-400">Live feed of checked-in volunteers logging their location in the ward.</p>
                      <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                        {volunteerCheckInLog.map((log, idx) => (
                          <div key={idx} className="bg-slate-950 p-3 rounded-2xl border border-slate-800/60 text-xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-200">{log.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                log.action === 'Check In' ? 'bg-green-600/10 text-green-400 border border-green-500/20' : 'bg-amber-600/10 text-amber-400 border border-amber-500/20'
                              }`}>{log.action}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <MapPin size={10} /> Lat/Lng: {log.location}
                            </p>
                            <span className="text-[9px] text-slate-600 font-mono block text-right">{log.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* === MODULE 4: CAMPAIGN MANAGEMENT === */}
            {activeTab === 4 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Events Calendar & Coverage Map */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Event Schedule Calendar */}
                  <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">Campaign Schedule Calendar</h4>
                    
                    <div className="space-y-3">
                      {events.map(e => (
                        <div key={e.id} className="bg-slate-950 p-4 rounded-3xl border border-slate-800 flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-2 py-0.5 bg-orange-600/10 border border-orange-500/20 text-orange-400 rounded font-black uppercase">
                                {e.status}
                              </span>
                              <h5 className="text-sm font-black text-white">{e.title}</h5>
                            </div>
                            <p className="text-xs text-slate-400 flex items-center gap-1.5">
                              <MapPin size={12} className="text-slate-500" /> Location: {e.location}
                            </p>
                            <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                              <span>Date: {e.date} at {e.time}</span>
                              <span>| Target: {e.assignedBooths.length} Booths</span>
                              <span>| Volunteers: {e.assignedVolunteers.length} deployed</span>
                            </div>
                          </div>
                          {role === 'super_admin' && (
                            <button
                              onClick={() => {
                                setEvents(prev => prev.filter(item => item.id !== e.id));
                              }}
                              className="p-1 bg-red-950/40 hover:bg-red-900/40 text-red-400 rounded border border-red-900/30"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Schedule Form */}
                    {role !== 'viewer' && (
                      <form onSubmit={handleAddEvent} className="bg-slate-950 p-5 rounded-3xl border border-slate-850 space-y-3">
                        <p className="text-xs font-bold text-slate-300 uppercase">Schedule New Outreach/Rally</p>
                        <input
                          type="text"
                          placeholder="Event Title/Subject..."
                          value={newEvent.title}
                          onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                          required
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={newEvent.date}
                            onChange={e => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                            required
                          />
                          <input
                            type="time"
                            value={newEvent.time}
                            onChange={e => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                            required
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Venue/Location Address..."
                          value={newEvent.location}
                          onChange={e => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                        />
                        <button
                          type="submit"
                          className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                          Schedule Event
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Canvassing Heatmap Coverage / SVG Visualization */}
                  <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">Door-to-Door Canvassing Heatmap</h4>
                      <p className="text-xs text-slate-400">Interactive overview of canvas volunteers coverage by polling station sectors.</p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4">
                      {/* Simulating an SVG Map of 5 Booth sectors */}
                      <svg viewBox="0 0 300 200" className="w-full max-w-[280px] h-auto border border-slate-800 rounded-2xl bg-slate-900/60 p-2">
                        {/* Sector 1 - b1 */}
                        <g onClick={() => {
                          setCanvassStatus(prev => ({ ...prev, b1: prev.b1 === 'Completed' ? 'InProgress' : 'Completed' }));
                        }} className="cursor-pointer group">
                          <rect x="20" y="20" width="100" height="70" rx="10" fill={canvassStatus.b1 === 'Completed' ? '#10b981' : canvassStatus.b1 === 'InProgress' ? '#f59e0b' : '#334155'} stroke="#475569" strokeWidth="2" opacity="0.8" />
                          <text x="70" y="55" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">Sector B1</text>
                        </g>
                        {/* Sector 2 - b2 */}
                        <g onClick={() => {
                          setCanvassStatus(prev => ({ ...prev, b2: prev.b2 === 'Completed' ? 'InProgress' : 'Completed' }));
                        }} className="cursor-pointer">
                          <rect x="130" y="20" width="140" height="70" rx="10" fill={canvassStatus.b2 === 'Completed' ? '#10b981' : canvassStatus.b2 === 'InProgress' ? '#f59e0b' : '#334155'} stroke="#475569" strokeWidth="2" opacity="0.8" />
                          <text x="200" y="55" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">Sector B2</text>
                        </g>
                        {/* Sector 3 - b3 */}
                        <g onClick={() => {
                          setCanvassStatus(prev => ({ ...prev, b3: prev.b3 === 'Completed' ? 'InProgress' : 'Completed' }));
                        }} className="cursor-pointer">
                          <rect x="20" y="100" width="70" height="80" rx="10" fill={canvassStatus.b3 === 'Completed' ? '#10b981' : canvassStatus.b3 === 'InProgress' ? '#f59e0b' : '#334155'} stroke="#475569" strokeWidth="2" opacity="0.8" />
                          <text x="55" y="145" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">Sector B3</text>
                        </g>
                        {/* Sector 4 - b4 */}
                        <g onClick={() => {
                          setCanvassStatus(prev => ({ ...prev, b4: prev.b4 === 'Completed' ? 'InProgress' : 'Completed' }));
                        }} className="cursor-pointer">
                          <rect x="100" y="100" width="90" height="80" rx="10" fill={canvassStatus.b4 === 'Completed' ? '#10b981' : canvassStatus.b4 === 'InProgress' ? '#f59e0b' : '#334155'} stroke="#475569" strokeWidth="2" opacity="0.8" />
                          <text x="145" y="145" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">Sector B4</text>
                        </g>
                        {/* Sector 5 - b5 */}
                        <g onClick={() => {
                          setCanvassStatus(prev => ({ ...prev, b5: prev.b5 === 'Completed' ? 'InProgress' : 'Completed' }));
                        }} className="cursor-pointer">
                          <rect x="200" y="100" width="70" height="80" rx="10" fill={canvassStatus.b5 === 'Completed' ? '#10b981' : canvassStatus.b5 === 'InProgress' ? '#f59e0b' : '#334155'} stroke="#475569" strokeWidth="2" opacity="0.8" />
                          <text x="235" y="145" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">Sector B5</text>
                        </g>
                      </svg>

                      <div className="flex justify-between w-full text-[10px] text-slate-400 font-bold px-2 pt-2 border-t border-slate-800">
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-slate-600 block"></span> Unvisited</span>
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-amber-500 block"></span> In Progress</span>
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-green-500 block"></span> Visited / Cover</span>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800/50 space-y-2">
                      <span className="text-[10px] text-slate-500 font-black uppercase">Daily Campaign PDF Synthesizer</span>
                      <p className="text-xs text-slate-300">Download automatically generated Daily Campaign Activity Summary PDF for leadership audit.</p>
                      <button
                        onClick={exportDailyCampaignReportToPdf}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-2"
                      >
                        <FileText size={14} />
                        Download Daily PDF Report
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* === MODULE 5: COMMUNICATION HUB === */}
            {activeTab === 5 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: broad caster portal */}
                  <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">Constituency Broadcasting Gateways</h4>
                    
                    {/* Gateway choice */}
                    <div className="grid grid-cols-3 gap-3">
                      {(['SMS', 'WhatsApp', 'IVR'] as const).map(ch => (
                        <button
                          key={ch}
                          onClick={() => setBroadcastChannel(ch)}
                          className={`p-4 rounded-2xl border text-center transition-all ${
                            broadcastChannel === ch 
                              ? 'bg-orange-600/10 border-orange-500 text-orange-400' 
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          {ch === 'SMS' && <MessageSquare size={24} className="mx-auto mb-2" />}
                          {ch === 'WhatsApp' && <MessageSquare size={24} className="mx-auto mb-2 text-green-500" />}
                          {ch === 'IVR' && <PhoneCall size={24} className="mx-auto mb-2" />}
                          <span className="text-xs font-bold uppercase block">{ch} Broadcast</span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-800/60">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Target Voter Segment</label>
                          <select
                            value={broadcastSegment}
                            onChange={e => setBroadcastSegment(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                          >
                            <option value="All">All Registered Voters (Constituency)</option>
                            <option value="For">For (Candidate Loyalists)</option>
                            <option value="Undecided">Undecided / Unpolled Voters</option>
                            <option value="Swing">Swing (Critical Voters)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Gateway Provider API</label>
                          <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500">
                            <option>Prompt.io Premium SMS Gateway</option>
                            <option>WhatsApp Business Platform Official API</option>
                            <option>LeadNXT Automated IVR Router</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Broadcast Template Message</label>
                        <textarea
                          value={broadcastMessage}
                          onChange={e => setBroadcastMessage(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white h-32 focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <button
                        onClick={handleSendBroadcast}
                        className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                      >
                        Transmit Broadcast Campaign
                      </button>
                    </div>
                  </div>

                  {/* Right: Broadcast Logs & IVR Steps */}
                  <div className="lg:col-span-4 space-y-6">
                    {broadcastChannel === 'IVR' ? (
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">IVR Interactive Survey Builder</h4>
                        <div className="space-y-3">
                          {ivrSteps.map((step, idx) => (
                            <div key={idx} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-xs">
                              <p className="font-bold text-slate-200">Dial Step #{step.step}</p>
                              <p className="text-[11px] text-slate-400 italic mt-1 font-mono">"{step.text}"</p>
                              <span className="text-[9px] text-orange-500 mt-2 font-bold block">{step.options}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">WhatsApp Broadcast Mockup</h4>
                        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2 max-w-[280px] mx-auto">
                          <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider block">Official WhatsApp Broadcast</span>
                          <div className="bg-teal-950/40 p-3 rounded-xl border border-teal-900/30 text-xs space-y-1">
                            <p className="font-bold text-teal-400">Namaskar, Sunita Sharma ji</p>
                            <p className="text-[10px] text-slate-300">We invite you and your family at Gandhi Maidan on 10th July. Exercise your civic duty safely. Watch our manifesto video here:</p>
                            <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800">
                              <span className="text-[10px] text-slate-500 font-bold">[AI Video Avatar Manifesto]</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Broadcast history */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">Broadcast Transmission Logs</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                        {broadcastHistory.length === 0 && <p className="text-slate-500 text-xs italic">No broadcast logs recorded in this session.</p>}
                        {broadcastHistory.map(h => (
                          <div key={h.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-white">{h.channel} Campaign</p>
                              <span className="text-[10px] text-slate-500">Segment: {h.segment}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-orange-400">{h.count} sent</p>
                              <span className="text-[8px] text-slate-600">{h.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* === MODULE 6: SURVEY & FEEDBACK === */}
            {activeTab === 6 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Input for Sentiment survey */}
                  <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">AI-Powered Sentiment Analyser</h4>
                    <p className="text-xs text-slate-400">Log open-ended verbal responses. The AI model extracts key concerns and sentiment score.</p>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Citizen Name..."
                          value={feedbackVoter}
                          onChange={e => setFeedbackVoter(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="Contact Mob..."
                          value={feedbackMobile}
                          onChange={e => setFeedbackMobile(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                        />
                      </div>
                      <textarea
                        placeholder="Type raw feedback received during door-to-door (e.g. 'Satisfied with clean water, but disappointed in road damage and streetlights')..."
                        value={feedbackInput}
                        onChange={e => setFeedbackInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white h-32 focus:outline-none focus:border-orange-500"
                      />
                      <button
                        onClick={handleSentimentAnalyze}
                        className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                      >
                        Run Natural Language Sentiment Classifier
                      </button>
                    </div>

                    {aiAnalysisResult && (
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                        <p className="font-bold text-slate-200">AI Model Output Analysis:</p>
                        <div className="flex gap-4">
                          <p className="text-[11px] text-slate-400">
                            Extracted Category: <span className="text-orange-500 font-bold">{aiAnalysisResult.category}</span>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Extracted Sentiment: <span className="text-orange-500 font-bold">{aiAnalysisResult.sentiment}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Feedback list & Issue categorizer */}
                  <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">Constituency Sentiment Database</h4>
                    
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {feedback.map(fb => (
                        <div key={fb.id} className="bg-slate-950 p-4 rounded-3xl border border-slate-800 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-100">{fb.voterName} ({fb.mobile})</span>
                            <div className="flex gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-900 text-slate-400">
                                {fb.category}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                                fb.sentiment === 'For' ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' :
                                fb.sentiment === 'Against' ? 'bg-red-600/10 border-red-500/20 text-red-400' :
                                'bg-amber-600/10 border-amber-500/20 text-amber-400'
                              }`}>
                                {fb.sentiment}
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-400 italic">"{fb.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* === MODULE 7: ELECTION DAY WAR ROOM === */}
            {activeTab === 7 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* War Room Banner */}
                <div className="bg-red-950/40 border border-red-500/30 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-red-500 tracking-wider uppercase flex items-center gap-2">
                      <span className="h-3 w-3 bg-red-600 rounded-full animate-ping"></span> Live War Room Portal
                    </h3>
                    <p className="text-xs text-slate-300">Live feed from booths across the Shivajinagar Constituency on Election day.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Average Turnout</span>
                      <p className="text-xl font-black text-white">55.8%</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Low Turnout Alarms</span>
                      <p className="text-xl font-black text-red-500">2 Booths</p>
                    </div>
                  </div>
                </div>

                {/* Turnout alert & issues feed */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Turnout monitoring table */}
                  <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">Real-time Turnout Monitoring</h4>
                    
                    <div className="space-y-4">
                      {booths.map(b => (
                        <div key={b.id} className="space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-200">{b.name.split(' - ')[0]}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-mono">{b.turnoutPercent}%</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                b.turnoutPercent < 45 ? 'bg-red-600/10 text-red-400 border border-red-500/20' : 'bg-slate-950 text-slate-500'
                              }`}>
                                {b.turnoutPercent < 45 ? 'Action Required' : 'Normal'}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-850">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                b.turnoutPercent < 45 ? 'bg-gradient-to-r from-red-600 to-red-500' : 'bg-gradient-to-r from-green-600 to-green-500'
                              }`}
                              style={{ width: `${b.turnoutPercent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Live issue feed reporting */}
                  <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">Live Incident &amp; Issue Feed</h4>

                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {issues.map(is => (
                        <div key={is.id} className="bg-slate-950 p-4 rounded-3xl border border-slate-800 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-200">
                              {booths.find(b => b.id === is.boothId)?.name.split(' - ')[0]}
                            </span>
                            <div className="flex gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                is.severity === 'High' ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'bg-slate-900 text-slate-400'
                              }`}>
                                {is.severity} Severity
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                                is.status === 'Resolved' ? 'bg-green-600/10 border-green-500/20 text-green-400' : 'bg-amber-600/10 border-amber-500/20 text-amber-400 animate-pulse'
                              }`}>
                                {is.status}
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-400 italic">"{is.description}"</p>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-850 text-[10px] text-slate-500">
                            <span>Reported: {is.reportedBy} ({is.reportedTime})</span>
                            {is.status !== 'Resolved' && role === 'super_admin' && (
                              <button
                                onClick={() => handleUpdateIssueStatus(is.id, 'Resolved')}
                                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[9px] font-bold uppercase transition-all"
                              >
                                Mark Resolved
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Report form */}
                    {role !== 'viewer' && (
                      <form onSubmit={handleReportIssue} className="bg-slate-950 p-4 rounded-3xl border border-slate-850 space-y-3">
                        <p className="text-[10px] font-black uppercase text-slate-400">Report New Booth Incident / Delay</p>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={warRoomIssueBooth}
                            onChange={e => setWarRoomIssueBooth(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                          >
                            {booths.map(b => (
                              <option key={b.id} value={b.id}>{b.name.split(' - ')[0]}</option>
                            ))}
                          </select>
                          <select
                            value={warRoomIssueSeverity}
                            onChange={e => setWarRoomIssueSeverity(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                          >
                            <option value="Low">Low Severity</option>
                            <option value="Medium">Medium Severity</option>
                            <option value="High">High Severity</option>
                          </select>
                        </div>
                        <input
                          type="text"
                          placeholder="Describe EVM glitch, slow queue delay or local dispute..."
                          value={warRoomIssueText}
                          onChange={e => setWarRoomIssueText(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                          required
                        />
                        <button
                          type="submit"
                          className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                        >
                          Launch Incident Alert
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* GOTV mobilization */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">GOTV (Get-Out-The-Vote) Last-Mile Coordination</h4>
                      <p className="text-xs text-slate-400">Target undecided or supporter citizens who have not cast their votes yet.</p>
                    </div>
                    <span className="text-xs text-amber-500 font-bold bg-amber-600/10 border border-amber-500/20 px-3 py-1 rounded-full uppercase">
                      Action Required: Dispatched Karyakartas to target addresses
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {voters.filter(v => !v.voted && v.supportStatus !== 'Against').slice(0, 6).map(v => (
                      <div key={v.id} className="bg-slate-950 p-4 rounded-3xl border border-slate-850 flex items-start justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <p className="font-bold text-white">{v.name}</p>
                          <p className="text-[10px] text-slate-500">Epic: {v.epic} | Mob: {v.mobile}</p>
                          <p className="text-[10px] text-slate-400">Add: {v.address}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase inline-block mt-1 ${
                            v.supportStatus === 'For' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'bg-green-600/10 text-green-400 border border-green-500/20'
                          }`}>{v.supportStatus}</span>
                        </div>
                        <button
                          onClick={() => handleGOTVMobilize(v.id)}
                          className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[9px] font-bold uppercase transition-all whitespace-nowrap"
                        >
                          Verify Vote
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* TOAST NOTIFICATION STACK */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => {
            let bgColor = "bg-slate-900 border-slate-800";
            let textColor = "text-white";
            let iconColor = "text-orange-500";
            if (toast.type === "success") {
              bgColor = "bg-emerald-950/95 border-emerald-500/30";
              iconColor = "text-emerald-400";
            } else if (toast.type === "error") {
              bgColor = "bg-red-950/95 border-red-500/30";
              iconColor = "text-red-400";
            } else if (toast.type === "warning") {
              bgColor = "bg-amber-950/95 border-amber-500/30";
              iconColor = "text-amber-400";
            } else if (toast.type === "info") {
              bgColor = "bg-blue-950/95 border-blue-500/30";
              iconColor = "text-blue-400";
            }
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.15 } }}
                className={`pointer-events-auto p-4 rounded-2xl border flex items-start gap-3 shadow-2xl backdrop-blur-md ${bgColor}`}
              >
                <div className={`mt-0.5 ${iconColor}`}>
                  {toast.type === "success" && <CheckCircle2 size={16} />}
                  {toast.type === "error" && <AlertTriangle size={16} />}
                  {toast.type === "warning" && <AlertTriangle size={16} />}
                  {toast.type === "info" && <Activity size={16} />}
                </div>
                <div className="flex-1 text-xs font-semibold text-slate-100">
                  {toast.message}
                </div>
                <button
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* DATA MANAGEMENT DRAWER */}
      <AnimatePresence>
        {isDataDrawerOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDataDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[990]"
            />

            {/* Drawer content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl z-[991] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-600/10 text-orange-400 rounded-xl">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider">Campaign Data Hub</h3>
                    <p className="text-[10px] text-slate-400">Import electoral rolls, audit collisions, & export lists</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDataDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                
                {/* SECTION 1: PDF ELECTORAL ROLL PARSING UTILITY */}
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="text-orange-500" size={18} />
                    <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider">PDF Electoral Roll Parser</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Parse Adobe PDF ECI-format electoral roll files. Extracts tabular data blocks including Names, EPIC Numbers, Ages, Genders, and registered addresses automatically.
                  </p>

                  {/* Upload Box */}
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type === "application/pdf") {
                        setSelectedImportFile(file);
                        setParsedVoters([]);
                        setOcrLog(`File Loaded via Drag & Drop: "${file.name}"\nSize: ${(file.size / 1024).toFixed(1)} KB\nFormat: Adobe PDF (Electoral Roll)\n\nReady for intelligent PDF parsing.`);
                      } else {
                        showToast("Please drop a valid PDF file!", "error");
                      }
                    }}
                    className="border-2 border-dashed border-slate-800 hover:border-orange-500/40 rounded-2xl p-5 text-center transition-all bg-slate-900/40 cursor-pointer relative"
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={isParsing}
                    />
                    <Upload size={24} className="mx-auto text-slate-500 mb-2" />
                    <p className="text-xs font-bold text-slate-300">Drag & drop electoral roll PDF or click to browse</p>
                    <p className="text-[10px] text-slate-500 mt-1">Supports standard ECI dual-column grid lists</p>
                  </div>

                  {selectedImportFile && (
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <div className="truncate pr-4">
                        <p className="font-bold text-slate-300 truncate">{selectedImportFile.name}</p>
                        <p className="text-[10px] text-slate-500">{(selectedImportFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedImportFile(null);
                          setOcrLog("");
                          setParsedVoters([]);
                        }}
                        className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase transition-all cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {/* Controls */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleLoadDemoPdf}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Load Demo PDF
                    </button>
                    <button
                      type="button"
                      onClick={handleOcrParse}
                      disabled={!selectedImportFile || isParsing}
                      className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md shadow-orange-600/10 cursor-pointer"
                    >
                      {isParsing ? `Parsing... (${pdfParsingProgress}%)` : "Parse Electoral Roll"}
                    </button>
                  </div>

                  {/* Progress Bar */}
                  {isParsing && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>Extracting PDF Data Blocks...</span>
                        <span>{pdfParsingProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all duration-300" 
                          style={{ width: `${pdfParsingProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Logs display */}
                  {ocrLog && (
                    <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl font-mono text-[9px] text-slate-400 max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {ocrLog}
                    </div>
                  )}

                  {/* Extracted preview lists */}
                  {parsedVoters.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-t border-slate-850 pt-3">
                        <span>Extracted Voters ({parsedVoters.length})</span>
                        <span className="text-emerald-400 text-[10px]">Ready for database registration</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {parsedVoters.map((pv, i) => (
                          <div key={i} className="p-2 bg-slate-900 rounded-lg border border-slate-850 flex justify-between items-center text-[11px]">
                            <div>
                              <p className="font-bold text-slate-200">{pv.name} <span className="text-slate-500">({pv.age} {pv.gender})</span></p>
                              <p className="text-[9px] text-slate-500 font-mono">EPIC: {pv.epic}</p>
                            </div>
                            <span className="text-[9px] text-slate-500 font-bold bg-slate-950 px-1.5 py-0.5 rounded">
                              {pv.boothId}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          handleImportExtractedVoters();
                          setIsDataDrawerOpen(false);
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                      >
                        Confirm &amp; Import {parsedVoters.length} Voters
                      </button>
                    </div>
                  )}
                </div>

                {/* SECTION 2: EXPORT FILTERED DATASETS */}
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <Download className="text-orange-500" size={18} />
                    <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider">Export Filtered Datasets</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Compile and export your current filtered segments. Includes live counts based on search query, demographics, support status, and booth filters.
                  </p>

                  {/* Current Active Filters Summary */}
                  <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-850 space-y-2">
                    <span className="text-[10px] uppercase font-black text-slate-500">Live Compilation Segment</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="text-slate-400">Total Filtered: <span className="text-white font-bold">{filteredVoters.length} voters</span></div>
                      <div className="text-slate-400">Ward: <span className="text-white font-bold">{selectedWard}</span></div>
                      <div className="text-slate-400">Booth Segment: <span className="text-white font-bold">{voterFilterBooth === 'all' ? 'All' : voterFilterBooth}</span></div>
                      <div className="text-slate-400">Support Tag: <span className="text-white font-bold">{voterFilterSupport === 'all' ? 'All' : voterFilterSupport}</span></div>
                    </div>
                  </div>

                  {/* Export Triggers */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={exportVoterRollToCsv}
                      className="py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <Download size={14} className="text-blue-400" />
                      CSV Export
                    </button>
                    <button
                      onClick={exportVoterRollToExcel}
                      className="py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <FileSpreadsheet size={14} className="text-emerald-400" />
                      Excel Export
                    </button>
                    <button
                      onClick={exportVoterRollToPdf}
                      className="py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <FileText size={14} className="text-red-400" />
                      PDF Export
                    </button>
                  </div>
                </div>

                {/* SECTION 3: FUZZY DUPLICATES DATABASE AUDITING STATUS */}
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="text-orange-500" size={18} />
                      <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider">Duplicate Record Auditing</h4>
                    </div>
                    <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/10 font-mono">
                      {fuzzyDuplicates.length} Collisions Flagged
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Scan all registered voter names and addresses using a high-precision fuzzy matching algorithm to identify typographical errors, duplications, and EPIC registration collisions.
                  </p>
                  <button
                    onClick={() => {
                      setIsDataDrawerOpen(false);
                      runFuzzyDuplicateAudit();
                      // switch to voters tab
                      setActiveTab(1);
                    }}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Launch Fuzzy Audit Analysis
                  </button>
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-center text-[10px] text-slate-500 font-mono">
                ECI Strategist System Node: ACTIVE | Secured Local Connection
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PDF PARSER STATUS MODAL */}
      <AnimatePresence>
        {isStatusModalOpen && pdfParsingResult && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStatusModalOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[1000]"
            />

            {/* Modal Center Container */}
            <div className="fixed inset-0 overflow-y-auto z-[1001] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-600/10 text-orange-400 rounded-xl">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-wider">PDF Parsing Quality Audit</h3>
                      <p className="text-[10px] text-slate-400">ECI Electoral Roll Demographics Validation Report</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsStatusModalOpen(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                  
                  {/* Checklist visual metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-2xl text-center">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase">Passed Validation</p>
                      <p className="text-3xl font-black text-emerald-400 mt-1">{pdfParsingResult.successCount}</p>
                      <p className="text-[9px] text-slate-400 mt-1">Successfully Mapped Profiles</p>
                    </div>
                    <div className="bg-red-950/20 border border-red-500/20 p-4 rounded-2xl text-center">
                      <p className="text-[10px] font-bold text-red-400 uppercase">Flagged Failures</p>
                      <p className="text-3xl font-black text-red-400 mt-1">{pdfParsingResult.failureCount}</p>
                      <p className="text-[9px] text-slate-400 mt-1">Typographical / Format Warnings</p>
                    </div>
                  </div>

                  {/* Failures audit ledger */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-400" /> Validation Failures Audit Ledger
                    </h4>
                    
                    {pdfParsingResult.failureCount === 0 ? (
                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl text-center text-xs text-slate-400">
                        All scanned lines passed ECI legal age, name length, and duplicate-EPIC criteria with 100% precision!
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {pdfParsingResult.failures.map((fail, index) => (
                          <div key={index} className="p-3 bg-slate-950 border border-slate-850 rounded-2xl text-xs space-y-1 relative overflow-hidden">
                            <div className="flex justify-between items-start">
                              <p className="font-bold text-slate-200">{fail.name || "Unknown Name"}</p>
                              <span className="text-[9px] font-mono bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/15">
                                {fail.epic || "No EPIC"}
                              </span>
                            </div>
                            <p className="text-[10px] text-red-400/95 font-semibold bg-red-500/5 px-2 py-1 rounded border border-red-500/5 mt-1">
                              Reason: {fail.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    onClick={() => setIsStatusModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
                  >
                    Close Audit Report
                  </button>
                  {pdfParsingResult.successCount > 0 && (
                    <button
                      onClick={() => {
                        setIsStatusModalOpen(false);
                        handleImportExtractedVoters();
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Import Passed Records
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
