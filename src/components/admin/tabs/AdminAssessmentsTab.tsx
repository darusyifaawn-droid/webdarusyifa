import React, { useState, useMemo } from 'react';
import { 
  Users, BookOpen, Star, Search, Filter, Printer, 
  ChevronDown, ChevronUp, Award, GraduationCap, 
  FileText, CheckCircle2, AlertCircle, LayoutGrid, Table as TableIcon,
  X, Calendar, TrendingUp, Sparkles, UserCheck
} from 'lucide-react';

interface AdminAssessmentsTabProps {
  allUsers: any[];
  schoolClasses: any[];
  progressData: any[];
  hafalanData: any[];
  materialsData: any[];
  onPromptPrintRapot: (student: any) => void;
  getScoreGradeInfo: (score: number) => { grade: string; text: string; color: string };
  formatDateForUI: (dateInput: any, options?: Intl.DateTimeFormatOptions) => string;
}

interface StudentAssessmentSummary {
  student: any;
  studentProgress: any[];
  studentHafalan: any[];
  totalAssessments: number;
  totalRapot: number;
  totalHafalan: number;
  avgScore: number;
  gradeInfo: { grade: string; text: string; color: string };
  avgStars: number;
  isGraded: boolean;
}

export default function AdminAssessmentsTab({
  allUsers,
  schoolClasses,
  progressData,
  hafalanData,
  materialsData,
  onPromptPrintRapot,
  getScoreGradeInfo,
  formatDateForUI
}: AdminAssessmentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Semua' | 'Rapot' | 'Hafalan'>('Semua');
  const [statusFilter, setStatusFilter] = useState<'graded' | 'all' | 'ungraded'>('graded');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedStudentIds, setExpandedStudentIds] = useState<Record<string, boolean>>({});

  // Active student list
  const activeStudents = useMemo(() => {
    return allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif');
  }, [allUsers]);

  // Distinct classes
  const distinctClasses = useMemo(() => {
    const set = new Set<string>();
    schoolClasses.forEach(c => {
      if (c.name) set.add(c.name.trim());
    });
    activeStudents.forEach(s => {
      if (s.kelas) set.add(s.kelas.trim());
    });
    return Array.from(set).sort();
  }, [schoolClasses, activeStudents]);

  // Materials map for fast lookup
  const materialsMap = useMemo(() => {
    return new Map(materialsData.map(m => [m.id, m]));
  }, [materialsData]);

  // Teacher map for fast lookup
  const teacherMap = useMemo(() => {
    return new Map(allUsers.filter(u => u.role === 'guru' || u.role === 'admin').map(u => [u.id, u]));
  }, [allUsers]);

  // Process assessment summary per student
  const studentSummaries = useMemo<StudentAssessmentSummary[]>(() => {
    return activeStudents.map(student => {
      // Rapot progress
      const studentProgress = (selectedCategory === 'Semua' || selectedCategory === 'Rapot')
        ? progressData.filter(p => p.studentId === student.id)
        : [];

      // Hafalan progress
      const studentHafalan = (selectedCategory === 'Semua' || selectedCategory === 'Hafalan')
        ? hafalanData.filter(h => h.studentId === student.id)
        : [];

      const totalRapot = studentProgress.length;
      const totalHafalan = studentHafalan.length;
      const totalAssessments = totalRapot + totalHafalan;

      // Calculate rapot average score
      const totalRapotScore = studentProgress.reduce((sum, p) => sum + (Number(p.score) || 0), 0);
      const avgScore = totalRapot > 0 ? Math.round((totalRapotScore / totalRapot) * 10) / 10 : 0;
      const gradeInfo = getScoreGradeInfo(Math.round(avgScore));

      // Calculate hafalan stars
      const totalStars = studentHafalan.reduce((sum, h) => sum + (Number(h.stars) || 0), 0);
      const avgStars = totalHafalan > 0 ? Math.round((totalStars / totalHafalan) * 10) / 10 : 0;

      const isGraded = totalAssessments > 0;

      return {
        student,
        studentProgress,
        studentHafalan,
        totalAssessments,
        totalRapot,
        totalHafalan,
        avgScore,
        gradeInfo,
        avgStars,
        isGraded
      };
    });
  }, [activeStudents, selectedCategory, progressData, hafalanData, getScoreGradeInfo]);

  // Filter summaries based on class, search, and status filter
  const filteredSummaries = useMemo(() => {
    return studentSummaries.filter(summary => {
      const student = summary.student;

      // Class match
      if (selectedKelas) {
        const sClass = (student.kelas || '').toLowerCase().trim();
        const selClass = selectedKelas.toLowerCase().trim();
        const normSClass = sClass.replace(/[^a-z0-9]/g, '');
        const normSelClass = selClass.replace(/[^a-z0-9]/g, '');
        if (sClass !== selClass && normSClass !== normSelClass && !sClass.includes(selClass) && !selClass.includes(sClass)) {
          return false;
        }
      }

      // Search match (student name, NISN, or teacher name in their progress)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = (student.name || '').toLowerCase().includes(q);
        const matchNisn = (student.nisn || '').toLowerCase().includes(q);
        const matchEmail = (student.email || '').toLowerCase().includes(q);
        const matchSubject = summary.studentProgress.some(p => 
          (p.category || '').toLowerCase().includes(q) || 
          (p.teacherName || '').toLowerCase().includes(q)
        );
        const matchSurah = summary.studentHafalan.some(h => {
          const mat = materialsMap.get(h.materialId);
          return (mat?.title || mat?.judul || '').toLowerCase().includes(q);
        });

        if (!matchName && !matchNisn && !matchEmail && !matchSubject && !matchSurah) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'graded') {
        return summary.isGraded;
      }
      if (statusFilter === 'ungraded') {
        return !summary.isGraded;
      }

      return true;
    }).sort((a, b) => (a.student.name || '').localeCompare(b.student.name || ''));
  }, [studentSummaries, selectedKelas, searchTerm, statusFilter, materialsMap]);

  // Overall Statistics for KPI Cards
  const stats = useMemo(() => {
    const totalClassActive = selectedKelas
      ? activeStudents.filter(s => {
          const sClass = (s.kelas || '').toLowerCase().trim();
          const selClass = selectedKelas.toLowerCase().trim();
          return sClass === selClass || sClass.includes(selClass);
        }).length
      : activeStudents.length;

    const classSummaries = selectedKelas
      ? studentSummaries.filter(s => {
          const sClass = (s.student.kelas || '').toLowerCase().trim();
          const selClass = selectedKelas.toLowerCase().trim();
          return sClass === selClass || sClass.includes(selClass);
        })
      : studentSummaries;

    const gradedCount = classSummaries.filter(s => s.isGraded).length;
    const ungradedCount = Math.max(0, totalClassActive - gradedCount);

    // School-wide or class average score
    const gradedSummariesWithScore = classSummaries.filter(s => s.totalRapot > 0);
    const overallAvg = gradedSummariesWithScore.length > 0
      ? (gradedSummariesWithScore.reduce((sum, s) => sum + s.avgScore, 0) / gradedSummariesWithScore.length).toFixed(1)
      : '0';

    const totalRecords = classSummaries.reduce((sum, s) => sum + s.totalAssessments, 0);

    return {
      totalStudents: totalClassActive,
      gradedCount,
      ungradedCount,
      overallAvg,
      totalRecords,
      pctGraded: totalClassActive > 0 ? Math.round((gradedCount / totalClassActive) * 100) : 0
    };
  }, [selectedKelas, activeStudents, studentSummaries]);

  const toggleExpand = (studentId: string) => {
    setExpandedStudentIds(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    filteredSummaries.forEach(s => { next[s.student.id] = true; });
    setExpandedStudentIds(next);
  };

  const collapseAll = () => {
    setExpandedStudentIds({});
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <GraduationCap size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  Rekapitulasi Nilai Siswa
                </h3>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                  Tampilan Per Siswa
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                Ringkasan penilaian terpadu per santri. Seluruh nilai rapot & hafalan dikelompokkan efisien tanpa tampilan berulang.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 self-end lg:self-center">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200/80 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'hover:text-slate-900'
              }`}
              title="Tampilan Kartu Per Santri"
            >
              <LayoutGrid size={15} />
              <span>Kartu Santri</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'hover:text-slate-900'
              }`}
              title="Tampilan Tabel Rekap Per Santri"
            >
              <TableIcon size={15} />
              <span>Tabel Rekap</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards (Ringkas & Efisien) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Total Santri Aktif
          </span>
          <div className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
            {stats.totalStudents}
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {selectedKelas ? `Kelas ${selectedKelas}` : 'Seluruh Madrasah'}
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Sudah Dinilai
          </span>
          <div className="text-2xl font-black text-emerald-600 tracking-tight leading-none mb-1">
            {stats.gradedCount}
          </div>
          <span className="text-[11px] font-semibold text-emerald-700">
            {stats.pctGraded}% santri telah dinilai
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Belum Dinilai
          </span>
          <div className="text-2xl font-black text-rose-500 tracking-tight leading-none mb-1">
            {stats.ungradedCount}
          </div>
          <span className="text-[11px] font-semibold text-rose-600">
            {stats.ungradedCount === 0 ? 'Semua santri tuntas!' : 'Perlu input penilaian'}
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Rata-rata Nilai
          </span>
          <div className="text-2xl font-black text-indigo-600 tracking-tight leading-none mb-1">
            {stats.overallAvg}
          </div>
          <span className="text-[11px] font-semibold text-indigo-700">
            {getScoreGradeInfo(Math.round(Number(stats.overallAvg))).text}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Cari Nama Santri / NISN / Mata Pelajaran..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
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

          {/* Class Filter */}
          <div className="md:col-span-4">
            <select 
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Semua Kelas ({activeStudents.length} Santri)</option>
              {distinctClasses.map(c => (
                <option key={c} value={c}>
                  Kelas {c} ({activeStudents.filter(s => (s.kelas || '').toLowerCase() === c.toLowerCase()).length} santri)
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Semua">Semua Kategori (Rapot & Hafalan)</option>
              <option value="Rapot">Penilaian Rapot Saja</option>
              <option value="Hafalan">Penilaian Hafalan Saja</option>
            </select>
          </div>
        </div>

        {/* Tab Status Santri (Sudah Dinilai vs Belum Dinilai) & Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
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
              <span>Semua Santri ({stats.totalStudents})</span>
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

          {/* Quick Accordion Toggles */}
          {filteredSummaries.some(s => s.totalAssessments > 0) && (
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
              <button
                type="button"
                onClick={expandAll}
                className="hover:text-indigo-600 underline cursor-pointer"
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
        </div>
      </div>

      {/* ========================================================
          1. TAMPILAN KARTU PER SISWA (MEMENUHI REQUEST USER)
          ======================================================== */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Daftar Santri ({filteredSummaries.length} Santri Tampil)
            </span>
            {selectedKelas && (
              <span className="text-xs text-indigo-600 font-bold">
                Kelas: {selectedKelas}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredSummaries.map((summary) => {
              const student = summary.student;
              const isExpanded = !!expandedStudentIds[student.id];
              const studentName = student.name || 'Santri';
              const studentClass = student.kelas || selectedKelas || '-';
              const hasGrades = summary.isGraded;

              return (
                <div
                  key={student.id}
                  className={`bg-white rounded-2xl border transition-all shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
                    isExpanded 
                      ? 'border-indigo-300 ring-2 ring-indigo-500/10' 
                      : 'border-slate-200/80 hover:border-indigo-200'
                  }`}
                >
                  <div className="p-5 space-y-4">
                    {/* Header Santri: Info + Nilai Rata-rata */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-black text-sm flex items-center justify-center shrink-0 uppercase shadow-2xs">
                          {studentName.substring(0, 2)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black uppercase">
                              Kelas {studentClass}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                              {student.nisn ? `NISN: ${student.nisn}` : 'RA Darusyifa'}
                            </span>
                          </div>

                          <h4 className="text-base font-black text-slate-900 truncate leading-snug">
                            {studentName}
                          </h4>
                        </div>
                      </div>

                      {/* Rata-rata Nilai */}
                      {hasGrades ? (
                        <div className="shrink-0 text-right">
                          <div className="inline-flex flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                            {summary.totalRapot > 0 ? (
                              <>
                                <span className="text-base font-black text-slate-900 leading-none">
                                  {summary.avgScore}
                                </span>
                                <span className={`text-[9.5px] font-black mt-0.5 ${summary.gradeInfo.color}`}>
                                  Predikat {summary.gradeInfo.grade}
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-0.5 text-amber-500">
                                  <span className="text-sm font-black">{summary.avgStars}</span>
                                  <Star size={12} fill="currentColor" />
                                </div>
                                <span className="text-[9px] font-bold text-amber-700 mt-0.5">
                                  Hafalan
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold shrink-0">
                          Belum Dinilai
                        </span>
                      )}
                    </div>

                    {/* Ringkasan Nilai Mapel & Hafalan (Chips Compact) */}
                    {hasGrades ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            {summary.totalRapot > 0 && (
                              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 text-[10px]">
                                {summary.totalRapot} Mapel Rapot
                              </span>
                            )}
                            {summary.totalHafalan > 0 && (
                              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 text-[10px]">
                                {summary.totalHafalan} Setoran Hafalan
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 font-medium">
                            Total {summary.totalAssessments} Penilaian
                          </span>
                        </div>

                        {/* Chips Ringkas Per Mapel & Surah (Tidak membuat tampilan terlalu banyak) */}
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                          {summary.studentProgress.map((item) => {
                            const sc = Number(item.score) || 0;
                            const subjectName = item.category || item.title || 'Mapel';
                            return (
                              <div
                                key={item.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors"
                              >
                                <span className="truncate max-w-[120px]">{subjectName}</span>
                                <span className="font-black px-1.5 py-0.2 rounded bg-white border border-slate-200 text-indigo-700 text-[10.5px]">
                                  {sc}
                                </span>
                              </div>
                            );
                          })}

                          {summary.studentHafalan.map((h) => {
                            const mat = materialsMap.get(h.materialId);
                            const surahName = mat?.title || mat?.judul || 'Hafalan';
                            return (
                              <div
                                key={h.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/80 text-[11px] font-semibold text-amber-900 transition-colors"
                              >
                                <span className="truncate max-w-[120px]">{surahName}</span>
                                <span className="inline-flex items-center gap-0.5 font-black text-amber-600 text-[10px]">
                                  {h.stars || 0}★
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400 font-medium">
                        Santri ini belum memiliki riwayat penilaian di sistem.
                      </div>
                    )}

                    {/* Rincian Accordion Terbuka */}
                    {isExpanded && hasGrades && (
                      <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                        <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 block">
                          Daftar Rincian Nilai & Catatan Guru:
                        </span>

                        <div className="space-y-2 divide-y divide-slate-100 max-h-72 overflow-y-auto custom-scrollbar">
                          {/* Rapot Progress rows */}
                          {summary.studentProgress.map((item, idx) => {
                            const sc = Number(item.score) || 0;
                            const gi = getScoreGradeInfo(sc);
                            return (
                              <div key={item.id} className="pt-2 first:pt-0 flex items-start justify-between gap-3">
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-slate-800">
                                      {idx + 1}. {item.category || item.title || 'Mata Pelajaran'}
                                    </span>
                                    <span className={`text-[10px] font-black ${gi.color}`}>
                                      {sc} ({gi.grade})
                                    </span>
                                    <span className="text-[9.5px] text-slate-400 font-medium">
                                      • {formatDateForUI(item.createdAt || item.date)} • {item.teacherName || 'Guru'}
                                    </span>
                                  </div>
                                  {item.description ? (
                                    <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                                      "{item.description}"
                                    </p>
                                  ) : (
                                    <p className="text-[10px] text-slate-400 italic">
                                      (Tidak ada catatan tambahan)
                                    </p>
                                  )}
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                                  item.status === 'Lulus' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {item.status || 'Selesai'}
                                </span>
                              </div>
                            );
                          })}

                          {/* Hafalan Progress rows */}
                          {summary.studentHafalan.map((h, idx) => {
                            const mat = materialsMap.get(h.materialId);
                            const surahName = mat?.title || mat?.judul || 'Materi Hafalan';
                            return (
                              <div key={h.id} className="pt-2 flex items-start justify-between gap-3">
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-slate-800">
                                      [Hafalan] {surahName}
                                    </span>
                                    <span className="text-[10px] font-black text-amber-600 inline-flex items-center gap-0.5">
                                      {h.stars || 0} Bintang
                                    </span>
                                    <span className="text-[9.5px] text-slate-400 font-medium">
                                      • {formatDateForUI(h.createdAt || h.updatedAt)} • {h.evaluationSemester || 'Semester'}
                                    </span>
                                  </div>
                                  {h.catatanGuru ? (
                                    <p className="text-[11px] text-slate-600 leading-relaxed bg-amber-50/50 p-2 rounded-lg border border-amber-100 italic">
                                      "{h.catatanGuru}"
                                    </p>
                                  ) : (
                                    <p className="text-[10px] text-slate-400 italic">
                                      (Tidak ada catatan tambahan)
                                    </p>
                                  )}
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                                  h.status?.includes('Lulus') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {h.status || 'Sedang Menghafal'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Card: Aksi Cetak Rapot & Toggle Rincian */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    {hasGrades ? (
                      <button
                        type="button"
                        onClick={() => toggleExpand(student.id)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <span>{isExpanded ? 'Tutup Rincian' : `Rincian (${summary.totalAssessments})`}</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic px-2">
                        Belum ada nilai
                      </span>
                    )}

                    {hasGrades && (
                      <button
                        type="button"
                        onClick={() => onPromptPrintRapot(student)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                        title="Cetak Rapot Santri Ini"
                      >
                        <Printer size={13} />
                        <span>Cetak Rapot</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredSummaries.length === 0 && (
              <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
                <FileText size={36} className="mx-auto text-slate-300" />
                <h3 className="text-sm font-bold text-slate-700">Tidak ada data santri yang cocok</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {statusFilter === 'ungraded'
                    ? 'Seluruh santri di kelas ini sudah selesai dinilai! Alhamdulillah.'
                    : 'Tidak ada data nilai yang cocok dengan filter kelas, kategori, atau pencarian.'}
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
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Tabel Rekapitulasi Nilai Santri ({filteredSummaries.length} Santri)
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {selectedKelas ? `Kelas: ${selectedKelas}` : 'Semua Kelas'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[750px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 w-12 text-center">No</th>
                  <th className="px-5 py-3.5">Nama Santri</th>
                  <th className="px-5 py-3.5">Kelas</th>
                  <th className="px-5 py-3.5 text-center">Nilai Masuk</th>
                  <th className="px-5 py-3.5">Ringkasan Mapel</th>
                  <th className="px-5 py-3.5 text-center">Rata-rata</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSummaries.map((summary, idx) => (
                  <tr key={summary.student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900 block">{summary.student.name}</span>
                      <span className="text-[10px] text-slate-400">{summary.student.nisn || '-'}</span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-600">
                      {summary.student.kelas || selectedKelas || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        summary.totalAssessments > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {summary.totalAssessments} Penilaian
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {summary.studentProgress.slice(0, 3).map(it => (
                          <span key={it.id} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            {it.category || it.title}: <strong>{it.score}</strong>
                          </span>
                        ))}
                        {summary.studentHafalan.slice(0, 2).map(h => {
                          const mat = materialsMap.get(h.materialId);
                          return (
                            <span key={h.id} className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-semibold">
                              {mat?.title || 'Hafalan'}: <strong>{h.stars}★</strong>
                            </span>
                          );
                        })}
                        {summary.totalAssessments > 5 && (
                          <span className="text-[10px] text-slate-400 font-bold self-center">
                            +{summary.totalAssessments - 5} lainnya
                          </span>
                        )}
                        {summary.totalAssessments === 0 && (
                          <span className="text-slate-400 italic text-[11px]">Belum ada nilai</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {summary.totalRapot > 0 ? (
                        <span className={`font-black text-sm ${summary.gradeInfo.color}`}>
                          {summary.avgScore} <small className="text-[10px]">({summary.gradeInfo.grade})</small>
                        </span>
                      ) : summary.totalHafalan > 0 ? (
                        <span className="font-black text-xs text-amber-600">
                          {summary.avgStars} ★
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {summary.totalAssessments > 0 && (
                          <button
                            type="button"
                            onClick={() => onPromptPrintRapot(summary.student)}
                            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Cetak Rapot Santri"
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
    </div>
  );
}
