import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  orderBy 
} from 'firebase/firestore';
import { 
  Banknote, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  Download, 
  Trash2, 
  ArrowRight, 
  ShieldCheck, 
  Coins, 
  X, 
  Check, 
  AlertCircle, 
  Eye, 
  TrendingUp, 
  UserCheck, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../../lib/firestoreUtils';
import { formatRupiah, terbilang } from '../../../lib/salaryUtils';
import { 
  CashDeposit, 
  DEPOSIT_TYPES, 
  DEFAULT_TREASURER, 
  DEFAULT_PRINCIPAL, 
  generateDepositNumber, 
  generateBuktiSetoranPrintHTML 
} from '../../../lib/cashDepositUtils';
import * as XLSX from 'xlsx';

interface FinanceSetoranCashTabProps {
  payments: any[];
  allUsers: any[];
  user: any;
  settings?: any;
  iuranCategories?: any[];
  schoolClasses?: any[];
}

export default function FinanceSetoranCashTab({ 
  payments, 
  allUsers, 
  user, 
  settings, 
  iuranCategories = [], 
  schoolClasses = [] 
}: FinanceSetoranCashTabProps) {
  const [deposits, setDeposits] = useState<CashDeposit[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [periodTab, setPeriodTab] = useState<'Harian' | 'Mingguan' | 'Bulanan' | 'Custom'>('Harian');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<CashDeposit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    depositNumber: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'),
    periodType: 'Harian' as 'Harian' | 'Mingguan' | 'Bulanan' | 'Custom',
    depositType: 'Tabungan' as any,
    source: 'Kelas Umar',
    amount: '',
    description: '',
    treasurerName: settings?.namaBendahara || DEFAULT_TREASURER.name,
    treasurerNip: settings?.nipBendahara || DEFAULT_TREASURER.nip,
    treasurerTitle: settings?.jabatanBendahara || DEFAULT_TREASURER.title,
    receiverName: settings?.namaKepsek || DEFAULT_PRINCIPAL.name,
    receiverNip: settings?.nipKepsek || DEFAULT_PRINCIPAL.nip,
    receiverTitle: settings?.jabatanKepsek || DEFAULT_PRINCIPAL.title,
    directVerifyTreasurer: true
  });

  // Dynamic Categories pulled from iuranCategories, payments, and system defaults
  const dynamicCategories = useMemo(() => {
    const list: { id: string; label: string; desc: string }[] = [
      { id: 'Tabungan', label: 'Tabungan', desc: 'Setoran uang tabungan siswa' },
      { id: 'Iuran Bulanan / SPP', label: 'Iuran Bulanan / SPP', desc: 'Setoran SPP / iuran rutin bulanan' },
      { id: 'Uang Kegiatan', label: 'Uang Kegiatan / Event', desc: 'Setoran kegiatan, field trip, perpisahan' },
      { id: 'PPDB / Pendaftaran', label: 'PPDB / Pendaftaran', desc: 'Setoran formulir & uang pendaftaran siswa baru' },
      { id: 'Penjualan Buku / Seragam', label: 'Penjualan Buku / Seragam', desc: 'Setoran pembelian atribut & seragam' },
      { id: 'Infaq / Shodaqoh', label: 'Infaq / Shodaqoh / Donasi', desc: 'Setoran infaq Jumat / shodaqoh sukarela' },
    ];

    const categoryMap = new Map<string, { id: string; label: string; desc: string }>();
    list.forEach(item => categoryMap.set(item.id.toLowerCase(), item));

    // Tarik data dari data iuran keuangan (iuranCategories)
    if (iuranCategories && Array.isArray(iuranCategories)) {
      iuranCategories.forEach((cat: any) => {
        const name = (typeof cat === 'string' ? cat : cat.name || '').trim();
        if (name && !categoryMap.has(name.toLowerCase())) {
          categoryMap.set(name.toLowerCase(), {
            id: name,
            label: name,
            desc: cat.description || `Kategori iuran: ${name}`
          });
        }
      });
    }

    // Tarik data kategori dari riwayat pembayaran cash jika ada
    payments.forEach((p: any) => {
      const catName = (p.category || p.iuranName || '').trim();
      if (catName && !categoryMap.has(catName.toLowerCase()) && !catName.toLowerCase().includes('tabungan_')) {
        categoryMap.set(catName.toLowerCase(), {
          id: catName,
          label: catName,
          desc: `Kategori pembayaran: ${catName}`
        });
      }
    });

    // Tambahkan opsi Lainnya
    if (!categoryMap.has('lainnya')) {
      categoryMap.set('lainnya', {
        id: 'Lainnya',
        label: 'Lainnya / Kas Umum',
        desc: 'Setoran penerimaan kas tunai lainnya'
      });
    }

    return Array.from(categoryMap.values());
  }, [iuranCategories, payments]);

  // Dynamic School Class Sources
  const availableClassSources = useMemo(() => {
    const sources = new Set<string>();
    sources.add('Kelas Umar');
    sources.add('Kelas Abu Bakar');
    sources.add('Kelas Utsman');
    sources.add('Kelas Ali');
    sources.add('Semua Kelas / Gabungan');
    sources.add('Umum / Kas Sekolah');

    if (schoolClasses && Array.isArray(schoolClasses)) {
      schoolClasses.forEach((c: any) => {
        const cName = typeof c === 'string' ? c : (c.name || c.className || '');
        if (cName) {
          const clean = cName.replace(/^Kelas\s+/i, '').trim();
          if (clean) sources.add(`Kelas ${clean}`);
        }
      });
    }

    allUsers.forEach((u: any) => {
      if (u.role === 'siswa' && u.kelas) {
        const clean = u.kelas.replace(/^Kelas\s+/i, '').trim();
        if (clean) sources.add(`Kelas ${clean}`);
      }
    });

    return Array.from(sources);
  }, [schoolClasses, allUsers]);

  // Helper to calculate total cash collected for specific category
  const calculateCashForCategory = (catName: string) => {
    if (!catName) return 0;
    let total = 0;
    const catLower = catName.toLowerCase();

    payments.forEach((p: any) => {
      if (p.status === 'ditolak') return;
      const isCash = !p.paymentMethod || p.paymentMethod === 'Tunai' || p.paymentMethod === 'Cash' || p.method === 'Tunai';
      if (!isCash) return;

      const amt = Number(p.amount) || 0;
      const pCat = (p.category || p.iuranName || '').toLowerCase();
      const pType = (p.type || '').toLowerCase();

      if (catLower.includes('tabung') || catLower === 'tabungan') {
        if (pType === 'tabungan_masuk' || pCat.includes('tabung')) {
          total += amt;
        } else if (pType === 'tabungan_keluar') {
          total -= amt;
        }
      } else if (catLower.includes('spp') || catLower.includes('bulanan')) {
        if (pCat.includes('spp') || pCat.includes('bulanan') || pCat.includes('iuran')) {
          total += amt;
        }
      } else if (catLower.includes('kegiatan')) {
        if (pCat.includes('kegiatan') || pCat.includes('event') || pCat.includes('field')) {
          total += amt;
        }
      } else if (catLower.includes('ppdb') || catLower.includes('daftar')) {
        if (pCat.includes('ppdb') || pCat.includes('daftar') || pCat.includes('formulir')) {
          total += amt;
        }
      } else if (catLower.includes('buku') || catLower.includes('seragam')) {
        if (pCat.includes('buku') || pCat.includes('seragam') || pCat.includes('atribut')) {
          total += amt;
        }
      } else {
        if (pCat.includes(catLower) || catLower.includes(pCat)) {
          total += amt;
        }
      }
    });

    return Math.max(0, total);
  };

  // Real-time Firestore subscription for cash_deposits
  useEffect(() => {
    const q = query(collection(db, 'cash_deposits'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CashDeposit));
      setDeposits(docs);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'cash_deposits');
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Compute Cash Summary: Total Cash Received in payments vs Total Deposited & Disahkan
  const cashCalculations = useMemo(() => {
    let totalCashReceived = 0;

    payments.forEach(p => {
      if (p.status === 'ditolak') return;
      const isCash = !p.paymentMethod || p.paymentMethod === 'Tunai' || p.paymentMethod === 'Cash' || p.method === 'Tunai';
      const amt = Number(p.amount) || 0;

      if (isCash) {
        if (p.type === 'tabungan_keluar') {
          totalCashReceived -= amt;
        } else {
          totalCashReceived += amt;
        }
      }
    });

    const totalDisahkan = deposits
      .filter(d => d.status === 'disahkan')
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    const totalPending = deposits
      .filter(d => d.status === 'menunggu_verifikasi_bendahara' || d.status === 'menunggu_verifikasi_kepsek')
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    const remainingCashAtTreasurer = Math.max(0, totalCashReceived - totalDisahkan);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayDeposits = deposits.filter(d => d.date === todayStr);
    const todayTotal = todayDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const todayCount = todayDeposits.length;

    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    const weekDeposits = deposits.filter(d => new Date(d.date) >= weekAgo);
    const weekTotal = weekDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const weekCount = weekDeposits.length;

    const currentMonthPrefix = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const monthDeposits = deposits.filter(d => (d.date || '').startsWith(currentMonthPrefix));
    const monthTotal = monthDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const monthCount = monthDeposits.length;

    const pendingDeposits = deposits.filter(d => d.status !== 'disahkan' && d.status !== 'ditolak');
    const pendingCount = pendingDeposits.length;

    return {
      totalCashReceived,
      totalDisahkan,
      totalPending,
      remainingCashAtTreasurer,
      todayTotal,
      todayCount,
      weekTotal,
      weekCount,
      monthTotal,
      monthCount,
      pendingCount
    };
  }, [payments, deposits]);

  // Filtered deposits list
  const filteredDeposits = useMemo(() => {
    return deposits.filter(item => {
      if (periodTab === 'Harian') {
        if (filterDate && item.date !== filterDate) return false;
      } else if (periodTab === 'Mingguan') {
        const itemDate = new Date(item.date);
        const now = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        if (itemDate < weekAgo) return false;
      } else if (periodTab === 'Bulanan') {
        const expectedPrefix = `${filterYear}-${filterMonth}`;
        if (!item.date.startsWith(expectedPrefix)) return false;
      } else if (periodTab === 'Custom') {
        if (filterStartDate && item.date < filterStartDate) return false;
        if (filterEndDate && item.date > filterEndDate) return false;
      }

      if (filterType !== 'all' && item.depositType !== filterType) {
        return false;
      }

      if (filterStatus !== 'all' && item.status !== filterStatus) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = (item.depositNumber || '').toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        const matchSource = (item.source || '').toLowerCase().includes(q);
        const matchTreasurer = (item.treasurerName || '').toLowerCase().includes(q);
        const matchReceiver = (item.receiverName || '').toLowerCase().includes(q);
        if (!matchNo && !matchDesc && !matchSource && !matchTreasurer && !matchReceiver) {
          return false;
        }
      }

      return true;
    });
  }, [deposits, periodTab, filterDate, filterMonth, filterYear, filterStartDate, filterEndDate, filterType, filterStatus, searchQuery]);

  // Open Add Modal and auto-generate deposit number
  const handleOpenAddModal = () => {
    const nextNumber = generateDepositNumber(new Date().toISOString().split('T')[0], deposits.length);
    setFormData({
      depositNumber: nextNumber,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'),
      periodType: periodTab,
      depositType: 'Tabungan',
      source: 'Kelas Umar',
      amount: '',
      description: 'Setoran uang tunai kas masuk ke Kepala Sekolah / Yayasan',
      treasurerName: settings?.namaBendahara || user?.displayName || DEFAULT_TREASURER.name,
      treasurerNip: settings?.nipBendahara || DEFAULT_TREASURER.nip,
      treasurerTitle: settings?.jabatanBendahara || DEFAULT_TREASURER.title,
      receiverName: settings?.namaKepsek || DEFAULT_PRINCIPAL.name,
      receiverNip: settings?.nipKepsek || DEFAULT_PRINCIPAL.nip,
      receiverTitle: settings?.jabatanKepsek || DEFAULT_PRINCIPAL.title,
      directVerifyTreasurer: true
    });
    setShowAddModal(true);
  };

  // Submit new Cash Deposit
  const handleSaveDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(formData.amount);
    if (!amt || amt <= 0) {
      alert('Mohon masukkan nominal setoran yang valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const nowStr = new Date().toLocaleString('id-ID');
      const isDirectVerif = formData.directVerifyTreasurer;

      const newDepositPayload: Omit<CashDeposit, 'id'> = {
        depositNumber: formData.depositNumber || generateDepositNumber(formData.date, deposits.length),
        date: formData.date,
        time: formData.time || '08:30',
        periodType: formData.periodType,
        depositType: formData.depositType,
        source: formData.source || 'Kelas Umar',
        amount: amt,
        description: formData.description.trim(),
        treasurerId: user?.uid || 'treasurer',
        treasurerName: formData.treasurerName,
        treasurerNip: formData.treasurerNip,
        treasurerTitle: formData.treasurerTitle,
        treasurerVerified: isDirectVerif,
        treasurerVerifiedAt: isDirectVerif ? nowStr : undefined,
        receiverName: formData.receiverName,
        receiverNip: formData.receiverNip,
        receiverTitle: formData.receiverTitle,
        principalVerified: false,
        status: isDirectVerif ? 'menunggu_verifikasi_kepsek' : 'menunggu_verifikasi_bendahara',
        qrVerificationCode: `SC-${Date.now()}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'cash_deposits'), newDepositPayload);
      setShowAddModal(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'cash_deposits');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verifikasi oleh Bendahara
  const handleVerifyTreasurer = async (deposit: CashDeposit) => {
    if (!deposit.id) return;
    try {
      const nowStr = new Date().toLocaleString('id-ID');
      await updateDoc(doc(db, 'cash_deposits', deposit.id), {
        treasurerVerified: true,
        treasurerVerifiedAt: nowStr,
        status: 'menunggu_verifikasi_kepsek',
        updatedAt: serverTimestamp()
      });
      if (selectedDeposit?.id === deposit.id) {
        setSelectedDeposit({
          ...selectedDeposit,
          treasurerVerified: true,
          treasurerVerifiedAt: nowStr,
          status: 'menunggu_verifikasi_kepsek'
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `cash_deposits/${deposit.id}`);
    }
  };

  // Verifikasi & Pengesahan oleh Kepala Sekolah / Yayasan
  const handleAuthorizePrincipal = async (deposit: CashDeposit) => {
    if (!deposit.id) return;
    try {
      const nowStr = new Date().toLocaleString('id-ID');
      await updateDoc(doc(db, 'cash_deposits', deposit.id), {
        treasurerVerified: true,
        treasurerVerifiedAt: deposit.treasurerVerifiedAt || nowStr,
        principalVerified: true,
        principalVerifiedAt: nowStr,
        status: 'disahkan',
        updatedAt: serverTimestamp()
      });
      if (selectedDeposit?.id === deposit.id) {
        setSelectedDeposit({
          ...selectedDeposit,
          treasurerVerified: true,
          principalVerified: true,
          principalVerifiedAt: nowStr,
          status: 'disahkan'
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `cash_deposits/${deposit.id}`);
    }
  };

  // Tolak Setoran
  const handleRejectDeposit = async (deposit: CashDeposit) => {
    if (!deposit.id) return;
    const reason = prompt('Masukkan alasan penolakan setoran cash:');
    if (reason === null) return;

    try {
      await updateDoc(doc(db, 'cash_deposits', deposit.id), {
        status: 'ditolak',
        rejectionReason: reason || 'Data nominal / fisik uang cash tidak sesuai.',
        updatedAt: serverTimestamp()
      });
      if (selectedDeposit?.id === deposit.id) {
        setSelectedDeposit({
          ...selectedDeposit,
          status: 'ditolak',
          rejectionReason: reason || 'Data nominal / fisik uang cash tidak sesuai.'
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `cash_deposits/${deposit.id}`);
    }
  };

  // Hapus Setoran
  const handleDeleteDeposit = async (deposit: CashDeposit) => {
    if (!deposit.id) return;
    if (!confirm(`Hapus catatan setoran cash ${deposit.depositNumber} senilai ${formatRupiah(deposit.amount)}?`)) return;

    try {
      await deleteDoc(doc(db, 'cash_deposits', deposit.id));
      if (selectedDeposit?.id === deposit.id) {
        setShowDetailModal(false);
        setSelectedDeposit(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `cash_deposits/${deposit.id}`);
    }
  };

  // Print Bukti Setoran Cash
  const handlePrintBukti = (deposit: CashDeposit) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak. Pastikan pop-up diizinkan di browser Anda.');
      return;
    }
    const html = generateBuktiSetoranPrintHTML(deposit);
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredDeposits.length === 0) {
      alert('Tidak ada data setoran cash yang sesuai filter untuk diekspor.');
      return;
    }

    const rows = filteredDeposits.map((item, idx) => ({
      'No': idx + 1,
      'No. Setoran': item.depositNumber,
      'Tanggal': item.date,
      'Waktu': item.time || '-',
      'Periode': item.periodType,
      'Jenis Setoran': item.depositType,
      'Sumber Dana': item.source,
      'Nominal Setoran (Rp)': item.amount,
      'Keterangan': item.description || '-',
      'Penyetor (Bendahara)': item.treasurerName,
      'Status Verifikasi Bendahara': item.treasurerVerified ? `Ter-verifikasi (${item.treasurerVerifiedAt || item.date})` : 'Menunggu Verifikasi',
      'Penerima (Kepsek/Yayasan)': item.receiverName,
      'Verifikasi Kepsek/Yayasan': item.principalVerified ? `Disahkan (${item.principalVerifiedAt || item.date})` : 'Belum Diverifikasi',
      'Status Akhir': item.status === 'disahkan' ? 'Disahkan' : item.status === 'ditolak' ? 'Ditolak' : 'Belum Disahkan'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Setoran Cash');

    const summaryData = [
      { 'Keterangan': 'Total Setoran Cash Disahkan', 'Nilai': formatRupiah(cashCalculations.totalDisahkan) },
      { 'Keterangan': 'Total Setoran Cash Menunggu Pengesahan', 'Nilai': formatRupiah(cashCalculations.totalPending) },
      { 'Keterangan': 'Estimasi Sisa Kas Tunai di Bendahara', 'Nilai': formatRupiah(cashCalculations.remainingCashAtTreasurer) },
      { 'Keterangan': 'Jumlah Transaksi Filter Ini', 'Nilai': filteredDeposits.length },
      { 'Keterangan': 'Total Nominal Filter Ini', 'Nilai': formatRupiah(filteredDeposits.reduce((s, d) => s + (Number(d.amount) || 0), 0)) }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Kas');

    XLSX.writeFile(wb, `Laporan_Setoran_Cash_RA_Darusyifa_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getBadgeTypeColor = (type: string) => {
    switch (type) {
      case 'Tabungan':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Iuran Bulanan':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Uang Kegiatan':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'PPDB / Pendaftaran':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Penjualan Buku / Seragam':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 md:pb-12">
      {/* 1. HEADER & ALUR SETORAN CASH BANNER */}
      <div className="bg-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 lg:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider mb-2">
              <Banknote size={14} className="text-emerald-600" />
              Kas & Penyerahan Uang Tunai
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Setoran Cash Bendahara ke Kepsek / Yayasan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Catat penyerahan uang cash, verifikasi 2 tingkat, & cetak bukti sah resmi.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Download size={15} />
              <span className="whitespace-nowrap">Export Excel</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-200"
            >
              <Plus size={16} />
              <span className="whitespace-nowrap">Setoran Baru</span>
            </button>
          </div>
        </div>

        {/* ALUR SETORAN CASH (Responsive Flow) */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-100">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles size={14} className="text-emerald-600" />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-700">Alur Standar Setoran Cash</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {[
              { step: '1', title: 'Bendahara Catat', desc: 'Input setoran uang tunai.', icon: Banknote },
              { step: '2', title: 'Verifikasi Bendahara', desc: 'Validasi fisik uang tunai.', icon: ShieldCheck },
              { step: '3', title: 'Verifikasi Kepsek', desc: 'Kepsek menerima fisik.', icon: UserCheck },
              { step: '4', title: 'Disahkan', desc: 'Barcode digital & sah.', icon: CheckCircle2 },
              { step: '5', title: 'Bukti & Laporan', desc: 'Cetak Bukti Setoran Cash.', icon: FileText }
            ].map((st, i) => (
              <div 
                key={st.step} 
                className={`bg-slate-50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-100 ${i === 4 ? 'col-span-2 sm:col-span-1' : ''}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                    {st.step}
                  </div>
                  <h4 className="text-[11px] font-black text-slate-800 truncate">{st.title}</h4>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. TOP METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Hari Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[1.75rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Setoran Hari Ini</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Banknote size={16} />
            </div>
          </div>
          <h3 className="text-base sm:text-xl lg:text-2xl font-black text-slate-900 tracking-tight truncate">
            {formatRupiah(cashCalculations.todayTotal)}
          </h3>
          <div className="flex items-center gap-1 mt-1.5 text-[10px] sm:text-xs font-bold text-emerald-600">
            <CheckCircle2 size={12} />
            <span>{cashCalculations.todayCount} Transaksi</span>
          </div>
        </div>

        {/* Minggu Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[1.75rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Setoran 7 Hari</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar size={16} />
            </div>
          </div>
          <h3 className="text-base sm:text-xl lg:text-2xl font-black text-slate-900 tracking-tight truncate">
            {formatRupiah(cashCalculations.weekTotal)}
          </h3>
          <div className="flex items-center gap-1 mt-1.5 text-[10px] sm:text-xs font-bold text-blue-600">
            <CheckCircle2 size={12} />
            <span>{cashCalculations.weekCount} Transaksi</span>
          </div>
        </div>

        {/* Bulan Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[1.75rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Setoran Bulan Ini</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <TrendingUp size={16} />
            </div>
          </div>
          <h3 className="text-base sm:text-xl lg:text-2xl font-black text-slate-900 tracking-tight truncate">
            {formatRupiah(cashCalculations.monthTotal)}
          </h3>
          <div className="flex items-center gap-1 mt-1.5 text-[10px] sm:text-xs font-bold text-purple-600">
            <CheckCircle2 size={12} />
            <span>{cashCalculations.monthCount} Transaksi</span>
          </div>
        </div>

        {/* Belum Disahkan / Pending */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[1.75rem] border border-amber-100 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-amber-50/40">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider truncate">Belum Disahkan</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
          </div>
          <h3 className="text-base sm:text-xl lg:text-2xl font-black text-amber-800 tracking-tight truncate">
            {formatRupiah(cashCalculations.totalPending)}
          </h3>
          <div className="flex items-center gap-1 mt-1.5 text-[10px] sm:text-xs font-bold text-amber-700">
            <AlertCircle size={12} />
            <span>{cashCalculations.pendingCount} Menunggu</span>
          </div>
        </div>
      </div>

      {/* 3. REKAPITULASI KAS TUNAI DI BENDAHARA VS SUDAH DISETORKAN */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-center">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/10 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mb-1.5">
              <Coins size={12} className="text-emerald-300" />
              Kas Tunai Sekolah
            </div>
            <h3 className="text-lg sm:text-xl font-black tracking-tight">
              Arus Kas Tunai Real-Time
            </h3>
            <p className="text-[11px] text-emerald-100/80 mt-1 leading-relaxed">
              Monitoring uang tunai di bendahara dan yang telah disahkan ke Kepala Sekolah/Yayasan.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-white/15">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
              Sisa Kas di Bendahara
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-0.5">
              {formatRupiah(cashCalculations.remainingCashAtTreasurer)}
            </div>
            <p className="text-[9px] sm:text-[10px] text-emerald-100/70 mt-1">
              Uang tunai masuk yang belum disahkan.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-white/15">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
              Telah Disahkan ke Kepsek
            </span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {formatRupiah(cashCalculations.totalDisahkan)}
            </div>
            <p className="text-[9px] sm:text-[10px] text-emerald-100/70 mt-1">
              Uang tunai resmi disahkan & diserahkan.
            </p>
          </div>
        </div>
      </div>

      {/* 4. FILTER BAR */}
      <div className="bg-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 border border-slate-100 shadow-sm space-y-3 sm:space-y-4">
        {/* Period Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 sm:pb-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl sm:rounded-2xl overflow-x-auto">
            {(['Harian', 'Mingguan', 'Bulanan', 'Custom'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setPeriodTab(tab)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  periodTab === tab
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Quick Date Selectors based on Active Tab */}
          <div className="flex items-center gap-2 flex-wrap">
            {periodTab === 'Harian' && (
              <div className="flex-1 sm:flex-none flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 min-h-[38px]">
                <Calendar size={14} className="text-slate-400" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none w-full"
                />
              </div>
            )}

            {periodTab === 'Bulanan' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="flex-1 sm:flex-none bg-slate-50 text-xs font-bold text-slate-800 px-3 py-2 rounded-xl border border-slate-200 outline-none cursor-pointer min-h-[38px]"
                >
                  {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, idx) => {
                    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
                    return <option key={m} value={m}>{monthNames[idx]}</option>;
                  })}
                </select>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="bg-slate-50 text-xs font-bold text-slate-800 px-3 py-2 rounded-xl border border-slate-200 outline-none cursor-pointer min-h-[38px]"
                >
                  {['2025', '2026', '2027', '2028'].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}

            {periodTab === 'Custom' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  placeholder="Mulai"
                  className="flex-1 bg-slate-50 text-xs font-bold text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 outline-none min-h-[38px]"
                />
                <span className="text-xs text-slate-400 font-bold">s/d</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  placeholder="Selesai"
                  className="flex-1 bg-slate-50 text-xs font-bold text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 outline-none min-h-[38px]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Dropdown Filters & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <div>
            <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Kategori / Jenis Setoran
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-50 text-xs font-bold text-slate-800 px-3 py-2 rounded-xl border border-slate-200 outline-none cursor-pointer min-h-[38px]"
            >
              <option value="all">Semua Kategori Setoran</option>
              {dynamicCategories.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Status Setoran
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 text-xs font-bold text-slate-800 px-3 py-2 rounded-xl border border-slate-200 outline-none cursor-pointer min-h-[38px]"
            >
              <option value="all">Semua Status</option>
              <option value="menunggu_verifikasi_bendahara">Menunggu Verif Bendahara</option>
              <option value="menunggu_verifikasi_kepsek">Menunggu Verif Kepsek</option>
              <option value="disahkan">Disahkan</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Cari Setoran
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="No. Setoran, sumber, ket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 text-xs font-bold text-slate-800 pl-8 pr-3 py-2 rounded-xl border border-slate-200 outline-none min-h-[38px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. DATA LIST / TABLE (RESPONSIVE CARDS FOR MOBILE & TABLE FOR TABLET/DESKTOP) */}
      <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-emerald-600" />
            <h3 className="font-black text-slate-900 text-xs sm:text-sm">
              Riwayat Setoran Cash ({filteredDeposits.length})
            </h3>
          </div>

          <div className="text-xs font-bold text-slate-500">
            Total: <span className="text-emerald-600 font-black">{formatRupiah(filteredDeposits.reduce((s, d) => s + (Number(d.amount) || 0), 0))}</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-emerald-600" />
            Memuat data setoran cash...
          </div>
        ) : filteredDeposits.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Banknote size={36} className="mx-auto text-slate-300 mb-2 sm:mb-3" />
            <h4 className="font-black text-slate-800 text-sm sm:text-base">Belum Ada Catatan Setoran Cash</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Tidak ada data yang sesuai filter. Klik tombol di bawah untuk mencatat penyerahan uang cash.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-sm"
            >
              + Buat Catatan Setoran Baru
            </button>
          </div>
        ) : (
          <>
            {/* MOBILE CARDS VIEW (md:hidden) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredDeposits.map((item) => {
                const isDisahkan = item.status === 'disahkan';
                const isDitolak = item.status === 'ditolak';

                return (
                  <div key={item.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 text-[11px] block w-fit">
                          {item.depositNumber}
                        </span>
                        <div className="text-[11px] text-slate-500 font-medium mt-1">
                          {item.date} • {item.time || '08:30'} WIB ({item.periodType})
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getBadgeTypeColor(item.depositType)}`}>
                        {item.depositType}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-2 pt-1 border-t border-dashed border-slate-100">
                      <div>
                        <div className="text-xs font-bold text-slate-800">{item.source}</div>
                        {item.description && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {item.description}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-medium">Nominal</div>
                        <div className="text-sm font-black text-slate-900">
                          {formatRupiah(item.amount)}
                        </div>
                      </div>
                    </div>

                    {/* Verification Status Pills */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block font-bold">Bendahara:</span>
                        {item.treasurerVerified ? (
                          <span className="text-emerald-700 font-black inline-flex items-center gap-1">
                            <Check size={11} /> Ter-verifikasi
                          </span>
                        ) : (
                          <button
                            onClick={() => handleVerifyTreasurer(item)}
                            className="mt-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-black text-[9px]"
                          >
                            Verifikasi Sekarang
                          </button>
                        )}
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block font-bold">Kepsek:</span>
                        {item.principalVerified ? (
                          <span className="text-teal-700 font-black inline-flex items-center gap-1">
                            <ShieldCheck size={11} /> Disahkan
                          </span>
                        ) : isDitolak ? (
                          <span className="text-rose-700 font-black">Ditolak</span>
                        ) : (
                          <div className="flex items-center gap-1 mt-1">
                            <button
                              onClick={() => handleAuthorizePrincipal(item)}
                              className="px-2 py-0.5 bg-emerald-600 text-white rounded font-black text-[9px]"
                            >
                              Sahkan
                            </button>
                            <button
                              onClick={() => handleRejectDeposit(item)}
                              className="p-0.5 text-rose-500"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        {isDisahkan ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[9px] rounded-full uppercase">
                            Disahkan
                          </span>
                        ) : isDitolak ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-black text-[9px] rounded-full uppercase">
                            Ditolak
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-black text-[9px] rounded-full uppercase">
                            Belum Disahkan
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedDeposit(item);
                            setShowDetailModal(true);
                          }}
                          className="px-2.5 py-1 text-slate-600 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Rincian</span>
                        </button>
                        <button
                          onClick={() => handlePrintBukti(item)}
                          className="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Printer size={13} />
                          <span>Cetak</span>
                        </button>
                        {!isDisahkan && (
                          <button
                            onClick={() => handleDeleteDeposit(item)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Tanggal & Waktu</th>
                    <th className="py-3.5 px-4">No. Setoran</th>
                    <th className="py-3.5 px-4">Jenis Setoran</th>
                    <th className="py-3.5 px-4">Kelas / Sumber</th>
                    <th className="py-3.5 px-4 text-right">Jumlah (Rp)</th>
                    <th className="py-3.5 px-4 text-center">Verifikasi Bendahara</th>
                    <th className="py-3.5 px-4 text-center">Verifikasi Kepsek</th>
                    <th className="py-3.5 px-4 text-center">Status Akhir</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredDeposits.map((item) => {
                    const isDisahkan = item.status === 'disahkan';
                    const isDitolak = item.status === 'ditolak';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-black text-slate-900">{item.date}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{item.time || '08:30'} WIB • {item.periodType}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 text-[11px]">
                            {item.depositNumber}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getBadgeTypeColor(item.depositType)}`}>
                            {item.depositType}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{item.source}</div>
                          {item.description && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]" title={item.description}>
                              {item.description}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span className="font-black text-slate-900 text-sm">
                            {formatRupiah(item.amount)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {item.treasurerVerified ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black">
                                <Check size={11} />
                                Ter-verifikasi
                              </span>
                              <span className="text-[9px] text-slate-400 mt-0.5">
                                {item.treasurerVerifiedAt || item.date}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleVerifyTreasurer(item)}
                              className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-lg text-[10px] font-black transition-all cursor-pointer"
                            >
                              Menunggu Verifikasi
                            </button>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {item.principalVerified ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-[10px] font-black">
                                <ShieldCheck size={11} />
                                Disahkan
                              </span>
                              <span className="text-[9px] text-slate-400 mt-0.5">
                                {item.principalVerifiedAt || item.date}
                              </span>
                            </div>
                          ) : isDitolak ? (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-black">
                              Ditolak
                            </span>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleAuthorizePrincipal(item)}
                                title="Sahkan Setoran Cash"
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-xs"
                              >
                                Sahkan
                              </button>
                              <button
                                onClick={() => handleRejectDeposit(item)}
                                title="Tolak Setoran"
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {isDisahkan ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black text-[10px] rounded-full uppercase tracking-wider">
                              Disahkan
                            </span>
                          ) : isDitolak ? (
                            <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-black text-[10px] rounded-full uppercase tracking-wider">
                              Ditolak
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-black text-[10px] rounded-full uppercase tracking-wider">
                              Belum Disahkan
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedDeposit(item);
                                setShowDetailModal(true);
                              }}
                              title="Lihat Bukti Setoran Cash"
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => handlePrintBukti(item)}
                              title="Cetak Bukti Resmi (PDF)"
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Printer size={15} />
                            </button>
                            {!isDisahkan && (
                              <button
                                onClick={() => handleDeleteDeposit(item)}
                                title="Hapus Catatan"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 6. MODAL CATAT SETORAN BARU (MOBILE-PRECISION FIXED CONTAINER) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col h-[85dvh] sm:h-auto max-h-[85dvh] sm:max-h-[88vh] overflow-hidden">
            {/* Header Sticky */}
            <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm z-20">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
                  Penyerahan Fisik Uang Tunai
                </span>
                <h3 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                  Catat Setoran Cash Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body with min-h-0 for proper mobile flex scrolling */}
            <form 
              id="cashDepositForm" 
              onSubmit={handleSaveDeposit} 
              className="p-4 sm:p-6 space-y-3.5 overflow-y-auto flex-1 min-h-0 overscroll-contain pb-6"
            >
              {/* No. Setoran & Periode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    No. Setoran (Otomatis)
                  </label>
                  <input
                    type="text"
                    value={formData.depositNumber}
                    onChange={(e) => setFormData({ ...formData, depositNumber: e.target.value })}
                    className="w-full bg-slate-100 text-slate-900 font-mono font-bold text-sm sm:text-xs p-3 rounded-xl border border-slate-200 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Jenis Periode Setoran
                  </label>
                  <select
                    value={formData.periodType}
                    onChange={(e) => setFormData({ ...formData, periodType: e.target.value as any })}
                    className="w-full bg-slate-50 text-slate-900 font-bold text-sm sm:text-xs p-3 rounded-xl border border-slate-200 outline-none cursor-pointer"
                  >
                    <option value="Harian">Harian</option>
                    <option value="Mingguan">Mingguan</option>
                    <option value="Bulanan">Bulanan</option>
                    <option value="Custom">Khusus / Custom</option>
                  </select>
                </div>
              </div>

              {/* Tanggal & Waktu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Tanggal Penyerahan
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 font-bold text-sm sm:text-xs p-3 rounded-xl border border-slate-200 outline-none min-h-[44px]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Waktu (Jam:Menit)
                  </label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="08:30"
                    className="w-full bg-slate-50 text-slate-900 font-bold text-sm sm:text-xs p-3 rounded-xl border border-slate-200 outline-none min-h-[44px]"
                    required
                  />
                </div>
              </div>

              {/* Jenis Setoran & Sumber Dana */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Kategori / Jenis Setoran
                    </label>
                    <span className="text-[10px] text-emerald-600 font-bold">
                      Data Iuran Keuangan
                    </span>
                  </div>
                  <select
                    value={formData.depositType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        depositType: newType,
                        description: `Setoran kas uang tunai ${newType} (${prev.source || 'Kas Sekolah'}) ke Kepala Sekolah / Yayasan`
                      }));
                    }}
                    className="w-full bg-slate-50 text-slate-900 font-bold text-sm sm:text-xs p-3 rounded-xl border border-slate-200 outline-none cursor-pointer min-h-[44px]"
                  >
                    {dynamicCategories.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Sumber Dana / Kelas
                  </label>
                  <input
                    type="text"
                    list="sourceList"
                    value={formData.source}
                    onChange={(e) => {
                      const newSource = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        source: newSource,
                        description: `Setoran kas uang tunai ${prev.depositType} (${newSource || 'Kas Sekolah'}) ke Kepala Sekolah / Yayasan`
                      }));
                    }}
                    placeholder="Contoh: Kelas Umar, Kelas Abu Bakar..."
                    className="w-full bg-slate-50 text-slate-900 font-bold text-sm sm:text-xs p-3 rounded-xl border border-slate-200 outline-none min-h-[44px]"
                    required
                  />
                  <datalist id="sourceList">
                    {availableClassSources.map(s => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Quick Select Category Badges for Mobile */}
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                  Pilih Cepat Kategori Iuran:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {dynamicCategories.slice(0, 6).map(c => {
                    const isSelected = formData.depositType === c.id;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            depositType: c.id,
                            description: `Setoran kas uang tunai ${c.id} (${prev.source || 'Kas Sekolah'}) ke Kepala Sekolah / Yayasan`
                          }));
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nominal Setoran & Quick Calculation */}
              <div>
                <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                  <label className="text-xs font-bold text-slate-700">
                    Nominal Uang Cash (Rp)
                  </label>
                  <div className="flex items-center gap-2">
                    {calculateCashForCategory(formData.depositType) > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, amount: calculateCashForCategory(formData.depositType).toString() })}
                        className="text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md hover:bg-blue-100 cursor-pointer"
                        title="Tarik total penerimaan cash untuk kategori ini"
                      >
                        ⚡ Kas {formData.depositType}: {formatRupiah(calculateCashForCategory(formData.depositType))}
                      </button>
                    )}
                    {cashCalculations.remainingCashAtTreasurer > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, amount: cashCalculations.remainingCashAtTreasurer.toString() })}
                        className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100 cursor-pointer"
                      >
                        Isi Sisa Kas ({formatRupiah(cashCalculations.remainingCashAtTreasurer)})
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="number"
                  placeholder="Contoh: 650000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-emerald-50 text-emerald-950 font-black text-lg p-3 rounded-xl border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
                  required
                />
                {Number(formData.amount) > 0 && (
                  <p className="text-[11px] text-emerald-700 font-semibold italic mt-1 leading-tight">
                    Terbilang: "{terbilang(Number(formData.amount))}"
                  </p>
                )}
              </div>

              {/* Keterangan */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Keterangan / Rincian Setoran
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Setoran uang kas tunai ke Kepala Sekolah / Yayasan..."
                  className="w-full bg-slate-50 text-slate-900 font-medium text-sm sm:text-xs p-3 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              {/* Petugas Bendahara & Penerima */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Nama Penyetor (Bendahara)
                  </label>
                  <input
                    type="text"
                    value={formData.treasurerName}
                    onChange={(e) => setFormData({ ...formData, treasurerName: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 font-bold text-sm sm:text-xs p-2.5 rounded-xl border border-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Nama Penerima (Kepsek / Yayasan)
                  </label>
                  <input
                    type="text"
                    value={formData.receiverName}
                    onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 font-bold text-sm sm:text-xs p-2.5 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>

              {/* Checkbox Direct Verify */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start sm:items-center gap-2.5">
                <input
                  type="checkbox"
                  id="directVerif"
                  checked={formData.directVerifyTreasurer}
                  onChange={(e) => setFormData({ ...formData, directVerifyTreasurer: e.target.checked })}
                  className="w-4 h-4 mt-0.5 sm:mt-0 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                />
                <label htmlFor="directVerif" className="text-xs font-bold text-slate-700 cursor-pointer leading-tight">
                  Langsung verifikasi sebagai Bendahara (status lanjut ke verifikasi Kepala Sekolah)
                </label>
              </div>
            </form>

            {/* Fixed Footer with Submit / Cancel Actions */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2 shrink-0 z-20 shadow-md">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer active:scale-95 transition-all text-center"
              >
                Batal
              </button>
              <button
                type="submit"
                form="cashDepositForm"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-5 py-3 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-200 disabled:opacity-50 active:scale-95 text-center flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>Simpan & Terbitkan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL LIHAT BUKTI SETORAN CASH & CETAK (MOBILE-PRECISION FIXED CONTAINER) */}
      {showDetailModal && selectedDeposit && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col h-[85dvh] sm:h-auto max-h-[85dvh] sm:max-h-[88vh] overflow-hidden">
            {/* Header Sticky */}
            <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm z-20">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
                  Dokumen Resmi RA Darusyifa
                </span>
                <h3 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                  Bukti Setoran Cash #{selectedDeposit.depositNumber}
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePrintBukti(selectedDeposit)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer size={14} />
                  <span className="hidden sm:inline">Cetak PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0 overscroll-contain pb-6">
              {/* Kop & Badge No */}
              <div className="text-center pb-3 border-b border-slate-100">
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">RAUDHATUL ATHFAL (RA) DARUSYIFA</h4>
                <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight mt-0.5">
                  BUKTI RESMI SETORAN CASH
                </h3>
                <span className="inline-block px-3 py-0.5 bg-emerald-700 text-white text-xs font-black rounded-full font-mono mt-1.5">
                  {selectedDeposit.depositNumber}
                </span>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Data Penyetor (Bendahara)
                  </span>
                  <div>
                    <span className="text-slate-500 font-medium">Disetor:</span>{' '}
                    <strong className="text-slate-900">{selectedDeposit.treasurerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">NIP/ID:</span>{' '}
                    <strong className="text-slate-900">{selectedDeposit.treasurerNip || 'BDH-001'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Waktu:</span>{' '}
                    <strong className="text-slate-900">{selectedDeposit.date} - {selectedDeposit.time || '08:30'} WIB</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Periode:</span>{' '}
                    <strong className="text-slate-900">{selectedDeposit.periodType}</strong>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Penerima (Kepsek / Yayasan)
                  </span>
                  <div>
                    <span className="text-slate-500 font-medium">Diterima:</span>{' '}
                    <strong className="text-slate-900">{selectedDeposit.receiverName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Jabatan:</span>{' '}
                    <strong className="text-slate-900">{selectedDeposit.receiverTitle}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Jenis:</span>{' '}
                    <span className="text-emerald-700 font-black">{selectedDeposit.depositType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Sumber:</span>{' '}
                    <strong className="text-slate-900">{selectedDeposit.source}</strong>
                  </div>
                </div>
              </div>

              {/* Box Jumlah */}
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Total Uang Tunai Disetorkan
                  </span>
                  <p className="text-[11px] text-emerald-700 italic mt-0.5">
                    "{terbilang(selectedDeposit.amount)}"
                  </p>
                  {selectedDeposit.description && (
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      Keterangan: {selectedDeposit.description}
                    </p>
                  )}
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight">
                  {formatRupiah(selectedDeposit.amount)}
                </div>
              </div>

              {/* 3-Column Verification Signatures Preview */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                {/* 1. Disetor */}
                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between min-h-[90px]">
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Disetor</span>
                  <div className="my-1 font-serif text-base sm:text-lg text-blue-900 font-bold italic">
                    {selectedDeposit.treasurerName.split(' ')[0]}
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-800 block border-t border-slate-300 pt-1 truncate">
                    {selectedDeposit.treasurerName}
                  </span>
                </div>

                {/* 2. Verif Bendahara */}
                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between min-h-[90px]">
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Verif Bendahara</span>
                  {selectedDeposit.treasurerVerified ? (
                    <>
                      <div className="my-1 text-[11px] font-black text-emerald-600">✓ VERIFIED</div>
                      <span className="text-[8px] sm:text-[9px] text-slate-500 block border-t border-slate-300 pt-1">
                        {selectedDeposit.treasurerVerifiedAt || selectedDeposit.date}
                      </span>
                    </>
                  ) : (
                    <button
                      onClick={() => handleVerifyTreasurer(selectedDeposit)}
                      className="my-1 px-2 py-0.5 bg-amber-500 text-white rounded text-[9px] font-bold"
                    >
                      Verifikasi
                    </button>
                  )}
                </div>

                {/* 3. Disahkan Kepsek */}
                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between min-h-[90px]">
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Pengesahan</span>
                  {selectedDeposit.status === 'disahkan' ? (
                    <>
                      <div className="my-1 text-[11px] font-black text-teal-700">★ DISAHKAN ★</div>
                      <span className="text-[8px] sm:text-[9px] text-slate-500 block border-t border-slate-300 pt-1">
                        {selectedDeposit.principalVerifiedAt || selectedDeposit.date}
                      </span>
                    </>
                  ) : (
                    <button
                      onClick={() => handleAuthorizePrincipal(selectedDeposit)}
                      className="my-1 px-2 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-bold"
                    >
                      Sahkan
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2 shrink-0 z-20 shadow-md">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer active:scale-95 transition-all text-center"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => handlePrintBukti(selectedDeposit)}
                className="flex-1 sm:flex-none px-5 py-3 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200 active:scale-95 text-center"
              >
                <Printer size={15} />
                <span>Cetak Dokumen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
