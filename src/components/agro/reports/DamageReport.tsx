import React from 'react';
import { AgroState, AgroDamage } from '../types';
import { ReportLayout } from './ReportLayout';

export const DamageReport: React.FC<{ state: AgroState }> = ({ state }) => {
  const columns = [
    { header: 'Date', accessor: 'date' as const },
    { header: 'Product Name', accessor: 'productName' as const },
    { header: 'Batch', accessor: 'batchNumber' as const },
    { header: 'Qty Damaged', accessor: 'quantity' as const, className: 'text-center' },
    { header: 'Reason', accessor: 'reason' as const, className: 'italic text-gray-400' },
    { header: 'Est. Loss', accessor: (item: any) => '₹0', footer: () => 'Analysis TBD' }
  ];

  return (
    <ReportLayout 
      title="Stock Depletion & Damage Registry"
      data={state.damages}
      columns={columns}
      exportFileName="damage_report"
    />
  );
};
