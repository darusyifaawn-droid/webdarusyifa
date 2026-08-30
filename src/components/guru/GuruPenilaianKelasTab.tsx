import React, { useState } from 'react';
import { 
  Edit, Star, Save, CheckCircle, Search, Filter,
  BookOpen, GraduationCap, Calendar, Sparkles, RefreshCw, AlertCircle
} from 'lucide-react';
import { StudentHafalanProgress } from '../../data/hafalanData';

interface GuruPenilaianKelasTabProps {
  students: any[];
  allStudents: any[];
  userData: any;
  hafalanMaterials: any[];
  hafalanProgress: StudentHafalanProgress[];
  pkType: 'Hafalan' | 'Rapot';
  setPkType: (type: 'Hafalan' | 'Rapot') => void;
  pkClass: string;
  setPkClass: (cls: string) => void;
  pkMaterialId: string;
  setPkMaterialId: (id: string) => void;
  pkCategory: string;
  setPkCategory: (cat: string) => void;
  pkDate: string;
  setPkDate: (date: string) => void;
  pkSemester: string;
  setPkSemester: (sem: string) => void;
  pkRapotPeriod: string;
  setPkRapotPeriod: (p: string) => void;
  pkStudentData: Record<string, any>;
  setPkStudentData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  pkIsSaving: boolean;
  onSavePk: () => void;
  getAvailableSubjects: (period?: string, classFilter?: string) => string[];
  schoolClasses: any[];
}

