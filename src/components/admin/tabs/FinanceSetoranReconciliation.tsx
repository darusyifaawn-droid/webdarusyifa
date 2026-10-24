import React, { useState, useMemo } from 'react';
import { 
  Banknote, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Search, 
  Download, 
  ArrowRight, 
  Coins, 
  X, 
  AlertCircle, 
  Eye, 
  TrendingUp, 
  Sparkles,
  Users,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  AlertTriangle,
  ArrowUpRight,
  Wallet
} from 'lucide-react';
import { formatRupiah, terbilang } from '../../../lib/salaryUtils';
import { CashDeposit } from '../../../lib/cashDepositUtils';
import * as XLSX from 'xlsx';

export interface UnpaidStudentInfo {
  id: string;
  name: string;
  kelas: string;
  amount: number;
  whatsapp?: string;
  nisn?: string;
  parentName?: string;
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
  unpaidStudents: UnpaidStudentInfo[];
  paidStudentsCount: number;
  unpaidStudentsCount: number;
  totalDepositedDisahkan: number;
  totalDepositedPending: number;
  remainingCashAtTreasurer: number; // Sisa uang tunai yang sudah masuk tapi belum disetor ke kepsek/yayasan
  latestDepositDate: string | null;
  latestDepositAmount: number;
  tabunganInflowAfterLatestDeposit?: number; // Khusus tabungan: uang masuk dari tanggal selanjutnya
  tabunganTransactionsAfterLatestCount?: number;
  status: 'sudah_disetor' | 'sebagian_disetor' | 'belum_disetor' | 'belum_ada_pembayaran';
  statusLabel: string;
}

