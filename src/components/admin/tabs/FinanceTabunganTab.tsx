import React, { useState, useMemo, useRef } from 'react';
import { 
  Coins, Search, Filter, Download, Printer, Plus, ArrowUpRight, 
  ArrowDownRight, Wallet, Calendar, Users, RefreshCw, Eye, CheckCircle, 
  FileSpreadsheet, ArrowUpDown, ChevronRight, ChevronLeft, AlertCircle, Sparkles,
  Edit3, Check, X, Send, Upload, Info, TrendingUp, History, CheckCircle2,
  Trash2, ShieldCheck, Award
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '../../../lib/firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { formatRupiah } from '../../../lib/salaryUtils';
import { getPrintHeaderHTML, getPrintStyles, getPrintSignatureHTML } from '../../../lib/printUtils';

interface FinanceTabunganTabProps {
  payments: any[];
  allUsers: any[];
  schoolClasses: any[];
  onOpenTabunganModal: () => void;
  handlePrintReceipt: (payment: any) => void;
  settings?: any;
  user?: any;
}

interface RowInputState {
  amount: string;
  notes: string;
  saving?: boolean;
  success?: boolean;
}

interface ExcelImportRow {
  nisn: string;
  name: string;
  kelas?: string;
  amount: number;
  notes?: string;
  matchedStudent?: any;
  isValid: boolean;
}

export default function FinanceTabunganTab({
  payments,
  allUsers,
  schoolClasses,
  onOpenTabunganModal,
  handlePrintReceipt,
  settings,
  user
}: FinanceTabunganTabProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  // Active view: 'manual' (Input Manual Spreadsheet) | 'massal' (Input Massal) | 'import' (Import Excel) | 'history' (Riwayat Transaksi)
  const [activeTabMethod, setActiveTabMethod] = useState<'manual' | 'massal' | 'import' | 'history'>('manual');

  // Filter and search state for the manual spreadsheet table
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua'); // 'Semua' | 'sudah_setor' | 'belum_setor' | 'punya_saldo' | 'saldo_nol'
  const [depositDate, setDepositDate] = useState<string>(todayStr);

  // Pagination for the manual spreadsheet
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(8);

  // Table row inputs: studentId -> RowInputState
  const [rowInputs, setRowInputs] = useState<Record<string, RowInputState>>({});
  
  // Selected student IDs for batch operations
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [batchActionMenuOpen, setBatchActionMenuOpen] = useState<boolean>(false);

  // Quick Input sidebar state
  const [qiClass, setQiClass] = useState<string>('Semua');
  const [qiAmount, setQiAmount] = useState<string>('');
  const [qiNotes, setQiNotes] = useState<string>('Setoran Tabungan');
  const [qiDirectSave, setQiDirectSave] = useState<boolean>(false);
  const [qiSaving, setQiSaving] = useState<boolean>(false);

  // Modal Top Savers
  const [showTopSaversModal, setShowTopSaversModal] = useState<boolean>(false);

  // Modal Excel Import Preview
  const [showExcelModal, setShowExcelModal] = useState<boolean>(false);
  const [excelRows, setExcelRows] = useState<ExcelImportRow[]>([]);
  const [excelImporting, setExcelImporting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global saving notification toast
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // History / Mutasi filters (for the 'history' view)
  const [startDate, setStartDate] = useState<string>(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [selectedTxType, setSelectedTxType] = useState<string>('Semua');
  const [historySearchTerm, setHistorySearchTerm] = useState<string>('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4500);
  };

  // Helper student map
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

  // All savings payments
  const allSavingsPayments = useMemo(() => {
    return payments.filter(p => {
      const isSavingTx = p.type === 'tabungan' || p.type === 'tabungan_keluar' || (p.type && p.type.includes('tabungan')) || p.method === 'Tabungan';
      const isNotRejected = p.status !== 'rejected' && p.status !== 'ditolak';
      return isSavingTx && isNotRejected;
    }).map(p => {
      const student = studentMap.get(p.studentId);
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

      const isOutflow = p.type === 'tabungan_keluar' || p.method === 'Tabungan' || p.isExpense;
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

  // Set of students who already deposited TODAY
  const depositedTodayStudentIds = useMemo(() => {
    const set = new Set<string>();
    allSavingsPayments.forEach(p => {
      if (p.txDateStr === todayStr && !p.isOutflow) {
        set.add(p.studentId);
      }
    });
    return set;
  }, [allSavingsPayments, todayStr]);

  // ===============================================================
  // TOP METRICS CARDS DATA (Matches the 4 Cards in Reference UI)
  // ===============================================================
  // Card 1: Total Saldo Tabungan
  const totalSaldoTabungan = useMemo(() => {
    return activeStudents.reduce((acc, s) => acc + (Number(s.savings) || 0), 0);
  }, [activeStudents]);

  // Card 2: Total Setoran Hari Ini
  const { totalSetoranHariIni, siswaSetorHariIniCount } = useMemo(() => {
    let sum = 0;
    const studentsSet = new Set<string>();
    allSavingsPayments.forEach(p => {
      if (p.txDateStr === todayStr && !p.isOutflow) {
        sum += p.nominal;
        studentsSet.add(p.studentId);
      }
    });
    return {
      totalSetoranHariIni: sum,
      siswaSetorHariIniCount: studentsSet.size
    };
  }, [allSavingsPayments, todayStr]);

  // Card 3: Rata-rata Tabungan Per Siswa
  const rataRataTabungan = useMemo(() => {
    if (activeStudents.length === 0) return 0;
    return Math.round(totalSaldoTabungan / activeStudents.length);
  }, [totalSaldoTabungan, activeStudents]);

  // Card 4: Top 5 Savers
  const top5Savers = useMemo(() => {
    return [...activeStudents]
      .filter(s => (Number(s.savings) || 0) > 0)
      .sort((a, b) => (Number(b.savings) || 0) - (Number(a.savings) || 0))
      .slice(0, 5);
  }, [activeStudents]);

  // Class options
  const classList = useMemo(() => {
    return Array.from(new Set([
      'UTSMAN BIN AFFAN',
      'UMAR BIN KHATTAB',
      ...schoolClasses.map(c => c.name).filter(Boolean),
      ...activeStudents.map(s => s.kelas).filter(Boolean)
    ])).filter(c => {
      const lower = c.toLowerCase();
      return !lower.includes('kelas a') && 
             !lower.includes('kelas b') && 
             !lower.includes('kelompok a') && 
             !lower.includes('kelompok b') && 
             !lower.includes('playgroup');
    }).map(c => {
      if (c.toLowerCase() === 'utsman') return 'UTSMAN BIN AFFAN';
      if (c.toLowerCase() === 'umar' || c.toLowerCase() === 'umar bin khattab') return 'UMAR BIN KHATTAB';
      return c;
    });
  }, [schoolClasses, activeStudents]);

  // Filtered students for manual table
  const filteredStudents = useMemo(() => {
    return activeStudents.filter(s => {
      // Class filter
      if (selectedClass !== 'Semua') {
        const sK = (s.kelas || '').toLowerCase();
        const selK = selectedClass.toLowerCase();
        if (selK.includes('utsman')) {
          if (!sK.includes('utsman')) return false;
        } else if (selK.includes('umar')) {
          if (!sK.includes('umar')) return false;
        } else if (sK !== selK && !sK.includes(selK)) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus === 'sudah_setor') {
        if (!depositedTodayStudentIds.has(s.id)) return false;
      } else if (selectedStatus === 'belum_setor') {
        if (depositedTodayStudentIds.has(s.id)) return false;
      } else if (selectedStatus === 'punya_saldo') {
        if ((Number(s.savings) || 0) <= 0) return false;
      } else if (selectedStatus === 'saldo_nol') {
        if ((Number(s.savings) || 0) > 0) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const nisMatch = (s.email || '').toLowerCase().includes(q);
        const nisnMatch = (s.nisn || '').toLowerCase().includes(q);
        const nickMatch = (s.nickname || s.panggilan || '').toLowerCase().includes(q);
        if (!nameMatch && !nisMatch && !nisnMatch && !nickMatch) return false;
      }

      return true;
    });
  }, [activeStudents, selectedClass, selectedStatus, searchTerm, depositedTodayStudentIds]);

  // Paginated students for the table
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  // Handle single row cell input change
  const handleRowInputChange = (studentId: string, field: 'amount' | 'notes', value: string) => {
    setRowInputs(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { amount: '', notes: 'Setoran Tabungan' }),
        [field]: value
      }
    }));
  };

  // Keyboard navigation for spreadsheet input: Enter or ArrowDown moves to next student's deposit input
  const handleKeyDownAmount = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.getElementById(`deposit-input-${idx + 1}`);
      if (nextInput) (nextInput as HTMLInputElement).focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.getElementById(`deposit-input-${idx - 1}`);
      if (prevInput) (prevInput as HTMLInputElement).focus();
    }
  };

  // Single row save
  const handleSaveSingleRow = async (student: any) => {
    const input = rowInputs[student.id];
    const amountNum = Number(input?.amount);
    if (!input || !input.amount || isNaN(amountNum) || amountNum <= 0) {
      showToast('Masukkan nominal setoran yang valid (lebih dari 0)!', 'error');
      return;
    }

    try {
      setRowInputs(prev => ({
        ...prev,
        [student.id]: { ...(prev[student.id] || {}), saving: true }
      }));

      const newSavings = (Number(student.savings) || 0) + amountNum;
      await updateDoc(doc(db, 'users', student.id), { savings: newSavings });

      await addDoc(collection(db, 'payments'), {
        studentId: student.id,
        studentName: student.name,
        amount: amountNum,
        description: input.notes || 'Setoran Tabungan',
        type: 'tabungan',
        date: depositDate || todayStr,
        adminId: user?.uid || '',
        adminName: user?.displayName || user?.email || 'Admin Keuangan',
        method: 'Tunai',
        createdAt: serverTimestamp()
      });

      setRowInputs(prev => ({
        ...prev,
        [student.id]: {
          amount: '',
          notes: 'Setoran Tabungan',
          saving: false,
          success: true
        }
      }));

      showToast(`Setoran ${formatRupiah(amountNum)} untuk ${student.name} berhasil disimpan!`);
      setTimeout(() => {
        setRowInputs(prev => ({
          ...prev,
          [student.id]: { ...(prev[student.id] || {}), success: false }
        }));
      }, 3000);
    } catch (err) {
      console.error(err);
      setRowInputs(prev => ({
        ...prev,
        [student.id]: { ...(prev[student.id] || {}), saving: false }
      }));
      showToast('Gagal menyimpan setoran tabungan.', 'error');
    }
  };

  // Clear single row input
  const handleClearSingleRow = (studentId: string) => {
    setRowInputs(prev => ({
      ...prev,
      [studentId]: { amount: '', notes: 'Setoran Tabungan' }
    }));
  };

  // Batch toggle all visible students
  const handleToggleSelectAll = () => {
    const visibleIds = paginatedStudents.map(s => s.id);
    const allSelected = visibleIds.every(id => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Batch apply nominal to selected students
  const handleBatchApplyNominal = () => {
    const nominalStr = prompt('Masukkan nominal setoran untuk siswa terpilih (Contoh: 50000):', '50000');
    if (!nominalStr || isNaN(Number(nominalStr)) || Number(nominalStr) <= 0) return;

    setRowInputs(prev => {
      const next = { ...prev };
      selectedStudentIds.forEach(id => {
        next[id] = {
          ...(next[id] || { notes: 'Setoran Tabungan' }),
          amount: nominalStr
        };
      });
      return next;
    });

    setBatchActionMenuOpen(false);
    showToast(`Nominal ${formatRupiah(Number(nominalStr))} diterapkan ke ${selectedStudentIds.length} siswa terpilih.`);
  };

  // Batch save selected or all filled rows
  const handleBatchSave = async (onlySelected = false) => {
    const targetStudents = onlySelected 
      ? filteredStudents.filter(s => selectedStudentIds.includes(s.id))
      : filteredStudents;

    const toSave: { student: any; amount: number; notes: string }[] = [];
    targetStudents.forEach(s => {
      const input = rowInputs[s.id];
      const amount = Number(input?.amount);
      if (input && input.amount && !isNaN(amount) && amount > 0) {
        toSave.push({
          student: s,
          amount,
          notes: input.notes || 'Setoran Tabungan'
        });
      }
    });

    if (toSave.length === 0) {
      showToast('Tidak ada data setoran yang diisi pada tabel!', 'error');
      return;
    }

    const confirmMsg = `Simpan setoran tabungan untuk ${toSave.length} siswa dengan total ${formatRupiah(toSave.reduce((a, b) => a + b.amount, 0))}?`;
    if (!confirm(confirmMsg)) return;

    try {
      const batchLimit = 250;
      let currentBatch = writeBatch(db);
      let opCount = 0;

      for (const item of toSave) {
        const studentRef = doc(db, 'users', item.student.id);
        const newSavings = (Number(item.student.savings) || 0) + item.amount;
        currentBatch.update(studentRef, { savings: newSavings });
        opCount++;

        const paymentRef = doc(collection(db, 'payments'));
        currentBatch.set(paymentRef, {
          studentId: item.student.id,
          studentName: item.student.name,
          amount: item.amount,
          description: item.notes,
          type: 'tabungan',
          date: depositDate || todayStr,
          adminId: user?.uid || '',
          adminName: user?.displayName || user?.email || 'Admin Keuangan',
          method: 'Tunai',
          createdAt: serverTimestamp()
        });
        opCount++;

        if (opCount >= batchLimit) {
          await currentBatch.commit();
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      }

      if (opCount > 0) {
        await currentBatch.commit();
      }

      // Reset row inputs
      setRowInputs(prev => {
        const next = { ...prev };
        toSave.forEach(item => {
          next[item.student.id] = { amount: '', notes: 'Setoran Tabungan' };
        });
        return next;
      });

      setSelectedStudentIds([]);
      setBatchActionMenuOpen(false);
      showToast(`Alhamdulillah! Berhasil menyimpan setoran untuk ${toSave.length} siswa.`);
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan setoran massal.', 'error');
    }
  };

  // Quick Input sidebar action
  const handleQuickInputToClass = async () => {
    const amountNum = Number(qiAmount);
    if (!qiAmount || isNaN(amountNum) || amountNum <= 0) {
      showToast('Masukkan nominal setoran yang valid!', 'error');
      return;
    }

    const studentsInClass = activeStudents.filter(s => {
      if (qiClass === 'Semua') return true;
      const sK = (s.kelas || '').toLowerCase();
      const selK = qiClass.toLowerCase();
      if (selK.includes('utsman')) return sK.includes('utsman');
      if (selK.includes('umar')) return sK.includes('umar');
      return sK === selK || sK.includes(selK);
    });

    if (studentsInClass.length === 0) {
      showToast('Tidak ada siswa aktif di kelas yang dipilih.', 'error');
      return;
    }

    if (!qiDirectSave) {
      // Just populate table inputs so user can review and adjust!
      setRowInputs(prev => {
        const next = { ...prev };
        studentsInClass.forEach(s => {
          next[s.id] = {
            amount: String(amountNum),
            notes: qiNotes || 'Setoran Tabungan'
          };
        });
        return next;
      });

      if (qiClass !== 'Semua') setSelectedClass(qiClass);
      showToast(`Nominal ${formatRupiah(amountNum)} diisikan ke tabel untuk ${studentsInClass.length} siswa kelas ${qiClass}. Silakan periksa lalu simpan.`);
    } else {
      // Directly commit to database
      if (!confirm(`Yakin ingin LANGSUNG menyimpan setoran ${formatRupiah(amountNum)} untuk ${studentsInClass.length} siswa kelas ${qiClass}? Total dana: ${formatRupiah(amountNum * studentsInClass.length)}`)) {
        return;
      }

      try {
        setQiSaving(true);
        const batchLimit = 250;
        let currentBatch = writeBatch(db);
        let opCount = 0;

        for (const s of studentsInClass) {
          const studentRef = doc(db, 'users', s.id);
          const newSavings = (Number(s.savings) || 0) + amountNum;
          currentBatch.update(studentRef, { savings: newSavings });
          opCount++;

          const paymentRef = doc(collection(db, 'payments'));
          currentBatch.set(paymentRef, {
            studentId: s.id,
            studentName: s.name,
            amount: amountNum,
            description: qiNotes || 'Setoran Tabungan Rutin',
            type: 'tabungan',
            date: depositDate || todayStr,
            adminId: user?.uid || '',
            adminName: user?.displayName || user?.email || 'Admin Keuangan',
            method: 'Tunai',
            createdAt: serverTimestamp()
          });
          opCount++;

          if (opCount >= batchLimit) {
            await currentBatch.commit();
            currentBatch = writeBatch(db);
            opCount = 0;
          }
        }

        if (opCount > 0) {
          await currentBatch.commit();
        }

        setQiAmount('');
        showToast(`Berhasil menyimpan tabungan ${formatRupiah(amountNum)} untuk ${studentsInClass.length} siswa kelas ${qiClass}!`);
      } catch (err) {
        console.error(err);
        showToast('Gagal memproses setoran cepat.', 'error');
      } finally {
        setQiSaving(false);
      }
    }
  };

  // ===============================================================
  // EXCEL TEMPLATE DOWNLOAD & IMPORT PARSER
  // ===============================================================
  const handleDownloadTemplate = () => {
    const templateRows = activeStudents.map((s, idx) => ({
      'No': idx + 1,
      'NISN': s.nisn || s.email?.split('@')[0] || `01234567${idx}`,
      'Nama Siswa': s.name,
      'Kelas': s.kelas || 'UTSMAN BIN AFFAN',
      'Nominal Setoran (Rp)': 50000,
      'Keterangan': 'Setoran Tabungan'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Tabungan');
    XLSX.writeFile(wb, 'Template_Input_Tabungan_Siswa.xlsx');
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          showToast('File Excel kosong atau format tidak sesuai!', 'error');
          return;
        }

        const parsed: ExcelImportRow[] = [];
        data.forEach((row: any) => {
          const nisn = String(row['NISN'] || row['nisn'] || '').trim();
          const name = String(row['Nama Siswa'] || row['Nama'] || row['name'] || '').trim();
          const amountRaw = row['Nominal Setoran (Rp)'] || row['Nominal'] || row['amount'] || 0;
          const amount = Number(String(amountRaw).replace(/[^0-9]/g, '')) || 0;
          const notes = String(row['Keterangan'] || row['keterangan'] || 'Setoran Tabungan').trim();

          // Find student by NISN, NIS (email), or exact name
          const matched = activeStudents.find(s => {
            const sNisn = String(s.nisn || '').trim();
            const sNis = String(s.email?.split('@')[0] || '').trim();
            const sName = (s.name || '').trim().toLowerCase();
            return (nisn && (sNisn === nisn || sNis === nisn)) || (name && sName === name.toLowerCase());
          });

          parsed.push({
            nisn: nisn || (matched?.nisn || '-'),
            name: name || (matched?.name || 'Siswa Tidak Dikenal'),
            kelas: matched?.kelas || String(row['Kelas'] || '-'),
            amount,
            notes,
            matchedStudent: matched,
            isValid: Boolean(matched && amount > 0)
          });
        });

        setExcelRows(parsed);
        setShowExcelModal(true);
      } catch (err) {
        console.error(err);
        showToast('Gagal membaca file Excel. Pastikan format .xlsx atau .xls sesuai template.', 'error');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleConfirmExcelImport = async () => {
    const validRows = excelRows.filter(r => r.isValid && r.matchedStudent);
    if (validRows.length === 0) {
      showToast('Tidak ada data valid yang bisa diimpor!', 'error');
      return;
    }

    try {
      setExcelImporting(true);
      const batchLimit = 250;
      let currentBatch = writeBatch(db);
      let opCount = 0;

      for (const row of validRows) {
        const student = row.matchedStudent;
        const studentRef = doc(db, 'users', student.id);
        const newSavings = (Number(student.savings) || 0) + row.amount;
        currentBatch.update(studentRef, { savings: newSavings });
        opCount++;

        const paymentRef = doc(collection(db, 'payments'));
        currentBatch.set(paymentRef, {
          studentId: student.id,
          studentName: student.name,
          amount: row.amount,
          description: row.notes || 'Setoran Tabungan via Import Excel',
          type: 'tabungan',
          date: depositDate || todayStr,
          adminId: user?.uid || '',
          adminName: user?.displayName || user?.email || 'Admin Keuangan',
          method: 'Excel',
          createdAt: serverTimestamp()
        });
        opCount++;

        if (opCount >= batchLimit) {
          await currentBatch.commit();
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      }

      if (opCount > 0) {
        await currentBatch.commit();
      }

      setShowExcelModal(false);
      setExcelRows([]);
      showToast(`Alhamdulillah! ${validRows.length} data tabungan berhasil diimpor ke sistem.`);
    } catch (err) {
      console.error(err);
      showToast('Gagal mengimpor data Excel.', 'error');
    } finally {
      setExcelImporting(false);
    }
  };

  // Count how many rows currently have amounts entered
  const filledRowsCount = useMemo(() => {
    return Object.values(rowInputs).filter(input => Number(input.amount) > 0).length;
  }, [rowInputs]);

  // ===============================================================
  // RIWAYAT TRANSAKSI / MUTASI FILTER LOGIC
  // ===============================================================
  const filteredSavingsTransactions = useMemo(() => {
    return allSavingsPayments.filter(p => {
      let matchDate = true;
      if (startDate && p.txDateStr) matchDate = matchDate && p.txDateStr >= startDate;
      if (endDate && p.txDateStr) matchDate = matchDate && p.txDateStr <= endDate;

      let matchClass = true;
      if (selectedClass !== 'Semua') {
        const sK = (p.studentClass || '').toLowerCase();
        const selK = selectedClass.toLowerCase();
        if (selK.includes('utsman')) matchClass = sK.includes('utsman');
        else if (selK.includes('umar')) matchClass = sK.includes('umar');
        else matchClass = sK === selK || sK.includes(selK);
      }

      let matchType = true;
      if (selectedTxType === 'tabungan') matchType = !p.isOutflow;
      else if (selectedTxType === 'tabungan_keluar') matchType = p.isOutflow;

      let matchSearch = true;
      if (historySearchTerm.trim()) {
        const q = historySearchTerm.toLowerCase();
        matchSearch = 
          p.studentName.toLowerCase().includes(q) ||
          p.studentClass.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.id || '').toLowerCase().includes(q);
      }

      return matchDate && matchClass && matchType && matchSearch;
    }).sort((a, b) => (b.txDateStr || '').localeCompare(a.txDateStr || ''));
  }, [allSavingsPayments, startDate, endDate, selectedClass, selectedTxType, historySearchTerm]);

  const historyStats = useMemo(() => {
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

    return {
      totalSetoran,
      countSetoran,
      totalPenarikan,
      countPenarikan,
      netCashflow: totalSetoran - totalPenarikan,
      totalTx: filteredSavingsTransactions.length
    };
  }, [filteredSavingsTransactions]);

  const periodLabel = useMemo(() => {
    if (!startDate && !endDate) return 'Semua Waktu';
    if (startDate && endDate) {
      if (startDate === endDate) return `Tanggal ${startDate}`;
      return `${startDate} s.d. ${endDate}`;
    }
    if (startDate) return `Mulai ${startDate}`;
    return `Sampai ${endDate}`;
  }, [startDate, endDate]);

  const handleExportExcelRinci = () => {
    if (filteredSavingsTransactions.length === 0) {
      showToast('Tidak ada data tabungan untuk diekspor pada periode ini.', 'error');
      return;
    }

    const mutasiRows = filteredSavingsTransactions.map((tx, idx) => ({
      'No': idx + 1,
      'Tanggal': tx.txDateStr || '-',
      'Waktu': tx.txTimeStr || '-',
      'Nama Siswa': tx.studentName,
      'Kelas': tx.studentClass,
      'Jenis': tx.isOutflow ? 'TARIK TABUNGAN' : 'SETOR TABUNGAN',
      'Nominal (Rp)': tx.nominal,
      'Saldo Akhir (Rp)': tx.currentSaving,
      'Keterangan': tx.description || '-'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(mutasiRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat_Tabungan');
    XLSX.writeFile(wb, `Laporan_Tabungan_${periodLabel.replace(/\s+/g, '_')}.xlsx`);
  };

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
          table.report-table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          table.report-table th { background: #f1f5f9; padding: 8px 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #334155; border-top: 2px solid #94a3b8; border-bottom: 2px solid #94a3b8; }
        </style>
      </head>
      <body>
        ${getPrintHeaderHTML('LAPORAN RINCIAN TABUNGAN SISWA')}
        <div style="text-align: center; margin-top: -15px; margin-bottom: 20px; font-size: 12px; color: #475569;">
          Periode Waktu: <strong>${periodLabel}</strong> &nbsp;|&nbsp; Kelas: <strong>${selectedClass}</strong>
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
          </tbody>
        </table>
        ${getPrintSignatureHTML('', 'Bendahara / Pengelola Tabungan', 'Kepala Sekolah RA Darusyifa')}
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`fixed top-20 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border animate-in slide-in-from-top-4 duration-200 ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-800 text-white border-emerald-600' 
            : 'bg-rose-800 text-white border-rose-600'
        }`}>
          {toastMsg.type === 'success' ? (
            <CheckCircle2 size={20} className="text-emerald-300 shrink-0" />
          ) : (
            <AlertCircle size={20} className="text-rose-300 shrink-0" />
          )}
          <p className="text-xs sm:text-sm font-bold">{toastMsg.text}</p>
        </div>
      )}

      {/* Hidden file input for Excel upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleExcelUpload}
        accept=".xlsx, .xls"
        className="hidden"
      />

      {/* Header Bar with Breadcrumb (Matches Screenshot Top) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200 shrink-0">
            <Wallet size={24} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
              Tabungan Siswa
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Kelola dan input data tabungan siswa dengan cepat, mudah dan rapi.
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/60 self-start md:self-auto">
          <span>Home</span>
          <ChevronRight size={12} />
          <span>Keuangan</span>
          <ChevronRight size={12} />
          <span className="font-bold text-emerald-700">Tabungan Siswa</span>
        </div>
      </div>

      {/* =============================================================== */}
      {/* 4 TOP STAT CARDS (Matches the 4 stat cards in reference image)  */}
      {/* =============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Saldo Tabungan */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-emerald-300 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Saldo Tabungan</p>
            <h3 className="text-xl font-black text-slate-900 leading-tight mt-0.5">
              {formatRupiah(totalSaldoTabungan)}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Dari {activeStudents.length} siswa aktif
            </p>
          </div>
        </div>

        {/* Card 2: Total Setoran Hari Ini */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-blue-300 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Setoran Hari Ini</p>
            <h3 className="text-xl font-black text-slate-900 leading-tight mt-0.5">
              {formatRupiah(totalSetoranHariIni)}
            </h3>
            <p className="text-[11px] text-blue-600 font-bold mt-0.5">
              {siswaSetorHariIniCount} siswa menyetor hari ini
            </p>
          </div>
        </div>

        {/* Card 3: Rata-rata Tabungan */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-amber-300 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Coins size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-rata Tabungan</p>
            <h3 className="text-xl font-black text-slate-900 leading-tight mt-0.5">
              {formatRupiah(rataRataTabungan)}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Per siswa
            </p>
          </div>
        </div>

        {/* Card 4: Siswa dengan Saldo Terbanyak (Clickable to open Top Savers Modal) */}
        <button
          type="button"
          onClick={() => setShowTopSaversModal(true)}
          className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between text-left hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Siswa Saldo Terbanyak</p>
              <h3 className="text-xl font-black text-slate-900 leading-tight mt-0.5">
                {top5Savers.length} siswa
              </h3>
              <p className="text-[11px] text-purple-600 font-bold mt-0.5">
                Lihat peringkat teratas
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
        </button>

      </div>

      {/* =============================================================== */}
      {/* MAIN TWO-COLUMN LAYOUT (Matches reference image structure)     */}
      {/* =============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT MAIN CARD (8 or 9 cols): Input Table & Controls */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
          
          {/* Card Title & Method Selector Tabs */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <Wallet size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">Input Tabungan Siswa</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Pilih metode input yang paling sesuai. Anda bisa input satu per satu, pilih banyak sekaligus, atau gunakan fitur import.
                </p>
              </div>
            </div>

            {/* Methods Navigation Pill */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 overflow-x-auto p-1 bg-slate-50 rounded-2xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setActiveTabMethod('manual')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTabMethod === 'manual'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit3 size={14} />
                  <span>Input Manual</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabMethod('massal')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTabMethod === 'massal'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users size={14} />
                  <span>Input Massal</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTabMethod('import');
                    fileInputRef.current?.click();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTabMethod === 'import'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet size={14} />
                  <span>Import Excel</span>
                </button>
              </div>

              {/* Right side: Riwayat Transaksi */}
              <button
                type="button"
                onClick={() => setActiveTabMethod(activeTabMethod === 'history' ? 'manual' : 'history')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  activeTabMethod === 'history'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <History size={14} className={activeTabMethod === 'history' ? 'text-white' : 'text-slate-500'} />
                <span>Riwayat Transaksi</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* VIEW: SPREADSHEET INPUT (MANUAL & MASSAL MODES)           */}
          {/* ========================================================= */}
          {activeTabMethod !== 'history' && (
            <div className="space-y-4">
              
              {/* Filter and Search Bar (Matches Screenshot) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-2">
                
                {/* Search Input */}
                <div className="lg:col-span-4 relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Cari nama / NISN siswa..."
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Filter Kelas */}
                <div className="lg:col-span-2">
                  <select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Semua">Semua Kelas</option>
                    {classList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Filter Status */}
                <div className="lg:col-span-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="sudah_setor">Sudah Setor Hari Ini</option>
                    <option value="belum_setor">Belum Setor Hari Ini</option>
                    <option value="punya_saldo">Memiliki Saldo</option>
                    <option value="saldo_nol">Saldo Rp 0</option>
                  </select>
                </div>

                {/* Tanggal Setoran */}
                <div className="lg:col-span-2">
                  <div className="relative">
                    <input
                      type="date"
                      value={depositDate}
                      onChange={(e) => setDepositDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Button: + Input Tabungan */}
                <div className="lg:col-span-2">
                  <button
                    type="button"
                    onClick={onOpenTabunganModal}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-200 transition-all cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Input Tabungan</span>
                  </button>
                </div>

              </div>

              {/* Batch Action Toolbar Bar (Matches Reference Image) */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudentIds.includes(s.id))}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Pilih Semua</span>
                  </label>

                  {selectedStudentIds.length > 0 && (
                    <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                      {selectedStudentIds.length} siswa dipilih
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Dropdown Aksi Massal */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setBatchActionMenuOpen(!batchActionMenuOpen)}
                      disabled={selectedStudentIds.length === 0}
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-50 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Sparkles size={13} className="text-emerald-600" />
                      <span>Aksi Massal</span>
                      <ChevronRight size={13} className={`transition-transform ${batchActionMenuOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {batchActionMenuOpen && (
                      <div className="absolute right-0 top-full mt-1.5 z-30 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 min-w-[200px] animate-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={handleBatchApplyNominal}
                          className="w-full text-left px-3 py-2 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer"
                        >
                          <Coins size={14} className="text-amber-500" />
                          <span>Isi Nominal Terpilih...</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBatchSave(true)}
                          className="w-full text-left px-3 py-2 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer"
                        >
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>Simpan Semua yang Terpilih</span>
                        </button>
                        <div className="border-t border-slate-100 my-1" />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentIds([]);
                            setBatchActionMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-rose-50 hover:text-rose-700 rounded-xl text-xs font-bold text-slate-500 flex items-center gap-2 cursor-pointer"
                        >
                          <X size={14} />
                          <span>Kosongkan Pilihan</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Save All Dirty Button */}
                  {filledRowsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleBatchSave(false)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm shadow-emerald-200 cursor-pointer animate-pulse"
                    >
                      <CheckCircle2 size={13} />
                      <span>Simpan Semua ({filledRowsCount} Siswa)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* SPREADSHEET TABLE (Pixel-Accurate to Reference Image) */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudentIds.includes(s.id))}
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </th>
                      <th className="py-3 px-3 w-10 text-center">No</th>
                      <th className="py-3 px-4 min-w-[200px]">Nama Siswa</th>
                      <th className="py-3 px-3 w-28">NISN</th>
                      <th className="py-3 px-3 w-20 text-center">Kelas</th>
                      <th className="py-3 px-3 w-32 text-right">Saldo Saat Ini</th>
                      <th className="py-3 px-3 w-36 text-center">Input Setoran</th>
                      <th className="py-3 px-3 min-w-[160px]">Keterangan</th>
                      <th className="py-3 px-3 w-24 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedStudents.map((student, idx) => {
                      const absoluteIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                      const isSelected = selectedStudentIds.includes(student.id);
                      const currentSavings = Number(student.savings) || 0;
                      const hasDepositedToday = depositedTodayStudentIds.has(student.id);
                      const rowState = rowInputs[student.id] || { amount: '', notes: 'Setoran Tabungan' };

                      // Short class code for badge (e.g. B1, B2, UTSMAN -> B1 / U1)
                      const classBadge = student.kelas?.toLowerCase().includes('utsman') 
                        ? 'B1' 
                        : student.kelas?.toLowerCase().includes('umar') 
                        ? 'B2' 
                        : (student.kelas?.substring(0, 3) || 'RA');

                      return (
                        <tr 
                          key={student.id} 
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isSelected ? 'bg-emerald-50/30' : ''
                          } ${rowState.success ? 'bg-emerald-50' : ''}`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedStudentIds(prev => [...prev, student.id]);
                                else setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                              }}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>

                          {/* No */}
                          <td className="py-3 px-3 text-center font-bold text-slate-400">
                            {absoluteIdx}
                          </td>

                          {/* Nama Siswa + Avatar + Nickname */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                                {student.photoURL ? (
                                  <img src={student.photoURL} alt={student.name} className="w-full h-full object-cover" />
                                ) : (
                                  student.name?.charAt(0) || 'S'
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">
                                  {student.name}
                                  {student.nickname && (
                                    <span className="text-slate-400 font-normal ml-1">({student.nickname})</span>
                                  )}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                  NIS: {student.email?.split('@')[0] || '-'}
                                  {hasDepositedToday && (
                                    <span className="text-emerald-600 font-bold ml-1.5">• Setor Hari Ini</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* NISN */}
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-600 font-medium">
                            {student.nisn || student.email?.split('@')[0] || '-'}
                          </td>

                          {/* Kelas Badge */}
                          <td className="py-3 px-3 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {classBadge}
                            </span>
                          </td>

                          {/* Saldo Saat Ini */}
                          <td className="py-3 px-3 text-right font-black text-slate-900">
                            {formatRupiah(currentSavings)}
                          </td>

                          {/* Direct Input Setoran */}
                          <td className="py-3 px-3 text-center">
                            <input
                              id={`deposit-input-${idx}`}
                              type="number"
                              min="0"
                              value={rowState.amount}
                              onChange={(e) => handleRowInputChange(student.id, 'amount', e.target.value)}
                              onKeyDown={(e) => handleKeyDownAmount(e, idx)}
                              placeholder="0"
                              className={`w-full max-w-[120px] p-2 text-center rounded-xl text-xs font-bold outline-none border transition-all focus:ring-2 focus:ring-emerald-500 ${
                                Number(rowState.amount) > 0 
                                  ? 'bg-emerald-50/80 text-emerald-900 border-emerald-400 font-black' 
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            />
                          </td>

                          {/* Direct Input Keterangan */}
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              value={rowState.notes}
                              onChange={(e) => handleRowInputChange(student.id, 'notes', e.target.value)}
                              placeholder="Keterangan..."
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>

                          {/* Aksi: Green Checkmark & Red X (Matches Screenshot) */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Green Check Button */}
                              <button
                                type="button"
                                onClick={() => handleSaveSingleRow(student)}
                                disabled={rowState.saving || !rowState.amount || Number(rowState.amount) <= 0}
                                title="Simpan Setoran Santri Ini"
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                  Number(rowState.amount) > 0
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs scale-105'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 disabled:opacity-40'
                                }`}
                              >
                                {rowState.saving ? (
                                  <RefreshCw size={13} className="animate-spin" />
                                ) : (
                                  <Check size={14} className="stroke-[3]" />
                                )}
                              </button>

                              {/* Red X Button */}
                              <button
                                type="button"
                                onClick={() => handleClearSingleRow(student.id)}
                                title="Bersihkan Input"
                                className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-all cursor-pointer"
                              >
                                <X size={14} className="stroke-[2.5]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {paginatedStudents.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                          Tidak ada santri yang cocok dengan filter atau pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Pagination Bar (Matches Reference Image) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 text-xs text-slate-500 font-medium">
                <div>
                  Menampilkan {paginatedStudents.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredStudents.length)} dari {filteredStudents.length} data
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center font-bold text-slate-600 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }).map((_, pIdx) => {
                    const pageNum = pIdx + 1;
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {totalPages > 5 && (
                    <>
                      <span className="px-1 text-slate-400 font-bold">...</span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage(totalPages)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentPage === totalPages 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center font-bold text-slate-600 transition-colors cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW: RIWAYAT TRANSAKSI / MUTASI LAPORAN TABUNGAN         */}
          {/* ========================================================= */}
          {activeTabMethod === 'history' && (
            <div className="space-y-4">
              
              {/* Filter controls for Mutasi */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-500">Rentang Tanggal:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                  />
                  <span className="text-xs text-slate-400 font-bold">s/d</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                  />
                  
                  <select
                    value={selectedTxType}
                    onChange={(e) => setSelectedTxType(e.target.value)}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="Semua">Semua Mutasi</option>
                    <option value="tabungan">Setoran Masuk (+)</option>
                    <option value="tabungan_keluar">Penarikan Keluar (-)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportExcelRinci}
                    className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Export Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintLaporanTabungan}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Printer size={14} />
                    <span>Cetak PDF</span>
                  </button>
                </div>
              </div>

              {/* Transactions List */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3 w-10 text-center">No</th>
                      <th className="py-3 px-3 w-32">Tanggal & Waktu</th>
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-3">Kelas</th>
                      <th className="py-3 px-3">Jenis Mutasi</th>
                      <th className="py-3 px-3 text-right">Nominal</th>
                      <th className="py-3 px-3 text-right">Saldo Saat Itu</th>
                      <th className="py-3 px-4">Keterangan</th>
                      <th className="py-3 px-3 text-center">Kuitansi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSavingsTransactions.map((tx, idx) => (
                      <tr key={tx.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-800">{tx.txDateStr}</p>
                          {tx.txTimeStr && <p className="text-[10px] text-slate-400">{tx.txTimeStr}</p>}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{tx.studentName}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {tx.studentClass}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            tx.isOutflow 
                              ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {tx.isOutflow ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}
                            {tx.isOutflow ? 'Tarik (-)' : 'Setor (+)'}
                          </span>
                        </td>
                        <td className={`py-3 px-3 text-right font-black ${tx.isOutflow ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {formatRupiah(tx.nominal)}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-600">
                          {formatRupiah(tx.currentSaving)}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{tx.description || '-'}</td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handlePrintReceipt(tx)}
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg text-xs transition-colors cursor-pointer"
                            title="Cetak Kuitansi"
                          >
                            <Printer size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredSavingsTransactions.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                          Tidak ada data mutasi tabungan pada rentang filter ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* RIGHT SIDEBAR (3 or 4 cols): Quick Input, Import Excel, Tips (Matches Reference UI) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-5">
          
          {/* Card 1: ⚡ Quick Input */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Quick Input</h3>
                <p className="text-[11px] text-slate-400">Input cepat untuk semua siswa di kelas tertentu.</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Pilih Kelas
                </label>
                <select
                  value={qiClass}
                  onChange={(e) => setQiClass(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Semua">Semua Kelas</option>
                  {classList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nominal Setoran
                </label>
                <input
                  type="number"
                  min="0"
                  value={qiAmount}
                  onChange={(e) => setQiAmount(e.target.value)}
                  placeholder="Contoh: 50000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
                
                {/* Quick preset chips */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[10000, 20000, 50000, 100000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setQiAmount(String(val))}
                      className="flex-1 py-1 text-[10px] font-bold rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors cursor-pointer"
                    >
                      {val >= 1000 ? `${val / 1000}rb` : val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  value={qiNotes}
                  onChange={(e) => setQiNotes(e.target.value)}
                  placeholder="Contoh: Tabungan / SPP / dll"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qiDirectSave}
                    onChange={(e) => setQiDirectSave(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Langsung Simpan ke Database</p>
                    <p className="text-[10px] text-slate-400">Jika mati, hanya mengisikan ke kolom tabel</p>
                  </div>
                </label>
              </div>

              <button
                type="button"
                onClick={handleQuickInputToClass}
                disabled={qiSaving}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
              >
                {qiSaving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Input ke Semua Siswa</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Import Excel */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <FileSpreadsheet size={16} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Import Excel</h3>
                <p className="text-[11px] text-slate-400">Upload file Excel untuk input tabungan siswa secara massal.</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Download size={14} className="text-slate-500" />
                <span>Download Template</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-emerald-200"
              >
                <Upload size={14} />
                <span>Upload File Excel</span>
              </button>
            </div>
          </div>

          {/* Card 3: ℹ Tips (Matches Screenshot) */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
              <Info size={16} className="text-emerald-700" />
              <span>Tips Efisiensi</span>
            </div>

            <ul className="space-y-2 text-xs text-emerald-950/80 font-medium list-disc list-inside leading-relaxed">
              <li>Gunakan fitur <b>Input Massal</b> untuk menghemat waktu input per kelas.</li>
              <li>Pastikan data NISN sesuai saat upload file Excel.</li>
              <li>Anda dapat mengubah nominal kapan saja di tabel sebelum disimpan.</li>
              <li>Tekan tombol <b>Enter</b> pada keyboard untuk berpindah ke baris siswa berikutnya dengan sangat cepat.</li>
            </ul>
          </div>

        </div>

      </div>

      {/* =============================================================== */}
      {/* MODAL: TOP 5 SAVERS (Triggered from Top Stat Card 4)            */}
      {/* =============================================================== */}
      {showTopSaversModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Peringkat Saldo Terbanyak</h3>
                  <p className="text-xs text-slate-400">Santri dengan akumulasi tabungan tertinggi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTopSaversModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto">
              {top5Savers.map((s, idx) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                      idx === 0 ? 'bg-amber-400 text-amber-950 shadow-xs' :
                      idx === 1 ? 'bg-slate-300 text-slate-900' :
                      idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">{s.name}</p>
                      <p className="text-[10px] text-slate-400">Kelas: {s.kelas || 'RA'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-black text-sm text-emerald-700">{formatRupiah(s.savings || 0)}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Saldo Aktif</p>
                  </div>
                </div>
              ))}

              {top5Savers.length === 0 && (
                <p className="text-center text-slate-400 py-6 text-xs">Belum ada santri yang memiliki saldo tabungan.</p>
              )}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowTopSaversModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL: EXCEL IMPORT PREVIEW & CONFIRMATION                       */}
      {/* =============================================================== */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Konfirmasi Import Excel</h3>
                  <p className="text-xs text-slate-400">
                    Ditemukan {excelRows.length} baris data ({excelRows.filter(r => r.isValid).length} valid untuk diimpor)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExcelModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto max-h-[50vh] rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 text-[11px]">
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">NISN</th>
                    <th className="py-2.5 px-3">Nama Santri</th>
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {excelRows.map((r, i) => (
                    <tr key={i} className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                      <td className="py-2 px-3 text-slate-400 font-bold">{i + 1}</td>
                      <td className="py-2 px-3 font-mono">{r.nisn}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{r.name}</td>
                      <td className="py-2 px-3">{r.kelas}</td>
                      <td className="py-2 px-3 text-right font-black text-emerald-700">{formatRupiah(r.amount)}</td>
                      <td className="py-2 px-3 text-center">
                        {r.isValid ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Valid
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                            Siswa Tidak Ditemukan
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500 font-medium">
                Total Setoran: <strong className="text-emerald-700">{formatRupiah(excelRows.filter(r => r.isValid).reduce((a, b) => a + b.amount, 0))}</strong>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowExcelModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExcelImport}
                  disabled={excelImporting || excelRows.filter(r => r.isValid).length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  {excelImporting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Mengimpor...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Simpan ({excelRows.filter(r => r.isValid).length} Data)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
