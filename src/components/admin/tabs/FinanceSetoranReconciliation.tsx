import React, { useState, useMemo } from 'react';
import { 
  Banknote, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Search, 
  Download, 
  Coins, 
  X, 
  AlertCircle, 
  Sparkles,
  Users,
  MessageCircle,
  ChevronRight,
  Check,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Wallet
} from 'lucide-react';
import { formatRupiah, terbilang } from '../../../lib/salaryUtils';
import { CashDeposit } from '../../../lib/cashDepositUtils';
import * as XLSX from 'xlsx';

export interface StudentBillingStatus {
  id: string;
  name: string;
  kelas: string;
  nisn?: string;
  whatsapp?: string;
  parentName?: string;
  targetAmount: number;
  paidAmount: number;
  paidCash: number;
  paidTransfer: number;
  paidTabungan: number;
  unpaidAmount: number;
  status: 'lunas' | 'sebagian' | 'belum_bayar';
  paymentMethod?: string;
  lastPaymentDate?: string;
}

export interface CategoryReconciliation {
  id: string;
  name: string;
  group: 'SPP Bulanan' | 'Tabungan Siswa' | 'Non-SPP / Kegiatan' | 'Lainnya';
  isTabungan?: boolean;
  totalTarget: number;
  totalPaidCash: number;
  totalPaidTransfer: number;
  totalPaidTabungan: number;
  totalPaidAll: number;
  totalUnpaidStudentsAmount: number;
  allStudentsCount: number;
  paidStudentsCount: number;
  partialStudentsCount: number;
  unpaidStudentsCount: number;
  studentsList: StudentBillingStatus[];
  totalDepositedDisahkan: number;
  totalDepositedPending: number;
  remainingCashAtTreasurer: number; // Sisa uang tunai yang sudah masuk tapi belum disetor ke kepsek/yayasan
  latestDepositDate: string | null;
  latestDepositAmount: number;
  status: 'sudah_disetor' | 'sebagian_disetor' | 'belum_disetor' | 'belum_ada_pembayaran';
  statusLabel: string;
  // Khusus Tabungan
  tabunganCustomPeriod?: {
    startDate: string;
    endDate: string;
    totalSavingsBalance: number;
    totalDepositedInPeriod: number;
    remainingInPeriod: number;
  };
}

interface FinanceSetoranReconciliationProps {
  payments: any[];
  allUsers: any[];
  deposits: CashDeposit[];
  iuranCategories?: any[];
  schoolClasses?: any[];
  filteredUsersForFinance?: any[];
  onOpenQuickDeposit: (depositData: {
    depositType: string;
    categoryKey: string;
    amount: number;
    description: string;
    source?: string;
    periodType?: 'Harian' | 'Mingguan' | 'Bulanan' | 'Custom';
  }) => void;
  onViewHistoryCategory?: (categoryName: string) => void;
}

