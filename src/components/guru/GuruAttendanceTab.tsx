import React from 'react';
import { 
  Camera, CheckCircle, Clock, Calendar, MapPin, 
  Image as ImageIcon, RefreshCw, AlertCircle, ShieldCheck
} from 'lucide-react';

interface GuruAttendanceTabProps {
  user: any;
  userData: any;
  attendance: any[];
  hasCheckedInToday: boolean;
  onOpenAttendanceCamera: () => void;
  onSelectPhoto: (url: string) => void;
}

export default function GuruAttendanceTab({
  user,
  userData,
  attendance,
  hasCheckedInToday,
  onOpenAttendanceCamera,
  onSelectPhoto
}: GuruAttendanceTabProps) {
  const teacherAttendance = attendance.filter(a => a.studentId === user?.uid);

  const hadirCount = teacherAttendance.filter(a => a.status === 'Hadir').length;
  const sakitCount = teacherAttendance.filter(a => a.status === 'Sakit').length;
  const izinCount = teacherAttendance.filter(a => a.status === 'Izin').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
            Presensi Guru & Tenaga Pengajar
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Pencatatan kehadiran harian berbasis foto selfie dan koordinat lokasi GPS.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAttendanceCamera}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all cursor-pointer"
        >
          <Camera size={18} />
          <span>{hasCheckedInToday ? 'Perbarui Absen Hari Ini' : 'Ambil Foto Presensi Sekarang'}</span>
        </button>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Hari Ini</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2.5 h-2.5 rounded-full ${hasCheckedInToday ? 'bg-emerald-500' : 'bg-amber-400 animate-ping'}`} />
            <span className="text-sm font-bold text-slate-800">
              {hasCheckedInToday ? 'Sudah Absen' : 'Belum Absen'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Hadir</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{hadirCount} <span className="text-xs font-bold text-slate-400">Hari</span></p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Izin</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{izinCount} <span className="text-xs font-bold text-slate-400">Hari</span></p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sakit</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{sakitCount} <span className="text-xs font-bold text-slate-400">Hari</span></p>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Riwayat Presensi Saya</h3>
          <span className="text-xs text-slate-400">{teacherAttendance.length} Catatan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Tanggal & Waktu</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Foto Presensi</th>
                <th className="py-3.5 px-4">Lokasi (GPS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {teacherAttendance.map((rec, idx) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{rec.date}</p>
                    <p className="text-[10px] text-slate-400">
                      {rec.timestamp ? new Date(rec.timestamp.seconds * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'} WIB
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      rec.status === 'Hadir' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : rec.status === 'Sakit'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {rec.photo ? (
                      <button
                        type="button"
                        onClick={() => onSelectPhoto(rec.photo)}
                        className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:scale-105 transition-transform inline-block cursor-pointer"
                        title="Klik untuk memperbesar foto"
                      >
                        <img src={rec.photo} alt="Bukti Absen" className="w-full h-full object-cover" />
                      </button>
                    ) : (
                      <span className="text-slate-300 italic text-[11px]">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {rec.location ? (
                      <span className="flex items-center gap-1 text-slate-600">
                        <MapPin size={12} className="text-emerald-600" />
                        {rec.location.latitude?.toFixed(4)}, {rec.location.longitude?.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}

              {teacherAttendance.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    Belum ada riwayat absensi. Silakan ambil foto presensi hari ini.
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
