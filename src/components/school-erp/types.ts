export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  className: string; // e.g. "Class 10-A", "Class 11-B", "Class 12-A"
  fatherName: string;
  motherName: string;
  dob: string; // YYYY-MM-DD
  contact: string;
  photo?: string; // Base64 encoded string or image path
}

export interface AttendanceRecord {
  studentId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent';
}

export interface ExamFeeRecord {
  id: string;
  studentId: string;
  rollNumber: string;
  studentName: string;
  className: string;
  amountDue: number;
  amountPaid: number;
  status: 'Paid' | 'Pending' | 'Partial';
  dueDate: string; // YYYY-MM-DD
  receiptNumber?: string;
  paymentDate?: string;
}

export interface CertificateLog {
  id: string;
  studentId: string;
  studentName: string;
  certificateType: 'Bonafide' | 'Academic' | 'Character' | 'Sports';
  certificateNo: string;
  dateOfIssue: string;
  details: any; // sub-module specific values
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
