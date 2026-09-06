import React, { useState, useMemo } from 'react';
import { 
  Download, Printer, Search, Filter, 
  ChevronLeft, ChevronRight, FileJson, 
  Table as TableIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  footer?: (data: T[]) => string | number;
}

interface ReportLayoutProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  filters?: React.ReactNode;
  summaryRow?: React.ReactNode;
  exportFileName?: string;
}

export function ReportLayout<T extends Record<string, any>>({ 
  title, 
  data, 
  columns, 
  filters,
  summaryRow,
  exportFileName = 'report'
}: ReportLayoutProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const [sortConfig, setSortConfig] = useState<{ key: string | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const exportToExcel = () => {
    // Prepare data for export
    const exportData = filteredData.map(item => {
      const row: any = {};
      columns.forEach(col => {
        if (typeof col.accessor === 'function') {
           // We can't really export React nodes easily, 
           // but we can try to extract text if it's simple
           row[col.header] = 'Complex Data'; 
        } else {
           row[col.header] = item[col.accessor];
        }
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${exportFileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF() as any;
    doc.text(title, 14, 15);
    
    const tableHeaders = columns.map(c => c.header);
    const tableBody = filteredData.map(item => 
      columns.map(col => {
        if (typeof col.accessor === 'function') return '-';
        return String(item[col.accessor]);
      })
    );

    doc.autoTable({
      head: [tableHeaders],
      body: tableBody,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 0, 0] }
    });

    doc.save(`${exportFileName}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    const exportData = filteredData.map(item => {
      const row: any = {};
      columns.forEach(col => {
        if (typeof col.accessor === 'string') {
          row[col.header] = item[col.accessor];
        } else {
          row[col.header] = '-';
        }
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exportFileName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic">{title}</h3>
           <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Generated: {new Date().toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportToCSV}
            className="px-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black hover:text-white transition-all shadow-sm"
          >
            <Download size={14} /> CSV
          </button>
          <button 
            onClick={exportToExcel}
            className="px-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black hover:text-white transition-all shadow-sm"
          >
            <FileJson size={14} /> Excel
          </button>
          <button 
            onClick={exportToPDF}
            className="px-4 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary transition-all shadow-lg"
          >
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
           <div className="relative flex-1">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
             <input 
               type="text" 
               placeholder="Full text search within results..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl pl-16 pr-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
             />
           </div>
           {filters && (
             <div className="flex flex-wrap items-center gap-4">
                {filters}
             </div>
           )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50 dark:border-gray-800">
                {columns.map((col, i) => (
                  <th 
                    key={i} 
                    onClick={() => typeof col.accessor === 'string' && requestSort(col.accessor as string)}
                    className={`px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest ${col.className} ${typeof col.accessor === 'string' ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {col.header}
                      {typeof col.accessor === 'string' && sortConfig.key === col.accessor && (
                        <span className="text-primary">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {paginatedData.map((item, ri) => (
                <tr key={ri} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all">
                  {columns.map((col, ci) => (
                    <td key={ci} className={`px-4 py-5 text-xs font-bold text-gray-700 dark:text-gray-300 ${col.className}`}>
                      {typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))}
              {summaryRow}
            </tbody>
            {filteredData.length > 0 && columns.some(c => c.footer) && (
               <tfoot>
                 <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                   {columns.map((col, i) => (
                     <td key={i} className={`px-4 py-5 text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight italic ${col.className}`}>
                       {col.footer ? col.footer(filteredData) : ''}
                     </td>
                   ))}
                 </tr>
               </tfoot>
            )}
          </table>
          {filteredData.length === 0 && (
             <div className="py-20 text-center">
               <TableIcon size={48} className="mx-auto text-gray-100 mb-4" />
               <p className="text-sm font-bold text-gray-400 italic">No records found for the selected filters.</p>
             </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-10">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
               Showing {((currentPage-1)*itemsPerPage)+1}-{Math.min(currentPage*itemsPerPage, filteredData.length)} of {filteredData.length} entries
             </p>
             <div className="flex items-center gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-400 disabled:opacity-30 hover:bg-black hover:text-white transition-all shadow-sm"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-1">
                   {Array.from({ length: totalPages }).map((_, i) => (
                     <button 
                       key={i}
                       onClick={() => setCurrentPage(i + 1)}
                       className={`w-10 h-10 rounded-xl text-[10px] font-black uppercase transition-all ${currentPage === i + 1 ? 'bg-black text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-gray-100'}`}
                     >
                       {i + 1}
                     </button>
                   ))}
                </div>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-400 disabled:opacity-30 hover:bg-black hover:text-white transition-all shadow-sm"
                >
                  <ChevronRight size={18} />
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
