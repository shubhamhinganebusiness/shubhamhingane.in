import React, { useState } from 'react';
import { 
  FileText, TrendingUp, BarChart, RotateCcw, 
  ShieldAlert, ShoppingCart, Truck, CreditCard, 
  Users, DollarSign, Download, Printer, Search,
  Calendar, ChevronRight, LayoutGrid, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AgroState } from './types';

// Report components (we will build these)
import { SalePurchaseReport } from './reports/SalePurchaseReport';
import { DateWiseSalesReport } from './reports/DateWiseSalesReport';
import { CategorySalesReport } from './reports/CategorySalesReport';
import { CustomerSalesReport } from './reports/CustomerSalesReport';
import { ReturnsReport } from './reports/ReturnsReport';
import { DamageReport } from './reports/DamageReport';
import { OrdersReport } from './reports/OrdersReport';
import { ChallanReport } from './reports/ChallanReport';
import { SalaryReport } from './reports/SalaryReport';
import { PaymentReceiptReport } from './reports/PaymentReceiptReport';
import { CustomerPaymentHistory } from './reports/CustomerPaymentHistory';

export const ReportsTab: React.FC<{ state: AgroState }> = ({ state }) => {
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const reports = [
    { id: 'sale-purchase', title: 'Sale & Purchase', desc: 'Unified view of inventory turnover', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'date-sales', title: 'Date-wise Sales', desc: 'Performance analytics over time', icon: BarChart, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'category-sales', title: 'Category Sales', desc: 'Breakdown by product types', icon: LayoutGrid, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'customer-sales', title: 'Customer Sales', desc: 'Top party revenue analysis', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'returns', title: 'Returns Log', desc: 'Sale & purchase returns tracking', icon: RotateCcw, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'damages', title: 'Damage & Expiry', desc: 'Stock depletion & loss analysis', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'orders', title: 'Pending Orders', desc: 'Sales & purchase order tracking', icon: ShoppingCart, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'challans', title: 'Manual Challans', desc: 'Product movement documentation', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'salary', title: 'Payroll Summary', desc: 'Employee salary & deductions', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'vouchers', title: 'Payment & Receipt', desc: 'Financial cashflow statement', icon: CreditCard, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'cust-ledger', title: 'Customer Ledger', desc: 'Detailed credit & payment history', icon: Users, color: 'text-pink-500', bg: 'bg-pink-50' },
  ];

  if (activeReport) {
    const report = reports.find(r => r.id === activeReport);
    return (
      <div className="space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setActiveReport(null)}
            className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors"
          >
            <ChevronRight className="rotate-180" size={16} /> Back to Reports Hub
          </button>
          <div className="flex items-center gap-4">
             <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${report?.color} ${report?.bg}`}>
               {report?.title}
             </span>
          </div>
        </div>

        {activeReport === 'sale-purchase' && <SalePurchaseReport state={state} />}
        {activeReport === 'date-sales' && <DateWiseSalesReport state={state} />}
        {activeReport === 'category-sales' && <CategorySalesReport state={state} />}
        {activeReport === 'customer-sales' && <CustomerSalesReport state={state} />}
        {activeReport === 'returns' && <ReturnsReport state={state} />}
        {activeReport === 'damages' && <DamageReport state={state} />}
        {activeReport === 'orders' && <OrdersReport state={state} />}
        {activeReport === 'challans' && <ChallanReport state={state} />}
        {activeReport === 'salary' && <SalaryReport state={state} />}
        {activeReport === 'vouchers' && <PaymentReceiptReport state={state} />}
        {activeReport === 'cust-ledger' && <CustomerPaymentHistory state={state} />}
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight italic uppercase italic">Business <span className="text-primary italic">Intelligence</span></h2>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Deep dive into your operational data & insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, i) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setActiveReport(report.id)}
            className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
              <report.icon size={120} className={report.color} strokeWidth={1} />
            </div>
            
            <div className={`p-4 ${report.bg} w-fit rounded-2xl mb-8 ${report.color} transition-transform group-hover:scale-110`}>
              <report.icon size={24} />
            </div>
            
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2 flex items-center justify-between">
              {report.title}
              <ChevronRight size={18} className="text-gray-200 group-hover:text-primary transition-colors" />
            </h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{report.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Summary Section */}
      <div className="bg-black text-white p-12 rounded-[3.5rem] mt-12 grid grid-cols-1 md:grid-cols-3 gap-12 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10">
           <LayoutGrid size={240} />
         </div>
         <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Total Revenue</p>
            <p className="text-4xl font-black italic tracking-tighter uppercase">₹{state.bills.reduce((s, b) => s + b.totalAmount, 0).toLocaleString()}</p>
         </div>
         <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Invoiced Items</p>
            <p className="text-4xl font-black italic tracking-tighter uppercase">{state.bills.reduce((s, b) => s + b.items.length, 0)}</p>
         </div>
         <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Active Parties</p>
            <p className="text-4xl font-black italic tracking-tighter uppercase">{state.customers.length + state.suppliers.length}</p>
         </div>
      </div>
    </div>
  );
};
