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

  // Helper cek pembayaran tunai
  const isPaymentCash = (p: any) => {
    if (p.status === 'ditolak' || p.status === 'rejected') return false;
    const method = (p.paymentMethod || p.method || '').toLowerCase();
    if (!method) return true;
    return method === 'tunai' || method === 'cash';
  };

  // Helper cek pembayaran transfer
  const isPaymentTransfer = (p: any) => {
    if (p.status === 'ditolak' || p.status === 'rejected') return false;
    const method = (p.paymentMethod || p.method || '').toLowerCase();
    return method.includes('transfer') || method.includes('bank') || method.includes('qris') || method.includes('online');
  };

  // REKONSILIASI LENGKAP SEMUA KATEGORI & TABUNGAN
  const reconciliations = useMemo<CategoryReconciliation[]>(() => {
    const list: CategoryReconciliation[] = [];

    // 1. REKONSILIASI KHUSUS: TABUNGAN SISWA
    // Hitung seluruh tabungan yang masuk ke sekolah (total saldo tabungan riil 55 siswa)
    const totalSavingsBalanceAllStudents = activeStudents.reduce((sum, u) => sum + (Number(u.savings) || 0), 0);

    const tabunganPayments = payments.filter(p => {
      if (p.status === 'ditolak' || p.status === 'rejected') return false;
      const pType = (p.type || '').toLowerCase();
      const pCat = (p.category || p.iuranName || '').toLowerCase();
      return pType === 'tabungan' || pType === 'tabungan_masuk' || pCat.includes('tabung');
    });

    const tabunganCashPayments = tabunganPayments.filter(p => isPaymentCash(p));
    const totalTabunganCashIn = tabunganCashPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

    // Penarikan tabungan tunai
    const tabunganCashOut = payments
      .filter(p => p.status !== 'ditolak' && (p.type || '').toLowerCase() === 'tabungan_keluar' && isPaymentCash(p))
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const netTabunganCashIn = Math.max(0, totalTabunganCashIn - tabunganCashOut);

    // Total tabungan masuk yang dihimpun (gunakan yang lebih besar antara saldo buku tabungan vs mutasi)
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

    // Bangun daftar siswa untuk modal tabungan
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

    // 2. REKONSILIASI KATEGORI IURAN (SPP & NON-SPP)
    const standardSPPMonths = [
      { id: 'spp_juli_2026', name: 'SPP Juli 2026', monthKeyword: 'juli' },
      { id: 'spp_agustus_2026', name: 'SPP Agustus 2026', monthKeyword: 'agustus' },
      { id: 'spp_september_2026', name: 'SPP September 2026', monthKeyword: 'september' },
      { id: 'spp_oktober_2026', name: 'SPP Oktober 2026', monthKeyword: 'oktober' },
      { id: 'spp_november_2026', name: 'SPP November 2026', monthKeyword: 'november' },
      { id: 'spp_desember_2026', name: 'SPP Desember 2026', monthKeyword: 'desember' },
      { id: 'spp_januari_2027', name: 'SPP Januari 2027', monthKeyword: 'januari' },
      { id: 'spp_februari_2027', name: 'SPP Februari 2027', monthKeyword: 'februari' },
      { id: 'spp_maret_2027', name: 'SPP Maret 2027', monthKeyword: 'maret' },
      { id: 'spp_april_2027', name: 'SPP April 2027', monthKeyword: 'april' },
      { id: 'spp_mei_2027', name: 'SPP Mei 2027', monthKeyword: 'mei' },
      { id: 'spp_juni_2027', name: 'SPP Juni 2027', monthKeyword: 'juni' }
    ];

    const nonSPPCategories: { id: string; name: string }[] = [
      { id: 'dsp_uang_gedung', name: 'DSP / Uang Gedung / Sarana' },
      { id: 'uang_kegiatan', name: 'Uang Kegiatan & Outbound' },
      { id: 'buku_seragam', name: 'Penjualan Buku & Seragam' },
      { id: 'ppdb_pendaftaran', name: 'PPDB & Formulir Pendaftaran' },
      { id: 'infaq_shodaqoh', name: 'Infaq Jumat & Shodaqoh' }
    ];

    if (iuranCategories && Array.isArray(iuranCategories)) {
      iuranCategories.forEach((cat: any) => {
        const catName = (typeof cat === 'string' ? cat : cat.name || '').trim();
        if (catName && !catName.toLowerCase().includes('tabung')) {
          const isMonthSPP = standardSPPMonths.some(m => catName.toLowerCase().includes(m.monthKeyword));
          if (!isMonthSPP) {
            const cleanId = catName.toLowerCase().replace(/[^a-z0-9]/g, '_');
            if (!nonSPPCategories.some(n => n.id === cleanId || n.name.toLowerCase() === catName.toLowerCase())) {
              nonSPPCategories.push({ id: cleanId, name: catName });
            }
          }
        }
      });
    }

    // Gabungkan list pos yang akan dianalisis
    const categoriesToProcess: { id: string; name: string; group: 'SPP Bulanan' | 'Non-SPP / Kegiatan'; monthKeyword?: string }[] = [
      ...standardSPPMonths.map(m => ({ ...m, group: 'SPP Bulanan' as const })),
      ...nonSPPCategories.map(n => ({ ...n, group: 'Non-SPP / Kegiatan' as const }))
    ];

    // Helper nominal default SPP
    const sppCat = iuranCategories?.find((c: any) => (c.name || '').toLowerCase().includes('spp'));
    const defaultSPPAmount = Number(sppCat?.amount || sppCat?.nominal) || 250000;

    categoriesToProcess.forEach(cat => {
      const catKeywords = cat.monthKeyword 
        ? [cat.monthKeyword] 
        : cat.name.toLowerCase().split(/[\s/&]+/).filter(w => w.length > 2);

      // 1. Identifikasi status SETIAP siswa dari seluruh 55 siswa aktif
      const studentsList: StudentBillingStatus[] = [];
      let totalPaidCashForCat = 0;
      let totalPaidTransferForCat = 0;
      let totalUnpaidForCat = 0;
      let paidCount = 0;
      let partialCount = 0;
      let unpaidCount = 0;

      activeStudents.forEach(st => {
        // Cek pembayaran siswa di koleksi payments
        const studentPayments = payments.filter(p => {
          if (p.studentId !== st.id) return false;
          if (p.status === 'ditolak' || p.status === 'rejected') return false;
          const pType = (p.type || '').toLowerCase();
          if (pType === 'tabungan' || pType === 'tabungan_masuk' || pType === 'tabungan_keluar') return false;
          const combined = `${p.category || ''} ${p.iuranName || ''} ${p.description || ''}`.toLowerCase();
          return catKeywords.some(kw => combined.includes(kw));
        });

        let stPaidCash = 0;
        let stPaidTransfer = 0;
        let lastPayDate = '';
        let lastMethod = 'Tunai';

        studentPayments.forEach(p => {
          const amt = Number(p.amount) || 0;
          if (isPaymentCash(p)) {
            stPaidCash += amt;
            lastMethod = 'Tunai';
          } else {
            stPaidTransfer += amt;
            lastMethod = p.method || 'Transfer';
          }
          if (p.date) lastPayDate = p.date;
        });

        const stPaidTotal = stPaidCash + stPaidTransfer;

        // Cek tunggakan siswa di arrears_details
        const arrDetail = (st.arrears_details || []).find((a: any) => {
          const aName = (a.name || '').toLowerCase();
          return catKeywords.some(kw => aName.includes(kw));
        });

        let stUnpaidAmount = 0;
        let stTargetAmount = 0;

        if (arrDetail) {
          stUnpaidAmount = Number(arrDetail.amount) || 0;
          stTargetAmount = stPaidTotal + stUnpaidAmount;
        } else if (stPaidTotal > 0) {
          stUnpaidAmount = 0;
          stTargetAmount = stPaidTotal;
        } else {
          // Belum bayar dan tidak ada detail khusus, gunakan estimasi nominal kategori
          const estimatedNominal = cat.group === 'SPP Bulanan' ? defaultSPPAmount : 0;
          stUnpaidAmount = estimatedNominal;
          stTargetAmount = estimatedNominal;
        }

        // Tentukan status siswa
        let stStatus: StudentBillingStatus['status'] = 'belum_bayar';
        if (stTargetAmount > 0 && stUnpaidAmount === 0 && stPaidTotal >= stTargetAmount) {
          stStatus = 'lunas';
          paidCount++;
        } else if (stPaidTotal > 0 && stUnpaidAmount > 0) {
          stStatus = 'sebagian';
          partialCount++;
        } else {
          stStatus = 'belum_bayar';
          unpaidCount++;
        }

        totalPaidCashForCat += stPaidCash;
        totalPaidTransferForCat += stPaidTransfer;
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
          unpaidAmount: stUnpaidAmount,
          status: stStatus,
          paymentMethod: stPaidTotal > 0 ? lastMethod : '-',
          lastPaymentDate: lastPayDate || '-'
        });
      });

      // 2. Cek setoran cash bendahara yang sudah diserahkan ke Kepala Sekolah / Yayasan
      const matchingDeposits = deposits.filter(d => {
        if (d.categoryKey && d.categoryKey === cat.id) return true;
        const dType = (d.depositType || '').toLowerCase();
        const dDesc = (d.description || '').toLowerCase();
        return catKeywords.some(kw => dDesc.includes(kw) || dType.includes(kw));
      }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      const totalDepositedDisahkan = matchingDeposits
        .filter(d => d.status === 'disahkan')
        .reduce((s, d) => s + (Number(d.amount) || 0), 0);

      const totalDepositedPending = matchingDeposits
        .filter(d => d.status !== 'disahkan' && d.status !== 'ditolak')
        .reduce((s, d) => s + (Number(d.amount) || 0), 0);

      const remainingCashAtTreasurer = Math.max(0, totalPaidCashForCat - totalDepositedDisahkan);

      const latestDeposit = matchingDeposits[0];
      const latestDepositDate = latestDeposit ? latestDeposit.date : null;
      const latestDepositAmount = latestDeposit ? (Number(latestDeposit.amount) || 0) : 0;

      let status: CategoryReconciliation['status'] = 'belum_ada_pembayaran';
      let statusLabel = 'Belum Ada Pembayaran Tunai Siswa';
      if (totalPaidCashForCat > 0) {
        if (remainingCashAtTreasurer === 0) {
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

      const totalTargetAll = totalPaidCashForCat + totalPaidTransferForCat + totalUnpaidForCat;

      // Filter: sertakan jika ada tagihan, pembayaran, setoran, atau bulan Agustus / Juli / September
      const isRelevant = totalTargetAll > 0 || totalPaidCashForCat > 0 || totalDepositedDisahkan > 0 || 
                         (cat.monthKeyword && ['agustus', 'juli', 'september', 'oktober'].includes(cat.monthKeyword));

      if (isRelevant) {
        list.push({
          id: cat.id,
          name: cat.name,
          group: cat.group,
          totalTarget: totalTargetAll,
          totalPaidCash: totalPaidCashForCat,
          totalPaidTransfer: totalPaidTransferForCat,
          totalPaidAll: totalPaidCashForCat + totalPaidTransferForCat,
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
      }
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
        'Sudah Dibayar (Rp)': st.paidAmount,
        'Sisa Tunggakan (Rp)': st.unpaidAmount,
        'Status': st.status === 'lunas' ? 'Lunas' : st.status === 'sebagian' ? 'Bayar Sebagian' : 'Belum Bayar',
        'Metode Bayar': st.paymentMethod || '-',
        'No WhatsApp': st.whatsapp || '-'
      }));
      const wsStudents = XLSX.utils.json_to_sheet(studentRows);
      XLSX.utils.book_append_sheet(wb, wsStudents, 'Status 55 Siswa');
    }

    XLSX.writeFile(wb, `Rekonsiliasi_Setoran_Cash_55_Siswa_RA_Darusyifa_${new Date().toISOString().split('T')[0]}.xlsx`);
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
                  Total Semua Tabungan Masuk (55 Siswa)
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
                      Masuk: {formatRupiah(cat.totalPaidCash)} • Disetor: {formatRupiah(cat.totalDepositedDisahkan)}
                    </span>
                  </div>

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
                    <span>Rincian 55 Siswa</span>
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
                <th className="py-3 px-4 text-center">Status Siswa (Total 55)</th>
                <th className="py-3 px-4 text-right">Diterima Tunai Siswa</th>
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

                    {/* Status Siswa (55 Siswa) */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 text-[11px] font-bold">
                        <span className="text-emerald-700 font-black">{cat.paidStudentsCount} Lunas</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-rose-700 font-black">{cat.unpaidStudentsCount} Belum</span>
                      </div>
                      <button
                        onClick={() => handleOpenStudentModal(cat)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold block mx-auto underline cursor-pointer mt-0.5"
                      >
                        Lihat 55 Siswa
                      </button>
                    </td>

                    {/* Diterima Tunai */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-black text-slate-900">
                        {formatRupiah(cat.totalPaidCash)}
                      </span>
                      {cat.totalPaidTransfer > 0 && (
                        <div className="text-[10px] text-blue-600 font-bold">
                          +{formatRupiah(cat.totalPaidTransfer)} online
                        </div>
                      )}
                    </td>

                    {/* Sudah Disahkan */}
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
                      {hasUnpaid ? (
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
                          title="Lihat Rincian Status 55 Siswa"
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
                  <span>Lunas: <strong className="text-emerald-300">{selectedCategoryForModal.paidStudentsCount} Siswa</strong></span>
                  <span>Belum Lunas: <strong className="text-rose-300">{selectedCategoryForModal.unpaidStudentsCount} Siswa</strong></span>
                  <span>Total Tunggakan: <strong className="text-rose-400">{formatRupiah(selectedCategoryForModal.totalUnpaidStudentsAmount)}</strong></span>
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
                {[
                  { id: 'all', label: `Semua (${selectedCategoryForModal.studentsList.length})` },
                  { id: 'belum_lunas', label: `Belum Lunas (${selectedCategoryForModal.unpaidStudentsCount})` },
                  { id: 'sebagian', label: `Bayar Sebagian (${selectedCategoryForModal.partialStudentsCount})` },
                  { id: 'lunas', label: `Lunas (${selectedCategoryForModal.paidStudentsCount})` },
                ].map(t => (
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
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3 text-right">Tagihan</th>
                    <th className="py-2.5 px-3 text-right">Sudah Dibayar</th>
                    <th className="py-2.5 px-3 text-right">Sisa Tunggakan</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Aksi / WA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {modalFilteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada siswa yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    modalFilteredStudents.map((st, idx) => {
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
                                Bayar Sebagian
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
