import { Timestamp } from 'firebase/firestore';

export interface FurnitureProduct {
  id: string;
  sku: string;
  name: string;
  category: 'Furniture' | 'Electronics';
  subcategory: string;
  variant: string;
  price: number;
  costPrice: number;
  showroomStock: number;
  warehouseStock: number;
  minStockLevel: number;
  gst: number;
  supplierId: string;
  images: string[];
  specs: Record<string, string>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FurnitureSupplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin?: string;
  address: string;
  category: 'Manufacturer' | 'Wholesaler' | 'Assembler';
  rating: number;
}

export interface FurnitureBill {
  id: string;
  billNumber: string;
  customerName: string;
  customerPhone: string;
  items: FurnitureBillItem[];
  subtotal: number;
  totalGst: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'wallet';
  status: 'paid' | 'partial' | 'cancelled';
  storeId: string;
  timestamp: Timestamp;
  deliveryDate?: Timestamp;
}

export interface FurnitureBillItem {
  productId: string;
  name: string;
  sku: string;
  variant: string;
  price: number;
  quantity: number;
  gst: number;
}

export interface FurnitureExpense {
  id: string;
  category: 'Rent' | 'Electricity' | 'Staff' | 'Marketing' | 'Maintenance' | 'Other';
  amount: number;
  description: string;
  date: Timestamp;
  storeId: string;
}

export interface FurnitureRawMaterial {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  unit: string;
  minStockLevel: number;
  lastPurchasePrice: number;
  storeId: string;
}

export interface FurnitureState {
  products: FurnitureProduct[];
  suppliers: FurnitureSupplier[];
  bills: FurnitureBill[];
  loading: boolean;
  error: string | null;
}
