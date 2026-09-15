import React, { useState, useMemo } from 'react';
import { 
  FileText, Plus, Search, Filter, Trash2, Edit, 
  Printer, BookOpen, GraduationCap, Award, Calendar, ChevronRight, Sparkles, Star,
  X, CheckCircle, UserCheck, ArrowRight
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
  const [focusedStudentId, setFocusedStudentId] = useState<string | null>(null);

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

  // Instant student search results matching the selected class
  const searchedStudents = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase().trim();
    return classActiveStudents.filter(s => 
      (s.name || '').toLowerCase().includes(q) ||
      (s.nisn || '').toLowerCase().includes(q)
    );
  }, [classActiveStudents, searchTerm]);

  // Filtered progress entries
  const filteredProgress = useMemo(() => {
    return progress.filter(p => {
      const student = studentMap.get(p.studentId);
      
      // Class match
      if (selectedClass !== 'Semua') {
        const sClass = (student?.kelas || '').toLowerCase().trim();
        if (sClass !== selectedClass.toLowerCase().trim()) return false;
      }

      // Focused student filter
      if (focusedStudentId && p.studentId !== focusedStudentId) {
        return false;
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
  }, [progress, studentMap, selectedClass, focusedStudentId, periodFilter, searchTerm]);

  const focusedStudent = focusedStudentId ? studentMap.get(focusedStudentId) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
            Rapot Belajar & Evaluasi Santri
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Kelola penilaian santri per kelas, cetak rapot berkala, dan manajemen kurikulum & aspek perkembangan.
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
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Input Nilai Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Class Filter */}
          <div className="md:col-span-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <GraduationCap size={13} className="text-indigo-500" />
              <span>Filter Kelas</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setFocusedStudentId(null);
              }}
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
          <div className="md:col-span-6">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Search size={13} className="text-emerald-500" />
              <span>Cari Santri {selectedClass !== 'Semua' ? `di Kelas ${selectedClass}` : ''}</span>
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={selectedClass !== 'Semua' ? `Ketik nama santri kelas ${selectedClass}...` : 'Cari nama santri atau mata pelajaran...'}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Period Filter */}
          <div className="md:col-span-3">
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

        {/* Focused Student Filter Chip */}
        {focusedStudent && (
          <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <UserCheck size={16} className="text-emerald-600 shrink-0" />
              <span>
                Menampilkan riwayat nilai untuk santri: <strong>{focusedStudent.name}</strong> (Kelas {focusedStudent.kelas || '-'})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFocusedStudentId(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer text-xs"
            >
              Tampilkan Semua Santri
            </button>
          </div>
        )}
      </div>

      {/* QUICK STUDENT SEARCH RESULT CARD (Directly answers user request: search student per class for fast assessment) */}
      {searchTerm.trim() && searchedStudents.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/90 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wide">
                Santri Ditemukan ({searchedStudents.length}) {selectedClass !== 'Semua' ? `di Kelas ${selectedClass}` : ''}
              </h3>
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">Klik &quot;+ Beri Nilai&quot; untuk input instan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchedStudents.map(student => {
              const studentGradesCount = progress.filter(p => p.studentId === student.id).length;
              return (
                <div
                  key={student.id}
                  className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs flex items-center justify-between gap-3 hover:border-emerald-300 transition-all"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {student.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="font-semibold text-emerald-700">Kelas {student.kelas || '-'}</span>
                      <span>•</span>
                      <span>{studentGradesCount} Penilaian</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenNewProgress(student.id)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      title="Beri nilai sekarang"
                    >
                      <Plus size={13} />
                      <span>Beri Nilai</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onPromptPrintRapot(student)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="Cetak Buku Rapot"
                    >
                      <Printer size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Cards / List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <span>Daftar Nilai Belajar Santri</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px]">
              {filteredProgress.length} Catatan
            </span>
          </div>
          {selectedClass !== 'Semua' && (
            <span className="text-xs text-indigo-600 font-bold">
              Kelas: {selectedClass}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProgress.map((item) => {
            const student = studentMap.get(item.studentId);
            const scoreNum = Number(item.score) || 0;
            const gradeInfo = getScoreGradeInfo(scoreNum);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between gap-4"
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

                    {/* Score circle badge */}
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

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {item.date || ''}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {student && (
                      <button
                        type="button"
                        onClick={() => onPromptPrintRapot(student)}
                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                        title="Cetak Rapot Santri Ini"
                      >
                        <Printer size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEditProgress(item)}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                      title="Edit Nilai"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteProgress(item.id)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProgress.length === 0 && (
            <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
              <FileText size={36} className="mx-auto text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700">Belum ada data evaluasi belajar</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {selectedClass !== 'Semua' 
                  ? `Tidak ada data penilaian untuk kelas ${selectedClass} dengan kriteria pencarian ini.`
                  : 'Klik tombol "+ Input Nilai Baru" untuk mulai memberikan penilaian santri.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
