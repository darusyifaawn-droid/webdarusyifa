import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  Trash2, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Download,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar as CalendarIcon,
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { handleFirestoreError, OperationType } from '../../../lib/firestoreUtils';
import * as XLSX from 'xlsx';

interface FinanceArusTabProps {
  payments: any[];
  allUsers: any[];
  user: any;
}

export default function FinanceArusTab({ payments, allUsers, user }: FinanceArusTabProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income_all' | 'income_iuran' | 'income_manual' | 'expense'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // Pagination State - 10 items per page by default
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick categories
  const expenseCategories = ['Sewa Tanah', 'Listrik & Air', 'ATK & Cetak', 'Gaji & Honor', 'Perawatan Gedung', 'Kegiatan & Acara', 'Konsumsi', 'Akomodasi', 'Lainnya'];
  const incomeCategories = ['Infaq & Donasi', 'Bantuan Operasional', 'Sponsorship', 'Usaha Sekolah', 'Lainnya'];

  useEffect(() => {
    const q = query(
      collection(db, 'finance_transactions'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'finance_transactions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !date) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'finance_transactions'), {
        amount: Number(amount),
        type,
        category: category || (type === 'income' ? 'Pemasukan Lainnya' : 'Pengeluaran Lainnya'),
        date,
        description: description.trim(),
        adminId: user?.uid,
        adminName: user?.displayName || user?.email || 'Admin',
        createdAt: serverTimestamp()
      });

      setShowAddModal(false);
      setAmount('');
      setDescription('');
      setCategory('');
      setDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'finance_transactions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus transaksi ini dari arus keuangan?')) return;
    try {
      await deleteDoc(doc(db, 'finance_transactions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `finance_transactions/${id}`);
    }
  };

  // Calculate totals
  const validPayments = useMemo(() => {
    return payments.filter(p => 
      p.status !== 'pending' && p.status !== 'rejected' && p.type !== 'tagihan' && p.type !== 'tabungan'
    );
  }, [payments]);

  const incomeFromIuran = useMemo(() => {
    return validPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [validPayments]);

  const incomeManual = useMemo(() => {
    return transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [transactions]);

  const totalIncome = incomeFromIuran + incomeManual;
  
  const totalExpense = useMemo(() => {
    return transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [transactions]);

  const balance = totalIncome - totalExpense;

  // Unified combined transactions list
  const combinedTransactions = useMemo(() => {
    const list: any[] = [];

    // Add valid iuran payments
    validPayments.forEach(p => {
      let dateStr = p.date || '';
      if (!dateStr && p.createdAt) {
        try {
          const dObj = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
          dateStr = dObj.toISOString().split('T')[0];
        } catch (e) {
          dateStr = new Date().toISOString().split('T')[0];
        }
      }
      const student = allUsers.find(u => u.id === p.studentId);
      const studentName = student?.name || p.studentName || 'Siswa';

      list.push({
        id: `iuran_${p.id}`,
        rawId: p.id,
        source: 'iuran',
        date: dateStr || '-',
        type: 'income',
        category: p.iuranCategory || 'Iuran Siswa',
        description: p.description || p.iuranName || `Iuran Siswa (${studentName})`,
        studentName: studentName,
        amount: Number(p.amount) || 0,
        canDelete: false
      });
    });

    // Add manual cash transactions
    transactions.forEach(t => {
      list.push({
        id: `manual_${t.id}`,
        rawId: t.id,
        source: 'manual',
        date: t.date || '-',
        type: t.type || 'expense',
        category: t.category || (t.type === 'income' ? 'Pemasukan Manual' : 'Pengeluaran Manual'),
        description: t.description || 'Transaksi Manual',
        studentName: '',
        amount: Number(t.amount) || 0,
        canDelete: true
      });
    });

    // Sort by date descending
    list.sort((a, b) => {
      const dateCompare = (b.date || '').localeCompare(a.date || '');
      if (dateCompare !== 0) return dateCompare;
      return b.id.localeCompare(a.id);
    });

    return list;
  }, [validPayments, transactions, allUsers]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return combinedTransactions.filter(t => {
      // Search term filter
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const matchesDesc = (t.description || '').toLowerCase().includes(s);
        const matchesCat = (t.category || '').toLowerCase().includes(s);
        const matchesStudent = (t.studentName || '').toLowerCase().includes(s);
        const matchesAmount = String(t.amount || '').includes(s);
        if (!matchesDesc && !matchesCat && !matchesStudent && !matchesAmount) {
          return false;
        }
      }

      // Type filter
      if (filterType === 'income_all' && t.type !== 'income') return false;
      if (filterType === 'income_iuran' && (t.type !== 'income' || t.source !== 'iuran')) return false;
      if (filterType === 'income_manual' && (t.type !== 'income' || t.source !== 'manual')) return false;
      if (filterType === 'expense' && t.type !== 'expense') return false;

      // Exact single Date filter
      if (filterDate && t.date !== filterDate) return false;

      // Date range filter
      if (filterDateStart && t.date < filterDateStart) return false;
      if (filterDateEnd && t.date > filterDateEnd) return false;

      return true;
    });
  }, [combinedTransactions, searchTerm, filterType, filterDate, filterDateStart, filterDateEnd]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterDate, filterDateStart, filterDateEnd, itemsPerPage]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredTransactions.length);
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Pie chart data for "Struktur Arus Kas"
  const chartData = useMemo(() => [
    { name: 'Pemasukan (Iuran)', value: incomeFromIuran, color: '#10b981' },
    { name: 'Pemasukan (Manual)', value: incomeManual, color: '#14b8a6' },
    { name: 'Pengeluaran', value: totalExpense, color: '#f43f5e' },
  ], [incomeFromIuran, incomeManual, totalExpense]);

  const COLORS = ['#10b981', '#14b8a6', '#f43f5e'];

  // Export to Excel
  const handleExportArusKasExcel = () => {
    if (filteredTransactions.length === 0) {
      alert("Tidak ada transaksi arus kas yang sesuai dengan filter yang dipilih.");
      return;
    }

    let runningBalance = 0;
    const arusKasTable = filteredTransactions.map((item, idx) => {
      if (item.type === 'income') {
        runningBalance += item.amount;
      } else {
        runningBalance -= item.amount;
      }

      return {
        "No": idx + 1,
        "Tanggal": item.date,
        "Sumber": item.source === 'iuran' ? 'Iuran Siswa' : 'Manual / Kas',
        "Tipe": item.type === 'income' ? 'PEMASUKAN' : 'PENGELUARAN',
        "Kategori": item.category,
        "Deskripsi / Keterangan": item.description,
        "Pemasukan (Rp)": item.type === 'income' ? item.amount : 0,
        "Pengeluaran (Rp)": item.type === 'expense' ? item.amount : 0,
        "Saldo Kumulatif (Rp)": runningBalance
      };
    });

    const totalPemasukanExport = filteredTransactions.filter(i => i.type === 'income').reduce((sum, i) => sum + i.amount, 0);
    const totalPengeluaranExport = filteredTransactions.filter(i => i.type === 'expense').reduce((sum, i) => sum + i.amount, 0);

    const ringkasanData = [
      { "Parameter Laporan": "Judul Laporan", "Nilai / Details": "LAPORAN ARUS KAS KEUANGAN" },
      { "Parameter Laporan": "Tanggal Export", "Nilai / Details": new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) },
      { "Parameter Laporan": "Periode Filter", "Nilai / Details": filterDate ? `Tanggal ${filterDate}` : `${filterDateStart || 'Awal'} s/d ${filterDateEnd || 'Terakhir'}` },
      { "Parameter Laporan": "Total Transaksi", "Nilai / Details": `${filteredTransactions.length} Transaksi` },
      { "Parameter Laporan": "TOTAL PEMASUKAN", "Nilai / Details": `Rp ${totalPemasukanExport.toLocaleString('id-ID')}` },
      { "Parameter Laporan": "TOTAL PENGELUARAN", "Nilai / Details": `Rp ${totalPengeluaranExport.toLocaleString('id-ID')}` },
      { "Parameter Laporan": "SALDO BERSIH", "Nilai / Details": `Rp ${(totalPemasukanExport - totalPengeluaranExport).toLocaleString('id-ID')}` }
    ];

    const wb = XLSX.utils.book_new();
    const wsArusKas = XLSX.utils.json_to_sheet(arusKasTable);
    const wsSummary = XLSX.utils.json_to_sheet(ringkasanData);

    const autoFitCols = (ws: any, data: any[]) => {
      if (!data || data.length === 0) return;
      const colWidths = Object.keys(data[0]).map(key => {
        let maxLen = key.length;
        data.forEach(row => {
          const val = String(row[key] ?? '');
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.max(maxLen + 4, 12) };
      });
      ws['!cols'] = colWidths;
    };

    autoFitCols(wsArusKas, arusKasTable);
    autoFitCols(wsSummary, ringkasanData);

    XLSX.utils.book_append_sheet(wb, wsArusKas, "Laporan Arus Kas");
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");
    XLSX.writeFile(wb, `Laporan_Arus_Kas_RA_Darusyifa_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        // Formats YYYY-MM-DD into DD-MM-YY (like 20-07-23 in the screenshot)
        const yearShort = parts[0].slice(2);
        return `${parts[2]}-${parts[1]}-${yearShort}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500 pb-20 md:pb-6">
      
      {/* Mobile Top Header Title (Styled for Mobile & Desktop) */}
      <div className="md:hidden bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 -mx-4 -mt-4 p-5 rounded-b-3xl text-white shadow-md mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-white leading-tight">Arus Keuangan</h3>
            <p className="text-[11px] text-emerald-100 font-medium">Ringkasan kas & catatan transaksi</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-9 h-9 rounded-xl bg-white text-emerald-700 flex items-center justify-center font-black shadow-sm active:scale-95 transition-all"
          title="Tambah Transaksi"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* 3 Summary Cards (Matches Screenshot Exactly) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Card 1: TOTAL PEMASUKAN */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/60">
              <TrendingUp size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                TOTAL PEMASUKAN
              </p>
              <h4 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight truncate">
                Rp {totalIncome.toLocaleString('id-ID')}
              </h4>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-50 flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold">
              Iuran: Rp {incomeFromIuran.toLocaleString('id-ID')}
            </span>
            <span className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-100 rounded-full text-[10px] font-bold">
              Manual: Rp {incomeManual.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Card 2: TOTAL PENGELUARAN */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100/60">
              <TrendingDown size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                TOTAL PENGELUARAN
              </p>
              <h4 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight truncate">
                Rp {totalExpense.toLocaleString('id-ID')}
              </h4>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-50">
            <p className="text-[11px] font-bold text-slate-400">
              Arus Kas Keluar Terdaftar
            </p>
          </div>
        </div>

        {/* Card 3: SALDO BERSIH (LABA/RUGI) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/60">
              <Wallet size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                SALDO BERSIH (LABA/RUGI)
              </p>
              <h4 className={`text-2xl sm:text-3xl font-black tracking-tight truncate ${balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                Rp {balance.toLocaleString('id-ID')}
              </h4>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-50">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-wide border ${
              balance >= 0 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {balance >= 0 ? 'Surplus Anggaran' : 'Defisit Anggaran'}
            </span>
          </div>
        </div>

      </div>

      {/* Dark Card: Struktur Arus Kas (Matches Screenshot Layout) */}
      <div className="bg-[#111827] text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <h4 className="text-base sm:text-lg font-black text-white tracking-tight mb-4">
          Struktur Arus Kas
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
          {/* Donut Chart */}
          <div className="md:col-span-5 h-48 sm:h-56 flex items-center justify-center relative">
            {totalIncome === 0 && totalExpense === 0 ? (
              <div className="w-32 h-32 rounded-full border-8 border-slate-800 flex items-center justify-center text-xs text-slate-500 font-bold">
                Belum ada data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, '']}
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '12px', 
                      border: '1px solid #334155', 
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Breakdown Legend items with exact matching layout */}
          <div className="md:col-span-7 space-y-3.5 sm:space-y-4">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-300 font-medium">Pemasukan (Iuran)</span>
              </div>
              <span className="text-white font-mono font-bold tracking-tight">
                Rp {incomeFromIuran.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm font-bold border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-teal-400 shrink-0" />
                <span className="text-slate-300 font-medium">Pemasukan (Manual)</span>
              </div>
              <span className="text-white font-mono font-bold tracking-tight">
                Rp {incomeManual.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm font-bold pt-0.5">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                <span className="text-slate-300 font-medium">Pengeluaran</span>
              </div>
              <span className="text-white font-mono font-bold tracking-tight">
                Rp {totalExpense.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Arus Kas Transaksi Section */}
      <div className="space-y-4">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Arus Kas Transaksi
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              Riwayat transaksi keuangan dan arus kas masuk/keluar
            </p>
          </div>

          {/* Action Buttons: Export Excel (Green) & + Tambah (Blue/Indigo) */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button 
              onClick={handleExportArusKasExcel}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl sm:rounded-2xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Download size={16} />
              <span>Export Excel</span>
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl sm:rounded-2xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>+ Tambah</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          
          {/* Search Input */}
          <div className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters Row: Type Dropdown & Date Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            
            {/* Type Dropdown */}
            <div className="relative">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
              >
                <option value="all">Semua Tipe</option>
                <option value="income_all">Semua Pemasukan</option>
                <option value="income_iuran">Pemasukan (Iuran Siswa)</option>
                <option value="income_manual">Pemasukan (Manual / Kas)</option>
                <option value="expense">Semua Pengeluaran</option>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>

            {/* Single Date Picker Filter */}
            <div className="relative flex items-center">
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setFilterDateStart('');
                  setFilterDateEnd('');
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                placeholder="Tanggal"
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate('')} 
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="Hapus filter tanggal"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Reset Filter Button */}
            {(searchTerm || filterType !== 'all' || filterDate || filterDateStart || filterDateEnd) && (
              <div className="sm:col-span-2 lg:col-span-1 flex items-center">
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setFilterDate('');
                    setFilterDateStart('');
                    setFilterDateEnd('');
                  }}
                  className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Reset Filter</span>
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Transaction Cards List (Clean Responsive Cards matching screenshot) */}
        <div className="space-y-2.5">
          {paginatedTransactions.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl sm:rounded-3xl border border-slate-100 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center">
                <FileText size={28} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-700">Tidak ada transaksi ditemukan</p>
                <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan kata kunci atau filter pencarian Anda</p>
              </div>
            </div>
          ) : (
            paginatedTransactions.map((t) => {
              const isIncome = t.type === 'income';

              return (
                <div 
                  key={t.id} 
                  className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3 group"
                >
                  {/* Left: Round Square Icon */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-rose-50 text-rose-500 border border-rose-100'
                    }`}>
                      {isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>

                    {/* Middle: Title, Category pill, and details */}
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-emerald-700 transition-colors">
                        {t.description}
                      </h5>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-black uppercase tracking-wider">
                          {t.category}
                        </span>
                        {t.studentName && (
                          <span className="text-[10px] text-slate-400 font-medium truncate">
                            • {t.studentName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Nominal & Date */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-right">
                    <div>
                      <p className={`text-xs sm:text-sm font-black tracking-tight ${
                        isIncome ? 'text-emerald-600' : 'text-rose-500'
                      }`}>
                        {isIncome ? '+ ' : '- '}Rp {t.amount.toLocaleString('id-ID')}
                      </p>
                      <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 mt-0.5">
                        {formatDateDisplay(t.date)}
                      </p>
                    </div>

                    {/* Delete button (only for manual transactions) */}
                    {t.canDelete && (
                      <button 
                        onClick={() => handleDeleteTransaction(t.rawId)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="Hapus transaksi"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Bar (10 transactions per page with page navigation) */}
        {filteredTransactions.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
            
            {/* Status info */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span>
                Menampilkan <strong className="text-slate-800">{filteredTransactions.length === 0 ? 0 : startIndex + 1}</strong> - <strong className="text-slate-800">{endIndex}</strong> dari <strong className="text-slate-800">{filteredTransactions.length}</strong> transaksi
              </span>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              
              {/* Previous Button */}
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, and pages around current page
                    return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    const hasGap = prevPage && page - prevPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {hasGap && <span className="text-slate-400 text-xs px-1">...</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            currentPage === page
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              {/* Next Button */}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight size={14} />
              </button>

            </div>

          </div>
        )}

      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[300] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-slate-100">
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Tambah Transaksi</h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Catat arus kas masuk atau keluar</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              
              {/* Type Switcher */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Jenis Transaksi
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                  <button 
                    type="button"
                    onClick={() => {
                      setType('expense');
                      setCategory('');
                    }}
                    className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      type === 'expense' 
                        ? 'bg-rose-500 text-white shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Pengeluaran
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setType('income');
                      setCategory('');
                    }}
                    className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      type === 'income' 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Pemasukan
                  </button>
                </div>
              </div>

              {/* Nominal Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Nominal (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Date & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Tanggal *
                  </label>
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Kategori
                  </label>
                  <input 
                    type="text" 
                    list="category-suggestions"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    placeholder="Pilih atau ketik..."
                  />
                  <datalist id="category-suggestions">
                    {(type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Keterangan / Deskripsi *
                </label>
                <textarea 
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
                  placeholder="Contoh: Sewa Tanah, Pembelian ATK..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-3 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${
                    type === 'income' 
                      ? 'bg-emerald-600 hover:bg-emerald-700' 
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
