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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-24 flex-col items-center py-10 bg-white border-r border-slate-100 sticky top-0 h-screen overflow-y-auto custom-scrollbar">
        <img src="/assets/aistudio/image_24fdf8ff.png" alt="Logo" className="w-12 h-12 object-contain mb-10" />
        <nav className="flex-1 space-y-4">
          {[
            { id: 'overview', icon: Home, label: 'Home' },
            { id: 'administration', icon: Wallet, label: 'Uang' },
            { id: 'attendance', icon: CheckCircle, label: 'Absen' },
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
                <motion.div layoutId="active-pill-parent" className="absolute -left-1 w-1 h-8 bg-slate-900 rounded-r-full" />
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
              <h1 className="text-sm font-black uppercase tracking-widest text-slate-400 leading-none">Portal Wali Murid</h1>
              <p className="text-lg font-display font-black text-slate-900 tracking-tight">RA Darusyifa Arjawinangun</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-xs font-black text-slate-900">{userData?.name}</p>
              <p className="text-[10px] font-bold text-slate-400">Wali dari {userData?.student_name || 'Ananda'}</p>
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
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-10 -mb-10" />
                
                <div className="relative z-10 space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full">
                    <Sparkles size={12} className="text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Parent Dashboard</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-display font-black tracking-tight leading-tight">
                    Selamat Datang, <br />
                    <span className="text-blue-400">Ayah/Bunda {userData?.name?.split(' ')[0]} 🌸</span>
                  </h2>
                  <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">
                    Pantau perkembangan akademik, kehadiran, dan administrasi Ananda dengan mudah melalui portal digital ini.
                  </p>
                </div>
              </section>

              {/* Bento Grid Stats */}
              <div className="bento-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <div className="bento-card bg-emerald-600 text-white group">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Wallet size={28} />
                  </div>
                  <p className="text-xs font-black text-emerald-100 uppercase tracking-widest mb-1">Saldo Tabungan Ananda</p>
                  <h3 className="text-4xl font-display font-black tabular-nums">Rp {(userData?.savings || 0).toLocaleString('id-ID')}</h3>
                  <div className="mt-6 p-4 bg-white/10 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-medium text-emerald-50 leading-tight italic">Setoran tabungan online belum tersedia saat ini.</p>
                  </div>
                </div>

                <div className="bento-card bg-white group">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <CreditCard size={28} />
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Tunggakan Iuran</p>
                  <h3 className="text-4xl font-display font-black text-rose-600 tabular-nums">Rp {(userData?.arrears || 0).toLocaleString('id-ID')}</h3>
                  <button onClick={() => setActiveTab('administration')} className="mt-6 text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">Rincian Tagihan <ArrowRight size={14} /></button>
                </div>

                <div className="bento-card bg-white group">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <CheckCircle size={28} />
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Kehadiran (Bulan Ini)</p>
                  <h3 className="text-4xl font-display font-black text-slate-900 tabular-nums">
                    {attendance.filter(a => {
                      const d = new Date(a.date);
                      const now = new Date();
                      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && a.status === 'Hadir';
                    }).length} Hari
                  </h3>
                  <button onClick={() => setActiveTab('attendance')} className="mt-6 text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">Log Absensi <ArrowRight size={14} /></button>
                </div>
              </div>

              {/* Announcements Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight">Informasi Sekolah</h3>
                  <button onClick={() => setActiveTab('announcements')} className="text-xs font-black text-blue-600 uppercase tracking-widest">Lihat Semua</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {announcements.slice(0, 2).map((ann, idx) => (
                    <div key={idx} className="card-premium p-8 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                          <Megaphone size={20} />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 truncate">{ann.title}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{ann.date || 'Terbaru'}</p>
                        </div>
                      </div>
                      <div className="text-sm text-slate-500 line-clamp-3 prose" dangerouslySetInnerHTML={{ __html: ann.content }} />
                    </div>
                  ))}
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
