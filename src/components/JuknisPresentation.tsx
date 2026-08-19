import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 ArrowLeft, ArrowRight, Play, Pause, RotateCcw, Printer, 
 LogIn, BookOpen, Star, CheckCircle, CreditCard, Bell, 
 User, Check, Phone, Laptop, Compass, Heart, Award, 
 Calendar, Eye, HelpCircle, HelpCircle as QuestionIcon,
 Share2, Upload, FolderPlus, Link2, CheckCircle2
} from 'lucide-react';
import DriveJuknisModal from './DriveJuknisModal';
import { motion, AnimatePresence } from 'motion/react';

interface Slide {
 id: number;
 title: string;
 subtitle: string;
 category: string;
 icon: React.ReactNode;
 content: string[];
 tips?: string;
 mockup: 'login' | 'dashboard' | 'hafalan' | 'drive-juknis' | 'progress' | 'absensi' | 'administrasi' | 'penutup';
}

export default function JuknisPresentation() {
 const navigate = useNavigate();
 const [currentSlide, setCurrentSlide] = useState(0);
 const [isPlaying, setIsPlaying] = useState(false);
 const [viewMode, setViewMode] = useState<'presentation' | 'document'>('presentation');

 const slides: Slide[] = [
 {
 id: 0,
 title: "Panduan Teknis Portal RA Darusyifa",
 subtitle: "Sosialisasi & Petunjuk Penggunaan Aplikasi untuk Orang Tua / Wali Murid",
 category: "PENDAHULUAN",
 icon: <Award className="text-emerald-600 w-12 h-12" />,
 content: [
 "Selamat datang di Portal Digital RA Darusyifa Arjawinangun.",
 "Aplikasi ini dirancang khusus untuk mempermudah Ayah & Bunda dalam mendampingi tumbuh kembang serta administrasi buah hati secara praktis dan transparan.",
 "Presentasi ini akan memandu Ayah & Bunda memahami cara masuk sistem dan memanfaatkan setiap fitur unggulan yang tersedia."
 ],
 tips: "Gunakan tombol PANAH KANAN di keyboard atau layar untuk berpindah ke slide berikutnya.",
 mockup: 'login'
 },
 {
 id: 1,
 title: "1. Cara Masuk (Login) ke Portal",
 subtitle: "Langkah mudah mengakses akun putra-putri Ayah & Bunda",
 category: "AKSES MASUK",
 icon: <LogIn className="text-emerald-600 w-12 h-12" />,
 content: [
 "Gunakan alamat email siswa fake/resmi dan kata sandi default (bawaan) yang telah dibagikan oleh Wali Kelas.",
 "Masukkan email siswa pada kolom 'Email' dan kata sandi default pada kolom 'Password' (bawaan: 123456).",
 "Klik tombol 'Masuk Portal' berwarna hijau.",
 "Jika menemui kendala, Wali Kelas atau Admin Sekolah dapat langsung mereset kata sandi Anda dan langsung aktif detik itu juga!"
 ],
 tips: "Akun siswa dibuatkan langsung oleh Admin sekolah. Anda tidak perlu mendaftar ulang secara mandiri.",
 mockup: 'login'
 },
 {
 id: 2,
 title: "2. Menjelajah Beranda Siswa",
 subtitle: "Halaman utama pemantauan aktivitas harian siswa",
 category: "BERANDA",
 icon: <User className="text-emerald-600 w-12 h-12" />,
 content: [
 "Setelah masuk, Anda akan langsung disuguhkan dengan Dashboard utama siswa.",
 "Terdapat ringkasan kehadiran hari ini, status hafalan terakhir, dan total tagihan administrasi.",
 "Ayah & Bunda juga bisa melihat Profil lengkap anak, Kalender Akademik (Kaldik) sekolah, serta Pengumuman terbaru dari sekolah.",
 "Semua info penting dapat diakses dari menu 'Beranda' ini."
 ],
 tips: "Pastikan nama lengkap dan WhatsApp Wali yang tercantum di profil sudah sesuai dengan data Anda.",
 mockup: 'dashboard'
 },
 {
 id: 3,
 title: "3. Memantau Hafalan Al-Qur'an (Tahfidz)",
 subtitle: "Fitur utama bimbingan hafalan surat pendek, doa & hadits harian",
 category: "MODUL HAFALAN",
 icon: <Star className="text-emerald-600 w-12 h-12" />,
 content: [
 "Siswa RA Darusyifa dibekali target hafalan Al-Qur'an (Juz Amma), doa harian, dan hadits pilihan.",
 "Di menu 'Modul Hafalan', Ayah & Bunda dapat melihat daftar target materi secara urut.",
 "Setiap materi memiliki indikator status: 'Belum Mulai' (abu-abu), 'Sedang Menghafal' (kuning), atau 'Sudah Selesai/Lancar' (hijau).",
 "Ayah & Bunda bisa membaca Catatan Guru tahfidz tentang perkembangan kelancaran bacaan anak."
 ],
 tips: "Ayah & Bunda bisa mendampingi anak menghafal di rumah sesuai dengan daftar target hafalan yang sedang aktif.",
 mockup: 'hafalan'
 },
 {
 id: 4,
 title: "4. Juknis Setoran via Google Drive",
 subtitle: "Petunjuk 5 langkah mudah mengunggah video/audio setoran ke Google Drive",
 category: "JUKNIS DRIVE",
 icon: <Share2 className="text-emerald-600 w-12 h-12" />,
 content: [
 "1. Buat Folder Drive: Buka Google Drive di HP/Laptop, buat folder khusus 'Setoran Hafalan Ananda'.",
 "2. Upload Video Setoran: Rekam video hafalan ananda di rumah, lalu unggah file video ke Google Drive.",
 "3. Berikan Akses Publik (PENTING): Tekan titik tiga (⋮) -> Bagikan (Share) -> Ubah 'Dibatasi' ke 'Siapa saja yang memiliki link' (Viewer/Editor).",
 "4. Salin Link Drive: Tekan tombol 'Salin Link' (Copy Link).",
 "5. Tempel di Portal: Masuk Portal -> Menu Hafalan -> Opsi Link Drive -> Tempel (Paste) link & Klik Konfirmasi Setoran."
 ],
 tips: "Pastikan status link diubah dari 'Dibatasi' ke 'Siapa saja yang memiliki link' agar Ustadz/Ustadzah dapat memutar video setoran.",
 mockup: 'drive-juknis'
 },
 {
 id: 5,
 title: "5. Laporan Hasil Belajar (Progress)",
 subtitle: "Catatan perkembangan akademis, karakter, dan motorik anak",
 category: "LAPORAN BELAJAR",
 icon: <BookOpen className="text-emerald-600 w-12 h-12" />,
 content: [
 "Aktivitas belajar mengajar harian anak dinilai langsung secara digital oleh Guru.",
 "Di menu 'Laporan Belajar', Ayah & Bunda dapat melihat perkembangan kemampuan kognitif, motorik, seni, bahasa, agama, dan karakter.",
 "Guru akan menyertakan catatan deskriptif khusus mengenai pencapaian dan dukungan yang dibutuhkan anak.",
 "Laporan dikemas rapi dan mudah dibaca tanpa harus menunggu rapor fisik akhir semester."
 ],
 tips: "Gunakan menu ini untuk mendiskusikan perkembangan belajar harian anak dengan bimbingan penuh kasih sayang di rumah.",
 mockup: 'progress'
 },
 {
 id: 6,
 title: "6. Memantau Riwayat Kehadiran (Absensi)",
 subtitle: "Memastikan kehadiran dan kedisiplinan belajar anak",
 category: "ABSENSI",
 icon: <CheckCircle className="text-emerald-600 w-12 h-12" />,
 content: [
 "Guru melakukan presensi kehadiran siswa setiap pagi sebelum pelajaran dimulai.",
 "Di menu 'Riwayat Absensi', orang tua dapat melihat rekap kehadiran secara real-time.",
 "Status kehadiran dibagi menjadi: 'Hadir' (Hijau), 'Sakit' (Kuning/Biru), 'Izin' (Kuning), dan 'Alfa/Tanpa Keterangan' (Merah).",
 "Membantu Ayah & Bunda memastikan anak telah sampai di RA Darusyifa dengan selamat."
 ],
 tips: "Jika anak berhalangan hadir karena sakit atau ada keperluan penting, mohon informasikan segera ke Wali Kelas agar dicatat dengan benar di sistem.",
 mockup: 'absensi'
 },
 {
 id: 7,
 title: "7. Kemudahan Administrasi & Pembayaran",
 subtitle: "Transparansi iuran bulanan, SPP, dan tabungan iuran sekolah",
 category: "KEUANGAN & ADMINISTRASI",
 icon: <CreditCard className="text-emerald-600 w-12 h-12" />,
 content: [
 "Di menu 'Administrasi', Ayah & Bunda dapat melihat seluruh rincian tagihan sekolah seperti SPP, uang buku, seragam, atau infak pembangunan.",
 "Menampilkan rincian nominal tagihan, jumlah yang sudah dibayar, serta sisa kekurangan pembayaran.",
 "Setiap kali Anda membayar ke sekolah, petugas keuangan akan menginputnya, dan status pembayaran Anda akan terupdate secara real-time.",
 "Riwayat transaksi pembayaran tersimpan rapi dan dapat diunduh kapan saja sebagai tanda bukti yang sah."
 ],
 tips: "Semua transaksi keuangan tercatat aman dan otomatis untuk menghindari kesalahan atau keterlambatan laporan.",
 mockup: 'administrasi'
 },
 {
 id: 7,
 title: "Membangun Sinergi Sekolah & Keluarga",
 subtitle: "RA Darusyifa Arjawinangun - Cerdas, Ceria, Berakhlak Mulia",
 category: "PENUTUP",
 icon: <Heart className="text-emerald-600 w-12 h-12" />,
 content: [
 "Pendidikan anak usia dini terbaik lahir dari kerja sama yang harmonis antara Sekolah dan Orang Tua di Rumah.",
 "Portal digital ini hadir bukan untuk menggantikan interaksi fisik, melainkan untuk mempererat sinergi dan komunikasi bimbingan anak.",
 "Mari bersama-sama kita antarkan putra-putri kita menjadi generasi rabbani yang cerdas, mandiri, kreatif, dan berakhlakul karimah.",
 "Terima kasih atas kepercayaan Ayah & Bunda kepada RA Darusyifa."
 ],
 tips: "Hubungi Wali Kelas atau Layanan Pengaduan RA Darusyifa jika Ayah & Bunda membutuhkan bantuan teknis lebih lanjut.",
 mockup: 'penutup'
 }
 ];

 useEffect(() => {
 let interval: NodeJS.Timeout;
 if (isPlaying) {
 interval = setInterval(() => {
 setCurrentSlide((prev) => (prev + 1) % slides.length);
 }, 5000);
 }
 return () => clearInterval(interval);
 }, [isPlaying, slides.length]);

 const handleNext = () => {
 setCurrentSlide((prev) => (prev + 1) % slides.length);
 };

 const handlePrev = () => {
 setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
 };

 const handleKeyDown = (e: KeyboardEvent) => {
 if (viewMode === 'document') return;
 if (e.key === 'ArrowRight') handleNext();
 if (e.key === 'ArrowLeft') handlePrev();
 if (e.key === ' ') {
 e.preventDefault();
 setIsPlaying(!isPlaying);
 }
 };

 useEffect(() => {
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [viewMode, isPlaying]);

 const handlePrint = () => {
 window.print();
 };

 // Render mockups based on step to make presentation super interactive
 const renderMockup = (type: string) => {
 switch (type) {
 case 'login':
 return (
 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-md w-full max-w-sm mx-auto">
 <div className="flex items-center justify-center gap-2 mb-6">
 <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">RA</div>
 <span className="font-bold text-green-800 text-sm">RA Darusyifa</span>
 </div>
 <div className="text-center mb-4">
 <h4 className="text-base font-bold text-gray-800 ">Masuk Portal Siswa</h4>
 <p className="text-xs text-gray-500">Gunakan akun yang telah dibagikan</p>
 </div>
 <div className="space-y-3">
 <div>
 <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Email Siswa</label>
 <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-400 flex items-center gap-2">
 <LogIn size={14} className="text-gray-400" />
 <span>siswa@darusyifa.com</span>
 </div>
 </div>
 <div>
 <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Password</label>
 <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-400 flex items-center justify-between">
 <span className="font-mono">••••••</span>
 <span className="text-[10px] text-green-600 font-bold">Tampilkan</span>
 </div>
 </div>
 <button className="w-full bg-green-600 text-white rounded-lg py-2.5 text-xs font-bold shadow-md shadow-green-100 hover:bg-green-700 transition-all mt-4">
 Masuk Portal
 </button>
 <div className="text-center mt-3">
 <span className="text-[10px] text-slate-500 hover:underline cursor-pointer">Lupa Password? Hubungi Wali Kelas</span>
 </div>
 </div>
 </div>
 );
 case 'dashboard':
 return (
 <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md w-full max-w-md mx-auto">
 <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">A</div>
 <div>
 <h4 className="text-xs font-bold text-gray-800 ">Ahmad Fauzan</h4>
 <p className="text-[9px] text-gray-500">Siswa Kelas UTSMAN BIN AFFAN</p>
 </div>
 </div>
 <span className="bg-green-100 text-green-800 text-[9px] px-2 py-0.5 rounded-full font-bold">AKTIF</span>
 </div>
 <div className="grid grid-cols-3 gap-2.5 mb-3">
 <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-center">
 <span className="block text-[9px] text-emerald-700 font-medium">Hadir Bulan Ini</span>
 <span className="text-base font-black text-emerald-900">96%</span>
 </div>
 <div className="bg-yellow-50 border border-yellow-100 p-2.5 rounded-xl text-center">
 <span className="block text-[9px] text-yellow-700 font-medium">Target Hafalan</span>
 <span className="text-base font-black text-yellow-900">4 / 10</span>
 </div>
 <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-center">
 <span className="block text-[9px] text-blue-700 font-medium">Status SPP</span>
 <span className="text-base font-black text-blue-900">LUNAS</span>
 </div>
 </div>
 <div className="border border-slate-100 rounded-xl p-3 bg-slate-50">
 <h5 className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
 <Bell size={12} className="text-green-600" /> Pengumuman Terbaru
 </h5>
 <div className="bg-white border border-slate-100 rounded-lg p-2 text-[10px] text-gray-600">
 <span className="font-bold text-green-700 block mb-0.5">Pertemuan Wali Murid Semester Ganjil</span>
 Diharapkan kehadiran seluruh Ayah & Bunda pada hari Sabtu ini pukul 08.00 WIB...
 </div>
 </div>
 </div>
 );
 case 'hafalan':
 return (
 <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md w-full max-w-md mx-auto">
 <h4 className="text-xs font-bold text-gray-800 mb-2.5 flex items-center gap-1.5">
 <Star size={14} className="text-yellow-500 fill-yellow-400" /> Perkembangan Hafalan Tahfidz
 </h4>
 <div className="space-y-2">
 <div className="border border-green-100 bg-green-50/50 p-2.5 rounded-xl flex items-center justify-between">
 <div>
 <span className="text-xs font-bold text-gray-800 ">Q.S. An-Nas (Surat Pendek)</span>
 <p className="text-[9px] text-gray-500">Target Semester Ganjil</p>
 </div>
 <span className="bg-green-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
 <Check size={10} /> Lancar
 </span>
 </div>
 <div className="border border-yellow-100 bg-yellow-50/50 p-2.5 rounded-xl flex items-center justify-between">
 <div>
 <span className="text-xs font-bold text-gray-800 ">Q.S. Al-Falaq</span>
 <p className="text-[9px] text-gray-500">Materi Hafalan Aktif</p>
 </div>
 <span className="bg-yellow-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
 Sedang Menghafal
 </span>
 </div>
 <div className="border border-slate-100 bg-slate-50 p-2.5 rounded-xl flex items-center justify-between">
 <div>
 <span className="text-xs font-bold text-slate-500">Q.S. Al-Ikhlas</span>
 <p className="text-[9px] text-slate-400">Target Berikutnya</p>
 </div>
 <span className="bg-slate-200 text-slate-600 text-[9px] px-2 py-0.5 rounded-full font-bold">
 Belum Mulai
 </span>
 </div>
 <div className="border-t border-slate-100 pt-2.5 mt-2.5">
 <span className="text-[9px] font-bold text-gray-600 block mb-1">Catatan Bimbingan Guru:</span>
 <p className="text-[10px] text-gray-600 italic bg-amber-50 border border-amber-100 p-2 rounded-lg">
 "Alhamdulillah Fauzan sudah lancar membaca surat An-Nas. Untuk Al-Falaq mohon dibimbing kembali pelafalan makhraj huruf 'Ain di rumah nggih Bunda."
 </p>
 </div>
 </div>
 </div>
 );
 case 'drive-juknis':
 return (
 <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md w-full max-w-md mx-auto space-y-3">
 <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
 <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
 <Share2 size={14} className="text-emerald-600" /> Alur Setoran Google Drive
 </h4>
 <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full font-extrabold">5 Step</span>
 </div>
 
 <div className="space-y-2 text-[10px]">
 <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl flex items-center gap-2">
 <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[9px] flex-shrink-0">1</span>
 <div>
 <span className="font-bold text-slate-800 block">Buat Folder Drive</span>
 <span className="text-slate-500">Buka Drive & buat folder setoran</span>
 </div>
 </div>

 <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl flex items-center gap-2">
 <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[9px] flex-shrink-0">2</span>
 <div>
 <span className="font-bold text-slate-800 block">Upload Video Hafalan</span>
 <span className="text-slate-500">Unggah file video/audio ananda</span>
 </div>
 </div>

 <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl flex items-center gap-2">
 <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-[9px] flex-shrink-0">3</span>
 <div>
 <span className="font-bold text-amber-900 block">Atur Akses 'Siapa saja link'</span>
 <span className="text-amber-700 font-bold">Wajib di-set Publik (Viewer/Editor)</span>
 </div>
 </div>

 <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl flex items-center gap-2">
 <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[9px] flex-shrink-0">4</span>
 <div>
 <span className="font-bold text-slate-800 block">Salin Link Drive</span>
 <span className="text-slate-500">Klik 'Copy Link' dari Drive</span>
 </div>
 </div>

 <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl flex items-center gap-2">
 <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-[9px] flex-shrink-0">5</span>
 <div>
 <span className="font-bold text-emerald-900 block">Tempel Link & Kirim</span>
 <span className="text-emerald-700">Paste di Portal & Konfirmasi</span>
 </div>
 </div>
 </div>
 </div>
 );
 case 'progress':
 return (
 <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md w-full max-w-md mx-auto">
 <h4 className="text-xs font-bold text-gray-800 mb-2.5 flex items-center gap-1.5">
 <BookOpen size={14} className="text-green-600" /> Evaluasi Progress Pembelajaran Harian
 </h4>
 <div className="space-y-2">
 <div className="p-2.5 border border-slate-100 rounded-xl bg-slate-50/50">
 <div className="flex justify-between items-center mb-1">
 <span className="text-xs font-bold text-gray-800 ">Aspek Keagamaan & Moral</span>
 <span className="text-[9px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-bold">BSB (Berkembang Sangat Baik)</span>
 </div>
 <p className="text-[9px] text-gray-500">Siswa aktif mengikuti doa pagi bersama dan wudhu tanpa bimbingan berlebih.</p>
 </div>
 <div className="p-2.5 border border-slate-100 rounded-xl bg-slate-50/50">
 <div className="flex justify-between items-center mb-1">
 <span className="text-xs font-bold text-gray-800 ">Aspek Motorik Halus (Seni)</span>
 <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold">BSH (Berkembang Sesuai Harapan)</span>
 </div>
 <p className="text-[9px] text-gray-500">Mampu menggunting kertas pola lurus dan mewarnai dengan cukup rapi.</p>
 </div>
 <div className="p-2.5 border border-slate-100 rounded-xl bg-slate-50/50">
 <div className="flex justify-between items-center mb-1">
 <span className="text-xs font-bold text-gray-800 ">Aspek Kemandirian</span>
 <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">MB (Mulai Berkembang)</span>
 </div>
 <p className="text-[9px] text-gray-500">Sudah mulai berani merapikan tas dan bekal makanannya sendiri seusai istirahat.</p>
 </div>
 </div>
 </div>
 );
 case 'absensi':
 return (
 <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md w-full max-w-sm mx-auto">
 <h4 className="text-xs font-bold text-gray-800 mb-2.5">Presensi Bulan Juli 2026</h4>
 <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] mb-2.5 font-bold text-gray-500">
 <span>Sn</span><span>Sl</span><span>Rb</span><span>Km</span><span>Jm</span><span className="text-red-500">Sb</span><span className="text-red-500">Mg</span>
 </div>
 <div className="grid grid-cols-7 gap-1.5 text-center text-[10px]">
 {Array.from({ length: 14 }).map((_, i) => {
 const day = i + 1;
 const isWeekend = day % 7 === 6 || day % 7 === 0;
 let bgClass = "bg-green-100 text-green-800 font-bold border border-green-200";
 let text = "H";
 if (isWeekend) {
 bgClass = "bg-red-50 text-red-500 border border-red-100";
 text = "L";
 } else if (day === 3) {
 bgClass = "bg-yellow-100 text-yellow-800 font-bold border border-yellow-200";
 text = "I";
 } else if (day === 10) {
 bgClass = "bg-blue-100 text-blue-800 font-bold border border-blue-200";
 text = "S";
 }
 return (
 <div key={i} className={`p-1.5 rounded-lg ${bgClass} flex flex-col items-center`}>
 <span className="text-[8px] opacity-70 block">{day}</span>
 <span className="text-xs font-extrabold">{text}</span>
 </div>
 );
 })}
 </div>
 <div className="flex gap-2 mt-3 pt-2.5 border-t border-slate-100 text-[8px] justify-center text-slate-600 font-bold uppercase tracking-wider">
 <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-green-100 border border-green-200 block"></span> Hadir</span>
 <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-100 border border-blue-200 block"></span> Sakit</span>
 <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-yellow-100 border border-yellow-200 block"></span> Izin</span>
 <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-100 border border-red-200 block"></span> Alfa</span>
 </div>
 </div>
 );
 case 'administrasi':
 return (
 <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md w-full max-w-md mx-auto">
 <h4 className="text-xs font-bold text-gray-800 mb-2.5">Tagihan & Riwayat Administrasi</h4>
 <div className="border border-slate-100 rounded-xl bg-slate-50 p-2.5 mb-2.5">
 <span className="text-[9px] text-gray-500 block">Sisa Tagihan Aktif</span>
 <span className="text-base font-black text-red-600">Rp 150.000</span>
 <p className="text-[8px] text-slate-500 mt-0.5">Tagihan Iuran SPP Bulan Juli 2026</p>
 </div>
 <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Riwayat Transaksi Terbaru</span>
 <div className="space-y-1.5">
 <div className="bg-white border border-slate-100 rounded-lg p-2 text-[10px] flex justify-between items-center">
 <div>
 <span className="font-bold text-gray-800 ">Pembayaran SPP Juni 2026</span>
 <p className="text-[8px] text-gray-400">12 Juni 2026 - Tunai ke Bendahara</p>
 </div>
 <div className="text-right">
 <span className="font-black text-green-700">Rp 150.000</span>
 <span className="block text-[8px] bg-green-100 text-green-800 px-1 py-0.2 rounded font-bold mt-0.5">LUNAS</span>
 </div>
 </div>
 <div className="bg-white border border-slate-100 rounded-lg p-2 text-[10px] flex justify-between items-center">
 <div>
 <span className="font-bold text-gray-800 ">Pembelian Seragam & Atribut</span>
 <p className="text-[8px] text-gray-400">05 Juni 2026 - Transfer Bank</p>
 </div>
 <div className="text-right">
 <span className="font-black text-green-700">Rp 350.000</span>
 <span className="block text-[8px] bg-green-100 text-green-800 px-1 py-0.2 rounded font-bold mt-0.5">LUNAS</span>
 </div>
 </div>
 </div>
 </div>
 );
 default:
 return (
 <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl p-6 text-white text-center shadow-lg w-full max-w-sm mx-auto flex flex-col items-center justify-center min-h-[220px]">
 <Heart size={44} className="text-yellow-300 fill-yellow-200 animate-pulse mb-3" />
 <h4 className="text-sm font-bold">RA Darusyifa Arjawinangun</h4>
 <p className="text-xs text-green-100 mt-1 max-w-xs leading-relaxed">
 Mendidik dengan Hati, Membentuk Generasi Qurani yang Berakhlak Karimah.
 </p>
 <div className="mt-4 flex gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/20 text-[10px] font-bold">
 <span>Cerdas</span>•<span>Ceria</span>•<span>Kreatif</span>•<span>Mandiri</span>
 </div>
 </div>
 );
 }
 };

 return (
 <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12 flex flex-col">
 {/* Header Panel */}
 <header className="bg-white border-b border-slate-200 py-3 sm:py-4 px-4 sm:px-6 sticky top-0 z-40 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
 <div className="flex items-center justify-between sm:justify-start gap-3">
 <div className="flex items-center gap-2 sm:gap-3">
 <button 
 onClick={() => navigate('/login')} 
 className="p-2 hover:bg-slate-100 rounded-xl transition-all border border-slate-100 flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-600 font-bold"
 >
 <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
 <span className="hidden xs:inline">Kembali</span>
 </button>
 <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>
 <div>
 <h1 className="text-xs sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 leading-tight">
 <span className="text-green-600">Juknis</span> <span className="hidden xs:inline">Wali Murid</span>
 </h1>
 <p className="text-[9px] text-slate-400 hidden sm:block font-medium">Petunjuk Teknis Sosialisasi Penggunaan Portal Digital</p>
 </div>
 </div>

 <button 
 onClick={handlePrint} 
 className="sm:hidden p-2 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 text-[10px] font-bold bg-white"
 >
 <Printer size={14} />
 </button>
 </div>

 <div className="flex items-center gap-2">
 {/* View Mode Selectors */}
 <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200 flex-1 sm:flex-none">
 <button 
 onClick={() => setViewMode('presentation')}
 className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 ${viewMode === 'presentation' ? 'bg-white text-green-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900 '}`}
 >
 <Laptop size={12} className="sm:w-[14px] sm:h-[14px]" />
 <span>Slide</span>
 </button>
 <button 
 onClick={() => setViewMode('document')}
 className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 ${viewMode === 'document' ? 'bg-white text-green-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900 '}`}
 >
 <BookOpen size={12} className="sm:w-[14px] sm:h-[14px]" />
 <span>Buku</span>
 </button>
 </div>

 <button 
 onClick={handlePrint} 
 className="hidden sm:flex p-2 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all items-center gap-1.5 text-xs font-bold bg-white"
 title="Cetak Panduan Lengkap"
 >
 <Printer size={15} />
 <span className="hidden md:inline">Cetak / PDF</span>
 </button>
 </div>
 </header>

 {/* Main Content Area */}
 <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 mt-4 sm:mt-6">
 <AnimatePresence mode="wait">
 {viewMode === 'presentation' ? (
 <motion.div 
 key="presentation-mode"
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -15 }}
 className="grid lg:grid-cols-12 gap-4 sm:gap-6 items-stretch no-print"
 >
 {/* Presentation Slide Main Card */}
 <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2rem] sm:rounded-3xl p-5 sm:p-10 shadow-lg shadow-slate-100 flex flex-col justify-between relative min-h-[500px] sm:min-h-[520px]">
 {/* Progress bar */}
 <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 rounded-t-[2rem] sm:rounded-t-3xl overflow-hidden">
 <motion.div 
 className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
 initial={{ width: '0%' }}
 animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
 transition={{ duration: 0.3 }}
 />
 </div>

 {/* Top header on slide */}
 <div className="flex justify-between items-center mb-5 mt-1">
 <span className="text-[9px] sm:text-[10px] font-extrabold text-green-700 bg-green-50 border border-green-100/50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full tracking-wider uppercase">
 {slides[currentSlide].category}
 </span>
 <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-lg">
 {currentSlide + 1} / {slides.length}
 </span>
 </div>

 {/* Active Slide Body */}
 <div className="flex-1 flex flex-col justify-center mb-6 sm:mb-8">
 <div className="flex flex-col xs:flex-row items-start gap-3 sm:gap-4 mb-4">
 <div className="p-2.5 sm:p-3 bg-green-50 rounded-xl sm:rounded-2xl border border-green-100 flex-shrink-0 text-emerald-600">
 <div className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center">
 {slides[currentSlide].icon}
 </div>
 </div>
 <div>
 <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
 {slides[currentSlide].title}
 </h2>
 <p className="text-[11px] sm:text-sm text-slate-500 mt-1 font-medium italic leading-snug">
 {slides[currentSlide].subtitle}
 </p>
 </div>
 </div>

 <div className="space-y-2.5 sm:space-y-3 mt-2 sm:mt-4 ml-0 sm:ml-16">
 {slides[currentSlide].content.map((point, index) => (
 <motion.div 
 key={index}
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: index * 0.1 }}
 className="flex items-start gap-2.5 sm:gap-3"
 >
 <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] mt-0.5 flex-shrink-0 font-bold border border-emerald-100/50">
 {index + 1}
 </div>
 <p className="text-[11px] sm:text-sm text-slate-600 leading-relaxed font-medium">
 {point}
 </p>
 </motion.div>
 ))}
 </div>
 </div>

 {/* Bottom slide controls */}
 <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
 {/* Tips/Info alert */}
 <div className="flex items-start gap-2 w-full sm:max-w-md bg-amber-50 border border-amber-100 p-2.5 sm:p-3 rounded-xl">
 <HelpCircle className="text-amber-500 w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
 <p className="text-[9px] sm:text-[10px] text-amber-800 leading-normal font-medium">
 <span className="font-bold">Tips: </span>{slides[currentSlide].tips || "Pendampingan konsisten di rumah melatih karakter baik anak."}
 </p>
 </div>

 {/* Playback Buttons */}
 <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
 <button 
 onClick={() => setIsPlaying(!isPlaying)}
 className={`p-2 sm:p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-[10px] sm:text-xs font-bold ${isPlaying ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
 title={isPlaying ? "Jeda" : "Mulai"}
 >
 {isPlaying ? <Pause size={14} className="animate-pulse" /> : <Play size={14} />}
 <span>{isPlaying ? "Pause" : "Play"}</span>
 </button>

 <div className="flex items-center gap-2">
 <button 
 onClick={handlePrev}
 className="p-2 sm:p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-all active:scale-95"
 title="Sebelumnya"
 >
 <ArrowLeft size={16} />
 </button>

 <button 
 onClick={handleNext}
 className="px-4 py-2 sm:p-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-100 transition-all flex items-center gap-1 active:scale-95"
 title="Selanjutnya"
 >
 <span className="text-[10px] sm:text-xs sm:ml-1 uppercase tracking-wider">Lanjut</span>
 <ArrowRight size={16} />
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* High-Fidelity Mockup Sidebar on right */}
 <div className="lg:col-span-4 bg-slate-100 border border-slate-200 rounded-[2rem] sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-center items-center relative overflow-hidden min-h-[280px] sm:min-h-[300px]">
 {/* Background glow matching the category */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-green-200/30 rounded-full filter blur-3xl opacity-50 pointer-events-none" />
 
 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4 z-10 flex items-center gap-1.5">
 <Eye size={12} /> Tampilan Layar
 </span>
 
 <div className="w-full relative z-10 transform hover:scale-[1.02] transition-transform duration-300">
 {renderMockup(slides[currentSlide].mockup)}
 </div>

 <div className="mt-4 text-center text-[9px] text-slate-500 max-w-[240px] font-medium z-10 leading-relaxed italic">
 Visualisasi antarmuka fitur yang sedang dibahas.
 </div>
 </div>
 </motion.div>
 ) : (
 /* Document scroll view */
 <motion.div 
 key="document-mode"
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -15 }}
 className="bg-white border border-slate-200 rounded-[2rem] sm:rounded-3xl p-5 sm:p-12 shadow-lg max-w-4xl mx-auto print:border-none print:shadow-none mb-20"
 >
 {/* Cover Header */}
 <div className="text-center pb-6 sm:pb-8 border-b-2 border-green-600 mb-6 sm:mb-8">
 <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-600">
 <Award className="text-green-600 w-8 h-8 sm:w-10 sm:h-10" />
 </div>
 <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase px-2">
 Petunjuk Teknis Penggunaan Portal Digital
 </h1>
 <h2 className="text-sm sm:text-lg font-bold text-green-700 mt-1 uppercase">RA Darusyifa Arjawinangun</h2>
 <p className="text-[8px] sm:text-[10px] text-slate-400 mt-2 font-mono font-bold tracking-widest uppercase">Panduan Lengkap Untuk Orang Tua & Wali Murid</p>
 </div>

 {/* Document intro */}
 <div className="prose prose-slate max-w-none text-[11px] sm:text-sm text-slate-600 leading-relaxed mb-6 sm:mb-8">
 <p className="font-bold text-slate-800 text-xs sm:text-sm mb-2">Ayah & Bunda Wali Murid RA Darusyifa yang kami hormati,</p>
 <p>
 Sebagai wujud peningkatan kualitas bimbingan dan transparansi pendidikan di RA Darusyifa Arjawinangun, kami menghadirkan portal digital yang dapat diakses langsung melalui HP, laptop, atau tablet. Petunjuk teknis ini disusun agar Ayah & Bunda dapat masuk ke portal siswa dan menggunakan seluruh fiturnya untuk memantau kemajuan putra-putri kita dengan mudah.
 </p>
 </div>

 {/* Sections for each slide */}
 <div className="space-y-6 sm:space-y-10">
 {slides.slice(1, -1).map((slide, sIdx) => (
 <div key={slide.id} className="border border-slate-100 rounded-2xl p-5 sm:p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors">
 <div className="flex items-start sm:items-center gap-3 mb-4">
 <div className="p-2 sm:p-2.5 bg-green-100 rounded-xl text-green-700 flex-shrink-0">
 <div className="w-5 h-5 flex items-center justify-center">
 {slide.icon}
 </div>
 </div>
 <div>
 <h3 className="font-black text-slate-900 text-sm sm:text-lg leading-tight">{slide.title}</h3>
 <p className="text-[9px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{slide.category}</p>
 </div>
 </div>

 <div className="pl-0 sm:pl-12">
 <p className="text-[11px] sm:text-sm text-slate-500 font-medium mb-3 italic leading-snug">{slide.subtitle}</p>
 <ul className="space-y-2 mb-4">
 {slide.content.map((pt, pIdx) => (
 <li key={pIdx} className="flex items-start gap-2.5 text-[11px] sm:text-sm text-slate-600 leading-relaxed">
 <span className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5 flex-shrink-0" />
 <span>{pt}</span>
 </li>
 ))}
 </ul>

 {slide.tips && (
 <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[10px] sm:text-xs text-amber-800 font-medium">
 <span className="font-extrabold text-amber-900">Saran: </span>
 {slide.tips}
 </div>
 )}
 </div>
 </div>
 ))}
 </div>

 {/* Document Footer */}
 <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-200 text-center text-[10px] sm:text-xs text-slate-400 font-medium">
 <p className="font-extrabold text-slate-800 mb-1">RA DARUSYIFA ARJAWINANGUN</p>
 <p>Arjawinangun, Cirebon, Jawa Barat</p>
 <p className="text-[9px] text-slate-400 mt-2 font-mono">© 2026 RA Darusyifa • Digital Guide</p>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </main>

 {/* Floating Presentation Deck navigation indicator helper */}
 {viewMode === 'presentation' && (
 <div className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-slate-200/80 px-4 py-2.5 rounded-full shadow-2xl z-50 flex items-center gap-3 no-print border-b-4 border-b-green-600/20">
 <div className="flex gap-1 sm:gap-1.5">
 {slides.map((_, idx) => (
 <button 
 key={idx}
 onClick={() => setCurrentSlide(idx)}
 className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'bg-green-600 w-6 sm:w-8' : 'bg-slate-200 hover:bg-slate-300 w-2 sm:w-2.5'}`}
 title={`Ke slide ${idx + 1}`}
 />
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
