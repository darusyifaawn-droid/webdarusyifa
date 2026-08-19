import React, { useState } from 'react';
import { 
  FileText, Plus, Search, Filter, Trash2, Edit, 
  Printer, BookOpen, GraduationCap, Award, Calendar, ChevronRight
} from 'lucide-react';

interface GuruProgressRapotTabProps {
  progress: any[];
  students: any[];
  allStudents?: any[];
  userData: any;
  onOpenNewProgress: () => void;
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
  userData,
  onOpenNewProgress,
  onEditProgress,
  onDeleteProgress,
  onOpenSubjectModal,
  onPromptPrintRapot,
  getScoreGradeInfo
}: GuruProgressRapotTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('Semua');

  const pool = allStudents.length > 0 ? allStudents : students;
  const studentMap = new Map(pool.map(s => [s.id, s]));

  const filteredProgress = progress.filter(p => {
    const student = studentMap.get(p.studentId);
    const matchSearch = !searchTerm || 
      (student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchPeriod = periodFilter === 'Semua' || p.evaluationPeriod === periodFilter;
    return matchSearch && matchPeriod;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
            Rapot Belajar & Evaluasi Santri
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Kelola nilai mata pelajaran perorangan, cetak rapot resmi sekolah, dan manajemen kurikulum.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSubjectModal}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <BookOpen size={16} />
            <span>Kelola Mapel</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewProgress}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Input Nilai Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari santri atau nama mata pelajaran..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400 hidden sm:inline" />
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Semua">Semua Periode ({progress.length})</option>
            <option value="PTS Ganjil">PTS Ganjil</option>
            <option value="PAS Ganjil">PAS Ganjil</option>
            <option value="PTS Genap">PTS Genap</option>
            <option value="PAS Genap">PAS Genap</option>
            <option value="Harian">Laporan Harian</option>
          </select>
        </div>
      </div>

      {/* Progress Cards / List */}
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
                      <span className="text-[9px] font-black text-emerald-600 mt-0.5">Predikat {gradeInfo.grade}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen size={13} className="text-indigo-600" />
                    <span>{item.category || item.title || 'Mata Pelajaran'}</span>
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
              Klik tombol "+ Input Nilai Baru" atau gunakan "Penilaian Terpadu Kelas" untuk menambahkan nilai santri.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
