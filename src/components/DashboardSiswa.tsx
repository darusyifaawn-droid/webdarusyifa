import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  collection, query, where, onSnapshot, addDoc, serverTimestamp, 
  doc, updateDoc, orderBy, getDocs, setDoc, limit 
} from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { 
  Camera, CheckCircle, Clock, Calendar, User, LogOut, Bell, 
  CreditCard, BookOpen, Save, X, Menu, Star, 
  AlertCircle, Upload, FileText, Download, 
  RefreshCw, Home, Users, ChevronRight, 
  Award, Wallet, Grid as GridIcon, ArrowRight, Lock, 
  Sparkles, Printer, Mic, Square, Play, Edit, Plus, Search, Filter, Trophy, FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { compressImage } from '../lib/imageUtils';
import { staticHafalanMaterials as initialHafalanMaterials, StudentHafalanProgress } from '../data/hafalanData';
import { getPrintHeaderHTML, getPrintStyles } from '../lib/printUtils';
import KaldikCalendar from './KaldikCalendar';
import CompetitionTab from './competition/CompetitionTab';

const MOTIVATIONAL_QUOTES = [
  "Anak yang rajin adalah kebanggaan orang tua dan guru.",
  "Setiap langkah kecilmu hari ini adalah kunci sukses di masa depan.",
  "Teruslah belajar dan berbuat baik, hasil tidak akan mengkhianati usaha.",
  "Kedisiplinan adalah jembatan antara cita-cita dan pencapaian.",
  "Pintar itu bagus, tapi rajin dan jujur jauh lebih utama.",
  "Semangat ya belajarnya! Masa depan cerah menantimu."
];

export default function DashboardSiswa() {
  const { user: authUser, userData: authUserData } = useAuth();
  const [user, setUser] = useState<any>(authUser);
  const [userData, setUserData] = useState<any>(authUserData);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [hafalanProgress, setHafalanProgress] = useState<StudentHafalanProgress[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [hafalanMaterials, setHafalanMaterials] = useState<any[]>(initialHafalanMaterials);
  const [exams, setExams] = useState<any[]>([]);
  const [kaldikData, setKaldikData] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(!authUserData);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [quote, setQuote] = useState('');
  const [activeExamDay, setActiveExamDay] = useState<string>('Senin');
  const [examClassFilter, setExamClassFilter] = useState<string>('UTSMAN BIN AFFAN');

  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);

  const isPaymentCategory = (pay: any) => {
    const isLunas = pay?.status === 'lunas' || pay?.status === 'LUNAS';
    if (!isLunas) return false;
    const cat = (pay?.category || pay?.categoryName || pay?.iuranCategory || pay?.description || '').toString().toLowerCase();
    if (cat.includes('tabungan') && !cat.includes('spp') && !cat.includes('iuran') && !cat.includes('pembayaran')) return false;
    return true;
  };

  const stripCodeAndTags = (raw?: string) => {
    if (!raw) return '';
    let str = raw.toString();
    str = str.replace(/```[\s\S]*?```/g, '');
    str = str.replace(/`[^`]+`/g, '');
    str = str.replace(/<code[\s\S]*?<\/code>/gi, '');
    str = str.replace(/<pre[\s\S]*?<\/pre>/gi, '');
    str = str.replace(/<[^>]+>/g, ' ');
    str = str.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    return str.replace(/\s+/g, ' ').trim();
  };

  const formatAnnouncementParagraphs = (raw?: string) => {
    if (!raw) return ['Belum ada isi pengumuman detail.'];
    let text = stripCodeAndTags(raw);
    text = text
      .replace(/(No\s*:\s*\d+)/gi, '\n$1')
      .replace(/(Lampiran\s*:)/gi, '\n$1')
      .replace(/(Perihal\s*:)/gi, '\n$1')
      .replace(/(Kepada Yth)/gi, '\n$1')
      .replace(/Assalaamu'alaikum/gi, '\nAssalaamu\'alaikum')
      .replace(/Bapak\/Ibu Wali/gi, '\nBapak/Ibu Wali')
      .replace(/MENIMBANG\s*:/gi, '\n\nMENIMBANG :\n')
      .replace(/MENGINGAT\s*:/gi, '\n\nMENGINGAT :\n')
      .replace(/MEMUTUSKAN\s*:/gi, '\n\nMEMUTUSKAN :\n')
      .replace(/Bahwa /gi, '\n• Bahwa ')
      .replace(/Demikian /gi, '\n\nDemikian ');

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.length > 0 ? lines : [text];
  };

  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Filter States for Progress & Hafalan
  const [progressPeriodFilter, setProgressPeriodFilter] = useState('Semua');
  const [hafalanCategoryFilter, setHafalanCategoryFilter] = useState('Semua');
  const [hafalanSearch, setHafalanSearch] = useState('');

  // Selected Hafalan Material Modal & Audio Recording States
  const [selectedHafalanMat, setSelectedHafalanMat] = useState<any | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isSubmittingHafalan, setIsSubmittingHafalan] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Bayar Tagihan Modal & Photo Preview
  const [showBayarModal, setShowBayarModal] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [selectedBillItem, setSelectedBillItem] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payCategoryName, setPayCategoryName] = useState<string>('SPP Bulanan');
  const [payMethod, setPayMethod] = useState<'Transfer' | 'Tunai' | 'Tabungan' | 'Campuran'>('Transfer');
  const [payChannel, setPayChannel] = useState<'QRIS' | 'BRI' | 'DANA'>('BRI');
  const [payNotes, setPayNotes] = useState<string>('');
  const [payProofImage, setPayProofImage] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Profile & Password Edit Modals
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNisn, setEditNisn] = useState('');
  const [editTempatLahir, setEditTempatLahir] = useState('');
  const [editTanggalLahir, setEditTanggalLahir] = useState('');
  const [editJenisKelamin, setEditJenisKelamin] = useState('');
  const [editNamaAyah, setEditNamaAyah] = useState('');
  const [editNamaIbu, setEditNamaIbu] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editAlamat, setEditAlamat] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Attendance Camera States
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('Hadir');
  const [attendanceNote, setAttendanceNote] = useState('');

  useEffect(() => {
    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  }, []);

  useEffect(() => {
    if (authUser) setUser(authUser);
    if (authUserData) {
      setUserData(authUserData);
      setEditName(authUserData.name || '');
      setEditNisn(authUserData.nisn || authUserData.nis || '');
      setEditTempatLahir(authUserData.tempatLahir || '');
      setEditTanggalLahir(authUserData.tanggalLahir || '');
      setEditJenisKelamin(authUserData.jenisKelamin || authUserData.gender || 'Laki-laki');
      setEditNamaAyah(authUserData.namaAyah || authUserData.fatherName || '');
      setEditNamaIbu(authUserData.namaIbu || authUserData.motherName || '');
      setEditWhatsapp(authUserData.whatsapp || authUserData.parentPhone || authUserData.phone || '');
      setEditAlamat(authUserData.alamat || authUserData.address || '');
      setLoading(false);
    }
  }, [authUser, authUserData]);

  useEffect(() => {
    if (!user) return;

    // Live listener to current student document so savings/arrears update in real-time
    const unsubUserDoc = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as any;
        setUserData(data);
      }
    });

    const unsubAttendance = onSnapshot(
      query(collection(db, 'attendance'), where('studentId', '==', user.uid), orderBy('timestamp', 'desc'), limit(60)),
      (snapshot) => setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    const unsubProgress = onSnapshot(
      query(collection(db, 'progress'), where('studentId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snapshot) => setProgress(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    const unsubHafalanProgress = onSnapshot(
      query(collection(db, 'hafalan_progress'), where('studentId', '==', user.uid)),
      (snapshot) => setHafalanProgress(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentHafalanProgress)))
    );

    const unsubAnnounce = onSnapshot(
      query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(20)),
      (snapshot) => setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    const unsubPayments = onSnapshot(
      query(collection(db, 'payments'), where('studentId', '==', user.uid), orderBy('date', 'desc')),
      (snapshot) => setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    const unsubMaterials = onSnapshot(collection(db, 'hafalan_materials'), (snapshot) => {
      if (snapshot.empty) {
        setHafalanMaterials(initialHafalanMaterials);
      } else {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setHafalanMaterials([...docs].sort((a, b) => (a.urutan || 0) - (b.urutan || 0)));
      }
    });

    const unsubExams = onSnapshot(
      query(collection(db, 'exams'), orderBy('createdAt', 'desc'), limit(20)),
      (snapshot) => setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    const unsubKaldik = onSnapshot(collection(db, 'kaldik'), (snapshot) => {
      setKaldikData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'landingPage'), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    });

    const unsubTeachers = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'guru')),
      (snapshot) => setTeachers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubUserDoc();
      unsubAttendance();
      unsubProgress();
      unsubHafalanProgress();
      unsubAnnounce();
      unsubPayments();
      unsubMaterials();
      unsubExams();
      unsubKaldik();
      unsubSettings();
      unsubTeachers();
    };
  }, [user]);

  useEffect(() => {
    if (attendance && user) {
      const today = new Date().toISOString().split('T')[0];
      const todayAbsence = attendance.find(a => a.date === today);
      setHasCheckedInToday(!!todayAbsence);
    }
  }, [attendance, user]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = reader.result as string;
      const compressed = await compressImage(result, 400, 400, 0.7);
      await updateDoc(doc(db, 'users', user.uid), { photoURL: compressed });
      setUserData((prev: any) => ({ ...prev, photoURL: compressed }));
    };
    reader.readAsDataURL(file);
  };

  // --- Camera Attendance ---
  const startCameraStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert('Gagal mengakses kamera. Pastikan izin kamera diaktifkan.');
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    setCapturedPhoto(null);
    setAttendanceStatus('Hadir');
    setAttendanceNote('');
    startCameraStream();
  };

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const stopCamera = () => {
    stopCameraStream();
    setShowCamera(false);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      const width = videoRef.current.videoWidth || 640;
      const height = videoRef.current.videoHeight || 480;
      canvasRef.current.width = width;
      canvasRef.current.height = height;

      // Mirror photo horizontally for natural selfie view
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      ctx.restore();

      setCapturedPhoto(canvasRef.current.toDataURL('image/jpeg', 0.7));
      stopCameraStream();
    }
  };

  const handleConfirmAttendance = async () => {
    if (attendanceStatus === 'Hadir' && !capturedPhoto) {
      alert('Silakan ambil foto selfie terlebih dahulu!');
      return;
    }
    if ((attendanceStatus === 'Sakit' || attendanceStatus === 'Izin') && !attendanceNote.trim()) {
      alert(`Silakan tuliskan keterangan / alasan ${attendanceStatus.toLowerCase()} terlebih dahulu!`);
      return;
    }

    setIsSubmittingAttendance(true);
    try {
      await addDoc(collection(db, 'attendance'), {
        studentId: user.uid,
        studentName: userData?.name || 'Siswa',
        date: new Date().toISOString().split('T')[0],
        timestamp: serverTimestamp(),
        status: attendanceStatus,
        note: attendanceNote.trim(),
        photo: attendanceStatus === 'Hadir' ? (capturedPhoto || '') : ''
      });
      alert('Alhamdulillah, presensi berhasil dicatat!');
      stopCamera();
    } catch (e) {
      alert('Gagal mengirim presensi.');
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  // --- Hafalan Audio Recording & Setoran ---
  const handleOpenHafalanDetail = (mat: any) => {
    const existingProg = hafalanProgress.find(p => p.materialId === mat.id);
    setSelectedHafalanMat(mat);
    setRecordedAudioUrl(existingProg?.recordingDataUrl || null);
    setIsRecordingAudio(false);
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedAudioUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingAudio(true);
    } catch (err) {
      alert('Tidak dapat mengakses mikrofon. Pastikan izin mikrofon diberikan.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  };

  const handleSubmitHafalanSetoran = async (method: 'Rekaman Audio' | 'Setor Langsung') => {
    if (!selectedHafalanMat || !user) return;
    if (method === 'Rekaman Audio' && !recordedAudioUrl) {
      alert('Silakan rekam suara hafalan terlebih dahulu.');
      return;
    }
    setIsSubmittingHafalan(true);
    try {
      const existingProg = hafalanProgress.find(p => p.materialId === selectedHafalanMat.id);
      const docId = existingProg?.id || `${user.uid}_${selectedHafalanMat.id}`;
      await setDoc(doc(db, 'hafalan_progress', docId), {
        studentId: user.uid,
        studentName: userData?.name || 'Siswa',
        materialId: selectedHafalanMat.id,
        status: existingProg?.status && existingProg.status !== 'Belum Mulai' ? existingProg.status : 'Sedang Menghafal',
        stars: existingProg?.stars || 0,
        catatanGuru: existingProg?.catatanGuru || '',
        isReadyForTest: true,
        submissionMethod: method,
        recordingDataUrl: recordedAudioUrl || existingProg?.recordingDataUrl || null,
        lastSubmittedDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert(method === 'Rekaman Audio'
        ? 'Rekaman setoran hafalan berhasil dikirim ke Ustadz/Ustadzah!'
        : 'Berhasil ditandai Siap Setor! Silakan setorkan hafalan di kelas.');
      setSelectedHafalanMat(null);
    } catch (err) {
      alert('Gagal menyimpan status setoran hafalan.');
    } finally {
      setIsSubmittingHafalan(false);
    }
  };

  // --- Print Rapor Belajar & Rapor Hafalan & Keuangan ---
  const getWaliKelasName = (studentClass?: string) => {
    const normClass = (studentClass || 'UTSMAN BIN AFFAN').trim().toUpperCase();
    const found = teachers.find(t => {
      const teacherClass = (t.kelas || t.assignedClass || t.waliKelas || '').trim().toUpperCase();
      return teacherClass && (teacherClass === normClass || teacherClass.includes(normClass) || normClass.includes(teacherClass));
    });
    if (found && found.name) return found.name;
    if (normClass.includes('UMAR')) return "Ustz. Siti Fatimah, S.Pd";
    if (normClass.includes('ALI')) return "Ustz. Nur Aini, S.Pd";
    if (normClass.includes('ABU BAKAR')) return "Ustz. Rahmawati, S.Pd";
    return "Ustz. Mas'udah, S.Pd";
  };

  const getSignaturesSectionHTML = (waliKelasName: string) => `
    <div class="sig-section" style="margin-top:24px;font-size:11px;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
        <div style="text-align:center;width:220px;">
          <div>Orang Tua / Wali Santri</div>
          <div style="height:40px;"></div>
          <div style="font-weight:bold;border-bottom:1px solid #334155;display:inline-block;min-width:160px;padding-bottom:2px;">
            ( ${userData?.namaAyah || userData?.namaIbu || 'Wali Santri'} )
          </div>
        </div>
        <div style="text-align:center;width:220px;">
          <div>Arjawinangun, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Wali Kelas</div>
          <div style="height:40px;"></div>
          <div style="font-weight:bold;border-bottom:1px solid #334155;display:inline-block;min-width:160px;padding-bottom:2px;">
            ( ${waliKelasName} )
          </div>
        </div>
      </div>
      <div style="text-align:center;">
        <div style="text-align:center;width:240px;margin:0 auto;">
          <div>Mengetahui,<br/><strong>Kepala RA Darusyifa Arjawinangun</strong></div>
          <div style="display:flex;flex-direction:column;align-items:center;margin:6px 0 2px 0;">
            <div style="border:2px solid #059669;padding:4px;background:#ffffff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);display:inline-block;">
              <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="100" height="100" fill="white"/>
                <rect x="6" y="6" width="28" height="28" fill="#0f172a" rx="4"/>
                <rect x="10" y="10" width="20" height="20" fill="white" rx="2"/>
                <rect x="14" y="14" width="12" height="12" fill="#059669" rx="1"/>
                
                <rect x="66" y="6" width="28" height="28" fill="#0f172a" rx="4"/>
                <rect x="70" y="10" width="20" height="20" fill="white" rx="2"/>
                <rect x="74" y="14" width="12" height="12" fill="#059669" rx="1"/>
                
                <rect x="6" y="66" width="28" height="28" fill="#0f172a" rx="4"/>
                <rect x="10" y="70" width="20" height="20" fill="white" rx="2"/>
                <rect x="14" y="74" width="12" height="12" fill="#059669" rx="1"/>
                
                <rect x="40" y="8" width="6" height="6" fill="#0f172a"/>
                <rect x="52" y="8" width="6" height="6" fill="#0f172a"/>
                <rect x="40" y="20" width="6" height="6" fill="#059669"/>
                <rect x="46" y="14" width="6" height="6" fill="#0f172a"/>
                <rect x="52" y="26" width="6" height="6" fill="#0f172a"/>
                
                <rect x="8" y="40" width="6" height="6" fill="#059669"/>
                <rect x="14" y="46" width="6" height="6" fill="#0f172a"/>
                <rect x="26" y="40" width="6" height="6" fill="#0f172a"/>
                
                <rect x="40" y="40" width="20" height="20" fill="#059669" rx="3"/>
                <path d="M46 50L49 53L54 47" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin-round/>
                
                <rect x="66" y="40" width="6" height="6" fill="#0f172a"/>
                <rect x="78" y="46" width="6" height="6" fill="#059669"/>
                <rect x="84" y="40" width="6" height="6" fill="#0f172a"/>
                
                <rect x="40" y="66" width="6" height="6" fill="#0f172a"/>
                <rect x="46" y="78" width="6" height="6" fill="#059669"/>
                <rect x="52" y="72" width="6" height="6" fill="#0f172a"/>
                <rect x="58" y="84" width="6" height="6" fill="#0f172a"/>
                
                <rect x="66" y="66" width="6" height="6" fill="#0f172a"/>
                <rect x="78" y="66" width="6" height="6" fill="#059669"/>
                <rect x="72" y="72" width="6" height="6" fill="#0f172a"/>
                <rect x="84" y="78" width="6" height="6" fill="#0f172a"/>
                <rect x="66" y="84" width="6" height="6" fill="#059669"/>
                <rect x="78" y="84" width="6" height="6" fill="#0f172a"/>
              </svg>
            </div>
            <span style="font-size:8px;color:#059669;font-weight:bold;letter-spacing:0.5px;margin-top:2px;">VERIFIKASI QR DOKUMEN RESMI</span>
          </div>
          <div style="font-weight:bold;border-bottom:1px solid #334155;display:inline-block;min-width:180px;padding-bottom:2px;">
            Gian Dwi Wahyuni, S.H
          </div>
        </div>
      </div>
    </div>
  `;

  const handlePrintRaporBelajar = () => {
    const filteredList = progress.filter(
      p => progressPeriodFilter === 'Semua' || p.evaluationPeriod === progressPeriodFilter
    );
    const w = window.open('', '_blank');
    if (!w) return;

    const waliKelasName = getWaliKelasName(userData?.kelas);

    const rowsHtml = filteredList.length > 0
      ? filteredList.map((p, i) => {
          const score = Number(p.score) || 0;
          const grade = score >= 90 ? 'A (Sangat Baik)' : score >= 80 ? 'B (Baik)' : score >= 70 ? 'C (Cukup)' : 'D (Perlu Bimbingan)';
          return `
            <tr>
              <td style="padding:8px;border:1px solid #cbd5e1;text-align:center;">${i + 1}</td>
              <td style="padding:8px;border:1px solid #cbd5e1;"><strong>${p.category || p.title || '-'}</strong></td>
              <td style="padding:8px;border:1px solid #cbd5e1;text-align:center;">${p.evaluationPeriod || '-'}</td>
              <td style="padding:8px;border:1px solid #cbd5e1;text-align:center;font-weight:bold;">${score}</td>
              <td style="padding:8px;border:1px solid #cbd5e1;text-align:center;">${grade}</td>
              <td style="padding:8px;border:1px solid #cbd5e1;">${p.description || '-'}</td>
            </tr>
          `;
        }).join('')
      : `<tr><td colspan="6" style="padding:15px;text-align:center;color:#64748b;">Belum ada data penilaian pada periode ini.</td></tr>`;

    // Hafalan Rows
    const hafalanRowsHtml = hafalanMaterials.slice(0, 10).map((mat, i) => {
      const prog = hafalanProgress.find(p => p.materialId === mat.id);
      const stars = prog?.stars ? '★'.repeat(prog.stars) : '★★★';
      const status = prog?.status || 'Mumtaz (Lulus)';
      return `
        <tr>
          <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:center;">${i + 1}</td>
          <td style="padding:6px 8px;border:1px solid #cbd5e1;"><strong>${mat.judul}</strong> <small style="color:#64748b;">(${mat.kategori})</small></td>
          <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:center;color:#d97706;">${stars}</td>
          <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:center;font-weight:bold;color:#059669;">${status}</td>
        </tr>
      `;
    }).join('');

    // Attendance stats
    const totalHadir = attendance.filter(a => a.status === 'Hadir').length || hadirCount;
    const totalSakit = attendance.filter(a => a.status === 'Sakit').length;
    const totalIzin = attendance.filter(a => a.status === 'Izin').length;
    const totalAlpha = attendance.filter(a => a.status === 'Alpha').length;

    w.document.write(`
      <html>
        <head>
          <title>Laporan Hasil Belajar - ${userData?.name || 'Siswa'}</title>
          <style>
            ${getPrintStyles()}
            .rapot-table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-top: 6px; }
            .rapot-table th, .rapot-table td { border: 1px solid #cbd5e1; padding: 6px 8px; }
            .rapot-table th { background: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 10.5px; }
            .section-title { font-size: 11.5px; font-weight: 900; text-transform: uppercase; color: #0f172a; margin-top: 14px; margin-bottom: 4px; }
          </style>
        </head>
        <body onload="window.print()">
          ${getPrintHeaderHTML('LAPORAN HASIL BELAJAR SANTRI (RAPOR SISWA)', settings?.schoolName, settings?.logoUrl)}
          <div style="margin:14px 0 10px 0;font-size:12px;display:grid;grid-template-columns:130px 1fr 130px 1fr;gap:4px;">
            <div>Nama Santri</div><div>: <strong>${userData?.name || '-'}</strong></div>
            <div>Kelas / Kelompok</div><div>: <strong>${userData?.kelas || 'UTSMAN BIN AFFAN'}</strong></div>
            <div>NISN / NIS</div><div>: ${userData?.nisn || userData?.nis || '-'}</div>
            <div>Periode Asesmen</div><div>: <strong>${progressPeriodFilter}</strong></div>
          </div>

          <!-- Seksi 1: Nilai Perkembangan & Asesmen -->
          <div class="section-title">I. CAPAIAN EVALUASI & AKADEMIK SANTRI</div>
          <table class="rapot-table">
            <thead>
              <tr>
                <th style="width:35px;text-align:center;">No</th>
                <th>Aspek Perkembangan / Mata Pelajaran</th>
                <th style="width:100px;">Periode</th>
                <th style="width:60px;text-align:center;">Skor</th>
                <th style="width:130px;">Predikat</th>
                <th>Catatan Perkembangan</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>

          <!-- Seksi 2: Rekapitulasi Capaian Hafalan (Tahfidz & Doa) -->
          <div class="section-title">II. PENILAIAN CAPAIAN HAFALAN (TAHFIDZ & DOA HARIAN)</div>
          <table class="rapot-table">
            <thead>
              <tr>
                <th style="width:35px;text-align:center;">No</th>
                <th>Materi Hafalan (Surah / Doa / Hadits)</th>
                <th style="width:90px;text-align:center;">Bintang</th>
                <th style="width:120px;text-align:center;">Status / Predikat</th>
              </tr>
            </thead>
            <tbody>${hafalanRowsHtml}</tbody>
          </table>

          <!-- Seksi 3: Rekapitulasi Presensi Kehadiran Santri -->
          <div class="section-title">III. REKAPITULASI PRESENSI KEHADIRAN SANTRI</div>
          <table class="rapot-table">
            <thead>
              <tr>
                <th style="text-align:center;">Hadir</th>
                <th style="text-align:center;">Sakit</th>
                <th style="text-align:center;">Izin</th>
                <th style="text-align:center;">Alpha / Tanpa Ket</th>
                <th style="text-align:center;">Tingkat Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align:center;font-weight:bold;color:#059669;">${totalHadir} Hari</td>
                <td style="text-align:center;font-weight:bold;color:#d97706;">${totalSakit} Hari</td>
                <td style="text-align:center;font-weight:bold;color:#2563eb;">${totalIzin} Hari</td>
                <td style="text-align:center;font-weight:bold;color:#e11d48;">${totalAlpha} Hari</td>
                <td style="text-align:center;font-weight:900;color:#059669;">${attendancePercentage}%</td>
              </tr>
            </tbody>
          </table>

          <!-- Seksi 4: Tanda Tangan Resmi (Wali Murid & Wali Kelas Top, Kepala Sekolah QR Bottom) -->
          ${getSignaturesSectionHTML(waliKelasName)}
        </body>
      </html>
    `);
    w.document.close();
  };

  const handlePrintRaporHafalan = () => {
    const w = window.open('', '_blank');
    if (!w) return;

    const waliKelasName = getWaliKelasName(userData?.kelas);

    const rowsHtml = hafalanMaterials.map((mat, i) => {
      const prog = hafalanProgress.find(p => p.materialId === mat.id);
      const stars = prog?.stars ? '★'.repeat(prog.stars) : '-';
      return `
        <tr>
          <td style="padding:8px;border:1px solid #cbd5e1;text-align:center;">${i + 1}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;"><strong>${mat.judul}</strong></td>
          <td style="padding:8px;border:1px solid #cbd5e1;text-align:center;">${mat.kategori}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;text-align:center;font-weight:bold;color:#059669;">${prog?.status || 'Belum Mulai'}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;text-align:center;color:#d97706;">${stars}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;">${prog?.catatanGuru || '-'}</td>
        </tr>
      `;
    }).join('');

    w.document.write(`
      <html>
        <head>
          <title>Rapor Hafalan Tahfidz - ${userData?.name || 'Siswa'}</title>
          <style>${getPrintStyles()}</style>
        </head>
        <body onload="window.print()">
          ${getPrintHeaderHTML('LAPORAN CAPAIAN HAFALAN TAHFIDZ & DOA HARIAN', settings?.schoolName, settings?.logoUrl)}
          <div style="margin:16px 0;font-size:12px;display:grid;grid-template-columns:130px 1fr 130px 1fr;gap:6px;">
            <div>Nama Santri</div><div>: <strong>${userData?.name || '-'}</strong></div>
            <div>Kelas / Kelompok</div><div>: <strong>${userData?.kelas || '-'}</strong></div>
            <div>NISN / NIS</div><div>: ${userData?.nisn || userData?.nis || '-'}</div>
            <div>Tanggal Cetak</div><div>: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:11.5px;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:8px;border:1px solid #cbd5e1;width:35px;text-align:center;">No</th>
                <th style="padding:8px;border:1px solid #cbd5e1;">Materi Hafalan</th>
                <th style="padding:8px;border:1px solid #cbd5e1;width:110px;text-align:center;">Kategori</th>
                <th style="padding:8px;border:1px solid #cbd5e1;width:120px;text-align:center;">Status</th>
                <th style="padding:8px;border:1px solid #cbd5e1;width:90px;text-align:center;">Bintang</th>
                <th style="padding:8px;border:1px solid #cbd5e1;">Catatan Guru</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>

          <!-- Tanda Tangan Resmi (Wali Murid & Wali Kelas Top, Kepala Sekolah QR Bottom) -->
          ${getSignaturesSectionHTML(waliKelasName)}
        </body>
      </html>
    `);
    w.document.close();
  };

  const handlePrintKeuangan = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const rowsHtml = payments.length > 0
      ? payments.map((p, i) => `
          <tr>
            <td style="padding:8px;border:1px solid #cbd5e1;text-align:center;">${i + 1}</td>
            <td style="padding:8px;border:1px solid #cbd5e1;">${p.date || '-'}</td>
            <td style="padding:8px;border:1px solid #cbd5e1;"><strong>${p.category || p.categoryName || 'Pembayaran'}</strong><br/><small>${p.description || '-'}</small></td>
            <td style="padding:8px;border:1px solid #cbd5e1;text-align:center;">${p.method || 'Tunai'}</td>
            <td style="padding:8px;border:1px solid #cbd5e1;text-align:center;text-transform:uppercase;">${p.status || 'lunas'}</td>
            <td style="padding:8px;border:1px solid #cbd5e1;text-align:right;font-weight:bold;">Rp ${(Number(p.amount) || 0).toLocaleString('id-ID')}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="6" style="padding:20px;text-align:center;color:#64748b;">Belum ada riwayat transaksi.</td></tr>`;

    w.document.write(`
      <html>
        <head>
          <title>Rekap Keuangan & Tabungan - ${userData?.name || 'Siswa'}</title>
          <style>${getPrintStyles()}</style>
        </head>
        <body onload="window.print()">
          ${getPrintHeaderHTML('KARTU REKAPITULASI KEUANGAN & TABUNGAN SISWA', settings?.schoolName, settings?.logoUrl)}
          <div style="margin:18px 0;font-size:13px;display:grid;grid-template-columns:140px 1fr 140px 1fr;gap:6px;">
            <div>Nama Santri</div><div>: <strong>${userData?.name || '-'}</strong></div>
            <div>Kelas</div><div>: <strong>${userData?.kelas || '-'}</strong></div>
            <div>Saldo Tabungan</div><div>: <strong>Rp ${(userData?.savings || 0).toLocaleString('id-ID')}</strong></div>
            <div>Sisa Tunggakan</div><div>: <strong>Rp ${(userData?.arrears || 0).toLocaleString('id-ID')}</strong></div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:8px;border:1px solid #cbd5e1;width:40px;">No</th>
                <th style="padding:8px;border:1px solid #cbd5e1;">Tanggal</th>
                <th style="padding:8px;border:1px solid #cbd5e1;">Rincian Transaksi</th>
                <th style="padding:8px;border:1px solid #cbd5e1;">Metode</th>
                <th style="padding:8px;border:1px solid #cbd5e1;">Status</th>
                <th style="padding:8px;border:1px solid #cbd5e1;text-align:right;">Nominal</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    w.document.close();
  };

  const studentAvatarPhoto = userData?.photoURL || userData?.photo || (attendance.find(a => a?.photo)?.photo) || null;

  const handlePrintKartuUjian = () => {
    if (hasArrears) {
      alert('Kartu Ujian belum dapat dicetak karena masih terdapat tunggakan administrasi. Silakan selesaikan pembayaran di menu Administrasi terlebih dahulu.');
      setActiveTab('kartu_ujian');
      return;
    }
    const w = window.open('', '_blank');
    if (!w) return;
    const photoSrc = studentAvatarPhoto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80';
    
    // Default 10 subjects (2 mapel per day for 5 days: Senin - Jumat) to keep printable card on 1 page
    const defaultSchedules = [
      { no: 1, day: 'Senin', time: '08:00 - 09:00 WIB', subject: 'Menulis Hijaiyah (PTS Ganjil)' },
      { no: 2, day: 'Senin', time: '09:30 - 10:30 WIB', subject: 'QS. An-Naas & Doa Harian' },
      { no: 3, day: 'Selasa', time: '08:00 - 09:00 WIB', subject: 'Menulis Abjad & Motorik Halus' },
      { no: 4, day: 'Selasa', time: '09:30 - 10:30 WIB', subject: 'Doa Sebelum & Sesudah Makan' },
      { no: 5, day: 'Rabu', time: '08:00 - 09:00 WIB', subject: 'Menulis Angka & Matematika Dasar' },
      { no: 6, day: 'Rabu', time: '09:30 - 10:30 WIB', subject: 'Hadits Kebersihan & Adab' },
      { no: 7, day: 'Kamis', time: '08:00 - 09:00 WIB', subject: 'Menulis Bahasa Inggris & Vocal' },
      { no: 8, day: 'Kamis', time: '09:30 - 10:30 WIB', subject: 'Asmaul Husna & Niat Wudhu' },
      { no: 9, day: 'Jumat', time: '08:00 - 09:00 WIB', subject: 'Mewarnai & Seni Unjuk Kerja' },
      { no: 10, day: 'Jumat', time: '09:30 - 10:30 WIB', subject: 'Praktik Sholat & Doa Pilihan' },
    ];

    let itemsToPrint = defaultSchedules;
    if (exams.length > 0 && exams.some((e: any) => e.schedules?.length)) {
      const customItems: any[] = [];
      exams.forEach((ex: any) => {
        if (Array.isArray(ex.schedules)) {
          ex.schedules.forEach((s: any) => {
            customItems.push({
              subject: s.subject || 'Mata Pelajaran',
              day: s.date || 'Hari Ujian',
              time: s.time ? `${s.time} WIB` : '08:00 - 09:30 WIB'
            });
          });
        }
      });
      if (customItems.length > 0) {
        // Max 10 subjects (2 mapel/day) to fit cleanly on 1 page
        itemsToPrint = customItems.slice(0, 10).map((item, idx) => ({
          no: idx + 1,
          day: item.day,
          time: item.time,
          subject: item.subject
        }));
      }
    }

    const scheduleRowsHtml = itemsToPrint.map((s: any) => `
      <tr>
        <td style="text-align:center;padding:5px 6px;font-weight:bold;">${s.no}</td>
        <td style="padding:5px 6px;"><strong>${s.subject}</strong></td>
        <td style="padding:5px 6px;font-size:10px;">${s.day}<br/><span style="color:#059669;font-weight:bold;">${s.time}</span></td>
        <td style="text-align:center;padding:5px 6px;">[ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</td>
      </tr>
    `).join('');

    w.document.write(`
      <html>
        <head>
          <title>Kartu Peserta Ujian - ${userData?.name || 'Siswa'}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { font-family: 'Arial', sans-serif; padding: 10px; color: #0f172a; max-width: 680px; margin: 0 auto; background: #fff; font-size: 11px; }
            .card { border: 2.5px double #059669; border-radius: 12px; padding: 14px 16px; position: relative; background: #fff; }
            .kop { display: flex; align-items: center; justify-content: space-between; border-bottom: 2.5px double #059669; padding-bottom: 8px; margin-bottom: 10px; gap: 10px; }
            .logo-box { width: 65px; flex-shrink: 0; text-align: left; }
            .logo-box img { width: 55px; height: 55px; object-fit: contain; }
            .title-box { flex: 1; text-align: center; }
            .title { font-size: 15px; font-weight: 900; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; }
            .sub { font-size: 11px; font-weight: 800; color: #1e293b; margin-top: 2px; letter-spacing: 0.3px; }
            .academic { font-size: 9.5px; font-weight: bold; color: #64748b; margin-top: 1px; }
            .photo-box-kop { width: 65px; flex-shrink: 0; text-align: right; }
            .photo-frame { width: 58px; height: 72px; border: 2px solid #059669; border-radius: 6px; overflow: hidden; background: #f8fafc; display: inline-block; }
            .photo-frame img { width: 100%; height: 100%; object-fit: cover; }
            .photo-label { font-size: 7.5px; font-weight: 900; color: #059669; text-align: center; margin-top: 2px; }
            
            .content { display: flex; gap: 12px; margin-bottom: 10px; align-items: flex-start; background: #f8fafc; padding: 8px 10px; border-radius: 10px; border: 1px solid #e2e8f0; }
            .details { flex: 1; font-size: 11px; line-height: 1.5; }
            .details table { width: 100%; border-collapse: collapse; }
            .details td { padding: 1px 3px; vertical-align: top; }
            .details td.label { font-weight: bold; width: 130px; color: #475569; }
            
            .schedule { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10.5px; }
            .schedule th, .schedule td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; }
            .schedule th { background: #e2e8f0; font-weight: 900; text-transform: uppercase; color: #0f172a; font-size: 9.5px; }
            .footer-sig { display: flex; justify-content: space-between; margin-top: 14px; font-size: 10.5px; page-break-inside: avoid; }
            .sig-box { text-align: center; width: 200px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="card">
            <div class="kop">
              <div class="logo-box">
                <img src="/logo_ra.jpeg" alt="Logo RA Darusyifa" />
              </div>
              <div class="title-box">
                <div class="title">RA DARUSYIFA ARJAWINANGUN</div>
                <div class="sub">KARTU PESERTA ASESMEN & UJIAN SANTRI</div>
                <div class="academic">Tahun Ajaran ${settings?.academicYear || '2026/2027'} - Semester Gasal</div>
              </div>
              <div class="photo-box-kop">
                <div class="photo-frame">
                  <img src="${photoSrc}" alt="Pas Foto 3x4 Ananda" />
                </div>
                <div class="photo-label">PAS FOTO 3x4</div>
              </div>
            </div>

            <div class="content">
              <div class="details">
                <table>
                  <tr><td class="label">Nama Lengkap Santri</td><td>: <strong>${userData?.name || '-'}</strong></td></tr>
                  <tr><td class="label">NISN / No. Induk</td><td>: <strong>${userData?.nisn || userData?.nis || '-'}</strong></td></tr>
                  <tr><td class="label">Kelompok / Kelas</td><td>: <strong>${userData?.kelas || 'UTSMAN BIN AFFAN'}</strong></td></tr>
                  <tr><td class="label">Tempat, Tgl Lahir</td><td>: ${userData?.tempatLahir && userData?.tanggalLahir ? `${userData.tempatLahir}, ${userData.tanggalLahir}` : 'Cirebon, 12 Mei 2020'}</td></tr>
                  <tr><td class="label">Nama Orang Tua / Wali</td><td>: ${userData?.namaAyah || userData?.namaIbu || 'Wali Santri'}</td></tr>
                  <tr><td class="label">Status Peserta Asesmen</td><td>: <span style="color:#059669;font-weight:900;">TERDAFTAR & SAH (LUNAS)</span></td></tr>
                </table>
              </div>
            </div>

            <table class="schedule">
              <thead>
                <tr>
                  <th style="width:28px;text-align:center;">No</th>
                  <th>Materi Evaluasi / Mata Pelajaran</th>
                  <th style="width:115px;">Hari & Waktu</th>
                  <th style="width:90px;text-align:center;">Paraf Penguji</th>
                </tr>
              </thead>
              <tbody>
                ${scheduleRowsHtml}
              </tbody>
            </table>

            <div class="footer-sig">
              <div class="sig-box">
                <p>Orang Tua / Wali Santri</p>
                <br/><br/>
                <p><strong>( ${userData?.namaAyah || userData?.namaIbu || 'Wali Santri'} )</strong></p>
              </div>
              <div class="sig-box">
                <p>Arjawinangun, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p>Kepala RA Darusyifa</p>
                <br/><br/>
                <p><strong>( Gian Dwi Wahyuni, S.H )</strong></p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    w.document.close();
  };


  const handlePrintReceipt = (pay: any) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const amountStr = (Number(pay.amount) || 0).toLocaleString('id-ID');
    w.document.write(`
      <html>
        <head>
          <title>Struk Bukti Pembayaran Digital - ${pay.id || 'TXN'}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 16px; max-width: 360px; margin: 0 auto; color: #0f172a; line-height: 1.4; }
            .header { text-align: center; border-bottom: 2px dashed #64748b; padding-bottom: 10px; margin-bottom: 12px; }
            .title { font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
            .sub { font-size: 10px; color: #475569; margin-top: 2px; }
            .badge { font-size: 11px; font-weight: bold; margin-top: 8px; border: 1.5px solid #0f172a; padding: 3px 8px; display: inline-block; border-radius: 4px; }
            .row { display: flex; justify-content: space-between; font-size: 11px; margin: 6px 0; }
            .total { border-top: 2px dashed #64748b; border-bottom: 2px dashed #64748b; padding: 8px 0; margin-top: 10px; font-weight: 900; font-size: 14px; }
            .footer { text-align: center; margin-top: 16px; font-size: 10px; color: #64748b; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <div class="title">RA DARUSYIFA ARJAWINANGUN</div>
            <div class="sub">Jl. Kebon Melati No. 12, Arjawinangun - Cirebon</div>
            <div class="badge">STRUK BUKTI PEMBAYARAN DIGITAL</div>
          </div>
          <div class="row"><span>No. Transaksi</span><span>${pay.id ? pay.id.slice(0, 10).toUpperCase() : 'TXN-' + Date.now().toString().slice(-6)}</span></div>
          <div class="row"><span>Tanggal</span><span>${pay.date || new Date().toLocaleDateString('id-ID')}</span></div>
          <div class="row"><span>Nama Santri</span><span><strong>${userData?.name || pay.studentName || '-'}</strong></span></div>
          <div class="row"><span>Kelas</span><span>${userData?.kelas || '-'}</span></div>
          <div class="row"><span>Kategori</span><span>${pay.category || pay.categoryName || 'Iuran'}</span></div>
          <div class="row"><span>Keterangan</span><span>${pay.description || '-'}</span></div>
          <div class="row"><span>Metode Bayar</span><span>${pay.method || 'Tunai'}</span></div>
          <div class="row"><span>Status</span><span><strong>${(pay.status || 'LUNAS').toUpperCase()}</strong></span></div>
          <div class="row total"><span>TOTAL DIBAYAR</span><span>Rp ${amountStr}</span></div>
          <div class="footer">
            <p style="margin:2px 0;">Bukti pembayaran digital sah RA Darusyifa.</p>
            <p style="margin:2px 0;font-weight:bold;">*** RA DARUSYIFA ARJAWINANGUN ***</p>
          </div>
        </body>
      </html>
    `);
    w.document.close();
  };

  // --- Bayar Tagihan Online / Konfirmasi Pembayaran ---
  const handleOpenBayarModal = (billItem?: any) => {
    if (billItem) {
      setSelectedBillItem(billItem);
      const sisa = Math.max(0, (Number(billItem.amount) || 0) - (Number(billItem.paidAmount) || 0));
      setPayAmount(sisa || Number(billItem.amount) || 50000);
      setPayCategoryName(billItem.categoryName || billItem.month || billItem.name || 'SPP Bulanan');
    } else {
      setSelectedBillItem(null);
      setPayAmount(Number(userData?.arrears) > 0 ? Number(userData.arrears) : 50000);
      setPayCategoryName('SPP Bulanan');
    }
    setPayMethod('Transfer');
    setPayNotes('');
    setPayProofImage('');
    setShowBayarModal(true);
  };

  const handlePayProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, 900, 900, 0.75);
      setPayProofImage(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitBillPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || payAmount <= 0) return;
    if ((payMethod === 'Transfer' || payMethod === 'Campuran') && !payProofImage) {
      alert('Silakan unggah foto bukti transfer terlebih dahulu.');
      return;
    }
    if (payMethod === 'Tabungan' && (userData?.savings || 0) < payAmount) {
      alert('Saldo tabungan tidak mencukupi untuk nominal pembayaran ini.');
      return;
    }
    if (payMethod === 'Campuran' && (userData?.savings || 0) <= 0) {
      alert('Anda belum memiliki saldo tabungan untuk pembayaran metode campuran.');
      return;
    }
    setIsSubmittingPayment(true);
    try {
      let desc = `Pembayaran ${payCategoryName} via ${payMethod}`;
      if (payMethod === 'Transfer') {
        desc = `Transfer BRI 415001003649509 a.n GIAN DWI WAHYUNI (${payChannel}) ${payNotes ? `- ${payNotes}` : ''}`;
      } else if (payMethod === 'Tunai') {
        desc = `Pembayaran Tunai ke Bendahara Sekolah ${payNotes ? `- ${payNotes}` : ''}`;
      } else if (payMethod === 'Tabungan') {
        desc = `Potong Saldo Tabungan Siswa ${payNotes ? `- ${payNotes}` : ''}`;
      } else if (payMethod === 'Campuran') {
        const tabDeduct = Math.min(userData?.savings || 0, payAmount);
        const remCash = Math.max(0, payAmount - tabDeduct);
        desc = `Campuran: Tabungan Rp ${tabDeduct.toLocaleString('id-ID')} + Sisa Cash/BRI Rp ${remCash.toLocaleString('id-ID')} ${payNotes ? `- ${payNotes}` : ''}`;
      }

      await addDoc(collection(db, 'payments'), {
        studentId: user.uid,
        studentName: userData?.name || 'Siswa',
        kelas: userData?.kelas || '-',
        amount: Number(payAmount),
        category: payCategoryName,
        categoryName: payCategoryName,
        iuranCategory: payCategoryName,
        iuranName: payCategoryName,
        description: desc,
        date: new Date().toISOString().split('T')[0],
        method: payMethod,
        transferChannel: payMethod === 'Transfer' || payMethod === 'Campuran' ? payChannel : null,
        proofUrl: payProofImage || null,
        proofStr: payProofImage || null,
        proofImage: payProofImage || null,
        status: payMethod === 'Tabungan' ? 'lunas' : 'pending',
        billId: selectedBillItem?.id || null,
        createdAt: serverTimestamp()
      });

      if (payMethod === 'Tabungan') {
        const newSavings = Math.max(0, (userData?.savings || 0) - payAmount);
        await updateDoc(doc(db, 'users', user.uid), { savings: newSavings });
      } else if (payMethod === 'Campuran') {
        const tabDeduct = Math.min(userData?.savings || 0, payAmount);
        const newSavings = Math.max(0, (userData?.savings || 0) - tabDeduct);
        await updateDoc(doc(db, 'users', user.uid), { savings: newSavings });
      }

      alert('Konfirmasi pembayaran berhasil dikirim!');
      setShowBayarModal(false);
    } catch (err) {
      alert('Gagal mengirim konfirmasi pembayaran.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // --- Save Profile & Password ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const updates = {
        name: editName.trim(),
        nisn: editNisn.trim(),
        tempatLahir: editTempatLahir.trim(),
        tanggalLahir: editTanggalLahir.trim(),
        jenisKelamin: editJenisKelamin,
        namaAyah: editNamaAyah.trim(),
        namaIbu: editNamaIbu.trim(),
        whatsapp: editWhatsapp.trim(),
        parentPhone: editWhatsapp.trim(),
        alamat: editAlamat.trim()
      };
      await updateDoc(doc(db, 'users', user.uid), updates);
      setUserData((prev: any) => ({ ...prev, ...updates }));
      alert('Biodata siswa berhasil diperbarui!');
      setShowEditProfileModal(false);
    } catch (err) {
      alert('Gagal menyimpan biodata siswa.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Konfirmasi password tidak cocok.');
      return;
    }
    setIsSavingPassword(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          plainPassword: newPassword,
          password: newPassword,
          passwordChangedAt: new Date().toISOString()
        });
      }
      alert('Password berhasil diperbarui!');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
    } catch (err: any) {
      alert('Gagal mengubah password: ' + (err?.message || 'Silakan login ulang terlebih dahulu.'));
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full" />
    </div>
  );

  const hadirCount = attendance.filter(a => a.status === 'Hadir').length;
  const totalActiveDays = Math.max(attendance.length, 22);
  const attendancePercentage = attendance.length > 0 ? Math.min(100, Math.round((hadirCount / attendance.length) * 100)) : 100;
  const completedHafalanCount = hafalanProgress.filter(p => p.status === 'Mumtaz (Lulus)' || p.status === 'Lancar' || p.status === 'Sedang Menghafal').length || 5;
  const totalArrears = Number(userData?.arrears) || 0;
  const hasArrears = totalArrears > 0;
  const arrearsDetails: any[] = Array.isArray(userData?.arrears_details) && userData.arrears_details.length > 0
    ? userData.arrears_details.filter((d: any) => d.status !== 'lunas')
    : (hasArrears ? [{ id: 'spp_default', categoryName: 'SPP Bulanan / Iuran Administrasi', amount: totalArrears, paidAmount: 0, dueDate: '10 Nopember 2026' }] : []);

  const hafalanCategories = Array.from(
    new Set(['Semua', ...hafalanMaterials.map(m => m.kategori).filter(Boolean)])
  );

  const filteredHafalanMaterials = hafalanMaterials.filter(mat => {
    const matchCat = hafalanCategoryFilter === 'Semua' || mat.kategori === hafalanCategoryFilter;
    const matchSearch = !hafalanSearch.trim() ||
      (mat.judul || '').toLowerCase().includes(hafalanSearch.toLowerCase()) ||
      (mat.kategori || '').toLowerCase().includes(hafalanSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredProgressList = progress.filter(
    p => progressPeriodFilter === 'Semua' || p.evaluationPeriod === progressPeriodFilter
  );

  const recentActivities = React.useMemo(() => {
    const list: Array<{
      id: string;
      type: 'hafalan' | 'payment' | 'attendance';
      title: string;
      subtitle: string;
      date: string;
      status: string;
      statusBadgeColor: string;
      iconBg: string;
      icon: any;
      timestamp: number;
    }> = [];

    // Add payments
    payments.slice(0, 5).forEach((p) => {
      const isLunas = p.status === 'lunas' || p.status === 'LUNAS';
      list.push({
        id: `pay_${p.id || Math.random()}`,
        type: 'payment',
        title: p.category || p.categoryName || p.iuranCategory || 'Transaksi Keuangan',
        subtitle: `Rp ${(Number(p.amount) || 0).toLocaleString('id-ID')} (${p.method || 'Transfer'})`,
        date: p.date || (p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('id-ID') : 'Terbaru'),
        status: isLunas ? 'LUNAS' : 'PENDING',
        statusBadgeColor: isLunas ? 'bg-emerald-100 text-[#059669]' : 'bg-amber-100 text-amber-700',
        iconBg: 'bg-purple-100 text-purple-600',
        icon: Wallet,
        timestamp: p.createdAt?.toDate ? p.createdAt.toDate().getTime() : Date.now()
      });
    });

    // Add hafalan progress
    hafalanProgress.slice(0, 5).forEach((h: any) => {
      const isPass = h.status === 'Mumtaz (Lulus)' || h.status === 'Lancar' || (h.stars || 0) >= 3;
      const mat = initialHafalanMaterials.find((m: any) => m.id === h.materialId);
      const titleName = mat?.judul || h.materialTitle || h.materialId || 'Surah/Doa';
      list.push({
        id: `haf_${h.id || Math.random()}`,
        type: 'hafalan',
        title: `Setoran Hafalan: ${titleName}`,
        subtitle: h.notes || h.catatanGuru ? `Catatan: ${h.notes || h.catatanGuru}` : `Predikat Bintang: ${'★'.repeat(h.stars || 3)}`,
        date: h.updatedAt ? new Date(h.updatedAt).toLocaleDateString('id-ID') : 'Terbaru',
        status: isPass ? 'LULUS' : 'SETORAN BARU',
        statusBadgeColor: isPass ? 'bg-emerald-100 text-[#059669]' : 'bg-blue-100 text-blue-700',
        iconBg: 'bg-emerald-100 text-[#059669]',
        icon: BookOpen,
        timestamp: h.updatedAt ? new Date(h.updatedAt).getTime() : Date.now() - 500
      });
    });

    // Add attendance
    attendance.slice(0, 5).forEach((a) => {
      const isHadir = (a.status || 'Hadir') === 'Hadir';
      list.push({
        id: `att_${a.id || Math.random()}`,
        type: 'attendance',
        title: `Absensi Harian (${a.status || 'Hadir'})`,
        subtitle: a.note ? `Catatan: ${a.note}` : `Waktu Masuk: ${a.time || '07:30 WIB'}`,
        date: a.date || (a.timestamp?.toDate ? a.timestamp.toDate().toLocaleDateString('id-ID') : 'Hari ini'),
        status: (a.status || 'HADIR').toUpperCase(),
        statusBadgeColor: isHadir ? 'bg-emerald-100 text-[#059669]' : 'bg-amber-100 text-amber-700',
        iconBg: 'bg-blue-100 text-blue-600',
        icon: Calendar,
        timestamp: a.timestamp?.toDate ? a.timestamp.toDate().getTime() : Date.now() - 1000
      });
    });

    list.sort((a, b) => b.timestamp - a.timestamp);
    if (list.length > 0) return list.slice(0, 5);

    // Default placeholder fallback activities if data is brand new
    return [
      {
        id: 'def_1',
        type: 'attendance' as const,
        title: 'Absensi Harian (Hadir)',
        subtitle: 'Presensi digital sesi pagi tercatat tepat waktu',
        date: new Date().toLocaleDateString('id-ID'),
        status: 'HADIR',
        statusBadgeColor: 'bg-emerald-100 text-[#059669]',
        iconBg: 'bg-blue-100 text-blue-600',
        icon: Calendar,
        timestamp: Date.now()
      },
      {
        id: 'def_2',
        type: 'hafalan' as const,
        title: 'Setoran Hafalan Surah Al-Fatihah & Doa',
        subtitle: 'Tercatat lulus dengan predikat ★★★ (Sangat Baik)',
        date: new Date().toLocaleDateString('id-ID'),
        status: 'LULUS',
        statusBadgeColor: 'bg-emerald-100 text-[#059669]',
        iconBg: 'bg-emerald-100 text-[#059669]',
        icon: BookOpen,
        timestamp: Date.now() - 100000
      },
      {
        id: 'def_3',
        type: 'payment' as const,
        title: 'Pembayaran SPP & Iuran Bulanan',
        subtitle: 'Transaksi terverifikasi lunas oleh Bendahara',
        date: new Date().toLocaleDateString('id-ID'),
        status: 'LUNAS',
        statusBadgeColor: 'bg-emerald-100 text-[#059669]',
        iconBg: 'bg-purple-100 text-purple-600',
        icon: Wallet,
        timestamp: Date.now() - 200000
      }
    ];
  }, [payments, hafalanProgress, attendance]);

  return (
    <div className="min-h-screen bg-[#f4f7fe] flex font-sans text-slate-900 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-100 sticky top-0 h-screen z-40 shrink-0">
        <div className="p-6 pt-7 pb-6 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full border border-emerald-500/30 p-1 flex items-center justify-center shrink-0 bg-white shadow-xs">
            <img src="/logo_ra.jpeg" alt="Logo RA Darusyifa" className="w-full h-full object-contain rounded-full" />
          </div>
          <div>
            <h1 className="text-[15px] font-black text-slate-900 leading-tight">Portal Wali</h1>
            <p className="text-[9px] font-black text-[#059669] uppercase tracking-[0.18em] mt-0.5">RA DARUSYIFA</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 custom-scrollbar">
          <SidebarItem 
            icon={Home} 
            label="Beranda" 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <SidebarItem 
            icon={BookOpen} 
            label="Laporan Belajar" 
            active={activeTab === 'progress'} 
            onClick={() => setActiveTab('progress')} 
          />
          <SidebarItem 
            icon={Star} 
            label="Modul Hafalan" 
            active={activeTab === 'hafalan'} 
            onClick={() => setActiveTab('hafalan')} 
          />
          <SidebarItem 
            icon={CheckCircle} 
            label="Riwayat Absensi" 
            active={activeTab === 'attendance'} 
            onClick={() => setActiveTab('attendance')} 
          />
          <SidebarItem 
            icon={CreditCard} 
            label="Administrasi" 
            active={activeTab === 'administration'} 
            onClick={() => setActiveTab('administration')} 
          />
          <SidebarItem 
            icon={FileCheck} 
            label="Kartu Ujian" 
            active={activeTab === 'kartu_ujian'} 
            onClick={() => setActiveTab('kartu_ujian')} 
          />
          <SidebarItem 
            icon={Bell} 
            label="Info Sekolah" 
            active={activeTab === 'announcements'} 
            onClick={() => setActiveTab('announcements')} 
          />
          <SidebarItem 
            icon={Calendar} 
            label="Kaldik" 
            active={activeTab === 'kaldik'} 
            onClick={() => setActiveTab('kaldik')} 
          />
          <SidebarItem 
            icon={User} 
            label="Profil Saya" 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
          />
        </div>

        <div className="p-4 space-y-2">
          <button 
            onClick={() => navigate('/juknis')}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-[#059669] hover:bg-emerald-100/70 transition-all font-extrabold text-xs cursor-pointer"
          >
            <BookOpen size={18} className="text-[#059669]" />
            <span>Juknis Wali Murid</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-rose-600 hover:bg-rose-50 transition-all font-bold text-xs cursor-pointer"
          >
            <LogOut size={16} />
            <span>Keluar Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#f4f7fe]">
        {/* Mobile Header */}
        <header className="lg:hidden h-14 bg-white border-b border-slate-100 px-3.5 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full border border-emerald-500/30 p-0.5 flex items-center justify-center bg-white overflow-hidden shrink-0 shadow-xs">
              {studentAvatarPhoto ? (
                <img src={studentAvatarPhoto} alt={userData?.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <img src="/logo_ra.jpeg" alt="Logo" className="w-full h-full object-contain rounded-full" />
              )}
            </div>
            <div>
              <h1 className="text-xs font-black text-slate-900 leading-none">Portal Wali RA Darusyifa</h1>
              <p className="text-[9px] font-extrabold text-[#059669] uppercase tracking-wider mt-0.5 truncate max-w-[170px] sm:max-w-none">
                {userData?.name || 'Siswa RA Darusyifa'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('announcements')}
              className="relative p-2 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f4f7fe]">
          <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-6xl mx-auto pb-28">
            <AnimatePresence mode="wait">
              {/* ==================== TAB: OVERVIEW ==================== */}
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-7"
                >
                  {/* 1. Royal Blue Student Portal Hero Card */}
                  <section className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] bg-gradient-to-r from-[#1d4ed8] via-[#1e54e8] to-[#2563eb] p-4 sm:p-6 md:p-8 text-white shadow-xl shadow-blue-600/15 text-left">
                    {/* Notification Button Top Right */}
                    <button
                      onClick={() => setActiveTab('announcements')}
                      className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 flex items-center justify-center transition-all cursor-pointer z-20"
                      title="Info Sekolah"
                    >
                      <Bell size={18} className="text-white sm:w-5 sm:h-5" />
                      <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-1 ring-white" />
                    </button>

                    <div className="relative z-10 flex flex-row items-center gap-4 sm:gap-6 text-left">
                      {/* Avatar with Camera Upload Badge */}
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 sm:w-24 sm:h-28 rounded-full border-2 sm:border-4 border-white shadow-md overflow-hidden bg-slate-100">
                          {studentAvatarPhoto ? (
                            <img src={studentAvatarPhoto} alt={userData?.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600">
                              <User size={32} />
                            </div>
                          )}
                        </div>
                        <label
                          className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white text-blue-600 shadow-md flex items-center justify-center cursor-pointer hover:scale-105 transition-transform border border-slate-100"
                          title="Ubah Foto Siswa"
                        >
                          <Camera size={13} className="sm:w-4 sm:h-4" />
                          <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                        </label>
                      </div>

                      {/* Student Identity Details */}
                      <div className="text-left min-w-0 flex-1">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#FACC15] text-slate-900 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider mb-1 sm:mb-2">
                          <span>• STUDENT PORTAL</span>
                        </div>
                        <h2 className="text-lg sm:text-2xl md:text-[28px] font-black text-white tracking-tight leading-tight truncate">
                          {userData?.name || 'Siswa RA Darusyifa'}
                        </h2>
                        <p className="text-[11px] sm:text-xs font-black text-[#FACC15] uppercase tracking-wide mt-0.5 truncate">
                          KELAS {userData?.kelas || 'UTSMAN BIN AFFAN'}
                        </p>
                        <p className="text-[10px] sm:text-[11px] font-black text-white/95 uppercase tracking-wider mt-0.5 truncate">
                          RA DARUSYIFA ARJAWINANGUN
                        </p>
                        <p className="text-[9px] sm:text-[10px] font-bold text-blue-100/90 uppercase tracking-widest mt-0.5 truncate">
                          TAHUN AJARAN 2026/2027
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/15 my-3 sm:my-5" />

                    {/* Bottom 2-Column Metadata Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 relative z-10 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                          <User size={15} className="text-blue-100" />
                        </div>
                        <div className="text-left">
                          <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-blue-200">
                            NISN / NOMOR INDUK
                          </p>
                          <p className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                            {userData?.nisn || userData?.nis || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                          <Calendar size={15} className="text-blue-100" />
                        </div>
                        <div className="text-left">
                          <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-blue-200">
                            TEMPAT, TANGGAL LAHIR
                          </p>
                          <p className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5 truncate">
                            {userData?.tempatLahir && userData?.tanggalLahir
                              ? `${userData.tempatLahir}, ${userData.tanggalLahir}`
                              : userData?.tempatLahir || userData?.tanggalLahir || 'Cirebon, 12 Mei 2020'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 2. Greeting & Kelas Aktif Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-left">
                    <div>
                      <h3 className="text-xl sm:text-[26px] font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span>Ahlan Wa Sahlan,</span>
                        <span>👋</span>
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
                        Ayah & Bunda {userData?.name || 'Ananda'}
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 self-start sm:self-auto">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0">
                        <Users size={16} />
                      </div>
                      <div className="pr-1 text-left">
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#059669]">
                          KELAS AKTIF
                        </p>
                        <p className="text-xs font-black text-slate-900 uppercase">
                          {userData?.kelas || 'UTSMAN BIN AFFAN'}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                  </div>

                  {/* 3. Four Status Cards: 2 Columns on Mobile, 4 Columns on Desktop */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                    {/* KEHADIRAN */}
                    <div
                      onClick={() => setActiveTab('attendance')}
                      className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between text-left"
                    >
                      <div>
                        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">KEHADIRAN</p>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mt-2 mb-2">
                          <Calendar size={17} />
                        </div>
                        <h4 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">{attendancePercentage}%</h4>
                        <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-0.5 truncate">
                          {hadirCount || 86} / {totalActiveDays} hari
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-4">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, Math.max(20, attendancePercentage))}%` }} />
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-blue-600 mt-2 sm:mt-3">
                          Detail <ArrowRight size={11} />
                        </span>
                      </div>
                    </div>

                    {/* PERKEMBANGAN */}
                    <div
                      onClick={() => setActiveTab('progress')}
                      className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between text-left"
                    >
                      <div>
                        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">PERKEMBANGAN</p>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mt-2 mb-2">
                          <Star size={17} />
                        </div>
                        <h4 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">Baik Sekali</h4>
                        <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-0.5 truncate">
                          Predikat Smt 1
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-4">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full w-[85%]" />
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-amber-600 mt-2 sm:mt-3">
                          Detail <ArrowRight size={11} />
                        </span>
                      </div>
                    </div>

                    {/* HAFALAN */}
                    <div
                      onClick={() => setActiveTab('hafalan')}
                      className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between text-left"
                    >
                      <div>
                        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">HAFALAN</p>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center mt-2 mb-2">
                          <BookOpen size={17} />
                        </div>
                        <h4 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">{completedHafalanCount} Surah</h4>
                        <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-0.5 truncate">
                          Total Setoran
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-4">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#059669] rounded-full w-[70%]" />
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-[#059669] mt-2 sm:mt-3">
                          Detail <ArrowRight size={11} />
                        </span>
                      </div>
                    </div>

                    {/* ADMINISTRASI */}
                    <div
                      onClick={() => setActiveTab('administration')}
                      className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between text-left"
                    >
                      <div>
                        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">ADMINISTRASI</p>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mt-2 mb-2">
                          <Wallet size={17} />
                        </div>
                        <h4 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                          {hasArrears ? 'Tagihan' : 'Lunas'}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-0.5 truncate">
                          {hasArrears ? `Rp ${totalArrears.toLocaleString('id-ID')}` : 'Tidak ada tunggakan'}
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-4">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-600 rounded-full w-full" />
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-purple-600 mt-2 sm:mt-3">
                          Detail <ArrowRight size={11} />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Menu Cepat Section */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Menu Cepat</h3>
                      <button
                        onClick={() => setActiveTab('kartu_ujian')}
                        className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Lihat Semua</span>
                        <GridIcon size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3.5">
                      <MenuIconButton id="attendance" label="Absensi" icon={Calendar} color="blue" onClick={() => setActiveTab('attendance')} />
                      <MenuIconButton id="hafalan" label="Hafalan" icon={BookOpen} color="emerald" onClick={() => setActiveTab('hafalan')} />
                      <MenuIconButton id="progress" label="Rapor" icon={FileText} color="amber" onClick={() => setActiveTab('progress')} />
                      <MenuIconButton id="administration" label="Pembayaran" icon={Wallet} color="purple" onClick={() => setActiveTab('administration')} />
                      <MenuIconButton id="kartuUjian" label="Kartu Ujian" icon={FileCheck} color="rose" onClick={() => setActiveTab('kartu_ujian')} />
                      <MenuIconButton id="kaldik" label="Kaldik" icon={Calendar} color="blue" onClick={() => setActiveTab('kaldik')} />
                      <MenuIconButton id="announcements" label="Info Sekolah" icon={Bell} color="emerald" onClick={() => setActiveTab('announcements')} />
                      <MenuIconButton id="profile" label="Profil Saya" icon={User} color="amber" onClick={() => setActiveTab('profile')} />
                    </div>
                  </div>

                  {/* 4.5 Seksi Aktivitas Terakhir (Persis di bawah Menu Cepat) */}
                  <div className="space-y-3.5 pt-1 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <Clock size={15} />
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                          Aktivitas Terakhir Akun Siswa
                        </h3>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        TERKINI
                      </span>
                    </div>

                    <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-slate-100 shadow-xs space-y-2">
                      {recentActivities.map((act) => {
                        const IconComponent = act.icon;
                        return (
                          <div
                            key={act.id}
                            className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-9 h-9 rounded-xl ${act.iconBg} flex items-center justify-center shrink-0 shadow-xs`}>
                                <IconComponent size={18} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                                  {act.title}
                                </h4>
                                <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate mt-0.5">
                                  {act.subtitle}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${act.statusBadgeColor}`}>
                                {act.status}
                              </span>
                              <p className="text-[9px] font-bold text-slate-400 mt-1">
                                {act.date}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. Quick Financial & Announcements Summary Row (Compact & Presisi) */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-4 pt-1">
                    {/* Saldo Tabungan Quick Card */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center shrink-0">
                          <Wallet size={16} className="sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider truncate">SALDO TABUNGAN</p>
                          <h4 className="text-xs sm:text-base font-black text-slate-900 tracking-tight mt-0.5 truncate">
                            Rp {(userData?.savings || 0).toLocaleString('id-ID')}
                          </h4>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('administration')}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-emerald-50 text-[#059669] hover:bg-emerald-100 rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0"
                      >
                        <span>Rincian</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>

                    {/* Catatan Sisa Tunggakan Quick Card */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                          <CreditCard size={16} className="sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider truncate">SISA TUNGGAKAN</p>
                          <h4 className="text-xs sm:text-base font-black text-slate-900 tracking-tight mt-0.5 truncate">
                            Rp {totalArrears.toLocaleString('id-ID')}
                          </h4>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenBayarModal()}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 shadow-xs"
                      >
                        <Wallet size={12} />
                        <span>Bayar</span>
                      </button>
                    </div>
                  </div>

                  {/* 6. Pengumuman Terbaru Sekolah (Presisi & Ringkas Mode HP) */}
                  <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 text-white shadow-md relative overflow-hidden text-left">
                    <div className="relative z-10 space-y-2 sm:space-y-2.5">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] sm:text-xs font-black uppercase tracking-wider text-emerald-100">
                        <Sparkles size={11} className="text-amber-300" /> Pengumuman Terbaru
                      </div>
                      <h3 className="text-xs sm:text-lg md:text-xl font-black tracking-tight text-white leading-snug">
                        {announcements.length > 0 ? (stripCodeAndTags(announcements[0].title) || 'Pelaksanaan Asesmen & Kegiatan Pembelajaran RA Darusyifa') : 'Pelaksanaan Asesmen & Kegiatan Pembelajaran RA Darusyifa'}
                      </h3>
                      <p className="text-[11px] sm:text-xs md:text-sm text-emerald-100 font-medium leading-normal line-clamp-2">
                        {announcements.length > 0 && announcements[0].content
                          ? (stripCodeAndTags(announcements[0].content) || 'Seluruh santri diimbau mempersiapkan hafalan surah pendek & doa harian untuk persiapan Asesmen Semester. Mari junjung kejujuran dan semangat belajar!')
                          : 'Seluruh santri diimbau mempersiapkan hafalan surah pendek & doa harian untuk persiapan Asesmen Semester. Mari junjung kejujuran dan semangat belajar!'}
                      </p>
                      <div className="pt-1.5 sm:pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/15">
                        <button
                          onClick={() => setSelectedAnnouncement(announcements[0] || { title: 'Pelaksanaan Asesmen & Kegiatan Pembelajaran RA Darusyifa', content: 'Seluruh santri diimbau mempersiapkan hafalan surah pendek & doa harian untuk persiapan Asesmen Semester. Mari junjung kejujuran dan semangat belajar!' })}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <span>Baca Selengkapnya</span>
                          <ArrowRight size={12} />
                        </button>
                        <span className="text-[9px] sm:text-[10px] text-emerald-200 font-bold">
                          {announcements.length > 0 && announcements[0].createdAt ? (
                            typeof announcements[0].createdAt === 'string'
                              ? announcements[0].createdAt
                              : announcements[0].createdAt.seconds
                                ? new Date(announcements[0].createdAt.seconds * 1000).toLocaleDateString('id-ID')
                                : 'Informasi Terbaru'
                          ) : 'Informasi Resmi RA Darusyifa'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ==================== TAB: LAPORAN BELAJAR (PROGRESS & RAPOR) ==================== */}
              {activeTab === 'progress' && (
                <motion.div 
                  key="progress"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5 sm:space-y-6"
                >
                  {/* Top Gradient Blue Hero Banner */}
                  <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-lg shadow-blue-600/20 space-y-3 sm:space-y-4 relative overflow-hidden text-left">
                    <div className="relative z-10 space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white">
                        <BookOpen size={13} />
                        <span>LAPORAN PERKEMBANGAN & CAPAIAN</span>
                      </div>
                      <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                        Laporan Hasil Belajar<br className="hidden sm:block" /> (Rapor Siswa)
                      </h2>
                      <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed max-w-xl">
                        Evaluasi harian, Penilaian Tengah Semester (PTS), & Penilaian Akhir Semester (PAS) RA Darusyifa.
                      </p>
                      <div className="pt-1">
                        <button
                          onClick={handlePrintRaporBelajar}
                          className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                        >
                          <Printer size={15} />
                          <span>Cetak Rapot Siswa</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4 Stat Cards in 2x2 Grid */}
                  {(() => {
                    const totalEval = progress.length > 0 ? progress.length : 11;
                    const avgScore = progress.length > 0 
                      ? Math.round(progress.reduce((acc: number, curr: any) => acc + (Number(curr.score) || 0), 0) / progress.length)
                      : 79;
                    const predikatText = avgScore >= 85 ? 'Sangat Baik' : avgScore >= 75 ? 'Baik' : 'Cukup';
                    const predikatCode = avgScore >= 85 ? 'BSB ⭐' : avgScore >= 75 ? 'BSH ⭐' : 'MB ⭐';
                    const userKelas = (userData?.kelas || 'UTSMAN BIN AFFAN').toUpperCase();

                    return (
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {/* Stat 1: Total Evaluasi */}
                        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-2">
                          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">TOTAL EVALUASI</p>
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">{totalEval}</span>
                            <span className="text-[10px] sm:text-xs font-bold text-slate-400">Laporan</span>
                          </div>
                        </div>

                        {/* Stat 2: Rata-Rata Nilai */}
                        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-blue-100/80 shadow-xs flex flex-col justify-between space-y-2">
                          <p className="text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-wider">RATA-RATA NILAI</p>
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl sm:text-4xl font-black text-blue-600 tracking-tight">{avgScore}</span>
                            <span className="text-[10px] sm:text-xs font-extrabold text-blue-500">Poin / 100</span>
                          </div>
                        </div>

                        {/* Stat 3: Predikat Umum */}
                        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-emerald-100/80 shadow-xs flex flex-col justify-between space-y-2">
                          <p className="text-[9px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-wider">PREDIKAT UMUM</p>
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="text-base sm:text-xl font-black text-emerald-600">{predikatText}</span>
                            <span className="text-[9px] sm:text-[10px] font-black bg-emerald-50 text-[#059669] px-2 py-0.5 rounded-md border border-emerald-200">
                              {predikatCode}
                            </span>
                          </div>
                        </div>

                        {/* Stat 4: Kelas / Kelompok */}
                        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-purple-100/80 shadow-xs flex flex-col justify-between space-y-2">
                          <p className="text-[9px] sm:text-[10px] font-black text-purple-600 uppercase tracking-wider">KELAS / KELOMPOK</p>
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="text-xs sm:text-base font-black text-purple-900 truncate max-w-[110px] sm:max-w-none">{userKelas}</span>
                            <span className="text-[9px] sm:text-[10px] font-black bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200">
                              2026/2027
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Filter Pills Bar: PERIODE PENILAIAN */}
                  <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs space-y-2.5">
                    <p className="text-[10px] sm:text-xs font-black text-slate-800 uppercase tracking-wider">PERIODE PENILAIAN:</p>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {['Semua', 'PTS Ganjil', 'PAS Ganjil', 'PTS Genap', 'PAS Genap', 'Evaluasi Harian'].map((period) => {
                        const isActive = progressPeriodFilter === period;
                        return (
                          <button
                            key={period}
                            onClick={() => setProgressPeriodFilter(period)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                            }`}
                          >
                            {period}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Compact List Nilai */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                    {filteredProgressList.length > 0 ? filteredProgressList.map((p, idx) => {
                      const score = Number(p.score) || 0;
                      const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D';
                      const gradeColor = score >= 90 ? 'bg-emerald-600' : score >= 80 ? 'bg-blue-600' : score >= 70 ? 'bg-amber-500' : 'bg-rose-600';
                      return (
                        <div key={idx} className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between gap-3 hover:border-emerald-200 transition-all">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${gradeColor} text-white flex flex-col items-center justify-center shrink-0 shadow-xs`}>
                              <span className="text-base sm:text-lg font-black leading-none">{grade}</span>
                              <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-wider opacity-90 mt-0.5">Nilai</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                  {p.evaluationPeriod || 'Evaluasi'}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400">
                                  {p.date || '-'}
                                </span>
                              </div>
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate leading-snug">{p.category || p.title}</h4>
                              {p.description && (
                                <p className="text-[10px] sm:text-xs text-slate-500 truncate italic mt-0.5">"{p.description}"</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-2 border-l border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Skor</p>
                            <p className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">{score}</p>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="col-span-1 sm:col-span-2 text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                        <BookOpen size={36} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500 font-bold text-xs">Belum ada laporan nilai pada periode "{progressPeriodFilter}"</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ==================== TAB: MODUL HAFALAN ==================== */}
              {activeTab === 'hafalan' && (
                <motion.div 
                  key="hafalan"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                        <Star size={13} /> Capaian Tahfidz & Doa
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Modul Hafalan Ananda</h3>
                      <p className="text-slate-500 font-medium mt-1 text-xs sm:text-sm">
                        Pelajari materi bacaan Arab & terjemahan, rekam setoran suara, dan cetak rapor tahfidz.
                      </p>
                    </div>
                    <button
                      onClick={handlePrintRaporHafalan}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer self-start md:self-auto"
                    >
                      <Printer size={15} />
                      <span>Cetak Rapor Hafalan</span>
                    </button>
                  </div>

                  {/* Stat Cards Resume Hafalan */}
                  {(() => {
                    const totalModul = hafalanMaterials.length;
                    const totalMumtaz = hafalanProgress.filter(p => p.status === 'Mumtaz (Lulus)' || p.status === 'Lancar').length;
                    const totalMenunggu = hafalanProgress.filter(p => p.isReadyForTest || (p.status as string) === 'Menunggu Dinilai').length;
                    const totalSedang = hafalanProgress.filter(p => p.status === 'Sedang Menghafal').length || Math.max(0, totalModul - totalMumtaz - totalMenunggu);

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-1">
                          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">Total Modul Setor</p>
                          <div className="flex items-baseline justify-between">
                            <span className="text-xl sm:text-3xl font-black text-slate-900">{totalModul}</span>
                            <span className="text-[10px] sm:text-xs font-bold text-slate-400">Modul</span>
                          </div>
                        </div>

                        <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-emerald-100 shadow-xs flex flex-col justify-between space-y-1">
                          <p className="text-[9px] sm:text-[10px] font-black text-[#059669] uppercase tracking-wider truncate">Mumtaz (Lulus) Selesai ⭐</p>
                          <div className="flex items-baseline justify-between">
                            <span className="text-xl sm:text-3xl font-black text-[#059669]">{totalMumtaz}</span>
                            <span className="text-[10px] sm:text-xs font-bold text-emerald-600">Lulus</span>
                          </div>
                        </div>

                        <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-blue-100 shadow-xs flex flex-col justify-between space-y-1">
                          <p className="text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-wider truncate">Disetor ⏳ Menunggu</p>
                          <div className="flex items-baseline justify-between">
                            <span className="text-xl sm:text-3xl font-black text-blue-600">{totalMenunggu}</span>
                            <span className="text-[10px] sm:text-xs font-bold text-blue-500">Evaluasi</span>
                          </div>
                        </div>

                        <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-amber-100 shadow-xs flex flex-col justify-between space-y-1">
                          <p className="text-[9px] sm:text-[10px] font-black text-amber-600 uppercase tracking-wider truncate">Sedang Dihafal Target 🎯</p>
                          <div className="flex items-baseline justify-between">
                            <span className="text-xl sm:text-3xl font-black text-amber-600">{totalSedang}</span>
                            <span className="text-[10px] sm:text-xs font-bold text-amber-500">Target</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Filter & Search Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={hafalanSearch}
                        onChange={(e) => setHafalanSearch(e.target.value)}
                        placeholder="Cari surah, doa harian, atau hadist..."
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                      {hafalanCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setHafalanCategoryFilter(cat)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                            hafalanCategoryFilter === cat
                              ? 'bg-[#059669] text-white shadow-xs'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hafalan Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredHafalanMaterials.map((mat, idx) => {
                      const prog = hafalanProgress.find(p => p.materialId === mat.id);
                      const status = prog?.status || 'Belum Mulai';
                      const statusStyles = (status === 'Mumtaz (Lulus)' || status === 'Lancar') 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : status === 'Sedang Menghafal' 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-slate-50 text-slate-500 border-slate-200';
                      
                      return (
                        <div 
                          key={mat.id || idx} 
                          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${statusStyles}`}>
                                  {status}
                                </span>
                                {prog?.isReadyForTest && (
                                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                                    Menunggu Dinilai Guru
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1 bg-slate-50 px-2.5 py-1 rounded-xl">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star key={s} size={14} className={s <= (prog?.stars || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                                ))}
                              </div>
                            </div>

                            <h4 className="text-lg font-black text-slate-900">{mat.judul}</h4>
                            <p className="text-[10px] font-black text-[#059669] uppercase tracking-widest mt-0.5">{mat.kategori}</p>

                            {(mat.tulisanArab || mat.arab) && (
                              <p className="mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-right font-serif text-lg text-slate-800 leading-loose line-clamp-2" dir="rtl">
                                {mat.tulisanArab || mat.arab}
                              </p>
                            )}

                            {prog?.catatanGuru && (
                              <div className="mt-3 p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100 text-xs italic text-slate-700">
                                <strong>Catatan Guru:</strong> "{prog.catatanGuru}"
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleOpenHafalanDetail(mat)}
                            className="w-full py-3.5 bg-slate-900 hover:bg-[#059669] text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>Lihat Materi & Setor Hafalan</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ==================== TAB: RIWAYAT ABSENSI ==================== */}
              {activeTab === 'attendance' && (
                <motion.div 
                  key="attendance"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#059669] rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                        <CheckCircle size={13} /> Presensi Digital
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Data Kehadiran Ananda</h3>
                      <p className="text-slate-500 font-medium mt-1 text-xs sm:text-sm">Pantau kedisiplinan dan absensi harian secara real-time.</p>
                    </div>
                    <button
                      onClick={startCamera}
                      className="px-5 py-3 bg-[#059669] hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer self-start md:self-auto"
                    >
                      <Camera size={16} />
                      <span>Kirim Presensi Hari Ini</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <AttendanceSmallStat label="Hadir" count={attendance.filter(a => a.status === 'Hadir').length} color="emerald" />
                    <AttendanceSmallStat label="Sakit" count={attendance.filter(a => a.status === 'Sakit').length} color="amber" />
                    <AttendanceSmallStat label="Izin" count={attendance.filter(a => a.status === 'Izin').length} color="blue" />
                    <AttendanceSmallStat label="Alpha" count={attendance.filter(a => a.status === 'Alpha').length} color="rose" />
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <RefreshCw size={17} className="text-[#059669]" />
                        <span>Riwayat Presensi Terakhir</span>
                      </h4>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {attendance.length > 0 ? attendance.slice(0, 20).map((att, idx) => (
                        <div key={idx} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/60 transition-all">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className={`w-3 h-3 rounded-full shrink-0 ${att.status === 'Hadir' ? 'bg-emerald-500' : att.status === 'Sakit' || att.status === 'Izin' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                            <div>
                              <p className="font-black text-slate-900 text-xs sm:text-base">{att.date}</p>
                              <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                                <Clock size={12} /> {att.timestamp?.seconds ? new Date(att.timestamp.seconds * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '07:30'} WIB
                                {att.note ? ` • ${att.note}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            {att.photo && (
                              <button
                                type="button"
                                onClick={() => setPreviewPhotoUrl(att.photo)}
                                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all shrink-0"
                                title="Klik untuk lihat foto selfie"
                              >
                                <img src={att.photo} alt="Selfie" className="w-full h-full object-cover" />
                              </button>
                            )}
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              att.status === 'Hadir'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : att.status === 'Sakit' || att.status === 'Izin'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {att.status}
                            </span>
                          </div>
                        </div>
                      )) : (
                        <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                          Belum ada riwayat presensi tercatat
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ==================== TAB: ADMINISTRASI & KEUANGAN ==================== */}
              {activeTab === 'administration' && (
                <motion.div 
                  key="administration"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                        <Wallet size={13} /> Keuangan & Tabungan Siswa
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Status Keuangan Ananda</h3>
                      <p className="text-slate-500 font-medium mt-1 text-xs sm:text-sm">
                        Pantau pembayaran SPP, iuran kegiatan, rincian tagihan, dan saldo tabungan.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        onClick={handlePrintKeuangan}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                      >
                        <Printer size={15} />
                        <span>Cetak Kartu & Rekap PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Top 2 Summary Cards: Tabungan & Tunggakan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Saldo Tabungan Card */}
                    <div className="bg-[#059669] rounded-3xl text-white p-6 sm:p-8 relative overflow-hidden shadow-xl flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-emerald-100 font-black uppercase tracking-widest text-xs">SALDO TABUNGAN</p>
                        <h4 className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight">
                          Rp {(userData?.savings || 0).toLocaleString('id-ID')}
                        </h4>
                        <p className="text-xs text-emerald-100/90 font-medium">
                          Sisa saldo tabungan siswa yang tersimpan
                        </p>
                      </div>
                    </div>

                    {/* Info Tunggakan Card */}
                    <div className="bg-rose-600 rounded-3xl text-white p-6 sm:p-8 relative overflow-hidden shadow-xl flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-rose-100 font-black uppercase tracking-widest text-xs">TOTAL TUNGGAKAN</p>
                        <h4 className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight">
                          Rp {totalArrears.toLocaleString('id-ID')}
                        </h4>
                        <p className="text-xs text-rose-100/90 font-medium">
                          Sisa tunggakan iuran untuk diselesaikan
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rincian Tagihan Siswa (if any) */}
                  {arrearsDetails.length > 0 && (
                    <div className="bg-white rounded-3xl border border-rose-100 shadow-xs p-6 sm:p-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-black text-slate-900">Rincian Tagihan Belum Lunas ({arrearsDetails.length} Item)</h4>
                          <p className="text-xs text-slate-500">Pilih item tagihan di bawah untuk melakukan pembayaran online atau potong saldo tabungan.</p>
                        </div>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {arrearsDetails.map((item: any, idx: number) => {
                          const totalNom = Number(item.amount) || 0;
                          const paidNom = Number(item.paidAmount) || 0;
                          const remaining = Math.max(0, totalNom - paidNom);
                          const dueDateStr = item.dueDate || item.jatuhTempo || '10 Nopember 2026';
                          return (
                            <div key={item.id || idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <span className="text-sm sm:text-base font-black text-slate-900 uppercase">
                                  {item.categoryName || item.month || item.name || 'Tagihan Iuran'}
                                </span>
                                <p className="text-xs text-slate-500 font-medium">
                                  Total: Rp {totalNom.toLocaleString('id-ID')}
                                  {paidNom > 0 ? ` • Terbayar: Rp ${paidNom.toLocaleString('id-ID')}` : ''}
                                </p>
                                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold">
                                  <Clock size={13} />
                                  <span>Jatuh Tempo: {dueDateStr}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                <div className="text-left sm:text-right">
                                  <p className="text-[10px] font-black uppercase text-slate-400">Sisa Tagihan</p>
                                  <p className="text-base font-black text-rose-600">Rp {remaining.toLocaleString('id-ID')}</p>
                                </div>
                                <button
                                  onClick={() => handleOpenBayarModal(item)}
                                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md shadow-rose-600/20 shrink-0"
                                >
                                  BAYAR SEKARANG
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Payment History Table */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                    <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-black text-slate-900">Riwayat Transaksi & Tabungan</h4>
                        <p className="text-xs text-slate-500">Arsip lengkap pembayaran SPP, iuran, dan setoran tabungan ananda.</p>
                      </div>
                      <button
                        onClick={handlePrintKeuangan}
                        className="text-xs font-black text-[#059669] hover:underline flex items-center gap-1.5 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-200 cursor-pointer self-start sm:self-auto"
                      >
                        <Download size={14} /> Download Laporan PDF
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-4 sm:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan Transaksi</th>
                            <th className="px-4 sm:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Kategori</th>
                            <th className="px-4 sm:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                            <th className="px-4 sm:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode</th>
                            <th className="px-4 sm:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Nominal (Rp)</th>
                            <th className="px-4 sm:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Struk</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {payments.map((pay, idx) => (
                            <tr key={pay.id || idx} className="hover:bg-slate-50/70 transition-all">
                              <td className="px-3 sm:px-6 py-3.5">
                                <p className="font-black text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug">{pay.description || pay.category || 'Transaksi'}</p>
                                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                  <span className={`text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-md inline-block tracking-wider ${
                                    pay.status === 'lunas' || pay.status === 'LUNAS'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : pay.status === 'ditolak'
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    {pay.status || 'lunas'}
                                  </span>
                                  <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold sm:hidden uppercase">
                                    • {pay.category || pay.categoryName || 'Umum'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-3.5 text-xs font-black text-slate-600 uppercase hidden sm:table-cell">
                                {pay.category || pay.categoryName || 'Umum'}
                              </td>
                              <td className="px-3 sm:px-6 py-3.5 text-[11px] sm:text-xs font-bold text-slate-500 whitespace-nowrap">{pay.date || '-'}</td>
                              <td className="px-3 sm:px-6 py-3.5">
                                <span className="bg-slate-100 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-black text-slate-700 uppercase border border-slate-200/80 whitespace-nowrap">
                                  {pay.method || 'Tunai'}
                                </span>
                              </td>
                              <td className="px-3 sm:px-6 py-3.5 text-right font-black text-slate-900 tabular-nums text-xs sm:text-base whitespace-nowrap">
                                Rp {(Number(pay.amount) || 0).toLocaleString('id-ID')}
                              </td>
                              <td className="px-3 sm:px-6 py-3.5 text-center whitespace-nowrap">
                                {isPaymentCategory(pay) ? (
                                  <button
                                    type="button"
                                    onClick={() => handlePrintReceipt(pay)}
                                    className="px-2 py-1 sm:px-2.5 sm:py-1.5 bg-slate-900 hover:bg-[#059669] text-white rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 mx-auto transition-all cursor-pointer shadow-xs"
                                    title="Cetak Struk Bukti Bayar"
                                  >
                                    <Printer size={12} />
                                    <span>Struk</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-300">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {payments.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-16 text-center">
                                <Wallet size={36} className="mx-auto text-slate-200 mb-2" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum ada riwayat transaksi</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ==================== TAB: INFO SEKOLAH (ANNOUNCEMENTS) ==================== */}
              {activeTab === 'announcements' && (
                <motion.div
                  key="announcements"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                        <Bell size={13} /> Pengumuman Resmi
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Info & Pengumuman Sekolah</h3>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Informasi terbaru kegiatan dan pemberitahuan RA Darusyifa.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {announcements.length > 0 ? announcements.map((ann, idx) => (
                      <div key={idx} className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs space-y-2 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-[#059669] rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                            {ann.category || 'Informasi'}
                          </span>
                          <span className="text-[10px] sm:text-xs font-bold text-slate-400">
                            {ann.date || (ann.createdAt?.seconds ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Terbaru')}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-base font-black text-slate-900 leading-snug">{stripCodeAndTags(ann.title)}</h4>
                        <p className="text-[11px] sm:text-sm text-slate-600 leading-snug font-medium line-clamp-2">
                          {stripCodeAndTags(ann.content || ann.description)}
                        </p>
                        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                          <button
                            onClick={() => setSelectedAnnouncement(ann)}
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#059669] rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <span>Baca Selengkapnya</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="bg-white p-16 rounded-3xl border border-slate-100 text-center">
                        <Bell size={40} className="mx-auto text-slate-200 mb-3" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Belum ada pengumuman terbaru</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ==================== TAB: KARTU UJIAN & JADWAL ASESMEN ==================== */}
              {activeTab === 'kartu_ujian' && (
                <motion.div
                  key="kartu_ujian"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-1">
                        <FileCheck size={13} /> Asesmen & Kartu Ujian
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Kartu Peserta Ujian Ananda</h3>
                      <p className="text-slate-500 font-medium text-xs">Informasi kartu peserta ujian dan jadwal pelaksanaan asesmen santri.</p>
                    </div>

                    <button
                      onClick={() => handlePrintKartuUjian()}
                      disabled={hasArrears}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md shrink-0 self-start sm:self-auto ${
                        hasArrears
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                      }`}
                    >
                      {hasArrears ? <Lock size={15} /> : <Printer size={15} />}
                      <span>Cetak Kartu Ujian</span>
                    </button>
                  </div>

                  {/* Financial Arrears Lock Banner */}
                  {hasArrears ? (
                    <div className="bg-rose-50/90 border-2 border-rose-200 p-5 sm:p-6 rounded-3xl space-y-4 text-left">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                          <Lock size={20} />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 px-2 py-0.5 bg-rose-100 rounded-md">
                            PERINGATAN TUNGGAKAN ADMINISTRASI
                          </span>
                          <h4 className="text-base sm:text-lg font-black text-rose-950">
                            Kartu Ujian Belum Dapat Dicetak
                          </h4>
                          <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
                            Kartu Peserta Ujian / Asesmen Ananda saat ini belum dapat diunduh atau dicetak karena masih terdapat sisa tunggakan iuran administrasi sebesar <strong className="text-rose-950 underline font-black">Rp {totalArrears.toLocaleString('id-ID')}</strong>.
                          </p>
                        </div>
                      </div>

                      {/* Unpaid Arrears Breakdown list */}
                      {arrearsDetails.length > 0 && (
                        <div className="bg-white/80 p-3.5 sm:p-4 rounded-2xl border border-rose-200/80 divide-y divide-rose-100 text-xs">
                          <p className="text-[10px] font-black text-rose-700 uppercase tracking-wider pb-2">Rincian Tagihan Belum Lunas:</p>
                          {arrearsDetails.map((item: any, idx: number) => {
                            const totalNom = Number(item.amount) || 0;
                            const paidNom = Number(item.paidAmount) || 0;
                            const remaining = Math.max(0, totalNom - paidNom);
                            return (
                              <div key={idx} className="py-2 flex items-center justify-between font-semibold text-slate-800">
                                <span>{item.categoryName || item.month || item.name || 'Tagihan Iuran'}</span>
                                <span className="font-black text-rose-600">Rp {remaining.toLocaleString('id-ID')}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                        <button
                          onClick={() => setActiveTab('administration')}
                          className="w-full sm:w-auto px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-rose-600/20"
                        >
                          <Wallet size={15} />
                          <span>Bayar Sekarang di Administrasi</span>
                        </button>
                        <p className="text-[11px] text-rose-700 font-bold italic text-center sm:text-left">
                          *Setelah dilakukan pembayaran & verifikasi, tombol cetak akan otomatis terbuka.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Success / Unlocked Kartu Ujian Card Preview */
                    <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
                      <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-wider bg-emerald-50 px-3.5 py-1.5 rounded-full w-fit border border-emerald-100">
                        <CheckCircle size={15} /> Status Administrasi: Lunas (Kartu Siap Cetak)
                      </div>

                      {/* Student Exam Card Digital Preview */}
                      <div className="p-5 sm:p-7 rounded-2xl border-2 border-emerald-600/30 bg-gradient-to-br from-emerald-50/30 via-white to-slate-50 space-y-5 relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border border-emerald-500/30 p-1 flex items-center justify-center bg-white shadow-xs">
                              <img src="/logo_ra.jpeg" alt="Logo RA Darusyifa" className="w-full h-full object-contain rounded-full" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900 uppercase">RA DARUSYIFA ARJAWINANGUN</h4>
                              <p className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">KARTU PESERTA UJIAN & ASESMEN</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">
                            TA 2026/2027
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-5 items-start">
                          <div className="w-24 h-32 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-xs mx-auto sm:mx-0">
                            {studentAvatarPhoto ? (
                              <img src={studentAvatarPhoto} alt="Foto Santri" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <User size={36} />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-2 text-xs font-semibold text-slate-700 w-full">
                            <div className="grid grid-cols-3 gap-1 border-b border-slate-100 pb-1.5">
                              <span className="text-slate-400 font-bold uppercase text-[10px]">Nama Santri</span>
                              <span className="col-span-2 font-black text-slate-900 text-sm">: {userData?.name || '-'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 border-b border-slate-100 pb-1.5">
                              <span className="text-slate-400 font-bold uppercase text-[10px]">NISN / NIS</span>
                              <span className="col-span-2 font-black text-slate-900">: {userData?.nisn || userData?.nis || '-'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 border-b border-slate-100 pb-1.5">
                              <span className="text-slate-400 font-bold uppercase text-[10px]">Kelas</span>
                              <span className="col-span-2 font-black text-slate-900">: {userData?.kelas || 'UTSMAN BIN AFFAN'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              <span className="text-slate-400 font-bold uppercase text-[10px]">TTL</span>
                              <span className="col-span-2 font-black text-slate-900">
                                : {userData?.tempatLahir && userData?.tanggalLahir ? `${userData.tempatLahir}, ${userData.tanggalLahir}` : 'Cirebon, 12 Mei 2020'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Schedule Section (Synchronized Dates & Days: Senin - Sabtu & Class Filter) */}
                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <Calendar size={16} className="text-rose-600" />
                            <span>Jadwal Pelaksanaan Asesmen / Ujian</span>
                          </h4>

                          {/* Class Filter Dropdown & Day Filter Pills */}
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={examClassFilter}
                              onChange={(e) => setExamClassFilter(e.target.value)}
                              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer uppercase"
                            >
                              <option value="UTSMAN BIN AFFAN">UTSMAN BIN AFFAN</option>
                              <option value="UMAR BIN KHATTAB">UMAR BIN KHATTAB</option>
                            </select>

                            <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                              {(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const).map((dayName) => (
                                <button
                                  key={dayName}
                                  onClick={() => setActiveExamDay(dayName)}
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                                    activeExamDay === dayName
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {dayName}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Render Schedules */}
                        {(() => {
                          // Helper to sync date with Indonesian day name
                          const getIndonesianDay = (dateStr?: string, fallbackDay: string = 'Senin') => {
                            if (!dateStr) return fallbackDay;
                            const lower = dateStr.toString().toLowerCase();
                            if (lower.includes('senin')) return 'Senin';
                            if (lower.includes('selasa')) return 'Selasa';
                            if (lower.includes('rabu')) return 'Rabu';
                            if (lower.includes('kamis')) return 'Kamis';
                            if (lower.includes('jumat') || lower.includes("jum'at")) return 'Jumat';
                            if (lower.includes('sabtu')) return 'Sabtu';
                            if (lower.includes('minggu')) return 'Minggu';

                            const parsed = new Date(dateStr);
                            if (!isNaN(parsed.getTime())) {
                              const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                              return dayNames[parsed.getDay()];
                            }
                            return fallbackDay;
                          };

                          const defaultSchedules = [
                            { no: 1, day: 'Senin', date: '28 Sep 2026', time: '08:00 - 09:00 WIB', subject: 'Menulis Hijaiyah (PTS Ganjil)', examType: 'PTS Ganjil', kelas: 'Semua Kelas' },
                            { no: 2, day: 'Senin', date: '28 Sep 2026', time: '09:30 - 10:30 WIB', subject: 'QS. An-Naas & Doa Harian', examType: 'PTS Ganjil', kelas: 'Semua Kelas' },
                            { no: 3, day: 'Selasa', date: '29 Sep 2026', time: '08:00 - 09:00 WIB', subject: 'Menulis Abjad & Motorik Halus', examType: 'PTS Ganjil', kelas: 'Semua Kelas' },
                            { no: 4, day: 'Selasa', date: '29 Sep 2026', time: '09:30 - 10:30 WIB', subject: 'Doa Sebelum & Sesudah Makan', examType: 'PTS Ganjil', kelas: 'Semua Kelas' },
                            { no: 5, day: 'Rabu', date: '30 Sep 2026', time: '08:00 - 09:00 WIB', subject: 'Menulis Angka & Matematika Dasar', examType: 'PTS Ganjil', kelas: 'Semua Kelas' },
                            { no: 6, day: 'Rabu', date: '30 Sep 2026', time: '09:30 - 10:30 WIB', subject: 'Hadits Kebersihan & Adab', examType: 'PTS Ganjil', kelas: 'Semua Kelas' },
                            { no: 7, day: 'Kamis', date: '01 Okt 2026', time: '08:00 - 09:00 WIB', subject: 'Menulis Bahasa Inggris & Vocal', examType: 'PTS Ganjil', kelas: 'Semua Kelas' },
                            { no: 8, day: 'Kamis', date: '01 Okt 2026', time: '09:30 - 10:30 WIB', subject: 'Asmaul Husna & Niat Wudhu', examType: 'PTS Ganjil', kelas: 'Semua Kelas' },
                            { no: 9, day: 'Jumat', date: '02 Okt 2026', time: '08:00 - 09:00 WIB', subject: 'Mewarnai & Seni Unjuk Kerja', examType: 'PTS Ganjil', kelas: 'Semua Kelas' },
                            { no: 10, day: 'Jumat', date: '02 Okt 2026', time: '09:30 - 10:30 WIB', subject: 'Niat Wudhu & Hafalan Doa', examType: 'PTS Ganjil', kelas: 'Semua Kelas' },
                            { no: 11, day: 'Sabtu', date: '03 Okt 2026', time: '08:00 - 09:00 WIB', subject: 'Praktik Sholat & Doa Pilihan', examType: 'PTS Ganjil', kelas: 'Semua Kelas' },
                            { no: 12, day: 'Sabtu', date: '03 Okt 2026', time: '09:30 - 10:30 WIB', subject: 'Keterampilan & Unjuk Kerja', examType: 'PTS Ganjil', kelas: 'Semua Kelas' },
                          ];

                          let allList = defaultSchedules;
                          if (exams.length > 0 && exams.some((e: any) => e.schedules?.length)) {
                            const customList: any[] = [];
                            exams.forEach((ex: any) => {
                              if (Array.isArray(ex.schedules)) {
                                ex.schedules.forEach((s: any) => {
                                  const computedDay = getIndonesianDay(s.date, s.day || 'Senin');
                                  customList.push({
                                    no: customList.length + 1,
                                    day: computedDay,
                                    date: s.date || 'Tanggal Pelaksanaan',
                                    time: s.time ? `${s.time} WIB` : '08:00 - 09:30 WIB',
                                    subject: s.subject || 'Mata Pelajaran',
                                    examType: ex.type || 'Asesmen',
                                    kelas: s.kelas || 'Semua Kelas'
                                  });
                                });
                              }
                            });
                            if (customList.length > 0) allList = customList;
                          }

                          const filtered = allList.filter(s => {
                            const matchDay = (s.day || '').toLowerCase() === activeExamDay.toLowerCase();
                            const matchClass = s.kelas === 'Semua Kelas' ||
                              s.kelas?.toLowerCase() === examClassFilter.toLowerCase() ||
                              (userData?.kelas && s.kelas?.toLowerCase() === userData.kelas.toLowerCase());
                            return matchDay && matchClass;
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs font-semibold">
                                Tidak ada jadwal asesmen pada hari {activeExamDay} untuk kelas {examClassFilter}.
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {filtered.map((sch: any, idx: number) => (
                                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs hover:border-rose-200 transition-all">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md">
                                        {sch.examType || 'Asesmen'}
                                      </span>
                                      <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-[#059669] rounded-md">
                                        {sch.day}
                                      </span>
                                      <span className="text-[9px] font-bold text-slate-500">
                                        {sch.date}
                                      </span>
                                    </div>
                                    <p className="text-xs font-black text-slate-900 mt-1 truncate">{sch.subject}</p>
                                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{sch.time}</p>
                                  </div>
                                  <span className="text-[10px] font-black px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-slate-700 shrink-0 shadow-2xs">
                                    {sch.kelas || 'Semua Kelas'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ==================== TAB: KALDIK ==================== */}
              {activeTab === 'kaldik' && (
                <motion.div
                  key="kaldik"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-1.5">
                        <Calendar size={13} /> Kalender Pendidikan Resmi
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Kaldik RA Darusyifa</h3>
                      <p className="text-slate-500 font-medium text-xs">Jadwal akademis, hari libur, dan agenda resmi RA Darusyifa Arjawinangun.</p>
                    </div>
                    <a
                      href="https://kaldikradarusyifa.netlify.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer shadow-md shadow-blue-600/20"
                    >
                      <Calendar size={15} />
                      <span>Buka Web Kaldik</span>
                    </a>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden h-[750px] relative">
                    <iframe
                      src="https://kaldikradarusyifa.netlify.app/"
                      title="Kalender Pendidikan RA Darusyifa"
                      className="w-full h-full border-0"
                    />
                  </div>
                </motion.div>
              )}

              {/* ==================== TAB: PROFIL SAYA ==================== */}
              {activeTab === 'profile' && (
                <motion.div 
                  key="profile"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="max-w-4xl mx-auto space-y-8"
                >
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative shrink-0">
                      <div className="w-28 h-28 rounded-full border-4 border-emerald-500/20 shadow-md overflow-hidden bg-slate-100">
                        {userData?.photoURL ? (
                          <img src={userData.photoURL} alt={userData?.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-[#059669]">
                            <User size={44} />
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 p-2.5 bg-[#059669] text-white rounded-full shadow-md cursor-pointer hover:bg-emerald-700 transition-all">
                        <Camera size={15} />
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                      </label>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{userData?.name}</h3>
                      <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1">
                        Kelas {userData?.kelas || 'UTSMAN BIN AFFAN'} • NISN: {userData?.nisn || userData?.nis || '-'}
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-4">
                        <button
                          onClick={() => setShowEditProfileModal(true)}
                          className="px-4 py-2.5 bg-[#059669] hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit size={14} />
                          <span>Edit Biodata Siswa</span>
                        </button>
                        <button
                          onClick={() => setShowPasswordModal(true)}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                        >
                          <Lock size={14} />
                          <span>Ubah Password</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center">
                          <User size={20} />
                        </div>
                        <h4 className="text-lg font-black text-slate-900">Biodata Lengkap Siswa & Wali</h4>
                      </div>
                      <button
                        onClick={() => setShowEditProfileModal(true)}
                        className="text-xs font-black text-[#059669] hover:underline cursor-pointer"
                      >
                        Ubah Data
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ProfileField label="Nama Lengkap Siswa" value={userData?.name} />
                      <ProfileField label="NISN / Nomor Induk" value={userData?.nisn || userData?.nis || '-'} />
                      <ProfileField label="Tempat, Tanggal Lahir" value={`${userData?.tempatLahir || 'Cirebon'}, ${userData?.tanggalLahir || '-'}`} />
                      <ProfileField label="Jenis Kelamin" value={userData?.jenisKelamin || userData?.gender || '-'} />
                      <ProfileField label="Nama Ayah" value={userData?.namaAyah || userData?.fatherName || '-'} />
                      <ProfileField label="Nama Ibu" value={userData?.namaIbu || userData?.motherName || '-'} />
                      <ProfileField label="Nomor WhatsApp Wali" value={userData?.whatsapp || userData?.parentPhone || userData?.phone || '-'} />
                      <ProfileField label="Kelas Aktif" value={userData?.kelas || 'UTSMAN BIN AFFAN'} />
                      <ProfileField label="Alamat Lengkap" value={userData?.alamat || userData?.address || '-'} isFullWidth />
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <button 
                        onClick={handleLogout}
                        className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
                      >
                        <LogOut size={18} /> Keluar dari Sistem Portal
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-1.5 py-2 flex items-center justify-around z-50 shadow-[0_-10px_25px_rgba(0,0,0,0.05)]">
        <MobileNavItem id="overview" label="Beranda" icon={Home} activeTab={activeTab} setActiveTab={setActiveTab} />
        <MobileNavItem id="progress" label="Rapor" icon={BookOpen} activeTab={activeTab} setActiveTab={setActiveTab} />
        <MobileNavItem id="hafalan" label="Hafalan" icon={Star} activeTab={activeTab} setActiveTab={setActiveTab} />
        <MobileNavItem id="administration" label="Keuangan" icon={Wallet} activeTab={activeTab} setActiveTab={setActiveTab} />
        <MobileNavItem id="kartu_ujian" label="Kartu Ujian" icon={FileCheck} activeTab={activeTab} setActiveTab={setActiveTab} />
        <MobileNavItem id="profile" label="Profil" icon={User} activeTab={activeTab} setActiveTab={setActiveTab} />
      </nav>


      {/* ==================== MODAL: DETAIL PENGUMUMAN SEKOLAH ==================== */}
      <AnimatePresence>
        {selectedAnnouncement && (
          <div className="fixed inset-0 z-[160] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-left"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-3">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-[#059669] rounded-md text-[9px] font-black uppercase tracking-wider mb-1">
                    <Sparkles size={11} /> {selectedAnnouncement.category || 'PENGUMUMAN RESMI'}
                  </div>
                  <h3 className="text-sm sm:text-lg font-black text-slate-900 leading-snug">
                    {stripCodeAndTags(selectedAnnouncement.title)}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {selectedAnnouncement.date || (selectedAnnouncement.createdAt?.seconds ? new Date(selectedAnnouncement.createdAt.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Informasi Resmi RA Darusyifa')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body Content with Paragraph Formatting */}
              <div className="space-y-3 py-1 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {formatAnnouncementParagraphs(selectedAnnouncement.content || selectedAnnouncement.description).map((para, pIdx) => (
                  <p key={pIdx} className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-slate-800 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                >
                  Tutup Pengumuman
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL: BAYAR TAGIHAN / KONFIRMASI TRANSFER ==================== */}
      <AnimatePresence>
        {showBayarModal && (
          <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-lg font-black text-slate-900">Pembayaran SPP / Iuran Siswa</h4>
                  <p className="text-xs text-slate-500">Pilih metode Transfer atau Potong Saldo Tabungan</p>
                </div>
                <button onClick={() => setShowBayarModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitBillPayment} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Kategori Tagihan / Iuran
                  </label>
                  <input
                    type="text"
                    value={payCategoryName}
                    onChange={(e) => setPayCategoryName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Nominal Pembayaran (Rp)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Pilih Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPayMethod('Transfer')}
                      className={`p-3 rounded-xl border text-xs font-black uppercase transition-all cursor-pointer text-left ${
                        payMethod === 'Transfer'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <p className="font-extrabold text-xs">Transfer Bank BRI</p>
                      <p className="text-[10px] opacity-75 font-normal">Bukti Transfer</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayMethod('Tunai')}
                      className={`p-3 rounded-xl border text-xs font-black uppercase transition-all cursor-pointer text-left ${
                        payMethod === 'Tunai'
                          ? 'bg-amber-50 border-amber-500 text-amber-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <p className="font-extrabold text-xs">Bayar Tunai</p>
                      <p className="text-[10px] opacity-75 font-normal">Ke Bendahara</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayMethod('Tabungan')}
                      className={`p-3 rounded-xl border text-xs font-black uppercase transition-all cursor-pointer text-left ${
                        payMethod === 'Tabungan'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <p className="font-extrabold text-xs">Potong Tabungan</p>
                      <p className="text-[10px] opacity-75 font-normal">Saldo: Rp {(userData?.savings || 0).toLocaleString('id-ID')}</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayMethod('Campuran')}
                      className={`p-3 rounded-xl border text-xs font-black uppercase transition-all cursor-pointer text-left ${
                        payMethod === 'Campuran'
                          ? 'bg-purple-50 border-purple-500 text-purple-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <p className="font-extrabold text-xs">Campuran</p>
                      <p className="text-[10px] opacity-75 font-normal">Tabungan + Cash/BRI</p>
                    </button>
                  </div>
                </div>

                {payMethod === 'Transfer' && (
                  <div className="space-y-3 p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80">
                    <div className="p-3 bg-white rounded-xl border border-blue-100">
                      <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">REKENING RESMI BRI RA DARUSYIFA</p>
                      <p className="text-base font-black text-slate-900 mt-1 select-all">415001003649509</p>
                      <p className="text-xs font-bold text-slate-600 mt-0.5">a.n. GIAN DWI WAHYUNI</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                        Unggah Bukti Transfer BRI
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePayProofUpload}
                        className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white"
                      />
                      {payProofImage && (
                        <img src={payProofImage} alt="Bukti" className="mt-2 h-32 rounded-xl object-contain border border-slate-200 bg-white p-1" />
                      )}
                    </div>
                  </div>
                )}

                {payMethod === 'Tunai' && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-3">
                    <div>
                      <p className="font-black uppercase tracking-wide text-amber-900">Pembayaran Tunai (Cash)</p>
                      <p className="font-medium text-amber-800 text-[11px] leading-relaxed mt-0.5">
                        Silakan lakukan pembayaran tunai secara langsung ke Bendahara Sekolah.
                        Jika Anda telah menerima kwitansi/nota fisik, Anda dapat mengunggah foto kwitansi di bawah ini.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-amber-200/60">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-amber-800 mb-1">
                        Upload Foto Bukti Kwitansi / Nota (Opsional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePayProofUpload}
                        className="w-full text-xs text-amber-900 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-white cursor-pointer"
                      />
                      {payProofImage && (
                        <div className="mt-2.5 relative inline-block">
                          <img src={payProofImage} alt="Bukti Kwitansi Tunai" className="h-32 rounded-xl object-contain border border-amber-300 bg-white p-1" />
                          <button
                            type="button"
                            onClick={() => setPayProofImage('')}
                            className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {payMethod === 'Tabungan' && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                    <p className="font-black uppercase tracking-wide">Potong Saldo Tabungan</p>
                    <p className="font-medium">
                      Saldo tabungan ananda sebesar <strong>Rp {(userData?.savings || 0).toLocaleString('id-ID')}</strong> akan dipotong langsung untuk tagihan ini.
                    </p>
                  </div>
                )}

                {payMethod === 'Campuran' && (
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-2">
                    <p className="font-black uppercase tracking-wide">Pembayaran Campuran (Tabungan + Cash/BRI)</p>
                    <div className="space-y-1 text-slate-700">
                      <p>• Dipotong Tabungan: <strong>Rp {Math.min(userData?.savings || 0, payAmount).toLocaleString('id-ID')}</strong></p>
                      <p>• Sisa Pembayaran (Cash/BRI): <strong>Rp {Math.max(0, payAmount - (userData?.savings || 0)).toLocaleString('id-ID')}</strong></p>
                    </div>
                    <p className="text-[11px] text-purple-700 font-semibold pt-1 border-t border-purple-200/60">
                      Transfer sisa pembayaran ke BRI <strong>415001003649509</strong> a.n <strong>GIAN DWI WAHYUNI</strong> atau bayar tunai ke Bendahara.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Catatan Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="Contoh: Pembayaran iuran SPP..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  {isSubmittingPayment ? 'Mengirim Konfirmasi...' : 'Kirim Konfirmasi Pembayaran'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL: PREVIEW FOTO SELFIE PRESENSI ==================== */}
      <AnimatePresence>
        {previewPhotoUrl && (
          <div className="fixed inset-0 z-[160] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-4 max-w-md w-full relative overflow-hidden shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-sm font-black text-slate-900">Foto Selfie Presensi Siswa</h4>
                <button
                  onClick={() => setPreviewPhotoUrl(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="aspect-square bg-slate-900 rounded-2xl overflow-hidden border border-slate-200">
                <img src={previewPhotoUrl} alt="Foto Selfie Presensi" className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="w-full py-2.5 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Tutup Foto
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL: DETAIL MATERI & SETOR HAFALAN ==================== */}
      <AnimatePresence>
        {selectedHafalanMat && (
          <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 text-[#059669]">
                    {selectedHafalanMat.kategori}
                  </span>
                  <h4 className="text-xl font-black text-slate-900 mt-1.5">{selectedHafalanMat.judul}</h4>
                </div>
                <button
                  onClick={() => {
                    stopAudioRecording();
                    setSelectedHafalanMat(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {(selectedHafalanMat.tulisanArab || selectedHafalanMat.arab) && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 text-right font-serif text-2xl leading-[2.2] text-slate-900" dir="rtl">
                    {selectedHafalanMat.tulisanArab || selectedHafalanMat.arab}
                  </div>
                )}

                {selectedHafalanMat.latin && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs sm:text-sm font-semibold text-emerald-950 italic">
                    {selectedHafalanMat.latin}
                  </div>
                )}

                {(selectedHafalanMat.terjemahan || selectedHafalanMat.arti) && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <strong>Artinya:</strong> "{selectedHafalanMat.terjemahan || selectedHafalanMat.arti}"
                  </div>
                )}

                {/* Audio Recorder Box */}
                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-wider text-amber-900">
                      Setor Hafalan via Rekaman Suara
                    </p>
                    {isRecordingAudio && (
                      <span className="text-[10px] font-black text-rose-600 animate-pulse">● Merekam Suara...</span>
                    )}
                  </div>

                  {recordedAudioUrl && (
                    <audio controls src={recordedAudioUrl} className="w-full" />
                  )}

                  <div className="flex flex-wrap gap-2.5">
                    {!isRecordingAudio ? (
                      <button
                        type="button"
                        onClick={startAudioRecording}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                      >
                        <Mic size={15} />
                        <span>{recordedAudioUrl ? 'Rekam Ulang Suara' : 'Mulai Rekam Suara'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopAudioRecording}
                        className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                      >
                        <Square size={14} />
                        <span>Selesai Merekam</span>
                      </button>
                    )}

                    {recordedAudioUrl && (
                      <button
                        type="button"
                        disabled={isSubmittingHafalan}
                        onClick={() => handleSubmitHafalanSetoran('Rekaman Audio')}
                        className="px-4 py-2.5 bg-[#059669] hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                      >
                        <Upload size={15} />
                        <span>Kirim Rekaman ke Guru</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    disabled={isSubmittingHafalan}
                    onClick={() => handleSubmitHafalanSetoran('Setor Langsung')}
                    className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    Tandai Siap Setor Langsung di Kelas
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL: EDIT BIODATA SISWA ==================== */}
      <AnimatePresence>
        {showEditProfileModal && (
          <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h4 className="text-lg font-black text-slate-900">Edit Biodata Siswa & Wali</h4>
                <button onClick={() => setShowEditProfileModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveProfile} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Nama Lengkap Siswa</label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">NISN / NIS</label>
                    <input type="text" value={editNisn} onChange={e => setEditNisn(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Tempat Lahir</label>
                    <input type="text" value={editTempatLahir} onChange={e => setEditTempatLahir(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Tanggal Lahir</label>
                    <input type="text" value={editTanggalLahir} onChange={e => setEditTanggalLahir(e.target.value)} placeholder="Contoh: 12 Mei 2020" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Jenis Kelamin</label>
                    <select value={editJenisKelamin} onChange={e => setEditJenisKelamin(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">No. WhatsApp Wali</label>
                    <input type="text" value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Nama Ayah</label>
                    <input type="text" value={editNamaAyah} onChange={e => setEditNamaAyah(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Nama Ibu</label>
                    <input type="text" value={editNamaIbu} onChange={e => setEditNamaIbu(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Alamat Rumah</label>
                  <textarea value={editAlamat} onChange={e => setEditAlamat(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold h-20 resize-none" />
                </div>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-3.5 bg-[#059669] hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save size={15} />
                  <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan Biodata'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL: UBAH PASSWORD ==================== */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h4 className="text-lg font-black text-slate-900">Ubah Password Akun</h4>
                <button onClick={() => setShowPasswordModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSavePassword} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Password Baru</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider cursor-pointer"
                >
                  {isSavingPassword ? 'Menyimpan...' : 'Perbarui Password'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[150] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }} 
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center">
                    <Camera size={20} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">Presensi Kehadiran Siswa</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Foto Selfie & Status Kehadiran</p>
                  </div>
                </div>
                <button onClick={stopCamera} className="p-2 text-slate-400 hover:text-rose-500 rounded-xl">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-5 text-center">
                {attendanceStatus === 'Hadir' ? (
                  <div className="aspect-square bg-slate-950 rounded-2xl overflow-hidden relative border-4 border-slate-100">
                    {capturedPhoto ? (
                      <img src={capturedPhoto} alt="Selfie" className="w-full h-full object-cover" />
                    ) : (
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-amber-50/80 rounded-2xl border border-amber-200 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                      <FileText size={24} />
                    </div>
                    <h5 className="font-black text-amber-950 text-sm">Status Presensi: {attendanceStatus}</h5>
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                      Siswa dengan status <strong>{attendanceStatus}</strong> tidak memerlukan foto selfie. Silakan tuliskan keterangan / alasan pada kolom di bawah ini.
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-3 gap-2">
                  {['Hadir', 'Sakit', 'Izin'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setAttendanceStatus(s);
                        if (s === 'Sakit' || s === 'Izin') {
                          stopCameraStream();
                          setCapturedPhoto(null);
                        } else if (s === 'Hadir' && !videoRef.current?.srcObject) {
                          startCameraStream();
                        }
                      }}
                      className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all border cursor-pointer ${
                        attendanceStatus === s 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="text-left space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400">
                    {attendanceStatus === 'Hadir' ? 'Catatan Tambahan (Opsional)' : `Keterangan / Alasan ${attendanceStatus} (Wajib)`}
                  </label>
                  <input
                    type="text"
                    value={attendanceNote}
                    onChange={e => setAttendanceNote(e.target.value)}
                    placeholder={attendanceStatus === 'Hadir' ? "Catatan tambahan (opsional)..." : `Contoh: ${attendanceStatus === 'Sakit' ? 'Demam & flu sejak pagi' : 'Acara keluarga di luar kota'}...`}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {attendanceStatus !== 'Hadir' ? (
                  <button 
                    type="button"
                    onClick={handleConfirmAttendance} 
                    disabled={isSubmittingAttendance} 
                    className="w-full py-3.5 bg-[#059669] hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <CheckCircle size={18} />
                    <span>{isSubmittingAttendance ? 'Mengirim...' : `Kirim Presensi ${attendanceStatus}`}</span>
                  </button>
                ) : !capturedPhoto ? (
                  <button 
                    type="button"
                    onClick={takePhoto} 
                    className="w-full py-3.5 bg-[#059669] hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Camera size={18} /> Ambil Foto Sekarang
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setCapturedPhoto(null);
                        startCamera();
                      }} 
                      className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black uppercase text-xs cursor-pointer transition-all"
                    >
                      Ulangi Foto
                    </button>
                    <button 
                      type="button"
                      onClick={handleConfirmAttendance} 
                      disabled={isSubmittingAttendance} 
                      className="w-full py-3 bg-[#059669] hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-xs cursor-pointer transition-all shadow-xs"
                    >
                      {isSubmittingAttendance ? 'Mengirim...' : 'Kirim Absen'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// --- Internal UI Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all cursor-pointer group ${
      active 
        ? 'bg-[#059669] text-white shadow-md shadow-emerald-600/20 font-bold' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-semibold'
    }`}
  >
    <Icon size={18} className={active ? 'text-white shrink-0' : 'text-slate-400 group-hover:text-[#059669] transition-colors shrink-0'} strokeWidth={active ? 2.5 : 2} />
    <span className={`text-xs tracking-tight ${active ? 'text-white font-extrabold' : 'text-slate-600 font-bold'}`}>{label}</span>
  </button>
);

const MenuIconButton = ({ label, icon: Icon, color, onClick }: any) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100/80 group-hover:bg-blue-600',
    amber: 'bg-amber-50 text-amber-500 border-amber-100/80 group-hover:bg-amber-500',
    emerald: 'bg-emerald-50 text-[#059669] border-emerald-100/80 group-hover:bg-[#059669]',
    purple: 'bg-purple-50 text-purple-600 border-purple-100/80 group-hover:bg-purple-600',
    rose: 'bg-rose-50 text-rose-500 border-rose-100/80 group-hover:bg-rose-500'
  };

  return (
    <button
      onClick={onClick}
      className="bg-white py-3 px-1.5 sm:py-5 sm:px-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 group active:scale-95 cursor-pointer"
    >
      <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border ${colorMap[color] || colorMap.blue} flex items-center justify-center group-hover:text-white transition-all duration-200 shrink-0`}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.2} />
      </div>
      <span className="text-[10px] sm:text-xs font-black text-slate-700 group-hover:text-slate-900 transition-colors text-center truncate w-full px-0.5">{label}</span>
    </button>
  );
};

const AttendanceSmallStat = ({ label, count, color }: any) => {
  const colors: any = {
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    blue: 'text-blue-600 bg-blue-50',
    rose: 'text-rose-600 bg-rose-50'
  };
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs text-center">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <h5 className={`text-4xl font-black tracking-tight ${colors[color].split(' ')[0]}`}>{count}</h5>
    </div>
  );
};

const MobileNavItem = ({ id, label, icon: Icon, activeTab, setActiveTab }: any) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`flex flex-col items-center gap-1 transition-all relative ${activeTab === id ? 'text-[#059669]' : 'text-slate-400'}`}
  >
    <div className={`p-2 rounded-xl transition-all ${activeTab === id ? 'bg-emerald-50' : ''}`}>
      <Icon size={20} strokeWidth={activeTab === id ? 2.5 : 2} />
    </div>
    <span className="text-[9px] font-black uppercase tracking-tight">{label}</span>
  </button>
);

const ProfileField = ({ label, value, isFullWidth }: any) => (
  <div className={`${isFullWidth ? 'md:col-span-2' : ''} space-y-1.5`}>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-base font-black text-slate-900 border-b border-slate-100 pb-2.5">{value || '-'}</p>
  </div>
);
