import { Timestamp } from 'firebase/firestore';

export type UserRole = 'SuperAdmin' | 'MessOwner' | 'Member' | 'Doctor' | 'Pharmacy' | 'AgroAdmin';

export interface MessUser {
  uid: string;
  email: string;
  name: string;
  role: 'SuperAdmin' | 'MessOwner';
  status: 'Active' | 'Blocked';
  messName?: string;
  tenantId?: string; // Equivalent to messId
  mobile?: string;
  createdAt: Timestamp;
}

export interface MessMember {
  id: string;
  tenantId: string;
  name: string;
  roomNo: string;
  mobile: string;
  joinDate: string;
  monthlyFee: number;
  status: 'Active' | 'Left';
  balance: number;
}

export interface MealAttendance {
  id: string;
  tenantId: string;
  memberId: string;
  date: string; // ISO Date YYYY-MM-DD
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  isExtra?: boolean;
}

export interface MessBill {
  id: string;
  tenantId: string;
  memberId: string;
  month: number; // 0-11
  year: number;
  baseFee: number;
  extraMealsCount: number;
  extraMealsCharge: number;
  totalAmount: number;
  paidAmount: number;
  status: 'Unpaid' | 'Partial' | 'Paid';
  generatedAt: Timestamp;
}

export interface MessPayment {
  id: string;
  tenantId: string;
  memberId: string;
  amount: number;
  date: Timestamp;
  method: 'Cash' | 'Online';
  remark?: string;
}

export interface MessStaff {
  id: string;
  tenantId: string;
  name: string;
  role: string;
  mobile: string;
  salary: number;
  joinDate: string;
  status: 'Active' | 'On Leave' | 'Inactive';
}

export interface MessInventoryItem {
  id: string;
  tenantId: string;
  itemName: string;
  category: string;
  currentStock: number;
  unit: string; // kg, ltr, pcs, etc.
  minimumLevel: number;
  lastPurchasePrice: number;
}

export interface MessVendor {
  id: string;
  tenantId: string;
  name: string;
  category: string; // Groceries, Vegetables, Dairy, etc.
  mobile: string;
  address: string;
  balance: number;
}

export interface MessExpense {
  id: string;
  tenantId: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  paymentMethod: string;
}

export interface MessMenu {
  id: string; // Usually a day of week or generic ID
  tenantId: string;
  day: string; // Monday, Tuesday, etc.
  breakfast: string;
  lunch: string;
  dinner: string;
}
