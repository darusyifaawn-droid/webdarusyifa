import React, { useState, useMemo } from 'react';
import { 
  Coins, Search, Filter, Download, Printer, Plus, ArrowUpRight, 
  ArrowDownRight, Wallet, Calendar, Users, RefreshCw, Eye, CheckCircle, 
  FileSpreadsheet, ArrowUpDown, ChevronRight, AlertCircle, Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatRupiah } from '../../../lib/salaryUtils';
import { getPrintHeaderHTML, getPrintStyles, getPrintSignatureHTML } from '../../../lib/printUtils';

interface FinanceTabunganTabProps {
  payments: any[];
  allUsers: any[];
  schoolClasses: any[];
  onOpenTabunganModal: () => void;
  handlePrintReceipt: (payment: any) => void;
  settings?: any;
}

export default function FinanceTabunganTab({
  payments,
  allUsers,
  schoolClasses,
  onOpenTabunganModal,
  handlePrintReceipt,
  settings
}: FinanceTabunganTabProps) {
  // Date range state (Defaults to 1st of current month to today)
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [selectedClass, setSelectedClass] = useState<string>('Semua');
  const [selectedTxType, setSelectedTxType] = useState<string>('Semua'); // 'Semua' | 'tabungan' | 'tabungan_keluar'
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeView, setActiveView] = useState<'mutasi' | 'rekap_siswa'>('mutasi');

  // Quick Preset Handlers
  const handleSetPreset = (preset: 'today' | '7days' | 'this_month' | 'last_month' | 'this_year' | 'all') => {
    const now = new Date();
    if (preset === 'today') {
      const d = now.toISOString().split('T')[0];
      setStartDate(d);
      setEndDate(d);
    } else if (preset === '7days') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      setStartDate(past7.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'this_month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(first);
      setEndDate(last);
    } else if (preset === 'last_month') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const last = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      setStartDate(first);
      setEndDate(last);
    } else if (preset === 'this_year') {
      const first = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      const last = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
      setStartDate(first);
      setEndDate(last);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Helper map for students
  const studentMap = useMemo(() => {
    const map = new Map<string, any>();
    allUsers.forEach(u => map.set(u.id, u));
    return map;
  }, [allUsers]);

  // All active students
  const activeStudents = useMemo(() => {
    return allUsers.filter(u => {
      const isSiswa = u.role === 'siswa' || !u.role;
      const isAktif = (u.status || 'Aktif').toString().toLowerCase() === 'aktif';
      return isSiswa && isAktif;
    });
  }, [allUsers]);

  // All savings transactions (inflow & outflow)
  const allSavingsPayments = useMemo(() => {
    return payments.filter(p => {
      const isSavingTx = p.type === 'tabungan' || p.type === 'tabungan_keluar' || (p.type && p.type.includes('tabungan'));
      const isNotRejected = p.status !== 'rejected';
      return isSavingTx && isNotRejected;
    }).map(p => {
      const student = studentMap.get(p.studentId);
      
      // Parse transaction date
      let txDateStr = p.date || '';
      let txTimeStr = '';
      if (!txDateStr && p.createdAt) {
        try {
          const d = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
          txDateStr = d.toISOString().split('T')[0];
          txTimeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        } catch {
          txDateStr = '';
        }
      }

      const isOutflow = p.type === 'tabungan_keluar' || p.isExpense;
      const nominal = Number(p.amount) || 0;

      return {
        ...p,
        studentName: student?.name || p.studentName || 'Siswa',
        studentClass: student?.kelas || 'UTSMAN BIN AFFAN',
        currentSaving: student?.savings || 0,
        txDateStr,
        txTimeStr,
        isOutflow,
        nominal
      };
    });
  }, [payments, studentMap]);

  // Filtered savings transactions by date range, class, txType, search
  const filteredSavingsTransactions = useMemo(() => {
    return allSavingsPayments.filter(p => {
      // Date filter
      let matchDate = true;
      if (startDate && p.txDateStr) {
        matchDate = matchDate && p.txDateStr >= startDate;
      }
      if (endDate && p.txDateStr) {
        matchDate = matchDate && p.txDateStr <= endDate;
      }

      // Class filter
      let matchClass = true;
      if (selectedClass !== 'Semua') {
        const sK = (p.studentClass || '').toLowerCase();
        const selK = selectedClass.toLowerCase();
        if (selK.includes('utsman')) {
          matchClass = sK.includes('utsman');
        } else if (selK.includes('umar')) {
          matchClass = sK.includes('umar');
        } else {
          matchClass = sK === selK || sK.includes(selK);
        }
      }

      // Type filter
      let matchType = true;
      if (selectedTxType === 'tabungan') {
        matchType = !p.isOutflow;
      } else if (selectedTxType === 'tabungan_keluar') {
        matchType = p.isOutflow;
      }

      // Search term
      let matchSearch = true;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        matchSearch = 
          p.studentName.toLowerCase().includes(q) ||
          p.studentClass.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.id || '').toLowerCase().includes(q);
      }

      return matchDate && matchClass && matchType && matchSearch;
    }).sort((a, b) => (b.txDateStr || '').localeCompare(a.txDateStr || ''));
  }, [allSavingsPayments, startDate, endDate, selectedClass, selectedTxType, searchTerm]);

  // Stats calculation for the selected period
  const stats = useMemo(() => {
    let totalSetoran = 0;
    let countSetoran = 0;
    let totalPenarikan = 0;
    let countPenarikan = 0;

    filteredSavingsTransactions.forEach(p => {
      if (p.isOutflow) {
        totalPenarikan += p.nominal;
        countPenarikan++;
      } else {
        totalSetoran += p.nominal;
        countSetoran++;
      }
    });

    const netCashflow = totalSetoran - totalPenarikan;
    
    // Overall current savings balance of all active students
    const totalSaldoMengendap = activeStudents.reduce((acc, s) => acc + (Number(s.savings) || 0), 0);

    return {
      totalSetoran,
      countSetoran,
      totalPenarikan,
      countPenarikan,
      netCashflow,
      totalSaldoMengendap,
      totalTx: filteredSavingsTransactions.length
    };
  }, [filteredSavingsTransactions, activeStudents]);

  // Student-level summary for the selected period
  const studentSavingsSummary = useMemo(() => {
    return activeStudents.map(student => {
      const studentTxs = filteredSavingsTransactions.filter(p => p.studentId === student.id);
      const periodSetor = studentTxs.filter(p => !p.isOutflow).reduce((acc, curr) => acc + curr.nominal, 0);
      const periodTarik = studentTxs.filter(p => p.isOutflow).reduce((acc, curr) => acc + curr.nominal, 0);
      const periodNet = periodSetor - periodTarik;

      return {
        id: student.id,
        name: student.name,
        kelas: student.kelas || 'UTSMAN BIN AFFAN',
        periodSetor,
        periodTarik,
        periodNet,
        currentBalance: Number(student.savings) || 0,
        txCount: studentTxs.length
      };
    }).filter(s => {
      if (selectedClass !== 'Semua') {
        const sK = (s.kelas || '').toLowerCase();
        const selK = selectedClass.toLowerCase();
        if (selK.includes('utsman')) return sK.includes('utsman');
        if (selK.includes('umar')) return sK.includes('umar');
        return sK === selK || sK.includes(selK);
      }
      return true;
    }).filter(s => {
      if (searchTerm) {
        return s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.kelas.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    }).sort((a, b) => b.currentBalance - a.currentBalance);
  }, [activeStudents, filteredSavingsTransactions, selectedClass, searchTerm]);

  // Date range formatted label for display and reports
  const periodLabel = useMemo(() => {
    if (!startDate && !endDate) return 'Seluruh Periode (Semua Waktu)';
    if (startDate && endDate) {
      if (startDate === endDate) return `Tanggal ${startDate}`;
      return `${startDate} s.d. ${endDate}`;
    }
    if (startDate) return `Mulai ${startDate}`;
    return `Sampai ${endDate}`;
  }, [startDate, endDate]);

  // ===============================================================
  // EXPORT EXCEL RINCI SESUAI PERIODE WAKTU
  // ===============================================================
  const handleExportExcelRinci = () => {
    if (filteredSavingsTransactions.length === 0 && studentSavingsSummary.length === 0) {
      alert('Tidak ada data tabungan untuk diekspor pada periode ini.');
      return;
    }

    // Sheet 1: Mutasi Transaksi Rinci
    const mutasiRows = filteredSavingsTransactions.map((tx, idx) => ({
      'No': idx + 1,
      'Tanggal': tx.txDateStr || '-',
      'Waktu': tx.txTimeStr || '-',
      'ID Transaksi': tx.id || '-',
      'Nama Siswa': tx.studentName,
      'Kelas': tx.studentClass,
      'Jenis Mutasi': tx.isOutflow ? 'TARIK TABUNGAN' : 'SETOR TABUNGAN',
      'Setoran Masuk (Rp)': tx.isOutflow ? 0 : tx.nominal,
      'Penarikan Keluar (Rp)': tx.isOutflow ? tx.nominal : 0,
      'Saldo Akhir Siswa (Rp)': tx.currentSaving,
      'Metode': tx.method || 'Tunai',
      'Petugas / Admin': tx.adminName || 'Admin Keuangan',
      'Keterangan': tx.description || '-'
    }));

    // Add Summary Row at the end
    mutasiRows.push({
      'No': 'TOTAL',
      'Tanggal': periodLabel,
      'Waktu': '',
      'ID Transaksi': `${filteredSavingsTransactions.length} Transaksi`,
      'Nama Siswa': '',
      'Kelas': '',
      'Jenis Mutasi': 'TOTAL PERIODE',
      'Setoran Masuk (Rp)': stats.totalSetoran,
      'Penarikan Keluar (Rp)': stats.totalPenarikan,
      'Saldo Akhir Siswa (Rp)': stats.totalSaldoMengendap,
      'Metode': '',
      'Petugas / Admin': '',
      'Keterangan': `Arus Kas Bersih: ${formatRupiah(stats.netCashflow)}`
    } as any);

    // Sheet 2: Rekap Tabungan Siswa
    const rekapSiswaRows = studentSavingsSummary.map((s, idx) => ({
      'No': idx + 1,
      'Nama Siswa': s.name,
      'Kelas': s.kelas,
      'Total Setor Periode Ini (Rp)': s.periodSetor,
      'Total Tarik Periode Ini (Rp)': s.periodTarik,
      'Arus Bersih Periode (Rp)': s.periodNet,
      'Total Saldo Tabungan Saat Ini (Rp)': s.currentBalance,
      'Jumlah Mutasi': s.txCount
    }));

    const wb = XLSX.utils.book_new();

    const wsMutasi = XLSX.utils.json_to_sheet(mutasiRows);
    XLSX.utils.book_append_sheet(wb, wsMutasi, 'Mutasi_Tabungan_Rinci');

    const wsRekap = XLSX.utils.json_to_sheet(rekapSiswaRows);
    XLSX.utils.book_append_sheet(wb, wsRekap, 'Rekap_Saldo_Siswa');

    const filename = `Laporan_Tabungan_Rinci_RA_Darusyifa_${startDate || 'all'}_sd_${endDate || 'all'}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // ===============================================================
  // CETAK LAPORAN TABUNGAN PERIODE
  // ===============================================================
  const handlePrintLaporanTabungan = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak. Pastikan pop-up diizinkan.');
      return;
    }

    const rowsHTML = filteredSavingsTransactions.map((tx, idx) => `
      <tr>
        <td style="text-align: center; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${idx + 1}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${tx.txDateStr} ${tx.txTimeStr ? `<small style="color:#64748b;">${tx.txTimeStr}</small>` : ''}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700;">${tx.studentName}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${tx.studentClass}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; color: ${tx.isOutflow ? '#dc2626' : '#059669'};">
          ${tx.isOutflow ? 'TARIK (-)' : 'SETOR (+)'}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-weight: 700; color: ${tx.isOutflow ? '#dc2626' : '#059669'};">
          ${formatRupiah(tx.nominal)}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-weight: 700;">
          ${formatRupiah(tx.currentSaving)}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #475569;">${tx.description || '-'}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Tabungan Siswa - ${periodLabel}</title>
        <style>
          ${getPrintStyles()}
          @page { size: A4 portrait; margin: 12mm 15mm; }
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; line-height: 1.4; padding: 15px; }
          .summary-card-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0; }
          .s-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
          .s-card span { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; }
          .s-card strong { display: block; font-size: 13px; font-weight: 900; margin-top: 4px; color: #0f172a; }
          table.report-table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          table.report-table th { background: #f1f5f9; padding: 8px 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #334155; border-top: 2px solid #94a3b8; border-bottom: 2px solid #94a3b8; }
          .total-footer td { background: #f8fafc; font-weight: 800; padding: 8px; font-size: 11px; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; }
        </style>
      </head>
      <body>
        ${getPrintHeaderHTML('LAPORAN RINCIAN TABUNGAN SISWA')}
        
        <div style="text-align: center; margin-top: -15px; margin-bottom: 20px; font-size: 12px; color: #475569;">
          Periode Waktu: <strong>${periodLabel}</strong> &nbsp;|&nbsp; Kelas: <strong>${selectedClass}</strong>
        </div>

        <div class="summary-card-grid">
          <div class="s-card">
            <span>Total Setoran Masuk</span>
            <strong style="color: #059669;">${formatRupiah(stats.totalSetoran)}</strong>
            <small style="font-size: 9px; color: #64748b;">(${stats.countSetoran} Transaksi)</small>
          </div>
          <div class="s-card">
            <span>Total Penarikan Keluar</span>
            <strong style="color: #dc2626;">${formatRupiah(stats.totalPenarikan)}</strong>
            <small style="font-size: 9px; color: #64748b;">(${stats.countPenarikan} Transaksi)</small>
          </div>
          <div class="s-card">
            <span>Arus Bersih Periode</span>
            <strong style="color: #2563eb;">${formatRupiah(stats.netCashflow)}</strong>
            <small style="font-size: 9px; color: #64748b;">(Net Inflow)</small>
          </div>
          <div class="s-card">
            <span>Saldo Mengendap</span>
            <strong style="color: #0f172a;">${formatRupiah(stats.totalSaldoMengendap)}</strong>
            <small style="font-size: 9px; color: #64748b;">(${activeStudents.length} Siswa)</small>
          </div>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 5%;">No</th>
              <th style="width: 15%;">Tanggal</th>
              <th style="width: 22%;">Nama Siswa</th>
              <th style="width: 15%;">Kelas</th>
              <th style="width: 10%;">Mutasi</th>
              <th style="width: 13%; text-align: right;">Nominal</th>
              <th style="width: 13%; text-align: right;">Saldo Akhir</th>
              <th style="width: 7%;">Ket.</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
            <tr class="total-footer">
              <td colspan="5" style="text-align: right;"><strong>TOTAL SETORAN / PENARIKAN:</strong></td>
              <td style="text-align: right; color: #059669;"><strong>${formatRupiah(stats.totalSetoran)}</strong></td>
              <td style="text-align: right;"><strong>${formatRupiah(stats.totalSaldoMengendap)}</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>

        ${getPrintSignatureHTML('', 'Bendahara / Pengelola Tabungan', 'Kepala Sekolah RA Darusyifa')}

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-emerald-200 text-xs font-bold mb-3 border border-white/15">
              <Coins size={14} className="text-emerald-300" /> Tarik Data & Laporan Mutasi Tabungan Siswa
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Laporan Tabungan Rinci Per Periode
            </h2>
            <p className="text-sm text-emerald-100/80 font-medium mt-1 max-w-2xl">
              Tentukan rentang tanggal fleksibel (tanggal, bulan, tahun awal hingga akhir) untuk menarik mutasi setoran dan penarikan tabungan siswa secara transparan dan akurat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={onOpenTabunganModal}
              className="px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-2xl font-black text-xs transition-all flex items-center gap-2 shadow-lg active:scale-95"
            >
              <Plus size={16} /> Input Tabungan Siswa
            </button>
            <button
              onClick={handleExportExcelRinci}
              className="px-4 py-3 bg-white hover:bg-emerald-50 text-emerald-900 rounded-2xl font-black text-xs transition-all flex items-center gap-2 shadow-lg active:scale-95"
            >
              <FileSpreadsheet size={16} /> Tarik Excel Rinci
            </button>
            <button
              onClick={handlePrintLaporanTabungan}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs transition-all flex items-center gap-2 border border-white/20"
            >
              <Printer size={16} /> Cetak Laporan PDF
            </button>
          </div>
        </div>
      </div>

      {/* Date Range & Filter Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-emerald-600" size={20} />
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              Filter Rentang Waktu (Periode Penarikan Data)
            </h3>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Preset Cepat:</span>
            <button
              onClick={() => handleSetPreset('today')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg text-xs font-bold transition-all"
            >
              Hari Ini
            </button>
            <button
              onClick={() => handleSetPreset('7days')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg text-xs font-bold transition-all"
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={() => handleSetPreset('this_month')}
              className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black transition-all"
            >
              Bulan Ini
            </button>
            <button
              onClick={() => handleSetPreset('last_month')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg text-xs font-bold transition-all"
            >
              Bulan Lalu
            </button>
            <button
              onClick={() => handleSetPreset('this_year')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg text-xs font-bold transition-all"
            >
              Tahun Ini
            </button>
            <button
              onClick={() => handleSetPreset('all')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg text-xs font-bold transition-all"
            >
              Semua Waktu
            </button>
          </div>
        </div>

        {/* Date Inputs & Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Dari Tanggal (Mulai)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Sampai Tanggal (Selesai)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Pilih Kelas
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Kelas ({activeStudents.length} Siswa)</option>
              <option value="UTSMAN BIN AFFAN">UTSMAN BIN AFFAN</option>
              <option value="UMAR BIN KHATTAB">UMAR BIN KHATTAB</option>
            </select>
          </div>

          {/* Transaction Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Jenis Mutasi
            </label>
            <select
              value={selectedTxType}
              onChange={(e) => setSelectedTxType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Transaksi</option>
              <option value="tabungan">Setoran Masuk (+)</option>
              <option value="tabungan_keluar">Penarikan Keluar (-)</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Cari Nama / ID Siswa
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ketik nama siswa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards for Selected Date Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Setoran Masuk Periode</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2 tracking-tight">
            {formatRupiah(stats.totalSetoran)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-slate-500">
            <span>{stats.countSetoran} Kali Transaksi Setor</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Penarikan Keluar Periode</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2 tracking-tight">
            {formatRupiah(stats.totalPenarikan)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-slate-500">
            <span>{stats.countPenarikan} Kali Transaksi Tarik</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Arus Bersih Periode</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <ArrowUpDown size={18} />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 tracking-tight ${stats.netCashflow >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
            {formatRupiah(stats.netCashflow)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-2">Selisih Setor vs Tarik Periode</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Saldo Mengendap</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Wallet size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            {formatRupiah(stats.totalSaldoMengendap)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-2">Saldo aktif seluruh siswa</p>
        </div>
      </div>

      {/* View Switcher & Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Header with Tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('mutasi')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeView === 'mutasi'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Mutasi Transaksi Rinci ({filteredSavingsTransactions.length})
            </button>
            <button
              onClick={() => setActiveView('rekap_siswa')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeView === 'rekap_siswa'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Rekap Per Siswa ({studentSavingsSummary.length})
            </button>
          </div>

          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            Periode: <strong>{periodLabel}</strong>
          </span>
        </div>

        {/* =============================================================== */}
        {/* VIEW 1: MUTASI TRANSAKSI RINCI */}
        {/* =============================================================== */}
        {activeView === 'mutasi' && (
          filteredSavingsTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Coins size={28} />
              </div>
              <h4 className="text-base font-bold text-slate-800">Tidak Ada Mutasi Tabungan</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Tidak ditemukan transaksi tabungan pada periode {periodLabel}. Sesuaikan filter tanggal atau klik tombol input tabungan baru.
              </p>
              <button
                onClick={onOpenTabunganModal}
                className="mt-4 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md"
              >
                + Input Tabungan Sekarang
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4">No</th>
                    <th className="py-3.5 px-4">Tanggal & Waktu</th>
                    <th className="py-3.5 px-4">Siswa</th>
                    <th className="py-3.5 px-4">Kelas</th>
                    <th className="py-3.5 px-4 text-center">Jenis Mutasi</th>
                    <th className="py-3.5 px-4 text-right">Nominal</th>
                    <th className="py-3.5 px-4 text-right">Saldo Siswa</th>
                    <th className="py-3.5 px-4">Keterangan</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSavingsTransactions.map((tx, idx) => (
                    <tr key={tx.id || idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        <span>{tx.txDateStr}</span>
                        {tx.txTimeStr && (
                          <span className="text-[10px] text-slate-400 block font-normal">{tx.txTimeStr}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{tx.studentName}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {tx.studentClass}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          tx.isOutflow 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {tx.isOutflow ? '↓ Tarik Tabungan' : '↑ Setor Tabungan'}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 text-right font-black text-sm ${
                        tx.isOutflow ? 'text-rose-600' : 'text-emerald-700'
                      }`}>
                        {tx.isOutflow ? `-${formatRupiah(tx.nominal)}` : `+${formatRupiah(tx.nominal)}`}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                        {formatRupiah(tx.currentSaving)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium max-w-[200px] truncate">
                        {tx.description || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handlePrintReceipt(tx)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 mx-auto transition-colors"
                          title="Cetak Kuitansi Transaksi"
                        >
                          <Printer size={13} /> Kuitansi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* =============================================================== */}
        {/* VIEW 2: REKAP SALDO PER SISWA */}
        {/* =============================================================== */}
        {activeView === 'rekap_siswa' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">No</th>
                  <th className="py-3.5 px-4">Nama Siswa</th>
                  <th className="py-3.5 px-4">Kelas</th>
                  <th className="py-3.5 px-4 text-right">Setor (Periode Ini)</th>
                  <th className="py-3.5 px-4 text-right">Tarik (Periode Ini)</th>
                  <th className="py-3.5 px-4 text-right">Arus Bersih</th>
                  <th className="py-3.5 px-4 text-right">Saldo Tabungan Saat Ini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentSavingsSummary.map((s, idx) => (
                  <tr key={s.id || idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{s.kelas}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                      {s.periodSetor > 0 ? `+${formatRupiah(s.periodSetor)}` : 'Rp 0'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                      {s.periodTarik > 0 ? `-${formatRupiah(s.periodTarik)}` : 'Rp 0'}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold ${s.periodNet >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                      {formatRupiah(s.periodNet)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-black text-sm text-slate-900 bg-emerald-50 text-emerald-900 px-3 py-1 rounded-lg">
                        {formatRupiah(s.currentBalance)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
