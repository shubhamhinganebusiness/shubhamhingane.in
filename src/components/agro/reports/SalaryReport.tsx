import React, { useState } from 'react';
import { AgroState, AgroSalary } from '../types';
import { ReportLayout } from './ReportLayout';

export const SalaryReport: React.FC<{ state: AgroState }> = ({ state }) => {
  const [monthFilter, setMonthFilter] = useState('');

  const filteredData = (state.salaries || []).filter(item => {
    return !monthFilter || item.month === monthFilter;
  });

  const columns = [
    { header: 'Employee', accessor: 'employeeName' as const },
    { header: 'Dept', accessor: 'department' as const },
    { header: 'Month', accessor: 'month' as const },
    { header: 'Basic', accessor: (item: AgroSalary) => `₹${item.basicSalary.toLocaleString()}` },
    { header: 'Allowances', accessor: (item: AgroSalary) => `+₹${item.allowances.toLocaleString()}`, className: 'text-emerald-500' },
    { header: 'Deductions', accessor: (item: AgroSalary) => `-₹${item.deductions.toLocaleString()}`, className: 'text-red-500' },
    { header: 'Net Salary', accessor: (item: AgroSalary) => `₹${item.netSalary.toLocaleString()}`, className: 'font-black text-gray-900 dark:text-white', footer: (data: AgroSalary[]) => `Total: ₹${data.reduce((s, i) => s + i.netSalary, 0).toLocaleString()}` },
    { header: 'Status', accessor: (item: AgroSalary) => (
      <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${item.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
        {item.paymentStatus}
      </span>
    )}
  ];

  return (
    <ReportLayout 
      title="Staff Payroll & Remuneration Audit"
      data={filteredData}
      columns={columns}
      exportFileName="salary_report"
      filters={
        <input 
          type="month" 
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-[10px] font-black outline-none"
        />
      }
    />
  );
};
