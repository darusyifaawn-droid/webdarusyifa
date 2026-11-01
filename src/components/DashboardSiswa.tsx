import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  collection, query, where, onSnapshot, addDoc, serverTimestamp, 
  doc, getDoc, updateDoc, orderBy, getDocs, setDoc, limit 
} from 'firebase/firestore';
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
import { compressImage } from '../lib/imageUtils';
import { staticHafalanMaterials as initialHafalanMaterials, StudentHafalanProgress } from '../data/hafalanData';
import KaldikCalendar from './KaldikCalendar';

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
  const [loading, setLoading] = useState(!authUserData);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  // Attendance States
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

    const unsubMaterials = onSnapshot(query(collection(db, 'hafalan_materials'), orderBy('urutan', 'asc')), (snapshot) => {
      setHafalanMaterials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubAttendance();
      unsubProgress();
      unsubHafalanProgress();
      unsubAnnounce();
      unsubPayments();
      unsubMaterials();
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
      setShowCamera(true); 
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-slate-900 overflow-hidden">
      {/* Sidebar - Desktop (Premium Wide Version) */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-100/80 sticky top-0 h-screen z-50 shadow-sm">
        <div className="p-8 pb-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 p-2 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
            <img src="/assets/aistudio/image_24fdf8ff.png" alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">RA Darusyifa</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Portal Siswa</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8 custom-scrollbar">
          {/* Main Menu Group */}
          <div className="space-y-3">
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Menu Utama</p>
            <div className="space-y-1.5">
              <SidebarItem 
                icon={Home} 
                label="Beranda" 
                active={activeTab === 'overview'} 
                onClick={() => setActiveTab('overview')} 
              />
              <SidebarItem 
                icon={BookOpen} 
                label="Rapor & Nilai" 
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
                label="Presensi Harian" 
                active={activeTab === 'attendance'} 
                onClick={() => setActiveTab('attendance')} 
              />
            </div>
          </div>

          {/* Administrasi Group */}
          <div className="space-y-3">
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Administrasi</p>
            <div className="space-y-1.5">
              <SidebarItem 
                icon={Wallet} 
                label="Keuangan" 
                active={activeTab === 'administration'} 
                onClick={() => setActiveTab('administration')} 
              />
              <SidebarItem 
                icon={Megaphone} 
                label="Info & Berita" 
                active={activeTab === 'announcements'} 
                onClick={() => setActiveTab('announcements')} 
              />
            </div>
          </div>

          {/* Lainnya Group */}
          <div className="space-y-3">
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Akun Saya</p>
            <div className="space-y-1.5">
              <SidebarItem 
                icon={User} 
                label="Profil Saya" 
                active={activeTab === 'profile'} 
                onClick={() => setActiveTab('profile')} 
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all font-bold text-sm group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
              <LogOut size={18} />
            </div>
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#f8fafc]">
        {/* Header - Modern Blur Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100/80 px-8 flex items-center justify-between z-40 shrink-0">
          <div className="flex items-center gap-6 flex-1">
            <div className="hidden lg:flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-5 py-2.5 w-full max-w-md group focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
              <ImageIcon size={18} className="text-slate-400 mr-3" />
              <input 
                type="text" 
                placeholder="Cari nilai, info, atau pengumuman..." 
                className="bg-transparent border-none outline-none text-sm font-semibold w-full placeholder:text-slate-400"
              />
            </div>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 p-2 flex items-center justify-center shadow-lg shadow-emerald-200">
                <img src="/assets/aistudio/image_24fdf8ff.png" alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
              </div>
              <h1 className="text-sm font-black text-slate-900 lg:hidden">RA Darusyifa</h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2.5 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-500">
              <Calendar size={15} />
              <span className="text-xs font-black">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            
            <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 leading-none">{userData?.name}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">KELAS {userData?.kelas || 'RA'}</p>
              </div>
              <button 
                onClick={() => setActiveTab('profile')}
                className="w-11 h-11 rounded-2xl border-2 border-white shadow-md overflow-hidden bg-slate-100 hover:ring-4 hover:ring-emerald-500/10 transition-all"
              >
                {userData?.photoURL ? (
                  <img src={userData.photoURL} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600">
                    <User size={20} />
                  </div>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc]">
          <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto pb-32">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8 md:space-y-10"
                >
                  {/* Hero Section - Bento Style */}
                  <section className="relative overflow-hidden rounded-[2.5rem] bg-emerald-600 p-8 md:p-12 shadow-2xl shadow-emerald-200">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl -mr-64 -mt-64" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                      <div className="space-y-6 flex-1 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 border border-white/30 rounded-full backdrop-blur-sm">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white">Status Portal: Aktif & Terhubung</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-tight">
                          Assalamu'alaikum, <br className="hidden md:block" />
                          <span className="text-emerald-200">{userData?.name?.split(' ')[0]} 👋</span>
                        </h2>
                        <p className="text-emerald-50/80 font-medium text-lg max-w-xl leading-relaxed italic">
                          "Kedisiplinan adalah jembatan antara cita-cita dan pencapaian."
                        </p>
                      </div>
                      <div className="hidden lg:block shrink-0">
                         <div className="w-48 h-48 rounded-[3rem] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                            <Star size={80} className="text-emerald-200 animate-bounce" />
                         </div>
                      </div>
                    </div>
                  </section>

                  {/* Stats Cards Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <DashboardStatCard 
                      label="Rata-rata Nilai" 
                      value="92.5" 
                      trend="+2.4% dari bulan lalu" 
                      trendColor="text-emerald-500"
                      icon={BookOpen} 
                      color="blue"
                    />
                    <DashboardStatCard 
                      label="Kehadiran (Bulan Ini)" 
                      value="22" 
                      trend="Hari Aktif Sekolah" 
                      trendColor="text-slate-400"
                      icon={CheckCircle} 
                      color="emerald"
                    />
                    <DashboardStatCard 
                      label="Capaian Hafalan" 
                      value="15" 
                      trend="Materi Selesai Setor" 
                      trendColor="text-amber-500"
                      icon={Star} 
                      color="amber"
                    />
                    <DashboardStatCard 
                      label="Saldo Tabungan" 
                      value={`Rp ${(userData?.savings || 0).toLocaleString('id-ID')}`} 
                      trend="CEK RIWAYAT ->" 
                      trendColor="text-emerald-600"
                      icon={Wallet} 
                      color="emerald-dark"
                      onClick={() => setActiveTab('administration')}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
                    {/* Main Menu Grid */}
                    <div className="lg:col-span-2 space-y-8">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                          <GridIcon size={24} className="text-emerald-600" />
                          Menu Utama
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                        <MenuIconButton id="progress" label="Rapor" icon={BookOpen} color="blue" onClick={() => setActiveTab('progress')} />
                        <MenuIconButton id="hafalan" label="Hafalan" icon={Star} color="amber" onClick={() => setActiveTab('hafalan')} />
                        <MenuIconButton id="attendance" label="Absensi" icon={CheckCircle} color="emerald" onClick={() => setActiveTab('attendance')} />
                        <MenuIconButton id="administration" label="Uang" icon={Wallet} color="rose" onClick={() => setActiveTab('administration')} />
                      </div>

                      {/* Motivation Quote */}
                      <div className="p-8 md:p-10 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden group shadow-xl">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mr-40 -mt-40 group-hover:bg-emerald-500/20 transition-all duration-700" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 transition-transform">
                            <Sparkles className="text-emerald-400" size={38} />
                          </div>
                          <p className="text-xl md:text-2xl font-medium italic text-slate-300 text-center md:text-left leading-relaxed">
                            "{quote}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Announcements Sidebar */}
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Pengumuman</h3>
                        <button onClick={() => setActiveTab('announcements')} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                          Lihat semua <ChevronRight size={12} />
                        </button>
                      </div>
                      <div className="space-y-4">
                        {announcements.slice(0, 4).map((ann, idx) => (
                          <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex items-start gap-5"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex flex-col items-center justify-center shrink-0 text-slate-400 font-black border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 group-hover:text-emerald-600 transition-all">
                              <span className="text-xs leading-none">{ann.createdAt?.seconds ? new Date(ann.createdAt.seconds * 1000).getDate() : '??'}</span>
                              <span className="text-[8px] uppercase mt-1">{ann.createdAt?.seconds ? new Date(ann.createdAt.seconds * 1000).toLocaleString('id-ID', { month: 'short' }).toUpperCase() : '???'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-black text-slate-900 truncate group-hover:text-emerald-600 transition-colors">{ann.title}</h4>
                              <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                {ann.category || 'INFORMASI'}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                        {announcements.length === 0 && (
                          <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                             <Bell size={32} className="mx-auto text-slate-200 mb-3" />
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Belum ada info</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ... other tabs would go here with same premium styling ... */}
              {/* Added consistent tabs back based on previous state but with improved premium look */}

              {activeTab === 'progress' && (
                <motion.div 
                  key="progress"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                    <div>
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                         <BookOpen size={14} /> Laporan Akademik
                      </div>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tight">Rapor & Nilai Ananda</h3>
                      <p className="text-slate-500 font-medium mt-2 text-lg">Pantau laporan perkembangan hasil belajar per periode.</p>
                    </div>
                    <div className="w-24 h-24 rounded-[2rem] bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                       <Award size={48} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {progress.length > 0 ? progress.map((p, idx) => {
                      const score = Number(p.score) || 0;
                      const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D';
                      const gradeColor = score >= 90 ? 'bg-emerald-600' : score >= 80 ? 'bg-blue-600' : score >= 70 ? 'bg-amber-600' : 'bg-rose-600';
                      return (
                        <div key={idx} className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-8 group hover:shadow-2xl hover:border-emerald-100 transition-all">
                          <div className={`w-24 h-24 rounded-[2.5rem] ${gradeColor} text-white flex flex-col items-center justify-center shrink-0 shadow-xl group-hover:scale-110 transition-transform`}>
                            <span className="text-4xl font-black leading-none">{grade}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest mt-2 opacity-80 font-mono">Nilai</span>
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">{p.evaluationPeriod}</span>
                              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Calendar size={14} /> {p.date}</span>
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{p.category}</h4>
                            <p className="text-slate-500 font-medium leading-relaxed italic">"{p.description}"</p>
                          </div>
                          <div className="text-right flex flex-col items-end justify-center md:border-l md:border-slate-50 md:pl-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Skor Akhir</p>
                            <p className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter">{score}</p>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-32 bg-white rounded-[3.5rem] border-4 border-dashed border-slate-50">
                        <BookOpen size={64} className="mx-auto text-slate-100 mb-8" />
                        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm">Belum ada laporan nilai tersimpan</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'hafalan' && (
                <motion.div 
                  key="hafalan"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                    <div>
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                         <Star size={14} /> Capaian Qur'ani
                      </div>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tight">Modul Hafalan Ananda</h3>
                      <p className="text-slate-500 font-medium mt-2 text-lg">Pantau setoran hafalan surah, hadist, dan doa-doa harian.</p>
                    </div>
                    <div className="w-24 h-24 rounded-[2rem] bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                       <Sparkles size={48} className="animate-pulse" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {hafalanMaterials.map((mat, idx) => {
                      const prog = hafalanProgress.find(p => p.materialId === mat.id);
                      const status = prog?.status || 'Belum Mulai';
                      const statusStyles = (status === 'Mumtaz (Lulus)' || status === 'Lancar') 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : status === 'Sedang Menghafal' 
                        ? 'bg-amber-50 text-amber-600 border-amber-100' 
                        : 'bg-slate-50 text-slate-400 border-slate-100';
                      
                      return (
                        <motion.div 
                          key={idx} 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-emerald-100 transition-all group"
                        >
                          <div className="flex items-center justify-between mb-8">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border ${statusStyles}`}>{status}</span>
                            <div className="flex gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl">
                              {[1, 2, 3].map(s => (
                                <Star key={s} size={20} className={s <= (prog?.stars || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                              ))}
                            </div>
                          </div>
                          <h4 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">{mat.judul}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">{mat.kategori}</p>
                          
                          {prog?.catatanGuru && (
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-sm italic text-slate-600 leading-relaxed mb-8 relative">
                              <span className="absolute top-2 left-4 text-3xl text-slate-200 font-serif">“</span>
                              {prog.catatanGuru}
                            </div>
                          )}
                          
                          <button className="w-full py-4.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-slate-100 group-hover:shadow-emerald-100 flex items-center justify-center gap-2">
                             Lihat Materi <ArrowRight size={14} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === 'attendance' && (
                <motion.div 
                  key="attendance"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                    <div>
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                         <CheckCircle size={14} /> Presensi Digital
                      </div>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tight">Data Kehadiran Ananda</h3>
                      <p className="text-slate-500 font-medium mt-2 text-lg">Pantau kedisiplinan dan absensi harian secara real-time.</p>
                    </div>
                    <div className="w-24 h-24 rounded-[2rem] bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                       <Clock size={48} />
                    </div>
                  </div>

                  {!hasCheckedInToday && (
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      className="bg-emerald-600 rounded-[3.5rem] p-10 md:p-14 text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl shadow-emerald-200 relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48 group-hover:bg-white/20 transition-all duration-1000" />
                      <div className="relative z-10 shrink-0 w-28 h-28 bg-white/20 rounded-[2.5rem] flex items-center justify-center border border-white/20 shadow-inner">
                        <Camera size={56} className="text-emerald-50" />
                      </div>
                      <div className="relative z-10 flex-1 text-center md:text-left space-y-4">
                        <h4 className="text-3xl font-black tracking-tight">Presensi Hari Ini</h4>
                        <p className="text-emerald-100 font-medium text-xl leading-relaxed max-w-2xl">Ananda belum melakukan absensi hari ini. Silakan ambil foto selfie untuk konfirmasi kehadiran sekolah.</p>
                      </div>
                      <button 
                        onClick={startCamera} 
                        className="relative z-10 px-12 py-6 bg-white text-emerald-700 rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-900/20 hover:scale-105 active:scale-95 transition-all text-xs"
                      >
                        Ambil Foto Sekarang
                      </button>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <AttendanceSmallStat label="Hadir" count={attendance.filter(a => a.status === 'Hadir').length} color="emerald" />
                    <AttendanceSmallStat label="Sakit" count={attendance.filter(a => a.status === 'Sakit').length} color="amber" />
                    <AttendanceSmallStat label="Izin" count={attendance.filter(a => a.status === 'Izin').length} color="blue" />
                    <AttendanceSmallStat label="Alpha" count={attendance.filter(a => a.status === 'Alpha').length} color="rose" />
                  </div>

                  <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 md:p-10 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                      <h4 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                         <RefreshCw size={20} className="text-emerald-600" />
                         Riwayat Presensi Terakhir
                      </h4>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {attendance.slice(0, 10).map((att, idx) => (
                        <div key={idx} className="p-7 flex items-center justify-between hover:bg-slate-50/50 transition-all px-10">
                          <div className="flex items-center gap-6">
                            <div className={`w-4 h-4 rounded-full ${att.status === 'Hadir' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]'}`} />
                            <div>
                              <p className="font-black text-slate-900 text-xl">{att.date}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                 <Clock size={12} /> {att.timestamp?.seconds ? new Date(att.timestamp.seconds * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '08:00'} WIB
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                             {att.photo && (
                                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 hidden sm:block">
                                   <img src={att.photo} className="w-full h-full object-cover" />
                                </div>
                             )}
                             <span className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2 ${att.status === 'Hadir' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                              {att.status}
                             </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'administration' && (
                <motion.div 
                  key="administration"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                    <div>
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                         <Wallet size={14} /> Keuangan & Tabungan
                      </div>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tight">Status Keuangan Ananda</h3>
                      <p className="text-slate-500 font-medium mt-2 text-lg">Pantau pembayaran SPP, uang iuran, dan saldo tabungan.</p>
                    </div>
                    <div className="w-24 h-24 rounded-[2rem] bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                       <CreditCard size={48} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                    {/* Tabungan Card - Premium */}
                    <div className="bg-slate-900 rounded-[3.5rem] text-white p-10 md:p-14 relative overflow-hidden group shadow-2xl flex flex-col justify-between h-[450px]">
                      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl -mr-48 -mt-48 group-hover:bg-emerald-500/20 transition-all duration-1000" />
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/5 rounded-full blur-2xl -ml-32 -mb-32" />
                      
                      <div className="relative z-10 space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                          <Wallet size={14} className="text-emerald-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Saldo Tabungan Aktif</span>
                        </div>
                        <div className="space-y-2">
                           <p className="text-emerald-500/60 font-black uppercase tracking-[0.3em] text-[10px]">TOTAL TERHIMPUN</p>
                           <h4 className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter">Rp {(userData?.savings || 0).toLocaleString('id-ID')}</h4>
                        </div>
                      </div>

                      <div className="relative z-10 p-8 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-md shadow-inner">
                        <p className="text-sm font-medium text-slate-400 leading-relaxed italic text-center">
                          "Setoran tabungan online segera hadir. Silakan hubungi admin sekolah untuk setoran tunai atau pembaruan saldo."
                        </p>
                      </div>
                    </div>

                    {/* Tunggakan/Recent Billing Card */}
                    <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 md:p-14 shadow-sm flex flex-col justify-between h-[450px] group hover:border-rose-100 transition-all">
                       <div className="space-y-8">
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 rounded-full border border-rose-100">
                            <AlertCircle size={14} className="text-rose-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Info Tunggakan SPP</span>
                          </div>
                          <div className="space-y-3">
                             <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">TAGIHAN BERJALAN</p>
                             <h4 className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter text-slate-900 group-hover:text-rose-600 transition-colors">Rp 0</h4>
                             <p className="text-emerald-600 font-bold text-sm flex items-center gap-2">
                                <CheckCircle size={18} /> Alhamdulillah, tidak ada tunggakan!
                             </p>
                          </div>
                       </div>
                       
                       <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                          <p className="text-sm font-medium text-slate-500 leading-relaxed text-center">
                             Pastikan ananda rajin menabung dan membayar iuran tepat waktu untuk mendukung operasional sekolah yang lebih baik.
                          </p>
                       </div>
                    </div>
                  </div>

                  {/* Payment History Table */}
                  <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 md:p-10 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                      <h4 className="text-2xl font-black text-slate-900 tracking-tight">Riwayat Transaksi</h4>
                      <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline flex items-center gap-2 px-5 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                        <Download size={14} /> Download Laporan PDF
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Keterangan Transaksi</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tanggal</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Metode</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Nominal (Rp)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {payments.map((pay, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-all group">
                              <td className="px-10 py-8">
                                <p className="font-black text-slate-900 group-hover:text-emerald-600 transition-colors text-lg">{pay.description}</p>
                                <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full mt-3 inline-block tracking-widest ${pay.status === 'lunas' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>{pay.status}</span>
                              </td>
                              <td className="px-10 py-8 text-sm font-bold text-slate-500 uppercase tracking-tighter italic">{pay.date}</td>
                              <td className="px-10 py-8 text-sm font-black text-slate-500">
                                <span className="bg-slate-100 px-4 py-1.5 rounded-xl text-[10px] uppercase tracking-widest border border-slate-200">{pay.method || 'Tunai'}</span>
                              </td>
                              <td className="px-10 py-8 text-right font-black text-slate-900 tabular-nums text-2xl tracking-tighter">Rp {pay.amount.toLocaleString('id-ID')}</td>
                            </tr>
                          ))}
                          {payments.length === 0 && (
                            <tr>
                               <td colSpan={4} className="py-24 text-center">
                                  <Wallet size={48} className="mx-auto text-slate-100 mb-4" />
                                  <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">Belum ada riwayat transaksi</p>
                               </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div 
                  key="profile"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="max-w-4xl mx-auto space-y-12"
                >
                  <div className="text-center space-y-8">
                    <div className="relative inline-block group">
                      <div className="w-48 h-48 rounded-[4rem] border-8 border-white shadow-2xl overflow-hidden bg-slate-100 group-hover:ring-12 group-hover:ring-emerald-500/10 transition-all duration-500">
                        {userData?.photoURL ? (
                          <img src={userData.photoURL} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600">
                             <User size={64} />
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-2 right-2 p-5 bg-slate-900 text-white rounded-[2rem] shadow-2xl cursor-pointer hover:scale-110 active:scale-95 transition-all border-4 border-white hover:bg-emerald-600">
                        <Camera size={26} />
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-5xl font-black text-slate-900 tracking-tight">{userData?.name}</h3>
                      <p className="text-slate-500 font-bold text-xl mt-3 flex items-center justify-center gap-3">
                         <span className="bg-emerald-50 text-emerald-700 px-4 py-1 rounded-xl border border-emerald-100">Siswa Kelas {userData?.kelas}</span>
                         <span className="text-slate-300">•</span>
                         <span className="text-slate-400">NISN {userData?.nisn || userData?.nis || '-'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm p-12 md:p-16 space-y-12">
                    <div className="flex items-center gap-4 pb-8 border-b border-slate-50">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                         <User size={24} />
                      </div>
                      <h4 className="text-2xl font-black text-slate-900 tracking-tight">Biodata Lengkap Siswa</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <ProfileField label="Nama Lengkap" value={userData?.name} />
                      <ProfileField label="Tempat, Tgl Lahir" value={`${userData?.tempatLahir || '-'}, ${userData?.tanggalLahir || '-'}`} />
                      <ProfileField label="Jenis Kelamin" value={userData?.jenisKelamin || '-'} />
                      <ProfileField label="Alamat Rumah" value={userData?.alamat || '-'} isFullWidth />
                    </div>

                    <div className="p-10 bg-emerald-50 rounded-[3rem] border border-emerald-100 flex flex-col md:flex-row items-center gap-8 group">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                        <Lock size={28} />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h5 className="text-xl font-black text-emerald-900">Keamanan Akun & Password</h5>
                        <p className="text-sm text-emerald-700/70 mt-1 font-medium italic">Gunakan password yang kuat untuk menjaga privasi data ananda di sistem sekolah.</p>
                      </div>
                      <button 
                        onClick={() => setIsEditingProfile(true)}
                        className="px-10 py-4 bg-white text-emerald-600 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all border-2 border-emerald-100 text-xs"
                      >
                        Ubah Password
                      </button>
                    </div>

                    <button 
                      onClick={handleLogout}
                      className="w-full py-6 bg-rose-50 text-rose-600 rounded-[2.5rem] font-black uppercase tracking-[0.3em] hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-4 text-sm shadow-sm"
                    >
                      <LogOut size={24} /> Keluar dari Sistem Portal
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Mobile Navigation - Apple Style Tabbar (Matching Admin Redesign) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-100 px-6 py-4 flex items-center justify-between z-50 shadow-[0_-15px_40px_rgba(0,0,0,0.08)] rounded-t-[2.5rem]">
        <MobileNavItem id="overview" label="Home" icon={Home} activeTab={activeTab} setActiveTab={setActiveTab} />
        <MobileNavItem id="progress" label="Nilai" icon={BookOpen} activeTab={activeTab} setActiveTab={setActiveTab} />
        <MobileNavItem id="hafalan" label="Hafalan" icon={Star} activeTab={activeTab} setActiveTab={setActiveTab} />
        <MobileNavItem id="attendance" label="Absen" icon={CheckCircle} activeTab={activeTab} setActiveTab={setActiveTab} />
        <MobileNavItem id="administration" label="Uang" icon={Wallet} activeTab={activeTab} setActiveTab={setActiveTab} />
      </nav>

      {/* Camera Modal - Modern Design */}
      <AnimatePresence>
        {showCamera && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 60 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 60 }} 
              className="bg-white rounded-[4rem] w-full max-w-xl overflow-hidden shadow-2xl relative"
            >
              <div className="p-8 md:p-10 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                    <Camera size={24} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight">Presensi Siswa</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Verifikasi Wajah & Lokasi</p>
                  </div>
                </div>
                <button onClick={stopCamera} className="w-12 h-12 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 rounded-2xl flex items-center justify-center transition-all group">
                   <X size={24} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>
              
              <div className="p-8 md:p-10 space-y-10 text-center">
                <div className="aspect-square bg-slate-950 rounded-[4rem] overflow-hidden relative border-8 border-slate-100 shadow-2xl">
                  {capturedPhoto ? (
                    <img src={capturedPhoto} className="w-full h-full object-cover" />
                  ) : (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  )}
                  {!capturedPhoto && (
                    <div className="absolute top-8 left-8 bg-emerald-600/90 backdrop-blur-md px-5 py-2 rounded-2xl text-[11px] font-black text-white flex items-center gap-3 border border-white/20">
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" /> SCANNING LIVE...
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                  {['Hadir', 'Sakit', 'Izin', 'Alpha'].map(s => (
                    <button
                      key={s}
                      onClick={() => setAttendanceStatus(s)}
                      className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 ${
                        attendanceStatus === s 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                          : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {!capturedPhoto ? (
                  <button 
                    onClick={takePhoto} 
                    className="w-full py-6.5 bg-emerald-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] shadow-2xl shadow-emerald-200 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs flex items-center justify-center gap-4"
                  >
                    <Camera size={24} /> Ambil Foto Sekarang
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-5">
                    <button 
                      onClick={() => setCapturedPhoto(null)} 
                      className="w-full py-5.5 bg-slate-100 text-slate-600 rounded-[2rem] font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs border border-slate-200"
                    >
                      Ulangi Foto
                    </button>
                    <button 
                      onClick={handleConfirmAttendance} 
                      disabled={isSubmittingAttendance} 
                      className="w-full py-5.5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-emerald-100 hover:scale-[1.02] transition-all text-xs"
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
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-[2rem] transition-all duration-500 group ${
      active 
        ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-100' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${
      active ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-emerald-50 group-hover:text-emerald-600'
    }`}>
      <Icon size={20} className={active ? 'text-white' : 'text-slate-400 transition-colors'} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span className={`text-[13px] font-black tracking-tight ${active ? 'text-white' : 'text-slate-600'}`}>{label}</span>
    {active && (
      <motion.div layoutId="sidebar-active" className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
    )}
  </button>
);

const DashboardStatCard = ({ label, value, trend, trendColor, icon: Icon, color, onClick }: any) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    'emerald-dark': 'bg-emerald-600 text-white shadow-xl shadow-emerald-100'
  };
  
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      onClick={onClick}
      className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer group ${onClick ? 'active:scale-95' : ''}`}
    >
      <div className="flex items-center justify-between mb-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
        <div className={`w-12 h-12 rounded-[1.25rem] ${colorMap[color]} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
      </div>
      <h3 className={`text-3xl font-black text-slate-900 tracking-tight ${color === 'emerald-dark' ? 'text-emerald-950' : ''}`}>{value}</h3>
      <p className={`text-[10px] font-black mt-3 uppercase tracking-widest ${trendColor} flex items-center gap-1.5`}>
        {trend}
      </p>
    </motion.div>
  );
};

const MenuIconButton = ({ label, icon: Icon, color, onClick }: any) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600',
    amber: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600',
    rose: 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600'
  };

  return (
    <button
      onClick={onClick}
      className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all flex flex-col items-center gap-4 group active:scale-95"
    >
      <div className={`w-16 h-16 rounded-[1.75rem] ${colorMap[color]} flex items-center justify-center group-hover:text-white group-hover:shadow-lg transition-all duration-300`}>
        <Icon size={30} strokeWidth={2.5} />
      </div>
      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-emerald-600 transition-colors">{label}</span>
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
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center group hover:shadow-xl transition-all">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
      <h5 className={`text-5xl font-black tracking-tighter ${colors[color].split(' ')[0]}`}>{count}</h5>
    </div>
  );
};

const MobileNavItem = ({ id, label, icon: Icon, activeTab, setActiveTab }: any) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`flex flex-col items-center gap-2 transition-all relative ${activeTab === id ? 'text-emerald-600' : 'text-slate-400'}`}
  >
    <div className={`p-3 rounded-2xl transition-all ${activeTab === id ? 'bg-emerald-50 scale-110 shadow-inner' : ''}`}>
      <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 2} />
    </div>
    <span className={`text-[9px] font-black uppercase tracking-tighter transition-all ${activeTab === id ? 'opacity-100 translate-y-0' : 'opacity-60 -translate-y-1'}`}>{label}</span>
    {activeTab === id && (
      <motion.div layoutId="tab-pill" className="absolute -top-4 w-10 h-1 bg-emerald-500 rounded-full shadow-emerald-200 shadow-lg" />
    )}
  </button>
);

const ProfileField = ({ label, value, isFullWidth }: any) => (
  <div className={`${isFullWidth ? 'md:col-span-2' : ''} space-y-3`}>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{label}</p>
    <p className="text-xl font-black text-slate-900 border-b-2 border-slate-50 pb-3">{value || '-'}</p>
  </div>
);
