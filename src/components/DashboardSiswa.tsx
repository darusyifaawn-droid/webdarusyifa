import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  collection, query, where, onSnapshot, addDoc, serverTimestamp, 
  doc, getDoc, updateDoc, orderBy, getDocs, setDoc, limit 
} from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { 
  Camera, CheckCircle, Clock, Calendar, User, LogOut, Bell, 
  CreditCard, BookOpen, Save, X, Menu, Star, Megaphone, 
  AlertCircle, Upload, Image as ImageIcon, FileText, Download, 
  ExternalLink, RefreshCw, Home, Users, HelpCircle, ChevronRight, 
  ChevronDown, Award, Wallet, Grid as GridIcon, ArrowRight, Lock, 
  MessageCircle, ShieldAlert, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { compressImage } from '../lib/imageUtils';
import { getPrintHeaderHTML, getPrintStyles, getPrintSignatureHTML } from '../lib/printUtils';
import { staticHafalanMaterials as initialHafalanMaterials, StudentHafalanProgress } from '../data/hafalanData';
import KaldikCalendar from './KaldikCalendar';
import PiagamModal from './competition/PiagamModal';
import { CompetitionParticipant, CompetitionEvent } from '../types/competition';
import { DEFAULT_FASHION_SHOW_PARTICIPANTS, DEFAULT_FASHION_SHOW_EVENT } from '../data/competitionData';

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
  const [exams, setExams] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [hafalanProgress, setHafalanProgress] = useState<StudentHafalanProgress[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [hafalanMaterials, setHafalanMaterials] = useState<any[]>(initialHafalanMaterials);
  const [materialsData, setMaterialsData] = useState<any[]>([]);
  const [kaldikData, setKaldikData] = useState<any[]>([]);
  const [loading, setLoading] = useState(!authUserData);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPiagamParticipant, setSelectedPiagamParticipant] = useState<CompetitionParticipant | null>(null);
  const [allCompetitionParticipants, setAllCompetitionParticipants] = useState<CompetitionParticipant[]>([]);
  const [competitionEvents, setCompetitionEvents] = useState<CompetitionEvent[]>([]);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [quote, setQuote] = useState('');
  
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Profile Form States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [editTempatLahir, setEditTempatLahir] = useState('');
  const [editTanggalLahir, setEditTanggalLahir] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Attendance States
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('Hadir');
  const [attendanceNote, setAttendanceNote] = useState('');

  // Finance States
  const [activeDetailToPay, setActiveDetailToPay] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Transfer' | 'Tunai' | 'Tabungan' | 'Campuran'>('Transfer');
  const [paymentProof, setPaymentProof] = useState<string>('');
  const [paymentMeetDate, setPaymentMeetDate] = useState('');
  const [mixedSavingsAmount, setMixedSavingsAmount] = useState('');
  const [mixedCashAmount, setMixedCashAmount] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  useEffect(() => {
    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  }, []);

  useEffect(() => {
    if (authUser) setUser(authUser);
    if (authUserData) {
      setUserData(authUserData);
      setEditName(authUserData.name || "");
      setEditPhoto(authUserData.photoURL || "");
      setEditTempatLahir(authUserData.tempatLahir || "");
      setEditTanggalLahir(authUserData.tanggalLahir || "");
      setLoading(false);
    }
  }, [authUser, authUserData]);

  useEffect(() => {
    if (!user) return;

    const unsubAttendance = onSnapshot(
      query(collection(db, 'attendance'), where('studentId', '==', user.uid), orderBy('timestamp', 'desc'), limit(50)),
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
      query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(10)),
      (snapshot) => setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    const unsubPayments = onSnapshot(
      query(collection(db, 'payments'), where('studentId', '==', user.uid), orderBy('date', 'desc')),
      (snapshot) => setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    const unsubSettings = onSnapshot(doc(db, 'settings', 'landingPage'), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    });

    const unsubMaterials = onSnapshot(query(collection(db, 'hafalan_materials'), orderBy('urutan', 'asc')), (snapshot) => {
      setHafalanMaterials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
      unsubMaterials();
      unsubExams();
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

  const startCamera = async () => {
    setShowCamera(true);
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Gagal mengakses kamera.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      setCapturedPhoto(canvasRef.current.toDataURL('image/jpeg', 0.7));
      stopCamera();
      setShowCamera(true); // Keep modal open to show captured photo
    }
  };

  const handleConfirmAttendance = async () => {
    if (attendanceStatus === 'Hadir' && !capturedPhoto) return alert("Ambil foto dulu!");
    setIsSubmittingAttendance(true);
    try {
      await addDoc(collection(db, 'attendance'), {
        studentId: user.uid,
        studentName: userData.name,
        date: new Date().toISOString().split('T')[0],
        timestamp: serverTimestamp(),
        status: attendanceStatus,
        note: attendanceNote,
        photo: capturedPhoto || ''
      });
      alert("Absensi berhasil!");
      stopCamera();
    } catch (e) {
      alert("Gagal absen.");
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDetailToPay) return;
    setPaymentSubmitting(true);
    try {
      await addDoc(collection(db, 'payments'), {
        studentId: user.uid,
        studentName: userData.name,
        amount: activeDetailToPay.amount,
        description: `Pembayaran ${activeDetailToPay.name}`,
        method: paymentMethod,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        proofStr: paymentProof || null
      });
      alert("Pembayaran diajukan! Menunggu verifikasi admin.");
      setActiveDetailToPay(null);
    } catch (e) {
      alert("Gagal mengajukan pembayaran.");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const NavItems = ({ mobile = false }) => {
    const items = [
      { id: 'overview', label: 'Dashboard', icon: Home },
      { id: 'progress', label: 'Rapor', icon: BookOpen },
      { id: 'hafalan', label: 'Hafalan', icon: Star },
      { id: 'attendance', label: 'Absensi', icon: CheckCircle },
      { id: 'administration', label: 'Keuangan', icon: Wallet },
      { id: 'announcements', label: 'Info', icon: Bell },
      { id: 'profile', label: 'Profil', icon: User },
    ];

    return (
      <div className={mobile ? "grid grid-cols-4 gap-2" : "space-y-1"}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
              activeTab === item.id 
                ? 'bg-slate-900 text-white shadow-xl' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <item.icon size={24} />
            <span className="text-[10px] font-bold mt-1.5 uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-24 flex-col items-center py-10 bg-white border-r border-slate-100 sticky top-0 h-screen overflow-y-auto custom-scrollbar">
        <img src="/assets/aistudio/image_24fdf8ff.png" alt="Logo" className="w-12 h-12 object-contain mb-10" />
        <nav className="flex-1 space-y-4">
          {[
            { id: 'overview', icon: Home, label: 'Home' },
            { id: 'progress', icon: BookOpen, label: 'Rapor' },
            { id: 'hafalan', icon: Star, label: 'Hafalan' },
            { id: 'attendance', icon: CheckCircle, label: 'Absen' },
            { id: 'administration', icon: Wallet, label: 'Uang' },
            { id: 'announcements', icon: Bell, label: 'Info' },
            { id: 'profile', icon: User, label: 'Profil' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-icon ${activeTab === item.id ? 'sidebar-icon-active' : 'sidebar-icon-inactive'}`}
              title={item.label}
            >
              <item.icon size={22} />
              {activeTab === item.id && (
                <motion.div layoutId="active-pill" className="absolute -left-1 w-1 h-8 bg-slate-900 rounded-r-full" />
              )}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="sidebar-icon sidebar-icon-inactive mt-auto text-rose-500 hover:bg-rose-50 hover:text-rose-600">
          <LogOut size={22} />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="apple-blur-nav px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-10 h-10 rounded-xl overflow-hidden bg-white border border-slate-100 p-1">
              <img src="/assets/aistudio/image_24fdf8ff.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-slate-400 leading-none">Portal Siswa</h1>
              <p className="text-lg font-display font-black text-slate-900 tracking-tight">RA Darusyifa Arjawinangun</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-xs font-black text-slate-900">{userData?.name}</p>
              <p className="text-[10px] font-bold text-slate-400">Kelas {userData?.kelas}</p>
            </div>
            <button onClick={() => setActiveTab('profile')} className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-100">
              {userData?.photoURL ? <img src={userData.photoURL} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-slate-300" />}
            </button>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 pb-32">
          {activeTab === 'overview' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Hero Section */}
              <section className="relative overflow-hidden rounded-[3rem] bg-slate-900 text-white p-10 md:p-16 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mb-10" />
                
                <div className="relative z-10 space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Status Portal: Aktif & Terhubung</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-display font-black tracking-tight leading-tight">
                    Assalamu'alaikum, <br />
                    <span className="text-emerald-400">{userData?.name?.split(' ')[0]} 👋</span>
                  </h2>
                  <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed italic">
                    "{quote}"
                  </p>
                </div>
              </section>

              {/* Stats & Quick Actions Bento Grid */}
              <div className="bento-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <div className="bento-card bg-white group">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <BookOpen size={28} />
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Rata-rata Nilai</p>
                  <h3 className="text-4xl font-display font-black text-slate-900 tabular-nums">92.5</h3>
                  <p className="text-[10px] font-bold text-emerald-500 mt-2">+2.4% dari bulan lalu</p>
                </div>

                <div className="bento-card bg-white group">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <CheckCircle size={28} />
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Kehadiran (Bulan Ini)</p>
                  <h3 className="text-4xl font-display font-black text-slate-900 tabular-nums">22</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-2">Hari Aktif Sekolah</p>
                </div>

                <div className="bento-card bg-white group">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Star size={28} />
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Capaian Hafalan</p>
                  <h3 className="text-4xl font-display font-black text-slate-900 tabular-nums">15</h3>
                  <p className="text-[10px] font-bold text-amber-500 mt-2">Materi Selesai Setor</p>
                </div>

                <div className="bento-card bg-emerald-600 text-white group">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Wallet size={28} />
                  </div>
                  <p className="text-xs font-black text-emerald-100 uppercase tracking-widest mb-1">Saldo Tabungan</p>
                  <h3 className="text-3xl font-display font-black tabular-nums">Rp {(userData?.savings || 0).toLocaleString('id-ID')}</h3>
                  <button onClick={() => setActiveTab('administration')} className="mt-4 text-[10px] font-black uppercase tracking-widest text-emerald-100 hover:text-white flex items-center gap-1">
                    Cek Riwayat <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              {/* Two Column Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Information / Announcements */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight">Pengumuman Terbaru</h3>
                    <button onClick={() => setActiveTab('announcements')} className="text-xs font-black text-blue-600 uppercase tracking-widest">Lihat Semua</button>
                  </div>
                  <div className="space-y-4">
                    {announcements.slice(0, 3).map((ann, idx) => (
                      <div key={idx} className="card-premium p-6 flex gap-6 items-start">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0">
                          <span className="text-xs font-black text-slate-900 leading-none">{ann.createdAt?.seconds ? new Date(ann.createdAt.seconds * 1000).getDate() : '??'}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase mt-0.5">{ann.createdAt?.seconds ? new Date(ann.createdAt.seconds * 1000).toLocaleString('id-ID', { month: 'short' }).toUpperCase() : '???'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-black text-slate-900 tracking-tight mb-1">{ann.title}</h4>
                          <div className="text-sm text-slate-500 line-clamp-2 prose" dangerouslySetInnerHTML={{ __html: ann.content }} />
                        </div>
                        <button className="p-2 text-slate-400 hover:text-slate-900">
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    ))}
                    {announcements.length === 0 && <p className="text-center py-10 text-slate-400 italic">Belum ada pengumuman.</p>}
                  </div>
                </div>

                {/* Quick Menu / Side Widget */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight">Menu Utama</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'progress', label: 'Rapor', icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
                      { id: 'hafalan', label: 'Hafalan', icon: Star, color: 'bg-amber-50 text-amber-600' },
                      { id: 'attendance', label: 'Absensi', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
                      { id: 'administration', label: 'Keuangan', icon: CreditCard, color: 'bg-rose-50 text-rose-600' },
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center gap-3 group"
                      >
                        <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <item.icon size={24} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-700">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-display font-black text-slate-900 tracking-tight">Rapor & Evaluasi Belajar</h3>
                  <p className="text-slate-500 font-medium mt-1">Laporan perkembangan hasil belajar ananda per periode.</p>
                </div>
                <BookOpen size={48} className="text-blue-600 opacity-20" />
              </div>
              <div className="grid grid-cols-1 gap-6">
                {progress.length > 0 ? progress.map((p, idx) => {
                  const grade = p.score >= 90 ? 'A' : p.score >= 80 ? 'B' : p.score >= 70 ? 'C' : 'D';
                  return (
                    <div key={idx} className="card-premium p-8 flex flex-col md:flex-row md:items-center gap-8">
                      <div className="w-20 h-20 rounded-3xl bg-blue-600 text-white flex flex-col items-center justify-center shrink-0 shadow-lg shadow-blue-100">
                        <span className="text-3xl font-display font-black leading-none">{grade}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">Grade</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{p.evaluationPeriod}</span>
                          <span className="text-xs font-bold text-slate-400">{p.date}</span>
                        </div>
                        <h4 className="text-xl font-display font-black text-slate-900">{p.category}</h4>
                        <p className="text-sm text-slate-500 mt-1">{p.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Skor Akhir</p>
                        <p className="text-4xl font-display font-black text-slate-900 tabular-nums">{p.score}</p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                    <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-medium">Belum ada laporan evaluasi yang diterbitkan.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'hafalan' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-display font-black text-slate-900 tracking-tight">Modul Hafalan Qur'an</h3>
                  <p className="text-slate-500 font-medium mt-1">Pantau perkembangan setoran hafalan surah, hadist, dan doa.</p>
                </div>
                <Star size={48} className="text-amber-500 opacity-20" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {hafalanMaterials.map((mat, idx) => {
                  const prog = hafalanProgress.find(p => p.materialId === mat.id);
                  const status = prog?.status || 'Belum Mulai';
                  const statusColor = (status === 'Mumtaz (Lulus)' || status === 'Lancar') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : status === 'Sedang Menghafal' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100';
                  return (
                    <div key={idx} className="card-premium p-8 group">
                      <div className="flex items-center justify-between mb-6">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${statusColor}`}>{status}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3].map(s => (
                            <Star key={s} size={16} className={s <= (prog?.stars || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                          ))}
                        </div>
                      </div>
                      <h4 className="text-lg font-display font-black text-slate-900 mb-1">{mat.judul}</h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{mat.kategori}</p>
                      {prog?.catatanGuru && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs italic text-slate-600 leading-relaxed mb-4">
                          "{prog.catatanGuru}"
                        </div>
                      )}
                      <button className="w-full py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 transition-all">Lihat Materi</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-display font-black text-slate-900 tracking-tight">Presensi & Kehadiran</h3>
                  <p className="text-slate-500 font-medium mt-1">Data kedisiplinan dan absensi harian ananda.</p>
                </div>
                <CheckCircle size={48} className="text-emerald-600 opacity-20" />
              </div>

              {!hasCheckedInToday && (
                <div className="bg-emerald-600 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-emerald-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
                  <div className="relative z-10 shrink-0 w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center">
                    <Camera size={36} />
                  </div>
                  <div className="relative z-10 flex-1 text-center md:text-left">
                    <h4 className="text-2xl font-display font-black mb-2">Absensi Hari Ini</h4>
                    <p className="text-emerald-100 font-medium">Ananda belum melakukan absensi hari ini. Silakan ambil foto selfie untuk konfirmasi kehadiran.</p>
                  </div>
                  <button onClick={startCamera} className="relative z-10 px-8 py-4 bg-white text-emerald-700 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Ambil Foto Absen</button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Hadir', count: attendance.filter(a => a.status === 'Hadir').length, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Sakit', count: attendance.filter(a => a.status === 'Sakit').length, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Izin', count: attendance.filter(a => a.status === 'Izin').length, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Tanpa Ket.', count: attendance.filter(a => a.status === 'Alpha').length, color: 'text-rose-600 bg-rose-50' },
                ].map(stat => (
                  <div key={stat.label} className="card-premium p-8 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                    <h5 className={`text-4xl font-display font-black ${stat.color.split(' ')[0]}`}>{stat.count}</h5>
                  </div>
                ))}
              </div>

              <div className="card-premium overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                  <h4 className="text-xl font-display font-black text-slate-900 tracking-tight">Log Kehadiran Terakhir</h4>
                </div>
                <div className="divide-y divide-slate-50">
                  {attendance.slice(0, 10).map((att, idx) => (
                    <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${att.status === 'Hadir' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <div>
                          <p className="font-black text-slate-900">{att.date}</p>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{att.timestamp?.seconds ? new Date(att.timestamp.seconds * 1000).toLocaleTimeString() : ''}</p>
                        </div>
                      </div>
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${att.status === 'Hadir' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {att.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'administration' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-display font-black text-slate-900 tracking-tight">Administrasi & Keuangan</h3>
                  <p className="text-slate-500 font-medium mt-1">Pantau status pembayaran SPP dan tabungan ananda.</p>
                </div>
                <Wallet size={48} className="text-emerald-600 opacity-20" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Tabungan Card */}
                <div className="card-premium bg-slate-900 text-white p-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">Saldo Tabungan Ananda</p>
                      <h4 className="text-5xl font-display font-black tabular-nums">Rp {(userData?.savings || 0).toLocaleString('id-ID')}</h4>
                    </div>
                    <div className="mt-10 p-6 bg-white/10 rounded-[2rem] border border-white/10">
                      <p className="text-xs font-medium text-slate-300 leading-relaxed italic">
                        "Fitur setoran tabungan online sedang dalam pengembangan. Silakan hubungi wali kelas untuk penyetoran tunai."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tunggakan Card */}
                <div className="card-premium p-10 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Total Tunggakan Iuran</p>
                    <h4 className="text-5xl font-display font-black text-rose-600 tabular-nums">Rp {(userData?.arrears || 0).toLocaleString('id-ID')}</h4>
                  </div>
                  <button onClick={() => setActiveTab('announcements')} className="mt-10 btn-apple-primary w-full py-4 text-xs">Cek Detail Tagihan</button>
                </div>
              </div>

              {/* History Table */}
              <div className="card-premium overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <h4 className="text-xl font-display font-black text-slate-900 tracking-tight">Riwayat Pembayaran</h4>
                  <button className="text-xs font-black text-blue-600 uppercase tracking-widest">Download Semua</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {payments.map((pay, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-all">
                          <td className="px-8 py-6">
                            <p className="font-black text-slate-900">{pay.description}</p>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${pay.status === 'lunas' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{pay.status}</span>
                          </td>
                          <td className="px-8 py-6 text-sm font-bold text-slate-500">{pay.date}</td>
                          <td className="px-8 py-6 text-sm font-bold text-slate-500">{pay.method}</td>
                          <td className="px-8 py-6 text-right font-black text-slate-900 tabular-nums">Rp {pay.amount.toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                      {payments.length === 0 && (
                        <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">Belum ada riwayat transaksi.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-display font-black text-slate-900 tracking-tight">Informasi & Pengumuman</h3>
                  <p className="text-slate-500 font-medium mt-1">Berita terbaru dan agenda kegiatan RA Darusyifa.</p>
                </div>
                <Bell size={48} className="text-indigo-600 opacity-20" />
              </div>
              <div className="grid grid-cols-1 gap-8">
                {announcements.map((ann, idx) => (
                  <div key={idx} className="card-premium p-10 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-50 pb-6">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Megaphone size={20} />
                        </span>
                        <div>
                          <h4 className="text-xl font-display font-black text-slate-900">{ann.title}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ann.date || 'TERBARU'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full uppercase tracking-widest">Informasi Penting</span>
                    </div>
                    <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed announcement-html-content" dangerouslySetInnerHTML={{ __html: ann.content }} />
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                        <User size={14} />
                        <span>Admin RA Darusyifa</span>
                      </div>
                      <button className="text-xs font-black text-blue-600 flex items-center gap-1 uppercase tracking-widest">Baca Detail <ChevronRight size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-32 h-32 rounded-[3rem] border-4 border-white shadow-xl overflow-hidden bg-slate-100">
                    {userData?.photoURL ? <img src={userData.photoURL} className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-slate-300" />}
                  </div>
                  <label className="absolute bottom-0 right-0 p-3 bg-slate-900 text-white rounded-2xl shadow-xl cursor-pointer hover:scale-110 transition-transform">
                    <Camera size={18} />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>
                <h3 className="text-3xl font-display font-black text-slate-900 tracking-tight">{userData?.name}</h3>
                <p className="text-slate-500 font-medium">Siswa Kelas {userData?.kelas} • NISN {userData?.nisn || userData?.nis}</p>
              </div>

              <div className="card-premium p-10 space-y-8">
                <h4 className="text-xl font-display font-black text-slate-900 tracking-tight border-b border-slate-50 pb-4">Data Pribadi Ananda</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</p>
                    <p className="font-bold text-slate-900">{userData?.name}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempat, Tgl Lahir</p>
                    <p className="font-bold text-slate-900">{userData?.tempatLahir || '-'}, {userData?.tanggalLahir || '-'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat</p>
                    <p className="font-bold text-slate-900">{userData?.address || '-'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wali Murid</p>
                    <p className="font-bold text-slate-900">{userData?.parentName || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="card-premium p-10 space-y-8">
                <h4 className="text-xl font-display font-black text-slate-900 tracking-tight border-b border-slate-50 pb-4 text-rose-600">Keamanan</h4>
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center gap-4">
                  <ShieldAlert className="text-rose-600 shrink-0" size={24} />
                  <p className="text-xs font-bold text-rose-900 leading-relaxed">Untuk keamanan akun, mohon jangan berikan data login kepada siapapun selain wali murid ananda.</p>
                </div>
                <button onClick={handleLogout} className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2">
                  <LogOut size={18} /> Keluar dari Sesi
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Navigation - Icons + Labels as requested */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-2 py-3 flex items-center justify-around z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        {[
          { id: 'overview', label: 'Beranda', icon: Home },
          { id: 'progress', label: 'Rapor', icon: BookOpen },
          { id: 'hafalan', label: 'Hafalan', icon: Star },
          { id: 'attendance', label: 'Absen', icon: CheckCircle },
          { id: 'administration', label: 'Uang', icon: Wallet },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === item.id ? 'text-slate-900' : 'text-slate-400'}`}
          >
            <div className={`p-2 rounded-xl transition-all ${activeTab === item.id ? 'bg-slate-100 scale-110' : ''}`}>
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-tighter ${activeTab === item.id ? 'opacity-100' : 'opacity-80'}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Modals */}
      <AnimatePresence>
        {showCamera && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-lg flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h4 className="text-xl font-display font-black text-slate-900">Presensi Digital</h4>
                <button onClick={stopCamera} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-6 text-center">
                <div className="aspect-video bg-slate-900 rounded-[2rem] overflow-hidden relative border-4 border-slate-50 shadow-inner">
                  {capturedPhoto ? (
                    <img src={capturedPhoto} className="w-full h-full object-cover" />
                  ) : (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  )}
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> KAMERA LIVE
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {['Hadir', 'Sakit', 'Izin', 'Alpha'].map(s => (
                    <button
                      key={s}
                      onClick={() => setAttendanceStatus(s)}
                      className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${attendanceStatus === s ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {!capturedPhoto ? (
                  <button onClick={takePhoto} className="btn-apple-primary w-full py-5 text-sm uppercase tracking-[0.2em] shadow-xl shadow-slate-200">
                    <Camera size={20} /> Ambil Foto
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setCapturedPhoto(null)} className="btn-apple-secondary w-full py-5 text-sm uppercase tracking-widest">Ulangi</button>
                    <button onClick={handleConfirmAttendance} disabled={isSubmittingAttendance} className="btn-apple-primary w-full py-5 text-sm uppercase tracking-widest">
                      {isSubmittingAttendance ? 'Proses...' : 'Kirim'}
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
