import React, { useState } from 'react';
import { KemenagLogo } from './KemenagLogo';
import { Lock, User, ShieldCheck, ArrowRight, School, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: { name: string; role: string; schoolName: string }) => void;
  defaultSchoolName?: string;
  schoolLogoUrl?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  defaultSchoolName = '',
  schoolLogoUrl
}) => {
  const [username, setUsername] = useState('kepala_ra');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState<'kepala' | 'pengawas' | 'guru'>('kepala');
  const [schoolName, setSchoolName] = useState(defaultSchoolName || 'Raudhatul Athfal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const roleLabels = {
      kepala: 'Kepala Madrasah / RA',
      pengawas: 'Pengawas / Supervisor',
      guru: 'Guru Pendidik'
    };

    onLogin({
      name: username === 'kepala_ra' ? 'Kepala RA' : username,
      role: roleLabels[role],
      schoolName: schoolName || 'Raudhatul Athfal'
    });
  };

  const handleQuickLogin = (selectedRole: 'kepala' | 'pengawas' | 'guru') => {
    const roleLabels = {
      kepala: 'Kepala Madrasah / RA',
      pengawas: 'Pengawas / Supervisor',
      guru: 'Guru Pendidik'
    };
    const names = {
      kepala: 'Kepala Madrasah / RA',
      pengawas: 'Pengawas Pembina',
      guru: 'Guru RA'
    };

    onLogin({
      name: names[selectedRole],
      role: roleLabels[selectedRole],
      schoolName: schoolName || 'Raudhatul Athfal'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Card */}
        <div className="bg-gradient-to-b from-emerald-800 to-emerald-900 p-8 text-center text-white relative">
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 bg-white rounded-2xl p-2 flex items-center justify-center shadow-lg">
              {schoolLogoUrl && schoolLogoUrl.startsWith('data:image') ? (
                <img
                  src={schoolLogoUrl}
                  alt="Logo Sekolah"
                  className="w-full h-full object-contain"
                />
              ) : (
                <KemenagLogo size={70} />
              )}
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            PKG Raudhatul Athfal
          </h1>
          <p className="text-xs text-emerald-200 mt-1">
            Sistem Penilaian Kinerja Guru (Kepdirjen Pendis 1843/2021)
          </p>
          <div className="mt-3 inline-block px-3 py-1 bg-emerald-700/60 rounded-full text-[11px] font-semibold text-emerald-100 border border-emerald-600/40">
            {schoolName}
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Peran Pengguna (Role)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'kepala', label: 'Kepala RA' },
                  { id: 'pengawas', label: 'Pengawas' },
                  { id: 'guru', label: 'Guru' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id as any)}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all ${
                      role === item.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username / NIP / Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  placeholder="Masukkan username atau NIP"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  placeholder="Masukkan password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>Masuk ke Aplikasi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-center mb-3">
              Masuk Cepat 1-Klik (Mode Demo)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('kepala')}
                className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-lg text-center transition-colors border border-emerald-200"
              >
                Kepala RA
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('pengawas')}
                className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-semibold rounded-lg text-center transition-colors border border-blue-200"
              >
                Pengawas
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('guru')}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg text-center transition-colors border border-slate-200"
              >
                Guru Kelas
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center text-[11px] text-slate-500">
          Aplikasi Siap Digunakan · Standar Kepdirjen Pendis 1843/2021
        </div>
      </div>
    </div>
  );
};
