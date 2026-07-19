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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-emerald-50">Memuat data portal wali...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-100 p-8 hidden md:flex flex-col shadow-sm">
        <div className="flex items-center gap-4 mb-14">
          <div className="w-12 h-12 bg-emerald-600 rounded-[1.25rem] flex items-center justify-center text-white font-black text-xl shadow-xl shadow-emerald-100">RA</div>
          <div>
            <h1 className="font-display font-black text-slate-900 leading-none tracking-tight">Portal Wali</h1>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-1.5 leading-none">Darusyifa</p>
          </div>
        </div>
        
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
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <item.icon size={20} />
              <span className="text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8 pt-8 border-t border-slate-50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-50 font-bold transition-all"
          >
            <LogOut size={20} />
            <span className="text-sm tracking-tight">Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Assalamu'alaikum, Bapak/Ibu {userData?.name}</h2>
              <p className="text-slate-500 font-medium mt-1">Selamat datang di Portal Digital RA Darusyifa Arjawinangun</p>
            </div>
            <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-[2rem] shadow-sm border border-slate-100">
               <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                 {userData?.photoURL ? <img src={userData.photoURL} className="w-full h-full rounded-full object-cover" /> : userData?.name?.charAt(0)}
               </div>
               <div>
                 <p className="text-xs font-black text-slate-900 leading-tight">{userData?.name}</p>
                 <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Wali Murid</p>
               </div>
            </div>
          </header>

          {activeTab === 'overview' && (
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

               <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between">
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
          )}

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
                          <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                            <div>
                              <p className="font-bold text-slate-900">{item.name}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category || 'Wajib'}</p>
                            </div>
                            <p className="font-black text-rose-600">Rp {item.amount.toLocaleString()}</p>
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
                        <div key={pay.id} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-emerald-100/50">
                          <div>
                            <p className="font-bold text-slate-900">{pay.description}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pay.date} • {pay.method}</p>
                          </div>
                          <div className="text-right">
                             <p className="font-black text-emerald-600">Rp {pay.amount.toLocaleString()}</p>
                             <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${pay.status === 'lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
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

          {/* Add other tabs as needed or keep it simple */}
        </div>
      </main>
    </div>
  );
}
