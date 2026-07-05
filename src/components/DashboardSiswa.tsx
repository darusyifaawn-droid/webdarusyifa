import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, orderBy, getDocs, deleteDoc, setDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { Camera, MapPin, CheckCircle, Clock, Calendar, User, LogOut, Bell, CreditCard, BookOpen, Edit, Save, X, Menu, Trash2, TrendingUp, BarChart as BarChartIcon, Printer, Star, Megaphone, GraduationCap, AlertCircle, Upload } from 'lucide-react';
import { hafalanMaterials, StudentHafalanProgress, HafalanStatus } from '../data/hafalanData';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
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
  const [materialsData, setMaterialsData] = useState<any[]>([]);
  const [kaldikData, setKaldikData] = useState<any[]>([]);
  const [filterHafalanStatusSiswa, setFilterHafalanStatusSiswa] = useState('Semua'); // 'Semua', 'Sudah Setor', 'Belum Setor'
  const [filterHafalanCategorySiswa, setFilterHafalanCategorySiswa] = useState('Semua Kategori'); // 'Semua Kategori', 'Surat Pendek', 'Hadist', 'Doa Sehari-hari', 'Bacaan Sholat'
  const [filterHafalanKelasSiswa, setFilterHafalanKelasSiswa] = useState('Semua'); // 'Semua', 'Utsman', 'Umar Bin Khattab'
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedExamDays, setSelectedExamDays] = useState<Record<string, string>>({});
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState('Hadir');
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [quote, setQuote] = useState('');

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

  // Audio State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudio = (id: string, url: string | undefined) => {
    if (!url) {
      alert("Audio tidak tersedia untuk materi ini.");
      return;
    }
    
    if (playingAudioId === id) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(e => {
          console.error("Audio play error:", e);
          alert("Gagal memutar audio. Pastikan link audio benar.");
        });
        setPlayingAudioId(id);
      }
    }
  };

  useEffect(() => {
    // Select a random quote on component mount
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    setQuote(randomQuote);
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
        if (!error.message.includes('insufficient permissions')) {
          console.error("Error fetching attendance:", error);
        }
      }
    );

    const unsubProgress = onSnapshot(
      query(collection(db, 'progress'), where('studentId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snapshot) => setProgress(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      (error) => {
        if (!error.message.includes('insufficient permissions')) {
          console.error("Error fetching progress:", error);
        }
      }
    );

    const unsubHafalanProgress = onSnapshot(
      query(collection(db, 'hafalan_progress'), where('studentId', '==', user.uid)),
      (snapshot) => setHafalanProgress(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentHafalanProgress))),
      (error) => {
        if (!error.message.includes('insufficient permissions')) {
          console.error("Error fetching hafalan progress:", error);
        }
      }
    );

    const unsubAnnounce = onSnapshot(
      query(collection(db, 'announcements'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        if (!error.message.includes('insufficient permissions')) {
          console.error("Error fetching announcements:", error);
        }
      }
    );

    const unsubPayments = onSnapshot(
      query(collection(db, 'payments'), where('studentId', '==', user.uid), orderBy('date', 'desc')),
      (snapshot) => {
        setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        if (!error.message.includes('insufficient permissions')) {
          console.error("Error fetching payments:", error);
        }
        setLoading(false);
      }
    );

    const unsubSettings = onSnapshot(doc(db, 'settings', 'landingPage'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      }
    });

    const unsubKaldik = onSnapshot(query(collection(db, 'kaldik')), (snapshot) => {
      setKaldikData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubMaterials = onSnapshot(query(collection(db, 'materials'), orderBy('createdAt', 'desc')), (snapshot) => {
      setMaterialsData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubExams = onSnapshot(query(collection(db, 'exams'), orderBy('createdAt', 'desc')), (snapshot) => {
      setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

  const startCamera = async () => {
    setShowCamera(true);
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
  };

  const handleAttendance = async () => {
    if (attendanceStatus === 'Hadir' && !navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser Anda.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const path = 'attendance';

    // Check if already attended today
    try {
      const q = query(
        collection(db, path), 
        where('studentId', '==', user.uid), 
        where('date', '==', today)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        alert('Anda sudah melakukan absensi hari ini.');
        if (showCamera) stopCamera();
        return;
      }

      let lat = 0, long = 0;
      let photoDataUrl = '';

      if (attendanceStatus === 'Hadir') {
        if (!videoRef.current || !canvasRef.current) return;
        const context = canvasRef.current.getContext('2d');
        if (context) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
          photoDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.6); // Compress captured photo
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
          lat = position.coords.latitude;
          long = position.coords.longitude;
          await submitAttendance(photoDataUrl, lat, long);
        }, (err) => {
          alert('Gagal mendapatkan lokasi: ' + err.message);
        });
      } else {
        await submitAttendance('', 0, 0);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  };

  const submitAttendance = async (photo: string, lat: number, long: number) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await addDoc(collection(db, 'attendance'), {
        studentId: user.uid,
        studentName: userData.name,
        date: today,
        timestamp: serverTimestamp(),
        status: attendanceStatus,
        location: { latitude: lat, longitude: long },
        photo: photo
      });
      alert(`Absensi (${attendanceStatus}) berhasil dicatat!`);
      if (showCamera) stopCamera();
      setShowCamera(false);
      setAttendanceStatus('Hadir');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'attendance');
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

  const NavItems = () => (
    <nav className="space-y-2 flex-1">
      <button 
        onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'overview' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <Calendar size={20} className={activeTab === 'overview' ? 'text-white' : 'text-gray-400'} /> Beranda
      </button>
      <button 
        onClick={() => { setActiveTab('kaldik'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'kaldik' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <Calendar size={20} className={activeTab === 'kaldik' ? 'text-white' : 'text-gray-400'} /> Kaldik & Materi
      </button>
      <button 
        onClick={() => { setActiveTab('progress'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'progress' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <BookOpen size={20} className={activeTab === 'progress' ? 'text-white' : 'text-gray-400'} /> Laporan Belajar
      </button>
      <button 
        onClick={() => { setActiveTab('hafalan'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'hafalan' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <Star size={20} className={activeTab === 'hafalan' ? 'text-white' : 'text-gray-400'} /> Modul Hafalan
      </button>
      <button 
        onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'attendance' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <CheckCircle size={20} className={activeTab === 'attendance' ? 'text-white' : 'text-gray-400'} /> Riwayat Absensi
      </button>
      <button 
        onClick={() => { setActiveTab('administration'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'administration' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <CreditCard size={20} className={activeTab === 'administration' ? 'text-white' : 'text-gray-400'} /> Administrasi
      </button>
      <button 
        onClick={() => { setActiveTab('announcements'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'announcements' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <Bell size={20} className={activeTab === 'announcements' ? 'text-white' : 'text-gray-400'} /> Info Sekolah
      </button>
      <button 
        onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'profile' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <User size={20} className={activeTab === 'profile' ? 'text-white' : 'text-gray-400'} /> Profil Saya
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 p-8 hidden md:flex flex-col shadow-sm z-30">
        <div className="flex items-center gap-4 mb-14">
          {settings?.logoUrl ? (
            <div className="w-12 h-12 overflow-hidden rounded-2xl border-2 border-green-600 p-0.5 bg-white">
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-green-600 rounded-[20px] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-green-100">RA</div>
          )}
          <div>
            <h1 className="font-bold text-xl text-gray-800 tracking-tight">Portal Siswa</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[2px] mt-1">RA Darusyifa Arjawinangun</p>
          </div>
        </div>
        <NavItems />
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-xl border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] flex justify-around items-center px-4 py-2 z-50 pb-safe transition-all" style={{ WebkitBackdropFilter: 'blur(24px)' }}>
        <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${activeTab === 'overview' ? 'text-blue-600' : 'text-gray-500'}`}>
          <div className={`p-2 rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-blue-100 scale-110 shadow-sm' : ''}`}>
             <BarChartIcon size={24} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-500'}`}>
           <div className={`w-14 h-14 bg-blue-600 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-200 -mt-8 border-4 border-white transition-all ${activeTab === 'profile' ? 'scale-110' : ''}`}>
            <User size={28} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter mt-1">Profil</span>
        </button>
        <button onClick={async () => { await auth.signOut(); navigate('/login'); }} className="flex flex-col items-center gap-1 transition-all flex-1 text-gray-500">
          <div className="p-2 rounded-2xl transition-all hover:bg-red-50 hover:text-red-600">
            <LogOut size={24} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Logout</span>
        </button>
      </div>

      {/* Mobile Sidebar/Drawer */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                {settings?.logoUrl ? (
                  <div className="w-10 h-10 overflow-hidden rounded-xl border border-green-600 bg-emerald-50/50 backdrop-blur-sm p-0.5">
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold">RA</div>
                )}
                <div>
                  <h2 className="font-bold text-gray-800 text-sm">Portal Siswa</h2>
                  <p className="text-[8px] text-gray-400 font-bold uppercase">RA Darusyifa</p>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 p-1 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <NavItems />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto scrolling-touch">
        {activeTab === 'overview' && (
          <div className="space-y-6 pb-24 md:pb-0 animate-in fade-in duration-500">
            {/* Mobile Header */}
            <div className="md:hidden -mx-4 -mt-3 mb-6 bg-blue-600 bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-b-[40px] text-white relative shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="flex justify-between items-center mb-6 relative z-10 pt-4">
                <div className="text-center flex-1 ml-10">
                  <h1 className="text-3xl font-black tracking-tighter text-yellow-300 drop-shadow-md flex items-center justify-center gap-1.5">
                    SAKINAH
                  </h1>
                  <p className="text-[7.5px] font-black tracking-[0.15em] opacity-80 uppercase -mt-1 leading-tight mb-0.5">Sistem Akademik Kehadiran & Administrasi</p>
                  <div className="inline-flex items-center justify-center px-2 py-0.5 bg-white/20 rounded-full border border-white/20">
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">RA Digital</span>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('announcements')}
                  className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-sm border border-white/30 shadow-lg relative active:scale-95 transition-all text-white"
                  style={{ WebkitBackdropFilter: 'blur(8px)' }}
                >
                  <Bell size={20} />
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full scale-in"></span>
                </button>
              </div>
              
              <div className="flex items-center gap-5 bg-white/10 p-6 rounded-[3rem] backdrop-blur-md border border-white/20 relative z-10 shadow-xl overflow-hidden" style={{ WebkitBackdropFilter: 'blur(12px)' }}>
                <div className="w-20 h-20 rounded-full border-4 border-white/40 overflow-hidden bg-white/95 flex items-center justify-center shadow-xl shrink-0">
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <User size={32} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-yellow-400 rounded-full mb-2">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    <p className="text-[8px] text-blue-900 font-black uppercase tracking-wider">Student Portal</p>
                  </div>
                  <h2 className="text-xl font-black tracking-tight leading-tight text-white mb-1">
                    {userData?.name || 'Siswa RA'}
                  </h2>
                  <div className="flex flex-col mt-1">
                    <p className="text-[10px] opacity-90 font-black text-yellow-300 leading-tight uppercase tracking-tighter">
                      Kelas {userData?.kelas || '-'}
                    </p>
                    <p className="text-[9px] mt-0.5 opacity-80 font-bold text-white leading-tight uppercase tracking-widest">
                      {settings?.schoolName || 'RA Darusyifa Arjawinangun'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Header */}
            <header className="hidden md:flex justify-between items-center mb-8 pt-2">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 leading-tight tracking-tight underline decoration-blue-500 decoration-4 underline-offset-8 uppercase italic">Beranda</h2>
                <p className="text-gray-500 text-sm font-medium mt-4">Halo {userData?.name}, pantau laporan belajarmu hari ini.</p>
              </div>
              <div className="flex items-center gap-4">
                 <button onClick={() => setActiveTab('announcements')} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-400 hover:text-blue-600 transition-all relative">
                    <Bell size={24} />
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                 </button>
                 <div className="bg-white p-2 pr-6 rounded-full border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white overflow-hidden border border-gray-100">
                      {userData?.photoURL ? (
                        <img src={userData.photoURL} alt="P" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-black text-lg">{userData?.name?.[0] || 'S'}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-800 leading-tight">{userData?.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Siswa • Kelas {userData?.kelas}</p>
                    </div>
                 </div>
              </div>
            </header>

            {/* Stats Cards Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: 'Kehadiran', value: attendance.length, detail: 'Hadir Semester Ini', color: 'bg-indigo-600 bg-gradient-to-br from-blue-500 to-indigo-600', icon: CheckCircle },
                { label: 'Laporan Belajar', value: progress.length, detail: 'Hasil Evaluasi', color: 'bg-teal-500 bg-gradient-to-br from-emerald-400 to-teal-500', icon: BookOpen },
                { label: 'Hafalan Lulus', value: hafalanProgress.filter(h => h.status === 'Mumtaz (Lulus)').length, detail: 'Materi Selesai', color: 'bg-orange-500 bg-gradient-to-br from-amber-400 to-orange-500', icon: Star },
                { label: 'Sisa SPP', value: (userData?.arrears || 0) > 0 ? `Rp ${(userData.arrears).toLocaleString('id-ID')}` : 'Rp 0', detail: 'Tagihan Berjalan', color: 'bg-pink-600 bg-gradient-to-br from-rose-500 to-pink-600', icon: CreditCard }
              ].map((stat, i) => (
                <div key={i} className={`relative overflow-hidden ${stat.color} p-5 md:p-6 rounded-[32px] text-white shadow-xl shadow-black/10 group hover:scale-[1.02] transition-all flex flex-col justify-between h-52 sm:h-48 md:h-44`}>
                  <div className="absolute -right-4 -bottom-4 opacity-30 group-hover:scale-110 transition-transform rotate-12">
                    <stat.icon size={100} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-80 mb-1">{stat.label}</p>
                    <h4 className={`font-black tracking-tighter leading-none ${String(stat.value).length > 8 ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>{stat.value}</h4>
                  </div>
                  <div className="relative z-10 inline-flex items-center self-start px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black tracking-wide uppercase" style={{ WebkitBackdropFilter: 'blur(8px)' }}>
                    {stat.detail}
                  </div>
                </div>
              ))}
            </div>

            {/* Menu Utama Siswa Grid */}
            <div className="mt-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Menu Utama</h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-10">
                {[
                  { id: 'progress', label: 'Hasil Pembelajaran', icon: GraduationCap, color: 'bg-purple-500 bg-gradient-to-br from-purple-400 to-purple-500' },
                  { id: 'kaldik', label: 'Kaldik & Materi', icon: Calendar, color: 'bg-pink-500 bg-gradient-to-br from-pink-400 to-pink-500' },
                  { id: 'hafalan', label: 'Modul Hafalan', icon: Star, color: 'bg-amber-500 bg-gradient-to-br from-amber-400 to-amber-500' },
                  { id: 'exams', label: 'Ujian', icon: Edit, color: 'bg-rose-500 bg-gradient-to-br from-rose-400 to-rose-500' },
                  { id: 'administration', label: 'Administrasi', icon: CreditCard, color: 'bg-emerald-500 bg-gradient-to-br from-emerald-400 to-emerald-500' },
                  { id: 'attendance', label: 'Absensi', icon: Camera, color: 'bg-rose-500 bg-gradient-to-br from-rose-400 to-rose-500' },
                  { id: 'announcements', label: 'Info Sekolah', icon: Megaphone, color: 'bg-blue-600 bg-gradient-to-br from-blue-500 to-blue-600' },
                  { id: 'profile', label: 'Profil Saya', icon: User, color: 'bg-indigo-500 bg-gradient-to-br from-indigo-400 to-indigo-500' },
                ].map((item, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveTab(item.id)}
                    className="group flex flex-col items-center gap-3 transition-all"
                  >
                    <div className={`w-16 h-16 md:w-20 md:h-20 ${item.color} rounded-[28px] shadow-lg flex items-center justify-center text-white transition-all group-active:scale-95 group-hover:scale-110`}>
                      <item.icon size={28} className="md:w-10 md:h-10" />
                    </div>
                    <span className="text-[11px] md:text-sm font-black text-gray-700 tracking-tight text-center">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Info & Attendance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
               <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-xl font-black text-gray-800">Info Terbaru</h3>
                     <button onClick={() => setActiveTab('announcements')} className="text-blue-600 font-bold text-xs uppercase tracking-widest hover:underline">Semua</button>
                  </div>
                  <div className="space-y-4">
                     {announcements.filter(a => !a.target || a.target === 'all' || a.target === `kelas_${userData?.kelas}`).slice(0, 3).map((a) => (
                        <div key={a.id} className="p-5 bg-gray-50 rounded-3xl border border-gray-100 hover:bg-gray-100/50 transition-colors cursor-pointer" onClick={() => setActiveTab('announcements')}>
                           <h4 className="font-bold text-gray-800 line-clamp-1">{a.title}</h4>
                           <p className="text-xs text-gray-400 mt-1 line-clamp-1">{a.content.replace(/[#*]/g, '')}</p>
                        </div>
                     ))}
                     {announcements.length === 0 && <p className="text-center py-6 text-gray-400 italic text-sm">Belum ada pengumuman.</p>}
                  </div>
               </div>

               <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-xl font-black text-gray-800">Kehadiran Terakhir</h3>
                     <button onClick={() => setActiveTab('attendance')} className="text-blue-600 font-bold text-xs uppercase tracking-widest hover:underline">Absensi</button>
                  </div>
                  <div className="space-y-4">
                     {attendance.slice(0, 4).map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-4 bg-blue-50/50 rounded-3xl border border-blue-100">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                                 <Clock size={20} />
                              </div>
                              <div>
                                 <p className="font-bold text-gray-800">{a.date}</p>
                                 <p className="text-[10px] text-gray-400 font-black uppercase">{a.timestamp ? new Date(a.timestamp.seconds * 1000).toLocaleTimeString('id-ID') : '-'}</p>
                              </div>
                           </div>
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${ (a.status || '').toLowerCase() === 'hadir' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {a.status}
                           </span>
                        </div>
                     ))}
                     {attendance.length === 0 && <p className="text-center py-6 text-gray-400 italic text-sm">Belum ada riwayat absen.</p>}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'kaldik' && (
          <div className="space-y-6 pb-24 md:pb-0 animate-in fade-in duration-500">
            <div className="card-3d p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">Kaldik & Materi Belajar</h3>
              <p className="text-sm text-gray-400 mt-1 font-medium">Kalender Pendidikan dan kumpulan materi / mata pelajaran dari guru.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Kalender Pendidikan */}
              <div>
                <h4 className="font-black text-gray-800 text-lg mb-4 flex items-center gap-2"><Calendar className="text-pink-500" /> Agenda Kaldik</h4>
                <div className="space-y-4">
                  {kaldikData.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(item => (
                    <div key={item.id} className="bg-white p-5 rounded-3xl shadow-sm border border-orange-100 flex items-center gap-4">
                      <div className="w-14 h-14 bg-pink-50 rounded-[1rem] flex flex-col items-center justify-center border border-pink-100 text-pink-500 shrink-0">
                        <span className="text-[10px] font-bold uppercase">{new Date(item.date).toLocaleString('id-ID', { month: 'short' })}</span>
                        <span className="text-lg font-black leading-none mt-0.5">{new Date(item.date).getDate()}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-base">{item.title}</h4>
                        <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>
                        <span className={`mt-2 inline-block px-2 py-0.5 text-[8px] uppercase font-black tracking-widest rounded-md border ${item.type === 'Libur' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                          {item.type}
                        </span>
                      </div>
                    </div>
                  ))}
                  {kaldikData.length === 0 && (
                    <div className="text-center p-8 bg-white border border-dashed border-gray-200 rounded-3xl">
                      <Calendar className="mx-auto text-gray-300 mb-2" size={32} />
                      <p className="text-xs text-gray-400 font-medium">Belum ada agenda sekolah.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Materi */}
              <div>
                <h4 className="font-black text-gray-800 text-lg mb-4 flex items-center gap-2"><BookOpen className="text-blue-500" /> Kumpulan Materi</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {materialsData.map(mat => (
                    <div key={mat.id} className="card-3d p-5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3 opacity-10">
                        <BookOpen size={48} className="text-blue-500" />
                      </div>
                      <div className="relative z-10">
                        <h5 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2">{mat.name}</h5>
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{mat.topic || 'Umum'}</p>
                        
                        {mat.tulisanArab && (
                          <div className="mt-4 p-3 bg-blue-50/30 rounded-xl border border-blue-100/30">
                            <p className="text-xl font-arab text-gray-800 leading-loose text-right" dir="rtl">{mat.tulisanArab}</p>
                            {mat.terjemahan && <p className="text-[9px] text-gray-500 mt-2 font-medium italic">"{mat.terjemahan}"</p>}
                          </div>
                        )}

                        <p className="text-[9px] text-gray-400 font-medium mt-3">📅 {new Date(mat.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                  ))}
                  {materialsData.length === 0 && (
                    <div className="col-span-1 sm:col-span-2 text-center p-8 bg-white border border-dashed border-gray-200 rounded-3xl">
                      <BookOpen className="mx-auto text-gray-300 mb-2" size={32} />
                      <p className="text-xs text-gray-400 font-medium">Belum ada materi dari guru.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 card-3d p-6 md:p-8">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">Perkembangan Belajar</h3>
                <p className="text-sm text-gray-400 font-medium">Monitoring nilai dan capaian pembelajaran.</p>
              </div>
              <button 
                onClick={() => {
                  setPrintRapotPeriod('Semua');
                  setShowPrintRapotModal(true);
                }}
                className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                <Printer size={20} /> Cetak Rapot
              </button>
            </div>
            <div className="grid gap-6">
              {progress.map(p => {
                const scoreNum = Number(p.score) || 0;
                const gradeInfo = getScoreGradeInfo(scoreNum);
                return (
                  <div key={p.id} className="card-3d p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <span className="px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">{p.category}</span>
                      <h4 className="text-xl font-bold text-gray-800 mt-4">{p.title}</h4>
                      <p className="text-sm text-gray-400 mt-1 mb-4">{p.date}</p>
                      <p className="text-gray-600 leading-relaxed mb-4">{p.description}</p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {p.status && (
                          <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold ${
                            p.status === 'Lulus' ? 'bg-green-100 text-green-700' :
                            p.status === 'Mengulang' ? 'bg-red-100 text-red-700' :
                            p.status === 'Lanjut Perkembangan Lain' ? 'bg-purple-100 text-purple-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {p.status}
                          </span>
                        )}
                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 mt-2 w-fit">
                          <User size={12} className="shrink-0" />
                          <span className="text-[10px] font-black uppercase tracking-wider">{p.teacherName || 'Guru Penilai'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 bg-gray-50 rounded-[24px] p-6 min-w-[140px] text-center border border-gray-200">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nilai</p>
                      <h2 className={`text-4xl font-black ${gradeInfo.color}`}>{scoreNum}</h2>
                      <p className="text-sm font-bold text-gray-500 mt-1">{gradeInfo.grade} - {gradeInfo.text}</p>
                    </div>
                  </div>
                );
              })}
              {progress.length === 0 && (
                <div className="bg-white p-12 rounded-[32px] border border-dashed border-gray-200 text-center text-gray-400 font-medium">
                  Belum ada laporan perkembangan.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'hafalan' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
            <div className="card-3d p-6 md:p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight mb-2">Modul Hafalan</h3>
                  <p className="text-sm text-gray-400 font-medium">Panduan dan progres hafalan surat, hadist, dan doa.</p>
                </div>
                <button
                  onClick={handleExecutePrintRapotHafalan}
                  className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                >
                  <Printer size={20} /> Cetak Rapot Hafalan
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userData?.kelas?.toLowerCase().includes('utsman') && (
                  <select value={filterHafalanKelasSiswa} onChange={e => setFilterHafalanKelasSiswa(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-medium text-gray-600 appearance-none">
                    <option value="Semua">Semua Kelas</option>
                    <option value="Utsman">Kelas Utsman</option>
                    <option value="Umar Bin Khattab">Kelas Umar Bin Khattab</option>
                  </select>
                )}
                <select value={filterHafalanStatusSiswa} onChange={e => setFilterHafalanStatusSiswa(e.target.value)} className={`w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-medium text-gray-600 appearance-none ${!userData?.kelas?.toLowerCase().includes('utsman') ? 'lg:col-span-1 md:col-span-1' : ''}`}>
                  <option value="Semua">Semua Status</option>
                  <option value="Sudah Setor">Sudah Ada Setoran (Menunggu / Selesai)</option>
                  <option value="Belum Setor">Belum Disetor (Sedang Menghafal / Belum Mulai)</option>
                </select>
                <select value={filterHafalanCategorySiswa} onChange={e => setFilterHafalanCategorySiswa(e.target.value)} className={`w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-medium text-gray-600 appearance-none ${!userData?.kelas?.toLowerCase().includes('utsman') ? 'lg:col-span-1 md:col-span-1' : ''}`}>
                  <option value="Semua Kategori">Semua Kategori</option>
                  <option value="Surat Pendek">Surat Pendek</option>
                  <option value="Hadist">Hadist</option>
                  <option value="Doa Sehari-hari">Doa Sehari-hari</option>
                  <option value="Bacaan Sholat">Bacaan Sholat</option>
                </select>
              </div>

              {/* Quick Category Tabs */}
              <div className="flex flex-wrap gap-2 mt-4">
                {['Semua Kategori', 'Surat Pendek', 'Hadist', 'Doa Sehari-hari', 'Bacaan Sholat'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterHafalanCategorySiswa(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterHafalanCategorySiswa === cat ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6">
              {(() => {
                const filteredMaterials = hafalanMaterials
                  .filter(m => {
                     if (!userData?.kelas || userData.kelas.trim() === "") return true; // show all if class is not set
                     const uKelas = userData.kelas.toLowerCase().replace(/[^a-z0-9]/g, '');
                     const mKelas = m.kelas.toLowerCase().replace(/[^a-z0-9]/g, '');
                     const isUtsman = uKelas.includes("utsman");
                     
                     // If student is Utsman, allow them to see Umar's materials as well (for unfinished ones)
                     if (isUtsman) {
                       if (filterHafalanKelasSiswa !== 'Semua' && m.kelas !== filterHafalanKelasSiswa) {
                         return false;
                       }
                       if (mKelas.includes("umar") || mKelas.includes("utsman")) return true;
                     }
                     
                     // More robust match: checks if standardized strings contain each other
                     return mKelas.includes(uKelas) || uKelas.includes(mKelas);
                  })
                  .filter(m => filterHafalanCategorySiswa === 'Semua Kategori' ? true : m.kategori === filterHafalanCategorySiswa)
                  .filter(m => {
                     const prog = hafalanProgress.find(p => p.materialId === m.id);
                     const isSettored = prog?.isReadyForTest || prog?.status === 'Mumtaz (Lulus)';
                     if (filterHafalanStatusSiswa === 'Sudah Setor') return isSettored;
                     if (filterHafalanStatusSiswa === 'Belum Setor') return !isSettored;
                     return true;
                  });

                if (filteredMaterials.length === 0) {
                  return (
                    <div className="bg-white p-12 rounded-[40px] border border-dashed border-gray-200 text-center col-span-full">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <BookOpen size={40} />
                      </div>
                      <h4 className="text-lg font-bold text-gray-800 mb-2">Materi Tidak Ditemukan</h4>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto">
                        Materi untuk kategori <strong>{filterHafalanCategorySiswa}</strong> dan kelas <strong>{userData?.kelas || 'Belum Diatur'}</strong> tidak tersedia. 
                        Pastikan profil kelas Anda sudah benar di menu <strong>Profil Saya</strong>.
                      </p>
                    </div>
                  );
                }

                return filteredMaterials.map((material) => {
                  const prog = hafalanProgress.find(p => p.materialId === material.id);
                  const status = prog?.status || 'Belum Mulai';
                  const stars = prog?.stars || 0;
                  
                  return (
                    <div key={material.id} className="card-3d p-6 md:p-8 relative overflow-hidden group">
                       <div className="flex justify-between items-start mb-4">
                         <div>
                           <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest">{material.kategori}</span>
                           <h4 className="text-xl font-bold text-gray-800 mt-3">{material.judul}</h4>
                         </div>
                         <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              status === 'Mumtaz (Lulus)' ? 'bg-green-100 text-green-700' :
                              status === 'Lancar' ? 'bg-blue-100 text-blue-700' :
                              status === 'Sedang Menghafal' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                            }`}>{status}</span>
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={16} fill={i < stars ? "currentColor" : "none"} className={i < stars ? "text-yellow-400" : "text-gray-200"} />
                              ))}
                            </div>
                         </div>
                       </div>
                       
                       <div className="bg-gray-50 rounded-2xl p-6 mt-4 space-y-4 text-center">
                         {material.arab ? (
                           <>
                             <p className="text-2xl font-arab text-gray-800 leading-loose" dir="rtl">{material.arab}</p>
                             <p className="text-sm text-gray-600 font-medium italic">{material.latin}</p>
                             <p className="text-sm text-gray-500 leading-relaxed">"{material.terjemahan}"</p>
                           </>
                         ) : (
                           <div className="py-6 space-y-2">
                             <p className="text-lg font-bold text-gray-700">Setorkan hafalan {material.judul} secara langsung.</p>
                             <p className="text-xs text-gray-500 uppercase tracking-widest">Teks materi tidak tersedia di sistem.</p>
                           </div>
                         )}
                       </div>

                       {/* Audio Player */}
                       <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                         <button 
                           onClick={() => toggleAudio(material.id, material.audioUrl)}
                           className={`flex items-center gap-2 text-sm font-bold w-full sm:w-auto justify-center sm:justify-start transition-colors ${playingAudioId === material.id ? 'text-red-500' : 'text-blue-600 hover:text-blue-700'}`}
                         >
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${playingAudioId === material.id ? 'bg-red-100 scale-110 shadow-lg shadow-red-100' : 'bg-blue-100 shadow-lg shadow-blue-50'}`}>
                             {playingAudioId === material.id ? (
                               <div className="flex gap-1">
                                 <div className="w-1 h-3 bg-red-500 animate-pulse"></div>
                                 <div className="w-1 h-4 bg-red-500 animate-pulse delay-75"></div>
                                 <div className="w-1 h-3 bg-red-500 animate-pulse delay-150"></div>
                               </div>
                             ) : (
                               <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-blue-600 border-b-[6px] border-b-transparent ml-1"></div>
                             )}
                           </div> 
                           {playingAudioId === material.id ? 'Berhenti Audio' : 'Dengarkan Audio'}
                         </button>
                         <button 
                           onClick={() => {
                             setActiveMaterialForSetoran({ material, status, prog });
                             setSubmissionMethod('Google Drive');
                             setShowSetoranModal(true);
                           }}
                           className="w-full sm:w-auto bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 transition-all active:scale-95 shadow-lg shadow-green-100 disabled:opacity-50"
                           disabled={status === 'Mumtaz (Lulus)' || prog?.isReadyForTest}
                         >
                           {status === 'Mumtaz (Lulus)' ? 'Sudah Lulus' : prog?.isReadyForTest ? 'Menunggu Guru' : 'Siap Setoran'}
                         </button>
                       </div>
                       
                       {prog?.catatanGuru && (
                         <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                           <p className="text-xs font-bold text-orange-800 mb-1 uppercase tracking-wider">Catatan Guru:</p>
                           <p className="text-sm text-orange-900">{prog.catatanGuru}</p>
                         </div>
                       )}
                    </div>
                  );
                });
              })()}
            </div>
            <audio 
              ref={audioRef} 
              className="hidden" 
              onEnded={() => setPlayingAudioId(null)}
              onError={() => {
                setPlayingAudioId(null);
              }}
            />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="card-3d p-8 max-w-2xl mx-auto md:mx-0 animate-in slide-in-from-bottom duration-500">
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
                    className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all font-bold text-gray-800" 
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
                    className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all font-bold text-gray-800" 
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
                      className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all font-bold text-gray-800" 
                      placeholder="Contoh: Cirebon"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2 ml-1">Tanggal Lahir</label>
                    <input 
                      type="date" 
                      value={editTanggalLahir} 
                      onChange={(e) => setEditTanggalLahir(e.target.value)} 
                      className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all font-bold text-gray-800" 
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
                    className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-green-500 focus:bg-white transition-all text-sm font-bold text-gray-800"
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
                    className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-green-500 focus:bg-white transition-all text-sm font-bold text-gray-800"
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
                        <h4 className="text-xl font-bold text-gray-800">{exam.type}</h4>
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
                <h3 className="text-xl md:text-2xl font-bold text-gray-800">Riwayat Absensi</h3>
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
                      <td className="px-6 py-4 md:px-8 md:py-6 font-medium text-gray-700">{a.date}</td>
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
                          <td className="px-6 py-4 md:px-8 md:py-6 font-medium text-gray-700">{pay.date}</td>
                          <td className="px-6 py-4 md:px-8 md:py-6">
                             <p className="font-bold text-gray-800">{pay.description}</p>
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
          <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 md:mb-8">Info & Pengumuman Sekolah</h3>
            <div className="grid gap-6">
              {announcements
                .filter(ann => !ann.target || ann.target === 'all' || ann.target === `kelas_${userData?.kelas || ''}`)
                .map((ann) => (
                <div key={ann.id} className="card-3d p-6 md:p-8">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg md:text-xl font-bold text-gray-800">{ann.title}</h4>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{ann.createdAt ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString() : ''}</span>
                  </div>
                  <div className="markdown-body">
                    <ReactMarkdown>{ann.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {announcements.filter(ann => !ann.target || ann.target === 'all' || ann.target === `kelas_${userData?.kelas || ''}`).length === 0 && (
                <div className="bg-white p-12 rounded-[32px] border border-dashed border-gray-200 text-center text-gray-400 font-medium">
                  Belum ada pengumuman baru.
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
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700"
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
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Link Google Drive / YouTube</label>
                    <input 
                      type="url" 
                      value={setoranLink}
                      onChange={(e) => setSetoranLink(e.target.value)}
                      placeholder="Contoh: https://drive.google.com/..."
                      className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[24px] outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 font-bold text-gray-800 placeholder-gray-300 transition-all"
                      required
                    />
                    <p className="text-[10px] text-gray-400 mt-3 font-bold px-1 leading-relaxed">Gunakan opsi ini untuk file besar (video/audio). Pastikan link sudah di-set "Public/Everyone with link".</p>
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
          <div className="fixed inset-0 bg-white md:bg-black/60 md:backdrop-blur-md z-[300] flex flex-col items-center justify-center">
            <div className="bg-white w-full h-full md:h-auto md:max-w-xl md:rounded-[40px] shadow-2xl flex flex-col relative overflow-hidden">
              <div className="p-6 flex justify-between items-center border-b border-gray-100 shrink-0">
                <h3 className="font-display font-bold text-xl text-gray-800 uppercase tracking-tight">Presensi Harian</h3>
                <button onClick={stopCamera} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={24} /></button>
              </div>

              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-widest text-center">Pilih Status Kehadiran</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Hadir', 'Sakit', 'Izin', 'Alpha'].map((status) => (
                      <button 
                        key={status}
                        onClick={() => setAttendanceStatus(status)}
                        className={`py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${attendanceStatus === status ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                      >
                        {status === 'Alpha' ? 'Tanpa Keterangan' : status}
                      </button>
                    ))}
                  </div>
                </div>

                {attendanceStatus === 'Hadir' && (
                  <div className="space-y-4">
                    <div className="relative aspect-video bg-gray-100 rounded-[32px] overflow-hidden border-2 border-gray-100 shadow-inner">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute inset-0 border-2 border-white/20 pointer-events-none rounded-[32px]"></div>
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold text-center">Pastikan wajah terlihat jelas di layar</p>
                  </div>
                )}

                {attendanceStatus !== 'Hadir' && (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                      <CheckCircle size={40} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">Status: {attendanceStatus === 'Alpha' ? 'Tanpa Keterangan' : attendanceStatus}</h4>
                      <p className="text-sm text-gray-500 max-w-xs mt-2">Anda menandai diri sebagai {attendanceStatus}. Silakan klik tombol di bawah untuk kirim.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 shrink-0">
                <button 
                  onClick={handleAttendance}
                  className="bg-green-600 text-white w-full py-5 rounded-[24px] font-bold text-sm uppercase tracking-widest hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-3"
                >
                  {attendanceStatus === 'Hadir' ? <><Camera size={20} /> Ambil Foto & Absen</> : <><Save size={20} /> Simpan Presensi</>}
                </button>
              </div>
            </div>
          </div>
        )}
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

    </div>
  );
}
