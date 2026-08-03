import React, { useState } from 'react';
import { X, FolderPlus, Upload, Share2, Link2, CheckCircle2, Video, Smartphone, HelpCircle, ExternalLink, Copy, Check, Info } from 'lucide-react';

interface DriveJuknisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DriveJuknisModal({ isOpen, onClose }: DriveJuknisModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'step1' | 'step2' | 'step3' | 'step4' | 'step5'>('all');

  if (!isOpen) return null;

  const exampleLink = "https://drive.google.com/file/d/1234567890abcdefghijklmnopqrstuvwxyz/view?usp=sharing";

  const handleCopyExample = () => {
    navigator.clipboard.writeText(exampleLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      step: 1,
      title: "Buat Folder di Google Drive",
      icon: <FolderPlus className="w-5 h-5 text-emerald-600" />,
      badgeBg: "bg-emerald-100 text-emerald-800",
      description: "Buka aplikasi Google Drive di HP (Android/iOS) atau laptop. Klik tombol + (Baru) lalu pilih Folder Baru untuk merapikan file setoran ananda.",
      details: [
        "Buka aplikasi Google Drive di HP Ayah/Bunda.",
        "Tekan tombol '+ Baru' (New) di sudut kanan bawah/kiri atas.",
        "Buat nama folder, contoh: 'Setoran Hafalan - [Nama Anak]'."
      ]
    },
    {
      step: 2,
      title: "Upload Video / Rekaman Hafalan",
      icon: <Upload className="w-5 h-5 text-blue-600" />,
      badgeBg: "bg-blue-100 text-blue-800",
      description: "Rekam video/audio ananda saat menghafal, lalu upload file video tersebut ke dalam folder Google Drive yang sudah dibuat.",
      details: [
        "Pastikan video/audio jelas terdengar pelafalan makhraj hurufnya.",
        "Masuk ke folder Drive -> Klik '+ Unggah' (Upload) -> Pilih file video setoran dari galeri HP.",
        "Tunggu hingga proses unggah selesai 100%."
      ]
    },
    {
      step: 3,
      title: "Berikan Akses Bagikan (PENTING)",
      icon: <Share2 className="w-5 h-5 text-amber-600" />,
      badgeBg: "bg-amber-100 text-amber-800",
      description: "Atur izin file agar Ustadz/Ustadzah dapat membuka dan memutar video setoran ananda.",
      details: [
        "Tekan titik tiga (⋮) pada file video atau folder -> Pilih 'Bagikan' (Share).",
        "Di bagian 'Akses Umum' (General Access), ubah 'Dibatasi' (Restricted) menjadi 'Siapa saja yang memiliki link' (Anyone with the link).",
        "Atur perannya sebagai 'Pengakses Lihat' (Viewer) atau 'Editor' agar guru bisa menyimak."
      ]
    },
    {
      step: 4,
      title: "Salin Link Google Drive",
      icon: <Link2 className="w-5 h-5 text-purple-600" />,
      badgeBg: "bg-purple-100 text-purple-800",
      description: "Salin alamat link tautan file video yang sudah diatur akses publiknya.",
      details: [
        "Setelah status berubah jadi 'Siapa saja yang memiliki link', klik tombol 'Salin Link' (Copy Link).",
        "Link otomatis tersimpan di papan klip (clipboard) HP/Laptop Anda."
      ]
    },
    {
      step: 5,
      title: "Tempel Link di Portal & Kirim",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      badgeBg: "bg-emerald-100 text-emerald-800",
      description: "Kembali ke Portal RA Darusyifa, tempelkan (paste) link ke dalam kolom input setoran, lalu klik Konfirmasi Setoran.",
      details: [
        "Buka Portal RA Darusyifa -> Masuk menu Setor Hafalan -> Pilih metode 'Link Drive'.",
        "Tempel (Paste) link Drive di kolom URL yang tersedia.",
        "Tekan tombol 'Konfirmasi Setoran'. Selesai!"
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[400] flex items-center justify-center p-3 sm:p-5 overflow-y-auto notranslate" translate="no">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden my-auto border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 sm:p-6 text-white relative flex-shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-sm">
              <HelpCircle size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Petunjuk Teknis (Juknis)</span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Setoran Hafalan via Google Drive</h2>
            </div>
          </div>
          <p className="text-xs text-emerald-100/90 font-medium leading-relaxed max-w-xl">
            Panduan lengkap 5 langkah mudah mengunggah video/audio setoran hafalan ke Google Drive hingga berhasil dikirim ke Portal Guru.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Quick Info Box */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3 text-emerald-900">
            <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold block mb-0.5 text-emerald-950">Mengapa Menggunakan Google Drive?</span>
              Video rekaman hafalan berukuran besar tidak disarankan diupload langsung agar HP hemat kuota dan tidak lemot. Menggunakan link Google Drive membuat proses pengiriman super cepat dan jernih!
            </div>
          </div>

          {/* Timeline Steps */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Langkah-Langkah Pengiriman (5 Step)</h3>
            
            <div className="space-y-3">
              {steps.map((item) => (
                <div 
                  key={item.step}
                  className="bg-slate-50/80 hover:bg-white border border-slate-200/70 rounded-2xl p-4 sm:p-5 transition-all hover:shadow-md hover:border-emerald-300 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-all">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.badgeBg}`}>
                          Langkah {item.step}
                        </span>
                        <h4 className="font-bold text-sm text-slate-800">{item.title}</h4>
                      </div>
                      
                      <p className="text-xs text-slate-600 font-medium leading-relaxed mb-2">
                        {item.description}
                      </p>

                      <ul className="space-y-1 bg-white p-3 rounded-xl border border-slate-100 text-[11px] text-slate-600">
                        {item.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Example Format Box */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">Contoh Format Link Google Drive</span>
              <button 
                onClick={handleCopyExample}
                className="text-[11px] font-bold text-slate-300 hover:text-white bg-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copied ? 'Tersalin' : 'Salin Contoh'}</span>
              </button>
            </div>
            <p className="font-mono text-xs text-slate-300 break-all bg-black/40 p-3 rounded-xl border border-white/10">
              {exampleLink}
            </p>
            <p className="text-[10px] text-slate-400 italic">
              *Pastikan pada link terdapat kata <span className="text-emerald-300 font-bold">drive.google.com</span> dan status akses di-set publik (Anyone with link).
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center flex-shrink-0">
          <span className="text-[11px] font-medium text-slate-500">
            Butuh bantuan teknis? Hubungi <span className="font-bold text-emerald-700">Wali Kelas</span>.
          </span>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-200 active:scale-95"
          >
            Paham, Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
