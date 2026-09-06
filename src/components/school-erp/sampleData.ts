import { Student, ExamFeeRecord, AttendanceRecord } from './types';

export const SAMPLE_STUDENTS: Student[] = [
  // Class 1-A (Ages ~6)
  { id: 'st19', rollNumber: '101', name: 'Rajesh Verma', className: 'Class 1-A', fatherName: 'Shyam Verma', motherName: 'Kirti Verma', dob: '15/04/2020', contact: '987-654-3210' },
  
  // Class 2-A (Ages ~7)
  { id: 'st20', rollNumber: '201', name: 'Sumit Patel', className: 'Class 2-A', fatherName: 'Abhay Patel', motherName: 'Amita Patel', dob: '22/08/2019', contact: '981-234-5678' },
  
  // Class 3-A (Ages ~8)
  { id: 'st21', rollNumber: '301', name: 'Neha Iyer', className: 'Class 3-A', fatherName: 'Raman Iyer', motherName: 'Radha Iyer', dob: '10/02/2018', contact: '889-900-1122' },
  
  // Class 4-A (Ages ~9)
  { id: 'st22', rollNumber: '401', name: 'Rahul Kumar', className: 'Class 4-A', fatherName: 'Vikrant Kumar', motherName: 'Sushma Kumar', dob: '05/12/2017', contact: '776-655-4433' },
  
  // Class 5-A (Ages ~10)
  { id: 'st23', rollNumber: '501', name: 'Priya Sen', className: 'Class 5-A', fatherName: 'Alok Sen', motherName: 'Dipti Sen', dob: '18/06/2016', contact: '912-345-6780' },
  
  // Class 6-A (Ages ~11)
  { id: 'st24', rollNumber: '601', name: 'Amit Gupta', className: 'Class 6-A', fatherName: 'Dinesh Gupta', motherName: 'Usha Gupta', dob: '30/09/2015', contact: '998-877-6655' },
  
  // Class 7-A (Ages ~12)
  { id: 'st25', rollNumber: '701', name: 'Rohan Mehta', className: 'Class 7-A', fatherName: 'Pranav Mehta', motherName: 'Pratibha Mehta', dob: '14/05/2014', contact: '954-321-0987' },
  
  // Class 8-A (Ages ~13)
  { id: 'st26', rollNumber: '801', name: 'Divya Rao', className: 'Class 8-A', fatherName: 'Madhav Rao', motherName: 'Shila Rao', dob: '25/01/2013', contact: '987-650-1234' },
  
  // Class 9-A (Ages ~14)
  { id: 'st27', rollNumber: '901', name: 'Sneha Nair', className: 'Class 9-A', fatherName: 'Raju Nair', motherName: 'Preetha Nair', dob: '02/10/2012', contact: '876-543-2109' },

  // Class 10-A
  { id: 'st1', rollNumber: '1001', name: 'Aarav Sharma', className: 'Class 10-A', fatherName: 'Rajesh Sharma', motherName: 'Sunita Sharma', dob: '15/04/2011', contact: '987-654-3210' },
  { id: 'st2', rollNumber: '1002', name: 'Aditya Patel', className: 'Class 10-A', fatherName: 'Amit Patel', motherName: 'Meena Patel', dob: '22/08/2011', contact: '981-234-5678' },
  { id: 'st3', rollNumber: '1003', name: 'Ananya Iyer', className: 'Class 10-A', fatherName: 'Venkat Iyer', motherName: 'Lakshmi Iyer', dob: '10/02/2011', contact: '889-900-1122' },
  { id: 'st4', rollNumber: '1004', name: 'Arjun Verma', className: 'Class 10-A', fatherName: 'Sanjay Verma', motherName: 'Rita Verma', dob: '05/12/2011', contact: '776-655-4433' },
  { id: 'st5', rollNumber: '1005', name: 'Diya Sen', className: 'Class 10-A', fatherName: 'Pradip Sen', motherName: 'Gargi Sen', dob: '18/06/2011', contact: '912-345-6780' },
  { id: 'st6', rollNumber: '1006', name: 'Ishaan Gupta', className: 'Class 10-A', fatherName: 'Anil Gupta', motherName: 'Sita Gupta', dob: '30/09/2011', contact: '998-877-6655' },

  // Class 11-A
  { id: 'st7', rollNumber: '1101', name: 'Kabir Mehta', className: 'Class 11-A', fatherName: 'Vikram Mehta', motherName: 'Nisha Mehta', dob: '14/05/2010', contact: '954-321-0987' },
  { id: 'st8', rollNumber: '1102', name: 'Meera Rao', className: 'Class 11-A', fatherName: 'Kiran Rao', motherName: 'Shalini Rao', dob: '25/01/2010', contact: '987-650-1234' },
  { id: 'st9', rollNumber: '1103', name: 'Nikhil Nair', className: 'Class 11-A', fatherName: 'Mohan Nair', motherName: 'Radhika Nair', dob: '02/10/2010', contact: '876-543-2109' },
  { id: 'st10', rollNumber: '1104', name: 'Pranav Joshi', className: 'Class 11-A', fatherName: 'Girish Joshi', motherName: 'Anjali Joshi', dob: '11/11/2010', contact: '765-432-1098' },
  { id: 'st11', rollNumber: '1105', name: 'Riya Singh', className: 'Class 11-A', fatherName: 'Dharmendra Singh', motherName: 'Poonam Singh', dob: '09/07/2010', contact: '934-567-8901' },
  { id: 'st12', rollNumber: '1106', name: 'Siddharth Roy', className: 'Class 11-A', fatherName: 'Joydeep Roy', motherName: 'Debarati Roy', dob: '20/03/2010', contact: '900-111-2223' },

  // Class 12-A
  { id: 'st13', rollNumber: '1201', name: 'Tanisha Deshmukh', className: 'Class 12-A', fatherName: 'Suhas Deshmukh', motherName: 'Rohini Deshmukh', dob: '30/08/2009', contact: '911-122-2333' },
  { id: 'st14', rollNumber: '1202', name: 'Utkarsh Bajpai', className: 'Class 12-A', fatherName: 'Alok Bajpai', motherName: 'Kiran Bajpai', dob: '14/02/2009', contact: '922-233-3444' },
  { id: 'st15', rollNumber: '1203', name: 'Varun Reddy', className: 'Class 12-A', fatherName: 'Bhaskar Reddy', motherName: 'Kalyani Reddy', dob: '05/11/2009', contact: '933-344-4555' },
  { id: 'st16', rollNumber: '1204', name: 'Yash Vardhan', className: 'Class 12-A', fatherName: 'Harish Vardhan', motherName: 'Bela Vardhan', dob: '24/05/2009', contact: '944-455-5666' },
  { id: 'st17', rollNumber: '1205', name: 'Zoya Khan', className: 'Class 12-A', fatherName: 'Imran Khan', motherName: 'Sana Khan', dob: '19/12/2009', contact: '955-566-6777' },
  { id: 'st18', rollNumber: '1206', name: 'Sanya Malhotra', className: 'Class 12-A', fatherName: 'Rakesh Malhotra', motherName: 'Shashi Malhotra', dob: '12/07/2009', contact: '966-677-7888' },
];

