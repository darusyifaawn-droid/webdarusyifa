import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  collection, query, where, onSnapshot, addDoc, serverTimestamp, 
  doc, orderBy, limit 
} from 'firebase/firestore';
import { 
  CheckCircle, Clock, Calendar, User, LogOut, Bell, 
  CreditCard, BookOpen, Save, X, Menu, Star, Megaphone, 
  AlertCircle, Image as ImageIcon, FileText, Download, 
  ExternalLink, RefreshCw, Home, MessageCircle, Wallet, 
  ChevronRight, ArrowRight, ShieldAlert, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export default function DashboardOrangTua() {
  const { user: authUser, userData: authUserData } = useAuth();
  const [user, setUser] = useState<any>(authUser);
  const [userData, setUserData] = useState<any>(authUserData);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(!authUserData);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    if (authUser) setUser(authUser);
    if (authUserData) {
      setUserData(authUserData);
      setLoading(false);
    }
  }, [authUser, authUserData]);

  useEffect(() => {
    if (!user) return;

    const unsubAttendance = onSnapshot(
      query(collection(db, 'attendance'), where('studentId', '==', user.uid), orderBy('timestamp', 'desc'), limit(50)),
      (snapshot) => setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
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

    return () => {
      unsubAttendance();
      unsubAnnounce();
      unsubPayments();
      unsubSettings();
    };
  }, [user]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full" />
    </div>
  );

  const hadirCount = attendance.filter(a => a.status === 'Hadir').length;
  const totalActiveDays = Math.max(attendance.length, 22);
  const attendancePercentage = attendance.length > 0 ? Math.min(100, Math.round((hadirCount / attendance.length) * 100)) : 100;
  const hasArrears = (userData?.arrears || 0) > 0;

  return (
    <div className="min-h-screen bg-[#f4f7fe] flex font-sans text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-100 sticky top-0 h-screen overflow-y-auto custom-scrollbar shrink-0">
        <div className="p-6 pt-7 pb-6 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full border border-emerald-500/30 p-1 flex items-center justify-center shrink-0 bg-white shadow-xs">
            <img src="/assets/aistudio/image_24fdf8ff.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-[15px] font-black text-slate-900 leading-tight">Portal Wali</h1>
            <p className="text-[9px] font-black text-[#059669] uppercase tracking-[0.18em] mt-0.5">RA DARUSYIFA</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1.5">
          {[
            { id: 'overview', icon: Home, label: 'Beranda' },
            { id: 'attendance', icon: CheckCircle, label: 'Riwayat Absensi' },
            { id: 'administration', icon: CreditCard, label: 'Administrasi' },
            { id: 'announcements', icon: Bell, label: 'Info Sekolah' },
            { id: 'profile', icon: User, label: 'Profil Saya' },
          ].map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all cursor-pointer group ${
                  isActive 
                    ? 'bg-[#059669] text-white shadow-md shadow-emerald-600/20 font-bold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-semibold'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-white shrink-0' : 'text-slate-400 group-hover:text-[#059669] transition-colors shrink-0'} />
                <span className={`text-xs tracking-tight ${isActive ? 'text-white font-extrabold' : 'text-slate-600 font-bold'}`}>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => navigate('/kaldik')}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all cursor-pointer group text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-semibold"
          >
            <Calendar size={18} className="text-slate-400 group-hover:text-[#059669] transition-colors shrink-0" />
            <span className="text-xs tracking-tight text-slate-600 font-bold">Kaldik</span>
          </button>
        </nav>

        <div className="p-4 mt-auto space-y-2 border-t border-slate-50">
          <button
            onClick={() => navigate('/juknis')}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-[#059669] hover:bg-emerald-100/70 transition-all font-extrabold text-xs cursor-pointer"
          >
            <BookOpen size={18} className="text-[#059669]" />
            <span>Juknis Wali Murid</span>
          </button>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all font-bold text-xs cursor-pointer"
          >
            <LogOut size={17} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header (Mobile only) */}
        <header className="lg:hidden bg-white border-b border-slate-100 px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-white border border-emerald-500/30 p-0.5">
              <img src="/assets/aistudio/image_24fdf8ff.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xs font-black text-slate-900 leading-none">Portal Wali</h1>
              <p className="text-[9px] font-black text-[#059669] uppercase tracking-widest mt-0.5">RA DARUSYIFA</p>
            </div>
          </div>
          
          <button onClick={() => setActiveTab('profile')} className="w-9 h-9 rounded-full border-2 border-white shadow-xs overflow-hidden bg-slate-100">
            {userData?.photoURL ? <img src={userData.photoURL} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-slate-400" />}
          </button>
        </header>

        <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-6xl mx-auto space-y-7 pb-32">
          {activeTab === 'overview' && (
            <div className="space-y-7 animate-in fade-in duration-500">
              {/* 1. Royal Blue Student Portal Hero Card */}
              <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#1d4ed8] via-[#1e54e8] to-[#2563eb] p-6 sm:p-8 text-white shadow-xl shadow-blue-600/15">
                <button
                  onClick={() => setActiveTab('announcements')}
                  className="absolute top-6 right-6 w-11 h-11 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 flex items-center justify-center transition-all cursor-pointer z-20"
                >
                  <Bell size={19} className="text-white" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-1 ring-white" />
                </button>

                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 shrink-0">
                    {userData?.photoURL ? (
                      <img src={userData.photoURL} alt={userData?.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600">
                        <User size={42} />
                      </div>
                    )}
                  </div>

                  <div className="text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#FACC15] text-slate-900 rounded-full text-[9px] font-black uppercase tracking-wider mb-2">
                      <span>• STUDENT PORTAL</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-[32px] font-black text-white tracking-tight leading-tight">
                      {userData?.student_name || userData?.name || 'Ananda'}
                    </h2>
                    <p className="text-xs sm:text-sm font-black text-[#FACC15] uppercase tracking-wide mt-0.5">
                      KELAS {userData?.kelas || 'UTSMAN BIN AFFAN'}
                    </p>
                    <p className="text-[11px] font-black text-white/95 uppercase tracking-wider mt-0.5">
                      RA DARUSYIFA ARJAWINANGUN
                    </p>
                    <p className="text-[10px] font-bold text-blue-100/90 uppercase tracking-widest mt-0.5">
                      TAHUN AJARAN 2026/2027
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/15 my-6" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                      <User size={16} className="text-blue-100" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">NISN / NOMOR INDUK</p>
                      <p className="text-sm font-black text-white leading-tight mt-0.5">{userData?.nisn || userData?.nis || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                      <Calendar size={16} className="text-blue-100" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">TEMPAT, TANGGAL LAHIR</p>
                      <p className="text-sm font-black text-white leading-tight mt-0.5">
                        {userData?.tempatLahir && userData?.tanggalLahir
                          ? `${userData.tempatLahir}, ${userData.tanggalLahir}`
                          : 'Cirebon, 12 Mei 2020'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Greeting & Kelas Aktif Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <div>
                  <h3 className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Ahlan Wa Sahlan,</span>
                    <span>👋</span>
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
                    Ayah & Bunda {userData?.student_name || userData?.name || 'Ananda'}
                  </p>
                </div>

                <div className="inline-flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 self-start sm:self-auto">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0">
                    <User size={17} />
                  </div>
                  <div className="pr-2">
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#059669]">KELAS AKTIF</p>
                    <p className="text-xs font-black text-slate-900 uppercase">{userData?.kelas || 'UTSMAN BIN AFFAN'}</p>
                  </div>
                  <ChevronRight size={15} className="text-slate-400" />
                </div>
              </div>

              {/* 3. Four Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <div onClick={() => setActiveTab('attendance')} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">KEHADIRAN</p>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mt-3 mb-3">
                      <Calendar size={19} />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight">{attendancePercentage}%</h4>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{hadirCount || 86} dari {totalActiveDays} hari</p>
                  </div>
                  <div className="mt-4">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full w-[90%]" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-blue-600 mt-3">Detail <ArrowRight size={12} /></span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PERKEMBANGAN</p>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mt-3 mb-3">
                      <Star size={19} />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">Baik Sekali</h4>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Predikat Semester 1</p>
                  </div>
                  <div className="mt-4">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full w-[85%]" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-600 mt-3">Detail <ArrowRight size={12} /></span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TABUNGAN</p>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center mt-3 mb-3">
                      <BookOpen size={19} />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">Rp {(userData?.savings || 0).toLocaleString('id-ID')}</h4>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Saldo Tabungan</p>
                  </div>
                  <div className="mt-4">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#059669] rounded-full w-[75%]" />
                    </div>
                    <span onClick={() => setActiveTab('administration')} className="inline-flex items-center gap-1 text-[11px] font-black text-[#059669] mt-3 cursor-pointer">Detail <ArrowRight size={12} /></span>
                  </div>
                </div>

                <div onClick={() => setActiveTab('administration')} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ADMINISTRASI</p>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mt-3 mb-3">
                      <Wallet size={19} />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight">{hasArrears ? 'Tagihan' : 'Lunas'}</h4>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      {hasArrears ? `Rp ${(userData?.arrears || 0).toLocaleString('id-ID')}` : 'Tidak ada tunggakan'}
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full w-full" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-purple-600 mt-3">Detail <ArrowRight size={12} /></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'administration' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-display font-black text-slate-900 tracking-tight">Keuangan & Iuran</h3>
                <Wallet size={48} className="text-emerald-600 opacity-20" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card-premium p-10 bg-slate-900 text-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Saldo Tabungan Santri</p>
                  <h4 className="text-5xl font-display font-black tabular-nums mb-8">Rp {(userData?.savings || 0).toLocaleString('id-ID')}</h4>
                  <div className="p-6 bg-white/10 rounded-[2rem] border border-white/10">
                    <p className="text-xs font-medium text-slate-300 leading-relaxed italic">
                      "Penyetoran tabungan dapat dilakukan secara tunai melalui Wali Kelas atau Bagian Tata Usaha sekolah."
                    </p>
                  </div>
                </div>
                <div className="card-premium p-10 border-rose-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tunggakan Iuran Terdeteksi</p>
                  <h4 className="text-5xl font-display font-black text-rose-600 tabular-nums mb-8">Rp {(userData?.arrears || 0).toLocaleString('id-ID')}</h4>
                  <div className="space-y-4">
                    {userData?.arrears_details?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="font-bold text-slate-700">{item.name}</span>
                        <span className="font-black text-rose-600">Rp {item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    {(!userData?.arrears_details || userData.arrears_details.length === 0) && (
                      <div className="text-center py-6">
                        <CheckCircle className="mx-auto text-emerald-500 mb-2" size={32} />
                        <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Semua iuran telah lunas</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between">
                <h3 className="text-3xl font-display font-black text-slate-900 tracking-tight">Kehadiran Ananda</h3>
                <CheckCircle size={48} className="text-emerald-600 opacity-20" />
              </div>
              <div className="card-premium overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                  <h4 className="text-xl font-display font-black text-slate-900 tracking-tight">Log Presensi Terkini</h4>
                </div>
                <div className="divide-y divide-slate-50">
                  {attendance.map((att, idx) => (
                    <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${att.status === 'Hadir' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <div>
                          <p className="font-black text-slate-900">{att.date}</p>
                          <p className="text-xs text-slate-400 font-bold">{att.notes || 'Presensi Harian'}</p>
                        </div>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${att.status === 'Hadir' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {att.status}
                      </span>
                    </div>
                  ))}
                  {attendance.length === 0 && <p className="p-20 text-center text-slate-400 italic">Belum ada data kehadiran.</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between">
                <h3 className="text-3xl font-display font-black text-slate-900 tracking-tight">Informasi Sekolah</h3>
                <Bell size={48} className="text-indigo-600 opacity-20" />
              </div>
              <div className="grid grid-cols-1 gap-8">
                {announcements.map((ann, idx) => (
                  <div key={idx} className="card-premium p-10 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                      <h4 className="text-2xl font-display font-black text-slate-900 tracking-tight">{ann.title}</h4>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{ann.date || 'Terbaru'}</span>
                    </div>
                    <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed announcement-html-content" dangerouslySetInnerHTML={{ __html: ann.content }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-[3rem] border-4 border-white shadow-xl overflow-hidden bg-slate-100 mb-6">
                  {userData?.photoURL ? <img src={userData.photoURL} className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-slate-300" />}
                </div>
                <h3 className="text-3xl font-display font-black text-slate-900 tracking-tight">{userData?.name}</h3>
                <p className="text-slate-500 font-medium mt-1">Orang Tua/Wali dari {userData?.student_name || 'Ananda'}</p>
              </div>
              <div className="card-premium p-10 space-y-8">
                <h4 className="text-xl font-display font-black text-slate-900 border-b border-slate-50 pb-4">Data Akun</h4>
                <div className="grid grid-cols-1 gap-6">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                    <p className="font-bold text-slate-900">{user?.email}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Role Akses</p>
                    <p className="font-bold text-slate-900">Wali Murid / Orang Tua</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2">
                  <LogOut size={18} /> Keluar Sesi
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
          { id: 'administration', label: 'Keuangan', icon: Wallet },
          { id: 'attendance', label: 'Absensi', icon: CheckCircle },
          { id: 'announcements', label: 'Informasi', icon: Bell },
          { id: 'profile', label: 'Profil', icon: User },
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
    </div>
  );
}
