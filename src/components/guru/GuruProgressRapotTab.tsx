import React, { useState, useMemo } from 'react';
import { 
  FileText, Plus, Search, Filter, Trash2, Edit, 
  Printer, BookOpen, GraduationCap, Award, Calendar, ChevronRight, ChevronDown, ChevronUp, Sparkles, Star,
  X, CheckCircle, UserCheck, ArrowRight, LayoutGrid, Table as TableIcon, List, AlertCircle
} from 'lucide-react';

interface GuruProgressRapotTabProps {
  progress: any[];
  students: any[];
  allStudents?: any[];
  schoolClasses?: any[];
  userData: any;
  onOpenNewProgress: (studentId?: string) => void;
  onEditProgress: (p: any) => void;
  onDeleteProgress: (id: string) => void;
  onOpenSubjectModal: () => void;
  onPromptPrintRapot: (student: any) => void;
  getScoreGradeInfo: (score: number) => { grade: string; text: string; color: string };
}

interface StudentGradeGroup {
  studentId: string;
  student: any;
  items: any[];
  totalScore: number;
  avgScore: number;
  gradeInfo: { grade: string; text: string; color: string };
  periods: string[];
}

export default function GuruProgressRapotTab({
  progress,
  students,
  allStudents = [],
  schoolClasses = [],
  userData,
  onOpenNewProgress,
  onEditProgress,
  onDeleteProgress,
  onOpenSubjectModal,
  onPromptPrintRapot,
  getScoreGradeInfo
}: GuruProgressRapotTabProps) {
  const pool = allStudents.length > 0 ? allStudents : students;
  const studentMap = useMemo(() => new Map(pool.map(s => [s.id, s])), [pool]);

  // Teacher's default class
  const teacherDefaultClass = useMemo(() => {
    const rawClass = (userData?.assignedClass || userData?.kelas || '').trim();
    if (rawClass && rawClass.toLowerCase() !== 'semua' && rawClass.toLowerCase() !== 'semua kelas') {
      return rawClass;
    }
    return 'Semua';
  }, [userData]);

  const [selectedClass, setSelectedClass] = useState<string>(teacherDefaultClass);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState<'graded' | 'all' | 'ungraded'>('graded');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'raw'>('cards');
  const [expandedStudentIds, setExpandedStudentIds] = useState<Record<string, boolean>>({});

  // Distinct classes list
  const distinctClasses = useMemo(() => {
    const set = new Set<string>();
    schoolClasses.forEach(c => {
      if (c.name) set.add(c.name.trim());
    });
    pool.forEach(s => {
      if (s.kelas) set.add(s.kelas.trim());
    });
    return Array.from(set).sort();
  }, [schoolClasses, pool]);

  // Active students in the selected class
  const classActiveStudents = useMemo(() => {
    return pool.filter(s => {
      const isActive = (s.status || 'Aktif') === 'Aktif';
      if (!isActive) return false;
      if (selectedClass === 'Semua') return true;
      return (s.kelas || '').toLowerCase().trim() === selectedClass.toLowerCase().trim();
    });
  }, [pool, selectedClass]);

  // Filtered raw progress entries based on class & period
  const filteredRawProgress = useMemo(() => {
    return progress.filter(p => {
      const student = studentMap.get(p.studentId);
      
      // Class match
      if (selectedClass !== 'Semua') {
        const sClass = (student?.kelas || '').toLowerCase().trim();
        if (sClass !== selectedClass.toLowerCase().trim()) return false;
      }

      // Period match
      if (periodFilter !== 'Semua' && p.evaluationPeriod !== periodFilter) {
        return false;
      }

      // Search match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchStudent = (student?.name || '').toLowerCase().includes(q);
        const matchCategory = (p.category || '').toLowerCase().includes(q);
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchDesc = (p.description || '').toLowerCase().includes(q);
        if (!matchStudent && !matchCategory && !matchTitle && !matchDesc) {
          return false;
        }
      }

      return true;
    });
  }, [progress, studentMap, selectedClass, periodFilter, searchTerm]);

  // Grouped progress per student (One cohesive entry per student)
  const groupedStudents = useMemo<StudentGradeGroup[]>(() => {
    // Map of studentId -> progress items
    const itemsByStudent = new Map<string, any[]>();
    filteredRawProgress.forEach(p => {
      const sId = p.studentId;
      if (!itemsByStudent.has(sId)) {
        itemsByStudent.set(sId, []);
      }
      itemsByStudent.get(sId)!.push(p);
    });

    const groups: StudentGradeGroup[] = [];

    // Students to consider based on statusFilter
    const targetStudents = statusFilter === 'graded' 
      ? classActiveStudents.filter(s => itemsByStudent.has(s.id))
      : statusFilter === 'ungraded'
      ? classActiveStudents.filter(s => !itemsByStudent.has(s.id))
      : classActiveStudents;

    targetStudents.forEach(student => {
      const items = itemsByStudent.get(student.id) || [];
      const totalScore = items.reduce((sum, item) => sum + (Number(item.score) || 0), 0);
      const avgScore = items.length > 0 ? Math.round((totalScore / items.length) * 10) / 10 : 0;
      const gradeInfo = getScoreGradeInfo(Math.round(avgScore));
      const periods = Array.from(new Set(items.map(i => i.evaluationPeriod || 'Harian').filter(Boolean)));

      // Search filter when student has 0 items but matches name
      if (searchTerm.trim() && items.length === 0) {
        const q = searchTerm.toLowerCase().trim();
        if (!student.name?.toLowerCase().includes(q) && !student.nisn?.toLowerCase().includes(q)) {
          return;
        }
      }

      groups.push({
        studentId: student.id,
        student,
        items,
        totalScore,
        avgScore,
        gradeInfo,
        periods
      });
    });

    // Sort alphabetically by student name
    return groups.sort((a, b) => (a.student?.name || '').localeCompare(b.student?.name || ''));
  }, [filteredRawProgress, classActiveStudents, statusFilter, searchTerm, getScoreGradeInfo]);

  // Overall metrics
  const stats = useMemo(() => {
    const totalClassStudents = classActiveStudents.length;
    const gradedStudentIds = new Set(filteredRawProgress.map(p => p.studentId));
    const gradedCount = classActiveStudents.filter(s => gradedStudentIds.has(s.id)).length;
    const ungradedCount = Math.max(0, totalClassStudents - gradedCount);

    const totalScores = filteredRawProgress.reduce((sum, p) => sum + (Number(p.score) || 0), 0);
    const overallAvg = filteredRawProgress.length > 0 ? (totalScores / filteredRawProgress.length).toFixed(1) : '0';

    return {
      totalClassStudents,
      gradedCount,
      ungradedCount,
      totalAssessments: filteredRawProgress.length,
      overallAvg
    };
  }, [classActiveStudents, filteredRawProgress]);

  const toggleExpand = (studentId: string) => {
    setExpandedStudentIds(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    groupedStudents.forEach(g => { next[g.studentId] = true; });
    setExpandedStudentIds(next);
  };

  const collapseAll = () => {
    setExpandedStudentIds({});
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Rapot Belajar & Evaluasi Santri</span>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
              Tampilan Per Siswa
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Rekapitulasi nilai terpadu per santri. Semua mata pelajaran dikelompokkan efisien dalam satu kartu siswa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSubjectModal}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            title="Kelola Mata Pelajaran & Aspek Perkembangan Kelas"
          >
            <BookOpen size={16} className="text-indigo-600" />
            <span>Kelola Mapel</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenNewProgress()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>Input Nilai Baru</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards (Efisien & Ringkas) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Total Santri Kelas
          </span>
          <div className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
            {stats.totalClassStudents}
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {selectedClass === 'Semua' ? 'Seluruh Kelas' : `Kelas ${selectedClass}`}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Sudah Dinilai
          </span>
          <div className="text-2xl font-black text-emerald-600 tracking-tight leading-none mb-1">
            {stats.gradedCount}
          </div>
          <span className="text-[11px] font-semibold text-emerald-700">
            {stats.totalClassStudents > 0 
              ? `${Math.round((stats.gradedCount / stats.totalClassStudents) * 100)}% santri selesai` 
              : '0%'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Total Mapel Masuk
          </span>
          <div className="text-2xl font-black text-indigo-600 tracking-tight leading-none mb-1">
            {stats.totalAssessments}
          </div>
          <span className="text-[11px] font-semibold text-indigo-700">
            Catatan penilaian aktif
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Rata-rata Nilai
          </span>
          <div className="text-2xl font-black text-amber-600 tracking-tight leading-none mb-1">
            {stats.overallAvg}
          </div>
          <span className="text-[11px] font-semibold text-amber-700">
            {getScoreGradeInfo(Math.round(Number(stats.overallAvg))).text}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Class Filter */}
          <div className="md:col-span-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <GraduationCap size={13} className="text-indigo-500" />
              <span>Filter Kelas</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Semua">Semua Kelas ({pool.length} Santri)</option>
              {distinctClasses.map(c => (
                <option key={c} value={c}>
                  Kelas {c} ({pool.filter(s => (s.kelas || '').toLowerCase() === c.toLowerCase()).length} santri)
                </option>
              ))}
            </select>
          </div>

          {/* Student Search */}
          <div className="md:col-span-5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Search size={13} className="text-emerald-500" />
              <span>Cari Nama Santri {selectedClass !== 'Semua' ? `di Kelas ${selectedClass}` : ''}</span>
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={selectedClass !== 'Semua' ? `Cari santri kelas ${selectedClass}...` : 'Cari nama santri atau mapel...'}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Period Filter */}
          <div className="md:col-span-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar size={13} className="text-amber-500" />
              <span>Periode Rapot</span>
            </label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Semua">Semua Periode</option>
              <option value="PTS Ganjil">PTS Ganjil</option>
              <option value="PAS Ganjil">PAS Ganjil</option>
              <option value="PTS Genap">PTS Genap</option>
              <option value="PAS Genap">PAS Genap</option>
              <option value="Harian">Laporan Harian</option>
            </select>
          </div>
        </div>

        {/* Tab Filter Santri (Sudah Dinilai vs Belum Dinilai) & View Mode Selector */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter('graded')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'graded' 
                  ? 'bg-white text-emerald-800 shadow-2xs font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Sudah Dinilai ({stats.gradedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all' 
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Semua Santri ({stats.totalClassStudents})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ungraded')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ungraded' 
                  ? 'bg-white text-rose-800 shadow-2xs font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Belum Dinilai ({stats.ungradedCount})</span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            {viewMode === 'cards' && groupedStudents.some(g => g.items.length > 0) && (
              <div className="flex items-center gap-1.5 mr-2 text-[11px] font-bold text-slate-500">
                <button
                  type="button"
                  onClick={expandAll}
                  className="hover:text-emerald-700 underline cursor-pointer"
                >
                  Buka Semua Rincian
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="hover:text-slate-800 underline cursor-pointer"
                >
                  Tutup Rincian
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-emerald-800 shadow-2xs' : 'hover:text-slate-900'
                }`}
                title="Tampilan Kartu Per Santri"
              >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">Kartu Santri</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-emerald-800 shadow-2xs' : 'hover:text-slate-900'
                }`}
                title="Tampilan Tabel Rekapitulasi"
              >
                <TableIcon size={14} />
                <span className="hidden sm:inline">Tabel Rekap</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('raw')}
                className={`p-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'raw' ? 'bg-white text-emerald-800 shadow-2xs' : 'hover:text-slate-900'
                }`}
                title="Tampilan Riwayat Semua Catatan"
              >
                <List size={14} />
                <span className="hidden sm:inline">Semua Catatan</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          1. TAMPILAN UTAMA: KARTU PER SISWA (MEMENUHI REQUEST USER)
          ======================================================== */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span>Daftar Santri & Rekapitulasi Rapor</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                {groupedStudents.length} Santri Tampil
              </span>
            </div>
            {selectedClass !== 'Semua' && (
              <span className="text-xs text-indigo-600 font-bold">
                Kelas: {selectedClass}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {groupedStudents.map((group) => {
              const isExpanded = !!expandedStudentIds[group.studentId];
              const studentName = group.student?.name || 'Santri';
              const studentClass = group.student?.kelas || selectedClass || '-';
              const hasGrades = group.items.length > 0;

              return (
                <div
                  key={group.studentId}
                  className={`bg-white rounded-2xl border transition-all shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
                    isExpanded 
                      ? 'border-emerald-300 ring-2 ring-emerald-500/10' 
                      : 'border-slate-200/80 hover:border-emerald-200'
                  }`}
                >
                  <div className="p-5 space-y-4">
                    {/* Header Santri: Info + Nilai Rata-rata */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Avatar initials */}
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                          {studentName.substring(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black uppercase">
                              Kelas {studentClass}
                            </span>
                            {group.periods.length > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                                {group.periods.join(', ')}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-black text-slate-900 truncate leading-snug">
                            {studentName}
                          </h3>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {group.student?.nisn ? `NISN: ${group.student.nisn}` : 'RA Darusyifa Arjawinangun'}
                          </p>
                        </div>
                      </div>

                      {/* Rata-rata Nilai Santri */}
                      {hasGrades ? (
                        <div className="shrink-0 text-right">
                          <div className="inline-flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-lg font-black text-slate-900 leading-none">
                              {group.avgScore}
                            </span>
                            <span className={`text-[9.5px] font-black mt-0.5 ${group.gradeInfo.color}`}>
                              Predikat {group.gradeInfo.grade}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold shrink-0">
                          Belum Dinilai
                        </span>
                      )}
                    </div>

                    {/* Ringkasan Nilai Mata Pelajaran (Chips Grid) */}
                    {hasGrades ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-500 flex items-center gap-1.5">
                            <BookOpen size={13} className="text-emerald-600" />
                            <span>{group.items.length} Mata Pelajaran Dinilai</span>
                          </span>
                          <span className="text-slate-400 font-medium">
                            Skala Nilai 0 - 100
                          </span>
                        </div>

                        {/* Chips Nilai Mapel Santri Ini */}
                        <div className="flex flex-wrap gap-1.5">
                          {group.items.map((item) => {
                            const sc = Number(item.score) || 0;
                            const subjectName = item.category || item.title || 'Mapel';
                            return (
                              <div
                                key={item.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-700 transition-colors"
                              >
                                <span className="truncate max-w-[120px]">{subjectName}</span>
                                <span className="font-black px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-900 text-[10.5px]">
                                  {sc}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-500 font-medium">
                          Santri ini belum memiliki riwayat penilaian di periode ini.
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenNewProgress(group.studentId)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer shrink-0"
                        >
                          + Nilai Sekarang
                        </button>
                      </div>
                    )}

                    {/* Rincian Accordion Terbuka: Daftar Nilai Lengkap dengan Tombol Edit & Hapus */}
                    {isExpanded && hasGrades && (
                      <div className="pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-200">
                        <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 block">
                          Rincian Evaluasi & Catatan Perkembangan Santri:
                        </span>
                        
                        <div className="space-y-2 divide-y divide-slate-100">
                          {group.items.map((item, idx) => {
                            const sc = Number(item.score) || 0;
                            const gi = getScoreGradeInfo(sc);

                            return (
                              <div key={item.id} className="pt-2 first:pt-0 flex items-start justify-between gap-3 group">
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">
                                      {idx + 1}. {item.category || item.title || 'Mata Pelajaran'}
                                    </span>
                                    <span className={`text-[10px] font-black ${gi.color}`}>
                                      {sc} ({gi.grade})
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      • {item.date || ''}
                                    </span>
                                  </div>
                                  {item.description && (
                                    <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                                      {item.description}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => onEditProgress(item)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Nilai Mapel Ini"
                                  >
                                    <Edit size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteProgress(item.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Hapus Nilai"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Card: Aksi Cetak Rapot, Tambah Mapel, dan Toggle Rincian */}
                  <div className="p-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {hasGrades && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(group.studentId)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        >
                          <span>{isExpanded ? 'Tutup Rincian' : `Rincian (${group.items.length})`}</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenNewProgress(group.studentId)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Beri nilai mata pelajaran baru untuk santri ini"
                      >
                        <Plus size={13} />
                        <span>+ Nilai Mapel</span>
                      </button>
                    </div>

                    {hasGrades && (
                      <button
                        type="button"
                        onClick={() => onPromptPrintRapot(group.student)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                        title="Cetak Buku Rapot Santri Ini"
                      >
                        <Printer size={13} />
                        <span>Cetak Rapot</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {groupedStudents.length === 0 && (
              <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
                <FileText size={36} className="mx-auto text-slate-300" />
                <h3 className="text-sm font-bold text-slate-700">Tidak ada data santri yang cocok</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {statusFilter === 'ungraded'
                    ? 'Semua santri di kelas ini sudah selesai dinilai! MasyaAllah.'
                    : 'Tidak ada data nilai yang sesuai dengan filter kelas, periode, atau nama pencarian.'}
                </p>
                {statusFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Tampilkan Semua Santri
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          2. TAMPILAN TABEL REKAPITULASI (ALTERNATIF RINGKAS)
          ======================================================== */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Tabel Rekapitulasi Rapor Santri ({groupedStudents.length} Santri)
            </span>
            <span className="text-xs text-slate-400">
              Kelas: {selectedClass} • Periode: {periodFilter}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[750px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 w-12 text-center">No</th>
                  <th className="px-5 py-3.5">Nama Santri</th>
                  <th className="px-5 py-3.5">Kelas</th>
                  <th className="px-5 py-3.5 text-center">Mapel Selesai</th>
                  <th className="px-5 py-3.5">Ringkasan Nilai Mapel</th>
                  <th className="px-5 py-3.5 text-center">Rata-rata</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupedStudents.map((group, idx) => (
                  <tr key={group.studentId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900 block">{group.student?.name}</span>
                      <span className="text-[10px] text-slate-400">{group.student?.nisn || '-'}</span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-600">
                      {group.student?.kelas || selectedClass || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        group.items.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {group.items.length} Mapel
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {group.items.slice(0, 4).map(it => (
                          <span key={it.id} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            {it.category || it.title}: <strong>{it.score}</strong>
                          </span>
                        ))}
                        {group.items.length > 4 && (
                          <span className="text-[10px] text-slate-400 font-bold self-center">
                            +{group.items.length - 4} lainnya
                          </span>
                        )}
                        {group.items.length === 0 && (
                          <span className="text-slate-400 italic text-[11px]">Belum ada nilai</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {group.items.length > 0 ? (
                        <span className={`font-black text-sm ${group.gradeInfo.color}`}>
                          {group.avgScore} <small className="text-[10px]">({group.gradeInfo.grade})</small>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenNewProgress(group.studentId)}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="+ Nilai Mapel"
                        >
                          <Plus size={15} />
                        </button>
                        {group.items.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onPromptPrintRapot(group.student)}
                            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Cetak Rapot"
                          >
                            <Printer size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          3. TAMPILAN RIWAYAT SEMUA CATATAN (RAW LIST LAMA)
          ======================================================== */}
      {viewMode === 'raw' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Log Seluruh Catatan Nilai ({filteredRawProgress.length} Catatan)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRawProgress.map((item) => {
              const student = studentMap.get(item.studentId);
              const scoreNum = Number(item.score) || 0;
              const gradeInfo = getScoreGradeInfo(scoreNum);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black uppercase mb-1">
                          {item.evaluationPeriod || 'Harian'}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {student?.name || 'Santri'}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium truncate">
                          Kelas: {student?.kelas || '-'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="inline-flex flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-base font-black text-slate-900 leading-none">{scoreNum}</span>
                          <span className={`text-[9px] font-black mt-0.5 ${gradeInfo.color}`}>
                            Predikat {gradeInfo.grade}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <BookOpen size={13} className="text-indigo-600 shrink-0" />
                        <span className="truncate">{item.category || item.title || 'Mata Pelajaran'}</span>
                      </p>
                      {item.description && (
                        <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {item.date || ''}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEditProgress(item)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProgress(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