export const CLASS_FEE_STRUCTURE: Record<string, number> = {
  'Class 1-A': 500,
  'Class 2-A': 600,
  'Class 3-A': 700,
  'Class 4-A': 800,
  'Class 5-A': 900,
  'Class 6-A': 1000,
  'Class 7-A': 1100,
  'Class 8-A': 1200,
  'Class 9-A': 1300,
  'Class 10-A': 1500,
  'Class 11-A': 1800,
  'Class 12-A': 2200,
};

// Autogenerate historical exam fees based on status
export const generateDefaultExamFees = (): ExamFeeRecord[] => {
  return SAMPLE_STUDENTS.map((student, index) => {
    const feeAmount = CLASS_FEE_STRUCTURE[student.className] || 1500;
    
    // Distribute paid, pending, and partial statuses
    let status: 'Paid' | 'Pending' | 'Partial' = 'Paid';
    let amountPaid = feeAmount;
    let receiptNumber: string | undefined = `REC-2026-${1000 + index}`;
    let paymentDate: string | undefined = '2026-05-10';

    if (index % 4 === 1) {
      status = 'Pending';
      amountPaid = 0;
      receiptNumber = undefined;
      paymentDate = undefined;
    } else if (index % 4 === 2) {
      status = 'Partial';
      amountPaid = feeAmount / 2;
      receiptNumber = `REC-2026-${1500 + index}`;
      paymentDate = '2026-05-12';
    }

    return {
      id: `fee-${student.id}`,
      studentId: student.id,
      rollNumber: student.rollNumber,
      studentName: student.name,
      className: student.className,
      amountDue: feeAmount,
      amountPaid,
      status,
      dueDate: '2026-06-15',
      receiptNumber,
      paymentDate,
    };
  });
};

// Pre-populate attendance records for previous 5 school days
export const generateDefaultAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const days = ['2026-05-13', '2026-05-14', '2026-05-15', '2026-05-18', '2026-05-19'];
  
  SAMPLE_STUDENTS.forEach((student) => {
    days.forEach((date, index) => {
      // High attendance rates, but some absentees
      let status: 'Present' | 'Absent' = 'Present';
      
      // Seeded logic to have realistic historical patterns
      const randVal = (student.rollNumber.charCodeAt(2) + index) % 10;
      if (randVal === 0 || (student.id === 'st4' && index === 2)) {
        status = 'Absent';
      }

      records.push({
        studentId: student.id,
        date,
        status,
      });
    });
  });

  return records;
};
