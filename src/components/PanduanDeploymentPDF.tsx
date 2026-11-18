import React from 'react';
import { Printer, ArrowLeft, Download, Shield, Database, Globe, Cloud, Server, Key, CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PanduanDeploymentPDF() {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 md:p-8 font-sans">
      {/* Top Action Bar (hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between no-print bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-xs uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-200 transition-all cursor-pointer active:scale-95"
          >
            <Printer size={16} />
            <span>Cetak / Simpan Sebagai PDF</span>
          </button>
        </div>
      </div>

      {/* Document A4 Sheet Body */}
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full">
        {/* Header Document */}
        <div className="border-b-2 border-emerald-600 pb-6 mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mb-3">
            <Shield size={14} /> Dokumen Panduan Resmi SaaS Management RA
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
            PANDUAN TEKNIS DEPLOYMENT & PENJUALAN APLIKASI UNTUK 5 SEKOLAH RA
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-2">
            Infrastruktur Cloud Multi-Tenant Terisolasi • Firebase + IDCloudHost + Cloudflare + Vercel
          </p>
        </div>

        {/* Ringkasan Arsitektur */}
        <div className="mb-8 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
            💡 Konsep Utama: Multi-Instance SaaS (Terima Beres)
          </h3>
          <p className="text-xs leading-relaxed text-slate-600 font-medium">
            Aplikasi di-hosting terpusat oleh Anda. Setiap sekolah RA memiliki <strong>Database Firebase terpisah</strong> dan <strong>Subdomain Web tersendiri</strong> (contoh: <code>alhidayah.domainanda.id</code>). Pihak sekolah tidak menerima file mentah/ZIP, melainkan langsung menerima <strong>URL Web Resmi + Akses Login Master Admin</strong>.
          </p>
        </div>

        {/* Tahap 1 */}
        <div className="mb-8 page-break-inside-avoid">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-md">1</span>
            <h2 className="text-base font-black text-slate-900 uppercase">Tahap 1: Membuat 5 Database Cloud Terpisah di Firebase</h2>
          </div>
          <div className="ml-11 text-xs text-slate-700 space-y-2 font-medium">
            <p>Lakukan langkah ini untuk masing-masing sekolah di <span className="font-bold text-emerald-700">console.firebase.google.com</span>:</p>
            <ol className="list-decimal list-inside space-y-1.5 pl-2 text-slate-600">
              <li>Klik <strong>Add Project</strong> ➔ Buat nama project (Cth: <code>ra-alhidayah-db</code>, <code>ra-alazhar-db</code>, dst).</li>
              <li>Aktifkan <strong>Authentication</strong> ➔ Tab <em>Sign-in method</em> ➔ Enable <strong>Email/Password</strong>.</li>
              <li>Aktifkan <strong>Firestore Database</strong> ➔ Klik <em>Create Database</em> ➔ Mode Production ➔ Region <code>asia-southeast1 (Singapore)</code>.</li>
              <li>Buka <strong>Project Settings ⚙️</strong> ➔ Tambahkan Web App (<code>&lt;/&gt;</code>) ➔ Salin objek <code>firebaseConfig</code>.</li>
            </ol>
          </div>
        </div>

        {/* Tahap 2 */}
        <div className="mb-8 page-break-inside-avoid">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-md">2</span>
            <h2 className="text-base font-black text-slate-900 uppercase">Tahap 2: Ekstrak Source Code dari AI Studio</h2>
          </div>
          <div className="ml-11 text-xs text-slate-700 space-y-2 font-medium">
            <p>1. Klik tombol <strong>Download ZIP / Export Code</strong> di AI Studio Build.</p>
            <p>2. Buka terminal di folder project komputer Anda, lalu jalankan perintah instalasi dependency:</p>
            <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">npm install</pre>
          </div>
        </div>

        {/* Tahap 3 */}
        <div className="mb-8 page-break-inside-avoid">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-md">3</span>
            <h2 className="text-base font-black text-slate-900 uppercase">Tahap 3: Membeli Domain Utama di IDCloudHost</h2>
          </div>
          <div className="ml-11 text-xs text-slate-700 space-y-2 font-medium">
            <p>1. Masuk ke <span className="font-bold text-emerald-700">idcloudhost.com</span> ➔ Beli domain brand SaaS Anda (Cth: <code>siapra.id</code> atau <code>ra-digital.id</code>).</p>
            <p>2. Setelah domain aktif, buka <strong>Client Area IDCloudHost</strong> ➔ Menu <strong>Domain Saya</strong> ➔ <strong>Manage Nameservers</strong> ➔ Pilih <em>Custom Nameservers</em>.</p>
          </div>
        </div>

        {/* Tahap 4 */}
        <div className="mb-8 page-break-inside-avoid">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-md">4</span>
            <h2 className="text-base font-black text-slate-900 uppercase">Tahap 4: Hubungkan Domain ke Cloudflare (SSL HTTPS & Nameserver)</h2>
          </div>
          <div className="ml-11 text-xs text-slate-700 space-y-2 font-medium">
            <p>1. Masuk ke <span className="font-bold text-emerald-700">dash.cloudflare.com</span> ➔ Tambahkan domain (Cth: <code>siapra.id</code>) ➔ Pilih Paket Free ($0).</p>
            <p>2. Salin 2 Nameserver dari Cloudflare (Cth: <code>abby.ns.cloudflare.com</code> dan <code>duke.ns.cloudflare.com</code>).</p>
            <p>3. Tempelkan kedua Nameserver tersebut di menu Manage Nameservers IDCloudHost pada Tahap 3.</p>
          </div>
        </div>

        {/* Tahap 5 & 6 */}
        <div className="mb-8 page-break-inside-avoid">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-md">5</span>
            <h2 className="text-base font-black text-slate-900 uppercase">Tahap 5 & 6: Deploy Web ke Vercel & Subdomain per Sekolah</h2>
          </div>
          <div className="ml-11 text-xs text-slate-700 space-y-3 font-medium">
            <p>1. Buka <span className="font-bold text-emerald-700">vercel.com</span> ➔ Import repository project.</p>
            <p>2. Masukkan <code>firebaseConfig</code> milik masing-masing sekolah pada environment variables.</p>
            <p>3. Di Dashboard Cloudflare ➔ Menu <strong>DNS &gt; Records</strong> ➔ Tambahkan Record Subdomain CNAME:</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase">
                    <th className="border border-slate-200 p-2 text-left">Sekolah RA</th>
                    <th className="border border-slate-200 p-2 text-left">Subdomain DNS</th>
                    <th className="border border-slate-200 p-2 text-left">Target Hosting</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-200 p-2">RA Al-Hidayah</td>
                    <td className="border border-slate-200 p-2 font-mono text-emerald-700">alhidayah.siapra.id</td>
                    <td className="border border-slate-200 p-2 font-mono">cname.vercel-dns.com</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-2">RA Al-Azhar</td>
                    <td className="border border-slate-200 p-2 font-mono text-emerald-700">alazhar.siapra.id</td>
                    <td className="border border-slate-200 p-2 font-mono">cname.vercel-dns.com</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-2">RA Nurul Iman</td>
                    <td className="border border-slate-200 p-2 font-mono text-emerald-700">nuruliman.siapra.id</td>
                    <td className="border border-slate-200 p-2 font-mono">cname.vercel-dns.com</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tahap 7 */}
        <div className="mb-8 page-break-inside-avoid">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-md">7</span>
            <h2 className="text-base font-black text-slate-900 uppercase">Tahap 7: Registrasi Master Admin Pertama & Onboarding</h2>
          </div>
          <div className="ml-11 text-xs text-slate-700 space-y-2 font-medium">
            <p>1. Buka browser ➔ Kunjungi link web sekolah baru: <code>https://alhidayah.siapra.id/login</code>.</p>
            <p>2. Karena database sekolah baru masih kosong, klik tombol <strong>"Registrasi Master Admin Pertama"</strong>.</p>
            <p>3. Daftarkan Nama, Email, Password, dan WhatsApp Kepala Sekolah.</p>
            <p>4. Masuk ke Portal Admin ➔ Menu <strong>Pengaturan</strong> ➔ Upload Logo Resmi RA & Identitas Sekolah.</p>
            <p>5. Klik <strong>"Muat Data Modul Hafalan"</strong> untuk mengisi database hafalan bawaan.</p>
          </div>
        </div>

        {/* Footer Dokumentasi */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <span>Panduan Deployment SaaS Management RA</span>
          <span>Dokumen Resmi &copy; 2026</span>
        </div>
      </div>
    </div>
  );
}
