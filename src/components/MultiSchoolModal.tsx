import React from 'react';
import { School, Database, Globe, Shield, X, CheckCircle2, Download, ExternalLink, Lightbulb } from 'lucide-react';

interface MultiSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSchoolName: string;
}

export const MultiSchoolModal: React.FC<MultiSchoolModalProps> = ({
  isOpen,
  onClose,
  currentSchoolName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Panduan Sistem Multi-Sekolah (Multi-Tenant)
              </h3>
              <p className="text-xs text-slate-500">
                Cara agar sekolah lain bisa menggunakan aplikasi tanpa data tercampur
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed flex-1">
          {/* Highlight Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-900 text-sm block">
                Pertanyaan: &ldquo;Bagaimana agar sistem sekolah lain tidak tercampur dengan sekolah kita?&rdquo;
              </span>
              <p className="text-emerald-800 mt-1">
                Berikut adalah 3 metode arsitektur terbaik yang bisa Anda terapkan mulai dari yang paling mudah dan gratis hingga standar enterprise:
              </p>
            </div>
          </div>

          {/* Opsi 1 */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                1
              </span>
              <h4 className="font-bold text-sm text-slate-900">
                Metode 1: Browser-Level / Ekspor Cadangan File Mandiri (Paling Mudah & Aman)
              </h4>
            </div>
            <p className="text-slate-600 mb-2">
              Saat ini data disimpan di <strong>Local Storage browser</strong> masing-masing pengguna.
            </p>
            <ul className="space-y-1.5 pl-2 list-none">
              <li className="flex items-start gap-1.5 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Otomatis Terpisah di Laptop/HP masing-masing:</strong> Jika RA A membuka link di komputer mereka dan RA B membuka di komputer mereka, data mereka 100% terpisah dan tidak akan pernah tercampur.</span>
              </li>
              <li className="flex items-start gap-1.5 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Gunakan Fitur Ekspor/Impor JSON:</strong> Setiap operator RA bisa mengunduh file cadangan sekolahnya (misal: <code>Data_PKG_RA_AlIkhlas.json</code>) lalu menghapus atau mereset untuk mengisi sekolah lain jika menggunakan 1 laptop yang sama.</span>
              </li>
            </ul>
          </div>

          {/* Opsi 2 */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                2
              </span>
              <h4 className="font-bold text-sm text-slate-900">
                Metode 2: Deploy Mandiri per RA di Cloudflare Pages (White-Label Gratis)
              </h4>
            </div>
            <p className="text-slate-600 mb-2">
              Anda bisa menduplikasi proyek ini dan mendeploy link khusus untuk masing-masing sekolah:
            </p>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 space-y-1">
              <div>• <code>ra-alikhlas.pages.dev</code> (khusus RA Al-Ikhlas)</div>
              <div>• <code>ra-nurulhuda.pages.dev</code> (khusus RA Nurul Huda)</div>
              <div>• <code>ra-darussalam.pages.dev</code> (khusus RA Darussalam)</div>
            </div>
            <p className="text-slate-500 mt-2">
              Keuntungannya gratis di Cloudflare Pages tanpa biaya hosting dan logo/kop surat sudah terkunci default untuk sekolah tersebut.
            </p>
          </div>

          {/* Opsi 3 */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-xs">
                3
              </span>
              <h4 className="font-bold text-sm text-slate-900">
                Metode 3: Cloud Database Multi-Tenant (Berdasarkan NSM / Akun Sekolah)
              </h4>
            </div>
            <p className="text-slate-600 mb-2">
              Jika ingin 1 link yang sama digunakan oleh puluhan sekolah se-Kabupaten/Kota secara online:
            </p>
            <ul className="space-y-1.5 pl-2 list-none">
              <li className="flex items-start gap-1.5 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>Gunakan database Firestore/PostgreSQL dengan partisi unik <strong>NSM (Nomor Statistik Madrasah)</strong> atau ID Sekolah.</span>
              </li>
              <li className="flex items-start gap-1.5 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>Saat login dengan akun NSM sekolah A, sistem hanya membaca dan menyimpan dokumen milik NSM sekolah A, sehingga data sekolah B tidak dapat diakses sama sekali.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Lembaga Aktif: <strong>{currentSchoolName}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
