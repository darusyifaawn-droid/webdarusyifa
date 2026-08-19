import React from 'react';
import { 
  Users, Star, CheckCircle, Clock, Calendar, 
  ChevronRight, Award, Edit3, ArrowUpRight, Megaphone,
  BookOpen, Camera, ShieldCheck, Sparkles, FileText, AlertCircle
} from 'lucide-react';
import { StudentHafalanProgress } from '../../data/hafalanData';

interface GuruOverviewTabProps {
  user: any;
  userData: any;
  students: any[];
  progress: any[];
  hafalanProgress: StudentHafalanProgress[];
  hafalanMaterials: any[];
  announcements: any[];
  exams: any[];
  hasCheckedInToday: boolean;
  onNavigateTab: (tab: string) => void;
  onOpenAttendanceCamera: () => void;
}

export default function GuruOverviewTab({
  user,
  userData,
  students,
  progress,
  hafalanProgress,
  hafalanMaterials,
  announcements,
  exams,
  hasCheckedInToday,
  onNavigateTab,
  onOpenAttendanceCamera
}: GuruOverviewTabProps) {
  const teacherClass = userData?.assignedClass || userData?.kelas || 'Semua Kelas';
  
  // Pending hafalan submissions needing review
  const pendingHafalanCount = hafalanProgress.filter(p => {
    const isStudentInClass = students.some(s => s.id === p.studentId);
    return isStudentInClass && (p.isReadyForTest || p.submissionMethod);
  }).length;

  // Average academic score
  const studentIds = new Set(students.map(s => s.id));
  const classProgress = progress.filter(p => studentIds.has(p.studentId) && p.score !== undefined && p.score !== null);
  const avgScore = classProgress.length > 0
    ? Math.round(classProgress.reduce((sum, p) => sum + (Number(p.score) || 0), 0) / classProgress.length)
    : 0;

  // Class exams / schedules
  const classExams = exams.filter(exam => {
    const schedules = (exam.schedules || []).filter((s: any) => {
      return !s.kelas || s.kelas.toLowerCase() === 'semua kelas' ||
        (teacherClass && s.kelas?.toLowerCase() === teacherClass.toLowerCase());
    });
    return schedules.length > 0;
  });

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Modern Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/10">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-200 text-xs font-bold">
              <Sparkles size={14} className="text-amber-300" />
              <span>Portal Pengajar & Wali Kelas</span>
              <span className="w-1 h-1 rounded-full bg-white/40" />
              <span className="text-white font-black">{teacherClass}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tight text-white leading-tight">
              Assalamu'alaikum, <br className="hidden sm:inline" />
              <span className="text-emerald-300">{userData?.name || 'Ustadz / Ustadzah'}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
              Selamat bertugas! Kelola perkembangan hafalan santri, input nilai rapot belajar kelas, dan pantau aktivitas harian di satu tempat.
            </p>
          </div>

          {/* Quick Check-in status CTA */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-start justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                hasCheckedInToday ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950'
              }`}>
                {hasCheckedInToday ? <CheckCircle size={20} /> : <Clock size={20} />}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-200">Presensi Hari Ini</p>
                <p className="text-xs font-bold text-white">
                  {hasCheckedInToday ? 'Sudah Melakukan Absensi' : 'Belum Absen Hari Ini'}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenAttendanceCamera}
              className={`w-full sm:w-auto md:w-full mt-1 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                hasCheckedInToday
                  ? 'bg-white/20 hover:bg-white/30 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-white'
              }`}
            >
              <Camera size={15} />
              <span>{hasCheckedInToday ? 'Lihat / Perbarui Absen' : 'Ambil Foto Presensi'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Siswa Bimbingan */}
        <div 
          onClick={() => onNavigateTab('students')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Users size={20} />
            </div>
            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
          </div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Siswa Aktif</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-display font-black text-slate-900">{students.length}</span>
            <span className="text-xs font-bold text-slate-400">Santri</span>
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1 truncate">Kelas: {teacherClass}</p>
        </div>

        {/* Setoran Menunggu */}
        <div 
          onClick={() => onNavigateTab('hafalan')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-amber-300 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Star size={20} />
            </div>
            {pendingHafalanCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {pendingHafalanCount} Menunggu
              </span>
            )}
          </div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Evaluasi Hafalan</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-display font-black text-slate-900">{pendingHafalanCount}</span>
            <span className="text-xs font-bold text-slate-400">Setoran</span>
          </div>
          <p className="text-[10px] text-amber-700 font-semibold mt-1">Perlu Penilaian Ustadz/ah</p>
        </div>

        {/* Rata-Rata Nilai */}
        <div 
          onClick={() => onNavigateTab('progress')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Award size={20} />
            </div>
            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rata-Rata Rapot</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-display font-black text-slate-900">
              {avgScore > 0 ? avgScore : '-'}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 100</span>
          </div>
          <p className="text-[10px] text-indigo-600 font-semibold mt-1">
            {classProgress.length} Rekam Penilaian
          </p>
        </div>

        {/* Tanggal & Hari */}
        <div 
          onClick={() => onNavigateTab('kaldik')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-sky-300 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Calendar size={20} />
            </div>
            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-sky-600 transition-colors" />
          </div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kalender Akademik</p>
          <div className="mt-1">
            <span className="text-sm font-bold text-slate-800 leading-tight block truncate">
              {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </span>
            <p className="text-[10px] text-sky-600 font-semibold mt-0.5 truncate">{todayStr}</p>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Aksi Cepat Guru</h2>
            <p className="text-xs text-slate-400">Akses langsung ke formulir penilaian dan administrasi bimbingan</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => onNavigateTab('penilaian-kelas')}
            className="p-4 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-100 text-left transition-all group cursor-pointer flex flex-col justify-between gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Edit3 size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950 leading-tight">Penilaian Kelas</p>
              <p className="text-[10px] text-emerald-700 mt-0.5">Input massal nilai santri</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('hafalan')}
            className="p-4 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-100 text-left transition-all group cursor-pointer flex flex-col justify-between gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Star size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950 leading-tight">Evaluasi Tahfidz</p>
              <p className="text-[10px] text-amber-700 mt-0.5">Beri bintang setoran</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('progress')}
            className="p-4 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-100 text-left transition-all group cursor-pointer flex flex-col justify-between gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-950 leading-tight">Rapot & Nilai</p>
              <p className="text-[10px] text-indigo-700 mt-0.5">Cetak & kelola rapot</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('attendance')}
            className="p-4 rounded-2xl bg-teal-50/70 hover:bg-teal-100/70 border border-teal-100 text-left transition-all group cursor-pointer flex flex-col justify-between gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Camera size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-teal-950 leading-tight">Presensi Guru</p>
              <p className="text-[10px] text-teal-700 mt-0.5">Riwayat kehadiran</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('students')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-all group cursor-pointer flex flex-col justify-between gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Users size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">Data Santri</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Kontak wali & profil</p>
            </div>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Jadwal Ujian & Pengumuman */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jadwal Ujian & Evaluasi */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <Calendar size={16} />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Jadwal Evaluasi / Ujian</h2>
            </div>
            <button
              onClick={() => onNavigateTab('exams')}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Lihat Detail <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex-1 space-y-3">
            {classExams.length > 0 ? (
              classExams.slice(0, 3).map((exam: any) => (
                <div key={exam.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                        {exam.type}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{exam.academicYear}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {(exam.schedules || []).length} Mata Pelajaran terdaftar
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigateTab('exams')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shrink-0"
                  >
                    Buka
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl space-y-2">
                <Calendar size={24} className="mx-auto text-slate-300" />
                <p className="text-xs text-slate-500 font-medium">Belum ada agenda ujian aktif saat ini.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pengumuman Terbaru */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Megaphone size={16} />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Pengumuman Sekolah</h2>
            </div>
            <button
              onClick={() => onNavigateTab('announcements')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Semua Info <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex-1 space-y-3">
            {announcements.filter(a => !a.target || a.target === 'all' || a.target === 'guru').slice(0, 3).map((ann: any) => (
              <div 
                key={ann.id} 
                onClick={() => onNavigateTab('announcements')}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-100 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    {ann.target === 'guru' ? 'Khusus Tenaga Pengajar' : 'Umum Sekolah'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {ann.createdAt ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{ann.title}</h4>
              </div>
            ))}

            {announcements.filter(a => !a.target || a.target === 'all' || a.target === 'guru').length === 0 && (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl space-y-2">
                <Megaphone size={24} className="mx-auto text-slate-300" />
                <p className="text-xs text-slate-500 font-medium">Belum ada pengumuman baru.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