interface FinanceSetoranReconciliationProps {
  payments: any[];
  allUsers: any[];
  deposits: CashDeposit[];
  iuranCategories?: any[];
  schoolClasses?: any[];
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
  onOpenQuickDeposit,
  onViewHistoryCategory
}: FinanceSetoranReconciliationProps) {
  // State Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<'all' | 'spp' | 'tabungan' | 'non_spp'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'belum_disetor' | 'sudah_disetor' | 'ada_tunggakan'>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  // Modal Siswa Belum Bayar
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<CategoryReconciliation | null>(null);
  const [modalStudentSearch, setModalStudentSearch] = useState('');
  const [modalClassFilter, setModalClassFilter] = useState('all');

  // Filter Active Students
  const activeStudents = useMemo(() => {
    return allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif');
  }, [allUsers]);

  // Compute Reconciliations for ALL Categories
  const reconciliations = useMemo<CategoryReconciliation[]>(() => {
    const list: CategoryReconciliation[] = [];

    // Helper: is cash payment
    const isPaymentCash = (p: any) => {
      if (p.status === 'ditolak') return false;
      const method = (p.paymentMethod || p.method || '').toLowerCase();
      if (!method) return true;
      return method === 'tunai' || method === 'cash';
    };

    // Helper: is transfer payment
    const isPaymentTransfer = (p: any) => {
      if (p.status === 'ditolak') return false;
      const method = (p.paymentMethod || p.method || '').toLowerCase();
      return method.includes('transfer') || method.includes('bank') || method.includes('qris') || method.includes('online');
    };

    // 1. REKONSILIASI KHUSUS: TABUNGAN SISWA
    const tabunganPayments = payments.filter(p => {
      if (p.status === 'ditolak') return false;
      const pType = (p.type || '').toLowerCase();
      const pCat = (p.category || p.iuranName || '').toLowerCase();
      return pType === 'tabungan' || pType === 'tabungan_masuk' || pCat.includes('tabung');
    });

    const tabunganCashPayments = tabunganPayments.filter(p => isPaymentCash(p));
    const tabunganTransferPayments = tabunganPayments.filter(p => isPaymentTransfer(p));

    const totalTabunganCashIn = tabunganCashPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const totalTabunganTransferIn = tabunganTransferPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

    // Penarikan tabungan tunai
    const tabunganCashOut = payments
      .filter(p => p.status !== 'ditolak' && (p.type || '').toLowerCase() === 'tabungan_keluar' && isPaymentCash(p))
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const netTabunganCashIn = Math.max(0, totalTabunganCashIn - tabunganCashOut);

    // Setoran cash Tabungan ke Kepsek/Yayasan
    const tabunganDeposits = deposits.filter(d => {
      const typeLower = (d.depositType || '').toLowerCase();
      const descLower = (d.description || '').toLowerCase();
      return typeLower === 'tabungan' || descLower.includes('tabung');
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    const latestTabunganDeposit = tabunganDeposits[0];
    const latestTabunganDepositDate = latestTabunganDeposit ? latestTabunganDeposit.date : null;
    const latestTabunganDepositAmount = latestTabunganDeposit ? (Number(latestTabunganDeposit.amount) || 0) : 0;

    const totalTabunganDepositedDisahkan = tabunganDeposits
      .filter(d => d.status === 'disahkan')
      .reduce((s, d) => s + (Number(d.amount) || 0), 0);

    const totalTabunganDepositedPending = tabunganDeposits
      .filter(d => d.status !== 'disahkan' && d.status !== 'ditolak')
      .reduce((s, d) => s + (Number(d.amount) || 0), 0);

    const remainingTabunganCash = Math.max(0, netTabunganCashIn - totalTabunganDepositedDisahkan);

    // Tabungan masuk setelah tanggal setoran terakhir
    let tabunganInflowAfterDate = 0;
    let tabunganCountAfterDate = 0;
    if (latestTabunganDepositDate) {
      tabunganCashPayments.forEach(p => {
        if (p.date && p.date > latestTabunganDepositDate) {
          tabunganInflowAfterDate += Number(p.amount) || 0;
          tabunganCountAfterDate++;
        }
      });
    } else {
      tabunganInflowAfterDate = netTabunganCashIn;
      tabunganCountAfterDate = tabunganCashPayments.length;
    }

    let tabunganStatus: CategoryReconciliation['status'] = 'belum_ada_pembayaran';
    let tabunganStatusLabel = 'Belum Ada Setoran Tabungan Siswa';
    if (netTabunganCashIn > 0) {
      if (remainingTabunganCash === 0) {
        tabunganStatus = 'sudah_disetor';
        tabunganStatusLabel = 'Sudah Disetor Penuh ke Kas Sekolah';
      } else if (totalTabunganDepositedDisahkan > 0) {
        tabunganStatus = 'sebagian_disetor';
        tabunganStatusLabel = `Disetor Sebagian (Sisa ${formatRupiah(remainingTabunganCash)})`;
      } else {
        tabunganStatus = 'belum_disetor';
        tabunganStatusLabel = `Belum Disetor (${formatRupiah(remainingTabunganCash)} di Bendahara)`;
      }
    }

    const totalSavingsRecorded = activeStudents.reduce((s, u) => s + (Number(u.savings) || 0), 0);

    list.push({
      id: 'tabungan_siswa',
      name: 'Tabungan Siswa (Kas Masuk Harian)',
      group: 'Tabungan Siswa',
      isTabungan: true,
      totalTarget: totalSavingsRecorded || netTabunganCashIn,
      totalPaidCash: netTabunganCashIn,
      totalPaidTransfer: totalTabunganTransferIn,
      totalPaidAll: netTabunganCashIn + totalTabunganTransferIn,
      totalUnpaidStudentsAmount: 0,
      unpaidStudents: [],
      paidStudentsCount: tabunganPayments.length,
      unpaidStudentsCount: 0,
      totalDepositedDisahkan: totalTabunganDepositedDisahkan,
      totalDepositedPending: totalTabunganDepositedPending,
      remainingCashAtTreasurer: remainingTabunganCash,
      latestDepositDate: latestTabunganDepositDate,
      latestDepositAmount: latestTabunganDepositAmount,
      tabunganInflowAfterLatestDeposit: tabunganInflowAfterDate,
      tabunganTransactionsAfterLatestCount: tabunganCountAfterDate,
      status: tabunganStatus,
      statusLabel: tabunganStatusLabel
    });

    // 2. REKONSILIASI KATEGORI SPP BULANAN & POS IURAN
    // Kumpulkan seluruh nama kategori / bulan dari berbagai sumber
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

    // Temukan kategori non-SPP dari iuranCategories
    const nonSPPCategories: { id: string; name: string; desc?: string; defaultAmount?: number }[] = [
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
              nonSPPCategories.push({
                id: cleanId,
                name: catName,
                desc: cat.description,
                defaultAmount: Number(cat.amount || cat.nominal) || undefined
              });
            }
          }
        }
      });
    }

    // Ambil juga dari arrears_details siswa jika ada item khusus yang belum tercatat
    activeStudents.forEach(st => {
      (st.arrears_details || []).forEach((arr: any) => {
        const arrName = (arr.name || '').trim();
        if (arrName && !arrName.toLowerCase().includes('tabung')) {
          const isMonthSPP = standardSPPMonths.some(m => arrName.toLowerCase().includes(m.monthKeyword));
          if (!isMonthSPP) {
            const cleanId = arrName.toLowerCase().replace(/[^a-z0-9]/g, '_');
            if (!nonSPPCategories.some(n => n.id === cleanId || n.name.toLowerCase() === arrName.toLowerCase())) {
              nonSPPCategories.push({
                id: cleanId,
                name: arrName
              });
            }
          }
        }
      });
    });

    // PROSES SEMUA BULAN SPP
    standardSPPMonths.forEach(m => {
      // 1. Pembayaran siswa untuk bulan ini
      const matchingPayments = payments.filter(p => {
        if (p.status === 'ditolak') return false;
        const pType = (p.type || '').toLowerCase();
        if (pType === 'tabungan' || pType === 'tabungan_masuk' || pType === 'tabungan_keluar') return false;
        const combined = `${p.category || ''} ${p.iuranName || ''} ${p.description || ''}`.toLowerCase();
        return combined.includes(m.monthKeyword) && (combined.includes('spp') || combined.includes('iuran') || combined.includes('bulanan') || !combined.includes('kegiatan'));
      });

      const cashPayments = matchingPayments.filter(p => isPaymentCash(p));
      const transferPayments = matchingPayments.filter(p => isPaymentTransfer(p));

      const totalPaidCash = cashPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const totalPaidTransfer = transferPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const totalPaidAll = totalPaidCash + totalPaidTransfer;

      // 2. Siswa belum bayar (tunggakan siswa)
      const unpaidStudents: UnpaidStudentInfo[] = [];
      let totalUnpaidAmount = 0;

      activeStudents.forEach(st => {
        // Cek apakah siswa punya rincian tunggakan untuk bulan ini
        const arrDetail = (st.arrears_details || []).find((a: any) => {
          const aName = (a.name || '').toLowerCase();
          return aName.includes(m.monthKeyword) && (aName.includes('spp') || aName.includes('iuran') || aName.includes('bulanan'));
        });

        if (arrDetail) {
          const amt = Number(arrDetail.amount) || 0;
          if (amt > 0) {
            totalUnpaidAmount += amt;
            unpaidStudents.push({
              id: st.id,
              name: st.name || 'Siswa',
              kelas: st.kelas || '-',
              amount: amt,
              whatsapp: st.whatsapp || st.phone || '',
              nisn: st.nisn || '',
              parentName: st.parentName || st.namaWali || ''
            });
          }
        } else {
          // Jika tidak ada di arrears_details tapi siswa ini belum bayar di payments untuk bulan ini
          const hasPaid = matchingPayments.some(p => p.studentId === st.id);
          if (!hasPaid) {
            // Cek apakah ada default SPP nominal
            const sppCat = iuranCategories?.find((c: any) => (c.name || '').toLowerCase().includes('spp'));
            const defaultNominal = Number(sppCat?.amount || sppCat?.nominal) || 250000;
            // Jika siswa punya arrears umum > 0, catat sebagai penunggak SPP
            if ((Number(st.arrears) || 0) > 0) {
              const estimatedAmount = Math.min(Number(st.arrears) || defaultNominal, defaultNominal);
              totalUnpaidAmount += estimatedAmount;
              unpaidStudents.push({
                id: st.id,
                name: st.name || 'Siswa',
                kelas: st.kelas || '-',
                amount: estimatedAmount,
                whatsapp: st.whatsapp || st.phone || '',
                nisn: st.nisn || '',
                parentName: st.parentName || st.namaWali || ''
              });
            }
          }
        }
      });

      // 3. Setoran cash bendahara ke Kepala Sekolah / Yayasan untuk pos ini
      const matchingDeposits = deposits.filter(d => {
        if (d.categoryKey && d.categoryKey === m.id) return true;
        const dType = (d.depositType || '').toLowerCase();
        const dDesc = (d.description || '').toLowerCase();
        if (dDesc.includes(m.monthKeyword)) return true;
        if (dType.includes(m.monthKeyword)) return true;
        return false;
      }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      const latestDeposit = matchingDeposits[0];
      const latestDepositDate = latestDeposit ? latestDeposit.date : null;
      const latestDepositAmount = latestDeposit ? (Number(latestDeposit.amount) || 0) : 0;

      const totalDepositedDisahkan = matchingDeposits
        .filter(d => d.status === 'disahkan')
        .reduce((s, d) => s + (Number(d.amount) || 0), 0);

      const totalDepositedPending = matchingDeposits
        .filter(d => d.status !== 'disahkan' && d.status !== 'ditolak')
        .reduce((s, d) => s + (Number(d.amount) || 0), 0);

      // Sisa kas masuk yang BELUM disetorkan ke kas sekolah
      const remainingCashAtTreasurer = Math.max(0, totalPaidCash - totalDepositedDisahkan);

      // Status
      let status: CategoryReconciliation['status'] = 'belum_ada_pembayaran';
      let statusLabel = 'Belum Ada Pembayaran Siswa';
      if (totalPaidCash > 0) {
        if (remainingCashAtTreasurer === 0) {
          status = 'sudah_disetor';
          statusLabel = 'Sudah Disetor Penuh ke Kas Sekolah';
        } else if (totalDepositedDisahkan > 0) {
          status = 'sebagian_disetor';
          statusLabel = `Disetor Sebagian (Sisa ${formatRupiah(remainingCashAtTreasurer)})`;
        } else {
          status = 'belum_disetor';
          statusLabel = `Belum Disetor (${formatRupiah(remainingCashAtTreasurer)} di Bendahara)`;
        }
      }

      const totalTarget = totalPaidAll + totalUnpaidAmount;

      // Hanya tampilkan bulan jika ada tagihan/pembayaran/setoran ATAU bulan Agustus / Juli / September
      const isImportantMonth = m.monthKeyword === 'agustus' || m.monthKeyword === 'juli' || m.monthKeyword === 'september' || totalPaidAll > 0 || totalUnpaidAmount > 0 || totalDepositedDisahkan > 0;

      if (isImportantMonth) {
        list.push({
          id: m.id,
          name: m.name,
          group: 'SPP Bulanan',
          totalTarget,
          totalPaidCash,
          totalPaidTransfer,
          totalPaidAll,
          totalUnpaidStudentsAmount: totalUnpaidAmount,
          unpaidStudents,
          paidStudentsCount: matchingPayments.length,
          unpaidStudentsCount: unpaidStudents.length,
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

    // PROSES KATEGORI NON-SPP
    nonSPPCategories.forEach(cat => {
      const catKeywords = cat.name.toLowerCase().split(/[\s/&]+/).filter(w => w.length > 2);

      const matchingPayments = payments.filter(p => {
        if (p.status === 'ditolak') return false;
        const pType = (p.type || '').toLowerCase();
        if (pType === 'tabungan' || pType === 'tabungan_masuk' || pType === 'tabungan_keluar') return false;
        const combined = `${p.category || ''} ${p.iuranName || ''} ${p.description || ''}`.toLowerCase();
        return catKeywords.some(kw => combined.includes(kw));
      });

      const cashPayments = matchingPayments.filter(p => isPaymentCash(p));
      const transferPayments = matchingPayments.filter(p => isPaymentTransfer(p));

      const totalPaidCash = cashPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const totalPaidTransfer = transferPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const totalPaidAll = totalPaidCash + totalPaidTransfer;

      // Siswa belum bayar
      const unpaidStudents: UnpaidStudentInfo[] = [];
      let totalUnpaidAmount = 0;

      activeStudents.forEach(st => {
        const arrDetail = (st.arrears_details || []).find((a: any) => {
          const aName = (a.name || '').toLowerCase();
          return catKeywords.some(kw => aName.includes(kw));
        });

        if (arrDetail) {
          const amt = Number(arrDetail.amount) || 0;
          if (amt > 0) {
            totalUnpaidAmount += amt;
            unpaidStudents.push({
              id: st.id,
              name: st.name || 'Siswa',
              kelas: st.kelas || '-',
              amount: amt,
              whatsapp: st.whatsapp || st.phone || '',
              nisn: st.nisn || '',
              parentName: st.parentName || st.namaWali || ''
            });
          }
        }
      });

      // Setoran cash yang sudah disetor bendahara
      const matchingDeposits = deposits.filter(d => {
        if (d.categoryKey && d.categoryKey === cat.id) return true;
        const dType = (d.depositType || '').toLowerCase();
        const dDesc = (d.description || '').toLowerCase();
        return catKeywords.some(kw => dType.includes(kw) || dDesc.includes(kw));
      }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      const latestDeposit = matchingDeposits[0];
      const latestDepositDate = latestDeposit ? latestDeposit.date : null;
      const latestDepositAmount = latestDeposit ? (Number(latestDeposit.amount) || 0) : 0;

      const totalDepositedDisahkan = matchingDeposits
        .filter(d => d.status === 'disahkan')
        .reduce((s, d) => s + (Number(d.amount) || 0), 0);

      const totalDepositedPending = matchingDeposits
        .filter(d => d.status !== 'disahkan' && d.status !== 'ditolak')
        .reduce((s, d) => s + (Number(d.amount) || 0), 0);

      const remainingCashAtTreasurer = Math.max(0, totalPaidCash - totalDepositedDisahkan);

      let status: CategoryReconciliation['status'] = 'belum_ada_pembayaran';
      let statusLabel = 'Belum Ada Pembayaran Siswa';
      if (totalPaidCash > 0) {
        if (remainingCashAtTreasurer === 0) {
          status = 'sudah_disetor';
          statusLabel = 'Sudah Disetor Penuh ke Kas Sekolah';
        } else if (totalDepositedDisahkan > 0) {
          status = 'sebagian_disetor';
          statusLabel = `Disetor Sebagian (Sisa ${formatRupiah(remainingCashAtTreasurer)})`;
        } else {
          status = 'belum_disetor';
          statusLabel = `Belum Disetor (${formatRupiah(remainingCashAtTreasurer)} di Bendahara)`;
        }
      }

      list.push({
        id: cat.id,
        name: cat.name,
        group: 'Non-SPP / Kegiatan',
        totalTarget: totalPaidAll + totalUnpaidAmount,
        totalPaidCash,
        totalPaidTransfer,
        totalPaidAll,
        totalUnpaidStudentsAmount: totalUnpaidAmount,
        unpaidStudents,
        paidStudentsCount: matchingPayments.length,
        unpaidStudentsCount: unpaidStudents.length,
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
  }, [payments, activeStudents, deposits, iuranCategories]);

  // Global KPI Summary Counters
  const globalSummary = useMemo(() => {
    let grandTotalPaidCash = 0;
    let grandTotalDeposited = 0;
    let grandTotalRemainingToDeposit = 0;
    let grandTotalUnpaidStudents = 0;
    let countCategoriesPendingDeposit = 0;
    let countCategoriesWithUnpaid = 0;

    reconciliations.forEach(rec => {
      grandTotalPaidCash += rec.totalPaidCash;
      grandTotalDeposited += rec.totalDepositedDisahkan;
      grandTotalRemainingToDeposit += rec.remainingCashAtTreasurer;
      grandTotalUnpaidStudents += rec.totalUnpaidStudentsAmount;

      if (rec.remainingCashAtTreasurer > 0) {
        countCategoriesPendingDeposit++;
      }
      if (rec.totalUnpaidStudentsAmount > 0) {
        countCategoriesWithUnpaid++;
      }
    });

    return {
      grandTotalPaidCash,
      grandTotalDeposited,
      grandTotalRemainingToDeposit,
      grandTotalUnpaidStudents,
      countCategoriesPendingDeposit,
      countCategoriesWithUnpaid
    };
  }, [reconciliations]);

  // Tabungan item specific shortcut
  const tabunganItem = useMemo(() => {
    return reconciliations.find(r => r.isTabungan);
  }, [reconciliations]);

  // Filtered List
  const filteredReconciliations = useMemo(() => {
    return reconciliations.filter(item => {
      // Group filter
      if (selectedGroup === 'spp' && item.group !== 'SPP Bulanan') return false;
      if (selectedGroup === 'tabungan' && !item.isTabungan) return false;
      if (selectedGroup === 'non_spp' && (item.group === 'SPP Bulanan' || item.isTabungan)) return false;

      // Status filter
      if (selectedStatusFilter === 'belum_disetor' && item.remainingCashAtTreasurer <= 0) return false;
      if (selectedStatusFilter === 'sudah_disetor' && item.status !== 'sudah_disetor') return false;
      if (selectedStatusFilter === 'ada_tunggakan' && item.totalUnpaidStudentsAmount <= 0) return false;

      // Search query
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

  // Open Unpaid Students Modal
  const handleOpenUnpaidModal = (cat: CategoryReconciliation) => {
    setSelectedCategoryForModal(cat);
    setModalStudentSearch('');
    setModalClassFilter('all');
    setShowUnpaidModal(true);
  };

  // Filter students inside modal
  const filteredModalStudents = useMemo(() => {
    if (!selectedCategoryForModal) return [];
    return selectedCategoryForModal.unpaidStudents.filter(st => {
      if (modalClassFilter !== 'all' && st.kelas !== modalClassFilter) return false;
      if (modalStudentSearch.trim()) {
        const q = modalStudentSearch.toLowerCase();
        const matchName = st.name.toLowerCase().includes(q);
        const matchKelas = st.kelas.toLowerCase().includes(q);
        const matchNisn = (st.nisn || '').toLowerCase().includes(q);
        if (!matchName && !matchKelas && !matchNisn) return false;
      }
      return true;
    });
  }, [selectedCategoryForModal, modalClassFilter, modalStudentSearch]);

  // WhatsApp Follow Up Link Generator
  const generateWhatsAppLink = (student: UnpaidStudentInfo, categoryName: string) => {
    let phone = (student.whatsapp || '').replace(/[^0-9]/g, '');
    if (!phone) return null;
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }
    const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nYth. Bapak/Ibu Orang Tua/Wali dari ananda *${student.name}* (${student.kelas}),\n\nKami dari Bagian Keuangan RA Daarusyifa menginformasikan tagihan *${categoryName}* sebesar *${formatRupiah(student.amount)}* belum tercatat lunas.\n\nBapak/Ibu dapat melakukan pembayaran tunai langsung di bendahara sekolah atau transfer ke rekening resmi sekolah.\n\nAtas perhatian dan kerja samanya, kami ucapkan terima kasih.\nWassalamu'alaikum Warahmatullahi Wabarakatuh.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  // Export Reconciliation to Excel
  const handleExportReconciliationExcel = () => {
    if (filteredReconciliations.length === 0) {
      alert('Tidak ada data rekonsiliasi yang sesuai filter.');
      return;
    }

    // Sheet 1: Matrix Rekonsiliasi Kas per Pos
    const rowsSummary = filteredReconciliations.map((item, idx) => ({
      'No': idx + 1,
      'Pos Keuangan / Kategori': item.name,
      'Kelompok': item.group,
      'Target Total Tagihan (Rp)': item.totalTarget,
      'Terbayar Tunai Siswa (Rp)': item.totalPaidCash,
      'Terbayar Non-Tunai / Online (Rp)': item.totalPaidTransfer,
      'Total Terbayar (Rp)': item.totalPaidAll,
      'Sisa Tagihan Siswa / Tunggakan (Rp)': item.totalUnpaidStudentsAmount,
      'Jumlah Siswa Belum Bayar': item.unpaidStudentsCount,
      'Disetorkan ke Kas Sekolah / Kepsek (Rp)': item.totalDepositedDisahkan,
      'Sisa Kas Masuk Belum Disetor di Bendahara (Rp)': item.remainingCashAtTreasurer,
      'Tanggal Setoran Terakhir': item.latestDepositDate || 'Belum Pernah Setor',
      'Nominal Setoran Terakhir (Rp)': item.latestDepositAmount,
      'Status Setoran Cash': item.statusLabel
    }));

    const wsSummary = XLSX.utils.json_to_sheet(rowsSummary);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Rekonsiliasi Sisa Setoran');

    // Sheet 2: Rincian Siswa yang Belum Bayar
    const allUnpaidRows: any[] = [];
    filteredReconciliations.forEach(cat => {
      cat.unpaidStudents.forEach((st, sIdx) => {
        allUnpaidRows.push({
          'Kategori / Pos': cat.name,
          'No': sIdx + 1,
          'Nama Siswa': st.name,
          'Kelas': st.kelas,
          'NISN': st.nisn || '-',
          'Nominal Tunggakan (Rp)': st.amount,
          'Nama Wali': st.parentName || '-',
          'No. WhatsApp': st.whatsapp || '-'
        });
      });
    });

    if (allUnpaidRows.length > 0) {
      const wsStudents = XLSX.utils.json_to_sheet(allUnpaidRows);
      XLSX.utils.book_append_sheet(wb, wsStudents, 'Daftar Siswa Belum Lunas');
    }

    // Sheet 3: Ringkasan Total
    const totalsData = [
      { 'Item': 'Total Uang Tunai Diterima dari Siswa', 'Nominal': formatRupiah(globalSummary.grandTotalPaidCash) },
      { 'Item': 'Total Setoran Cash Resmi Disahkan ke Kepsek/Yayasan', 'Nominal': formatRupiah(globalSummary.grandTotalDeposited) },
      { 'Item': 'Sisa Uang Kas Masuk yang Belum Disetor (di Bendahara)', 'Nominal': formatRupiah(globalSummary.grandTotalRemainingToDeposit) },
      { 'Item': 'Total Tagihan Siswa yang Belum Bayar (Tunggakan Aktif)', 'Nominal': formatRupiah(globalSummary.grandTotalUnpaidStudents) },
      { 'Item': 'Jumlah Pos yang Memiliki Sisa Kas Belum Disetor', 'Nominal': `${globalSummary.countCategoriesPendingDeposit} Kategori` },
      { 'Item': 'Waktu Cetak Rekonsiliasi', 'Nominal': new Date().toLocaleString('id-ID') }
    ];
    const wsTotals = XLSX.utils.json_to_sheet(totalsData);
    XLSX.utils.book_append_sheet(wb, wsTotals, 'Ringkasan Kas Global');

    XLSX.writeFile(wb, `Rekonsiliasi_Setoran_Cash_dan_Sisa_Kas_RA_Darusyifa_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. TOP HIGHLIGHT STATS: REKONSILIASI KAS & SISA TUNGGAKAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* TOTAL SISA KAS DI BENDAHARA (BELUM DISETOR) */}
        <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-[1.75rem] border shadow-sm relative overflow-hidden transition-all ${
          globalSummary.grandTotalRemainingToDeposit > 0 
            ? 'bg-gradient-to-br from-amber-50 to-orange-50/70 border-amber-200 ring-2 ring-amber-300/40' 
            : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <Coins size={14} className="text-amber-600" />
              Sisa Kas Belum Disetor
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
              globalSummary.grandTotalRemainingToDeposit > 0 ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {globalSummary.grandTotalRemainingToDeposit > 0 ? 'Perlu Disetor' : 'Nihil'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {formatRupiah(globalSummary.grandTotalRemainingToDeposit)}
          </h3>
          <p className="text-[11px] text-slate-600 font-medium mt-1">
            Uang fisik di bendahara yang belum disahkan ke Kepsek/Yayasan ({globalSummary.countCategoriesPendingDeposit} pos).
          </p>
        </div>

        {/* TOTAL UANG SISWA YANG BELUM BAYAR (TUNGGAKAN) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[1.75rem] border border-rose-100 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-rose-50/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <Users size={14} className="text-rose-600" />
              Siswa Belum Bayar (Tunggakan)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
              Piutang
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-rose-700 tracking-tight">
            {formatRupiah(globalSummary.grandTotalUnpaidStudents)}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Total uang yang belum dibayar oleh siswa di semua pos tagihan.
          </p>
        </div>

        {/* SUDAH DITERIMA DARI SISWA (TUNAI) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[1.75rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Banknote size={14} className="text-emerald-600" />
              Total Tunai Diterima
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800">
              Kas Masuk
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {formatRupiah(globalSummary.grandTotalPaidCash)}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Total penerimaan tunai dari pembayaran siswa & tabungan.
          </p>
        </div>

        {/* RESMI DISAHKAN KE KAS SEKOLAH */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[1.75rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-teal-600" />
              Disahkan ke Kas Sekolah
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-50 text-teal-800">
              Disahkan
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-teal-800 tracking-tight">
            {formatRupiah(globalSummary.grandTotalDeposited)}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Setoran tunai yang telah diverifikasi & disahkan Kepala Sekolah.
          </p>
        </div>
      </div>

      {/* 2. DEDICATED TABUNGAN TRACKING BANNER (User Request: "termasuk tabungan misal uang tabungan yang sudah disetor tanggal sekian dari tanggal selanjutnya yang belum setor") */}
      {tabunganItem && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-black uppercase tracking-wider text-emerald-300 mb-2">
                <Coins size={14} />
                Tracking Real-Time Tabungan Siswa
              </div>
              <h3 className="text-lg sm:text-2xl font-black tracking-tight">
                Rekonsiliasi Tabungan Siswa & Tanggal Setoran
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/80 font-normal mt-1 leading-relaxed">
                {tabunganItem.latestDepositDate ? (
                  <>
                    Setoran tabungan terakhir disahkan tanggal <strong className="text-white underline">{tabunganItem.latestDepositDate}</strong> ({formatRupiah(tabunganItem.latestDepositAmount)}).
                    {' '}Dari tanggal tersebut sampai sekarang, terdapat kas tabungan masuk senilai <strong className="text-emerald-300 font-bold">{formatRupiah(tabunganItem.tabunganInflowAfterLatestDeposit || 0)}</strong> ({tabunganItem.tabunganTransactionsAfterLatestCount || 0} transaksi tunai).
                  </>
                ) : (
                  <>
                    Belum ada riwayat setoran tabungan yang disahkan ke kas sekolah/bank. Seluruh tabungan masuk tunai senilai <strong className="text-white">{formatRupiah(tabunganItem.totalPaidCash)}</strong> masih di tangan bendahara.
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[200px]">
                <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider block">
                  Sisa Tabungan Belum Disetor
                </span>
                <div className="text-2xl font-black text-emerald-300 mt-0.5">
                  {formatRupiah(tabunganItem.remainingCashAtTreasurer)}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {tabunganItem.remainingCashAtTreasurer === 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                      <Check size={12} /> Sudah Disetor Penuh
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full">
                      <AlertCircle size={12} /> Belum Diserahkan
                    </span>
                  )}
                </div>
              </div>

              {tabunganItem.remainingCashAtTreasurer > 0 && (
                <button
                  onClick={() => onOpenQuickDeposit({
                    depositType: 'Tabungan',
                    categoryKey: 'tabungan_siswa',
                    amount: tabunganItem.remainingCashAtTreasurer,
                    description: `Setoran uang kas tabungan siswa (Sisa penerimaan cash setelah setoran ${tabunganItem.latestDepositDate || 'awal'})`,
                    periodType: 'Harian'
                  })}
                  className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Sparkles size={16} />
                  <span>Setorkan Tabungan ({formatRupiah(tabunganItem.remainingCashAtTreasurer)})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. FILTER & SEARCH BAR */}
      <div className="bg-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 border border-slate-100 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Group Filter Tabs */}
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

          {/* Quick Excel Export */}
          <button
            onClick={handleExportReconciliationExcel}
            className="self-end lg:self-auto px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Download size={14} />
            <span>Export Rekonsiliasi Excel</span>
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kategori, SPP Agustus, kegiatan..."
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
              <option value="belum_disetor">⚠️ Belum Disetor / Ada Sisa Kas</option>
              <option value="sudah_disetor">✓ Sudah Disetor Penuh</option>
              <option value="ada_tunggakan">👥 Ada Siswa Belum Bayar</option>
            </select>
          </div>

          <div className="text-right flex items-center justify-end text-xs font-bold text-slate-500">
            Menampilkan <strong className="text-emerald-700 ml-1 mr-1">{filteredReconciliations.length}</strong> pos kategori
          </div>
        </div>
      </div>

      {/* 4. REKONSILIASI MATRIX (DESKTOP TABLE & MOBILE CARDS) */}
      <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Banknote size={16} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">
                Rekonsiliasi Sisa Setoran & Tunggakan Siswa
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Pembaruan otomatis real-time saat siswa membayar & bendahara menyetor uang fisik.
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

                {/* 2-Column Highlight: Sisa Kas di Bendahara VS Sisa Siswa Belum Bayar */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Sisa Kas di Bendahara */}
                  <div className={`p-3 rounded-xl border ${
                    hasRemaining ? 'bg-amber-50/80 border-amber-200' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Sisa Kas Belum Setor
                    </span>
                    <div className={`text-sm font-black mt-0.5 ${hasRemaining ? 'text-amber-900' : 'text-slate-600'}`}>
                      {formatRupiah(cat.remainingCashAtTreasurer)}
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      Masuk: {formatRupiah(cat.totalPaidCash)}
                    </span>
                  </div>

                  {/* Sisa Tunggakan Siswa */}
                  <div className={`p-3 rounded-xl border ${
                    hasUnpaid ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Siswa Belum Bayar
                    </span>
                    <div className={`text-sm font-black mt-0.5 ${hasUnpaid ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {formatRupiah(cat.totalUnpaidStudentsAmount)}
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      {cat.unpaidStudentsCount > 0 ? `${cat.unpaidStudentsCount} siswa belum lunas` : 'Semua siswa lunas'}
                    </span>
                  </div>
                </div>

                {/* Status info bar */}
                <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-dashed border-slate-100 pt-2">
                  <div>
                    {cat.latestDepositDate ? (
                      <span>Setoran terakhir: <strong className="text-slate-800">{cat.latestDepositDate}</strong> ({formatRupiah(cat.latestDepositAmount)})</span>
                    ) : (
                      <span className="text-slate-400">Belum pernah disetor ke kas sekolah</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
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
                      <span>Setor Cash ({formatRupiah(cat.remainingCashAtTreasurer)})</span>
                    </button>
                  )}

                  {!cat.isTabungan && cat.unpaidStudentsCount > 0 && (
                    <button
                      onClick={() => handleOpenUnpaidModal(cat)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Users size={13} />
                      <span>{cat.unpaidStudentsCount} Siswa</span>
                    </button>
                  )}
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
                <th className="py-3 px-4 text-right">Target Tagihan</th>
                <th className="py-3 px-4 text-right">Diterima Siswa (Tunai)</th>
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
                    {/* Nama Pos */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900">{cat.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold flex items-center gap-2 mt-0.5">
                        <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-semibold">{cat.group}</span>
                        {cat.latestDepositDate ? (
                          <span>Setor terakhir: {cat.latestDepositDate}</span>
                        ) : (
                          <span>Belum setor</span>
                        )}
                      </div>
                    </td>

                    {/* Target Total Tagihan */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-slate-600">
                        {formatRupiah(cat.totalTarget)}
                      </span>
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

                    {/* Sudah Disahkan ke Kepsek */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-teal-800">
                        {formatRupiah(cat.totalDepositedDisahkan)}
                      </span>
                      {cat.totalDepositedPending > 0 && (
                        <div className="text-[10px] text-amber-600 font-bold">
                          +{formatRupiah(cat.totalDepositedPending)} tunggu verif
                        </div>
                      )}
                    </td>

                    {/* Sisa Kas di Bendahara (Highlight) */}
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

                    {/* Siswa Belum Bayar (Tunggakan) */}
                    <td className="py-3.5 px-4 text-right">
                      {hasUnpaid ? (
                        <div>
                          <div className="font-black text-rose-700">
                            {formatRupiah(cat.totalUnpaidStudentsAmount)}
                          </div>
                          <button
                            onClick={() => handleOpenUnpaidModal(cat)}
                            className="text-[10px] font-black text-rose-600 hover:text-rose-800 underline inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>{cat.unpaidStudentsCount} Siswa</span>
                            <ChevronRight size={10} />
                          </button>
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
                        {!cat.isTabungan && cat.unpaidStudentsCount > 0 && (
                          <button
                            onClick={() => handleOpenUnpaidModal(cat)}
                            title="Lihat Daftar Siswa Belum Bayar"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Users size={14} />
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
      </div>

      {/* 5. MODAL DAFTAR SISWA BELUM BAYAR (TUNGGAKAN) */}
      {showUnpaidModal && selectedCategoryForModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col h-[85dvh] sm:h-auto max-h-[85dvh] sm:max-h-[88vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm z-20">
              <div>
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block">
                  Daftar Tunggakan Siswa
                </span>
                <h3 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                  {selectedCategoryForModal.name}
                </h3>
                <div className="text-xs text-slate-300 font-medium mt-0.5">
                  Total Tunggakan: <strong className="text-rose-300 font-black">{formatRupiah(selectedCategoryForModal.totalUnpaidStudentsAmount)}</strong> ({selectedCategoryForModal.unpaidStudentsCount} Siswa)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUnpaidModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Filter Toolbar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-2 shrink-0">
              <div className="relative flex-1 w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama siswa atau kelas..."
                  value={modalStudentSearch}
                  onChange={(e) => setModalStudentSearch(e.target.value)}
                  className="w-full bg-white text-xs font-bold text-slate-800 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <select
                value={modalClassFilter}
                onChange={(e) => setModalClassFilter(e.target.value)}
                className="w-full sm:w-auto bg-white text-xs font-bold text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 outline-none cursor-pointer"
              >
                <option value="all">Semua Kelas</option>
                {Array.from(new Set(selectedCategoryForModal.unpaidStudents.map(s => s.kelas))).map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            {/* Modal List Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-2">
              {filteredModalStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  Tidak ada siswa yang sesuai pencarian.
                </div>
              ) : (
                filteredModalStudents.map((st, idx) => {
                  const waLink = generateWhatsAppLink(st, selectedCategoryForModal.name);

                  return (
                    <div key={st.id} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-xs sm:text-sm">{st.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold">
                            {st.kelas} {st.nisn ? `• NISN: ${st.nisn}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs sm:text-sm font-black text-rose-700">
                            {formatRupiah(st.amount)}
                          </div>
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Belum Bayar
                          </span>
                        </div>

                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                            title="Kirim pesan WhatsApp pengingat tagihan"
                          >
                            <MessageCircle size={13} />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Total: <strong className="text-slate-800">{filteredModalStudents.length} Siswa</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowUnpaidModal(false)}
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
