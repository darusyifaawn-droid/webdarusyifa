import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, orderBy, getDocs, deleteDoc } from 'firebase/firestore';
import { Camera, MapPin, CheckCircle, Clock, Calendar, User, LogOut, Bell, CreditCard, BookOpen, Edit, Save, X, Menu, Trash2, TrendingUp, BarChart as BarChartIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { compressImage } from '../lib/imageUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

export default function DashboardSiswa() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState('Hadir');

  const handlePrintReceipt = (pay: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(pay.amount);
    const transactionId = `TRX-${pay.id.substring(0, 10).toUpperCase()}`;
    const dateStr = pay.date || new Date().toLocaleDateString('id-ID');
    const methodStr = pay.method || (pay.type === 'tabungan' ? 'Tabungan' : 'Tunai');

    const html = `
      <html>
        <head>
          <title>Struk Pembayaran - ${pay.description}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
            body { 
              font-family: 'JetBrains Mono', monospace; 
              padding: 20px; 
              color: #000; 
              background: #f5f5f5;
              display: flex;
              justify-content: center;
              -webkit-print-color-adjust: exact;
            }
            .receipt { 
              background: #fff;
              width: 300px; 
              padding: 20px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { font-size: 16px; margin: 0; text-transform: uppercase; font-weight: 700; }
            .header p { font-size: 11px; margin: 5px 0 0; color: #666; }
            
            .info { font-size: 10px; margin-bottom: 15px; border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; padding: 10px 0; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .info-label { color: #666; }
            
            .items { font-size: 10px; margin-bottom: 15px; }
            .items-header { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 5px; }
            .item-row { margin-bottom: 10px; }
            .item-main { display: flex; justify-content: space-between; font-weight: bold; }
            .item-sub { color: #666; font-size: 9px; }
            
            .totals { font-size: 11px; border-top: 1px dashed #ccc; padding-top: 10px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .total-row.grand-total { font-weight: bold; font-size: 13px; margin-top: 5px; padding-top: 5px; border-top: 1px solid #000; }
            .change-row { color: #166534; font-weight: bold; }
            
            .footer { margin-top: 25px; text-align: center; font-size: 9px; color: #666; border-top: 1px dashed #ccc; padding-top: 15px; line-height: 1.4; }
            
            @media print {
              body { background: none; padding: 0; }
              .receipt { box-shadow: none; width: 100%; border: none; }
            }
          </style>
        </head>
        <body onload="window.print();">
          <div class="receipt">
            <div class="header">
              <h1>${settings?.schoolName || 'RA DARUSYIFA'}</h1>
              <p>Official Sales Receipt</p>
            </div>
            
            <div class="info">
              <div class="info-row">
                <span class="info-label">Siswa:</span>
                <span>${userData?.name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">No. Transaksi:</span>
                <span>${transactionId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Tanggal:</span>
                <span>${dateStr}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Metode:</span>
                <span>${methodStr}</span>
              </div>
            </div>

            <div class="items">
              <div class="items-header">
                <span>ITEM</span>
                <span>SUBTOTAL</span>
              </div>
              <div class="item-row">
                <div class="item-main">
                  <span>${pay.description}</span>
                  <span>${formattedAmount}</span>
                </div>
                <div class="item-sub">1 x ${formattedAmount}</div>
              </div>
            </div>

            <div class="totals">
              <div class="total-row grand-total">
                <span>Total</span>
                <span>${formattedAmount}</span>
              </div>
              <div class="total-row">
                <span>Bayar</span>
                <span>${formattedAmount}</span>
              </div>
              <div class="total-row change-row">
                <span>Kembalian</span>
                <span>Rp 0</span>
              </div>
            </div>

            <div class="footer">
              Terima kasih telah melakukan pembayaran.<br>
              Simpan struk ini sebagai bukti transaksi yang sah.<br>
              <br>
              © ${new Date().getFullYear()} ${settings?.schoolName || 'RA Darusyifa'}
            </div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };
  
  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
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
          setUserData(userDoc.data());
          setEditName(userDoc.data().name);
          setEditPhoto(userDoc.data().photoURL || '');
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

    return () => {
      unsubAttendance();
      unsubProgress();
      unsubAnnounce();
      unsubPayments();
      unsubSettings();
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
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: editName,
        photoURL: editPhoto
      });
      setUserData({ ...userData, name: editName, photoURL: editPhoto });
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
        onClick={() => { setActiveTab('progress'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'progress' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <BookOpen size={20} className={activeTab === 'progress' ? 'text-white' : 'text-gray-400'} /> Laporan Belajar
      </button>
      <button 
        onClick={() => { setActiveTab('finance'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'finance' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <CreditCard size={20} className={activeTab === 'finance' ? 'text-white' : 'text-gray-400'} /> Administrasi
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
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-100 p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {settings?.logoUrl ? (
            <div className="w-10 h-10 overflow-hidden rounded-xl border border-green-600 bg-white">
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-green-200">RA</div>
          )}
          <div>
            <span className="font-bold text-gray-800 block leading-tight">Portal Siswa</span>
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">RA Darusyifa</span>
          </div>
        </div>
        <button onClick={() => auth.signOut()} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
          <LogOut size={20} />
        </button>
      </div>

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
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[2px] mt-1">RA Darusyifa</p>
          </div>
        </div>
        <NavItems />
        <div className="mt-auto pt-10 border-t border-gray-50">
          <button onClick={() => auth.signOut()} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-50 text-red-600 font-bold transition-all group text-sm">
            <div className="p-2.5 bg-red-100/50 rounded-xl group-hover:bg-red-100 transition-colors"><LogOut size={18} /></div>
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-gray-100 flex justify-around items-center p-3 z-50 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
        {[
          { id: 'overview', icon: Calendar, label: 'Beranda' },
          { id: 'progress', icon: BookOpen, label: 'Laporan' },
          { id: 'finance', icon: CreditCard, label: 'Biaya' },
          { id: 'announcements', icon: Bell, label: 'Info' },
          { id: 'profile', icon: User, label: 'Profil' },
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)} 
            className={`flex flex-col items-center gap-1.5 p-1 transition-all ${activeTab === item.id ? 'text-green-600' : 'text-gray-400'}`}
          >
            <div className={`p-2.5 rounded-2xl transition-all ${activeTab === item.id ? 'bg-green-600 text-white shadow-xl shadow-green-100' : 'hover:bg-gray-50'}`}>
              <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            </div>
            <span className={`text-[8px] font-black uppercase tracking-[1px] transition-all duration-300 ${activeTab === item.id ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-1 h-0'}`}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Halo, {userData?.name || 'Siswa'}!</h2>
            <p className="text-gray-500 text-sm">Selamat datang kembali di portal belajar Anda.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button 
              onClick={startCamera}
              className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-100"
            >
              <Camera size={20} /> Absen Sekarang
            </button>
            <button 
              onClick={() => setActiveTab('progress')}
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <BookOpen size={20} /> Lihat Laporan
            </button>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Kehadiran', value: attendance.length, color: 'bg-blue-500', icon: CheckCircle },
                { label: 'Laporan Belajar', value: progress.length, color: 'bg-green-500', icon: BookOpen },
                { label: 'Tabungan', value: `Rp ${(userData?.savings || 0).toLocaleString()}`, color: 'bg-orange-500', icon: CreditCard },
                { label: 'Info Terbaru', value: announcements.length, color: 'bg-purple-500', icon: Bell },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center group hover:shadow-xl hover:shadow-gray-200/50 transition-all">
                  <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-opacity-20 mb-4 group-hover:scale-110 transition-transform`}>
                    <stat.icon size={28} />
                  </div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                  <h4 className="text-lg font-black text-gray-800 tracking-tight">{stat.value}</h4>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                    <TrendingUp size={24} className="text-blue-500" /> Perkembangan Nilai
                  </h3>
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase text-gray-400">Statistik Belajar</span>
                  </div>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[...progress].reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" fontSize={10} tick={{fill: '#94a3b8', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} tick={{fill: '#94a3b8', fontWeight: 'bold'}} domain={[0, 100]} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '15px'}} />
                      <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={5} dot={{r: 6, fill: '#3b82f6', strokeWidth: 3, stroke: '#fff'}} activeDot={{r: 8, strokeWidth: 0}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                <h3 className="text-xl font-black text-gray-800 mb-10 flex items-center gap-3">
                  <BarChartIcon size={24} className="text-purple-500" /> Status Kelulusan
                </h3>
                <div className="flex-1 min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Lulus', value: progress.filter(p => p.status === 'Lulus').length },
                          { name: 'Ulang', value: progress.filter(p => p.status === 'Mengulang').length },
                          { name: 'Belum', value: progress.filter(p => p.status === 'Belum Lulus').length },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip contentStyle={{borderRadius: '20px', border: 'none'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 mt-6">
                  {[
                    { label: 'Lulus', color: 'bg-green-500', count: progress.filter(p => p.status === 'Lulus').length },
                    { label: 'Ulang', color: 'bg-red-500', count: progress.filter(p => p.status === 'Mengulang').length },
                    { label: 'Belum', color: 'bg-yellow-500', count: progress.filter(p => p.status === 'Belum Lulus').length },
                  ].map(l => (
                    <div key={l.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 ${l.color} rounded-full shadow-sm`}></div>
                        <span className="text-xs font-black uppercase text-gray-500 tracking-wider text-[10px]">{l.label}</span>
                      </div>
                      <span className="text-sm font-black text-gray-800">{l.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-black text-gray-800 tracking-tight">Riwayat Absensi Terakhir</h3>
                  <button onClick={() => setActiveTab('attendance')} className="text-xs font-bold text-green-600 hover:text-green-700">Lihat Semua</button>
                </div>
                <div className="divide-y divide-gray-100">
                  {attendance.slice(0, 5).map((a) => (
                    <div key={a.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        {a.photo ? (
                          <div className="relative">
                            <img src={a.photo} alt="Absensi" className="w-12 h-12 rounded-2xl object-cover cursor-pointer hover:opacity-80 ring-2 ring-gray-50" onClick={() => setSelectedPhoto(a.photo)} />
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${a.status === 'Hadir' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                            <Clock size={24} />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${a.status === 'Hadir' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span>
                            <span className="text-[10px] font-bold text-gray-400">{a.date}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{a.timestamp?.toDate ? a.timestamp.toDate().toLocaleTimeString('id-ID') : '00:00'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.location && a.location.latitude !== 0 && (
                          <a href={`https://www.google.com/maps?q=${a.location.latitude},${a.location.longitude}`} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all">
                            <MapPin size={18} />
                          </a>
                        )}
                        <button onClick={async () => {
                          if(window.confirm('Hapus riwayat absensi ini?')) {
                            try {
                              await deleteDoc(doc(db, 'attendance', a.id));
                              alert('Absensi berhasil dihapus!');
                            } catch (error) {
                              handleFirestoreError(error, OperationType.DELETE, `attendance/${a.id}`);
                            }
                          }
                        }} className="text-gray-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                  {attendance.length === 0 && <div className="p-10 text-center text-gray-400 text-sm font-medium">Belum ada riwayat absensi.</div>}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-black text-gray-800 tracking-tight">Info Sekolah</h3>
                  <Bell size={20} className="text-yellow-500" />
                </div>
                <div className="space-y-6">
                  {announcements.slice(0, 4).map((item) => (
                    <div key={item.id} className="group cursor-pointer">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">{item.date}</p>
                      <h4 className="text-sm font-bold text-gray-700 group-hover:text-green-600 transition-colors">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.content}</p>
                    </div>
                  ))}
                  {announcements.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Belum ada info terbaru.</p>}
                  <button onClick={() => setActiveTab('announcements')} className="w-full py-3 text-sm font-bold text-green-600 hover:bg-green-50 rounded-xl transition-all border border-dashed border-green-200 mt-4">
                    Lihat Semua Info
                  </button>
                </div>
              </div>
            </div>

            {/* Account Info (Savings/Arrears) */}
            <div className="bg-emerald-900 text-white rounded-[2.5rem] p-10 shadow-xl shadow-green-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
              
              <div className="relative z-10 grid md:grid-cols-2 gap-10">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-white/10 rounded-2xl">
                      <CreditCard size={24} className="text-emerald-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Status Keuangan</h3>
                      <p className="text-emerald-300 text-xs">Informasi tabungan & administrasi</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <p className="text-emerald-300 text-xs uppercase font-bold tracking-widest mb-1 opacity-70">Total Tabungan Anda</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-emerald-300">Rp</span>
                        <span className="text-4xl font-black">{(userData?.savings || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/5">
                      <p className="text-red-300 text-[10px] uppercase font-black tracking-widest mb-2">Total Tunggakan</p>
                      <p className="text-2xl font-black text-red-400">Rp {(userData?.arrears || 0).toLocaleString()}</p>
                      {userData?.arrears > 0 && (
                        <p className="text-[10px] text-red-200 mt-2">Mohon segera selesaikan administrasi Anda.</p>
                      )}
                    </div>
                  </div>
                </div>

                {userData?.arrears_details && userData.arrears_details.length > 0 && (
                  <div className="bg-black/20 rounded-[2rem] p-8">
                    <h4 className="text-sm font-bold text-emerald-100 mb-6 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                      Rincian Tunggakan
                    </h4>
                    <ul className="space-y-4 max-h-[240px] overflow-y-auto custom-scrollbar pr-2">
                      {userData.arrears_details.map((detail: any, index: number) => (
                        <li key={index} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                          <div>
                            <span className="block font-bold text-sm">{detail.name}</span>
                            <span className="text-[10px] text-emerald-300/60">{detail.date}</span>
                          </div>
                          <span className="font-black text-red-300 text-sm">Rp {detail.amount.toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Perkembangan Belajar</h3>
            <div className="grid gap-6">
              {progress.map(p => (
                <div key={p.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-lg font-bold text-gray-800">{p.title}</h4>
                      <p className="text-sm text-gray-400">{p.date}</p>
                      {p.target && <p className="text-blue-600 text-sm mt-2 font-medium">Target: {p.target}</p>}
                      {p.status && (
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                          p.status === 'Lulus' ? 'bg-green-100 text-green-700' :
                          p.status === 'Mengulang' ? 'bg-red-100 text-red-700' :
                          p.status === 'Lanjut Perkembangan Lain' ? 'bg-purple-100 text-purple-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {p.status}
                        </span>
                      )}
                    </div>
                    <span className="px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold uppercase">{p.category}</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-6">{p.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <User size={14} /> Guru: {p.teacherName || 'Wali Kelas'}
                  </div>
                </div>
              ))}
              {progress.length === 0 && (
                <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
                  Belum ada laporan perkembangan.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-8">
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-10">Ringkasan Keuangan</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-10 bg-gradient-to-br from-green-600 to-green-700 rounded-[32px] text-white shadow-xl shadow-green-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <h4 className="font-bold mb-4 flex items-center gap-3 text-green-100 uppercase tracking-widest text-xs"><CreditCard size={20} /> Saldo Tabungan</h4>
                  <p className="text-4xl font-bold">Rp {(userData?.savings || 0).toLocaleString()}</p>
                  <p className="text-xs text-green-100/60 mt-4 leading-relaxed italic">Gunakan tabungan untuk keperluan sekolah yang terencana.</p>
                </div>
                <div className="p-10 bg-gradient-to-br from-red-500 to-red-600 rounded-[32px] text-white shadow-xl shadow-red-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <h4 className="font-bold mb-4 flex items-center gap-3 text-red-100 uppercase tracking-widest text-xs"><CreditCard size={20} /> Total Tunggakan</h4>
                  <p className="text-4xl font-bold">Rp {(userData?.arrears || 0).toLocaleString()}</p>
                  <p className="text-xs text-red-100/60 mt-4 leading-relaxed italic">Harap segera lunasi tunggakan untuk kelancaran administrasi.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-800">Riwayat Pembayaran & Tabungan</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-5">Tanggal</th>
                      <th className="px-8 py-5">Keterangan</th>
                      <th className="px-8 py-5">Jenis</th>
                      <th className="px-8 py-5 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6 font-medium text-gray-700">{pay.date}</td>
                        <td className="px-8 py-6">
                          <p className="font-bold text-gray-800">{pay.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] text-gray-400 uppercase tracking-tight">ID: {pay.id.substring(0,8)}</p>
                            {pay.method && (
                              <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md font-bold uppercase tracking-widest">{pay.method}</span>
                            )}
                            {pay.proof && (
                              <button 
                                onClick={() => setSelectedPhoto(pay.proof)}
                                className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest"
                              >
                                Lihat Bukti
                              </button>
                            )}
                            <button 
                              onClick={() => handlePrintReceipt(pay)}
                              className="text-[10px] font-black text-green-600 hover:underline uppercase tracking-widest"
                            >
                              Cetak Bukti
                            </button>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${pay.type === 'tabungan' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {pay.type === 'tabungan' ? 'Tabungan' : 'Iuran/SPP'}
                          </span>
                        </td>
                        <td className={`px-8 py-6 text-right font-bold text-lg ${pay.type === 'tabungan' ? 'text-green-600' : 'text-blue-600'}`}>
                          Rp {pay.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center text-gray-400 italic">Belum ada riwayat transaksi finansial.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Semua Pengumuman</h3>
            <div className="grid gap-4">
              {announcements.map(a => (
                <div key={a.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <h4 className="font-bold text-gray-800 text-xl">{a.title}</h4>
                  <div className="text-gray-600 text-sm mt-4 leading-relaxed whitespace-pre-wrap">{a.content}</div>
                  <div className="mt-6 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                    {a.author} • {a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleString() : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto md:mx-0 animate-in slide-in-from-bottom duration-500">
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
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest leading-relaxed">RA Darusyifa - Portal Siswa</p>
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
