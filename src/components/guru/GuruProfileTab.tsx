import React, { useRef } from 'react';
import { 
  User, Camera, Lock, LogOut, CheckCircle, 
  ShieldCheck, Save, Mail, GraduationCap
} from 'lucide-react';

interface GuruProfileTabProps {
  user: any;
  userData: any;
  editName: string;
  setEditName: (name: string) => void;
  editPhoto: string;
  newPassword: string;
  setNewPassword: (p: string) => void;
  confirmPassword: string;
  setConfirmPassword: (p: string) => void;
  onUpdateProfile: (e: React.FormEvent) => void;
  onChangePassword: (e: React.FormEvent) => void;
  onPhotoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogout: () => void;
}

export default function GuruProfileTab({
  user,
  userData,
  editName,
  setEditName,
  editPhoto,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  onUpdateProfile,
  onChangePassword,
  onPhotoFileChange,
  onLogout
}: GuruProfileTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
          Pengaturan Akun & Profil Guru
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Kelola informasi nama pengajar, foto identitas, kata sandi, dan sesi login.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-8">
        <form onSubmit={onUpdateProfile} className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-emerald-50 border-2 border-emerald-200 shadow-md flex items-center justify-center font-bold text-emerald-800 text-2xl">
                {editPhoto ? (
                  <img src={editPhoto} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  editName?.charAt(0) || 'G'
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 transition-all cursor-pointer"
                title="Ganti Foto"
              >
                <Camera size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onPhotoFileChange}
                className="hidden"
              />
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-slate-900">{editName || 'Ustadz/Ustadzah'}</h3>
              <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
              <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold">
                <GraduationCap size={14} />
                <span>Wali Kelas: {userData?.assignedClass || userData?.kelas || 'Semua Kelas'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nama Lengkap & Gelar</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email (Terkunci)</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-200 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save size={16} />
            <span>Simpan Perubahan Profil</span>
          </button>
        </form>

        {/* Change Password Section */}
        <div className="pt-8 border-t border-slate-100 space-y-4">
          <div>
            <h4 className="text-base font-bold text-slate-900">Ubah Kata Sandi (Password)</h4>
            <p className="text-xs text-slate-400">Pastikan menggunakan kata sandi yang aman minimal 6 karakter.</p>
          </div>

          <form onSubmit={onChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Password Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Konfirmasi Password Baru</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <Lock size={15} />
              <span>Perbarui Password</span>
            </button>
          </form>
        </div>

        {/* Prominent Logout Section */}
        <div className="pt-8 border-t border-slate-100">
          <div className="bg-rose-50/80 border border-rose-100 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-rose-950">Keluar Sesi Akun</h4>
              <p className="text-xs text-rose-600 mt-0.5">Akhiri sesi akses akun guru di perangkat ini.</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-rose-200 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <LogOut size={16} />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