export default function FinanceSetoranReconciliation({
  payments,
  allUsers,
  deposits,
  iuranCategories = [],
  schoolClasses = [],
  filteredUsersForFinance = [],
  onOpenQuickDeposit,
  onViewHistoryCategory
}: FinanceSetoranReconciliationProps) {
  // State Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<'all' | 'spp' | 'tabungan' | 'non_spp'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'belum_disetor' | 'sudah_disetor' | 'ada_tunggakan'>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  // Tabungan Date Filter State (Contoh user: 1 Juli 2026 - 30 September 2026)
  const [tabunganStartDate, setTabunganStartDate] = useState('2026-07-01');
  const [tabunganEndDate, setTabunganEndDate] = useState('2026-09-30');
  const [isTabunganDateFiltered, setIsTabunganDateFiltered] = useState(true);

  // Modal Rincian Siswa
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<CategoryReconciliation | null>(null);
  const [modalStudentSearch, setModalStudentSearch] = useState('');
  const [modalClassFilter, setModalClassFilter] = useState('all');
  const [modalStatusTab, setModalStatusTab] = useState<'all' | 'belum_lunas' | 'sebagian' | 'lunas'>('all');

  // Active Students: Memuat SEMUA 55 siswa dari semua kelas tanpa deduplikasi salah
  const activeStudents = useMemo(() => {
    // Gunakan allUsers yang sudah diperbaiki (tidak digabungkan via email)
    return allUsers.filter(u => {
      const isStudent = (u.role || '').toLowerCase() === 'siswa' || (Boolean(u.kelas) && u.role !== 'guru' && u.role !== 'admin');
      const statusLower = (u.status || 'Aktif').toLowerCase();
      const isNotActive = statusLower === 'alumni' || statusLower === 'pindah' || statusLower === 'tidak aktif';
      return isStudent && !isNotActive;
    });
  }, [allUsers]);

  // Breakdown jumlah siswa per kelas
  const classBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    activeStudents.forEach(s => {
      const k = (s.kelas || 'Belum Ada Kelas').trim();
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [activeStudents]);

  // Helper parse rincian metode pembayaran siswa
  const parsePaymentMethod = (p: any) => {
    if (p.status === 'ditolak' || p.status === 'rejected' || p.status === 'pending') {
      return { cash: 0, transfer: 0, tabungan: 0, method: '-' };
    }
    const amt = Number(p.amount) || 0;
    const m = (p.method || p.paymentMethod || '').toLowerCase();
    
    if (m === 'transfer' || m.includes('transfer') || m.includes('bank') || m.includes('qris') || m.includes('online')) {
      return { cash: 0, transfer: amt, tabungan: 0, method: 'Transfer' };
    }
    if (m === 'tabungan' || m.includes('tabung')) {
      return { cash: 0, transfer: 0, tabungan: amt, method: 'Tabungan' };
    }
    if (m === 'campuran') {
      const fromSavings = p.mixedDetails ? (Number(p.mixedDetails.fromSavings) || 0) : 0;
      const fromCash = p.mixedDetails ? (Number(p.mixedDetails.fromCash) || 0) : amt;
      return { cash: fromCash, transfer: 0, tabungan: fromSavings, method: 'Campuran' };
    }
    return { cash: amt, transfer: 0, tabungan: 0, method: 'Tunai' };
  };

  // Helper matching kategori presisi 1:1 dengan Laporan Rekap Keuangan (DashboardAdmin)
  const isFinanceCategoryMatch = (
    itemCat?: string,
    itemName?: string,
    itemDesc?: string,
    targetCatName?: string
  ): boolean => {
    if (!targetCatName || !targetCatName.trim()) return true;
    const f = targetCatName.toLowerCase().trim();
    const c = (itemCat || '').toLowerCase().trim();
    const n = (itemName || '').toLowerCase().trim();
    const d = (itemDesc || '').toLowerCase().trim();
    const combined = `${c} ${n} ${d}`;

    // 1. MANASIK HAJI & OUTING CLASS
    if (f.includes('manasik')) {
      return combined.includes('manasik') || (f.includes('outing') && combined.includes('outing'));
    }

    // 2. MAULID NABI
    if (f.includes('maulid')) {
      return combined.includes('maulid');
    }

    // 3. HUT RI 17 AGUSTUS
    if (f.includes('hut ri') || f.includes('17 agustus')) {
      return combined.includes('hut ri') || combined.includes('17 agustus') || combined.includes('kemerdekaan');
    }

    // 4. PPDB / Pendaftaran
    if (f.includes('ppdb') || f.includes('pendaftaran') || f.includes('formulir')) {
      return combined.includes('ppdb') || combined.includes('pendaftaran') || combined.includes('formulir') || combined.includes('daftar');
    }

    // 5. BUKU LANJUTAN
    if (f.includes('buku')) {
      return combined.includes('buku');
    }

    // 6. PTS GANJIL
    if (f.includes('pts') || f.includes('uts')) {
      return combined.includes('pts') || combined.includes('uts') || combined.includes('tengah semester');
    }

    // 7. SPP BULANAN (Sesuai Bulan Spesifik: Juli, Agustus, September, Oktober, dst.)
    const months = [
      'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
      'januari', 'februari', 'maret', 'april', 'mei', 'juni'
    ];
    for (const m of months) {
      if (f.includes(m)) {
        if (!combined.includes(m)) return false;
        // Kecualikan transaksi pos acara non-SPP yang kebetulan menyebut nama bulan
        const nonSPPWords = ['manasik', 'maulid', 'hut ri', '17 agustus', 'ppdb', 'daftar', 'buku', 'dsp', 'gedung', 'sarana', 'infaq', 'shodaqoh', 'wisuda'];
        if (nonSPPWords.some(w => combined.includes(w))) return false;
        return combined.includes('spp') || combined.includes('bulanan') || combined.includes('iuran') || c === 'spp';
      }
    }

    // 8. DSP / GEDUNG / SARANA
    if (f.includes('dsp') || f.includes('gedung') || f.includes('sarana')) {
      return combined.includes('dsp') || combined.includes('gedung') || combined.includes('sarana');
    }

    // 9. INFAQ & SHODAQOH
    if (f.includes('infaq') || f.includes('shodaqoh') || f.includes('sedekah')) {
      return combined.includes('infaq') || combined.includes('shodaqoh') || combined.includes('sedekah');
    }

    // 10. General / Kategori Kustom lainnya
    const genericWords = new Set(['kegiatan', 'uang', 'iuran', 'biaya', 'dana', 'umum']);
    if (c === f || (c && c.includes(f))) return true;
    if (c && !genericWords.has(c) && f.includes(c)) return true;

    if (n === f || (n && n.includes(f))) return true;
    if (n && !genericWords.has(n) && f.includes(n)) return true;

    if (d && (d === f || d.includes(f))) return true;

    return false;
  };

  // Helper matching deposit setoran cash bendahara dengan kategori iuran
  const matchesDepositCategory = (catName: string, deposit: CashDeposit): boolean => {
    // 1. Direct categoryKey match jika disetor via tombol cepat
    if (deposit.categoryKey) {
      const ck = deposit.categoryKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cn = catName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (ck === cn || ck.includes(cn) || cn.includes(ck)) return true;
    }

    const dType = (deposit.depositType || '').toLowerCase().trim();
    const dDesc = (deposit.description || '').toLowerCase().trim();
    const cName = catName.toLowerCase().trim();

    // Setoran tabungan hanya mencocokkan tabungan
    if (cName.includes('tabung')) {
      return dType.includes('tabung') || dDesc.includes('tabung');
    }
    if (dType.includes('tabung') || dDesc.includes('tabung')) {
      return false;
    }

    // Kesamaan langsung
    if (dType === cName || dDesc.includes(cName)) return true;

    // Manasik
    if (cName.includes('manasik')) {
      return dType.includes('manasik') || dDesc.includes('manasik');
    }

    // Maulid
    if (cName.includes('maulid')) {
      return dType.includes('maulid') || dDesc.includes('maulid');
    }

    // HUT RI 17 Agustus
    if (cName.includes('hut ri') || cName.includes('17 agustus')) {
      return dType.includes('hut ri') || dDesc.includes('hut ri') || dType.includes('17 agustus') || dDesc.includes('17 agustus');
    }

    // Buku Lanjutan
    if (cName.includes('buku')) {
      return dType.includes('buku') || dDesc.includes('buku');
    }

    // PPDB
    if (cName.includes('ppdb') || cName.includes('daftar')) {
      return dType.includes('ppdb') || dDesc.includes('ppdb') || dType.includes('daftar') || dDesc.includes('daftar');
    }

    // PTS Ganjil
    if (cName.includes('pts') || cName.includes('uts')) {
      return dType.includes('pts') || dDesc.includes('pts') || dType.includes('uts') || dDesc.includes('uts');
    }

    // SPP Bulanan
    if (cName.includes('spp') || cName.includes('bulanan')) {
      const months = ['juli', 'agustus', 'september', 'oktober', 'november', 'desember', 'januari', 'februari', 'maret', 'april', 'mei', 'juni'];
      for (const m of months) {
        if (cName.includes(m)) {
          return (dType.includes(m) || dDesc.includes(m)) && 
                 (dType.includes('spp') || dType.includes('bulanan') || dDesc.includes('spp') || dDesc.includes('bulanan') || dType === 'iuran bulanan');
        }
      }
      return dType.includes('spp') || dType.includes('bulanan') || dDesc.includes('spp');
    }

    return false;
  };

  // REKONSILIASI LENGKAP SEMUA KATEGORI & TABUNGAN
  const reconciliations = useMemo<CategoryReconciliation[]>(() => {
    const list: CategoryReconciliation[] = [];

    // 1. REKONSILIASI KHUSUS: TABUNGAN SISWA
    // Total saldo tabungan riil seluruh siswa aktif
    const totalSavingsBalanceAllStudents = activeStudents.reduce((sum, u) => sum + (Number(u.savings) || 0), 0);

    const tabunganPayments = payments.filter(p => {
      if (p.status === 'ditolak' || p.status === 'rejected') return false;
      const pType = (p.type || '').toLowerCase();
      const pCat = (p.category || p.iuranName || '').toLowerCase();
      return pType === 'tabungan' || pType === 'tabungan_masuk' || pCat.includes('tabung');
    });

    const tabunganCashPayments = tabunganPayments.filter(p => {
      const parsed = parsePaymentMethod(p);
      return parsed.cash > 0;
    });
    const totalTabunganCashIn = tabunganCashPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

    // Penarikan tabungan tunai
    const tabunganCashOut = payments
      .filter(p => p.status !== 'ditolak' && (p.type || '').toLowerCase() === 'tabungan_keluar')
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const netTabunganCashIn = Math.max(0, totalTabunganCashIn - tabunganCashOut);
    const totalTabunganMasukSemua = Math.max(totalSavingsBalanceAllStudents, netTabunganCashIn);

    // Setoran cash Tabungan yang telah disahkan bendahara
    const tabunganDeposits = deposits.filter(d => {
      const typeLower = (d.depositType || '').toLowerCase();
      const descLower = (d.description || '').toLowerCase();
      return typeLower === 'tabungan' || descLower.includes('tabung');
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // Filter setoran tabungan berdasarkan rentang tanggal jika aktif
    const filteredTabunganDeposits = isTabunganDateFiltered
      ? tabunganDeposits.filter(d => {
          if (tabunganStartDate && (d.date || '') < tabunganStartDate) return false;
          if (tabunganEndDate && (d.date || '') > tabunganEndDate) return false;
          return true;
        })
      : tabunganDeposits;

    const totalTabunganDepositedDisahkan = filteredTabunganDeposits
      .filter(d => d.status === 'disahkan')
      .reduce((s, d) => s + (Number(d.amount) || 0), 0);

    const totalTabunganDepositedPending = filteredTabunganDeposits
      .filter(d => d.status !== 'disahkan' && d.status !== 'ditolak')
      .reduce((s, d) => s + (Number(d.amount) || 0), 0);

    const remainingTabunganCash = Math.max(0, totalTabunganMasukSemua - totalTabunganDepositedDisahkan);

    const latestTabunganDeposit = tabunganDeposits[0];
    const latestTabunganDepositDate = latestTabunganDeposit ? latestTabunganDeposit.date : null;
    const latestTabunganDepositAmount = latestTabunganDeposit ? (Number(latestTabunganDeposit.amount) || 0) : 0;

    let tabunganStatus: CategoryReconciliation['status'] = 'belum_ada_pembayaran';
    let tabunganStatusLabel = 'Belum Ada Setoran Tabungan Siswa';
    if (totalTabunganMasukSemua > 0) {
      if (remainingTabunganCash === 0) {
        tabunganStatus = 'sudah_disetor';
        tabunganStatusLabel = 'Sudah Disetor Penuh ke Kas/Bank Sekolah';
      } else if (totalTabunganDepositedDisahkan > 0) {
        tabunganStatus = 'sebagian_disetor';
        tabunganStatusLabel = `Disetor Sebagian (Sisa ${formatRupiah(remainingTabunganCash)} di Bendahara)`;
      } else {
        tabunganStatus = 'belum_disetor';
        tabunganStatusLabel = `Belum Disetor (${formatRupiah(remainingTabunganCash)} di Bendahara)`;
      }
    }

    // Daftar siswa tabungan
    const tabunganStudentList: StudentBillingStatus[] = activeStudents.map(st => {
      const savings = Number(st.savings) || 0;
      return {
        id: st.id,
        name: st.name || 'Siswa',
        kelas: st.kelas || '-',
        nisn: st.nisn || '',
        whatsapp: st.whatsapp || st.phone || '',
        parentName: st.parentName || st.namaWali || '',
        targetAmount: savings,
        paidAmount: savings,
        paidCash: savings,
        paidTransfer: 0,
        paidTabungan: 0,
        unpaidAmount: 0,
        status: savings > 0 ? 'lunas' : 'belum_bayar',
        paymentMethod: 'Tunai',
        lastPaymentDate: st.updatedAt || '-'
      };
    });

    list.push({
      id: 'tabungan_siswa',
      name: 'Tabungan Siswa (Semua Kelas)',
      group: 'Tabungan Siswa',
      isTabungan: true,
      totalTarget: totalTabunganMasukSemua,
      totalPaidCash: totalTabunganMasukSemua,
      totalPaidTransfer: 0,
      totalPaidTabungan: 0,
      totalPaidAll: totalTabunganMasukSemua,
      totalUnpaidStudentsAmount: 0,
      allStudentsCount: activeStudents.length,
      paidStudentsCount: activeStudents.filter(s => (s.savings || 0) > 0).length,
      partialStudentsCount: 0,
      unpaidStudentsCount: activeStudents.filter(s => (s.savings || 0) === 0).length,
      studentsList: tabunganStudentList,
      totalDepositedDisahkan: totalTabunganDepositedDisahkan,
      totalDepositedPending: totalTabunganDepositedPending,
      remainingCashAtTreasurer: remainingTabunganCash,
      latestDepositDate: latestTabunganDepositDate,
      latestDepositAmount: latestTabunganDepositAmount,
      status: tabunganStatus,
      statusLabel: tabunganStatusLabel,
      tabunganCustomPeriod: {
        startDate: tabunganStartDate,
        endDate: tabunganEndDate,
        totalSavingsBalance: totalTabunganMasukSemua,
        totalDepositedInPeriod: totalTabunganDepositedDisahkan,
        remainingInPeriod: remainingTabunganCash
      }
    });

    // 2. REKONSILIASI KATEGORI IURAN RESMI (Persis Sesuai Dropdown Laporan Rekap Keuangan)
    // Berdasarkan gambar resmi sistem: BUKU LANJUTAN, HUT RI 17 AGUSTUS, MANASIK HAJI & OUTING CLASS, MAULID NABI MUHAMMAD SAW, PPDB, PTS GANJIL, SPP AGUSTUS, SPP JULI, SPP OKTOBER, SPP SEPTEMBER
    const canonicalCategories: { id: string; name: string; group: 'SPP Bulanan' | 'Non-SPP / Kegiatan'; monthKeyword?: string }[] = [
      { id: 'manasik_haji_outing_class', name: 'MANASIK HAJI & OUTING CLASS', group: 'Non-SPP / Kegiatan' },
      { id: 'spp_oktober', name: 'SPP OKTOBER', group: 'SPP Bulanan', monthKeyword: 'oktober' },
      { id: 'spp_september', name: 'SPP SEPTEMBER', group: 'SPP Bulanan', monthKeyword: 'september' },
      { id: 'spp_agustus', name: 'SPP AGUSTUS', group: 'SPP Bulanan', monthKeyword: 'agustus' },
      { id: 'spp_juli', name: 'SPP JULI', group: 'SPP Bulanan', monthKeyword: 'juli' },
      { id: 'pts_ganjil', name: 'PTS GANJIL', group: 'Non-SPP / Kegiatan' },
      { id: 'maulid_nabi', name: 'MAULID NABI MUHAMMAD SAW', group: 'Non-SPP / Kegiatan' },
      { id: 'hut_ri_17_agustus', name: 'HUT RI 17 AGUSTUS', group: 'Non-SPP / Kegiatan' },
      { id: 'buku_lanjutan', name: 'BUKU LANJUTAN', group: 'Non-SPP / Kegiatan' },
      { id: 'ppdb', name: 'PPDB', group: 'Non-SPP / Kegiatan' },
    ];

    // Sisipkan kategori lain dari Firestore iuranCategories jika ada yang belum tercakup
    const categoriesToProcess = [...canonicalCategories];
    if (iuranCategories && Array.isArray(iuranCategories)) {
      iuranCategories.forEach((cat: any) => {
        const catName = (typeof cat === 'string' ? cat : cat.name || '').trim();
        if (catName && !catName.toLowerCase().includes('tabung')) {
          const upper = catName.toUpperCase();
          const already = categoriesToProcess.some(c => 
            c.name.toUpperCase() === upper || 
            (upper.includes('MANASIK') && c.id === 'manasik_haji_outing_class') ||
            (upper.includes('HUT RI') && c.id === 'hut_ri_17_agustus') ||
            (upper.includes('MAULID') && c.id === 'maulid_nabi') ||
            (upper.includes('BUKU') && c.id === 'buku_lanjutan') ||
            (upper.includes('PPDB') && c.id === 'ppdb') ||
            (upper.includes('PTS') && c.id === 'pts_ganjil')
          );
          if (!already) {
            const isSPP = upper.includes('SPP') || upper.includes('BULANAN');
            const cleanId = catName.toLowerCase().replace(/[^a-z0-9]/g, '_');
            categoriesToProcess.push({
              id: cleanId,
              name: catName,
              group: isSPP ? 'SPP Bulanan' : 'Non-SPP / Kegiatan'
            });
          }
        }
      });
    }

    // Proses setiap kategori secara akurat
    categoriesToProcess.forEach(cat => {
      const isSPP = cat.group === 'SPP Bulanan';
      const isManasik = cat.name.toUpperCase().includes('MANASIK') || cat.id === 'manasik_haji_outing_class';
      const catName = cat.name.trim();

      // Nominal Standar Resmi:
      // SPP: Rp 50.000 / siswa
      // Manasik: Rp 200.000 / siswa (instruksi langsung dari user: tagihan manasik kan 200.000)
      const defaultSPPAmount = 50000;
      const defaultManasikAmount = 200000;

      const studentsList: StudentBillingStatus[] = [];
      let totalPaidCashForCat = 0;
      let totalPaidTransferForCat = 0;
      let totalPaidTabunganForCat = 0;
      let totalUnpaidForCat = 0;
      let paidCount = 0;
      let partialCount = 0;
      let unpaidCount = 0;

      activeStudents.forEach(st => {
        // 1. Ambil pembayaran riil siswa dari koleksi payments untuk kategori ini
        let stPaidCash = 0;
        let stPaidTransfer = 0;
        let stPaidTabungan = 0;
        let lastPayDate = '';
        let lastMethod = '-';

        payments.forEach(p => {
          if (p.studentId !== st.id) return;
          if (p.status === 'ditolak' || p.status === 'rejected' || p.status === 'pending') return;
          const pType = (p.type || '').toLowerCase();
          if (pType === 'tagihan' || pType === 'tabungan' || pType === 'tabungan_masuk' || pType === 'tabungan_keluar') return;

          const isMatch = isFinanceCategoryMatch(p.iuranCategory || p.category, p.iuranName || p.name, p.description, catName);
          if (isMatch) {
            const amt = Number(p.amount) || 0;
            const m = (p.method || p.paymentMethod || '').toLowerCase();
            if (m === 'transfer' || m.includes('bank') || m.includes('qris') || m.includes('online')) {
              stPaidTransfer += amt;
              lastMethod = 'Transfer';
            } else if (m === 'tabungan' || m.includes('tabung')) {
              stPaidTabungan += amt;
              lastMethod = 'Tabungan';
            } else if (m === 'campuran') {
              if (p.mixedDetails) {
                const sPart = Number(p.mixedDetails.fromSavings) || 0;
                const cPart = Number(p.mixedDetails.fromCash) || 0;
                stPaidTabungan += sPart;
                stPaidCash += cPart;
              } else {
                stPaidCash += amt;
              }
              lastMethod = 'Campuran';
            } else {
              stPaidCash += amt;
              lastMethod = 'Tunai';
            }
            if (p.date) lastPayDate = p.date;
          }
        });

        const stPaidTotal = stPaidCash + stPaidTransfer + stPaidTabungan;

        // 2. Ambil tunggakan riil siswa dari arrears_details
        let recordedArrearsAmount = 0;
        (st.arrears_details || []).forEach((a: any) => {
          if (isFinanceCategoryMatch(a.category, a.name, '', catName)) {
            recordedArrearsAmount += Number(a.amount) || 0;
          }
        });

        let stUnpaidAmount = 0;
        let stTargetAmount = 0;
        let stStatus: StudentBillingStatus['status'] = 'lunas';

        if (isManasik) {
          // KHUSUS MANASIK HAJI: Kewajiban resmi Rp 200.000 / siswa
          stTargetAmount = defaultManasikAmount;
          if (recordedArrearsAmount > 0) {
            stUnpaidAmount = recordedArrearsAmount;
          } else if (stPaidTotal >= defaultManasikAmount) {
            stUnpaidAmount = 0;
          } else {
            // Siswa belum lunas Manasik Haji
            stUnpaidAmount = Math.max(0, defaultManasikAmount - stPaidTotal);
          }
        } else if (isSPP) {
          // SPP Bulanan: Kewajiban standar Rp 50.000 / siswa
          stTargetAmount = defaultSPPAmount;
          if (recordedArrearsAmount > 0) {
            stUnpaidAmount = recordedArrearsAmount;
          } else if (stPaidTotal >= defaultSPPAmount) {
            stUnpaidAmount = 0;
          } else {
            stUnpaidAmount = Math.max(0, defaultSPPAmount - stPaidTotal);
          }
        } else {
          // Non-SPP Lainnya (PPDB, Buku Lanjutan, Maulid, HUT RI, PTS, dll)
          stUnpaidAmount = recordedArrearsAmount;
          stTargetAmount = stPaidTotal + stUnpaidAmount;
        }

        // Tentukan Status Siswa
        if (stUnpaidAmount > 0 && stPaidTotal > 0) {
          stStatus = 'sebagian';
          partialCount++;
        } else if (stUnpaidAmount > 0 && stPaidTotal === 0) {
          stStatus = 'belum_bayar';
          unpaidCount++;
        } else {
          stStatus = 'lunas';
          if (stTargetAmount > 0 || stPaidTotal > 0) paidCount++;
        }

        totalPaidCashForCat += stPaidCash;
        totalPaidTransferForCat += stPaidTransfer;
        totalPaidTabunganForCat += stPaidTabungan;
        totalUnpaidForCat += stUnpaidAmount;

        studentsList.push({
          id: st.id,
          name: st.name || 'Siswa',
          kelas: st.kelas || '-',
          nisn: st.nisn || '',
          whatsapp: st.whatsapp || st.phone || '',
          parentName: st.parentName || st.namaWali || '',
          targetAmount: stTargetAmount,
          paidAmount: stPaidTotal,
          paidCash: stPaidCash,
          paidTransfer: stPaidTransfer,
          paidTabungan: stPaidTabungan,
          unpaidAmount: stUnpaidAmount,
          status: stStatus,
          paymentMethod: stPaidTotal > 0 ? lastMethod : '-',
          lastPaymentDate: lastPayDate || '-'
        });
      });

      // 3. SINKRONISASI DENGAN RIWAYAT & PENGESAHAN SETORAN CASH
      // Cari setoran cash bendahara ke Kepala Sekolah / Yayasan untuk pos ini
      const matchingDeposits = deposits.filter(d => matchesDepositCategory(cat.name, d))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      const totalDepositedDisahkan = matchingDeposits
        .filter(d => d.status === 'disahkan')
        .reduce((s, d) => s + (Number(d.amount) || 0), 0);

      const totalDepositedPending = matchingDeposits
        .filter(d => d.status !== 'disahkan' && d.status !== 'ditolak')
        .reduce((s, d) => s + (Number(d.amount) || 0), 0);

      // KUNCI UTAMA: HANYA UANG KAS FISIK (TUNAI) YANG DISETOR SECARA MANUAL OLEH BENDAHARA
      // Transfer sudah otomatis masuk rekening bank sekolah, Tabungan adalah potongan saldo internal.
      // Sisa kas tunai di bendahara yang BELUM disetorkan ke Kepala Sekolah / Yayasan:
      const remainingCashAtTreasurer = Math.max(0, totalPaidCashForCat - totalDepositedDisahkan);
      const totalPaidAllCat = totalPaidCashForCat + totalPaidTransferForCat + totalPaidTabunganForCat;
      const totalTargetAll = totalPaidAllCat + totalUnpaidForCat;

      const latestDeposit = matchingDeposits[0];
      const latestDepositDate = latestDeposit ? latestDeposit.date : null;
      const latestDepositAmount = latestDeposit ? (Number(latestDeposit.amount) || 0) : 0;

      let status: CategoryReconciliation['status'] = 'belum_ada_pembayaran';
      let statusLabel = 'Belum Ada Pembayaran Tunai Siswa';
      if (totalPaidCashForCat > 0) {
        if (remainingCashAtTreasurer === 0 && totalDepositedDisahkan > 0) {
          status = 'sudah_disetor';
          statusLabel = 'Sudah Disetor Penuh ke Kas Sekolah';
        } else if (totalDepositedDisahkan > 0) {
          status = 'sebagian_disetor';
          statusLabel = `Disetor Sebagian (Sisa ${formatRupiah(remainingCashAtTreasurer)} di Bendahara)`;
        } else {
          status = 'belum_disetor';
          statusLabel = `Belum Disetor (${formatRupiah(remainingCashAtTreasurer)} di Bendahara)`;
        }
      }

      list.push({
        id: cat.id,
        name: cat.name,
        group: cat.group,
        totalTarget: totalTargetAll,
        totalPaidCash: totalPaidCashForCat,
        totalPaidTransfer: totalPaidTransferForCat,
        totalPaidTabungan: totalPaidTabunganForCat,
        totalPaidAll: totalPaidAllCat,
        totalUnpaidStudentsAmount: totalUnpaidForCat,
        allStudentsCount: activeStudents.length,
        paidStudentsCount: paidCount,
        partialStudentsCount: partialCount,
        unpaidStudentsCount: unpaidCount,
        studentsList,
        totalDepositedDisahkan,
        totalDepositedPending,
        remainingCashAtTreasurer,
        latestDepositDate,
        latestDepositAmount,
        status,
        statusLabel
      });
    });

    return list;
  }, [payments, activeStudents, deposits, iuranCategories, isTabunganDateFiltered, tabunganStartDate, tabunganEndDate]);

  // Global Ringkasan Rekonsiliasi
  const globalSummary = useMemo(() => {
    let grandTotalPaidCash = 0;
    let grandTotalDeposited = 0;
    let grandTotalRemainingToDeposit = 0;
    let grandTotalUnpaidStudents = 0;
    let countCategoriesPendingDeposit = 0;

    reconciliations.forEach(rec => {
      grandTotalPaidCash += rec.totalPaidCash;
      grandTotalDeposited += rec.totalDepositedDisahkan;
      grandTotalRemainingToDeposit += rec.remainingCashAtTreasurer;
      grandTotalUnpaidStudents += rec.totalUnpaidStudentsAmount;

      if (rec.remainingCashAtTreasurer > 0) {
        countCategoriesPendingDeposit++;
      }
    });

    return {
      grandTotalPaidCash,
      grandTotalDeposited,
      grandTotalRemainingToDeposit,
      grandTotalUnpaidStudents,
      countCategoriesPendingDeposit
    };
  }, [reconciliations]);

  const tabunganItem = useMemo(() => reconciliations.find(r => r.isTabungan), [reconciliations]);

  // Filtered List
  const filteredReconciliations = useMemo(() => {
    return reconciliations.filter(item => {
      if (selectedGroup === 'spp' && item.group !== 'SPP Bulanan') return false;
      if (selectedGroup === 'tabungan' && !item.isTabungan) return false;
      if (selectedGroup === 'non_spp' && (item.group === 'SPP Bulanan' || item.isTabungan)) return false;

      if (selectedStatusFilter === 'belum_disetor' && item.remainingCashAtTreasurer <= 0) return false;
      if (selectedStatusFilter === 'sudah_disetor' && item.status !== 'sudah_disetor') return false;
      if (selectedStatusFilter === 'ada_tunggakan' && item.totalUnpaidStudentsAmount <= 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchGroup = item.group.toLowerCase().includes(q);
        const matchStatus = item.statusLabel.toLowerCase().includes(q);
        if (!matchName && !matchGroup && !matchStatus) return false;
      }

      return true;
    });
  }, [reconciliations, selectedGroup, selectedStatusFilter, searchQuery]);

  // Open Modal 55 Siswa
  const handleOpenStudentModal = (cat: CategoryReconciliation) => {
    setSelectedCategoryForModal(cat);
    setModalStudentSearch('');
    setModalClassFilter('all');
    setModalStatusTab('all');
    setShowStudentModal(true);
  };

  // Filter siswa dalam modal
  const modalFilteredStudents = useMemo(() => {
    if (!selectedCategoryForModal) return [];
    return selectedCategoryForModal.studentsList.filter(st => {
      if (modalClassFilter !== 'all' && st.kelas !== modalClassFilter) return false;
      
      if (modalStatusTab === 'belum_lunas' && st.status === 'lunas') return false;
      if (modalStatusTab === 'sebagian' && st.status !== 'sebagian') return false;
      if (modalStatusTab === 'lunas' && st.status !== 'lunas') return false;

      if (modalStudentSearch.trim()) {
        const q = modalStudentSearch.toLowerCase();
        const matchName = st.name.toLowerCase().includes(q);
        const matchKelas = st.kelas.toLowerCase().includes(q);
        const matchNisn = (st.nisn || '').toLowerCase().includes(q);
        if (!matchName && !matchKelas && !matchNisn) return false;
      }

      return true;
    });
  }, [selectedCategoryForModal, modalClassFilter, modalStatusTab, modalStudentSearch]);

  // WhatsApp Link Generator
  const generateWhatsAppLink = (student: StudentBillingStatus, categoryName: string) => {
    let phone = (student.whatsapp || '').replace(/[^0-9]/g, '');
    if (!phone) return null;
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
    
    const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nYth. Bapak/Ibu Wali dari ananda *${student.name}* (${student.kelas}),\n\nKami menginformasikan tagihan *${categoryName}* sebesar *${formatRupiah(student.unpaidAmount)}* masih tercatat belum lunas (sudah terbayar: ${formatRupiah(student.paidAmount)}).\n\nPembayaran tunai dapat dilakukan langsung di bendahara sekolah atau transfer ke rekening resmi sekolah.\n\nTerima kasih.\nWassalamu'alaikum Warahmatullahi Wabarakatuh.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  // Export Excel
  const handleExportReconciliationExcel = () => {
    const rowsSummary = filteredReconciliations.map((item, idx) => ({
      'No': idx + 1,
      'Pos Keuangan / Kategori': item.name,
      'Kelompok': item.group,
      'Target Total Tagihan (Rp)': item.totalTarget,
      'Total Siswa': item.allStudentsCount,
      'Siswa Lunas': item.paidStudentsCount,
      'Siswa Bayar Sebagian': item.partialStudentsCount,
      'Siswa Belum Bayar': item.unpaidStudentsCount,
      'Terbayar Tunai (Rp)': item.totalPaidCash,
      'Terbayar Transfer (Rp)': item.totalPaidTransfer,
      'Terbayar Tabungan (Rp)': item.totalPaidTabungan,
      'Total Terbayar (Rp)': item.totalPaidAll,
      'Disetorkan ke Kas Sekolah (Rp)': item.totalDepositedDisahkan,
      'Sisa Kas Belum Disetor di Bendahara (Rp)': item.remainingCashAtTreasurer,
      'Sisa Tunggakan Siswa (Rp)': item.totalUnpaidStudentsAmount,
      'Tanggal Setoran Terakhir': item.latestDepositDate || 'Belum Pernah Setor',
      'Status Setoran Cash': item.statusLabel
    }));

    const wsSummary = XLSX.utils.json_to_sheet(rowsSummary);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Rekonsiliasi Kas');

    // Sheet Siswa Lengkap
    if (selectedCategoryForModal) {
      const studentRows = selectedCategoryForModal.studentsList.map((st, i) => ({
        'No': i + 1,
        'Kategori': selectedCategoryForModal.name,
        'Nama Siswa': st.name,
        'Kelas': st.kelas,
        'NISN': st.nisn || '-',
        'Target Tagihan (Rp)': st.targetAmount,
        'Bayar Tunai (Rp)': st.paidCash,
        'Bayar Transfer (Rp)': st.paidTransfer,
        'Dari Tabungan (Rp)': st.paidTabungan,
        'Total Sudah Dibayar (Rp)': st.paidAmount,
        'Sisa Tunggakan (Rp)': st.unpaidAmount,
        'Status': st.status === 'lunas' ? 'Lunas' : st.status === 'sebagian' ? 'Bayar Sebagian' : 'Belum Bayar',
        'Metode Bayar': st.paymentMethod || '-',
        'No WhatsApp': st.whatsapp || '-'
      }));
      const wsStudents = XLSX.utils.json_to_sheet(studentRows);
      XLSX.utils.book_append_sheet(wb, wsStudents, `Status Siswa (${activeStudents.length})`);
    }

    XLSX.writeFile(wb, `Rekonsiliasi_Setoran_Cash_${activeStudents.length}_Siswa_RA_Darusyifa_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. DATA SISWA VERIFICATION BANNER (55 SISWA LENGKAP SEMUA KELAS) */}
      <div className="bg-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
            <Users size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-slate-900">
                Data Lengkap Siswa Aktif: <span className="text-emerald-700 text-base">{activeStudents.length} Siswa</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                Semua Kelas Sinkron
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-2 mt-0.5 flex-wrap">
              {Object.entries(classBreakdown).map(([k, cnt]) => (
                <span key={k} className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-bold">
                  {k}: <strong className="text-slate-900">{cnt}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="text-right flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleExportReconciliationExcel}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download size={14} />
            <span>Export Rekap Excel</span>
          </button>
        </div>
      </div>

      {/* 2. DEDICATED TABUNGAN REKONSILIASI DENGAN FILTER PERIODE JELAS */}
      {tabunganItem && (
        <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 text-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 shadow-lg relative overflow-hidden border border-emerald-900/40">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-black uppercase tracking-wider text-emerald-300 mb-2">
                  <Coins size={14} />
                  Rekonsiliasi Tabungan Siswa
                </div>
                <h3 className="text-lg sm:text-2xl font-black tracking-tight">
                  Monitoring Sisa Setoran Kas Tabungan
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl">
                  Bandingkan total tabungan masuk dari 55 siswa dengan setoran fisik yang telah disahkan bendahara ke kas/bank sekolah.
                </p>
              </div>

              {/* Date Filter Toolbar for Tabungan */}
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 flex flex-wrap items-center gap-2 self-start lg:self-auto">
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-200">
                  <Calendar size={13} />
                  <span>Periode Setoran:</span>
                </div>
                <input
                  type="date"
                  value={tabunganStartDate}
                  onChange={(e) => setTabunganStartDate(e.target.value)}
                  className="bg-black/30 text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-white/20 outline-none"
                />
                <span className="text-xs text-emerald-200 font-bold">s/d</span>
                <input
                  type="date"
                  value={tabunganEndDate}
                  onChange={(e) => setTabunganEndDate(e.target.value)}
                  className="bg-black/30 text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-white/20 outline-none"
                />
                <button
                  onClick={() => setIsTabunganDateFiltered(!isTabunganDateFiltered)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    isTabunganDateFiltered ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-white/20 text-white'
                  }`}
                >
                  {isTabunganDateFiltered ? 'Filter Aktif' : 'Semua Waktu'}
                </button>
              </div>
            </div>

            {/* 3 Metric Cards for Tabungan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
                <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider block">
                  Total Semua Tabungan Masuk ({activeStudents.length} Siswa)
                </span>
                <div className="text-xl sm:text-2xl font-black text-white mt-1">
                  {formatRupiah(tabunganItem.totalTarget)}
                </div>
                <span className="text-[10px] text-emerald-200/70 block mt-0.5">
                  Saldo riil tabungan yang dihimpun
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
                <span className="text-[10px] font-bold text-teal-200 uppercase tracking-wider block">
                  Sudah Disetor Bendahara ({tabunganStartDate} s/d {tabunganEndDate})
                </span>
                <div className="text-xl sm:text-2xl font-black text-teal-300 mt-1">
                  {formatRupiah(tabunganItem.totalDepositedDisahkan)}
                </div>
                <span className="text-[10px] text-teal-200/70 block mt-0.5">
                  Setoran resmi disahkan Kepala Sekolah
                </span>
              </div>

              <div className="bg-amber-500/20 backdrop-blur-md p-4 rounded-2xl border border-amber-400/40">
                <span className="text-[10px] font-black text-amber-200 uppercase tracking-wider block">
                  Sisa Tabungan Belum Disetor (di Bendahara)
                </span>
                <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
                  {formatRupiah(tabunganItem.remainingCashAtTreasurer)}
                </div>
                <span className="text-[10px] text-amber-200/80 block mt-0.5">
                  {tabunganItem.remainingCashAtTreasurer > 0 ? '⚠️ Uang fisik masih di kas bendahara' : '✓ Sudah disetor penuh'}
                </span>
              </div>
            </div>

            {/* Box Keterangan Naratif Jelas (Sesuai Permintaan User) */}
            <div className="bg-black/30 p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs leading-relaxed">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Check size={12} /> Keterangan Rekonsiliasi Tabungan:
                </span>
                <p className="text-emerald-50">
                  Dari total seluruh tabungan siswa sebesar <strong className="text-white underline">{formatRupiah(tabunganItem.totalTarget)}</strong>, 
                  bendahara telah menyetorkan <strong className="text-teal-300">{formatRupiah(tabunganItem.totalDepositedDisahkan)}</strong> (periode {tabunganStartDate} s/d {tabunganEndDate}). 
                  Artinya <strong className="text-amber-300 font-bold">masih terdapat Sisa {formatRupiah(tabunganItem.remainingCashAtTreasurer)}</strong> tabungan tunai yang belum disetorkan ke bank/sekolah.
                </p>
              </div>

              {tabunganItem.remainingCashAtTreasurer > 0 && (
                <button
                  onClick={() => onOpenQuickDeposit({
                    depositType: 'Tabungan',
                    categoryKey: 'tabungan_siswa',
                    amount: tabunganItem.remainingCashAtTreasurer,
                    description: `Setoran sisa uang tabungan siswa (Sisa Rp ${tabunganItem.remainingCashAtTreasurer.toLocaleString('id-ID')} periode ${tabunganStartDate} s/d ${tabunganEndDate})`,
                    periodType: 'Harian'
                  })}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Sparkles size={15} />
                  <span>Setor Sisa ({formatRupiah(tabunganItem.remainingCashAtTreasurer)})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. TOP KPI CARDS GLOBAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Sisa Kas di Bendahara */}
        <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-[1.75rem] border shadow-sm relative overflow-hidden ${
          globalSummary.grandTotalRemainingToDeposit > 0 
            ? 'bg-gradient-to-br from-amber-50 to-orange-50/70 border-amber-200 ring-2 ring-amber-300/40' 
            : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <Coins size={14} className="text-amber-600" />
              Sisa Kas di Bendahara
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-200 text-amber-900">
              Belum Setor
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {formatRupiah(globalSummary.grandTotalRemainingToDeposit)}
          </h3>
          <p className="text-[11px] text-slate-600 font-medium mt-1">
            Uang fisik di bendahara yang belum disahkan ke kas sekolah ({globalSummary.countCategoriesPendingDeposit} pos).
          </p>
        </div>

        {/* Siswa Belum Bayar (Tunggakan) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[1.75rem] border border-rose-100 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-rose-50/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <Users size={14} className="text-rose-600" />
              Siswa Belum Bayar (Tunggakan)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
              Piutang Siswa
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-rose-700 tracking-tight">
            {formatRupiah(globalSummary.grandTotalUnpaidStudents)}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Total sisa tagihan dari siswa yang belum lunas/belum bayar.
          </p>
        </div>

        {/* Total Tunai Diterima */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[1.75rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Banknote size={14} className="text-emerald-600" />
              Tunai Diterima dari Siswa
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800">
              Kas Masuk
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {formatRupiah(globalSummary.grandTotalPaidCash)}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Penerimaan tunai siswa yang tercatat di sistem keuangan.
          </p>
        </div>

        {/* Resmi Disahkan ke Kas Sekolah */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[1.75rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-teal-600" />
              Disahkan ke Kas Sekolah
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-50 text-teal-800">
              Resmi Sah
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-teal-800 tracking-tight">
            {formatRupiah(globalSummary.grandTotalDeposited)}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Setoran fisik yang telah disahkan Kepala Sekolah.
          </p>
        </div>
      </div>

      {/* 4. FILTER TOOLBAR */}
      <div className="bg-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 border border-slate-100 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto custom-scrollbar">
            {[
              { id: 'all', label: 'Semua Kategori' },
              { id: 'spp', label: 'SPP Bulanan' },
              { id: 'tabungan', label: 'Tabungan Siswa' },
              { id: 'non_spp', label: 'Kegiatan & Biaya Lain' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedGroup(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedGroup === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs font-bold text-slate-500">
            Total Pos: <strong className="text-emerald-700">{filteredReconciliations.length}</strong> Kategori
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kategori, SPP Agustus, kegiatan, dll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 text-xs font-bold text-slate-800 pl-8 pr-3 py-2 rounded-xl border border-slate-200 outline-none"
            />
          </div>

          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="w-full bg-slate-50 text-xs font-bold text-slate-800 px-3 py-2 rounded-xl border border-slate-200 outline-none cursor-pointer"
            >
              <option value="all">Semua Status Setoran</option>
              <option value="belum_disetor">⚠️ Belum Disetor (Ada Sisa Kas di Bendahara)</option>
              <option value="sudah_disetor">✓ Sudah Disetor Penuh</option>
              <option value="ada_tunggakan">👥 Ada Siswa Belum Bayar</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. TABEL UTAMA REKONSILIASI KAS PER POS & TUNGGAKAN SISWA */}
      <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Banknote size={16} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">
                Rekonsiliasi Kas Masuk, Setoran, & Siswa Belum Bayar
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Tarik otomatis data rekap riil 55 siswa untuk semua kategori iuran & tabungan.
              </p>
            </div>
          </div>
        </div>

        {/* MOBILE CARDS VIEW (md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredReconciliations.map((cat) => {
            const isFullDeposited = cat.status === 'sudah_disetor';
            const hasRemaining = cat.remainingCashAtTreasurer > 0;
            const hasUnpaid = cat.totalUnpaidStudentsAmount > 0;

            return (
              <div key={cat.id} className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      {cat.group}
                    </span>
                    <h4 className="font-black text-slate-900 text-sm mt-0.5">{cat.name}</h4>
                  </div>
                  <div>
                    {isFullDeposited ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black">
                        <Check size={11} /> Sudah Disetor
                      </span>
                    ) : hasRemaining ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black">
                        <AlertCircle size={11} /> Belum Disetor
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                        Menunggu Bayar
                      </span>
                    )}
                  </div>
                </div>

                {/* Rincian Metode Diterima */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[11px] font-black">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Total Diterima:</span>
                    <span className="text-slate-900">{formatRupiah(cat.totalPaidAll)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60 text-[10px] font-bold">
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-100">
                      💵 Tunai: {formatRupiah(cat.totalPaidCash)}
                    </span>
                    {cat.totalPaidTransfer > 0 && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded border border-blue-100">
                        🏦 Transfer: {formatRupiah(cat.totalPaidTransfer)}
                      </span>
                    )}
                    {cat.totalPaidTabungan > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-100">
                        💳 Tabungan: {formatRupiah(cat.totalPaidTabungan)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sisa Kas di Bendahara VS Sisa Siswa Belum Bayar */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-3 rounded-xl border ${hasRemaining ? 'bg-amber-50/80 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Sisa Kas Belum Disetor
                    </span>
                    <div className={`text-sm font-black mt-0.5 ${hasRemaining ? 'text-amber-900' : 'text-slate-600'}`}>
                      {formatRupiah(cat.remainingCashAtTreasurer)}
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      Tunai: {formatRupiah(cat.totalPaidCash)} • Disetor: {formatRupiah(cat.totalDepositedDisahkan)}
                    </span>
                  </div>

                  {cat.isTabungan ? (
                    <div className="p-3 rounded-xl border bg-emerald-50/80 border-emerald-200">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                        Status Tabungan
                      </span>
                      <div className="text-sm font-black mt-0.5 text-emerald-800">
                        ✓ Bebas Tunggakan
                      </div>
                      <span className="text-[9px] text-emerald-600 block mt-0.5">
                        {cat.paidStudentsCount} siswa aktif menabung sukarela
                      </span>
                    </div>
                  ) : (
                    <div className={`p-3 rounded-xl border ${hasUnpaid ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                        Siswa Belum Bayar
                      </span>
                      <div className={`text-sm font-black mt-0.5 ${hasUnpaid ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {formatRupiah(cat.totalUnpaidStudentsAmount)}
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        {cat.unpaidStudentsCount} siswa belum lunas (Lunas: {cat.paidStudentsCount})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {hasRemaining && (
                    <button
                      onClick={() => onOpenQuickDeposit({
                        depositType: cat.isTabungan ? 'Tabungan' : (cat.name.toLowerCase().includes('spp') ? 'Iuran Bulanan / SPP' : cat.name),
                        categoryKey: cat.id,
                        amount: cat.remainingCashAtTreasurer,
                        description: `Setoran kas masuk ${cat.name} (Sisa ${formatRupiah(cat.remainingCashAtTreasurer)} belum disetor)`
                      })}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Sparkles size={13} />
                      <span>Setor ({formatRupiah(cat.remainingCashAtTreasurer)})</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenStudentModal(cat)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Users size={13} />
                    <span>Rincian Siswa ({activeStudents.length})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* DESKTOP TABLE VIEW (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Pos Keuangan / Kategori</th>
                <th className="py-3 px-4 text-center">Status Siswa ({activeStudents.length} Siswa)</th>
                <th className="py-3 px-4 text-right">Diterima Siswa (Rincian Metode)</th>
                <th className="py-3 px-4 text-right">Disahkan ke Kas Sekolah</th>
                <th className="py-3 px-4 text-right">Sisa Kas di Bendahara</th>
                <th className="py-3 px-4 text-center">Status Setoran Cash</th>
                <th className="py-3 px-4 text-right">Siswa Belum Bayar</th>
                <th className="py-3 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredReconciliations.map((cat) => {
                const isFullDeposited = cat.status === 'sudah_disetor';
                const hasRemaining = cat.remainingCashAtTreasurer > 0;
                const hasUnpaid = cat.totalUnpaidStudentsAmount > 0;

                return (
                  <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Pos Keuangan */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900">{cat.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold flex items-center gap-2 mt-0.5">
                        <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-semibold">{cat.group}</span>
                        {cat.latestDepositDate ? (
                          <span>Setor terakhir: {cat.latestDepositDate}</span>
                        ) : (
                          <span>Belum pernah disetor</span>
                        )}
                      </div>
                    </td>

                    {/* Status Siswa */}
                    <td className="py-3.5 px-4 text-center">
                      {cat.isTabungan ? (
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[11px] font-black border border-emerald-200">
                            <Users size={12} className="text-emerald-600" />
                            <span>{cat.paidStudentsCount} Siswa Menabung</span>
                          </div>
                          <button
                            onClick={() => handleOpenStudentModal(cat)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold block mx-auto underline cursor-pointer mt-1"
                          >
                            Lihat Buku Tabungan
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold">
                            <span className="text-emerald-700 font-black">{cat.paidStudentsCount} Lunas</span>
                            <span className="text-slate-300">•</span>
                            {cat.partialStudentsCount > 0 && (
                              <>
                                <span className="text-amber-700 font-black">{cat.partialStudentsCount} Sebagian</span>
                                <span className="text-slate-300">•</span>
                              </>
                            )}
                            <span className="text-rose-700 font-black">{cat.unpaidStudentsCount} Belum</span>
                          </div>
                          <button
                            onClick={() => handleOpenStudentModal(cat)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold block mx-auto underline cursor-pointer mt-0.5"
                          >
                            Lihat {activeStudents.length} Siswa
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Diterima Siswa (Rincian Metode: Tunai, Transfer, Tabungan) */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-black text-slate-900">
                        {formatRupiah(cat.totalPaidAll)}
                      </div>
                      <div className="flex flex-col items-end gap-0.5 mt-1 text-[10px] font-bold">
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          💵 Tunai: {formatRupiah(cat.totalPaidCash)}
                        </span>
                        {cat.totalPaidTransfer > 0 && (
                          <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            🏦 Transfer: {formatRupiah(cat.totalPaidTransfer)}
                          </span>
                        )}
                        {cat.totalPaidTabungan > 0 && (
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                            💳 Tabungan: {formatRupiah(cat.totalPaidTabungan)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Sudah Disahkan ke Kas Sekolah */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-teal-800">
                        {formatRupiah(cat.totalDepositedDisahkan)}
                      </span>
                    </td>

                    {/* Sisa Kas di Bendahara */}
                    <td className="py-3.5 px-4 text-right">
                      <div className={`inline-block px-2.5 py-1 rounded-xl font-black ${
                        hasRemaining 
                          ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {formatRupiah(cat.remainingCashAtTreasurer)}
                      </div>
                    </td>

                    {/* Status Setoran Cash */}
                    <td className="py-3.5 px-4 text-center">
                      {isFullDeposited ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black text-[10px] rounded-full uppercase tracking-wider">
                          <Check size={11} /> Sudah Disetor
                        </span>
                      ) : hasRemaining ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 font-black text-[10px] rounded-full uppercase tracking-wider">
                          <AlertCircle size={11} /> Belum Disetor
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 font-bold text-[10px] rounded-full">
                          Menunggu Bayar
                        </span>
                      )}
                    </td>

                    {/* Siswa Belum Bayar */}
                    <td className="py-3.5 px-4 text-right">
                      {cat.isTabungan ? (
                        <div>
                          <span className="text-[11px] font-black text-emerald-700 block">
                            ✓ Bebas Tunggakan
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Tabungan Sukarela Siswa
                          </span>
                        </div>
                      ) : hasUnpaid ? (
                        <div>
                          <div className="font-black text-rose-700">
                            {formatRupiah(cat.totalUnpaidStudentsAmount)}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {cat.unpaidStudentsCount} siswa belum lunas
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600">
                          ✓ Lunas Semua
                        </span>
                      )}
                    </td>

                    {/* Aksi Cepat */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {hasRemaining ? (
                          <button
                            onClick={() => onOpenQuickDeposit({
                              depositType: cat.isTabungan ? 'Tabungan' : (cat.name.toLowerCase().includes('spp') ? 'Iuran Bulanan / SPP' : cat.name),
                              categoryKey: cat.id,
                              amount: cat.remainingCashAtTreasurer,
                              description: `Setoran kas masuk ${cat.name} (Sisa ${formatRupiah(cat.remainingCashAtTreasurer)} belum disetor)`
                            })}
                            title="Setorkan Sisa Kas Fisik Ini Sekarang"
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                          >
                            <Sparkles size={13} />
                            <span>Setor Sisa Kas</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold italic">
                            Kas Bersih
                          </span>
                        )}
                        <button
                          onClick={() => handleOpenStudentModal(cat)}
                          title={`Lihat Rincian Status ${activeStudents.length} Siswa`}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Users size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. MODAL RINCIAN STATUS PEMBAYARAN 55 SISWA */}
      {showStudentModal && selectedCategoryForModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col h-[90dvh] sm:h-auto max-h-[90dvh] sm:max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm z-20">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
                  Data Valid Seluruh Siswa ({selectedCategoryForModal.allStudentsCount} Siswa)
                </span>
                <h3 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                  Rincian Pembayaran: {selectedCategoryForModal.name}
                </h3>
                <div className="text-xs text-slate-300 font-medium mt-0.5 flex items-center gap-3 flex-wrap">
                  {selectedCategoryForModal.isTabungan ? (
                    <>
                      <span>Total Siswa: <strong className="text-emerald-300">{selectedCategoryForModal.allStudentsCount} Siswa</strong></span>
                      <span>Aktif Menabung: <strong className="text-emerald-300">{selectedCategoryForModal.paidStudentsCount} Siswa</strong></span>
                      <span>Total Saldo Tabungan: <strong className="text-emerald-300">{formatRupiah(selectedCategoryForModal.totalPaidCash)}</strong></span>
                    </>
                  ) : (
                    <>
                      <span>Lunas: <strong className="text-emerald-300">{selectedCategoryForModal.paidStudentsCount} Siswa</strong></span>
                      <span>Belum Lunas: <strong className="text-rose-300">{selectedCategoryForModal.unpaidStudentsCount} Siswa</strong></span>
                      <span>Total Tunggakan: <strong className="text-rose-400">{formatRupiah(selectedCategoryForModal.totalUnpaidStudentsAmount)}</strong></span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStudentModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Filter Toolbar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
              {/* Status Tab Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl overflow-x-auto w-full sm:w-auto">
                {(selectedCategoryForModal.isTabungan ? [
                  { id: 'all', label: `Semua (${selectedCategoryForModal.studentsList.length})` },
                  { id: 'lunas', label: `Ada Saldo (${selectedCategoryForModal.paidStudentsCount})` },
                  { id: 'belum_lunas', label: `Saldo Rp 0 (${selectedCategoryForModal.unpaidStudentsCount})` },
                ] : [
                  { id: 'all', label: `Semua (${selectedCategoryForModal.studentsList.length})` },
                  { id: 'belum_lunas', label: `Belum Lunas (${selectedCategoryForModal.unpaidStudentsCount})` },
                  { id: 'sebagian', label: `Bayar Sebagian (${selectedCategoryForModal.partialStudentsCount})` },
                  { id: 'lunas', label: `Lunas (${selectedCategoryForModal.paidStudentsCount})` },
                ]).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setModalStatusTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      modalStatusTab === t.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Class & Search Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={modalClassFilter}
                  onChange={(e) => setModalClassFilter(e.target.value)}
                  className="bg-white text-xs font-bold text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 outline-none cursor-pointer"
                >
                  <option value="all">Semua Kelas</option>
                  {Array.from(new Set(selectedCategoryForModal.studentsList.map(s => s.kelas))).map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>

                <div className="relative flex-1 sm:w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari siswa..."
                    value={modalStudentSearch}
                    onChange={(e) => setModalStudentSearch(e.target.value)}
                    className="w-full bg-white text-xs font-bold text-slate-800 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Table Body */}
            <div className="overflow-y-auto flex-1 min-h-0">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                  {selectedCategoryForModal.isTabungan ? (
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Nama Siswa</th>
                      <th className="py-2.5 px-3">Kelas</th>
                      <th className="py-2.5 px-3 text-right">Saldo Tabungan Riil</th>
                      <th className="py-2.5 px-3 text-center">Status Tabungan</th>
                      <th className="py-2.5 px-3 text-center">Keterangan</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Nama Siswa</th>
                      <th className="py-2.5 px-3">Kelas</th>
                      <th className="py-2.5 px-3 text-right">Tagihan</th>
                      <th className="py-2.5 px-3 text-right">💵 Tunai</th>
                      <th className="py-2.5 px-3 text-right">🏦 Transfer</th>
                      <th className="py-2.5 px-3 text-right">💳 Tabungan</th>
                      <th className="py-2.5 px-3 text-right">Total Bayar</th>
                      <th className="py-2.5 px-3 text-right">Sisa Tunggakan</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Aksi / WA</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {modalFilteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={selectedCategoryForModal.isTabungan ? 6 : 11} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada siswa yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    modalFilteredStudents.map((st, idx) => {
                      if (selectedCategoryForModal.isTabungan) {
                        return (
                          <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 text-slate-400 font-bold">{idx + 1}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{st.name}</div>
                              {st.nisn && <div className="text-[10px] text-slate-400">NISN: {st.nisn}</div>}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-600">{st.kelas}</td>
                            <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                              {formatRupiah(st.paidAmount)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {st.paidAmount > 0 ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                  Aktif Menabung
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                  Saldo Rp 0
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center text-emerald-700 font-semibold text-[11px]">
                              ✓ Bebas Tunggakan
                            </td>
                          </tr>
                        );
                      }

                      const waLink = generateWhatsAppLink(st, selectedCategoryForModal.name);

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{st.name}</div>
                            {st.nisn && <div className="text-[10px] text-slate-400">NISN: {st.nisn}</div>}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-600">{st.kelas}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                            {formatRupiah(st.targetAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                            {st.paidCash > 0 ? formatRupiah(st.paidCash) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                            {st.paidTransfer > 0 ? formatRupiah(st.paidTransfer) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-amber-700">
                            {st.paidTabungan > 0 ? formatRupiah(st.paidTabungan) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900">
                            {formatRupiah(st.paidAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-rose-700">
                            {formatRupiah(st.unpaidAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {st.status === 'lunas' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                Lunas
                              </span>
                            ) : st.status === 'sebagian' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                                Sebagian
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                                Belum Bayar
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {st.unpaidAmount > 0 && waLink ? (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs"
                                title="Kirim WA Pengingat"
                              >
                                <MessageCircle size={12} />
                                <span>Ingatkan WA</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-bold">✓ Bersih</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Menampilkan <strong className="text-slate-900">{modalFilteredStudents.length}</strong> dari {selectedCategoryForModal.studentsList.length} siswa
              </span>
              <button
                type="button"
                onClick={() => setShowStudentModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-black"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
