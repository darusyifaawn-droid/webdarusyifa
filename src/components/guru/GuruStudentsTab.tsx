import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Filter, Phone, MessageSquare, 
  GraduationCap, Star, FileText, Printer, ChevronRight,
  Sparkles, CheckCircle, ExternalLink, Award, BookOpen
} from 'lucide-react';
import { StudentHafalanProgress } from '../../data/hafalanData';

interface GuruStudentsTabProps {
  students: any[];
  allStudents: any[];
  userData: any;
  progress: any[];
  hafalanProgress: StudentHafalanProgress[];
  hafalanMaterials: any[];
  onOpenProgressModal: (studentId: string) => void;
  onPrintRapot: (student: any) => void;
  onPrintRapotHafalan: (student: any) => void;
  onNavigateTab: (tab: string) => void;
}

export default function GuruStudentsTab({
  students,
  allStudents,
  userData,
  progress,
  hafalanProgress,
  hafalanMaterials,
  onOpenProgressModal,
  onPrintRapot,
  onPrintRapotHafalan,
  onNavigateTab
}: GuruStudentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('Semua');

  const effectiveAll = useMemo(() => {
    const pool = allStudents.length > 0 ? allStudents : students;
    return pool.filter(s => (s.status || 'Aktif').toString().toLowerCase() === 'aktif');
  }, [allStudents, students]);

  const classes = useMemo(() => {
    const raw = Array.from(new Set(effectiveAll.map(s => s.kelas).filter(Boolean)));
    const cleaned = raw.filter(c => {
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
    const unique = Array.from(new Set(cleaned));
    return unique.length > 0 ? unique : ['UTSMAN BIN AFFAN', 'UMAR BIN KHATTAB'];
  }, [effectiveAll]);

  const teacherClass = (userData?.assignedClass || userData?.kelas || '').trim();

  const filteredStudents = useMemo(() => {
    let baseList = effectiveAll;
    if (selectedClass === 'kelas-saya') {
      baseList = students.length > 0 ? students : effectiveAll;
    } else if (selectedClass !== 'Semua') {
      baseList = effectiveAll.filter(s => {
        const sK = (s.kelas || '').toLowerCase().trim();
        const selK = selectedClass.toLowerCase().trim();
        return sK === selK || sK.includes(selK) || selK.includes(sK);
      });
    }

    return baseList.filter(s => {
      const matchSearch = !searchTerm || 
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.nis || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.nisn || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [effectiveAll, selectedClass, students, searchTerm]);

  const handleOpenWhatsApp = (student: any) => {
    if (!student.whatsapp && !student.parentPhone && !student.phone) {
      alert('Nomor WhatsApp wali murid belum terdaftar untuk santri ini.');
      return;
    }
    let raw = (student.whatsapp || student.parentPhone || student.phone || '').replace(/\D/g, '');
    if (raw.startsWith('0')) raw = '62' + raw.substring(1);
    const msg = `Assalamu'alaikum Warahmatullahi Wabarakatuh Bapak/Ibu Wali dari ananda *${student.name}* (Kelas: ${student.kelas || '-'}), kami dari pihak pengajar RA Darusyifa ingin menginformasikan perkembangan ananda...`;
    window.open(`https://wa.me/${raw}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
            Daftar Santri & Siswa Bimbingan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Pantau kehadiran, capaian hafalan, dan kontak wali murid siswa kelas {teacherClass || 'RA'}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('penilaian-kelas')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer"
          >
            <GraduationCap size={16} />
            <span>Input Nilai Massal</span>
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
            placeholder="Cari santri berdasarkan nama / NISN..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400 hidden sm:inline" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="Semua">Semua Santri ({effectiveAll.length})</option>
            {teacherClass && !['semua', 'semua kelas', 'wali kelas', 'guru', '-'].includes(teacherClass.toLowerCase()) && (
              <option value="kelas-saya">Kelas Saya ({students.length})</option>
            )}
            {classes.map(c => (
              <option key={c} value={c}>Kelas {c} ({effectiveAll.filter(s => s.kelas === c).length})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredStudents.map((student) => {
          // Student specific stats
          const studentHafalan = hafalanProgress.filter(p => p.studentId === student.id);
          const completedHafalan = studentHafalan.filter(p => p.status === 'Mumtaz (Lulus)' || p.status === 'Lancar').length;
          const studentScores = progress.filter(p => p.studentId === student.id && p.score !== undefined);
          const studentAvg = studentScores.length > 0
            ? Math.round(studentScores.reduce((acc, p) => acc + (Number(p.score) || 0), 0) / studentScores.length)
            : '-';

          const isOnline = student.isOnline === true;

          return (
            <div
              key={student.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between gap-4 relative overflow-hidden group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                      {student.photoURL ? (
                        <img src={student.photoURL} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        student.name?.charAt(0) || 'S'
                      )}
                    </div>
                    {/* Presence Dot */}
                    <span 
                      title={isOnline ? 'Online sekarang' : 'Offline'}
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate leading-tight group-hover:text-emerald-700 transition-colors">
                      {student.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                      NIS: {student.email?.split('@')[0] || student.nis || '-'}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase">
                      {student.kelas || 'Belum Ada Kelas'}
                    </span>
                  </div>
                </div>

                {/* WhatsApp button */}
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(student)}
                  title="Hubungi Wali Murid via WhatsApp"
                  className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  <MessageSquare size={16} />
                </button>
              </div>

              {/* Stats snapshot */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Hafalan Selesai</p>
                  <p className="text-xs font-black text-amber-600 mt-0.5">
                    {completedHafalan} Materi
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Rata-rata Nilai</p>
                  <p className="text-xs font-black text-indigo-600 mt-0.5">
                    {studentAvg}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenProgressModal(student.id)}
                  className="py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText size={13} />
                  <span>Input Nilai</span>
                </button>
                <button
                  type="button"
                  onClick={() => onPrintRapot(student)}
                  className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Cetak Rapot</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredStudents.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
            <Users size={36} className="mx-auto text-slate-300" />
            <h3 className="text-sm font-bold text-slate-700">Tidak ada santri ditemukan</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Silakan periksa kata kunci pencarian atau ganti filter kelas di atas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
