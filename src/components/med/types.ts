export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  village?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
  duration: string;
}

export interface Prescription {
  id: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  medications: Medication[];
  date: string;
  status: 'Pending' | 'Dispensed' | 'Cancelled';
  notes?: string;
  language?: string;
  signature?: string; // Data URL for signature image
  isHandwritten?: boolean;
  patientSignature?: string; // Data URL for patient signature
  category?: 'General' | 'Cardiac' | 'Pediatric' | 'Orthopedic' | 'Gastro' | 'Other';
}

export interface DashboardStats {
  todayCount: number;
  pendingCount: number;
  mostPrescribed: string;
  trend: number[];
}

export interface ClinicProfile {
  name: string;
  specialty: string;
  regNumber: string;
  address: string;
  email: string;
  phone: string;
}

export const DEFAULT_CLINIC: ClinicProfile = {
  name: "City Health Medical Center",
  specialty: "General Physician & Cardiology",
  regNumber: "GMC-77281-B",
  address: "123 Healthcare Way, Metro City",
  email: "dr.fischer@cityhealth.com",
  phone: "+91 98765 43210"
};

export interface Template {
  id: string;
  name: string;
  medications: Omit<Medication, 'id'>[];
}

export const PRESCRIPTION_TEMPLATES: Template[] = [
  {
    id: 't1',
    name: 'Common Cold',
    medications: [
      { name: 'Paracetamol 650mg', dosage: '1-0-1', instructions: 'After food', duration: '3 days' },
      { name: 'Cetirizine 10mg', dosage: '0-0-1', instructions: 'Before sleep', duration: '5 days' }
    ]
  },
  {
    id: 't2',
    name: 'Hypertension',
    medications: [
      { name: 'Amlodipine 5mg', dosage: '1-0-0', instructions: 'Empty stomach', duration: '30 days' }
    ]
  },
  {
    id: 't3',
    name: 'Type 2 Diabetes',
    medications: [
      { name: 'Metformin 500mg', dosage: '1-0-1', instructions: 'During meal', duration: '30 days' }
    ]
  }
];

export const MOCK_PATIENTS: Patient[] = [
  { id: 'p1', name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+91 98765 43210', village: 'Ramnagar' },
  { id: 'p2', name: 'Amit Patil', email: 'amit@example.com', phone: '+91 91234 56789', village: 'Jamkhed' },
  { id: 'p3', name: 'Snehal Deshmukh', email: 'snehal@example.com', phone: '+91 88888 77777', village: 'Karjat' },
];

export const MOCK_MEDICATIONS: string[] = [
  'Amoxicillin 500mg',
  'Paracetamol 650mg',
  'Cetirizine 10mg',
  'Metformin 500mg',
  'Amlodipine 5mg',
  'Azithromycin 500mg',
  'Pantoprazole 40mg',
  'Ibuprofen 400mg'
];
