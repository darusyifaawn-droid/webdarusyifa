import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, Filter, Download, Printer, Edit, Trash2, CheckCircle, 
  Clock, AlertCircle, Wallet, Users, ArrowUpRight, ArrowDownRight, 
  Sparkles, RefreshCw, X, ShieldCheck, ChevronRight, Eye, Send, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../../lib/firestoreUtils';
import { 
  SalarySlipData, SalaryItem, MONTH_NAMES, DEFAULT_KEPSEK, 
  formatRupiah, terbilang, generateVerificationCode 
} from '../../../lib/salaryUtils';
import SalarySlipModal from '../../salary/SalarySlipModal';

interface FinanceSlipGajiTabProps {
  salarySlips: SalarySlipData[];
  allUsers: any[];
  schoolClasses: any[];
  settings?: any;
}

export default function FinanceSlipGajiTab({
  salarySlips,
  allUsers,
  schoolClasses,
  settings
}: FinanceSlipGajiTabProps) {
  // Current date defaults
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  const currentMonthName = MONTH_NAMES[currentMonthIdx];

  // Filter states
  const [filterMonth, setFilterMonth] = useState<string>(currentMonthName);
  const [filterYear, setFilterYear] = useState<number>(currentYear);
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [filterTeacher, setFilterTeacher] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected slip for detail / printing
  const [selectedSlipForView, setSelectedSlipForView] = useState<SalarySlipData | null>(null);

  // Modal Input / Edit State
  const [showInputModal, setShowInputModal] = useState<boolean>(false);
  const [editingSlipId, setEditingSlipId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);

  // Batch Generation Modal
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [batchBaseSalary, setBatchBaseSalary] = useState<number>(1200000);
  const [batchTunjanganWaliKelas, setBatchTunjanganWaliKelas] = useState<number>(200000);
  const [batchTunjanganTransport, setBatchTunjanganTransport] = useState<number>(150000);
  const [batchTunjanganMakan, setBatchTunjanganMakan] = useState<number>(150000);
  const [batchTunjanganKehadiran, setBatchTunjanganKehadiran] = useState<number>(100000);

  // Form States for Single Slip Input
  const [formTeacherId, setFormTeacherId] = useState<string>('');
  const [formTeacherName, setFormTeacherName] = useState<string>('');
  const [formTeacherEmail, setFormTeacherEmail] = useState<string>('');
  const [formTeacherNip, setFormTeacherNip] = useState<string>('');
  const [formTeacherJabatan, setFormTeacherJabatan] = useState<string>('Guru Pengajar');
  const [formAssignedClass, setFormAssignedClass] = useState<string>('UTSMAN BIN AFFAN');
  const [formMonth, setFormMonth] = useState<string>(currentMonthName);
  const [formYear, setFormYear] = useState<number>(currentYear);
  const [formTanggalTerbit, setFormTanggalTerbit] = useState<string>(new Date().toISOString().split('T')[0]);

  // Form Earnings
  const [formGajiPokok, setFormGajiPokok] = useState<number>(1200000);
  const [formTunjanganJabatan, setFormTunjanganJabatan] = useState<number>(0);
  const [formTunjanganWaliKelas, setFormTunjanganWaliKelas] = useState<number>(200000);
  const [formTunjanganTransport, setFormTunjanganTransport] = useState<number>(150000);
  const [formTunjanganMakan, setFormTunjanganMakan] = useState<number>(150000);
  const [formTunjanganKehadiran, setFormTunjanganKehadiran] = useState<number>(100000);
  const [formInsentifBonus, setFormInsentifBonus] = useState<number>(0);
  const [formCustomTunjangan, setFormCustomTunjangan] = useState<SalaryItem[]>([]);

  // Form Deductions
  const [formPotonganBpjs, setFormPotonganBpjs] = useState<number>(0);
  const [formPotonganKoperasi, setFormPotonganKoperasi] = useState<number>(25000);
  const [formPotonganAbsen, setFormPotonganAbsen] = useState<number>(0);
  const [formPotonganPinjaman, setFormPotonganPinjaman] = useState<number>(0);
  const [formCustomPotongan, setFormCustomPotongan] = useState<SalaryItem[]>([]);

  // Metadata
  const [formStatus, setFormStatus] = useState<'Draft' | 'Diterbitkan' | 'Dibayarkan'>('Diterbitkan');
  const [formMetodePembayaran, setFormMetodePembayaran] = useState<string>('Transfer Bank');
  const [formNomorRekening, setFormNomorRekening] = useState<string>('');
  const [formCatatan, setFormCatatan] = useState<string>('');

  // Active Teachers list
  const activeTeachers = useMemo(() => {
    return allUsers.filter(u => {
      const isTeacher = u.role === 'guru' || u.role === 'teacher' || u.role === 'staff';
      const isActive = (u.status || 'Aktif').toString().toLowerCase() === 'aktif';
      return isTeacher && isActive;
    });
  }, [allUsers]);

  // Calculations for current Form
  const calculatedTotalPenerimaan = useMemo(() => {
    const customSum = formCustomTunjangan.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
    return (
      (Number(formGajiPokok) || 0) +
      (Number(formTunjanganJabatan) || 0) +
      (Number(formTunjanganWaliKelas) || 0) +
      (Number(formTunjanganTransport) || 0) +
      (Number(formTunjanganMakan) || 0) +
      (Number(formTunjanganKehadiran) || 0) +
      (Number(formInsentifBonus) || 0) +
      customSum
    );
  }, [
    formGajiPokok, formTunjanganJabatan, formTunjanganWaliKelas,
    formTunjanganTransport, formTunjanganMakan, formTunjanganKehadiran,
    formInsentifBonus, formCustomTunjangan
  ]);

  const calculatedTotalPotongan = useMemo(() => {
    const customSum = formCustomPotongan.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
    return (
      (Number(formPotonganBpjs) || 0) +
      (Number(formPotonganKoperasi) || 0) +
      (Number(formPotonganAbsen) || 0) +
      (Number(formPotonganPinjaman) || 0) +
      customSum
    );
  }, [
    formPotonganBpjs, formPotonganKoperasi, formPotonganAbsen,
    formPotonganPinjaman, formCustomPotongan
  ]);

  const calculatedGajiBersih = useMemo(() => {
    return Math.max(0, calculatedTotalPenerimaan - calculatedTotalPotongan);
  }, [calculatedTotalPenerimaan, calculatedTotalPotongan]);

  // Filtered salary slips
  const filteredSlips = useMemo(() => {
    return salarySlips.filter(slip => {
      // Month match
      const matchMonth = filterMonth === 'Semua' || slip.bulan === filterMonth;
      // Year match
      const matchYear = filterYear === 0 || slip.tahun === Number(filterYear);
      // Status match
      const matchStatus = filterStatus === 'Semua' || slip.status === filterStatus;
      // Teacher match
      const matchTeacher = filterTeacher === 'Semua' || slip.teacherId === filterTeacher || slip.teacherName === filterTeacher;
      // Search match
      const matchSearch = !searchTerm || 
        slip.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (slip.qrVerificationCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (slip.assignedClass || '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchMonth && matchYear && matchStatus && matchTeacher && matchSearch;
    });
  }, [salarySlips, filterMonth, filterYear, filterStatus, filterTeacher, searchTerm]);

  // Aggregate Stats for selected month/year
  const stats = useMemo(() => {
    const totalGajiBersih = filteredSlips.reduce((acc, s) => acc + (Number(s.gajiBersih) || 0), 0);
    const totalPenerimaan = filteredSlips.reduce((acc, s) => acc + (Number(s.totalPenerimaan) || 0), 0);
    const totalPotongan = filteredSlips.reduce((acc, s) => acc + (Number(s.totalPotongan) || 0), 0);
    const countDibayarkan = filteredSlips.filter(s => s.status === 'Dibayarkan').length;
    const countDiterbitkan = filteredSlips.filter(s => s.status === 'Diterbitkan').length;
    const countDraft = filteredSlips.filter(s => s.status === 'Draft').length;

    return {
      totalGajiBersih,
      totalPenerimaan,
      totalPotongan,
      countDibayarkan,
      countDiterbitkan,
      countDraft,
      totalSlips: filteredSlips.length
    };
  }, [filteredSlips]);

  // Reset & Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingSlipId(null);
    if (activeTeachers.length > 0) {
      const firstTeacher = activeTeachers[0];
      setFormTeacherId(firstTeacher.id);
      setFormTeacherName(firstTeacher.name);
      setFormTeacherEmail(firstTeacher.email || '');
      setFormTeacherNip(firstTeacher.nip || '');
      setFormTeacherJabatan(firstTeacher.jabatan || (firstTeacher.assignedClass ? `Wali Kelas ${firstTeacher.assignedClass}` : 'Guru Pengajar'));
      setFormAssignedClass(firstTeacher.assignedClass || firstTeacher.kelas || 'UTSMAN BIN AFFAN');
    } else {
      setFormTeacherId('');
      setFormTeacherName('');
      setFormTeacherEmail('');
      setFormTeacherNip('');
      setFormTeacherJabatan('Guru Pengajar');
      setFormAssignedClass('UTSMAN BIN AFFAN');
    }

    setFormMonth(filterMonth !== 'Semua' ? filterMonth : currentMonthName);
    setFormYear(filterYear !== 0 ? filterYear : currentYear);
    setFormTanggalTerbit(new Date().toISOString().split('T')[0]);
    setFormGajiPokok(1200000);
    setFormTunjanganJabatan(0);
    setFormTunjanganWaliKelas(200000);
    setFormTunjanganTransport(150000);
    setFormTunjanganMakan(150000);
    setFormTunjanganKehadiran(100000);
    setFormInsentifBonus(0);
    setFormCustomTunjangan([]);
    setFormPotonganBpjs(0);
    setFormPotonganKoperasi(25000);
    setFormPotonganAbsen(0);
    setFormPotonganPinjaman(0);
    setFormCustomPotongan([]);
    setFormStatus('Diterbitkan');
    setFormMetodePembayaran('Transfer Bank');
    setFormNomorRekening('');
    setFormCatatan('');
    setShowInputModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (slip: SalarySlipData) => {
    setEditingSlipId(slip.id || null);
    setFormTeacherId(slip.teacherId);
    setFormTeacherName(slip.teacherName);
    setFormTeacherEmail(slip.teacherEmail);
    setFormTeacherNip(slip.teacherNip || '');
    setFormTeacherJabatan(slip.teacherJabatan || 'Guru Pengajar');
    setFormAssignedClass(slip.assignedClass || 'UTSMAN BIN AFFAN');
    setFormMonth(slip.bulan);
    setFormYear(slip.tahun);
    setFormTanggalTerbit(slip.tanggalTerbit || new Date().toISOString().split('T')[0]);
    setFormGajiPokok(slip.gajiPokok || 0);
    setFormTunjanganJabatan(slip.tunjanganJabatan || 0);
    setFormTunjanganWaliKelas(slip.tunjanganWaliKelas || 0);
    setFormTunjanganTransport(slip.tunjanganTransport || 0);
    setFormTunjanganMakan(slip.tunjanganMakan || 0);
    setFormTunjanganKehadiran(slip.tunjanganKehadiran || 0);
    setFormInsentifBonus(slip.insentifBonus || 0);
    setFormCustomTunjangan(slip.rincianTunjanganLain || []);
    setFormPotonganBpjs(slip.potonganBpjs || 0);
    setFormPotonganKoperasi(slip.potonganKoperasi || 0);
    setFormPotonganAbsen(slip.potonganAbsen || 0);
    setFormPotonganPinjaman(slip.potonganPinjaman || 0);
    setFormCustomPotongan(slip.rincianPotonganLain || []);
    setFormStatus(slip.status || 'Diterbitkan');
    setFormMetodePembayaran(slip.metodePembayaran || 'Transfer Bank');
    setFormNomorRekening(slip.nomorRekening || '');
    setFormCatatan(slip.catatan || '');
    setShowInputModal(true);
  };

  // On Teacher Selected in Dropdown
  const handleTeacherSelect = (teacherId: string) => {
    setFormTeacherId(teacherId);
    const teacher = activeTeachers.find(t => t.id === teacherId);
    if (teacher) {
      setFormTeacherName(teacher.name);
      setFormTeacherEmail(teacher.email || '');
      setFormTeacherNip(teacher.nip || '');
      setFormTeacherJabatan(teacher.jabatan || (teacher.assignedClass ? `Wali Kelas ${teacher.assignedClass}` : 'Guru Pengajar'));
      setFormAssignedClass(teacher.assignedClass || teacher.kelas || 'UTSMAN BIN AFFAN');
    }
  };

  // Save Single Salary Slip
  const handleSaveSalarySlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTeacherId || !formTeacherName) {
      alert('Pilih Guru penerima slip gaji.');
      return;
    }

    try {
      setLoadingAction(true);
      const verificationCode = editingSlipId 
        ? (salarySlips.find(s => s.id === editingSlipId)?.qrVerificationCode || generateVerificationCode(formTeacherName, formMonth, formYear))
        : generateVerificationCode(formTeacherName, formMonth, formYear);

      const kepsekName = settings?.headmasterName || DEFAULT_KEPSEK.nama;
      const kepsekNip = settings?.headmasterNip || DEFAULT_KEPSEK.nip;

      const payload: Partial<SalarySlipData> = {
        teacherId: formTeacherId,
        teacherName: formTeacherName,
        teacherEmail: formTeacherEmail,
        teacherNip: formTeacherNip,
        teacherJabatan: formTeacherJabatan,
        assignedClass: formAssignedClass,
        bulan: formMonth,
        tahun: Number(formYear),
        periode: `${formMonth} ${formYear}`,
        tanggalTerbit: formTanggalTerbit,
        gajiPokok: Number(formGajiPokok) || 0,
        tunjanganJabatan: Number(formTunjanganJabatan) || 0,
        tunjanganWaliKelas: Number(formTunjanganWaliKelas) || 0,
        tunjanganTransport: Number(formTunjanganTransport) || 0,
        tunjanganMakan: Number(formTunjanganMakan) || 0,
        tunjanganKehadiran: Number(formTunjanganKehadiran) || 0,
        insentifBonus: Number(formInsentifBonus) || 0,
        rincianTunjanganLain: formCustomTunjangan,
        totalPenerimaan: calculatedTotalPenerimaan,
        potonganBpjs: Number(formPotonganBpjs) || 0,
        potonganKoperasi: Number(formPotonganKoperasi) || 0,
        potonganAbsen: Number(formPotonganAbsen) || 0,
        potonganPinjaman: Number(formPotonganPinjaman) || 0,
        rincianPotonganLain: formCustomPotongan,
        totalPotongan: calculatedTotalPotongan,
        gajiBersih: calculatedGajiBersih,
        status: formStatus,
        metodePembayaran: formMetodePembayaran,
        nomorRekening: formNomorRekening,
        catatan: formCatatan,
        namaKepsek: kepsekName,
        nipKepsek: kepsekNip,
        qrVerificationCode: verificationCode,
        updatedAt: serverTimestamp()
      };

      if (editingSlipId) {
        await updateDoc(doc(db, 'salary_slips', editingSlipId), payload);
        alert('Slip gaji berhasil diperbarui!');
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'salary_slips'), payload);
        alert('Slip gaji berhasil dibuat dan disimpan!');
      }

      setShowInputModal(false);
    } catch (err: any) {
      console.error('Error saving salary slip:', err);
      handleFirestoreError(err, OperationType.WRITE, 'salary_slips');
      alert('Gagal menyimpan slip gaji. Silakan coba lagi.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Quick Status Toggle (Draft -> Diterbitkan -> Dibayarkan)
  const handleQuickStatusChange = async (slip: SalarySlipData, newStatus: 'Draft' | 'Diterbitkan' | 'Dibayarkan') => {
    if (!slip.id) return;
    try {
      await updateDoc(doc(db, 'salary_slips', slip.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Gagal memperbarui status slip gaji.');
    }
  };

  // Delete Salary Slip
  const handleDeleteSlip = async (slip: SalarySlipData) => {
    if (!slip.id) return;
    if (!window.confirm(`Hapus slip gaji ${slip.teacherName} periode ${slip.bulan} ${slip.tahun}?`)) return;

    try {
      await deleteDoc(doc(db, 'salary_slips', slip.id));
      alert('Slip gaji berhasil dihapus.');
    } catch (err) {
      console.error('Error deleting slip:', err);
      alert('Gagal menghapus slip gaji.');
    }
  };

  // Batch Generation for All Teachers
  const handleBatchGenerate = async () => {
    if (activeTeachers.length === 0) {
      alert('Tidak ada guru aktif yang ditemukan.');
      return;
    }

    const confirmMsg = `Generate slip gaji otomatis untuk ${activeTeachers.length} guru aktif pada periode ${filterMonth} ${filterYear}?\n\nSlip yang sudah ada untuk periode ini tidak akan diduplikasi.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setLoadingAction(true);
      const kepsekName = settings?.headmasterName || DEFAULT_KEPSEK.nama;
      const kepsekNip = settings?.headmasterNip || DEFAULT_KEPSEK.nip;
      const todayStr = new Date().toISOString().split('T')[0];

      let createdCount = 0;
      let skippedCount = 0;

      for (const teacher of activeTeachers) {
        // Check if slip already exists for this teacher in this month/year
        const existing = salarySlips.find(
          s => s.teacherId === teacher.id && s.bulan === filterMonth && s.tahun === Number(filterYear)
        );

        if (existing) {
          skippedCount++;
          continue;
        }

        const isWaliKelas = Boolean(teacher.assignedClass || teacher.kelas);
        const waliKelasBonus = isWaliKelas ? batchTunjanganWaliKelas : 0;

        const totPenerimaan = batchBaseSalary + waliKelasBonus + batchTunjanganTransport + batchTunjanganMakan + batchTunjanganKehadiran;
        const totPotongan = 25000; // Koperasi standard
        const netSalary = Math.max(0, totPenerimaan - totPotongan);
        const verificationCode = generateVerificationCode(teacher.name, filterMonth, Number(filterYear));

        const newSlipPayload: Partial<SalarySlipData> = {
          teacherId: teacher.id,
          teacherName: teacher.name,
          teacherEmail: teacher.email || '',
          teacherNip: teacher.nip || '',
          teacherJabatan: teacher.jabatan || (isWaliKelas ? `Wali Kelas ${teacher.assignedClass || teacher.kelas}` : 'Guru Pengajar'),
          assignedClass: teacher.assignedClass || teacher.kelas || 'UTSMAN BIN AFFAN',
          bulan: filterMonth,
          tahun: Number(filterYear),
          periode: `${filterMonth} ${filterYear}`,
          tanggalTerbit: todayStr,
          gajiPokok: batchBaseSalary,
          tunjanganJabatan: 0,
          tunjanganWaliKelas: waliKelasBonus,
          tunjanganTransport: batchTunjanganTransport,
          tunjanganMakan: batchTunjanganMakan,
          tunjanganKehadiran: batchTunjanganKehadiran,
          insentifBonus: 0,
          rincianTunjanganLain: [],
          totalPenerimaan: totPenerimaan,
          potonganBpjs: 0,
          potonganKoperasi: 25000,
          potonganAbsen: 0,
          potonganPinjaman: 0,
          rincianPotonganLain: [],
          totalPotongan: totPotongan,
          gajiBersih: netSalary,
          status: 'Diterbitkan',
          metodePembayaran: 'Transfer Bank',
          nomorRekening: teacher.bankAccount || '',
          catatan: 'Diterbitkan otomatis oleh sistem payroll madrasah.',
          namaKepsek: kepsekName,
          nipKepsek: kepsekNip,
          qrVerificationCode: verificationCode,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await addDoc(collection(db, 'salary_slips'), newSlipPayload);
        createdCount++;
      }

      alert(`Selesai! Berhasil membuat ${createdCount} slip gaji baru.\n(${skippedCount} guru dilewati karena sudah memiliki slip periode ini).`);
      setShowBatchModal(false);
    } catch (err: any) {
      console.error('Error generating batch salary:', err);
      alert('Terjadi kesalahan saat generate masal slip gaji.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredSlips.length === 0) {
      alert('Tidak ada data slip gaji untuk diekspor pada filter terpilih.');
      return;
    }

    const rows = filteredSlips.map((s, idx) => ({
      'No': idx + 1,
      'No. Slip / Dokumen': s.qrVerificationCode || '-',
      'Nama Guru': s.teacherName,
      'NIP': s.teacherNip || '-',
      'Jabatan': s.teacherJabatan || '-',
      'Penugasan Kelas': s.assignedClass || '-',
      'Bulan': s.bulan,
      'Tahun': s.tahun,
      'Gaji Pokok (Rp)': s.gajiPokok,
      'Tunj. Jabatan (Rp)': s.tunjanganJabatan,
      'Tunj. Wali Kelas (Rp)': s.tunjanganWaliKelas,
      'Tunj. Transport (Rp)': s.tunjanganTransport,
      'Tunj. Makan (Rp)': s.tunjanganMakan,
      'Tunj. Kehadiran (Rp)': s.tunjanganKehadiran,
      'Insentif / Bonus (Rp)': s.insentifBonus,
      'Total Penerimaan (Rp)': s.totalPenerimaan,
      'Pot. BPJS (Rp)': s.potonganBpjs,
      'Pot. Koperasi (Rp)': s.potonganKoperasi,
      'Pot. Absensi (Rp)': s.potonganAbsen,
      'Pot. Pinjaman (Rp)': s.potonganPinjaman,
      'Total Potongan (Rp)': s.totalPotongan,
      'GAJI BERSIH (Rp)': s.gajiBersih,
      'Terbilang': terbilang(s.gajiBersih),
      'Status': s.status,
      'Metode Bayar': s.metodePembayaran || 'Transfer Bank',
      'Tanggal Terbit': s.tanggalTerbit || '-',
      'Kepala Sekolah': s.namaKepsek || DEFAULT_KEPSEK.nama
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Slip_Gaji');
    XLSX.writeFile(wb, `Rekap_Slip_Gaji_RA_Darusyifa_${filterMonth}_${filterYear}.xlsx`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Quick Action Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-emerald-200 text-xs font-bold mb-3 border border-white/15">
              <ShieldCheck size={14} className="text-emerald-300" /> Modul Penggajian & TTD Barcode Kepsek
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Manajemen Slip Gaji Guru & Karyawan
            </h2>
            <p className="text-sm text-emerald-100/80 font-medium mt-1 max-w-2xl">
              Input otomatis rincian gaji, tunjangan, potongan, pengesahan digital QR barcode Kepala Sekolah, serta hak akses cetak mandiri untuk setiap guru.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setShowBatchModal(true)}
              className="px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-2xl font-black text-xs transition-all flex items-center gap-2 shadow-lg active:scale-95"
            >
              <Sparkles size={16} /> Generate Otomatis Masal
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-3 bg-white hover:bg-emerald-50 text-emerald-900 rounded-2xl font-black text-xs transition-all flex items-center gap-2 shadow-lg active:scale-95"
            >
              <Plus size={16} /> Input Slip Gaji Baru
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs transition-all flex items-center gap-2 border border-white/20"
            >
              <FileSpreadsheet size={16} /> Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Gaji Bersih</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Wallet size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            {formatRupiah(stats.totalGajiBersih)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-700">
            <span>{stats.totalSlips} Guru</span> &bull; <span>Periode {filterMonth} {filterYear}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Penerimaan</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-teal-700 mt-2 tracking-tight">
            {formatRupiah(stats.totalPenerimaan)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-2">Gaji pokok + Seluruh tunjangan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Potongan</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2 tracking-tight">
            {formatRupiah(stats.totalPotongan)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-2">BPJS, Koperasi, Absensi, Pinjaman</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Penyaluran</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-black text-xs rounded-lg border border-emerald-200">
              {stats.countDibayarkan} Lunas
            </span>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-black text-xs rounded-lg border border-blue-200">
              {stats.countDiterbitkan} Terbit
            </span>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-black text-xs rounded-lg border border-slate-200">
              {stats.countDraft} Draf
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-2">Status real-time slip guru</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama guru, NIP, no slip, atau kelas..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Month Selector */}
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Semua">Semua Bulan</option>
            {MONTH_NAMES.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Semua">Semua Status</option>
            <option value="Diterbitkan">Diterbitkan</option>
            <option value="Dibayarkan">Dibayarkan</option>
            <option value="Draft">Draft</option>
          </select>

          {/* Teacher Filter */}
          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 max-w-[160px]"
          >
            <option value="Semua">Semua Guru</option>
            {activeTeachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Salary Slips Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Daftar Slip Gaji ({filteredSlips.length} Data)
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Daftar rincian gaji guru dan status pengesahan barcode
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Periode: {filterMonth} {filterYear}
          </span>
        </div>

        {filteredSlips.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Wallet size={28} />
            </div>
            <h4 className="text-base font-bold text-slate-800">Belum Ada Slip Gaji</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Belum ada data slip gaji untuk periode {filterMonth} {filterYear}. Klik tombol di bawah untuk membuat slip gaji manual atau generate masal otomatis.
            </p>
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={() => setShowBatchModal(true)}
                className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md"
              >
                Generate Masal Otomatis
              </button>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Input Slip Manual
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">No</th>
                  <th className="py-3.5 px-4">Guru / Pegawai</th>
                  <th className="py-3.5 px-4">Periode</th>
                  <th className="py-3.5 px-4 text-right">Penerimaan</th>
                  <th className="py-3.5 px-4 text-right">Potongan</th>
                  <th className="py-3.5 px-4 text-right">Gaji Bersih</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSlips.map((slip, idx) => (
                  <tr key={slip.id || idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-900 block">{slip.teacherName}</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {slip.teacherJabatan || 'Guru'} &bull; {slip.assignedClass || 'Semua Kelas'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {slip.bulan} {slip.tahun}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                      {formatRupiah(slip.totalPenerimaan)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                      {slip.totalPotongan > 0 ? `-${formatRupiah(slip.totalPotongan)}` : 'Rp 0'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-black text-sm text-slate-900">
                        {formatRupiah(slip.gajiBersih)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <select
                          value={slip.status}
                          onChange={(e) => handleQuickStatusChange(slip, e.target.value as any)}
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border outline-none cursor-pointer ${
                            slip.status === 'Dibayarkan' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : slip.status === 'Diterbitkan'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Diterbitkan">Diterbitkan</option>
                          <option value="Dibayarkan">Dibayarkan</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedSlipForView(slip)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Lihat / Cetak Slip Gaji"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(slip)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Rincian Slip Gaji"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteSlip(slip)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Slip Gaji"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =============================================================== */}
      {/* MODAL: INPUT / EDIT SLIP GAJI */}
      {/* =============================================================== */}
      {showInputModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[200] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-emerald-800 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {editingSlipId ? 'Edit Slip Gaji Guru' : 'Input Slip Gaji Guru Baru'}
                </h3>
                <p className="text-xs text-emerald-100 font-medium">
                  Isi rincian penghasilan dan potongan guru
                </p>
              </div>
              <button
                onClick={() => setShowInputModal(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSalarySlip} className="p-6 max-h-[75vh] overflow-y-auto space-y-5 text-slate-800">
              {/* Teacher & Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Pilih Guru / Pegawai *
                  </label>
                  <select
                    value={formTeacherId}
                    onChange={(e) => handleTeacherSelect(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Pilih Guru --</option>
                    {activeTeachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.assignedClass || t.kelas || 'Guru'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Jabatan / Tugas
                  </label>
                  <input
                    type="text"
                    value={formTeacherJabatan}
                    onChange={(e) => setFormTeacherJabatan(e.target.value)}
                    placeholder="Contoh: Wali Kelas UTSMAN BIN AFFAN"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Bulan & Tahun Penggajian *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={formMonth}
                      onChange={(e) => setFormMonth(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {MONTH_NAMES.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={formYear}
                      onChange={(e) => setFormYear(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Tanggal Terbit / Slip *
                  </label>
                  <input
                    type="date"
                    value={formTanggalTerbit}
                    onChange={(e) => setFormTanggalTerbit(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* SECTION: PENERIMAAN / EARNINGS */}
              <div className="border border-emerald-100 bg-emerald-50/40 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-emerald-100 pb-2">
                  <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Rincian Penerimaan (Penghasilan)
                  </h4>
                  <span className="text-xs font-black text-emerald-700">
                    Total: {formatRupiah(calculatedTotalPenerimaan)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">Gaji Pokok (Rp)</label>
                    <input
                      type="number"
                      value={formGajiPokok}
                      onChange={(e) => setFormGajiPokok(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">Tunjangan Wali Kelas (Rp)</label>
                    <input
                      type="number"
                      value={formTunjanganWaliKelas}
                      onChange={(e) => setFormTunjanganWaliKelas(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">Tunjangan Transport (Rp)</label>
                    <input
                      type="number"
                      value={formTunjanganTransport}
                      onChange={(e) => setFormTunjanganTransport(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">Tunjangan Uang Makan (Rp)</label>
                    <input
                      type="number"
                      value={formTunjanganMakan}
                      onChange={(e) => setFormTunjanganMakan(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">Tunjangan Kehadiran (Rp)</label>
                    <input
                      type="number"
                      value={formTunjanganKehadiran}
                      onChange={(e) => setFormTunjanganKehadiran(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">Insentif / Bonus (Rp)</label>
                    <input
                      type="number"
                      value={formInsentifBonus}
                      onChange={(e) => setFormInsentifBonus(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Custom Tunjangan Items */}
                {formCustomTunjangan.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Nama Tunjangan Lain"
                      value={item.nama}
                      onChange={(e) => {
                        const updated = [...formCustomTunjangan];
                        updated[idx].nama = e.target.value;
                        setFormCustomTunjangan(updated);
                      }}
                      className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                    <input
                      type="number"
                      placeholder="Nominal (Rp)"
                      value={item.nominal}
                      onChange={(e) => {
                        const updated = [...formCustomTunjangan];
                        updated[idx].nominal = Number(e.target.value);
                        setFormCustomTunjangan(updated);
                      }}
                      className="w-32 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setFormCustomTunjangan(formCustomTunjangan.filter((_, i) => i !== idx))}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setFormCustomTunjangan([...formCustomTunjangan, { nama: '', nominal: 0 }])}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 pt-1"
                >
                  <Plus size={14} /> Tambah Tunjangan Kustom
                </button>
              </div>

              {/* SECTION: POTONGAN / DEDUCTIONS */}
              <div className="border border-rose-100 bg-rose-50/40 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-rose-100 pb-2">
                  <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Rincian Potongan
                  </h4>
                  <span className="text-xs font-black text-rose-700">
                    Total: {formatRupiah(calculatedTotalPotongan)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">BPJS / Kesehatan (Rp)</label>
                    <input
                      type="number"
                      value={formPotonganBpjs}
                      onChange={(e) => setFormPotonganBpjs(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">Koperasi / Kas Guru (Rp)</label>
                    <input
                      type="number"
                      value={formPotonganKoperasi}
                      onChange={(e) => setFormPotonganKoperasi(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">Potongan Absensi / Izin (Rp)</label>
                    <input
                      type="number"
                      value={formPotonganAbsen}
                      onChange={(e) => setFormPotonganAbsen(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">Cicilan / Pinjaman (Rp)</label>
                    <input
                      type="number"
                      value={formPotonganPinjaman}
                      onChange={(e) => setFormPotonganPinjaman(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Custom Potongan Items */}
                {formCustomPotongan.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Nama Potongan Lain"
                      value={item.nama}
                      onChange={(e) => {
                        const updated = [...formCustomPotongan];
                        updated[idx].nama = e.target.value;
                        setFormCustomPotongan(updated);
                      }}
                      className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                    <input
                      type="number"
                      placeholder="Nominal (Rp)"
                      value={item.nominal}
                      onChange={(e) => {
                        const updated = [...formCustomPotongan];
                        updated[idx].nominal = Number(e.target.value);
                        setFormCustomPotongan(updated);
                      }}
                      className="w-32 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-rose-700"
                    />
                    <button
                      type="button"
                      onClick={() => setFormCustomPotongan(formCustomPotongan.filter((_, i) => i !== idx))}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setFormCustomPotongan([...formCustomPotongan, { nama: '', nominal: 0 }])}
                  className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1 pt-1"
                >
                  <Plus size={14} /> Tambah Potongan Kustom
                </button>
              </div>

              {/* SECTION: SUMMARY & TAKE HOME PAY */}
              <div className="bg-emerald-900 text-white rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Gaji Bersih Diterima</span>
                  <p className="text-xs text-emerald-100/90 font-medium italic mt-0.5">{terbilang(calculatedGajiBersih)}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-300 tracking-tight">
                    {formatRupiah(calculatedGajiBersih)}
                  </span>
                </div>
              </div>

              {/* Status & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Status Slip Gaji</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Draft">Draft (Belum Diterbitkan)</option>
                    <option value="Diterbitkan">Diterbitkan (Bisa Dilihat & Dicetak Guru)</option>
                    <option value="Dibayarkan">Dibayarkan (Lunas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Metode Pembayaran</label>
                  <select
                    value={formMetodePembayaran}
                    onChange={(e) => setFormMetodePembayaran(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Tunai / Kas Sekolah">Tunai / Kas Sekolah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  placeholder="Catatan pada slip gaji..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInputModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                >
                  {loadingAction ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                  {editingSlipId ? 'Simpan Perubahan Slip' : 'Terbitkan Slip Gaji'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL: BATCH GENERATE MASAL SLIP GAJI */}
      {/* =============================================================== */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[200] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <Sparkles size={20} className="text-emerald-300" /> Generate Otomatis Masal
                </h3>
                <p className="text-xs text-emerald-100 font-medium">
                  Periode: {filterMonth} {filterYear} &bull; {activeTeachers.length} Guru Aktif
                </p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <p className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900 font-medium">
                Sistem akan secara otomatis membuat slip gaji standar untuk seluruh guru aktif pada bulan <strong>{filterMonth} {filterYear}</strong> beserta barcode tanda tangan digital Kepala Sekolah.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Gaji Pokok Standar (Rp)</label>
                  <input
                    type="number"
                    value={batchBaseSalary}
                    onChange={(e) => setBatchBaseSalary(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tunjangan Wali Kelas (Rp)</label>
                  <input
                    type="number"
                    value={batchTunjanganWaliKelas}
                    onChange={(e) => setBatchTunjanganWaliKelas(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Transport</label>
                    <input
                      type="number"
                      value={batchTunjanganTransport}
                      onChange={(e) => setBatchTunjanganTransport(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Uang Makan</label>
                    <input
                      type="number"
                      value={batchTunjanganMakan}
                      onChange={(e) => setBatchTunjanganMakan(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Kehadiran</label>
                    <input
                      type="number"
                      value={batchTunjanganKehadiran}
                      onChange={(e) => setBatchTunjanganKehadiran(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={handleBatchGenerate}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                >
                  {loadingAction ? <RefreshCw className="animate-spin" size={15} /> : <Sparkles size={15} />}
                  Mulai Generate ({activeTeachers.length} Guru)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salary Slip Detail & Print Modal */}
      {selectedSlipForView && (
        <SalarySlipModal
          slip={selectedSlipForView}
          onClose={() => setSelectedSlipForView(null)}
          schoolSettings={settings}
        />
      )}

    </div>
  );
}
