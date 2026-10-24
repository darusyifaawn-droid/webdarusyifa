import React, { useState, useMemo } from 'react';
import { 
  X, Download, Printer, FileSpreadsheet, Calendar, 
  Filter, Search, Users, Wallet, Coins, ArrowUpDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getPrintHeaderHTML, getPrintStyles } from '../../../lib/printUtils';

interface TabunganMonthlyMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStudents: any[];
  allSavingsPayments: any[];
  schoolClasses?: string[];
}

export default function TabunganMonthlyMatrixModal({
  isOpen,
  onClose,
  activeStudents,
  allSavingsPayments,
  schoolClasses = ['UTSMAN BIN AFFAN', 'ALI BIN ABI THALIB']
}: TabunganMonthlyMatrixModalProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(() => currentDate.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(() => currentDate.getFullYear());
  const [selectedClass, setSelectedClass] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Number of days in the selected month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  // Month prefix in 'YYYY-MM' format
  const monthPrefix = useMemo(() => {
    return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  }, [selectedYear, selectedMonth]);

  // Build matrix data per student
  const matrixData = useMemo(() => {
    // Filter students by class and search term
    const filteredStudents = activeStudents.filter(student => {
      const matchClass = selectedClass === 'Semua' || (student.kelas || '').toLowerCase() === selectedClass.toLowerCase();
      const matchSearch = !searchTerm || (student.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchClass && matchSearch;
    });

    // Map each student with their daily transactions for this month
    return filteredStudents.map(student => {
      const studentId = student.id || student.uid;
      const dailyDeposits: Record<number, number> = {};
      const dailyWithdrawals: Record<number, number> = {};

      // Filter all savings payments for this student in the selected month
      allSavingsPayments.forEach(pay => {
        if (pay.studentId !== studentId) return;
        const txDate = pay.txDateStr || '';
        if (!txDate.startsWith(monthPrefix)) return;

        // Extract day
        const dayNum = parseInt(txDate.split('-')[2], 10);
        if (isNaN(dayNum) || dayNum < 1 || dayNum > daysInMonth) return;

        const nominal = Number(pay.amount || pay.nominal) || 0;
        if (pay.isOutflow) {
          dailyWithdrawals[dayNum] = (dailyWithdrawals[dayNum] || 0) + nominal;
        } else {
          dailyDeposits[dayNum] = (dailyDeposits[dayNum] || 0) + nominal;
        }
      });

      // Calculate totals
      let totalDepositThisMonth = 0;
      let totalWithdrawThisMonth = 0;
      const netDaily: Record<number, number> = {};

      for (let d = 1; d <= daysInMonth; d++) {
        const dep = dailyDeposits[d] || 0;
        const wdr = dailyWithdrawals[d] || 0;
        totalDepositThisMonth += dep;
        totalWithdrawThisMonth += wdr;
        netDaily[d] = dep - wdr;
      }

      return {
        id: studentId,
        name: student.name || 'Siswa',
        kelas: student.kelas || '-',
        currentSavings: Number(student.savings) || 0,
        dailyDeposits,
        dailyWithdrawals,
        netDaily,
        totalDepositThisMonth,
        totalWithdrawThisMonth,
        netThisMonth: totalDepositThisMonth - totalWithdrawThisMonth
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeStudents, allSavingsPayments, selectedClass, searchTerm, monthPrefix, daysInMonth]);

  // Calculate day-by-day totals for footer summary
  const dailyTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    daysArray.forEach(d => {
      totals[d] = matrixData.reduce((sum, row) => sum + (row.netDaily[d] || 0), 0);
    });
    return totals;
  }, [matrixData, daysArray]);

  const grandTotalDeposit = useMemo(() => {
    return matrixData.reduce((sum, row) => sum + row.totalDepositThisMonth, 0);
  }, [matrixData]);

  const grandTotalWithdraw = useMemo(() => {
    return matrixData.reduce((sum, row) => sum + row.totalWithdrawThisMonth, 0);
  }, [matrixData]);

  const grandNetThisMonth = grandTotalDeposit - grandTotalWithdraw;

  const grandTotalSavings = useMemo(() => {
    return matrixData.reduce((sum, row) => sum + row.currentSavings, 0);
  }, [matrixData]);

  // Export to Excel in exact requested format: Kolom Nama Semua Siswa & Kolom Tanggal 1-30/31
  const handleExportExcelMatrix = () => {
    if (matrixData.length === 0) {
      alert('Tidak ada data siswa untuk diekspor.');
      return;
    }

    const monthName = monthNames[selectedMonth - 1];
    const aoa: any[][] = [];

    // Header Metadata
    aoa.push([`LAPORAN REKAPITULASI TABUNGAN SISWA PER BULAN (TGL 1 - ${daysInMonth})`]);
    aoa.push([`Lembaga: RA Darusyifa Arjawinangun`, '', `Periode: Bulan ${monthName} ${selectedYear}`, '', `Kelas: ${selectedClass}`]);
    aoa.push([`Tanggal Unduh: ${new Date().toLocaleString('id-ID')}`]);
    aoa.push([]); // blank line

    // Table Header Row
    const tableHeader: any[] = ['No', 'Nama Siswa', 'Kelas'];
    for (let d = 1; d <= daysInMonth; d++) {
      tableHeader.push(`Tgl ${d}`);
    }
    tableHeader.push(
      `Total Setor (${monthName})`,
      `Total Tarik (${monthName})`,
      `Net Mutasi (${monthName})`,
      'Saldo Akhir Siswa'
    );
    aoa.push(tableHeader);

    // Student Data Rows
    matrixData.forEach((row, idx) => {
      const rowArr: any[] = [idx + 1, row.name, row.kelas];
      for (let d = 1; d <= daysInMonth; d++) {
        const netVal = row.netDaily[d] || 0;
        rowArr.push(netVal);
      }
      rowArr.push(
        row.totalDepositThisMonth,
        row.totalWithdrawThisMonth,
        row.netThisMonth,
        row.currentSavings
      );
      aoa.push(rowArr);
    });

    // Summary Total Row
    const summaryRow: any[] = ['', 'TOTAL KAS TABUNGAN', ''];
    for (let d = 1; d <= daysInMonth; d++) {
      summaryRow.push(dailyTotals[d] || 0);
    }
    summaryRow.push(
      grandTotalDeposit,
      grandTotalWithdraw,
      grandNetThisMonth,
      grandTotalSavings
    );
    aoa.push(summaryRow);

    // Create Worksheet & Workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Set column widths
    const colWidths = [
      { wch: 5 },   // No
      { wch: 28 },  // Nama Siswa
      { wch: 18 },  // Kelas
      ...Array.from({ length: daysInMonth }, () => ({ wch: 11 })), // Tgl 1 - Tgl 30/31
      { wch: 18 },  // Total Setor
      { wch: 18 },  // Total Tarik
      { wch: 18 },  // Net Mutasi
      { wch: 20 }   // Saldo Akhir
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, `Tabungan_${monthName}`);
    const fileName = `Rekap_Tabungan_Bulanan_${monthName}_${selectedYear}_${selectedClass.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Print Preview
  const handlePrintMatrix = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak. Pastikan pop-up diizinkan di browser Anda.');
      return;
    }

    const monthName = monthNames[selectedMonth - 1];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rekap Tabungan Bulanan - ${monthName} ${selectedYear}</title>
        <style>
          ${getPrintStyles()}
          @page { size: A3 landscape; margin: 10mm; }
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; font-size: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9px; }
          th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right; }
          th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
          td.left { text-align: left; }
          td.center { text-align: center; }
          tr.total-row { font-weight: bold; background-color: #e2e8f0; }
        </style>
      </head>
      <body>
        ${getPrintHeaderHTML(`REKAPITULASI TABUNGAN SISWA BULAN ${monthName.toUpperCase()} ${selectedYear}`)}
        <div style="margin-bottom: 8px; font-size: 11px;">
          <strong>Kelas:</strong> ${selectedClass} &nbsp;|&nbsp; <strong>Total Santri:</strong> ${matrixData.length} Anak
        </div>
        <table>
          <thead>
            <tr>
              <th rowspan="2" style="width: 25px;">No</th>
              <th rowspan="2" style="width: 150px;">Nama Siswa</th>
              <th rowspan="2" style="width: 80px;">Kelas</th>
              <th colspan="${daysInMonth}">Tanggal (Bulan ${monthName})</th>
              <th rowspan="2" style="width: 75px;">Total Setor</th>
              <th rowspan="2" style="width: 75px;">Total Tarik</th>
              <th rowspan="2" style="width: 80px;">Saldo Akhir</th>
            </tr>
            <tr>
              ${daysArray.map(d => `<th style="width: 25px;">${d}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${matrixData.map((row, idx) => `
              <tr>
                <td class="center">${idx + 1}</td>
                <td class="left"><strong>${row.name}</strong></td>
                <td class="center">${row.kelas}</td>
                ${daysArray.map(d => {
                  const val = row.netDaily[d] || 0;
                  return `<td>${val > 0 ? val.toLocaleString('id-ID') : val < 0 ? `<span style="color:red;">${val.toLocaleString('id-ID')}</span>` : '-'}</td>`;
                }).join('')}
                <td style="color:#059669; font-weight:bold;">${row.totalDepositThisMonth.toLocaleString('id-ID')}</td>
                <td style="color:#dc2626;">${row.totalWithdrawThisMonth.toLocaleString('id-ID')}</td>
                <td style="font-weight:bold;">${row.currentSavings.toLocaleString('id-ID')}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3" class="center">TOTAL HARIAN</td>
              ${daysArray.map(d => `<td>${(dailyTotals[d] || 0) > 0 ? (dailyTotals[d] || 0).toLocaleString('id-ID') : '-'}</td>`).join('')}
              <td>${grandTotalDeposit.toLocaleString('id-ID')}</td>
              <td>${grandTotalWithdraw.toLocaleString('id-ID')}</td>
              <td>${grandTotalSavings.toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (!isOpen) return null;

  const currentMonthName = monthNames[selectedMonth - 1];

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-7xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col text-slate-800">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-5 sm:p-6 relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                <FileSpreadsheet size={24} className="text-yellow-300" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                  Laporan Rekapitulasi Rinci
                </span>
                <h3 className="text-lg sm:text-2xl font-black tracking-tight">
                  Matriks Tabungan Siswa (Tgl 1 - {daysInMonth})
                </h3>
                <p className="text-xs text-emerald-100/80 font-medium mt-0.5">
                  Tarik data tabungan lengkap per bulan dengan kolom tanggal 1 sampai {daysInMonth} untuk semua siswa
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handlePrintMatrix}
                className="px-3.5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-sm border border-white/20"
              >
                <Printer size={15} />
                <span>Cetak (A3)</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcelMatrix}
                className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
              >
                <Download size={16} />
                <span>Tarik Data Excel (.xlsx)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Filter Bulan */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar size={14} className="text-emerald-600" />
              <span className="text-[11px] font-bold text-slate-500">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>{name}</option>
                ))}
              </select>
            </div>

            {/* Filter Tahun */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027, 2028].map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Filter Kelas */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              <Filter size={14} className="text-emerald-600" />
              <span className="text-[11px] font-bold text-slate-500">Kelas:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer"
              >
                <option value="Semua">Semua Kelas</option>
                {schoolClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {/* Search Student */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama santri..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-56"
              />
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 font-bold">
              Total Siswa: <strong className="text-slate-900">{matrixData.length}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-bold">
              Setoran {currentMonthName}: <strong>Rp {grandTotalDeposit.toLocaleString('id-ID')}</strong>
            </span>
          </div>
        </div>

        {/* Matrix Table Body */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-2 w-8 text-center sticky left-0 z-20 bg-slate-100">No</th>
                  <th className="py-3 px-3 min-w-[160px] sticky left-8 z-20 bg-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    Nama Siswa
                  </th>
                  <th className="py-3 px-2 min-w-[110px] text-center">Kelas</th>
                  
                  {/* Days 1 to 30/31 Header */}
                  {daysArray.map(d => (
                    <th key={d} className="py-2.5 px-1.5 text-center min-w-[58px] border-l border-slate-200/80">
                      Tgl {d}
                    </th>
                  ))}

                  <th className="py-3 px-3 text-right min-w-[110px] border-l-2 border-slate-300 bg-emerald-50 text-emerald-900">
                    Total Setor
                  </th>
                  <th className="py-3 px-3 text-right min-w-[100px] bg-rose-50 text-rose-900">
                    Total Tarik
                  </th>
                  <th className="py-3 px-3 text-right min-w-[110px] bg-indigo-50 text-indigo-900">
                    Net Sebulan
                  </th>
                  <th className="py-3 px-3 text-right min-w-[120px] bg-slate-200/60 text-slate-900">
                    Saldo Akhir
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {matrixData.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-2 px-2 text-center text-slate-400 font-bold sticky left-0 z-10 bg-white group-hover:bg-slate-50">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 sticky left-8 z-10 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)] truncate max-w-[200px]">
                      {row.name}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-600">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100">
                        {row.kelas}
                      </span>
                    </td>

                    {/* Daily Deposit Cells */}
                    {daysArray.map(d => {
                      const netVal = row.netDaily[d] || 0;
                      return (
                        <td 
                          key={d} 
                          className={`py-2 px-1 text-right border-l border-slate-100 text-[11px] font-mono ${
                            netVal > 0 
                              ? 'text-emerald-700 font-bold bg-emerald-50/40' 
                              : netVal < 0 
                              ? 'text-rose-600 font-bold bg-rose-50/40' 
                              : 'text-slate-300'
                          }`}
                        >
                          {netVal !== 0 ? netVal.toLocaleString('id-ID') : '-'}
                        </td>
                      );
                    })}

                    <td className="py-2 px-3 text-right font-black text-emerald-700 border-l-2 border-slate-300 bg-emerald-50/40 font-mono">
                      Rp {row.totalDepositThisMonth.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-rose-600 bg-rose-50/40 font-mono">
                      {row.totalWithdrawThisMonth > 0 ? `Rp ${row.totalWithdrawThisMonth.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-indigo-700 bg-indigo-50/40 font-mono">
                      Rp {row.netThisMonth.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 text-right font-black text-slate-900 bg-slate-50 font-mono">
                      Rp {row.currentSavings.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}

                {matrixData.length === 0 && (
                  <tr>
                    <td colSpan={daysInMonth + 7} className="py-16 text-center text-slate-400 font-medium">
                      Tidak ada data santri yang sesuai filter.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Summary Footer Row */}
              {matrixData.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-300 font-black text-slate-800 text-[11px]">
                    <td className="py-3 px-2 text-center sticky left-0 z-20 bg-slate-100">#</td>
                    <td className="py-3 px-3 sticky left-8 z-20 bg-slate-100 uppercase tracking-wider">
                      TOTAL PER HARI
                    </td>
                    <td className="py-3 px-2 text-center">-</td>

                    {/* Daily Totals */}
                    {daysArray.map(d => {
                      const dayTotal = dailyTotals[d] || 0;
                      return (
                        <td 
                          key={d} 
                          className={`py-3 px-1 text-right border-l border-slate-200 font-mono ${
                            dayTotal > 0 ? 'text-emerald-800 font-black' : 'text-slate-400'
                          }`}
                        >
                          {dayTotal > 0 ? dayTotal.toLocaleString('id-ID') : '-'}
                        </td>
                      );
                    })}

                    <td className="py-3 px-3 text-right border-l-2 border-slate-300 bg-emerald-100/70 text-emerald-950 font-mono">
                      Rp {grandTotalDeposit.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right bg-rose-100/70 text-rose-950 font-mono">
                      Rp {grandTotalWithdraw.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right bg-indigo-100/70 text-indigo-950 font-mono">
                      Rp {grandNetThisMonth.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right bg-slate-200 text-slate-950 font-mono">
                      Rp {grandTotalSavings.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Modal Footer Info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <div>
            💡 <strong>Info Format:</strong> Setiap kolom tanggal 1 sampai {daysInMonth} berisi nominal setoran pada tanggal tersebut. Klik tombol <strong>Tarik Data Excel (.xlsx)</strong> untuk mengunduh rekapitulasi rapi ini.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-black transition-colors cursor-pointer self-start sm:self-auto"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
