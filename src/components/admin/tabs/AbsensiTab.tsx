import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp
} from 'firebase/firestore';
import { 
  Download, 
  Plus, 
  Search, 
  Users, 
  AlertCircle, 
  Camera, 
  MapPin, 
  MoreVertical, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Trash2, 
  Edit3, 
  X, 
  Smartphone, 
  Monitor, 
  RotateCcw,
  Radio,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import * as XLSX from 'xlsx';

interface AbsensiTabProps {
  attendance: any[];
  allUsers: any[];
  schoolClasses: any[];
  exportAttendanceToExcel?: () => void;
  setSelectedPhoto?: (photo: string | null) => void;
  setSelectedLocation?: (loc: { lat: number; lng: number } | null) => void;
}

export default function AbsensiTab({
  attendance,
  allUsers,
  schoolClasses,
  exportAttendanceToExcel
}: AbsensiTabProps) {
  // Filters State
  const [filterKelas, setFilterKelas] = useState('');
  const [filterRole, setFilterRole] = useState<'semua' | 'siswa' | 'guru'>('siswa');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDatePreset, setFilterDatePreset] = useState<'today' | '7days' | 'month' | 'custom' | 'all'>('today');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'hadir' | 'sakit' | 'izin' | 'alpha'>('all');

  // Bulk Selection
  const [selectedAttendanceIds, setSelectedAttendanceIds] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modals & Preview States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<any | null>(null);
  const [showOnlineUsersModal, setShowOnlineUsersModal] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [previewLocation, setPreviewLocation] = useState<{ lat: number; lng: number; name?: string } | null>(null);

  // Form State for Adding Attendance
  const [newAttTargetId, setNewAttTargetId] = useState('');
  const [newAttDate, setNewAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAttStatus, setNewAttStatus] = useState<'hadir' | 'sakit' | 'izin' | 'alpha'>('hadir');
  const [newAttNote, setNewAttNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Online / Active Users helper
  const isUserOnline = (u: any) => {
    if (!u) return false;
    if (u.isOnline === true) return true;
    const now = Date.now();
    let lastActive = 0;
    if (typeof u.lastActiveTimestamp === 'number') {
      lastActive = u.lastActiveTimestamp;
    } else if (u.lastActiveTimestamp?.seconds) {
      lastActive = u.lastActiveTimestamp.seconds * 1000;
    } else if (u.lastActiveAt) {
      lastActive = new Date(u.lastActiveAt).getTime();
    }
    if (lastActive > 0 && Math.abs(now - lastActive) < 15 * 60 * 1000) {
      return true;
    }
    return false;
  };

  // List of currently online students and teachers
  const onlineUsers = useMemo(() => {
    return allUsers.filter(u => isUserOnline(u));
  }, [allUsers]);

  const onlineStudents = useMemo(() => {
    return onlineUsers.filter(u => (u.role || 'siswa') === 'siswa');
  }, [onlineUsers]);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Set default dates on preset change
  useEffect(() => {
    const today = new Date();
    if (filterDatePreset === 'today') {
      const dStr = today.toISOString().split('T')[0];
      setFilterDateStart(dStr);
      setFilterDateEnd(dStr);
    } else if (filterDatePreset === '7days') {
      const start = new Date();
      start.setDate(today.getDate() - 6);
      setFilterDateStart(start.toISOString().split('T')[0]);
      setFilterDateEnd(today.toISOString().split('T')[0]);
    } else if (filterDatePreset === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setFilterDateStart(start.toISOString().split('T')[0]);
      setFilterDateEnd(today.toISOString().split('T')[0]);
    } else if (filterDatePreset === 'all') {
      setFilterDateStart('');
      setFilterDateEnd('');
    }
  }, [filterDatePreset]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setOpenDropdownId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Filtered attendance list
  const filteredAttendance = useMemo(() => {
    return attendance.filter(a => {
      const student = allUsers.find(u => u.id === a.studentId || u.uid === a.studentId);
      
      // Role filter
      if (filterRole !== 'semua') {
        const userRole = student?.role || 'siswa';
        if (userRole !== filterRole) return false;
      }

      // Class filter
      if (filterKelas) {
        const userClass = student?.kelas || student?.assignedClass || a.kelas || '';
        if (!userClass.toLowerCase().includes(filterKelas.toLowerCase())) return false;
      }

      // Search filter
      if (filterSearch) {
        const name = (student?.name || a.studentName || '').toLowerCase();
        const nisn = (student?.nisn || '').toLowerCase();
        const s = filterSearch.toLowerCase();
        if (!name.includes(s) && !nisn.includes(s)) return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'all') {
        const st = (a.status || '').toLowerCase();
        if (selectedStatusFilter === 'alpha') {
          if (st !== 'alpha' && st !== 'tk') return false;
        } else {
          if (st !== selectedStatusFilter) return false;
        }
      }

      // Date range filter (From DateStart to DateEnd)
      if (filterDateStart && a.date < filterDateStart) return false;
      if (filterDateEnd && a.date > filterDateEnd) return false;

      return true;
    });
  }, [attendance, allUsers, filterRole, filterKelas, filterSearch, selectedStatusFilter, filterDateStart, filterDateEnd]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedAttendanceIds([]);
  }, [filterKelas, filterRole, filterSearch, filterDatePreset, filterDateStart, filterDateEnd, selectedStatusFilter]);

  // Summary Metrics calculation
  const metrics = useMemo(() => {
    const total = filteredAttendance.length;
    const hadir = filteredAttendance.filter(a => (a.status || '').toLowerCase() === 'hadir').length;
    const sakit = filteredAttendance.filter(a => (a.status || '').toLowerCase() === 'sakit').length;
    const izin = filteredAttendance.filter(a => (a.status || '').toLowerCase() === 'izin').length;
    const alpha = filteredAttendance.filter(a => {
      const s = (a.status || '').toLowerCase();
      return s === 'alpha' || s === 'tk';
    }).length;

    const hadirPct = total > 0 ? ((hadir / total) * 100).toFixed(1).replace('.', ',') : '0,0';
    const sakitPct = total > 0 ? ((sakit / total) * 100).toFixed(1).replace('.', ',') : '0,0';
    const izinPct = total > 0 ? ((izin / total) * 100).toFixed(1).replace('.', ',') : '0,0';
    const alphaPct = total > 0 ? ((alpha / total) * 100).toFixed(1).replace('.', ',') : '0,0';

    return {
      total,
      hadir,
      sakit,
      izin,
      alpha,
      hadirPct,
      sakitPct,
      izinPct,
      alphaPct
    };
  }, [filteredAttendance]);

  // 7-day weekly trend data
  const weeklyTrendData = useMemo(() => {
    const days: any[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      const dayRecords = attendance.filter(a => a.date === dateStr);
      const hadirCount = dayRecords.filter(a => (a.status || '').toLowerCase() === 'hadir').length;
      
      days.push({
        date: dateStr,
        name: dayLabel,
        hadir: hadirCount,
        total: dayRecords.length
      });
    }
    return days;
  }, [attendance]);

  // Donut Chart Data
  const pieData = useMemo(() => {
    return [
      { name: 'Hadir', value: metrics.hadir || (metrics.total === 0 ? 1 : 0), color: '#16a34a' },
      { name: 'Sakit', value: metrics.sakit, color: '#2563eb' },
      { name: 'Izin', value: metrics.izin, color: '#9333ea' },
      { name: 'Alpha', value: metrics.alpha, color: '#dc2626' },
    ];
  }, [metrics]);

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(filteredAttendance.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredAttendance.length);
  const paginatedAttendance = filteredAttendance.slice(startIndex, endIndex);

  // Helper for Initials
  const getInitials = (name: string) => {
    if (!name) return 'RA';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'hadir') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
          <Check size={11} className="stroke-[3]" />
          HADIR
        </span>
      );
    }
    if (s === 'sakit') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
          SAKIT
        </span>
      );
    }
    if (s === 'izin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
          IZIN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
        ALPHA
      </span>
    );
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedAttendanceIds.length === 0) return;
    if (window.confirm(`Hapus ${selectedAttendanceIds.length} data presensi terpilih?`)) {
      try {
        await Promise.all(selectedAttendanceIds.map(id => deleteDoc(doc(db, 'attendance', id))));
        setSelectedAttendanceIds([]);
      } catch (err) {
        console.error("Error bulk delete attendance:", err);
      }
    }
  };

  // Delete single
  const handleDeleteSingle = async (id: string) => {
    if (window.confirm("Hapus data absensi ini?")) {
      try {
        await deleteDoc(doc(db, 'attendance', id));
      } catch (err) {
        console.error("Error delete attendance:", err);
      }
    }
  };

  // Comprehensive Excel Export with Date Range support
  const handleExcelExport = () => {
    if (exportAttendanceToExcel) {
      exportAttendanceToExcel();
      return;
    }
    const dataToExport = filteredAttendance.map((a, i) => {
      const student = allUsers.find(u => u.id === a.studentId || u.uid === a.studentId);
      
      let timeStr = '-';
      if (a.timestamp) {
        if (typeof a.timestamp === 'string') timeStr = a.timestamp;
        else if (a.timestamp.seconds) timeStr = new Date(a.timestamp.seconds * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        else if (a.timestamp instanceof Date) timeStr = a.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      }

      return {
        'No': i + 1,
        'Tanggal': a.date || '-',
        'Jam': timeStr,
        'Nama Siswa / Guru': student?.name || a.studentName || 'Siswa',
        'NISN': student?.nisn || '-',
        'Kelas': student?.kelas || student?.assignedClass || a.kelas || '-',
        'Role': (student?.role || a.role || 'siswa').toUpperCase(),
        'Status Kehadiran': (a.status || '').toUpperCase(),
        'Keterangan': a.keterangan || '-',
        'Metode Presensi': a.type || 'Mandiri',
        'Foto Terlampir': a.photo ? 'Ada Foto' : 'Tidak Ada',
        'Lokasi GPS': (a.latitude && a.longitude) ? `${a.latitude}, ${a.longitude}` : '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Absensi");
    
    let fileName = "Rekap_Absensi";
    if (filterDateStart && filterDateEnd) {
      if (filterDateStart === filterDateEnd) {
        fileName += `_${filterDateStart}`;
      } else {
        fileName += `_${filterDateStart}_sd_${filterDateEnd}`;
      }
    } else if (filterDateStart) {
      fileName += `_dari_${filterDateStart}`;
    } else if (filterDateEnd) {
      fileName += `_sd_${filterDateEnd}`;
    } else {
      fileName += `_Semua_Periode`;
    }
    if (filterKelas) fileName += `_${filterKelas.replace(/\s+/g, '_')}`;

    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  // Add Attendance Manual Handler
  const handleCreateAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttTargetId) {
      alert("Silakan pilih siswa / pengguna terlebih dahulu");
      return;
    }
    setIsSubmitting(true);
    try {
      const targetUser = allUsers.find(u => u.id === newAttTargetId);
      await addDoc(collection(db, 'attendance'), {
        studentId: newAttTargetId,
        studentName: targetUser?.name || 'Siswa',
        kelas: targetUser?.kelas || targetUser?.assignedClass || 'Umum',
        date: newAttDate,
        status: newAttStatus,
        keterangan: newAttNote,
        timestamp: serverTimestamp(),
        type: 'manual',
        role: targetUser?.role || 'siswa'
      });
      setShowAddModal(false);
      setNewAttNote('');
    } catch (err) {
      console.error("Error adding attendance:", err);
      alert("Gagal menambahkan absensi");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Attendance Status
  const handleUpdateAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttendance) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'attendance', editingAttendance.id), {
        status: editingAttendance.status,
        keterangan: editingAttendance.keterangan || '',
        date: editingAttendance.date
      });
      setShowEditModal(false);
      setEditingAttendance(null);
    } catch (err) {
      console.error("Error updating attendance:", err);
      alert("Gagal memperbarui absensi");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date display (e.g. 18 Agustus 2026)
  const formatDateIndo = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      const d = new Date(dateString);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Dynamic Subheader Title based on date range selection
  const getSubheaderTitle = () => {
    if (filterDateStart && filterDateEnd) {
      if (filterDateStart === filterDateEnd) {
        return filterDateStart === todayStr ? 'Absensi Hari Ini' : `Absensi Tanggal: ${formatDateIndo(filterDateStart)}`;
      }
      return `Rekap Absensi: ${formatDateIndo(filterDateStart)} s/d ${formatDateIndo(filterDateEnd)}`;
    }
    if (filterDateStart && !filterDateEnd) {
      return `Rekap Absensi Mulai: ${formatDateIndo(filterDateStart)}`;
    }
    if (!filterDateStart && filterDateEnd) {
      return `Rekap Absensi Hingga: ${formatDateIndo(filterDateEnd)}`;
    }
    return 'Seluruh Riwayat Absensi';
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300 pb-24 md:pb-8">
      
      {/* 1. Header Section (Desktop & Mobile) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Kelola Absensi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Monitoring kehadiran siswa dan guru secara real-time berdasarkan rentang tanggal.
          </p>
        </div>

        {/* Top Actions: Live Online Button + Export + Tambah */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Live Online Users Indicator Button */}
          <button 
            onClick={() => setShowOnlineUsersModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer group"
            title="Klik untuk melihat siapa saja siswa & guru yang sedang aktif"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>{onlineStudents.length} Siswa Online</span>
            <Radio size={13} className="text-emerald-600 group-hover:rotate-12 transition-transform" />
          </button>

          <button 
            onClick={handleExcelExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Download Rekap Data Absensi Terpilih ke Format Excel (.xlsx)"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>+ Tambah Absensi</span>
          </button>
        </div>
      </div>

      {/* 2. Top Filter Bar with Multi-Date Range Selection */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs space-y-3.5">
        
        {/* Row 1: Primary Filters & Date Range Picker */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          
          {/* Dropdown: Semua Kelas */}
          <div className="relative min-w-[140px] flex-1 sm:flex-none">
            <select 
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none pr-8"
            >
              <option value="">Semua Kelas</option>
              {schoolClasses.map((c: any) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>

          {/* Dropdown: Role (Siswa / Guru) */}
          <div className="relative min-w-[130px] flex-1 sm:flex-none">
            <select 
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none pr-8"
            >
              <option value="siswa">Siswa</option>
              <option value="guru">Guru</option>
              <option value="semua">Semua Role</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>

          {/* Date Range Picker (Dari Tanggal - Sampai Tanggal) */}
          <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 bg-slate-50 border border-slate-200/80 p-1.5 rounded-2xl">
            <div className="flex items-center gap-1.5 px-2">
              <CalendarIcon size={14} className="text-emerald-600 shrink-0" />
              <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Periode:</span>
            </div>
            
            {/* Input Dari Tanggal */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400">Dari:</span>
              <input 
                type="date"
                value={filterDateStart}
                onChange={(e) => {
                  setFilterDateStart(e.target.value);
                  setFilterDatePreset('custom');
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                title="Pilih tanggal mulai"
              />
            </div>

            <ArrowRight size={13} className="text-slate-300 hidden sm:block shrink-0" />
            <span className="text-slate-400 text-xs font-bold sm:hidden">-</span>

            {/* Input Sampai Tanggal */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400">Sampai:</span>
              <input 
                type="date"
                value={filterDateEnd}
                onChange={(e) => {
                  setFilterDateEnd(e.target.value);
                  setFilterDatePreset('custom');
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                title="Pilih tanggal selesai"
              />
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
            <button 
              onClick={() => setFilterDatePreset('today')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterDatePreset === 'today' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Hari Ini
            </button>
            <button 
              onClick={() => setFilterDatePreset('7days')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterDatePreset === '7days' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              7 Hari
            </button>
            <button 
              onClick={() => setFilterDatePreset('month')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterDatePreset === 'month' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Bulan Ini
            </button>
            <button 
              onClick={() => setFilterDatePreset('all')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterDatePreset === 'all' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua
            </button>
          </div>

        </div>

        {/* Row 2: Search Input & Reset Filter */}
        <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama siswa, NISN, atau keterangan..." 
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {filterSearch && (
              <button 
                onClick={() => setFilterSearch('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Reset Filter Button */}
          {(filterKelas || filterRole !== 'siswa' || filterSearch || filterDatePreset !== 'today' || selectedStatusFilter !== 'all') && (
            <button 
              onClick={() => {
                setFilterKelas('');
                setFilterRole('siswa');
                setFilterSearch('');
                setFilterDatePreset('today');
                setSelectedStatusFilter('all');
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
              title="Kembalikan semua filter ke awal (Hari Ini)"
            >
              <RotateCcw size={13} />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

      </div>

      {/* 3. Four Metric Summary Cards (Matches Screenshot Layout) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        
        {/* Card 1: HADIR */}
        <div 
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'hadir' ? 'all' : 'hadir')}
          className={`bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer relative overflow-hidden shadow-2xs hover:shadow-xs ${
            selectedStatusFilter === 'hadir' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                HADIR
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {metrics.hadir.toLocaleString('id-ID')}
              </h3>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600">
              {metrics.hadirPct}% <span className="text-slate-400 font-normal">dari total</span>
            </span>
            {selectedStatusFilter === 'hadir' && (
              <span className="text-[9px] font-black text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md">Aktif</span>
            )}
          </div>
        </div>

        {/* Card 2: SAKIT */}
        <div 
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'sakit' ? 'all' : 'sakit')}
          className={`bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer relative overflow-hidden shadow-2xs hover:shadow-xs ${
            selectedStatusFilter === 'sakit' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                SAKIT
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {metrics.sakit.toLocaleString('id-ID')}
              </h3>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600">
              {metrics.sakitPct}% <span className="text-slate-400 font-normal">dari total</span>
            </span>
            {selectedStatusFilter === 'sakit' && (
              <span className="text-[9px] font-black text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded-md">Aktif</span>
            )}
          </div>
        </div>

        {/* Card 3: IZIN */}
        <div 
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'izin' ? 'all' : 'izin')}
          className={`bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer relative overflow-hidden shadow-2xs hover:shadow-xs ${
            selectedStatusFilter === 'izin' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                IZIN
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {metrics.izin.toLocaleString('id-ID')}
              </h3>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-600">
              {metrics.izinPct}% <span className="text-slate-400 font-normal">dari total</span>
            </span>
            {selectedStatusFilter === 'izin' && (
              <span className="text-[9px] font-black text-purple-700 bg-purple-100/70 px-1.5 py-0.5 rounded-md">Aktif</span>
            )}
          </div>
        </div>

        {/* Card 4: ALPHA */}
        <div 
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'alpha' ? 'all' : 'alpha')}
          className={`bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer relative overflow-hidden shadow-2xs hover:shadow-xs ${
            selectedStatusFilter === 'alpha' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                ALPHA
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {metrics.alpha.toLocaleString('id-ID')}
              </h3>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600">
              {metrics.alphaPct}% <span className="text-slate-400 font-normal">dari total</span>
            </span>
            {selectedStatusFilter === 'alpha' && (
              <span className="text-[9px] font-black text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded-md">Aktif</span>
            )}
          </div>
        </div>

      </div>

      {/* 4. Visual Analytics: Donut Chart & 7-Day Curve (Matches Screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Left Card: Statistik Kehadiran (Donut Chart) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              Statistik Kehadiran
            </h4>
            <span className="text-[11px] font-bold text-slate-400">
              {metrics.total} total data dalam periode
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
            
            {/* Donut Chart with Center Number */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any, name: any) => [`${val} (${metrics.total > 0 ? ((val / metrics.total) * 100).toFixed(1) : 0}%)`, name]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-lg font-black text-slate-900 leading-none">
                  {metrics.hadirPct}%
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">
                  HADIR
                </span>
              </div>
            </div>

            {/* Legend with Counts */}
            <div className="space-y-2.5 w-full sm:w-auto text-xs font-bold text-slate-600">
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <span>Hadir</span>
                </div>
                <span className="text-slate-800 font-black">{metrics.hadir.toLocaleString('id-ID')} ({metrics.hadirPct}%)</span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                  <span>Sakit</span>
                </div>
                <span className="text-slate-800 font-black">{metrics.sakit.toLocaleString('id-ID')} ({metrics.sakitPct}%)</span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
                  <span>Izin</span>
                </div>
                <span className="text-slate-800 font-black">{metrics.izin.toLocaleString('id-ID')} ({metrics.izinPct}%)</span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                  <span>Alpha</span>
                </div>
                <span className="text-slate-800 font-black">{metrics.alpha.toLocaleString('id-ID')} ({metrics.alphaPct}%)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Card: Tren Kehadiran Mingguan (Area Curve Chart) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Tren Kehadiran (Mingguan)
              </h4>
              <p className="text-[11px] font-medium text-slate-400">Grafik 7 hari terakhir</p>
            </div>
            <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black rounded-lg">
              Live Tracker
            </div>
          </div>

          <div className="h-48 sm:h-52 w-full pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                />
                <Tooltip 
                  formatter={(value: any) => [`${value} Hadir`, 'Kehadiran']}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0', 
                    fontSize: '11px', 
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="hadir" 
                  stroke="#16a34a" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#attendanceGradient)" 
                  dot={{ r: 3.5, fill: '#16a34a', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 5, fill: '#15803d', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 5. Table Section: "Absensi & Rekap" (Dynamic title with Date Range) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        
        {/* Table Sub-header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/40">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              {getSubheaderTitle()}
            </h3>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5">
              Menampilkan {filteredAttendance.length} data presensi siswa & guru
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {selectedAttendanceIds.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Trash2 size={13} />
                <span>Hapus ({selectedAttendanceIds.length})</span>
              </button>
            )}

            <button 
              onClick={() => {
                if (selectedAttendanceIds.length === paginatedAttendance.length) {
                  setSelectedAttendanceIds([]);
                } else {
                  setSelectedAttendanceIds(paginatedAttendance.map(a => a.id));
                }
              }}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Check size={13} />
              <span>{selectedAttendanceIds.length === paginatedAttendance.length && paginatedAttendance.length > 0 ? 'Batal Pilih' : 'Pilih Semua'}</span>
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[760px]">
            <thead className="bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox"
                    checked={paginatedAttendance.length > 0 && selectedAttendanceIds.length === paginatedAttendance.length}
                    onChange={() => {
                      if (selectedAttendanceIds.length === paginatedAttendance.length) {
                        setSelectedAttendanceIds([]);
                      } else {
                        setSelectedAttendanceIds(paginatedAttendance.map(a => a.id));
                      }
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4">SISWA / GURU</th>
                <th className="px-6 py-4">KELAS</th>
                <th className="px-6 py-4">WAKTU & TANGGAL</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4 text-center">DOKUMENTASI</th>
                <th className="px-6 py-4 text-center">LOKASI</th>
                <th className="px-6 py-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-medium">
              {paginatedAttendance.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                        <CalendarIcon size={24} />
                      </div>
                      <p className="text-xs font-bold">Tidak ada data presensi pada rentang tanggal & kriteria filter saat ini.</p>
                      <button 
                        onClick={() => {
                          setFilterDatePreset('all');
                          setFilterKelas('');
                          setSelectedStatusFilter('all');
                        }}
                        className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-xs hover:bg-emerald-100 transition-colors"
                      >
                        Tampilkan Semua Riwayat
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAttendance.map((a) => {
                  const student = allUsers.find(u => u.id === a.studentId || u.uid === a.studentId);
                  const isOnline = isUserOnline(student);
                  const studentName = student?.name || a.studentName || 'Siswa';
                  const studentClass = student?.kelas || student?.assignedClass || a.kelas || 'Umum';
                  const isChecked = selectedAttendanceIds.includes(a.id);
                  
                  // Time formatting
                  let timeFormatted = '-';
                  if (a.timestamp) {
                    if (typeof a.timestamp === 'string') timeFormatted = a.timestamp;
                    else if (a.timestamp.seconds) timeFormatted = new Date(a.timestamp.seconds * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    else if (a.timestamp instanceof Date) timeFormatted = a.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                  } else {
                    timeFormatted = '11:16';
                  }

                  return (
                    <tr key={a.id} className={`hover:bg-slate-50/60 transition-colors group ${isChecked ? 'bg-emerald-50/20' : ''}`}>
                      
                      {/* Checkbox */}
                      <td className="px-6 py-4 w-10">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedAttendanceIds(prev => prev.filter(id => id !== a.id));
                            } else {
                              setSelectedAttendanceIds(prev => [...prev, a.id]);
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* SISWA / GURU (Photo + Name + Class + Live Online Dot) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="relative shrink-0">
                            {student?.photoURL ? (
                              <img 
                                src={student.photoURL} 
                                alt={studentName} 
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/80 flex items-center justify-center font-black text-xs shadow-2xs">
                                {getInitials(studentName)}
                              </div>
                            )}
                            
                            {/* Live Online Green Dot Badge */}
                            {isOnline && (
                              <span 
                                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs" 
                                title="Siswa sedang aktif / buka aplikasi sekarang"
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight truncate">
                                {studentName}
                              </h4>
                              {isOnline && (
                                <span className="px-1.5 py-0.2 bg-emerald-100/80 text-emerald-800 rounded text-[9px] font-black tracking-tight">
                                  ONLINE
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-slate-400 truncate">
                                {studentClass}
                              </span>
                              {student?.nisn && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  • {student.nisn}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* KELAS */}
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {studentClass}
                      </td>

                      {/* WAKTU & TANGGAL */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-xs">{timeFormatted}</div>
                        <div className="text-[10px] font-bold text-emerald-700/80 font-sans mt-0.5">
                          {formatDateIndo(a.date)}
                        </div>
                      </td>

                      {/* STATUS BADGE */}
                      <td className="px-6 py-4">
                        {renderStatusBadge(a.status)}
                        {a.keterangan && (
                          <div className="text-[10px] font-medium text-slate-400 mt-1 max-w-[140px] truncate" title={a.keterangan}>
                            {a.keterangan}
                          </div>
                        )}
                      </td>

                      {/* DOKUMENTASI (Photo preview icon) */}
                      <td className="px-6 py-4 text-center">
                        {a.photo ? (
                          <button 
                            onClick={() => setPreviewPhoto(a.photo)}
                            className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 inline-flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Lihat Foto Dokumentasi Presensi"
                          >
                            <Camera size={15} />
                          </button>
                        ) : (
                          <button 
                            disabled
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-300 border border-slate-100 inline-flex items-center justify-center cursor-not-allowed opacity-50"
                            title="Tidak ada foto"
                          >
                            <Camera size={15} />
                          </button>
                        )}
                      </td>

                      {/* LOKASI (Map pin icon) */}
                      <td className="px-6 py-4 text-center">
                        {a.latitude && a.longitude ? (
                          <button 
                            onClick={() => setPreviewLocation({ lat: a.latitude, lng: a.longitude, name: studentName })}
                            className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 inline-flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Lihat Titik Lokasi Presensi"
                          >
                            <MapPin size={15} />
                          </button>
                        ) : (
                          <button 
                            disabled
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-300 border border-slate-100 inline-flex items-center justify-center cursor-not-allowed opacity-50"
                            title="Tidak ada koordinat GPS"
                          >
                            <MapPin size={15} />
                          </button>
                        )}
                      </td>

                      {/* AKSI */}
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === a.id ? null : a.id);
                            }}
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/80 inline-flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Opsi"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {openDropdownId === a.id && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150 text-left"
                            >
                              <button
                                onClick={() => {
                                  setEditingAttendance({ ...a });
                                  setShowEditModal(true);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer"
                              >
                                <Edit3 size={13} className="text-blue-500" />
                                <span>Edit Status</span>
                              </button>

                              <button
                                onClick={() => {
                                  handleDeleteSingle(a.id);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 size={13} className="text-rose-500" />
                                <span>Hapus Data</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Card List */}
        <div className="md:hidden divide-y divide-slate-100">
          {paginatedAttendance.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-3">
              <CalendarIcon size={28} className="mx-auto text-slate-300" />
              <p className="text-xs font-bold">Tidak ada data presensi pada rentang tanggal ini.</p>
              <button 
                onClick={() => setFilterDatePreset('all')}
                className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-xs hover:bg-emerald-100 transition-colors"
              >
                Tampilkan Semua
              </button>
            </div>
          ) : (
            paginatedAttendance.map((a) => {
              const student = allUsers.find(u => u.id === a.studentId || u.uid === a.studentId);
              const isOnline = isUserOnline(student);
              const studentName = student?.name || a.studentName || 'Siswa';
              const studentClass = student?.kelas || student?.assignedClass || a.kelas || 'Umum';
              const isChecked = selectedAttendanceIds.includes(a.id);

              return (
                <div key={a.id} className={`p-4 space-y-3 ${isChecked ? 'bg-emerald-50/20' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedAttendanceIds(prev => prev.filter(id => id !== a.id));
                          } else {
                            setSelectedAttendanceIds(prev => [...prev, a.id]);
                          }
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      
                      <div className="relative">
                        {student?.photoURL ? (
                          <img 
                            src={student.photoURL} 
                            alt={studentName} 
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-black text-xs">
                            {getInitials(studentName)}
                          </div>
                        )}
                        {isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{studentName}</h4>
                        <p className="text-[10px] font-bold text-slate-400">{studentClass} • {a.date}</p>
                      </div>
                    </div>

                    <div>{renderStatusBadge(a.status)}</div>
                  </div>

                  {/* Actions for Mobile Card */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      {a.photo && (
                        <button 
                          onClick={() => setPreviewPhoto(a.photo)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg font-bold text-[10px] flex items-center gap-1 border border-blue-200/60"
                        >
                          <Camera size={12} />
                          <span>Foto</span>
                        </button>
                      )}
                      {a.latitude && a.longitude && (
                        <button 
                          onClick={() => setPreviewLocation({ lat: a.latitude, lng: a.longitude, name: studentName })}
                          className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg font-bold text-[10px] flex items-center gap-1 border border-blue-200/60"
                        >
                          <MapPin size={12} />
                          <span>Peta</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => {
                          setEditingAttendance({ ...a });
                          setShowEditModal(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg font-bold"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteSingle(a.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-bold"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        {filteredAttendance.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white text-xs font-bold text-slate-500">
            <div>
              Menampilkan {startIndex + 1}-{endIndex} dari {filteredAttendance.length} data
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-xl border border-slate-200/80 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                <ChevronLeft size={15} />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 3 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                      currentPage === pageNum 
                        ? 'bg-emerald-600 text-white shadow-2xs' 
                        : 'border border-slate-200/80 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-xl border border-slate-200/80 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-20 right-4 sm:hidden z-40">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-13 h-13 rounded-full bg-emerald-600 text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* ======================================================== */}
      {/* MODALS SECTION */}
      {/* ======================================================== */}

      {/* MODAL 1: LIVE ONLINE USERS LIST */}
      {showOnlineUsersModal && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[300] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150"
          onClick={() => setShowOnlineUsersModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative border border-slate-100 space-y-4 max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Radio size={20} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">Pengguna Sedang Aktif</h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {onlineUsers.length} pengguna sedang membuka akun saat ini
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowOnlineUsersModal(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* List of active users */}
            <div className="overflow-y-auto divide-y divide-slate-100 flex-1 pr-1 space-y-1 max-h-[60vh]">
              {onlineUsers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-bold space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Users size={20} />
                  </div>
                  <p>Belum ada siswa atau pengguna yang terdeteksi sedang membuka aplikasi saat ini.</p>
                </div>
              ) : (
                onlineUsers.map(u => {
                  const isMobile = u.deviceType === 'mobile' || u.lastActiveDevice === 'Mobile';
                  return (
                    <div key={u.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-black text-xs">
                              {getInitials(u.name || 'User')}
                            </div>
                          )}
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{u.name || 'Pengguna'}</h5>
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 shrink-0">
                              Online
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium truncate">
                            {u.role === 'siswa' ? `Siswa • ${u.kelas || u.assignedClass || 'Umum'}` : (u.role === 'guru' ? 'Guru' : 'Admin')}
                            {u.whatsapp && (
                              <span className="ml-1 text-emerald-600 font-bold">• {u.whatsapp}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                          {isMobile ? (
                            <>
                              <Smartphone size={13} className="text-emerald-600" />
                              <span className="hidden sm:inline">HP / Mobile</span>
                            </>
                          ) : (
                            <>
                              <Monitor size={13} className="text-blue-600" />
                              <span className="hidden sm:inline">Komputer</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button 
                onClick={() => setShowOnlineUsersModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH ABSENSI MANUAL */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[300] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative border border-slate-100 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-base">Tambah Presensi Manual</h4>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAttendance} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Siswa / Guru *</label>
                <select 
                  value={newAttTargetId}
                  onChange={(e) => setNewAttTargetId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {allUsers
                    .filter(u => u.role === 'siswa' || u.role === 'guru')
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role?.toUpperCase()} - {u.kelas || u.assignedClass || 'Umum'})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal *</label>
                  <input 
                    type="date"
                    value={newAttDate}
                    onChange={(e) => setNewAttDate(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Kehadiran *</label>
                  <select 
                    value={newAttStatus}
                    onChange={(e) => setNewAttStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="hadir">HADIR</option>
                    <option value="sakit">SAKIT</option>
                    <option value="izin">IZIN</option>
                    <option value="alpha">ALPHA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan (Opsional)</label>
                <input 
                  type="text"
                  placeholder="Contoh: Sakit demam, Izin ada acara keluarga..."
                  value={newAttNote}
                  onChange={(e) => setNewAttNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Presensi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT STATUS ABSENSI */}
      {showEditModal && editingAttendance && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[300] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative border border-slate-100 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-base">Edit Data Presensi</h4>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateAttendance} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Siswa / Guru</label>
                <input 
                  type="text" 
                  disabled 
                  value={editingAttendance.studentName || 'Siswa'} 
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                  <input 
                    type="date"
                    value={editingAttendance.date}
                    onChange={(e) => setEditingAttendance({ ...editingAttendance, date: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select 
                    value={editingAttendance.status}
                    onChange={(e) => setEditingAttendance({ ...editingAttendance, status: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="hadir">HADIR</option>
                    <option value="sakit">SAKIT</option>
                    <option value="izin">IZIN</option>
                    <option value="alpha">ALPHA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan</label>
                <input 
                  type="text"
                  value={editingAttendance.keterangan || ''}
                  onChange={(e) => setEditingAttendance({ ...editingAttendance, keterangan: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Memperbarui...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: FOTO DOKUMENTASI PREVIEW */}
      {previewPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-[300] flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-2xl w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <div className="w-full flex justify-between items-center text-white mb-3">
              <span className="text-xs font-bold tracking-wider uppercase opacity-80">Foto Dokumentasi Presensi</span>
              <button 
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <img 
              src={previewPhoto} 
              alt="Dokumentasi Absensi" 
              className="max-h-[75vh] w-auto rounded-2xl shadow-2xl border border-white/10 object-contain"
            />
          </div>
        </div>
      )}

      {/* MODAL 5: LOKASI GOOGLE MAP PREVIEW */}
      {previewLocation && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[300] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150"
          onClick={() => setPreviewLocation(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl relative border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Lokasi Presensi</h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Lat: {previewLocation.lat.toFixed(5)}, Lng: {previewLocation.lng.toFixed(5)}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewLocation(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-200 relative mb-4 bg-slate-100">
              <iframe
                title="Lokasi Google Maps"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                src={`https://maps.google.com/maps?q=${previewLocation.lat},${previewLocation.lng}&z=16&output=embed`}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${previewLocation.lat},${previewLocation.lng}`} 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs"
              >
                <span>Buka di Google Maps</span>
                <ExternalLink size={13} />
              </a>
              <button 
                onClick={() => setPreviewLocation(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
