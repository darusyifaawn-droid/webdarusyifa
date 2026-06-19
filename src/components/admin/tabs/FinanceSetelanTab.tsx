import React from 'react';
import { Settings, RefreshCw, Calendar, Download, Shield } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';

interface FinanceSetelanTabProps {
  setShowCategoryModal: (val: boolean) => void;
  handleResetAllFinance: () => void;
  exportFinanceToExcel: () => void;
  settings: any;
  setSettings: (val: any) => void;
}

export default function FinanceSetelanTab({
  setShowCategoryModal,
  handleResetAllFinance,
  exportFinanceToExcel,
  settings,
  setSettings
}: FinanceSetelanTabProps) {
  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Category Management Card */}
        <div 
          onClick={() => setShowCategoryModal(true)}
          className="bg-white border border-gray-100 p-6 sm:p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
            <Settings size={28} className="sm:w-8 sm:h-8" />
          </div>
          <h4 className="text-lg sm:text-xl font-black text-gray-800 tracking-tight mb-2">Manajemen Grup Iuran</h4>
          <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
            Kelola kategori tagihan seperti SPP, Uang Makan, Seragam, dll.
          </p>
        </div>

        {/* Reset Finance Card */}
        <div 
          onClick={handleResetAllFinance}
          className="bg-white border border-gray-100 p-6 sm:p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-red-100 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
            <RefreshCw size={28} className="sm:w-8 sm:h-8" />
          </div>
          <h4 className="text-lg sm:text-xl font-black text-gray-800 tracking-tight mb-2">Reset Keuangan</h4>
          <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
            Kosongkan seluruh saldo tabungan dan tunggakan siswa (Hati-hati).
          </p>
        </div>

        {/* Backup Card */}
        <div 
          onClick={exportFinanceToExcel}
          className="bg-white border border-gray-100 p-6 sm:p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
            <Download size={28} className="sm:w-8 sm:h-8" />
          </div>
          <h4 className="text-lg sm:text-xl font-black text-gray-800 tracking-tight mb-2">Backup Rekap Lengkap</h4>
          <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
            Unduh seluruh data keuangan ke dalam format Excel (XLSX).
          </p>
        </div>

        {/* Academic Year Management Card */}
        <div className="bg-white border border-gray-100 p-6 sm:p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
            <Calendar size={28} className="sm:w-8 sm:h-8" />
          </div>
          <h4 className="text-lg sm:text-xl font-black text-gray-800 tracking-tight mb-2">Periode Akademik</h4>
          <div className="space-y-4">
            <input 
              type="text" 
              value={settings.academicYear || ''} 
              onChange={async (e) => {
                const newYear = e.target.value;
                setSettings((prev: any) => ({ ...prev, academicYear: newYear }));
                await updateDoc(doc(db, 'settings', 'landingPage'), { academicYear: newYear });
              }}
              placeholder="Contoh: 2024/2025"
              className="w-full text-[10px] sm:text-xs p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 font-black text-gray-700"
            />
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
              Tahun ajaran aktif yang akan otomatis digunakan pada tagihan baru.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h4 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-3">
            <Shield size={28} className="text-indigo-400" /> Keamanan Database Keuangan
          </h4>
          <p className="text-indigo-200/70 text-sm max-w-xl font-medium">
            Gunakan menu setelan untuk melakukan tutup buku tahunan atau membersihkan data lama. Pastikan Anda melakukan backup data secara rutin sebelum melakukan perubahan besar.
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
