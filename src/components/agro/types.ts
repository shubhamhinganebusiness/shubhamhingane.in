export interface AgroSettings {
  shopName: string;
  ownerName: string;
  address: string;
  gstin: string;
  contact: string;
  upiId?: string;
  lowStockThreshold?: number;
  expiryWarningDays?: number;
  fertilizerLicense?: string;
  seedLicense?: string;
  insecticideLicense?: string;
  cottonLicense?: string;
  licenceNo?: string;
}

export type AgroRole = 'Admin' | 'Manager' | 'Cashier' | 'Viewer';

export interface AgroUser {
  uid: string;
  email: string;
  mobile: string;
  role: AgroRole;
  shopId: string;
}

export interface AgroBatch {
  id: string;
  productId: string;
  batchNumber: string;
  packageSize: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  mfgDate: string;
  expDate: string;
  createdAt: string;
}

export interface AgroProduct {
  id: string;
  name: string;
  sku?: string;
  manufacturer?: string;
  category: 'Seed' | 'Fertilizer' | 'Pesticide' | 'Tool' | 'Other';
  price: number;
  stock: number;
  unit: 'Kg' | 'Ltr' | 'Packet' | 'Unit' | 'Bag';
  imageUrl?: string;
  description?: string;
  usageInstructions?: string;
  reorderLevel?: number;
  batches?: AgroBatch[]; // Optional if we want to keep them nested or separate
}

export interface AgroCustomer {
  id: string;
  name: string;
  contact: string;
  village: string;
  gstin?: string;
  address?: string;
  aadharId?: string;
  openingBalance?: number;
  createdAt: string;
}

export interface AgroSupplier {
  id: string;
  name: string;
  contact: string;
  email?: string;
  village?: string;
  address?: string;
  gstin?: string;
  openingBalance?: number;
  createdAt: string;
}

export interface BillItem {
  productId: string;
  batchId?: string;
  name: string;
  companyName?: string;
  batchNumber?: string;
  expDate?: string;
  packageSize?: string;
  category: string;
  quantity: number;
  price: number; // selling price per unit
  gst?: number; // percentage
  cgst?: number; // amount
  sgst?: number; // amount
  total: number; // inclusive of GST
}

export interface AgroBill {
  id: string;
  invoiceNo: string;
  customerId: string | null;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerAadhar?: string;
  items: BillItem[];
  subtotal: number;
  totalGst: number;
  discount: number;
  hamali: number;
  totalAmount: number;
  totalInWords?: string;
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
  paymentMethod: 'Cash' | 'PhonePe' | 'GPay' | 'Card' | 'Credit' | 'Other';
  isEstimate?: boolean;
  date: string;
  time?: string;
  footerNote?: string;
  createdAt: string;
  shopDetails?: {
    name: string;
    address: string;
    owner: string;
    contact: string;
    gstin?: string;
    fertilizerLicense?: string;
    seedLicense?: string;
    insecticideLicense?: string;
    cottonLicense?: string;
    licenceNo?: string;
  };
}

export interface AgroPurchase {
  id: string;
  supplierId: string;
  supplierName: string;
  items: {
    productId: string;
    productName: string;
    batchNumber: string;
    qty: number;
    costPrice: number;
    expDate: string;
    packageSize: string;
  }[];
  date: string;
  totalAmount: number;
  createdAt: string;
}

export interface AgroDamage {
  id: string;
  productId: string;
  productName: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
  type?: 'Add' | 'Remove';
  reason: string;
  date: string;
  createdAt: string;
}

export interface AgroChallan {
  id: string;
  challanNo: string;
  partyId: string;
  partyName: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
  }[];
  date: string;
  createdAt: string;
}

export interface AgroTransaction {
  id: string;
  partyId: string; // Customer or Supplier ID
  partyType: 'Customer' | 'Supplier';
  type: 'Payment' | 'Receipt';
  amount: number;
  method: string;
  date: string;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

export interface AgroReturn {
  id: string;
  type: 'Sale' | 'Purchase';
  originalInvoiceNo: string;
  partyId: string;
  partyName: string;
  productId: string;
  productName: string;
  batchNumber: string;
  quantity: number;
  amount: number;
  reason: string;
  date: string;
  createdAt: string;
}

export interface AgroOrder {
  id: string;
  orderNo: string;
  type: 'Sale' | 'Purchase';
  partyId: string;
  partyName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
  totalAmount: number;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Delivered';
  date: string;
  deliveryDate?: string;
  createdAt: string;
}

export interface AgroEmployee {
  id: string;
  name: string;
  contact: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface AgroSalary {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  month: string; // e.g., "2024-05"
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paymentStatus: 'Paid' | 'Pending';
  date: string;
  createdAt: string;
}

export interface AgroState {
  settings: AgroSettings | null;
  products: AgroProduct[];
  customers: AgroCustomer[];
  suppliers: AgroSupplier[];
  bills: AgroBill[];
  purchases: AgroPurchase[];
  damages: AgroDamage[];
  challans: AgroChallan[];
  batches: AgroBatch[];
  returns: AgroReturn[];
  orders: AgroOrder[];
  employees: AgroEmployee[];
  salaries: AgroSalary[];
  transactions: AgroTransaction[];
  loading: boolean;
  userRole?: AgroRole;
}

export enum AgroCategory {
  SEED = 'Seed',
  FERTILIZER = 'Fertilizer',
  PESTICIDE = 'Pesticide',
  TOOL = 'Tool',
  OTHER = 'Other'
}

export enum PaymentStatus {
  PAID = 'Paid',
  PENDING = 'Pending',
  PARTIAL = 'Partial'
}