export default function GuruPenilaianKelasTab({
  students,
  allStudents,
  userData,
  hafalanMaterials,
  hafalanProgress,
  pkType,
  setPkType,
  pkClass,
  setPkClass,
  pkMaterialId,
  setPkMaterialId,
  pkCategory,
  setPkCategory,
  pkDate,
  setPkDate,
  pkSemester,
  setPkSemester,
  pkRapotPeriod,
  setPkRapotPeriod,
  pkStudentData,
  setPkStudentData,
  pkIsSaving,
  onSavePk,
  getAvailableSubjects,
  schoolClasses
}: GuruPenilaianKelasTabProps) {
  const [search, setSearch] = useState('');
  const [filterUnfinished, setFilterUnfinished] = useState(false);

  const rawTeacherClass = (userData?.assignedClass || userData?.kelas || '').trim();
  const isGeneralTeacher = !rawTeacherClass || 
    ['semua', 'semua kelas', 'wali kelas', 'guru', 'guru ra', '-'].includes(rawTeacherClass.toLowerCase());
  
  const teacherClass = isGeneralTeacher ? 'Semua' : rawTeacherClass;
  const effectiveClass = pkClass || teacherClass;

  const pool = (allStudents && allStudents.length > 0 ? allStudents : students)
    .filter(s => (s.status || 'Aktif').toString().toLowerCase() === 'aktif');

  const targetStudents = (effectiveClass === 'Semua' 
    ? pool 
    : pool.filter(s => {
        const sK = (s.kelas || '').toLowerCase().trim();
        const effK = effectiveClass.toLowerCase().trim();
        const normSK = sK.replace(/[^a-z0-9]/g, '');
        const normEffK = effK.replace(/[^a-z0-9]/g, '');
        return sK === effK || normSK === normEffK || sK.includes(effK) || effK.includes(sK) || normSK.includes(normEffK) || normEffK.includes(normSK);
      })
  ).filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()));

  // Filter materials for this class
  const filteredMaterials = hafalanMaterials.filter(m => {
    if (!effectiveClass || effectiveClass === 'Semua') return true;
    return (m.kelas || '').toLowerCase().includes(effectiveClass.toLowerCase()) || 
           effectiveClass.toLowerCase().includes((m.kelas || '').toLowerCase());
  });

  const availableSubjects = getAvailableSubjects(pkRapotPeriod, effectiveClass);

  const availableClassList = Array.from(new Set([
    'UTSMAN BIN AFFAN',
    'UMAR BIN KHATTAB',
    ...schoolClasses.map(c => c.name).filter(Boolean),
    ...pool.map(s => s.kelas).filter(Boolean)
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

  const handleStudentFieldChange = (studentId: string, field: string, value: any) => {
    setPkStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'Sedang Menghafal', stars: 0, notes: '', score: '' }),
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
            Penilaian Terpadu Kelas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Formulir pengisian nilai massal untuk Tahfidz Hafalan dan Mata Pelajaran Rapot kelas.
          </p>
        </div>

        {/* Mode Selector Pill */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center shrink-0 border border-slate-200">
          <button
            type="button"
            onClick={() => setPkType('Hafalan')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              pkType === 'Hafalan'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hafalan (Tahfidz)
          </button>
          <button
            type="button"
            onClick={() => setPkType('Rapot')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              pkType === 'Rapot'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nilai Rapot / Mapel
          </button>
        </div>
      </div>

      {/* Configuration Controls Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Kelas Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Pilih Kelas
            </label>
            <select
              value={pkClass || teacherClass}
              onChange={(e) => setPkClass(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Kelas</option>
              {availableClassList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Period / Semester Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Periode Penilaian
            </label>
            <select
              value={pkType === 'Hafalan' ? pkSemester : pkRapotPeriod}
              onChange={(e) => {
                if (pkType === 'Hafalan') setPkSemester(e.target.value);
                else setPkRapotPeriod(e.target.value);
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="PTS Ganjil">PTS Ganjil</option>
              <option value="PAS Ganjil">PAS Ganjil</option>
              <option value="PTS Genap">PTS Genap</option>
              <option value="PAS Genap">PAS Genap</option>
              {pkType === 'Rapot' && <option value="Harian">Laporan Harian</option>}
            </select>
          </div>

          {/* Materi Hafalan OR Mapel Selector */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              {pkType === 'Hafalan' ? 'Pilih Materi Hafalan' : 'Pilih Mata Pelajaran'}
            </label>
            {pkType === 'Hafalan' ? (
              <select
                value={pkMaterialId}
                onChange={(e) => setPkMaterialId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Pilih Materi Hafalan --</option>
                {filteredMaterials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.judul} ({m.kategori || 'Hafalan'} - {m.kelas || 'Umum'})
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={pkCategory}
                onChange={(e) => setPkCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Pilih Mata Pelajaran --</option>
                {availableSubjects.map((sub, idx) => (
                  <option key={idx} value={sub}>{sub}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari santri di tabel..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSavePk}
              disabled={pkIsSaving || (pkType === 'Hafalan' ? !pkMaterialId : !pkCategory)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer"
            >
              {pkIsSaving ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Simpan Semua Nilai ({targetStudents.length} Siswa)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Bulk Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Santri</th>
                <th className="py-3.5 px-4 w-32">Status Capaian</th>
                {pkType === 'Hafalan' ? (
                  <th className="py-3.5 px-4 w-36 text-center">Bintang (1-5)</th>
                ) : (
                  <th className="py-3.5 px-4 w-28 text-center">Nilai (1-100)</th>
                )}
                <th className="py-3.5 px-4">Catatan Ustadz/Ustadzah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {targetStudents.map((student, idx) => {
                const sData = pkStudentData[student.id] || {
                  status: pkType === 'Hafalan' ? 'Sedang Menghafal' : 'Lulus',
                  stars: 0,
                  score: '',
                  notes: ''
                };

                return (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                          {student.photoURL ? (
                            <img src={student.photoURL} alt={student.name} className="w-full h-full object-cover" />
                          ) : (
                            student.name?.charAt(0) || 'S'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{student.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">NIS: {student.email?.split('@')[0] || '-'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4">
                      {pkType === 'Hafalan' ? (
                        <select
                          value={sData.status || 'Sedang Menghafal'}
                          onChange={(e) => handleStudentFieldChange(student.id, 'status', e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="Sedang Menghafal">Sedang Menghafal</option>
                          <option value="Lancar">Lancar</option>
                          <option value="Mumtaz (Lulus)">Mumtaz (Lulus)</option>
                        </select>
                      ) : (
                        <select
                          value={sData.status || 'Lulus'}
                          onChange={(e) => handleStudentFieldChange(student.id, 'status', e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Lulus">Lulus</option>
                          <option value="Belum Lulus">Belum Lulus</option>
                          <option value="Mengulang">Mengulang</option>
                        </select>
                      )}
                    </td>

                    {/* Stars or Score input */}
                    {pkType === 'Hafalan' ? (
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleStudentFieldChange(student.id, 'stars', star)}
                              className={`p-1 transition-transform active:scale-125 ${
                                (sData.stars || 0) >= star ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'
                              }`}
                            >
                              <Star size={18} fill={(sData.stars || 0) >= star ? 'currentColor' : 'none'} />
                            </button>
                          ))}
                        </div>
                      </td>
                    ) : (
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={sData.score ?? ''}
                          onChange={(e) => handleStudentFieldChange(student.id, 'score', e.target.value)}
                          placeholder="0-100"
                          className="w-20 p-2 text-center font-bold bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                    )}

                    {/* Notes Field */}
                    <td className="py-3.5 px-4">
                      <input
                        type="text"
                        value={sData.notes || ''}
                        onChange={(e) => handleStudentFieldChange(student.id, 'notes', e.target.value)}
                        placeholder="Contoh: Makhraj huruf bagus, tingkatkan kelancaran..."
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                  </tr>
                );
              })}

              {targetStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    Tidak ada data santri untuk kelas yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
