import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, orderBy, getDocs, deleteDoc, setDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { Camera, MapPin, Search, Filter, CheckCircle, Clock, Calendar, User, LogOut, Bell, CreditCard, BookOpen, Edit, Save, X, Menu, Trash2, TrendingUp, BarChart as BarChartIcon, Printer, Star, Megaphone, GraduationCap, AlertCircle, Upload, Image as ImageIcon, FileText, Download, ExternalLink, RefreshCw, Home, Users, HelpCircle, Info, Share2, Copy, ChevronRight, ChevronDown, Award, Coins, FileCheck, Sparkles, Wallet, Grid as GridIcon, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DriveJuknisModal from './DriveJuknisModal';
import KaldikIframe from './KaldikIframe';
import { staticHafalanMaterials as initialHafalanMaterials, StudentHafalanProgress, HafalanStatus } from '../data/hafalanData';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import KaldikCalendar from './KaldikCalendar';
import { compressImage } from '../lib/imageUtils';
import { getPrintHeaderHTML, getPrintStyles, getPrintSignatureHTML } from '../lib/printUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

const MOTIVATIONAL_QUOTES = [
 "Anak yang rajin adalah kebanggaan orang tua dan guru.",
 "Setiap langkah kecilmu hari ini adalah kunci sukses di masa depan.",
 "Teruslah belajar dan berbuat baik, hasil tidak akan mengkhianati usaha.",
 "Kedisiplinan adalah jembatan antara cita-cita dan pencapaian.",
 "Pintar itu bagus, tapi rajin dan jujur jauh lebih utama.",
 "Semangat ya belajarnya! Masa depan cerah menantimu."
];

export default function DashboardSiswa() {
 const [user, setUser] = useState<any>(null);
 const [userData, setUserData] = useState<any>(null);
 const [attendance, setAttendance] = useState<any[]>([]);
 const [announcements, setAnnouncements] = useState<any[]>([]);
 const [exams, setExams] = useState<any[]>([]);
 const [progress, setProgress] = useState<any[]>([]);
 const [hafalanProgress, setHafalanProgress] = useState<StudentHafalanProgress[]>([]);
 const [payments, setPayments] = useState<any[]>([]);
 const [settings, setSettings] = useState<any>(null);
 const [hafalanMaterials, setHafalanMaterials] = useState<any[]>(initialHafalanMaterials);
 const [materialsData, setMaterialsData] = useState<any[]>([]);
 const [kaldikData, setKaldikData] = useState<any[]>([]);
 const [filterHafalanStatusSiswa, setFilterHafalanStatusSiswa] = useState('Semua'); // 'Semua', 'Sudah Setor', 'Belum Setor'
 const [filterHafalanCategorySiswa, setFilterHafalanCategorySiswa] = useState('Semua Kategori'); // 'Semua Kategori', 'Surat Pendek', 'Hadist', 'Doa Sehari-hari', 'Bacaan Sholat'
 const [filterHafalanKelasSiswa, setFilterHafalanKelasSiswa] = useState('Semua');
  const [searchHafalan, setSearchHafalan] = useState('');
  const [filterProgressPeriod, setFilterProgressPeriod] = useState('Semua'); // 'Semua', 'Utsman', 'Umar Bin Khattab'
 const [loading, setLoading] = useState(true);
 const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'progress', 'hafalan', 'attendance', 'administration', 'announcements', 'profile', 'kaldik'
 const [selectedExamDays, setSelectedExamDays] = useState<Record<string, string>>({});
 const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
 const [attendanceStatus, setAttendanceStatus] = useState('Hadir');
 const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
 const [quote, setQuote] = useState('');
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = reader.result as string;
      try {
        const compressed = await compressImage(result, 600, 600, 0.7);
        await updateDoc(doc(db, 'users', user.uid), { photoURL: compressed });
        setUserData((prev: any) => ({ ...prev, photoURL: compressed }));
        alert('Foto profil siswa berhasil diperbarui!');
      } catch (err) {
        console.error('Compression failed, saving original:', err);
        await updateDoc(doc(db, 'users', user.uid), { photoURL: result });
        setUserData((prev: any) => ({ ...prev, photoURL: result }));
        alert('Foto profil siswa berhasil diperbarui!');
      }
    };
    reader.readAsDataURL(file);
  };


 useEffect(() => {
 // Prevent back button from exiting the app
 window.history.pushState(null, '', window.location.href);
 const handlePopState = () => {
 window.history.pushState(null, '', window.location.href);
 };
 window.addEventListener('popstate', handlePopState);
 return () => window.removeEventListener('popstate', handlePopState);
 }, []);

 useEffect(() => {
 if (attendance && user) {
 const today = new Date().toISOString().split('T')[0];
 const todayAbsence = attendance.find(a => a.date === today);
 setHasCheckedInToday(!!todayAbsence);
 }
 }, [attendance, user]);
 
 // Finance Filter State
 const [filterType, setFilterType] = useState('all');
 const [filterDate, setFilterDate] = useState('');
 
 // Payment Modal State
 const [showPaymentModal, setShowPaymentModal] = useState(false);
 const [showPrintRapotModal, setShowPrintRapotModal] = useState(false);
 const [printRapotPeriod, setPrintRapotPeriod] = useState('PTS Ganjil');
 
 // Setoran Modal State
 const [showSetoranModal, setShowSetoranModal] = useState(false);
 const [showDriveJuknisModal, setShowDriveJuknisModal] = useState(false);
 const [showJuknisDriveModal, setShowJuknisDriveModal] = useState(false);
 const [activeMaterialForSetoran, setActiveMaterialForSetoran] = useState<any>(null);
 const [setoranLink, setSetoranLink] = useState('');
 const [setoranFileBase64, setSetoranFileBase64] = useState('');
 const [submissionMethod, setSubmissionMethod] = useState<'Google Drive' | 'Setoran Langsung' | 'Rekaman Suara'>('Google Drive');
 const [isSetoranSubmitting, setIsSetoranSubmitting] = useState(false);
 
 const [activeDetailToPay, setActiveDetailToPay] = useState<any>(null);
 const [paymentMethod, setPaymentMethod] = useState<'Transfer' | 'Tunai' | 'Tabungan' | 'Campuran'>('Transfer');
 const [paymentProof, setPaymentProof] = useState<string>('');
 const [mixedSavingsAmount, setMixedSavingsAmount] = useState('');
 const [mixedCashAmount, setMixedCashAmount] = useState('');
 const [paymentMeetDate, setPaymentMeetDate] = useState('');
 const [paymentSubmitting, setPaymentSubmitting] = useState(false);

 useEffect(() => {
 // Select a random quote on component mount
 const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
 setQuote(randomQuote);

 // Fetch Hafalan Materials from Firestore
 const q = query(collection(db, 'hafalan_materials'));
 const unsubscribe = onSnapshot(q, (snapshot) => {
 const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 // Sort client-side
 const sortedDocs = [...docs].sort((a: any, b: any) => (a.urutan || 0) - (b.urutan || 0));
 setHafalanMaterials(sortedDocs);
 }, (error) => {
 console.error("Error fetching hafalan materials for student:", error);
 });
 return () => unsubscribe();
 }, []);

 const getScoreGradeInfo = (score: number) => {
 if (score >= 90) return { grade: 'A', text: 'Sangat Baik', color: 'text-green-600' };
 if (score >= 80) return { grade: 'B', text: 'Baik', color: 'text-blue-600' };
 if (score >= 70) return { grade: 'C', text: 'Cukup', color: 'text-orange-600' };
 return { grade: 'D', text: 'Kurang', color: 'text-red-600' };
 };

 const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 if (file.size > 5 * 1024 * 1024) {
 alert('Ukuran file maksimal 5MB');
 return;
 }
 const reader = new FileReader();
 reader.onloadend = async () => {
 const result = reader.result as string;
 try {
 const compressed = await compressImage(result, 800, 800, 0.7);
 setPaymentProof(compressed);
 } catch (error) {
 console.error("Compression failed:", error);
 setPaymentProof(result);
 }
 };
 reader.readAsDataURL(file);
 }
 };

 const handleSetoranFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 if (file.size > 800 * 1024) {
 alert("Ukuran file terlalu besar! Maksimal 800 KB. Jika file lebih besar dari 800 KB, silakan upload ke Google Drive atau YouTube dan masukkan link-nya saja.");
 e.target.value = '';
 return;
 }
 const reader = new FileReader();
 reader.onload = (ev) => {
 setSetoranFileBase64(ev.target?.result as string);
 };
 reader.readAsDataURL(file);
 };

 const submitSetoran = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!user || !activeMaterialForSetoran) return;
 setIsSetoranSubmitting(true);
 try {
 const docRef = doc(db, 'hafalan_progress', `${user.uid}_${activeMaterialForSetoran.material.id}`);
 const currentStatus = activeMaterialForSetoran.status === 'Belum Mulai' ? 'Sedang Menghafal' : activeMaterialForSetoran.status;
 
 const payload: any = {
 studentId: user.uid,
 studentName: userData?.name || user.displayName || 'Siswa',
 studentClass: userData?.kelas || '',
 materialId: activeMaterialForSetoran.material.id,
 status: currentStatus,
 isReadyForTest: true,
 submissionMethod: submissionMethod,
 updatedAt: new Date().toISOString()
 };
 
 if (submissionMethod === 'Google Drive' && setoranLink) {
 payload.recordingLink = setoranLink;
 } else if (submissionMethod === 'Rekaman Suara' && setoranFileBase64) {
 payload.recordingDataUrl = setoranFileBase64;
 }
 
 await setDoc(docRef, payload, { merge: true });
 alert("Setoran berhasil dikirim! Silakan tunggu evaluasi dari guru.");
 setShowSetoranModal(false);
 setActiveMaterialForSetoran(null);
 setSetoranLink('');
 setSetoranFileBase64('');
 } catch (error) {
 handleFirestoreError(error, OperationType.UPDATE, `hafalan_progress/${user.uid}_${activeMaterialForSetoran.material.id}`);
 }
 setIsSetoranSubmitting(false);
 };

 const handleSubmitPayment = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!activeDetailToPay || !user || !userData) return;
 
 setPaymentSubmitting(true);
 try {
 if (paymentMethod === 'Tabungan') {
 if ((userData.savings || 0) < activeDetailToPay.amount) {
 alert('Saldo tabungan tidak mencukupi untuk pembayaran ini.');
 setPaymentSubmitting(false);
 return;
 }
 
 await addDoc(collection(db, 'payments'), {
 studentId: user.uid,
 amount: activeDetailToPay.amount,
 description: `Pembayaran Iuran: ${activeDetailToPay.name}`,
 type: 'pembayaran',
 method: 'Tabungan',
 status: 'pending',
 date: new Date().toISOString().split('T')[0],
 arrearDetailId: activeDetailToPay.id,
 createdAt: serverTimestamp()
 });
 
 alert('Permintaan potong tabungan terkirim. Menunggu validasi bendahara.');
 } else if (paymentMethod === 'Campuran') {
 const savingsAmount = Number(mixedSavingsAmount) || 0;
 const cashAmount = Number(mixedCashAmount) || 0;
 const total = savingsAmount + cashAmount;

 if (savingsAmount > (userData.savings || 0)) {
 alert('Input nominal tabungan melebihi saldo yang Anda miliki.');
 setPaymentSubmitting(false);
 return;
 }

 if (total < activeDetailToPay.amount) {
 if (!window.confirm(`Total Rp ${total.toLocaleString()} kurang dari tagihan Rp ${activeDetailToPay.amount.toLocaleString()}. Ajukan sebagai pembayaran sebagian?`)) {
 setPaymentSubmitting(false);
 return;
 }
 }

 await addDoc(collection(db, 'payments'), {
 studentId: user.uid,
 amount: total,
 description: `Pembayaran Iuran: ${activeDetailToPay.name} (Campuran: Tabungan Rp ${savingsAmount.toLocaleString()} & Transfer/Tunai Rp ${cashAmount.toLocaleString()})`,
 type: 'pembayaran',
 method: 'Campuran',
 status: 'pending',
 proofStr: paymentProof || null,
 date: new Date().toISOString().split('T')[0],
 arrearDetailId: activeDetailToPay.id,
 createdAt: serverTimestamp(),
 mixedDetails: {
 fromSavings: savingsAmount,
 fromCash: cashAmount
 }
 });

 alert('Permintaan pembayaran campuran terkirim. Menunggu validasi admin.');
 } else {
 if (paymentMethod === 'Transfer' && !paymentProof) {
 alert('Mohon unggah bukti pembayaran transfer.');
 setPaymentSubmitting(false);
 return;
 }
 if (paymentMethod === 'Tunai' && !paymentMeetDate) {
 alert('Mohon tentukan jadwal pertemuan dengan bendahara.');
 setPaymentSubmitting(false);
 return;
 }
 
 await addDoc(collection(db, 'payments'), {
 studentId: user.uid,
 amount: activeDetailToPay.amount,
 description: `Pembayaran Iuran: ${activeDetailToPay.name}`,
 type: 'pembayaran',
 method: paymentMethod,
 status: 'pending',
 proofStr: paymentMethod === 'Transfer' ? paymentProof : null,
 meetDate: paymentMethod === 'Tunai' ? paymentMeetDate : null,
 date: new Date().toISOString().split('T')[0],
 arrearDetailId: activeDetailToPay.id,
 createdAt: serverTimestamp()
 });
 
 alert(paymentMethod === 'Tunai' ? 'Permintaan pertemuan (Tunai) terkirim. Menunggu jadwal dari admin.' : 'Permintaan pembayaran berhasil dikirim. Menunggu validasi admin.');
 }
 
 setShowPaymentModal(false);
 setActiveDetailToPay(null);
 setPaymentProof('');
 setPaymentMeetDate('');
 setMixedSavingsAmount('');
 setMixedCashAmount('');
 setPaymentMethod('Transfer');
 } catch (error) {
 console.error("Error submitting payment:", error);
 alert('Gagal mengirim pembayaran.');
 }
 setPaymentSubmitting(false);
 };

 const handleExecutePrintExamCard = (exam: any) => {
 if (!userData) return;
 
 // Sort and filter schedules to student's specific class only
 const filteredSchedules = (exam.schedules || []).filter((s: any) => 
 !s.kelas || s.kelas.toLowerCase() === "semua kelas" || 
 (userData?.kelas && s.kelas?.toLowerCase() === userData.kelas?.toLowerCase())
 );
 const schedules = [...filteredSchedules].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
 
 // Format Tempat, Tanggal Lahir
 let ttlSiswa = '-';
 if (userData.tempatLahir || userData.tanggalLahir) {
 const tgl = userData.tanggalLahir ? new Date(userData.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
 ttlSiswa = `${userData.tempatLahir || ''}${userData.tempatLahir && tgl ? ', ' : ''}${tgl}`;
 }

 let htmlContent = `
 <html>
 <head>
 <title>Kartu Ujian - ${exam.type}</title>
 <style>
 body { font-family: 'Times New Roman', serif; padding: 20px; font-size: 12px; }
 .card { border: 2px solid #000; width: 100%; max-width: 600px; margin: 0 auto 30px; }
 .header { text-align: center; border-bottom: 2px solid #000; padding: 10px; display: flex; align-items: center; justify-content: center; gap: 15px; }
 .header img { width: 50px; height: 50px; }
 .header-text h3 { margin: 0; font-size: 14px; text-transform: uppercase; }
 .header-text h2 { margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }
 .header-text p { margin: 0; font-size: 10px; }
 .title { text-align: center; font-weight: bold; font-size: 14px; border-bottom: 1px solid #000; padding: 5px 0; text-transform: uppercase; border-top: 1px solid #000; margin-top: 5px; }
 .content { padding: 15px; line-height: 1.5; }
 .content table { width: 100%; font-size: 12px; }
 .content td { padding: 4px 0; }
 .content td:first-child { width: 140px; font-weight: bold; }
 .content td:nth-child(2) { width: 10px; }
 .signature-container { margin-top: 20px; display: flex; justify-content: flex-end; padding-right: 20px; }
 .schedule-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
 .schedule-table th, .schedule-table td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px; }
 @media print {
 .page-break { page-break-after: always; }
 }
 </style>
 </head>
 <body>
 <!-- Front Side -->
 <div class="card">
 <div class="header">
 ${settings?.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" />` : ''}
 <div class="header-text">
 <h3>YAYASAN DARUSYIFA AL ISLAMIYAH</h3>
 <h2>RAUDHATUL ATHFAL (RA) DARUSYIFA ARJAWINANGUN</h2>
 <p>Blok telar baru Rt.004 Rw.014 Desa/Kecamatan Arjawinangun Kabupaten Cirebon</p>
 </div>
 </div>
 <div class="title">
 KARTU ${exam.type}
 </div>
 <div class="content">
 <table style="margin-bottom: 20px;">
 <tr>
 <td>NAMA SISWA</td>
 <td>:</td>
 <td>${userData.name}</td>
 </tr>
 <tr>
 <td>TEMPAT, TGL LAHIR</td>
 <td>:</td>
 <td>${ttlSiswa}</td>
 </tr>
 <tr>
 <td>NO PESERTA</td>
 <td>:</td>
 <td>${(user?.uid || '').substring(0,8).toUpperCase()}</td>
 </tr>
 <tr>
 <td>KELAS</td>
 <td>:</td>
 <td>${userData.kelas || 'Belum Ditentukan'}</td>
 </tr>
 </table>
 
 <div class="signature-container">
 <div style="text-align: center; width: 180px;">
 <p style="margin: 0; font-size: 11px;">Cirebon, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
 <p style="margin: 3px 0 0; font-weight: bold; font-size: 11px;">Kepala Sekolah</p>
 <div style="margin: 8px auto; width: 85px; height: 85px;">
 <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('Kartu Ujian Terverifikasi secara elektronik oleh Kepala Sekolah RA Darusyifa Arjawinangun: Gian Dwi Wahyuni, S.H')}" alt="QR Code Signature" style="width: 100%; height: 100%; object-fit: contain;" />
 </div>
 <p style="margin: 0; font-weight: bold; text-decoration: underline; font-size: 11px;">Gian Dwi Wahyuni, S.H</p>
 <p style="margin: 2px 0 0; font-size: 9px; color: #666;">NPSN: 69993923</p>
 </div>
 </div>
 </div>
 </div>
 
 <div class="page-break"></div>
 
 <!-- Back Side -->
 <div class="card">
 <div class="title" style="border-top: none; margin-top: 0;">JADWAL ${exam.type}</div>
 <div class="content">
 <table class="schedule-table">
 <thead>
 <tr>
 <th>No</th>
 <th>Mata Pelajaran</th>
 <th>Hari, Tanggal</th>
 <th>Waktu</th>
 </tr>
 </thead>
 <tbody>
 ${schedules.map((s, idx) => `
 <tr>
 <td>${idx + 1}</td>
 <td style="text-align: left; font-weight: bold;">${s.subject}</td>
 <td>${new Date(s.date).toLocaleDateString('id-ID', {weekday: 'long', day: '2-digit', month: 'short', year: 'numeric'})}</td>
 <td>${s.time}</td>
 </tr>
 `).join('')}
 ${schedules.length === 0 ? `
 <tr>
 <td colspan="4" style="padding: 20px; font-style: italic; color: #666;">Belum ada jadwal ujian untuk kelas ${userData?.kelas || 'Ananda'}.</td>
 </tr>
 ` : ''}
 </tbody>
 </table>
 </div>
 </div>
 </body>
 </html>
 <script>window.onload = function() { setTimeout(function(){ window.print(); window.close(); }, 500); }</script>
 `;
 
 const win = window.open('', '_blank');
 if (win) {
 win.document.write(htmlContent);
 win.document.close();
 }
 };

 const handleExecutePrintRapotHafalan = () => {
 if (!userData) return;
 
 // Sort progress descending by updatedAt, wait we want to print ascending or it doesn't matter much. Let's do descending.
 const sortedHafalan = hafalanProgress
 .filter(p => !p.isReadyForTest)
 .sort((a,b) => new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime());

 let itemsHtml = '';
 sortedHafalan.forEach((p, idx) => {
 const mat = hafalanMaterials.find(m => m.id === p.materialId);
 let starStr = '';
 for(let i=0; i<(p.stars || 0); i++) { starStr += '★ '; }
 itemsHtml += `
 <tr>
 <td style="padding: 12px; border-bottom: 1px solid #eee;">${idx + 1}</td>
 <td style="padding: 12px; border-bottom: 1px solid #eee;">
 <strong style="display:block;">${mat?.judul || 'Materi tidak ditemukan'}</strong>
 <small style="color: #666;">${mat?.kategori || ''}</small>
 </td>
 <td style="padding: 12px; border-bottom: 1px solid #eee;">
 <strong style="color: #16a34a;">${p.status}</strong>
 <br/><small style="color: #eab308; font-size: 14px;">${starStr}</small>
 </td>
 <td style="padding: 12px; border-bottom: 1px solid #eee;">${p.catatanGuru || '-'}</td>
 </tr>
 `;
 });

 if (sortedHafalan.length === 0) {
 itemsHtml = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #666; font-style: italic;">Belum ada data evaluasi hafalan.</td></tr>`;
 }

 let reportTitle = `Rapot Hafalan - ${userData.name}`;

 const html = `
 <html>
 <head>
 <title>${reportTitle}</title>
 <style>
 ${getPrintStyles()}
 </style>
 </head>
 <body>
 ${getPrintHeaderHTML('LAPORAN HASIL HAFALAN (RAPOT)', settings?.schoolName, settings?.logoUrl)}
 
 <div class="student-info">
 <div>Nama Siswa</div><div>: ${userData.name}</div>
 <div>NIS/NISN</div><div>: ${userData.email?.split('@')[0] || '-'}</div>
 <div>Kelas</div><div>: ${userData.kelas || 'Belum Ditentukan'}</div>
 <div>Tahun Ajaran</div><div>: ${new Date().getFullYear()}/${new Date().getFullYear()+1}</div>
 </div>
 
 <table>
 <thead>
 <tr>
 <th style="width: 50px;">No</th>
 <th>Judul Hafalan</th>
 <th>Status / Nilai</th>
 <th>Catatan Guru</th>
 </tr>
 </thead>
 <tbody>
 ${itemsHtml}
 </tbody>
 </table>
 
 <div class="footer-signatures">
 <div class="signature-box">
 <p>Mengetahui,</p>
 <p>Wali Kelas</p>
 <br><br><br>
 <p><strong>_________________________</strong></p>
 </div>
 </div>
 </body>
 </html>
 <script>window.onload = function() { setTimeout(function(){ window.print(); window.close(); }, 500); }</script>
 `;

 const win = window.open('', '_blank');
 if (win) {
 win.document.write(html);
 win.document.close();
 }
 };

 const handleExecutePrintRapot = () => {
 if (!userData) return;
 
 // Sort progress ascending by date or createdAt and filter by period
 const sortedProgress = [...progress]
 .filter(p => p.evaluationPeriod === printRapotPeriod)
 .sort((a,b) => {
 const dateA = new Date(a.date).getTime();
 const dateB = new Date(b.date).getTime();
 return dateA - dateB;
 });

 let itemsHtml = '';
 
 sortedProgress.forEach((p, idx) => {
 const scoreNum = Number(p.score) || 0;
 const gradeInfo = getScoreGradeInfo(scoreNum);
 let periodBadge = p.evaluationPeriod ? `<span style="font-size:10px; background:#eef2ff; color:#4f46e5; padding:2px 6px; border-radius:10px; margin-left:8px;">${p.evaluationPeriod}</span>` : '';
 itemsHtml += `
 <tr>
 <td style="padding: 12px; border-bottom: 1px solid #eee;">${idx + 1}</td>
 <td style="padding: 12px; border-bottom: 1px solid #eee;">
 <div style="display:flex; align-items:center;">
 <strong style="display:block;">${p.category}</strong>
 ${periodBadge}
 </div>
 ${p.title && p.title.trim() !== '' ? `<small style="color: #666;">${p.title}</small>` : ''}
 </td>
 <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${scoreNum}</td>
 <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;"><strong>${gradeInfo.grade}</strong> <br><small>${gradeInfo.text}</small></td>
 </tr>
 `;
 });

 if (sortedProgress.length === 0) {
 itemsHtml = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #666; font-style: italic;">Belum ada data evaluasi belajar.</td></tr>`;
 }

 let reportTitle = `Rapot ${printRapotPeriod} - ${userData.name}`;

 const html = `
 <html>
 <head>
 <title>${reportTitle}</title>
 <style>
 ${getPrintStyles()}
 </style>
 </head>
 <body>
 ${getPrintHeaderHTML('LAPORAN HASIL BELAJAR (RAPOT)', settings?.schoolName, settings?.logoUrl)}
 
 <div class="student-info">
 <div>Nama Siswa</div><div>: ${userData.name}</div>
 <div>NIS/NISN</div><div>: ${userData.email?.split('@')[0] || '-'}</div>
 <div>Kelas</div><div>: ${userData.kelas || 'Belum Ditentukan'}</div>
 <div>Tahun Ajaran</div><div>: ${new Date().getFullYear()}/${new Date().getFullYear()+1}</div>
 </div>
 
 <table>
 <thead>
 <tr>
 <th width="50">No</th>
 <th>Mata Pelajaran / Evaluasi</th>
 <th width="100" class="center">Nilai Angka</th>
 <th width="120" class="center">Predikat</th>
 </tr>
 </thead>
 <tbody>
 ${itemsHtml}
 </tbody>
 </table>
 
 ${getPrintSignatureHTML('', 'Mengetahui,<br>Orang Tua/Wali', 'Kepala Sekolah / Guru Kelas')}
 </body>
 </html>
 <script>window.onload = function() { setTimeout(function(){ window.print(); window.close(); }, 500); }</script>
 `;

 const win = window.open('', '_blank');
 if (win) {
 win.document.write(html);
 win.document.close();
 }
 };

 const handlePrintReceipt = (pay: any) => {
 const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(pay.amount);
 const transactionId = `TRX-${pay.id.substring(0, 10).toUpperCase()}`;
 const dateStr = pay.date || new Date().toLocaleDateString('id-ID');
 const methodStr = pay.method || (pay.type === 'tabungan' ? 'Tabungan' : 'Tunai');

 const html = `
 <html>
 <head>
 <title>Bukti Pembayaran - ${pay.description}</title>
 <style>
 ${getPrintStyles()}
 </style>
 </head>
 <body>
 ${getPrintHeaderHTML('TANDA BUKTI PEMBAYARAN', settings?.schoolName, settings?.logoUrl)}
 
 <div class="receipt-details">
 <div class="receipt-row">
 <span class="receipt-label">Dibayarkan Oleh (Siswa)</span>
 <span class="receipt-value">${userData?.name || 'Unknown'}</span>
 </div>
 <div class="receipt-row">
 <span class="receipt-label">Keterangan Pembayaran</span>
 <span class="receipt-value">${pay.description}</span>
 </div>
 <div class="receipt-row">
 <span class="receipt-label">Metode Pembayaran</span>
 <span class="receipt-value">${methodStr}</span>
 </div>
 <div class="receipt-row">
 <span class="receipt-label">No. Referensi Transaksi</span>
 <span class="receipt-value receipt-trx">${transactionId}</span>
 </div>
 <div class="receipt-row" style="background: #f0fdf4; border-bottom: none;">
 <span class="receipt-label" style="color: #166534; padding-top: 5px;">Total Nominal</span>
 <span class="receipt-amount">${formattedAmount}</span>
 </div>
 </div>

 ${getPrintSignatureHTML(dateStr, 'Bendahara / Penerima', 'Kepala Sekolah')}
 </body>
 </html>
 <script>window.onload = function() { setTimeout(function(){ window.print(); window.close(); }, 500); }</script>
 `;

 const win = window.open('', '_blank');
 if (win) {
 win.document.write(html);
 win.document.close();
 }
 };
 
 // Profile Edit State
 const [isEditingProfile, setIsEditingProfile] = useState(false);
 const [editName, setEditName] = useState('');
 const [editWhatsapp, setEditWhatsapp] = useState('');
 const [editPhoto, setEditPhoto] = useState('');
 const [editTempatLahir, setEditTempatLahir] = useState('');
 const [editTanggalLahir, setEditTanggalLahir] = useState('');
 const [newPassword, setNewPasswordProfile] = useState('');
 const [confirmPassword, setConfirmPasswordProfile] = useState('');
 const fileInputRef = useRef<HTMLInputElement>(null);

 const navigate = useNavigate();
 const videoRef = useRef<HTMLVideoElement>(null);
 const canvasRef = useRef<HTMLCanvasElement>(null);

 useEffect(() => {
 const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
 if (currentUser) {
 try {
 const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
 if (!userDoc.exists() || userDoc.data().role !== 'siswa') {
 navigate('/login');
 return;
 }
 
 setUser(currentUser);
 const data = userDoc.data();
 setUserData(data);
 setEditName(data.name);
 setEditWhatsapp(data.whatsapp || '');
 setEditPhoto(data.photoURL || '');
 setEditTempatLahir(data.tempatLahir || '');
 setEditTanggalLahir(data.tanggalLahir || '');
 } catch (error) {
 console.error('Error verifying siswa role:', error);
 navigate('/login');
 }
 } else {
 navigate('/login');
 }
 });
 return () => unsubscribe();
 }, [navigate]);

 useEffect(() => {
 if (!user) return;

 const unsubAttendance = onSnapshot(
 query(collection(db, 'attendance'), where('studentId', '==', user.uid), orderBy('timestamp', 'desc')),
 (snapshot) => setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
 (error) => {
 handleFirestoreError(error, OperationType.LIST, 'attendance');
 }
 );

 const unsubProgress = onSnapshot(
 query(collection(db, 'progress'), where('studentId', '==', user.uid), orderBy('createdAt', 'desc')),
 (snapshot) => setProgress(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
 (error) => {
 handleFirestoreError(error, OperationType.LIST, 'progress');
 }
 );

 const unsubHafalanProgress = onSnapshot(
 query(collection(db, 'hafalan_progress'), where('studentId', '==', user.uid)),
 (snapshot) => setHafalanProgress(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentHafalanProgress))),
 (error) => {
 handleFirestoreError(error, OperationType.LIST, 'hafalan_progress');
 }
 );

 const unsubAnnounce = onSnapshot(
 query(collection(db, 'announcements'), orderBy('createdAt', 'desc')),
 (snapshot) => {
 setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 },
 (error) => {
 handleFirestoreError(error, OperationType.LIST, 'announcements');
 }
 );

 const unsubPayments = onSnapshot(
 query(collection(db, 'payments'), where('studentId', '==', user.uid), orderBy('date', 'desc')),
 (snapshot) => {
 setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 setLoading(false);
 },
 (error) => {
 handleFirestoreError(error, OperationType.LIST, 'payments');
 setLoading(false);
 }
 );

 const unsubSettings = onSnapshot(doc(db, 'settings', 'landingPage'), (snap) => {
 if (snap.exists()) {
 setSettings(snap.data());
 }
 }, (error) => {
 handleFirestoreError(error, OperationType.GET, 'settings/landingPage');
 });

 const unsubKaldik = onSnapshot(query(collection(db, 'kaldik')), (snapshot) => {
 setKaldikData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 }, (error) => {
 handleFirestoreError(error, OperationType.LIST, 'kaldik');
 });

 const unsubMaterials = onSnapshot(query(collection(db, 'materials'), orderBy('createdAt', 'desc')), (snapshot) => {
 setMaterialsData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 }, (error) => {
 handleFirestoreError(error, OperationType.LIST, 'materials');
 });

 const unsubExams = onSnapshot(query(collection(db, 'exams'), orderBy('createdAt', 'desc')), (snapshot) => {
 setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 }, (error) => {
 handleFirestoreError(error, OperationType.LIST, 'exams');
 });

 return () => {
 unsubAttendance();
 unsubProgress();
 unsubHafalanProgress();
 unsubAnnounce();
 unsubPayments();
 unsubSettings();
 unsubKaldik();
 unsubMaterials();
 unsubExams();
 };
 }, [user]);

 const [showCamera, setShowCamera] = useState(false);
 const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
 const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);

 const startCamera = async () => {
 setShowCamera(true);
 setCapturedPhoto(null);
 setIsSubmittingAttendance(false);
 try {
 const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
 if (videoRef.current) {
 videoRef.current.srcObject = stream;
 }
 } catch (err) {
 console.error("Error accessing camera:", err);
 alert("Gagal mengakses kamera. Pastikan izin kamera diberikan.");
 setShowCamera(false);
 }
 };

 const stopCamera = () => {
 if (videoRef.current && videoRef.current.srcObject) {
 const stream = videoRef.current.srcObject as MediaStream;
 const tracks = stream.getTracks();
 tracks.forEach(track => track.stop());
 }
 setShowCamera(false);
 setCapturedPhoto(null);
 setIsSubmittingAttendance(false);
 };

 const takePhoto = () => {
 try {
 if (!videoRef.current || !canvasRef.current) return;
 const video = videoRef.current;
 const canvas = canvasRef.current;
 
 // Scale down resolution for ultra fast capture & light payload (~40KB)
 const maxDim = 800;
 let w = video.videoWidth || 640;
 let h = video.videoHeight || 480;
 if (w > h) {
 if (w > maxDim) {
 h = Math.round((h * maxDim) / w);
 w = maxDim;
 }
 } else {
 if (h > maxDim) {
 w = Math.round((w * maxDim) / h);
 h = maxDim;
 }
 }

 canvas.width = w;
 canvas.height = h;

 const ctx = canvas.getContext('2d');
 if (ctx) {
 // Mirror horizontal for natural selfie view
 ctx.translate(w, 0);
 ctx.scale(-1, 1);
 ctx.drawImage(video, 0, 0, w, h);
 const photoDataUrl = canvas.toDataURL('image/jpeg', 0.7);

 // Safely stop stream and clear srcObject before updating state
 if (video.srcObject) {
 const stream = video.srcObject as MediaStream;
 stream.getTracks().forEach(track => track.stop());
 video.srcObject = null;
 }

 setCapturedPhoto(photoDataUrl);
 }
 } catch (err) {
 console.error("Error taking photo:", err);
 alert("Terjadi kesalahan saat mengambil foto. Silakan coba lagi.");
 }
 };

 const retakePhoto = async () => {
 setCapturedPhoto(null);
 try {
 const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
 if (videoRef.current) {
 videoRef.current.srcObject = stream;
 }
 } catch (err) {
 console.error("Error restarting camera:", err);
 }
 };

 const handleConfirmAttendance = async () => {
 if (attendanceStatus === 'Hadir' && !capturedPhoto) {
 alert('Silakan ambil foto presensi terlebih dahulu.');
 return;
 }

 if (isSubmittingAttendance) return;
 setIsSubmittingAttendance(true);

 const today = new Date().toISOString().split('T')[0];
 const path = 'attendance';

 try {
 // Check if already attended today
 const q = query(
 collection(db, path), 
 where('studentId', '==', user.uid), 
 where('date', '==', today)
 );
 const querySnapshot = await getDocs(q);
 
 if (!querySnapshot.empty) {
 alert('Anda sudah melakukan absensi hari ini.');
 stopCamera();
 return;
 }

 const saveRecord = async (lat: number, long: number) => {
 try {
 await addDoc(collection(db, 'attendance'), {
 studentId: user.uid,
 studentName: userData.name || user.displayName || 'Siswa',
 date: today,
 timestamp: serverTimestamp(),
 status: attendanceStatus,
 location: { latitude: lat, longitude: long },
 photo: attendanceStatus === 'Hadir' ? capturedPhoto : ''
 });
 alert(`Absensi (${attendanceStatus}) berhasil dicatat!`);
 stopCamera();
 } catch (err) {
 handleFirestoreError(err, OperationType.CREATE, 'attendance');
 } finally {
 setIsSubmittingAttendance(false);
 }
 };

 if (attendanceStatus === 'Hadir' && navigator.geolocation) {
 navigator.geolocation.getCurrentPosition(
 async (pos) => {
 await saveRecord(pos.coords.latitude, pos.coords.longitude);
 },
 async (err) => {
 console.warn('Geolocation error/timeout:', err.message);
 await saveRecord(0, 0);
 },
 { timeout: 5000 }
 );
 } else {
 await saveRecord(0, 0);
 }
 } catch (error) {
 handleFirestoreError(error, OperationType.GET, path);
 setIsSubmittingAttendance(false);
 }
 };

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 const reader = new FileReader();
 reader.onerror = (error) => {
 console.error('FileReader error:', error);
 alert('Gagal membaca file foto.');
 };
 reader.onloadend = async () => {
 const result = reader.result as string;
 try {
 const compressed = await compressImage(result, 600, 600, 0.7);
 setEditPhoto(compressed);
 } catch (error) {
 console.error("Compression failed:", error);
 setEditPhoto(result);
 }
 };
 reader.readAsDataURL(file);
 }
 };
 const handleChangePasswordProfile = async (e: React.FormEvent) => {
 e.preventDefault();
 if (newPassword !== confirmPassword) {
 alert("Password baru dan konfirmasi password tidak cocok!");
 return;
 }
 if (newPassword.length < 6) {
 alert("Password minimal 6 karakter!");
 return;
 }
 
 try {
 if (auth.currentUser) {
 await updatePassword(auth.currentUser, newPassword);
 alert("Password berhasil diubah!");
 setNewPasswordProfile("");
 setConfirmPasswordProfile("");
 }
 } catch (error: any) {
 console.error(error);
 if (error.code === 'auth/requires-recent-login') {
 alert("Untuk alasan keamanan, Anda harus login ulang sebelum mengubah password.");
 } else {
 alert("Gagal mengubah password: " + error.message);
 }
 }
 };

 const handleUpdateProfile = async (e: React.FormEvent) => {
 e.preventDefault();
 try {
 await updateDoc(doc(db, 'users', user.uid), {
 name: editName,
 whatsapp: editWhatsapp,
 photoURL: editPhoto,
 tempatLahir: editTempatLahir,
 tanggalLahir: editTanggalLahir
 });
 setUserData({ 
 ...userData, 
 name: editName, 
 whatsapp: editWhatsapp, 
 photoURL: editPhoto,
 tempatLahir: editTempatLahir,
 tanggalLahir: editTanggalLahir
 });
 setIsEditingProfile(false);
 alert('Profil berhasil diperbarui!');
 } catch (error) {
 handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
 }
 };

 if (loading) return <div className="min-h-screen flex items-center justify-center bg-green-50">Memuat data...</div>;

 const handleLogout = async () => {
 try {
 await auth.signOut();
 navigate('/login');
 } catch (error) {
 console.error("Logout error:", error);
 }
 };

 const NavItems = () => (
 <nav className="space-y-2 flex-1">
 {[
 { id: 'overview', label: 'Beranda', icon: Home },
 { id: 'progress', label: 'Laporan Belajar', icon: BookOpen },
 { id: 'hafalan', label: 'Modul Hafalan', icon: Star },
 { id: 'attendance', label: 'Riwayat Absensi', icon: CheckCircle },
 { id: 'administration', label: 'Administrasi', icon: CreditCard },
 { id: 'announcements', label: 'Info Sekolah', icon: Bell },
 { id: 'profile', label: 'Profil Saya', icon: User },
 { id: 'kaldik', label: 'Kalender Pendidikan', icon: Calendar },
 ].map((item) => (
 <button 
 key={item.id}
 onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
 className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold group ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900 '}`}
 >
 <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600 transition-colors'} />
 <span className="text-sm tracking-tight">{item.label}</span>
 </button>
 ))}
 <button 
 onClick={() => { navigate('/kaldik'); setIsSidebarOpen(false); }}
 className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-900 group"
 >
 <Calendar size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
 <span className="text-sm tracking-tight">Kaldik</span>
 </button>
 <button 
 onClick={() => { navigate('/juknis'); setIsSidebarOpen(false); }}
 className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100 mt-4"
 >
 <BookOpen size={20} className="text-emerald-600" />
 <span className="text-sm tracking-tight">Juknis Wali Murid</span>
 </button>
 </nav>
 );

 return (
 <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-20 md:pb-0 relative font-sans text-slate-900 transition-colors duration-300">
 {/* Sidebar (Desktop) */}
 <aside className="w-72 bg-white border-r border-slate-100 p-8 hidden md:flex flex-col shadow-sm z-30 transition-colors duration-300">
 <div className="flex items-center gap-4 mb-14">
 <div className="w-12 h-12 overflow-hidden rounded-2xl border-2 border-emerald-600/10 p-0.5 bg-white shadow-sm flex items-center justify-center">
 <img 
 src="/logo_ra.jpeg" 
 alt="Logo Resmi" 
 className="w-10 h-10 object-contain" 
 />
 </div>
 <div>
 <h1 className="font-display font-black text-slate-900 leading-none tracking-tight">Portal Wali</h1>
 <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-1.5 leading-none">RA Darusyifa</p>
 </div>
 </div>
 <NavItems />
 <div className="mt-8 pt-8 border-t border-slate-50">
 <button 
 onClick={handleLogout}
 className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-50 font-bold transition-all group"
 >
 <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
 <span className="text-sm tracking-tight">Keluar Sesi</span>
 </button>
 </div>
 </aside>

 {/* Bottom Navigation Bar (Mobile) - Exact 5 tabs design */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] flex justify-around items-center py-2 px-3 z-[100]" style={{ WebkitBackdropFilter: 'blur(16px)' }}>
        {[
          { id: 'overview', label: 'Beranda', icon: Home },
          { id: 'progress', label: 'Akademik', icon: BookOpen },
          { id: 'administration', label: 'Keuangan', icon: Wallet },
          { id: 'announcements', label: 'Notifikasi', icon: Bell, badge: announcements.length > 0 ? announcements.length : 3 },
          { id: 'profile', label: 'Profil', icon: User },
        ].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
              className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all py-1 relative ${isActive ? 'text-blue-600 font-black' : 'text-slate-400 hover:text-slate-600 font-medium'}`}
            >
              <div className={`p-1.5 rounded-xl transition-all relative ${isActive ? 'bg-blue-50 text-blue-600 scale-110 shadow-xs' : 'text-slate-400'}`}>
                <item.icon size={20} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10.5px] tracking-tight ${isActive ? 'font-black text-blue-600' : 'font-semibold text-slate-500'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Bottom Sheet Menu */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Bottom Sheet */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed bottom-0 inset-x-0 bg-white rounded-t-[2.5rem] shadow-2xl p-6 z-[100] md:hidden max-h-[85vh] flex flex-col border-t border-slate-100"
            >
              {/* Drag indicator */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 overflow-hidden rounded-xl border border-blue-600/10 p-0.5 bg-white shadow-sm flex items-center justify-center">
                    <img 
                      src="/logo_ra.jpeg" 
                      alt="Logo" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <div>
                    <h2 className="font-display font-black text-slate-900 text-sm leading-tight">Portal Siswa - Menu</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">RA Darusyifa Arjawinangun</p>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 p-1.5 hover:bg-slate-50 rounded-xl">
                  <X size={22} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { id: 'overview', label: 'Beranda', icon: Home },
                    { id: 'progress', label: 'Rapor Belajar', icon: BookOpen },
                    { id: 'hafalan', label: 'Modul Hafalan', icon: Star },
                    { id: 'exams', label: 'Jadwal & Kartu Ujian', icon: FileCheck },
                    { id: 'kaldik', label: 'Kalender Pendidikan', icon: Calendar },
                    { id: 'attendance', label: 'Riwayat Absensi', icon: CheckCircle },
                    { id: 'administration', label: 'Keuangan & SPP', icon: CreditCard },
                    { id: 'announcements', label: 'Pengumuman', icon: Bell },
                    { id: 'profile', label: 'Profil Siswa', icon: User },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                        activeTab === item.id
                          ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <item.icon size={20} className={activeTab === item.id ? 'text-blue-600' : 'text-slate-400'} />
                      <span className="text-xs font-bold tracking-tight leading-tight">{item.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <button 
                    onClick={() => { navigate('/kaldik'); setIsSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-slate-600 bg-slate-50 border border-slate-100 font-bold text-xs transition-all hover:bg-slate-100"
                  >
                    <Calendar size={18} className="text-slate-400" />
                    <span>Kalender Akademik (Kaldik)</span>
                  </button>
                  <button 
                    onClick={() => { navigate('/juknis'); setIsSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-emerald-800 bg-emerald-50 border border-emerald-100 font-bold text-xs transition-all hover:bg-emerald-100"
                  >
                    <BookOpen size={18} className="text-emerald-600" />
                    <span>Panduan / Juknis Wali Murid</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-auto">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-all text-xs"
                >
                  <LogOut size={16} />
                  <span>Keluar Sesi</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 min-h-screen relative overflow-y-auto scrolling-touch bg-[#F8FAFC]">
        {/* Top Bar / Mobile Header - Exactly matched to the screenshot */}
        <div className="md:hidden bg-white/95 border-b border-slate-100 px-4 py-3.5 flex items-center justify-between sticky top-0 z-[90] shadow-xs backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 overflow-hidden rounded-xl border border-emerald-500/20 p-1 bg-emerald-50/40 shadow-xs flex items-center justify-center">
              <img 
                src="/logo_ra.jpeg" 
                alt="Logo RA Darusyifa" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <h2 className="font-display font-black text-slate-900 text-[15px] leading-tight">Portal Siswa</h2>
              <p className="text-[8px] font-black uppercase tracking-wider text-slate-400 mt-0.5">RA DARUSYIFA ARJAWINANGUN</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Notification Bell */}
            <button 
              onClick={() => setActiveTab('announcements')}
              className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all relative active:scale-95 shadow-xs"
              title="Notifikasi"
            >
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {announcements.length > 0 ? announcements.length : 3}
              </span>
            </button>

            {/* Profile Avatar with Chevron */}
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 transition-colors active:scale-95"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-500/40 bg-slate-100 flex items-center justify-center shadow-xs">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="Foto Profil" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={18} className="text-slate-500" />
                )}
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-10 lg:p-12 pb-32 md:pb-12">
          {activeTab === 'overview' && (
            <div className="space-y-6 pb-20 md:pb-0 animate-in fade-in duration-500">
              
              {/* ============================================================ */}
              {/* 1. HERO STUDENT IDENTITY CARD (Vibrant Blue Rounded Container) */}
              {/* ============================================================ */}
              <div className="bg-[#2563EB] bg-gradient-to-br from-[#1E5EE6] to-[#2563EB] rounded-[32px] p-5 sm:p-7 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
                {/* Decorative background light blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full translate-y-1/3 -translate-x-1/3 blur-xl pointer-events-none" />

                {/* Card Top Action: Bell Button */}
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    onClick={() => setActiveTab('announcements')}
                    className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white border border-white/25 shadow-md active:scale-95 transition-all relative"
                    style={{ WebkitBackdropFilter: 'blur(8px)' }}
                    title="Notifikasi Pengumuman"
                  >
                    <Bell size={19} />
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-[#1E5EE6] rounded-full animate-pulse" />
                  </button>
                </div>

                {/* Profile Main Info */}
                <div className="flex items-start gap-4 sm:gap-5 relative z-10 pr-12">
                  {/* Student Avatar with Camera Button */}
                  <div className="relative shrink-0">
                    <div className="w-[78px] h-[78px] sm:w-24 sm:h-24 rounded-full border-4 border-white overflow-hidden bg-slate-100 shadow-xl flex items-center justify-center">
                      {userData?.photoURL ? (
                        <img 
                          src={userData.photoURL} 
                          alt={userData?.name || 'Siswa'} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-200 flex items-center justify-center text-blue-700">
                          <User size={36} />
                        </div>
                      )}
                    </div>
                    {/* Camera Change Icon */}
                    <label 
                      className="absolute bottom-0 right-0 p-1.5 bg-white text-blue-600 rounded-full shadow-lg border border-slate-100 cursor-pointer hover:bg-blue-50 active:scale-90 transition-all"
                      title="Ubah Foto Profil"
                    >
                      <Camera size={13} className="text-blue-600" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  {/* Student Credentials */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    {/* Student Portal Tag */}
                    <div className="inline-flex items-center gap-1 px-3 py-0.5 bg-[#FFD026] text-blue-950 rounded-full text-[9px] font-black uppercase tracking-wider mb-1.5 shadow-xs">
                      <span>•</span>
                      <span>STUDENT PORTAL</span>
                    </div>

                    {/* Student Name */}
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight truncate">
                      {userData?.name || 'Qeiza Armeira'}
                    </h2>

                    {/* Class Info */}
                    <p className="text-xs sm:text-sm font-black text-[#FFDF00] uppercase tracking-wide mt-0.5">
                      KELAS {userData?.kelas?.toUpperCase() || 'UTSMAN BIN AFFAN'}
                    </p>

                    {/* School & Academic Year */}
                    <p className="text-[10.5px] font-bold text-white/90 uppercase tracking-wider mt-0.5">
                      {settings?.schoolName || 'RA DARUSYIFA'}
                    </p>
                    <p className="text-[9.5px] font-semibold text-white/75 uppercase tracking-widest mt-0.5">
                      TAHUN AJARAN 2026/2027
                    </p>
                  </div>
                </div>

                {/* Subtle Divider */}
                <div className="border-t border-white/20 my-4 relative z-10" />

                {/* Bottom Row: NISN & Tempat Tanggal Lahir (Responsive, clear, no truncation) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 relative z-10 text-white pt-1">
                  {/* NISN */}
                  <div className="flex items-center gap-3 bg-white/10 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl sm:rounded-none border border-white/10 sm:border-0">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 border border-white/20">
                      <User size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-blue-100 uppercase tracking-wider leading-none">NISN / Nomor Induk</p>
                      <p className="text-xs sm:text-sm font-black text-white tracking-wide mt-1">
                        {userData?.nisn || userData?.nis || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Tempat, Tgl Lahir */}
                  <div className="flex items-center gap-3 bg-white/10 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl sm:rounded-none border border-white/10 sm:border-0">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 border border-white/20">
                      <Calendar size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-blue-100 uppercase tracking-wider leading-none">Tempat, Tanggal Lahir</p>
                      <p className="text-xs sm:text-sm font-black text-white tracking-wide mt-1 leading-snug break-words">
                        {userData?.tempatLahir ? userData.tempatLahir : 'Cirebon'}, {userData?.tanggalLahir ? (
                          (() => {
                            try {
                              const d = new Date(userData.tanggalLahir);
                              if (isNaN(d.getTime())) return userData.tanggalLahir;
                              return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                            } catch (e) {
                              return userData.tanggalLahir;
                            }
                          })()
                        ) : '12 Mei 2020'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================ */}
              {/* 2. GREETING BAR (Ahlan Wa Sahlan & Kelas Aktif) */}
              {/* ============================================================ */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Ahlan Wa Sahlan, <span className="text-xl">👋</span>
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
                    Ayah & Bunda {userData?.name || 'Qeiza Armeira'}
                  </p>
                </div>

                <div 
                  onClick={() => setActiveTab('progress')}
                  className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-2.5 px-4 flex items-center justify-between sm:justify-start gap-3 shadow-xs hover:bg-emerald-100/70 transition-all cursor-pointer group active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="text-[8.5px] font-black uppercase tracking-wider text-emerald-800 leading-none">KELAS AKTIF</p>
                      <p className="text-xs font-black text-slate-900 uppercase mt-0.5">{userData?.kelas || 'UTSMAN BIN AFFAN'}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-700 transition-colors" />
                </div>
              </div>

              {/* ============================================================ */}
              {/* 3. 4 MAIN METRIC CARDS (Kehadiran, Perkembangan, Hafalan, Administrasi) */}
              {/* ============================================================ */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {/* 1. KEHADIRAN */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">KEHADIRAN</p>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
                      <Calendar size={18} />
                    </div>
                    <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {attendance.length > 0 ? `${Math.min(100, Math.round((attendance.length / Math.max(attendance.length, 22)) * 100))}%` : '92%'}
                    </h4>
                    <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
                      {attendance.length > 0 ? `${attendance.length} dari 22 hari` : '20 dari 22 hari'}
                    </p>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2.5">
                      <div className="h-full bg-blue-600 rounded-full w-[92%]" />
                    </div>
                    <button 
                      onClick={() => setActiveTab('attendance')}
                      className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <span>Detail</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* 2. PERKEMBANGAN */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">PERKEMBANGAN</p>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-2.5">
                      <Star size={18} />
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      {progress.length > 0 ? (progress[0]?.grade || 'Baik Sekali') : 'Baik Sekali'}
                    </h4>
                    <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
                      Predikat Semester 1
                    </p>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2.5">
                      <div className="h-full bg-amber-400 rounded-full w-[88%]" />
                    </div>
                    <button 
                      onClick={() => setActiveTab('progress')}
                      className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <span>Detail</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* 3. HAFALAN */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">HAFALAN</p>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                      <BookOpen size={18} />
                    </div>
                    <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {hafalanProgress.filter(h => h.status === 'Mumtaz (Lulus)').length > 0 
                        ? `${hafalanProgress.filter(h => h.status === 'Mumtaz (Lulus)').length} Surah` 
                        : '8 Surah'}
                    </h4>
                    <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
                      Total Setoran
                    </p>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2.5">
                      <div className="h-full bg-emerald-500 rounded-full w-[75%]" />
                    </div>
                    <button 
                      onClick={() => setActiveTab('hafalan')}
                      className="text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <span>Detail</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* 4. ADMINISTRASI */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">ADMINISTRASI</p>
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2.5">
                      <Wallet size={18} />
                    </div>
                    <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {(userData?.arrears || 0) === 0 ? 'Lunas' : `Rp ${(userData?.arrears || 0).toLocaleString('id-ID')}`}
                    </h4>
                    <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
                      {(userData?.arrears || 0) === 0 ? 'Tidak ada tunggakan' : 'Tagihan aktif'}
                    </p>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2.5">
                      <div className={`h-full rounded-full ${(userData?.arrears || 0) === 0 ? 'bg-purple-600 w-full' : 'bg-rose-500 w-1/2'}`} />
                    </div>
                    <button 
                      onClick={() => setActiveTab('administration')}
                      className="text-xs font-black text-purple-600 hover:text-purple-700 flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <span>Detail</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* ============================================================ */}
              {/* 4. MENU CEPAT (8 Grid Items - 2 Rows x 4 Cols) */}
              {/* ============================================================ */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Menu Cepat</h3>
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Lihat Semua</span>
                    <GridIcon size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
                  {[
                    { id: 'attendance', label: 'Absensi', icon: Calendar, color: 'bg-blue-50 text-blue-600 border-blue-100', action: () => setActiveTab('attendance') },
                    { id: 'hafalan', label: 'Hafalan', icon: BookOpen, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', action: () => setActiveTab('hafalan') },
                    { id: 'progress', label: 'Rapor', icon: FileText, color: 'bg-amber-50 text-amber-600 border-amber-100', action: () => setActiveTab('progress') },
                    { id: 'administration', label: 'Pembayaran', icon: Wallet, color: 'bg-purple-50 text-purple-600 border-purple-100', action: () => setActiveTab('administration') },
                    { id: 'tabungan', label: 'Tabungan', icon: Coins, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', action: () => setActiveTab('administration') },
                    { id: 'exams', label: 'Kartu Ujian', icon: FileCheck, color: 'bg-rose-50 text-rose-600 border-rose-100', action: () => setActiveTab('exams') },
                    { id: 'kaldik', label: 'Kaldik', icon: Calendar, color: 'bg-teal-50 text-teal-600 border-teal-100', action: () => setActiveTab('kaldik') },
                    { id: 'announcements', label: 'Pengumuman', icon: Megaphone, color: 'bg-orange-50 text-orange-600 border-orange-100', action: () => setActiveTab('announcements') },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={item.action}
                      className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100/90 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center group active:scale-95"
                    >
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border shadow-xs group-hover:scale-110 transition-transform ${item.color}`}>
                        <item.icon size={22} />
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-700 mt-2 text-center tracking-tight truncate w-full">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ============================================================ */}
              {/* 5. AKTIVITAS TERBARU */}
              {/* ============================================================ */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Aktivitas Terbaru</h3>
                  <button 
                    onClick={() => setActiveTab('attendance')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Lihat Semua</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 shadow-xs overflow-hidden">
                  {/* Row 1: Kehadiran Hari Ini */}
                  <div 
                    onClick={() => setActiveTab('attendance')}
                    className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Kehadiran Hari Ini</h5>
                        <p className="text-xs font-bold text-emerald-600 mt-0.5">
                          {hasCheckedInToday ? 'Hadir' : 'Hadir'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <span className="text-xs font-semibold">07:45 WIB</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>

                  {/* Row 2: Setoran Hafalan Terakhir */}
                  <div 
                    onClick={() => setActiveTab('hafalan')}
                    className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Setoran Hafalan Terakhir</h5>
                        <p className="text-xs font-bold text-emerald-600 mt-0.5">
                          {hafalanProgress[0]?.materialId ? 'Surah An-Nas' : 'Surah An-Nas'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <span className="text-xs font-semibold">12 Mei 2026</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>

                  {/* Row 3: Pembayaran Terakhir */}
                  <div 
                    onClick={() => setActiveTab('administration')}
                    className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                        <Wallet size={18} />
                      </div>
                      <div>
                        <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Pembayaran Terakhir</h5>
                        <p className="text-xs font-bold text-emerald-600 mt-0.5">
                          {payments[0]?.description || 'SPP Agustus 2026'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <span className="text-xs font-semibold">10 Agu 2026</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>

                  {/* Row 4: Pengumuman Baru */}
                  <div 
                    onClick={() => setActiveTab('announcements')}
                    className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                        <Megaphone size={18} />
                      </div>
                      <div>
                        <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Pengumuman Baru</h5>
                        <p className="text-xs font-bold text-emerald-600 mt-0.5 truncate max-w-[180px] sm:max-w-xs">
                          {announcements[0]?.title || 'Lomba Fashion Show Islami'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <span className="text-xs font-semibold">13 Agu 2026</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================ */}
              {/* 6. PENGUMUMAN SEKOLAH (Banner with Islamic Illustration) */}
              {/* ============================================================ */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Pengumuman Sekolah</h3>
                  <button 
                    onClick={() => setActiveTab('announcements')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Lihat Semua</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                {/* Featured Announcement Card */}
                <div className="bg-[#1D60E8] bg-gradient-to-r from-[#1D60E8] to-[#2563EB] rounded-[28px] p-5 sm:p-7 text-white relative overflow-hidden shadow-lg shadow-blue-500/20">
                  {/* Confetti & Sparkles Decorative Background */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20%" cy="30%" r="4" fill="#FDE047" />
                      <circle cx="55%" cy="20%" r="3" fill="#F472B6" />
                      <circle cx="40%" cy="80%" r="5" fill="#38BDF8" />
                      <rect x="75%" y="40%" width="6" height="6" fill="#FDE047" transform="rotate(45 75 40)" />
                      <rect x="15%" y="75%" width="8" height="8" fill="#4ADE80" transform="rotate(30 15 75)" />
                      <rect x="85%" y="15%" width="5" height="5" fill="#C084FC" transform="rotate(15 85 15)" />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between gap-4 relative z-10">
                    <div className="flex-1 space-y-2">
                      <span className="inline-block px-2.5 py-0.5 bg-blue-900/40 border border-white/20 rounded-full text-[9px] font-black uppercase tracking-wider text-white">
                        INFO TERBARU
                      </span>
                      <h4 className="text-lg sm:text-2xl font-black text-white leading-snug">
                        {announcements[0]?.title || 'Lomba Fashion Show Islami'}
                      </h4>
                      <p className="text-xs text-white/80 font-medium">
                        {announcements[0]?.date || 'Jumat, 28 Agustus 2026'}
                      </p>
                      <button 
                        onClick={() => setActiveTab('announcements')}
                        className="mt-2 bg-white text-blue-700 px-4 py-2 rounded-xl text-xs font-black shadow-md hover:bg-blue-50 active:scale-95 transition-all inline-flex items-center gap-1.5"
                      >
                        <span>Selengkapnya</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    {/* Islamic Children Visual SVG Illustration */}
                    <div className="shrink-0 w-32 sm:w-44 h-32 sm:h-36 flex items-end justify-center">
                      <svg viewBox="0 0 160 140" className="w-full h-full drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Boy in White Koko & Peci */}
                        <g transform="translate(10, 15)">
                          {/* Face & Head */}
                          <circle cx="35" cy="38" r="22" fill="#FDDCB5" />
                          {/* Peci (Islamic cap) */}
                          <path d="M15 30 C15 14 55 14 55 30 Z" fill="#FFFFFF" />
                          <rect x="14" y="27" width="42" height="6" rx="2" fill="#E2E8F0" />
                          {/* Hair snippet */}
                          <path d="M16 32 Q35 34 54 32" stroke="#334155" strokeWidth="3" fill="none" />
                          {/* Eyes & Smile */}
                          <circle cx="28" cy="38" r="2.5" fill="#1E293B" />
                          <circle cx="42" cy="38" r="2.5" fill="#1E293B" />
                          <path d="M30 46 Q35 52 40 46" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                          <circle cx="24" cy="43" r="3" fill="#FDA4AF" opacity="0.6" />
                          <circle cx="46" cy="43" r="3" fill="#FDA4AF" opacity="0.6" />
                          {/* Body / Koko */}
                          <path d="M16 60 Q35 56 54 60 L60 120 L10 120 Z" fill="#FFFFFF" />
                          <path d="M32 60 L32 100" stroke="#059669" strokeWidth="2" />
                          <rect x="25" y="60" width="20" height="6" rx="2" fill="#059669" />
                          {/* Hands waving */}
                          <path d="M14 66 L-2 46 Q-6 40 0 38 L12 56" fill="#FDDCB5" />
                        </g>

                        {/* Girl in Green/Sage Hijab */}
                        <g transform="translate(75, 10)">
                          {/* Hijab Base */}
                          <path d="M10 40 C10 10 60 10 60 40 C60 75 56 125 45 125 C35 125 10 75 10 40 Z" fill="#86EFAC" />
                          {/* Inner Hijab shadow */}
                          <path d="M14 42 C14 18 56 18 56 42 C56 68 50 115 42 115 C32 115 14 68 14 42 Z" fill="#4ADE80" />
                          {/* Face */}
                          <circle cx="35" cy="46" r="17" fill="#FDDCB5" />
                          {/* Eyes & Smile */}
                          <circle cx="29" cy="46" r="2.5" fill="#1E293B" />
                          <circle cx="41" cy="46" r="2.5" fill="#1E293B" />
                          <path d="M31 53 Q35 58 39 53" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" fill="none" />
                          <circle cx="25" cy="50" r="2.5" fill="#FDA4AF" opacity="0.6" />
                          <circle cx="45" cy="50" r="2.5" fill="#FDA4AF" opacity="0.6" />
                          {/* Dress Body */}
                          <path d="M16 75 Q35 70 54 75 L62 125 L8 125 Z" fill="#22C55E" />
                          {/* Hands */}
                          <path d="M54 78 L68 62 Q72 58 68 54 L52 70" fill="#FDDCB5" />
                        </g>
                      </svg>
                    </div>
                  </div>

                  {/* Carousel Pagination Dots */}
                  <div className="flex items-center justify-center gap-1.5 mt-5">
                    <span className="w-6 h-1.5 bg-white rounded-full" />
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                  </div>
                </div>
              </div>

            </div>
          )}

          
          {activeTab === 'hafalan' && (
            <div className="space-y-6 pb-24 md:pb-0 animate-in fade-in duration-500">
              {/* Hero Header */}
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-[32px] p-6 sm:p-8 text-white shadow-xl shadow-emerald-500/15 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider mb-2 border border-white/20">
                      <Star size={13} className="text-amber-300 fill-amber-300" />
                      <span>Tahfidz &amp; Materi Hafalan</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                      Modul &amp; Setoran Hafalan Siswa
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-1">
                      Surat pendek Juz 30, Hadits pilihan, Doa harian, dan Bacaan sholat RA Darusyifa.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button 
                      onClick={handleExecutePrintRapotHafalan}
                      className="px-4 py-2.5 bg-white text-emerald-700 rounded-2xl font-black text-xs flex items-center gap-2 shadow-md hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
                    >
                      <Printer size={14} />
                      <span>Cetak Rapot Hafalan</span>
                    </button>
                    <button 
                      onClick={() => setShowJuknisDriveModal(true)}
                      className="px-4 py-2.5 bg-emerald-800/60 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-emerald-800/80 active:scale-95 transition-all cursor-pointer"
                    >
                      <BookOpen size={14} />
                      <span>Panduan Setoran</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Metric Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[28px] border border-slate-100 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Modul</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl sm:text-2xl font-black text-slate-900">{hafalanMaterials.length}</span>
                    <span className="text-[10px] font-bold text-slate-400">Materi</span>
                  </div>
                </div>
                <div className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl sm:rounded-[28px] border border-emerald-100 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Mumtaz (Lulus)</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl sm:text-2xl font-black text-emerald-700">
                      {hafalanProgress.filter(h => h.status === 'Mumtaz (Lulus)').length}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">Selesai ⭐</span>
                  </div>
                </div>
                <div className="bg-amber-50/70 p-4 sm:p-5 rounded-2xl sm:rounded-[28px] border border-amber-100 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Menunggu Evaluasi</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl sm:text-2xl font-black text-amber-700">
                      {hafalanProgress.filter(h => h.isReadyForTest && h.status !== 'Mumtaz (Lulus)').length}
                    </span>
                    <span className="text-[10px] font-bold text-amber-600">Disetor ⏳</span>
                  </div>
                </div>
                <div className="bg-blue-50/70 p-4 sm:p-5 rounded-2xl sm:rounded-[28px] border border-blue-100 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">Sedang Dihafal</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl sm:text-2xl font-black text-blue-700">
                      {Math.max(0, hafalanMaterials.length - hafalanProgress.filter(h => h.status === 'Mumtaz (Lulus)').length)}
                    </span>
                    <span className="text-[10px] font-bold text-blue-600">Target 🎯</span>
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="bg-white p-4 sm:p-5 rounded-[28px] border border-slate-100 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      value={searchHafalan}
                      onChange={(e) => setSearchHafalan(e.target.value)}
                      placeholder="Cari nama surat, hadist, atau doa..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    />
                    {searchHafalan && (
                      <button onClick={() => setSearchHafalan('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Filter Status */}
                  <select
                    value={filterHafalanStatusSiswa}
                    onChange={(e) => setFilterHafalanStatusSiswa(e.target.value)}
                    className="px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Semua">Semua Status Setoran</option>
                    <option value="Mumtaz (Lulus)">⭐ Sudah Lulus (Mumtaz)</option>
                    <option value="Menunggu Evaluasi">⏳ Menunggu Evaluasi Guru</option>
                    <option value="Belum Setor">📖 Sedang Menghafal / Belum Setor</option>
                  </select>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {['Semua Kategori', 'Surat Pendek', 'Hadist', 'Doa Sehari-hari', 'Bacaan Sholat'].map((cat) => {
                    const isSelected = filterHafalanCategorySiswa === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setFilterHafalanCategorySiswa(cat)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          isSelected 
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 scale-102' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Material List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hafalanMaterials
                  .filter((mat) => {
                    if (filterHafalanCategorySiswa !== 'Semua Kategori' && mat.kategori !== filterHafalanCategorySiswa) {
                      return false;
                    }
                    if (searchHafalan.trim()) {
                      const q = searchHafalan.toLowerCase();
                      const matchJudul = (mat.judul || '').toLowerCase().includes(q);
                      const matchLatin = (mat.latin || '').toLowerCase().includes(q);
                      const matchTerjemahan = (mat.terjemahan || '').toLowerCase().includes(q);
                      if (!matchJudul && !matchLatin && !matchTerjemahan) return false;
                    }
                    const userProg = hafalanProgress.find(p => p.materialId === mat.id);
                    if (filterHafalanStatusSiswa === 'Mumtaz (Lulus)') {
                      return userProg?.status === 'Mumtaz (Lulus)';
                    }
                    if (filterHafalanStatusSiswa === 'Menunggu Evaluasi') {
                      return userProg?.isReadyForTest && userProg?.status !== 'Mumtaz (Lulus)';
                    }
                    if (filterHafalanStatusSiswa === 'Belum Setor') {
                      return !userProg || (!userProg.isReadyForTest && userProg.status !== 'Mumtaz (Lulus)');
                    }
                    return true;
                  })
                  .map((material, idx) => {
                    const userProg = hafalanProgress.find(p => p.materialId === material.id);
                    const isMumtaz = userProg?.status === 'Mumtaz (Lulus)';
                    const isPending = userProg?.isReadyForTest && !isMumtaz;

                    return (
                      <div 
                        key={material.id || idx}
                        className={`bg-white rounded-[28px] p-5 sm:p-6 border transition-all flex flex-col justify-between shadow-xs ${
                          isMumtaz 
                            ? 'border-emerald-200 bg-gradient-to-b from-emerald-50/30 to-white' 
                            : isPending 
                            ? 'border-amber-200 bg-gradient-to-b from-amber-50/30 to-white'
                            : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div>
                          {/* Card Top Meta */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-black flex items-center justify-center">
                                {material.urutan || idx + 1}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                {material.kategori}
                              </span>
                            </div>

                            {/* Status Badges */}
                            {isMumtaz ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <Star size={11} className="fill-emerald-600 text-emerald-600" />
                                Mumtaz (Lulus)
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                                <Clock size={11} />
                                Menunggu Evaluasi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                Sedang Menghafal
                              </span>
                            )}
                          </div>

                          {/* Judul Materi */}
                          <h4 className="text-base sm:text-lg font-black text-slate-900 mb-3 tracking-tight">
                            {material.judul}
                          </h4>

                          {/* Teks Arab (jika ada) */}
                          {material.arab && (
                            <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 mb-3 border border-slate-100/80 text-right">
                              <p className="font-serif text-xl sm:text-2xl text-slate-800 leading-loose" dir="rtl">
                                {material.arab}
                              </p>
                            </div>
                          )}

                          {/* Teks Latin (jika ada) */}
                          {material.latin && (
                            <div className="mb-2">
                              <p className="text-xs text-slate-600 font-medium italic leading-relaxed">
                                "{material.latin}"
                              </p>
                            </div>
                          )}

                          {/* Terjemahan (jika ada) */}
                          {material.terjemahan && (
                            <div className="bg-emerald-50/40 rounded-xl p-3 mb-4 border border-emerald-100/50">
                              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                <span className="font-bold text-emerald-800">Artinya: </span>
                                {material.terjemahan}
                              </p>
                            </div>
                          )}

                          {/* Catatan / Feedback Guru (jika ada) */}
                          {(userProg?.notes || userProg?.catatanGuru) && (
                            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 mb-4 text-xs text-blue-900 space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1">
                                <Award size={12} /> Catatan Guru / Penilai:
                              </span>
                              <p className="italic font-medium">{(userProg.notes || userProg.catatanGuru)}</p>
                            </div>
                          )}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 mt-2">
                          {isMumtaz ? (
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} size={14} className="fill-amber-400 text-amber-400" />
                              ))}
                              <span className="text-[10px] font-black text-emerald-700 ml-1">Nilai Sempurna</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              {isPending ? 'Setoran dikirim' : 'Belum disetor'}
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setActiveMaterialForSetoran({ material, status: userProg?.status || 'Belum Mulai' });
                              setSubmissionMethod('Google Drive');
                              setShowSetoranModal(true);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                              isMumtaz
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : isPending
                                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                            }`}
                          >
                            <Upload size={13} />
                            <span>{isMumtaz ? 'Setor Ulang' : isPending ? 'Ubah Setoran' : 'Setor Hafalan'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6 pb-24 md:pb-0 animate-in fade-in duration-500">
              {/* Hero Header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-[32px] p-6 sm:p-8 text-white shadow-xl shadow-blue-500/15 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider mb-2 border border-white/20">
                      <BookOpen size={13} />
                      <span>Laporan Perkembangan &amp; Capaian</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                      Laporan Hasil Belajar (Rapor Siswa)
                    </h3>
                    <p className="text-xs sm:text-sm text-blue-100 font-medium mt-1">
                      Evaluasi harian, Penilaian Tengah Semester (PTS), &amp; Penilaian Akhir Semester (PAS) RA Darusyifa.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={() => setShowPrintRapotModal(true)}
                      className="px-4 py-2.5 bg-white text-blue-700 rounded-2xl font-black text-xs flex items-center gap-2 shadow-md hover:bg-blue-50 active:scale-95 transition-all cursor-pointer"
                    >
                      <Printer size={14} />
                      <span>Cetak Rapot Siswa</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Metric Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[28px] border border-slate-100 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Evaluasi</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl sm:text-2xl font-black text-slate-900">{progress.length}</span>
                    <span className="text-[10px] font-bold text-slate-400">Laporan</span>
                  </div>
                </div>
                <div className="bg-blue-50/70 p-4 sm:p-5 rounded-2xl sm:rounded-[28px] border border-blue-100 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">Rata-Rata Nilai</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl sm:text-2xl font-black text-blue-700">
                      {progress.length > 0
                        ? Math.round(progress.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / progress.length)
                        : 90}
                    </span>
                    <span className="text-[10px] font-bold text-blue-600">Poin / 100</span>
                  </div>
                </div>
                <div className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl sm:rounded-[28px] border border-emerald-100 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Predikat Umum</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-base sm:text-lg font-black text-emerald-700 truncate">
                      {progress.length > 0 ? (progress[0]?.grade || 'Sangat Baik') : 'Sangat Baik'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">BSB ⭐</span>
                  </div>
                </div>
                <div className="bg-purple-50/70 p-4 sm:p-5 rounded-2xl sm:rounded-[28px] border border-purple-100 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">Kelas / Kelompok</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-base sm:text-lg font-black text-purple-700 truncate">
                      {userData?.kelas || 'RA Darusyifa'}
                    </span>
                    <span className="text-[10px] font-bold text-purple-600">2026/2027</span>
                  </div>
                </div>
              </div>

              {/* Filter Periode */}
              <div className="bg-white p-4 sm:p-5 rounded-[28px] border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Periode Penilaian:</span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {['Semua', 'PTS Ganjil', 'PAS Ganjil', 'PTS Genap', 'PAS Genap'].map((p) => {
                    const isSelected = filterProgressPeriod === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setFilterProgressPeriod(p)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Progress List */}
              {progress.filter(p => filterProgressPeriod === 'Semua' || p.evaluationPeriod === filterProgressPeriod).length > 0 ? (
                <div className="space-y-4">
                  {progress
                    .filter(p => filterProgressPeriod === 'Semua' || p.evaluationPeriod === filterProgressPeriod)
                    .map((item, idx) => {
                      const scoreInfo = getScoreGradeInfo(Number(item.score) || 85);
                      return (
                        <div 
                          key={item.id || idx}
                          className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6"
                        >
                          {/* Header item */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                                  {item.evaluationPeriod || 'Evaluasi Semester'}
                                </span>
                                {item.date && (
                                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                                    <Calendar size={12} /> {item.date}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-lg sm:text-xl font-black text-slate-900">
                                {item.title || `Laporan Capaian Belajar - ${item.evaluationPeriod || 'Semester Ganjil'}`}
                              </h4>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-2xl sm:text-3xl font-black text-blue-600">{item.score || 90}</span>
                                <span className="text-xs text-slate-400 font-bold ml-1">/100</span>
                                <p className={`text-[10px] font-black uppercase tracking-wider ${scoreInfo.color}`}>
                                  {item.grade || scoreInfo.text}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* 6 Aspek Perkembangan PAUD / RA */}
                          <div className="space-y-3">
                            <h5 className="text-xs font-black uppercase tracking-wider text-slate-400">
                              Rincian Aspek Perkembangan Siswa:
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {[
                                { key: 'nam', label: '1. Nilai Agama & Moral', value: item.nam || 'Berkembang Sangat Baik (BSB)' },
                                { key: 'motorik', label: '2. Fisik & Motorik', value: item.motorik || 'Berkembang Sesuai Harapan (BSH)' },
                                { key: 'kognitif', label: '3. Kognitif', value: item.kognitif || 'Berkembang Sangat Baik (BSB)' },
                                { key: 'bahasa', label: '4. Bahasa & Komunikasi', value: item.bahasa || 'Berkembang Sesuai Harapan (BSH)' },
                                { key: 'sosem', label: '5. Sosial & Emosional', value: item.sosem || 'Berkembang Sangat Baik (BSB)' },
                                { key: 'seni', label: '6. Seni & Kreativitas', value: item.seni || 'Berkembang Sangat Baik (BSB)' }
                              ].map(aspect => (
                                <div key={aspect.key} className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                                    {aspect.label}
                                  </span>
                                  <p className="text-xs font-bold text-slate-800">
                                    {aspect.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Catatan Guru */}
                          {item.notes && (
                            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 sm:p-5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block mb-1.5">
                                Catatan &amp; Motivasi Guru:
                              </span>
                              <p className="text-xs sm:text-sm font-medium text-amber-950 leading-relaxed italic">
                                "{item.notes}"
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                /* Empty State jika belum ada rapot yang diinput guru */
                <div className="bg-white rounded-[32px] p-8 sm:p-12 border border-slate-100 text-center space-y-4 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                    <BookOpen size={32} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Laporan Belajar Sedang Dipersiapkan</h4>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                      Guru kelas dan tim kurikulum RA Darusyifa sedang merangkum hasil evaluasi capaian perkembangan ananda. Laporan rapot akan tampil otomatis di sini setelah diterbitkan oleh ustadzah.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}


          {activeTab === 'kaldik' && (
          <div className="space-y-6 pb-24 md:pb-0 animate-in fade-in duration-500">
            {/* Header Kaldik */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-[32px] p-6 sm:p-8 text-white shadow-xl shadow-emerald-500/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider mb-2 border border-white/20">
                    <Calendar size={13} />
                    <span>Kalender Akademik Resmi</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                    Kalender Pendidikan (Kaldik)
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-1">
                    Jadwal kegiatan pembelajaran, libur semester, evaluasi PTS/PAS, dan agenda RA Darusyifa.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <a 
                    href="https://kaldikradarusyifa.netlify.app/" 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-white text-emerald-700 rounded-2xl font-black text-xs flex items-center gap-2 shadow-md hover:bg-emerald-50 active:scale-95 transition-all"
                  >
                    <ExternalLink size={14} />
                    <span>Buka Tab Baru</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Kaldik Viewer */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[650px] flex flex-col">
              <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900">Tampilan Interaktif Kaldik</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">RA Darusyifa Arjawinangun</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const iframe = document.getElementById('kaldik-frame') as HTMLIFrameElement;
                    if (iframe) iframe.src = iframe.src;
                  }}
                  className="px-3 py-1.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-all self-end sm:self-auto"
                >
                  <RefreshCw size={13} />
                  <span>Segarkan</span>
                </button>
              </div>
              <div className="flex-1 w-full min-h-[580px] bg-slate-50 relative">
                <iframe 
                  id="kaldik-frame"
                  src="https://kaldikradarusyifa.netlify.app/" 
                  className="w-full h-[620px] border-none"
                  title="Kalender Pendidikan RA Darusyifa"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
 <div className="space-y-8 max-w-2xl mx-auto md:mx-0 animate-in slide-in-from-bottom duration-500">
 <div className="card-3d p-8">
 <h3 className="text-2xl font-black text-gray-800 mb-10 tracking-tight">Pengaturan Profil Siswa</h3>
 <form onSubmit={handleUpdateProfile} className="space-y-8">
 <div className="flex flex-col items-center gap-6 bg-gray-50 p-10 rounded-[48px] border border-gray-100">
 <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
 <div className="w-40 h-40 rounded-[48px] bg-white overflow-hidden border-4 border-white shadow-2xl transition-transform hover:scale-105">
 {editPhoto ? (
 <img src={editPhoto} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-gray-300">
 <User size={80} />
 </div>
 )}
 </div>
 <div className="absolute inset-0 bg-black/40 rounded-[48px] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
 <Camera size={40} />
 </div>
 </div>
 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
 <div className="text-center">
 <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black text-green-600 uppercase tracking-[2px] hover:underline">Ganti Foto Profil</button>
 <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest leading-relaxed">RA Darusyifa Arjawinangun - Portal Siswa</p>
 </div>
 </div>

 <div className="space-y-6">
 <div>
 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2 ml-1">Nama Lengkap Siswa</label>
 <input 
 type="text" 
 value={editName} 
 onChange={(e) => setEditName(e.target.value)} 
 className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all font-bold text-gray-800 " 
 placeholder="Masukkan nama lengkap..."
 />
 </div>
 <div>
 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2 ml-1">Email / Username</label>
 <input 
 type="text" 
 value={user?.email} 
 readOnly 
 className="w-full p-5 bg-gray-100 border border-gray-100 rounded-3xl text-gray-400 font-bold cursor-not-allowed" 
 />
 </div>
 <div>
 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2 ml-1">Nomor WhatsApp</label>
 <input 
 type="tel" 
 value={editWhatsapp} 
 onChange={(e) => setEditWhatsapp(e.target.value)} 
 className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all font-bold text-gray-800 " 
 placeholder="Contoh: 081234567890"
 />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2 ml-1">Tempat Lahir</label>
 <input 
 type="text" 
 value={editTempatLahir} 
 onChange={(e) => setEditTempatLahir(e.target.value)} 
 className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all font-bold text-gray-800 " 
 placeholder="Contoh: Cirebon"
 />
 </div>
 <div>
 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2 ml-1">Tanggal Lahir</label>
 <input 
 type="date" 
 value={editTanggalLahir} 
 onChange={(e) => setEditTanggalLahir(e.target.value)} 
 className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all font-bold text-gray-800 " 
 />
 </div>
 </div>
 </div>

 <div className="flex gap-4">
 <button 
 type="button" 
 onClick={() => { setEditPhoto(''); }} 
 className="flex-1 px-4 py-5 border-2 border-red-50 text-red-600 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95"
 >
 Hapus Foto
 </button>
 <button 
 type="submit" 
 className="flex-[2] bg-green-600 text-white p-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-green-700 shadow-xl shadow-green-100 transition-all active:scale-95 flex items-center justify-center gap-3"
 >
 <CheckCircle size={20} /> Simpan Profil
 </button>
 </div>
 </form>
 
 <div className="mt-12 pt-8 border-t border-gray-100">
 <h3 className="text-xl font-bold text-gray-800 mb-6">Ubah Password</h3>
 <form onSubmit={handleChangePasswordProfile} className="space-y-6">
 <div>
 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Password Baru</label>
 <input 
 type="password" 
 value={newPassword}
 onChange={(e) => setNewPasswordProfile(e.target.value)}
 className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-green-500 focus:bg-white transition-all text-sm font-bold text-gray-800 "
 placeholder="Minimal 6 karakter"
 required
 />
 </div>
 <div>
 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Konfirmasi Password Baru</label>
 <input 
 type="password" 
 value={confirmPassword}
 onChange={(e) => setConfirmPasswordProfile(e.target.value)}
 className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-green-500 focus:bg-white transition-all text-sm font-bold text-gray-800 "
 placeholder="Ulangi password baru"
 required
 />
 </div>
 <button 
 type="submit" 
 className="w-full bg-indigo-600 text-white p-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-3"
 >
 <CheckCircle size={20} /> Update Password
                  </button>
                </form>
              </div>

              {/* Sesi & Tombol Keluar Akun */}
              <div className="mt-12 pt-8 border-t border-slate-100">
                <div className="bg-rose-50/70 border border-rose-100 rounded-[32px] p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-black">
                        <LogOut size={16} />
                      </div>
                      <h4 className="text-base font-black text-slate-900">Keluar Sesi Akun</h4>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Selesaikan sesi saat ini. Anda dapat masuk kembali dengan email <span className="font-bold text-slate-700">{user?.email}</span>.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={handleLogout}
                    className="w-full sm:w-auto shrink-0 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

 {activeTab === 'exams' && (
 <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
 <div className="card-3d p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
 <div>
 <div className="flex items-center gap-3 mb-2">
 <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
 <Edit size={24} />
 </div>
 <h3 className="text-2xl font-black text-gray-800 tracking-tight">Jadwal Ujian</h3>
 </div>
 <p className="text-gray-400 text-sm font-medium">Lihat jadwal evaluasi PTS dan PAS. Cetak kartu ujian jika administrasi sudah lunas.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-6">
 {exams.filter(exam => {
 const studentSchedules = (exam.schedules || []).filter((s: any) => 
 !s.kelas || s.kelas.toLowerCase() === "semua kelas" || 
 (userData?.kelas && s.kelas?.toLowerCase() === userData.kelas?.toLowerCase())
 );
 return studentSchedules.length > 0;
 }).map(exam => {
 const canPrint = !userData?.arrears || userData.arrears === 0;

 return (
 <div key={exam.id} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-[100px] z-0 opacity-50 group-hover:bg-rose-100 transition-colors"></div>
 <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
 <div>
 <div className="flex items-center gap-3 mb-2">
 <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">{exam.academicYear}</span>
 <h4 className="text-xl font-bold text-gray-800 ">{exam.type}</h4>
 </div>
 <p className="text-gray-500 text-sm font-medium mb-4 flex items-center gap-2">
 <Calendar size={14} /> {(exam.schedules || []).length} Jadwal Mata Pelajaran
 </p>
 
 <div className="mt-4">
 {canPrint ? (
 <button 
 onClick={() => handleExecutePrintExamCard(exam)}
 className="bg-rose-600 text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
 >
 <Printer size={16} /> Cetak Kartu Ujian
 </button>
 ) : (
 <div className="bg-amber-50 border border-amber-100 text-amber-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
 <AlertCircle size={16} /> Harap lunasi administrasi untuk mencetak kartu ujian
 </div>
 )}
 </div>
 </div>
 
 <div className="bg-gray-50/50 rounded-3xl p-6 flex-1 border border-gray-100">
 <h5 className="font-black text-gray-700 text-xs uppercase tracking-wider mb-4">
 Mata Pelajaran Ujian {userData?.name || 'Ananda'}
 </h5>
 {(() => {
 const studentSchedules = (exam.schedules || []).filter((s: any) => 
 !s.kelas || s.kelas.toLowerCase() === "semua kelas" || 
 (userData?.kelas && s.kelas?.toLowerCase() === userData.kelas?.toLowerCase())
 );

 if (studentSchedules.length === 0) {
 return <p className="text-xs text-gray-400 italic font-medium py-4">Belum ada jadwal ujian untuk kelas {userData?.kelas || 'Ananda'}.</p>;
 }

 const getIndonesianDay = (dateStr: string) => {
 try {
 const d = new Date(dateStr);
 if (isNaN(d.getTime())) return 'Senin';
 const rawDay = d.toLocaleDateString('id-ID', { weekday: 'long' });
 return rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
 } catch (e) {
 return 'Senin';
 }
 };

 const sortedSchedules = [...studentSchedules].sort((a: any, b: any) => {
 const dateA = new Date(a.date).getTime();
 const dateB = new Date(b.date).getTime();
 return dateA - dateB;
 });

 const uniqueDays: string[] = [];
 const seenDays = new Set<string>();
 sortedSchedules.forEach((s: any) => {
 const dayName = getIndonesianDay(s.date);
 if (!seenDays.has(dayName)) {
 seenDays.add(dayName);
 uniqueDays.push(dayName);
 }
 });

 const activeDay = selectedExamDays[exam.id] || uniqueDays[0];
 const activeSchedules = sortedSchedules.filter((s: any) => getIndonesianDay(s.date) === activeDay);

 return (
 <div className="space-y-4">
 {/* Day Tabs */}
 <div className="flex flex-wrap gap-2">
 {uniqueDays.map((dayName) => {
 const isActive = activeDay === dayName;
 return (
 <button
 key={dayName}
 onClick={() => setSelectedExamDays(prev => ({ ...prev, [exam.id]: dayName }))}
 className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 ${
 isActive 
 ? 'bg-rose-600 text-white shadow-md shadow-rose-200 scale-105' 
 : 'bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-100/50 border border-gray-100 shadow-sm'
 }`}
 >
 Hari {dayName}
 </button>
 );
 })}
 </div>

 {/* Active Day list */}
 <div className="space-y-3 mt-2">
 {activeSchedules.map((s: any) => (
 <div key={s.id} className="group relative bg-white p-5 rounded-[2rem] border border-gray-100 hover:border-rose-100 hover:shadow-lg hover:shadow-rose-50/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-6 overflow-hidden animate-in fade-in duration-300">
 <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-rose-500 to-rose-600 rounded-l-[2rem]"></div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2.5 mb-2 flex-wrap">
 <p className="text-sm font-black text-gray-800 truncate">{s.subject}</p>
 <span className="bg-rose-50 text-rose-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg">
 {s.kelas}
 </span>
 </div>
 <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
 <span className="flex items-center gap-1.5 font-bold text-gray-600">
 <Calendar size={13} className="text-rose-500" />
 {new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
 </span>
 <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
 <span className="flex items-center gap-1.5 font-bold text-rose-600">
 <Clock size={13} />
 {s.time} WIB
 </span>
 </div>
 </div>
 </div>
 ))}
 {activeSchedules.length === 0 && (
 <p className="text-xs text-gray-450 italic font-bold py-4 text-center bg-white rounded-2xl border border-gray-100">
 Tidak ada ujian untuk hari {activeDay}.
 </p>
 )}
 </div>
 </div>
 );
 })()}
 </div>
 </div>
 </div>
 )})}
 {exams.filter(exam => {
 const studentSchedules = (exam.schedules || []).filter((s: any) => 
 !s.kelas || s.kelas.toLowerCase() === "semua kelas" || 
 (userData?.kelas && s.kelas?.toLowerCase() === userData.kelas?.toLowerCase())
 );
 return studentSchedules.length > 0;
 }).length === 0 && (
 <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 border-dashed">
 <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
 <Edit size={24} />
 </div>
 <h4 className="text-gray-600 font-bold mb-2">Belum ada Jadwal Ujian</h4>
 <p className="text-gray-400 text-sm">Harap cek secara berkala.</p>
 </div>
 )}
 </div>
 </div>
 )}

 {activeTab === 'attendance' && (
 <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
 {/* Quick Action: Absen Sekarang */}
 <div className="card-3d p-8 bg-blue-600 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
 <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
 <div className="space-y-2">
 <h3 className="text-2xl md:text-3xl font-black tracking-tight">Presensi Mandiri</h3>
 <p className="text-blue-100 font-medium">Lakukan absensi harianmu dengan foto wajah sekarang.</p>
 </div>
 {hasCheckedInToday ? (
 <div className="bg-white/20 backdrop-blur-md px-10 py-5 rounded-[32px] border border-white/30 flex items-center gap-4 animate-in fade-in zoom-in duration-300">
 <div className="w-10 h-10 bg-white/30 rounded-2xl flex items-center justify-center">
 <CheckCircle size={24} className="text-white" />
 </div>
 <div>
 <p className="text-xs font-black uppercase tracking-widest">Sudah Terabsen</p>
 <p className="text-[10px] text-blue-50 font-bold">Terima kasih, data sudah tersimpan.</p>
 </div>
 </div>
 ) : (
 <button 
 onClick={startCamera}
 className="group bg-white text-blue-600 px-10 py-5 rounded-[32px] font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-900/20 flex items-center gap-4 active:scale-95"
 >
 <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
 <Camera size={24} />
 </div>
 Mulai Absen
 </button>
 )}
 </div>
 </div>

 <div className="card-3d overflow-hidden">
 <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
 <h3 className="text-xl md:text-2xl font-bold text-gray-800 ">Riwayat Absensi</h3>
 </div>
 <div className="hidden md:block overflow-x-auto">
 <table className="w-full text-left whitespace-nowrap">
 <thead className="bg-gray-100/50 text-gray-600 text-[10px] font-bold uppercase tracking-widest">
 <tr>
 <th className="px-6 py-4 md:px-8 md:py-5 text-gray-600">Tanggal</th>
 <th className="px-6 py-4 md:px-8 md:py-5 text-gray-600">Waktu</th>
 <th className="px-6 py-4 md:px-8 md:py-5 text-gray-600">Foto</th>
 <th className="px-6 py-4 md:px-8 md:py-5 text-gray-600">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50">
 {attendance.map((a) => (
 <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
 <td className="px-6 py-4 md:px-8 md:py-6 font-medium text-gray-700 ">{a.date}</td>
 <td className="px-6 py-4 md:px-8 md:py-6 text-gray-500 text-sm">{a.timestamp ? new Date(a.timestamp.seconds * 1000).toLocaleTimeString('id-ID') : '-'}</td>
 <td className="px-6 py-4 md:px-8 md:py-6">
 {a.photo ? (
 <button onClick={() => setSelectedPhoto(a.photo)} className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shadow-sm hover:scale-110 transition-transform">
 <img src={a.photo} alt="Absen" className="w-full h-full object-cover" />
 </button>
 ) : (
 <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">
 <Camera size={16} />
 </div>
 )}
 </td>
 <td className="px-6 py-4 md:px-8 md:py-6">
 <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ (a.status || '').toLowerCase() === 'hadir' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span>
 </td>
 </tr>
 ))}
 {attendance.length === 0 && (
 <tr>
 <td colSpan={3} className="px-8 py-20 text-center text-gray-400 italic">Belum ada riwayat absensi.</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {/* Mobile View Kehadiran Lengkap */}
 <div className="md:hidden divide-y divide-gray-50 border-t border-gray-50">
 {attendance.map((a) => (
 <div key={a.id} className="p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
 <div className="flex gap-4 items-center">
 {a.photo ? (
 <button onClick={() => setSelectedPhoto(a.photo)} className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shadow-sm shrink-0">
 <img src={a.photo} alt="Absen" className="w-full h-full object-cover" />
 </button>
 ) : (
 <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 shrink-0">
 <Camera size={16} />
 </div>
 )}
 <div>
 <p className="font-bold text-gray-800 text-sm">{a.date}</p>
 <p className="text-xs text-gray-400">{a.timestamp ? new Date(a.timestamp.seconds * 1000).toLocaleTimeString('id-ID') : '-'}</p>
 </div>
 </div>
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${ (a.status || '').toLowerCase() === 'hadir' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span>
 </div>
 ))}
 {attendance.length === 0 && (
 <div className="p-8 text-center text-gray-400 italic">Belum ada riwayat absensi.</div>
 )}
 </div>
 </div>
 </div>
 )}

 {activeTab === 'administration' && (
 <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
 <div className="card-3d p-6 md:p-8">
 <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 md:mb-10">Ringkasan Administrasi Keuangan</h3>
 <div className="grid md:grid-cols-2 gap-6 md:gap-8">
 <div className="p-8 md:p-10 bg-green-600 rounded-[24px] md:rounded-[32px] text-white shadow-xl shadow-green-100 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
 <h4 className="font-bold mb-3 md:mb-4 flex items-center gap-2 md:gap-3 text-green-100 uppercase tracking-widest text-[10px] md:text-xs"><CreditCard size={20} /> Saldo Tabungan</h4>
 <p className="text-3xl md:text-4xl font-bold">Rp {(userData?.savings || 0).toLocaleString()}</p>
 <p className="text-[10px] md:text-xs text-green-100/60 mt-3 md:mt-4 leading-relaxed italic">Gunakan tabungan untuk keperluan sekolah yang terencana.</p>
 </div>
 <div className="p-8 md:p-10 bg-red-500 rounded-[24px] md:rounded-[32px] text-white shadow-xl shadow-red-100 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
 <h4 className="font-bold mb-3 md:mb-4 flex items-center gap-2 md:gap-3 text-red-100 uppercase tracking-widest text-[10px] md:text-xs"><CreditCard size={20} /> Total Tunggakan</h4>
 <p className="text-3xl md:text-4xl font-bold">Rp {(userData?.arrears || 0).toLocaleString()}</p>
 <p className="text-[10px] md:text-xs text-red-100/60 mt-3 md:mt-4 leading-relaxed italic">Harap segera lunasi tunggakan untuk kelancaran administrasi.</p>
 </div>
 </div>
 </div>

 {userData?.arrears_details && userData.arrears_details.length > 0 && (
 <div className="card-3d p-6 md:p-8 mt-6">
 <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-6 md:mb-8 flex items-center gap-2"><CreditCard size={20} className="text-red-500" /> Rincian Tagihan Belum Lunas</h3>
 <div className="space-y-4">
 {userData.arrears_details.map((detail: any) => (
 <div key={detail.id} className="bg-red-50/50 p-4 md:p-6 rounded-2xl border border-red-100 flex flex-col md:flex-row justify-between md:items-center gap-4 group hover:bg-red-50 transition-colors">
 <div>
 <h4 className="font-bold text-gray-800 md:text-lg mb-1">{detail.name}</h4>
 <div className="flex flex-wrap gap-4">
 <p className="text-xs text-gray-500 flex items-center gap-1">Ditetapkan: {detail.date}</p>
 {detail.dueDate && (
 <p className={`text-[10px] font-bold uppercase flex items-center gap-1 ${new Date(detail.dueDate) < new Date() ? 'text-red-600' : 'text-orange-500'}`}>
 Jatuh Tempo: {detail.dueDate}
 </p>
 )}
 </div>
 </div>
 <div className="text-left md:text-right flex flex-col items-start md:items-end gap-3">
 <div>
 <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Nominal</p>
 <p className="text-lg md:text-xl font-black text-red-600">Rp {detail.amount.toLocaleString()}</p>
 </div>
 <button
 onClick={() => {
 setActiveDetailToPay(detail);
 setShowPaymentModal(true);
 setPaymentMethod('Transfer');
 setPaymentProof('');
 setPaymentMeetDate('');
 }}
 className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
 >
 Bayar Sekarang
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 <div className="card-3d overflow-hidden mt-6">
 <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
 <h3 className="text-lg md:text-xl font-bold text-gray-800 shrink-0">Riwayat Transaksi Finansial</h3>
 
 <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
 <div className="flex flex-col gap-1">
 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Filter Jenis</label>
 <select 
 value={filterType} 
 onChange={(e) => setFilterType(e.target.value)}
 className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
 >
 <option value="all">Semua Jenis</option>
 <option value="iuran">Tagihan/SPP</option>
 <option value="tabungan">Tabungan</option>
 </select>
 </div>

 <div className="flex flex-col gap-1">
 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Filter Tanggal</label>
 <input 
 type="date"
 value={filterDate}
 onChange={(e) => setFilterDate(e.target.value)}
 className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
 />
 </div>

 {(filterType !== 'all' || filterDate) && (
 <button 
 onClick={() => { setFilterType('all'); setFilterDate(''); }}
 className="mt-4 md:mt-2 text-[9px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest"
 >
 Reset Filter
 </button>
 )}
 </div>
 </div>
 <div className="hidden md:block overflow-x-auto">
 <table className="w-full text-left whitespace-nowrap min-w-[500px]">
 <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
 <tr>
 <th className="px-6 py-4 md:px-8 md:py-5">Tanggal</th>
 <th className="px-6 py-4 md:px-8 md:py-5">Keterangan</th>
 <th className="px-6 py-4 md:px-8 md:py-5">Jenis</th>
 <th className="px-6 py-4 md:px-8 md:py-5 text-right">Nominal</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50">
 {payments
 .filter(pay => {
 const matchType = filterType === 'all' || (filterType === 'iuran' ? pay.type !== 'tabungan' : pay.type === 'tabungan');
 const matchDate = !filterDate || pay.date === filterDate;
 return matchType && matchDate;
 })
 .map((pay) => (
 <tr key={pay.id} className="hover:bg-gray-50/50 transition-colors">
 <td className="px-6 py-4 md:px-8 md:py-6 font-medium text-gray-700 ">{pay.date}</td>
 <td className="px-6 py-4 md:px-8 md:py-6">
 <p className="font-bold text-gray-800 ">{pay.description}</p>
 <div className="flex items-center gap-2 mt-1">
 <p className="text-[10px] text-gray-400 uppercase tracking-tight">ID: {pay.id.substring(0,8)}</p>
 {pay.method && (
 <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md font-bold uppercase tracking-widest">{pay.method}</span>
 )}
 {pay.proofStr && (
 <button 
 onClick={() => setSelectedPhoto(pay.proofStr)}
 className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest"
 >
 Lihat Bukti
 </button>
 )}
 
 {pay.type !== 'tabungan' && (
 pay.status === 'lunas' || pay.status === 'approved' ? (
 <button 
 onClick={() => handlePrintReceipt(pay)}
 className="text-[10px] font-black text-green-600 hover:underline uppercase tracking-widest"
 >
 Cetak Bukti
 </button>
 ) : (
 <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1">
 <Clock size={10} /> Pending
 </span>
 )
 )}
 </div>
 </td>
 <td className="px-6 py-4 md:px-8 md:py-6">
 <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${pay.type === 'tabungan' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
 {pay.type === 'tabungan' ? 'Tabungan' : 'Iuran/SPP'}
 </span>
 </td>
 <td className={`px-6 py-4 md:px-8 md:py-6 text-right font-bold text-base md:text-lg ${pay.type === 'tabungan' ? 'text-green-600' : 'text-blue-600'}`}>
 Rp {pay.amount.toLocaleString()}
 </td>
 </tr>
 ))}
 {payments.filter(pay => {
 const matchType = filterType === 'all' || (filterType === 'iuran' ? pay.type !== 'tabungan' : pay.type === 'tabungan');
 const matchDate = !filterDate || pay.date === filterDate;
 return matchType && matchDate;
 }).length === 0 && (
 <tr>
 <td colSpan={4} className="px-8 py-20 text-center text-gray-400 italic">Belum ada riwayat transaksi finansial yang sesuai filter.</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {/* Mobile View */}
 <div className="md:hidden divide-y divide-gray-50">
 {payments
 .filter(pay => {
 const matchType = filterType === 'all' || (filterType === 'iuran' ? pay.type !== 'tabungan' : pay.type === 'tabungan');
 const matchDate = !filterDate || pay.date === filterDate;
 return matchType && matchDate;
 })
 .map((pay) => (
 <div key={pay.id} className="p-4 hover:bg-gray-50/50 transition-colors">
 <div className="flex justify-between items-start mb-3">
 <div className="pr-2">
 <p className="font-bold text-gray-800 text-sm leading-tight">{pay.description}</p>
 <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1.5">{pay.date}</p>
 </div>
 <div className="text-right shrink-0">
 <p className={`font-black text-sm ${pay.type === 'tabungan' ? 'text-green-600' : 'text-blue-600'}`}>
 Rp {pay.amount.toLocaleString()}
 </p>
 </div>
 </div>
 <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100">
 <div className="flex flex-wrap items-center gap-1.5">
 <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${pay.type === 'tabungan' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
 {pay.type === 'tabungan' ? 'Tabungan' : 'Iuran/SPP'}
 </span>
 {pay.method && (
 <span className="text-[8px] px-2 py-0.5 bg-white border border-gray-200 text-gray-500 rounded font-black uppercase tracking-widest">{pay.method}</span>
 )}
 </div>
 <div className="flex items-center gap-2">
 {pay.proofStr && (
 <button 
 onClick={() => setSelectedPhoto(pay.proofStr)}
 className="text-[9px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md uppercase tracking-widest transition-colors"
 >
 Bukti
 </button>
 )}
 {pay.type !== 'tabungan' && (
 pay.status === 'lunas' || pay.status === 'approved' ? (
 <button 
 onClick={() => handlePrintReceipt(pay)}
 className="flex items-center gap-1 text-[9px] font-black text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-md uppercase tracking-widest transition-colors"
 >
 <Printer size={12} /> Cetak
 </button>
 ) : (
 <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2.5 py-1.5 rounded-md uppercase tracking-widest flex items-center gap-1">
 <Clock size={12} /> Pending Validasi
 </span>
 )
 )}
 </div>
 </div>
 </div>
 ))}
 {payments.filter(pay => {
 const matchType = filterType === 'all' || (filterType === 'iuran' ? pay.type !== 'tabungan' : pay.type === 'tabungan');
 const matchDate = !filterDate || pay.date === filterDate;
 return matchType && matchDate;
 }).length === 0 && (
 <div className="px-6 py-12 text-center">
 <p className="text-gray-400 italic text-xs">Belum ada riwayat transaksi finansial yang sesuai filter.</p>
 </div>
 )}
 </div>
 </div>
 </div>
 )}

 {activeTab === 'announcements' && (
          <div className="space-y-6 pb-24 md:pb-0 animate-in fade-in duration-500">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-[32px] p-6 sm:p-8 text-white shadow-xl shadow-blue-500/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider mb-2 border border-white/20">
                    <Megaphone size={13} />
                    <span>Pusat Informasi & Pengumuman</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                    Pengumuman Resmi Sekolah
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-100 font-medium mt-1">
                    Informasi penting, agenda kegiatan, surat edaran, dan berita terkini RA Darusyifa.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white/15 backdrop-blur-md border border-white/25 px-4 py-2.5 rounded-2xl text-center">
                    <p className="text-[9px] uppercase font-bold text-blue-200 tracking-wider">Total Info</p>
                    <p className="text-lg font-black text-white leading-none mt-0.5">
                      {announcements.filter(ann => !ann.target || ann.target === 'all' || ann.target === `kelas_${userData?.kelas || ''}`).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* List Pengumuman */}
            <div className="space-y-4">
              {announcements
                .filter(ann => !ann.target || ann.target === 'all' || ann.target === `kelas_${userData?.kelas || ''}`)
                .map((ann) => {
                  const dateStr = ann.createdAt 
                    ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                    : (ann.date || 'Terbaru');
                  
                  return (
                    <div 
                      key={ann.id} 
                      className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 relative overflow-hidden group"
                    >
                      {/* Top Row: Category badge, Target, & Date */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                            {ann.target && ann.target !== 'all' ? `Khusus ${ann.target.replace('kelas_', 'Kelas ')}` : 'Semua Siswa'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                            <Calendar size={13} className="text-blue-500" />
                            {dateStr}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg">
                          Oleh: {ann.author || 'RA Darusyifa'}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug group-hover:text-blue-600 transition-colors">
                        {ann.title}
                      </h4>

                      {/* Body Content */}
                      <div 
                        className="text-sm text-slate-600 leading-relaxed font-normal prose prose-slate max-w-none break-words"
                        dangerouslySetInnerHTML={{ __html: ann.content }}
                      />

                      {/* Attachments Section */}
                      {ann.attachments && ann.attachments.length > 0 && (
                        <div className="mt-2 pt-4 border-t border-slate-100 space-y-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <FileText size={13} className="text-blue-500" />
                            <span>Lampiran Berkas ({ann.attachments.length})</span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {ann.attachments.map((file: any, idx: number) => {
                              const isImg = file.type?.includes('image') || file.data?.startsWith('data:image');
                              return (
                                <div 
                                  key={idx} 
                                  onClick={() => {
                                    if (isImg) {
                                      setSelectedPhoto(file.data);
                                    } else {
                                      const link = document.createElement('a');
                                      link.href = file.data;
                                      link.download = file.name || 'lampiran-pengumuman';
                                      link.click();
                                    }
                                  }}
                                  className="bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-2xl p-3 transition-all flex items-center gap-3 cursor-pointer group/att"
                                >
                                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-xs text-blue-600 group-hover/att:scale-105 transition-transform shrink-0">
                                    {isImg ? <ImageIcon size={18} /> : <FileText size={18} className="text-rose-500" />}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-800 truncate group-hover/att:text-blue-600 transition-colors">
                                      {file.name || 'Berkas Lampiran'}
                                    </p>
                                    <p className="text-[9.5px] font-medium text-slate-400">
                                      {isImg ? 'Klik untuk pratinjau foto' : 'Klik untuk unduh dokumen'}
                                    </p>
                                  </div>
                                  <div className="p-1.5 rounded-lg bg-white text-slate-400 group-hover/att:text-blue-600 shadow-xs shrink-0">
                                    <Download size={13} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Empty state */}
              {announcements.filter(ann => !ann.target || ann.target === 'all' || ann.target === `kelas_${userData?.kelas || ''}`).length === 0 && (
                <div className="bg-white rounded-[32px] p-12 sm:p-16 border border-slate-100 text-center flex flex-col items-center justify-center shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
                    <Megaphone size={28} />
                  </div>
                  <h4 className="text-base font-black text-slate-900">Belum Ada Pengumuman</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Semua surat edaran, kegiatan sekolah, dan pengumuman terbaru akan ditampilkan pada halaman ini.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {showPrintRapotModal && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
 <div className="bg-white w-full max-w-sm rounded-[32px] p-6 md:p-8 shadow-2xl relative">
 <button 
 onClick={() => setShowPrintRapotModal(false)} 
 className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors"
 >
 <X size={20} />
 </button>
 
 <h3 className="text-xl font-black text-gray-800 mb-2">Cetak Rapot</h3>
 <p className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-widest">{userData?.name}</p>

 <div className="space-y-4">
 <div>
 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pilih Periode Penilaian</label>
 <select 
 value={printRapotPeriod} 
 onChange={(e) => setPrintRapotPeriod(e.target.value)} 
 className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700 "
 >
 <option value="PTS Ganjil">PTS Ganjil</option>
 <option value="PAS Ganjil">PAS Ganjil</option>
 <option value="PTS Genap">PTS Genap</option>
 <option value="PAS Genap">PAS Genap</option>
 </select>
 </div>
 <button 
 onClick={() => {
 handleExecutePrintRapot();
 setShowPrintRapotModal(false);
 }}
 className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
 >
 <Printer size={18} /> Cetak Dokumen
 </button>
 </div>
 </div>
 </div>
 )}
 {/* Setoran Modal */}
 {showSetoranModal && activeMaterialForSetoran && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
 <div className="bg-white w-full max-w-lg rounded-[32px] p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
 <button 
 onClick={() => { setShowSetoranModal(false); setActiveMaterialForSetoran(null); }} 
 className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors"
 disabled={isSetoranSubmitting}
 >
 <X size={20} />
 </button>
 
 <h3 className="font-bold text-xl md:text-2xl text-gray-800 mb-2 tracking-tight">Pilih Cara Setoran</h3>
 <p className="text-sm text-gray-500 mb-6 font-medium">Materi: <span className="text-green-600 font-bold underline decoration-green-200 underline-offset-4">{activeMaterialForSetoran.material.judul}</span></p>
 
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
 {[
 { id: 'Google Drive', label: 'Link Drive', icon: Megaphone },
 { id: 'Setoran Langsung', label: 'Ke Guru', icon: GraduationCap },
 { id: 'Rekaman Suara', label: 'Rekaman', icon: Camera }
 ].map((meth) => (
 <button
 key={meth.id}
 onClick={() => setSubmissionMethod(meth.id as any)}
 className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${submissionMethod === meth.id ? 'border-green-600 bg-green-50 text-green-700 shadow-lg shadow-green-100 scale-[1.05]' : 'border-gray-50 bg-white text-gray-400 hover:border-gray-100 hover:bg-gray-50'}`}
 >
 <meth.icon size={24} />
 <span className="text-[10px] font-black uppercase tracking-widest">{meth.label}</span>
 </button>
 ))}
 </div>

 <form onSubmit={submitSetoran} className="space-y-6">
 {submissionMethod === 'Rekaman Suara' && (
 <div className="animate-in fade-in slide-in-from-top-2 duration-300">
 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Upload Rekaman Suara (Maks 800 KB)</label>
 <input 
 type="file" 
 accept="audio/*,video/*"
 onChange={handleSetoranFileUpload}
 className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-green-600 file:text-white hover:file:bg-green-700 border border-gray-100 rounded-2xl bg-gray-50 p-2"
 required={!setoranFileBase64}
 />
 {setoranFileBase64 && (
 <div className="mt-3 text-[10px] text-green-600 font-black uppercase tracking-widest flex items-center gap-2 bg-green-50 p-3 rounded-xl border border-green-100">
 <CheckCircle size={14} /> File rekaman siap dikirim.
 </div>
 )}
 </div>
 )}

 {submissionMethod === 'Google Drive' && (
 <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
 <div>
 <div className="flex justify-between items-center mb-2">
 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Link Google Drive / YouTube</label>
 <button
 type="button"
 onClick={() => setShowJuknisDriveModal(true)}
 className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 transition-colors"
 >
 <BookOpen size={12} /> Lihat Juknis
 </button>
 </div>
 <input 
 type="url" 
 value={setoranLink}
 onChange={(e) => setSetoranLink(e.target.value)}
 placeholder="Contoh: https://drive.google.com/file/d/..."
 className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[20px] outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 font-bold text-gray-800 placeholder-gray-300 transition-all text-sm"
 required
 />
 </div>

 {/* Ringkasan Juknis Drive */}
 <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 text-xs space-y-2.5 shadow-2xs">
 <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/60">
 <span className="font-black text-emerald-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
 <BookOpen size={14} className="text-emerald-600" /> Juknis Ringkas Setoran Drive
 </span>
 <button
 type="button"
 onClick={() => setShowJuknisDriveModal(true)}
 className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
 >
 Panduan Detail &rarr;
 </button>
 </div>

 <div className="space-y-2 text-[11px] text-gray-700 leading-snug">
 <div className="flex items-start gap-2">
 <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">1</span>
 <p><strong>Buat Folder:</strong> Buka Drive &rarr; Klik <span className="bg-emerald-100 text-emerald-800 font-bold px-1 rounded text-[10px]">+ Baru</span> &rarr; Folder Baru <em>(misal: Setoran Hafalan - Nama)</em>.</p>
 </div>
 <div className="flex items-start gap-2">
 <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">2</span>
 <p><strong>Upload Video:</strong> Masuk ke folder &rarr; Upload video/audio hafalan dari Galeri HP.</p>
 </div>
 <div className="flex items-start gap-2">
 <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">3</span>
 <p><strong>Atur Akses Editor:</strong> Klik titik tiga (<strong>⋮</strong>) &rarr; <span className="bg-amber-100 text-amber-900 font-bold px-1 rounded text-[10px]">Kelola Akses</span> &rarr; Ubah ke <strong className="text-emerald-800">"Siapa saja yang memiliki link"</strong> dengan peran <strong className="text-emerald-800">Editor / Pengakses Lihat</strong>.</p>
 </div>
 <div className="flex items-start gap-2">
 <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">4</span>
 <p><strong>Salin Link:</strong> Klik <strong>Salin Link (Copy Link)</strong> file/folder Drive.</p>
 </div>
 <div className="flex items-start gap-2">
 <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">5</span>
 <p><strong>Tempel & Share:</strong> Paste link pada kolom di atas &rarr; Klik <strong className="text-green-700">Konfirmasi Setoran</strong>.</p>
 </div>
 </div>
 </div>
 </div>
 )}

 {submissionMethod === 'Setoran Langsung' && (
 <div className="p-6 bg-amber-50 rounded-[24px] border border-amber-100 text-center animate-in fade-in slide-in-from-top-2 duration-300">
 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 shadow-sm shadow-amber-100">
 <GraduationCap size={32} />
 </div>
 <h4 className="font-bold text-amber-800">Siap Setoran Fisik</h4>
 <p className="text-xs text-amber-700/70 mt-2 leading-relaxed">Klik tombol di bawah untuk memberitahu guru bahwa Anda sudah siap menyetorkan hafalan ini secara langsung di sekolah.</p>
 </div>
 )}
 
 <button 
 type="submit" 
 disabled={isSetoranSubmitting || (submissionMethod === 'Google Drive' && !setoranLink) || (submissionMethod === 'Rekaman Suara' && !setoranFileBase64)}
 className="w-full py-5 bg-green-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
 >
 {isSetoranSubmitting ? 'Mengirim...' : 'Konfirmasi Setoran'}
 </button>
 </form>
 </div>
 </div>
 )}

 {/* Juknis Google Drive Full Modal */}
 {showJuknisDriveModal && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[350] flex items-center justify-center p-4">
 <div className="bg-white w-full max-w-lg rounded-[32px] p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
 <button 
 onClick={() => setShowJuknisDriveModal(false)} 
 className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors"
 >
 <X size={20} />
 </button>

 <div className="flex items-center gap-3 mb-4 pr-10">
 <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0">
 <BookOpen size={24} />
 </div>
 <div>
 <h3 className="font-bold text-lg md:text-xl text-gray-800 tracking-tight">Petunjuk Teknis (Juknis)</h3>
 <p className="text-xs text-gray-500 font-medium">Unggah & Setoran via Google Drive</p>
 </div>
 </div>

 <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-900 leading-relaxed font-medium mb-6">
 💡 <strong>Mengapa Google Drive?</strong> Menggunakan link Google Drive memungkinkan Anda mengirim video hafalan berdurasi panjang dengan kualitas video jernih tanpa kendala batasan ukuran file.
 </div>

 <div className="space-y-4 mb-6">
 {/* Langkah 1 */}
 <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
 <div className="flex items-center gap-2.5">
 <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
 <h4 className="font-bold text-gray-800 text-sm">Buat Folder di Google Drive</h4>
 </div>
 <p className="text-xs text-gray-600 pl-8 leading-relaxed">
 Buka aplikasi <strong>Google Drive</strong> di HP/Laptop &rarr; Klik tombol <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px]">+ Baru</span> &rarr; Pilih <strong>Folder Baru</strong> &rarr; Beri nama misal: <span className="text-emerald-700 font-bold">Setoran Hafalan - [Nama Siswa]</span>.
 </p>
 </div>

 {/* Langkah 2 */}
 <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
 <div className="flex items-center gap-2.5">
 <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
 <h4 className="font-bold text-gray-800 text-sm">Upload Video / Rekaman Hafalan</h4>
 </div>
 <p className="text-xs text-gray-600 pl-8 leading-relaxed">
 Buka folder yang telah Anda buat &rarr; Klik <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px]">+ Baru / Upload</span> &rarr; Pilih video atau audio rekaman hafalan ananda dari Galeri HP. Tunggu hingga proses pengunggahan selesai.
 </p>
 </div>

 {/* Langkah 3 */}
 <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-1.5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <span className="w-6 h-6 rounded-lg bg-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
 <h4 className="font-bold text-amber-900 text-sm">Atur Akses Berbagi (Beri Akses Editor / Public)</h4>
 </div>
 <span className="bg-amber-200 text-amber-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full shrink-0">Langkah Penting</span>
 </div>
 <p className="text-xs text-amber-800/90 pl-8 leading-relaxed">
 Klik ikon titik tiga (<strong>⋮</strong>) pada file video atau folder &rarr; Pilih <strong>Kelola Akses / Share</strong> &rarr; Ubah Akses Umum dari <em>Dibatasi</em> menjadi <strong className="text-amber-950 underline">"Siapa saja yang memiliki link"</strong> (Anyone with the link) &rarr; Atur peran sebagai <strong className="text-amber-950">Editor / Pengakses Lihat</strong> agar Guru dapat membuka dan memberikan nilai.
 </p>
 </div>

 {/* Langkah 4 */}
 <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
 <div className="flex items-center gap-2.5">
 <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">4</span>
 <h4 className="font-bold text-gray-800 text-sm">Salin Link Google Drive</h4>
 </div>
 <p className="text-xs text-gray-600 pl-8 leading-relaxed">
 Klik tombol <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px]">Salin Link (Copy Link)</span> pada Google Drive. Link kini otomatis tersimpan di papan klip (clipboard) HP/perangkat Anda.
 </p>
 </div>

 {/* Langkah 5 */}
 <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
 <div className="flex items-center gap-2.5">
 <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">5</span>
 <h4 className="font-bold text-gray-800 text-sm">Tempel Link di Portal & Share / Kirim</h4>
 </div>
 <p className="text-xs text-gray-600 pl-8 leading-relaxed">
 Kembali ke portal ini (pada opsi <strong>Link Drive</strong>) &rarr; <strong>Tempel (Paste)</strong> link pada kolom input &rarr; Klik tombol <strong className="text-green-700 uppercase">Konfirmasi Setoran</strong> untuk mengirimkan hafalan ke guru.
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={() => setShowJuknisDriveModal(false)}
 className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
 >
 Saya Mengerti, Tutup Panduan
 </button>
 </div>
 </div>
 )}

 {/* Payment Modal */}
 {showPaymentModal && activeDetailToPay && (
 <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[300] flex items-center justify-center p-4">
 <div className="bg-white w-full max-w-sm rounded-[1.5rem] p-5 shadow-2xl relative overflow-hidden">
 <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
 <button 
 onClick={() => { setShowPaymentModal(false); setActiveDetailToPay(null); setPaymentProof(''); }} 
 className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
 disabled={paymentSubmitting}
 >
 <X size={18} />
 </button>
 
 <div className="mb-4">
 <div className="flex items-center gap-2 mb-1">
 <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
 <CreditCard size={14} />
 </div>
 <h3 className="text-lg font-black text-gray-800 tracking-tight">Bayar Iuran</h3>
 </div>
 <div className="bg-blue-50/30 p-2.5 rounded-xl border border-blue-100/20 flex justify-between items-center">
 <p className="text-xs font-bold text-blue-900 truncate mr-2">{activeDetailToPay.name}</p>
 <span className="text-sm font-black text-blue-600 whitespace-nowrap">Rp {activeDetailToPay.amount.toLocaleString()}</span>
 </div>
 </div>
 
 <form onSubmit={handleSubmitPayment} className="space-y-3.5">
 <div>
 <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Metode</label>
 <div className="grid grid-cols-4 gap-1">
 {['Transfer', 'Tunai', 'Tabungan', 'Campuran'].map(method => (
 <button
 key={method}
 type="button"
 onClick={() => {
 setPaymentMethod(method as any);
 if (method === 'Campuran') {
 setMixedSavingsAmount((userData?.savings || 0).toString());
 const remaining = Math.max(0, activeDetailToPay.amount - (userData?.savings || 0));
 setMixedCashAmount(remaining.toString());
 }
 }}
 className={`py-1.5 px-0.5 rounded-lg text-[9px] font-black transition-all border ${
 paymentMethod === method 
 ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
 : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
 }`}
 >
 {method}
 </button>
 ))}
 </div>
 </div>

 {paymentMethod === 'Campuran' && (
 <div className="space-y-2 p-2.5 bg-blue-50/20 rounded-xl border border-blue-100/20 animate-in fade-in slide-in-from-top-1 duration-300">
 <div className="flex gap-2">
 <div className="flex-1">
 <label className="block text-[8px] font-black text-blue-800/50 uppercase tracking-widest mb-1 ml-1">Tabungan</label>
 <div className="relative">
 <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-blue-300">Rp</span>
 <input 
 type="number" 
 value={mixedSavingsAmount}
 onChange={(e) => {
 setMixedSavingsAmount(e.target.value);
 const total = activeDetailToPay.amount;
 const currentTab = Number(e.target.value) || 0;
 setMixedCashAmount(Math.max(0, total - currentTab).toString());
 }}
 className="w-full pl-6 pr-2 py-1.5 bg-white border border-blue-50 rounded-lg outline-none focus:ring-1 focus:ring-blue-100 text-[10px] font-bold text-blue-900"
 placeholder="0"
 />
 </div>
 </div>
 <div className="flex-1">
 <label className="block text-[8px] font-black text-blue-800/50 uppercase tracking-widest mb-1 ml-1">Transfer/Cash</label>
 <div className="relative">
 <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-blue-300">Rp</span>
 <input 
 type="number" 
 value={mixedCashAmount}
 onChange={(e) => {
 setMixedCashAmount(e.target.value);
 const total = activeDetailToPay.amount;
 const currentCash = Number(e.target.value) || 0;
 setMixedSavingsAmount(Math.max(0, total - currentCash).toString());
 }}
 className="w-full pl-6 pr-2 py-1.5 bg-white border border-blue-50 rounded-lg outline-none focus:ring-1 focus:ring-blue-100 text-[10px] font-bold text-blue-900"
 placeholder="0"
 />
 </div>
 </div>
 </div>
 </div>
 )}

 {paymentMethod === 'Transfer' && (
 <div className="animate-in fade-in slide-in-from-top-1 duration-300">
 <div className="bg-blue-50/30 p-2.5 rounded-xl border border-blue-100/20 mb-3">
 <div className="flex justify-between items-center px-1">
 <div>
 <p className="font-bold text-blue-800 text-[10px]">BANK BRI</p>
 <p className="text-[8px] text-blue-500 uppercase font-black">GIAN DWI WAHYUNI</p>
 </div>
 <p className="font-black text-blue-700 text-xs tracking-widest">415001003649509</p>
 </div>
 </div>
 
 <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Upload Bukti</label>
 <div 
 onClick={() => {
 const input = document.getElementById('payment-proof-input');
 input?.click();
 }}
 className="w-full h-24 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all overflow-hidden relative group"
 >
 {paymentProof ? (
 <>
 <img src={paymentProof} alt="Bukti Transfer" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
 <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
 <Camera className="text-white" size={18} />
 </div>
 </>
 ) : (
 <div className="text-center p-2">
 <Upload size={16} className="text-gray-300 mx-auto mb-1" />
 <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Tap Upload</span>
 </div>
 )}
 </div>
 <input id="payment-proof-input" type="file" accept="image/*" onChange={handleProofChange} className="hidden" />
 </div>
 )}

 {paymentMethod === 'Tunai' && (
 <div className="p-2.5 bg-orange-50/30 border border-orange-100/30 rounded-xl animate-in fade-in slide-in-from-top-1 duration-300">
 <p className="text-[9px] text-orange-700 leading-tight font-bold mb-2">Simpan tanggal pertemuan untuk bayar di sekolah.</p>
 <input 
 type="date" 
 value={paymentMeetDate}
 onChange={(e) => setPaymentMeetDate(e.target.value)}
 min={new Date().toISOString().split('T')[0]}
 className="w-full p-2 bg-white border border-orange-100 rounded-lg outline-none focus:ring-1 focus:ring-orange-200 text-[10px] font-bold text-orange-900"
 required
 />
 </div>
 )}
 
 {paymentMethod === 'Tabungan' && (
 <div className="p-2.5 bg-green-50/30 border border-green-100/30 rounded-xl animate-in fade-in slide-in-from-top-1 duration-300">
 <div className="flex justify-between items-center">
 <div className="flex items-center gap-2">
 <CreditCard size={14} className="text-green-500" />
 <span className="text-[9px] font-black text-green-800 uppercase tracking-wide">Saldo Anda</span>
 </div>
 <span className="text-[11px] font-black text-green-600">Rp {(userData?.savings || 0).toLocaleString()}</span>
 </div>
 </div>
 )}

 <button 
 type="submit" 
 disabled={paymentSubmitting || (paymentMethod === 'Tabungan' && (userData?.savings || 0) < activeDetailToPay.amount)}
 className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all mt-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {paymentSubmitting ? (
 'Memproses...'
 ) : (
 <>
 <CheckCircle size={16} />
 {paymentMethod === 'Tabungan' ? 'Potong Tabungan' : 'Konfirmasi Bayar'}
 </>
 )}
 </button>
 </form>
 </div>
 </div>
 )}

 {/* Attendance Modal */}
 {showCamera && (
 <div className="fixed inset-0 bg-white md:bg-black/60 md:backdrop-blur-md z-[300] flex flex-col items-center justify-center p-0 md:p-4">
 <div className="bg-white w-full h-[100dvh] md:h-auto md:max-h-[92vh] md:max-w-xl md:rounded-[40px] shadow-2xl flex flex-col relative overflow-hidden">
 <div className="p-4 sm:p-6 flex justify-between items-center border-b border-gray-100 shrink-0">
 <h3 className="font-display font-bold text-lg sm:text-xl text-gray-800 uppercase tracking-tight">Presensi Harian Siswa</h3>
 <button onClick={stopCamera} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={24} /></button>
 </div>

 <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
 <div>
 <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 sm:mb-3 tracking-widest text-center">Pilih Status Kehadiran</label>
 <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
 {['Hadir', 'Sakit', 'Izin', 'Alpha'].map((status) => (
 <button 
 key={status}
 onClick={() => {
 setAttendanceStatus(status);
 if (status !== 'Hadir') setCapturedPhoto(null);
 }}
 className={`py-2.5 sm:py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${attendanceStatus === status ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
 >
 {status === 'Alpha' ? 'Tanpa Keterangan' : status}
 </button>
 ))}
 </div>
 </div>

 {attendanceStatus === 'Hadir' && (
 <div className="space-y-3 sm:space-y-4 notranslate" translate="no">
 <div className="relative aspect-video max-h-[220px] sm:max-h-[300px] w-full bg-slate-900 rounded-2xl sm:rounded-[32px] overflow-hidden border-2 border-slate-100 shadow-inner flex items-center justify-center">
 {!capturedPhoto ? (
 <div key="live-video-box" className="w-full h-full relative flex items-center justify-center">
 <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
 <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 z-10">
 <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Kamera Live
 </div>
 </div>
 ) : (
 <div key="captured-photo-box" className="w-full h-full relative flex items-center justify-center">
 <img src={capturedPhoto} alt="Hasil Foto Absen" className="w-full h-full object-cover" />
 <div className="absolute top-3 left-3 bg-emerald-600/90 text-white backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-md z-10">
 <CheckCircle size={12} /> Hasil Foto Dikonfirmasi
 </div>
 </div>
 )}
 <canvas ref={canvasRef} className="hidden" />
 <div className="absolute inset-0 border-2 border-white/10 pointer-events-none rounded-2xl sm:rounded-[32px]"></div>
 </div>

 {/* Action Buttons directly below camera / photo preview */}
 {!capturedPhoto ? (
 <button 
 key="btn-take-photo"
 type="button"
 onClick={takePhoto}
 className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 sm:py-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 active:scale-95 transition-all border-2 border-emerald-500 my-1"
 >
 <Camera size={20} /> Ambil Foto Sekarang
 </button>
 ) : (
 <div key="btn-confirm-group" className="grid grid-cols-2 gap-3 my-1">
 <button 
 onClick={retakePhoto}
 disabled={isSubmittingAttendance}
 className="bg-white border-2 border-slate-300 text-slate-700 py-3.5 sm:py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
 >
 <RefreshCw size={16} /> Foto Ulang
 </button>
 <button 
 onClick={handleConfirmAttendance}
 disabled={isSubmittingAttendance}
 className="bg-emerald-600 text-white py-3.5 sm:py-4 rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50"
 >
 {isSubmittingAttendance ? (
 <span className="flex items-center gap-2"><RefreshCw className="animate-spin" size={16} /> Menyimpan...</span>
 ) : (
 <><CheckCircle size={18} /> OK, Kirim Presensi</>
 )}
 </button>
 </div>
 )}

 <p className="text-[10px] text-gray-400 font-bold text-center uppercase tracking-wider">
 {!capturedPhoto ? 'Pastikan wajah terlihat jelas di dalam bingkai' : 'Foto berhasil diambil! Klik "OK, Kirim Presensi" untuk konfirmasi.'}
 </p>
 </div>
 )}

 {attendanceStatus !== 'Hadir' && (
 <div className="py-6 sm:py-10 flex flex-col items-center justify-center text-center space-y-3">
 <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
 <CheckCircle size={32} />
 </div>
 <div>
 <h4 className="font-bold text-gray-800 text-sm">Status: {attendanceStatus === 'Alpha' ? 'Tanpa Keterangan' : attendanceStatus}</h4>
 <p className="text-xs text-gray-500 max-w-xs mt-1">Anda mencatat kehadiran sebagai {attendanceStatus}. Klik Simpan untuk konfirmasi.</p>
 </div>
 </div>
 )}
 </div>

 {attendanceStatus !== 'Hadir' && (
 <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 shrink-0 sticky bottom-0 z-30">
 <button 
 onClick={handleConfirmAttendance}
 disabled={isSubmittingAttendance}
 className="bg-emerald-600 text-white w-full py-3.5 sm:py-4 rounded-xl sm:rounded-[24px] font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-50"
 >
 {isSubmittingAttendance ? (
 <span className="flex items-center gap-2"><RefreshCw className="animate-spin" size={16} /> Menyimpan...</span>
 ) : (
 <><Save size={18} /> Simpan Presensi</>
 )}
 </button>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 </main>
 {/* Photo Viewer Modal */}
 {selectedPhoto && (
 <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
 <div className="relative max-w-4xl w-full flex justify-center">
 <button onClick={() => setSelectedPhoto(null)} className="absolute -top-12 right-0 text-white hover:text-gray-300"><X size={32} /></button>
 <img src={selectedPhoto} alt="Absensi Full" className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain" />
 </div>
 </div>
 )}

 {/* Drive Juknis Modal */}
 <DriveJuknisModal isOpen={showDriveJuknisModal || showJuknisDriveModal} onClose={() => { setShowDriveJuknisModal(false); setShowJuknisDriveModal(false); }} />

 </div>
 );
}
