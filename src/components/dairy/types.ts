export interface DairySettings {
  dairyName: string;
  ownerName: string;
  cowRate: number;
  buffaloRate: number;
}

export interface Farmer {
  id?: string;
  uniqueId: string;
  name: string;
  contact: string;
  milkType: 'Cow' | 'Buffalo';
}

export interface MilkCollection {
  id?: string;
  farmerId: string;
  farmerName: string;
  uniqueId: string;
  quantity: number;
  fat: number;
  snf: number;
  rate: number;
  amount: number;
  shift: 'Morning' | 'Evening';
  date: string;
  timestamp: any;
}
