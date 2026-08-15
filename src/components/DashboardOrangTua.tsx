import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, orderBy, getDocs, setDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { Camera, CheckCircle, Clock, Calendar, User, LogOut, Bell, CreditCard, BookOpen, Save, X, Menu, Star, Megaphone, AlertCircle, Image as ImageIcon, FileText, Download, ExternalLink, RefreshCw, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { compressImage } from '../lib/imageUtils';
import { getPrintHeaderHTML, getPrintStyles, getPrintSignatureHTML } from '../lib/printUtils';

export default function DashboardOrangTua() {
 const [user, setUser] = useState<any>(null);
 const [userData, setUserData] = useState<any>(null);
 const [attendance, setAttendance] = useState<any[]>([]);
 const [announcements, setAnnouncements] = useState<any[]>([]);
 const [payments, setPayments] = useState<any[]>([]);
 const [settings, setSettings] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 const [activeTab, setActiveTab] = useState('overview');
 const navigate = useNavigate();

 useEffect(() => {
 const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
 if (currentUser) {
 try {
 const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
 if (!userDoc.exists() || userDoc.data().role !== 'parent') {
 // Check if user is actually a student but trying to access parent dashboard
 if (userDoc.exists() && userDoc.data().role === 'siswa') {
 navigate('/siswa-dashboard');
 return;
 }
 navigate('/login');
 return;
 }
 
 setUser(currentUser);
 setUserData(userDoc.data());
 } catch (error) {
 console.error('Error verifying parent role:', error);
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
 (snapshot) => setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
 );

 const unsubAnnounce = onSnapshot(
 query(collection(db, 'announcements'), orderBy('createdAt', 'desc')),
 (snapshot) => setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
 );

 const unsubPayments = onSnapshot(
 query(collection(db, 'payments'), where('studentId', '==', user.uid), orderBy('date', 'desc')),
 (snapshot) => {
 setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 setLoading(false);
 }
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
 { id: 'overview', label: 'Dashboard', icon: Home },
 { id: 'administration', label: 'Keuangan & Iuran', icon: CreditCard },
 { id: 'attendance', label: 'Kehadiran Anak', icon: CheckCircle },
 { id: 'announcements', label: 'Informasi Sekolah', icon: Bell },
 { id: 'profile', label: 'Pengaturan Akun', icon: User },
 ].map((item) => (
 <button 
 key={item.id}
 onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
 className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900 '}`}
 >
 <item.icon size={20} />
 <span className="text-sm tracking-tight">{item.label}</span>
 </button>
 ))}
 </nav>
 );

 if (loading) return <div className="min-h-screen flex items-center justify-center bg-emerald-50 text-slate-700 ">Memuat data portal wali...</div>;

 return (
 <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-20 md:pb-0 font-sans text-slate-900 relative transition-colors duration-300">
 {/* Sidebar (Desktop) */}
 <aside className="w-72 bg-white border-r border-slate-100 p-8 hidden md:flex flex-col shadow-sm transition-colors duration-300">
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
 <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-1.5 leading-none">Darusyifa</p>
 </div>
 </div>
 
 <NavItems />

 <div className="mt-8 pt-8 border-t border-slate-50 ">
 <button 
 onClick={handleLogout}
 className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-50 font-bold transition-all"
 >
 <LogOut size={20} />
 <span className="text-sm tracking-tight">Keluar Sesi</span>
 </button>
 </div>
 </aside>

 {/* Bottom Navigation Bar (Mobile) */}
 <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] flex justify-around items-center py-2 px-2 z-[100]" style={{ WebkitBackdropFilter: 'blur(16px)' }}>
 {[
 { id: 'overview', label: 'Beranda', icon: Home },
 { id: 'administration', label: 'Keuangan', icon: CreditCard },
 { id: 'attendance', label: 'Absensi', icon: CheckCircle },
 { id: 'announcements', label: 'Informasi', icon: Bell },
 { id: 'profile', label: 'Profil', icon: User },
 ].map((item) => (
 <button
 key={item.id}
 onClick={() => setActiveTab(item.id)}
 className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all py-1 ${activeTab === item.id ? 'text-emerald-600 ' : 'text-slate-400 hover:text-slate-600 '}`}
 >
 <div className={`p-1.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-emerald-50 text-emerald-600 scale-110 shadow-sm' : 'text-slate-400 '}`}>
 <item.icon size={20} />
 </div>
 <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
 </button>
 ))}
 </div>

 {/* Main Content */}
 <main className="flex-1 overflow-y-auto">
 {/* Top Bar / Mobile Header - Consistent with screenshot */}
 <div className="md:hidden flex items-center justify-between p-4 bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-[100] shadow-sm">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 overflow-hidden rounded-xl border-2 border-emerald-600/10 p-1 bg-white shadow-sm flex items-center justify-center">
 <img 
 src="/logo_ra.jpeg" 
 alt="Logo" 
 className="w-full h-full object-contain" 
 />
 </div>
 <h2 className="font-display font-black text-slate-900 tracking-tight text-sm">Portal Wali</h2>
 </div>
 <button 
 onClick={handleLogout}
 className="p-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 hover:bg-rose-100 transition-colors flex items-center gap-1.5 px-3 py-1.5 shadow-sm"
 title="Keluar Sesi"
 >
 <LogOut size={16} />
 <span className="text-[11px] font-bold">Keluar</span>
 </button>
 </div>

 <div className="p-4 md:p-12 max-w-6xl mx-auto space-y-8">
 {activeTab === 'overview' && (
 <div className="space-y-6 pb-24 md:pb-0 animate-in fade-in duration-500">
 {/* Mobile Profile Header - Sakinah Style */}
 <div className="md:hidden -mx-4 -mt-4 mb-6 bg-blue-600 bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-b-[40px] text-white relative shadow-2xl overflow-hidden">
 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
 <div className="flex justify-between items-center mb-6 relative z-10 pt-4">
 <div className="text-center flex-1">
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
 <p className="text-[8px] text-blue-900 font-black uppercase tracking-wider">Parent Portal</p>
 </div>
 <h2 className="text-xl font-black tracking-tight leading-tight text-white mb-1">
 {userData?.name || 'Wali Murid'}
 </h2>
 <div className="flex flex-col mt-1">
 <p className="text-[10px] opacity-90 font-black text-yellow-300 leading-tight uppercase tracking-tighter">
 Ayah/Bunda Ananda
 </p>
 <p className="text-[9px] mt-0.5 opacity-80 font-bold text-white leading-tight uppercase tracking-widest">
 {settings?.schoolName || 'RA Darusyifa Arjawinangun'}
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* Dashboard Header - Sticky */}
 <div className="md:sticky md:top-0 z-20 bg-slate-50/80 backdrop-blur-md py-4 -mx-4 px-4 md:-mx-12 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-transparent transition-all">
 <div>
 <h2 className="text-3xl font-black text-slate-900 tracking-tight">Assalamu'alaikum, Bapak/Ibu {userData?.name}</h2>
 <p className="text-slate-500 font-medium mt-1">Selamat datang di Portal Digital RA Darusyifa Arjawinangun</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
 <div className="bg-emerald-600 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
 <CreditCard className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12 group-hover:scale-110 transition-transform" />
 <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Total Tunggakan Iuran</p>
 <h3 className="text-4xl font-black tracking-tight">Rp {(userData?.arrears || 0).toLocaleString('id-ID')}</h3>
 <button onClick={() => setActiveTab('administration')} className="mt-6 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Rincian Pembayaran</button>
 </div>
 
 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
 <div>
 <CheckCircle className="text-emerald-500 mb-4" size={32} />
 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kehadiran Bulan Ini</p>
 <h3 className="text-3xl font-black text-slate-900 tracking-tight">
 {attendance.filter(a => {
 const date = new Date(a.date);
 const now = new Date();
 return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() && a.status === 'Hadir';
 }).length} Hari
 </h3>
 </div>
 <button onClick={() => setActiveTab('attendance')} className="mt-6 text-xs font-black text-emerald-600 uppercase tracking-widest text-left">Lihat Kalender Kehadiran →</button>
 </div>

 <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] border border-slate-800 shadow-xl flex flex-col justify-between">
 <div>
 <Bell className="text-indigo-400 mb-4" size={32} />
 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pengumuman Terbaru</p>
 <h3 className="text-xl font-black tracking-tight leading-tight">
 {announcements[0]?.title || 'Belum ada informasi terbaru'}
 </h3>
 </div>
 <button onClick={() => setActiveTab('announcements')} className="mt-6 text-xs font-black text-indigo-400 uppercase tracking-widest text-left">Buka Semua Informasi →</button>
 </div>
 </div>
 </div>
 )}
 </div>

 <div className="p-4 md:p-12 max-w-6xl mx-auto space-y-8">
 {activeTab === 'administration' && (
 <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Rincian Keuangan & Iuran</h3>
 <p className="text-slate-500 font-medium">Pantau kewajiban iuran dan riwayat pembayaran ananda</p>
 </div>
 <CreditCard className="text-emerald-600 opacity-20" size={48} />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2rem]">
 <h4 className="text-rose-900 font-black uppercase tracking-widest text-xs mb-4">Daftar Tunggakan</h4>
 {userData?.arrears_details && userData.arrears_details.length > 0 ? (
 <div className="space-y-4">
 {userData.arrears_details.map((item: any, idx: number) => (
 <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-rose-100/50 ">
 <div>
 <p className="font-bold text-slate-900 ">{item.name}</p>
 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category || 'Wajib'}</p>
 </div>
 <p className="font-black text-rose-600 ">Rp {item.amount.toLocaleString()}</p>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-8 text-rose-400">
 <CheckCircle className="mx-auto mb-2 opacity-50" />
 <p className="text-sm font-bold uppercase tracking-widest">Semua iuran telah lunas</p>
 </div>
 )}
 </div>

 <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2rem]">
 <h4 className="text-emerald-900 font-black uppercase tracking-widest text-xs mb-4">Riwayat Pembayaran Terakhir</h4>
 <div className="space-y-4">
 {payments.slice(0, 5).map((pay: any) => (
 <div key={pay.id} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-emerald-100/50 ">
 <div>
 <p className="font-bold text-slate-900 ">{pay.description}</p>
 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pay.date} • {pay.method}</p>
 </div>
 <div className="text-right">
 <p className="font-black text-emerald-600 ">Rp {pay.amount.toLocaleString()}</p>
 <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${pay.status === 'lunas' ? 'bg-emerald-100 text-emerald-700 ' : 'bg-amber-100 text-amber-700 '}`}>
 {pay.status}
 </span>
 </div>
 </div>
 ))}
 {payments.length === 0 && (
 <p className="text-center py-8 text-emerald-400 text-sm font-bold opacity-50 uppercase tracking-widest">Belum ada riwayat pembayaran</p>
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Profile & Settings Tab */}
 {activeTab === 'profile' && (
 <div className="space-y-8 max-w-2xl mx-auto md:mx-0">
 <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
 <h3 className="text-2xl font-black text-slate-900 mb-6">Pengaturan Akun Orang Tua / Wali</h3>
 <div className="space-y-4">
 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 ">
 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap Wali</p>
 <p className="text-base font-black text-slate-800 mt-1">{userData?.name || '-'}</p>
 </div>
 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 ">
 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Akun</p>
 <p className="text-base font-black text-slate-800 mt-1">{user?.email || '-'}</p>
 </div>
 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 ">
 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Siswa Terhubung</p>
 <p className="text-base font-black text-slate-800 mt-1">{userData?.student_name || 'Ananda ' + (userData?.name || '')}</p>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 </main>
 </div>
 );
}
