import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, orderBy, getDocs, deleteDoc } from 'firebase/firestore';
import { Camera, MapPin, CheckCircle, Clock, Calendar, User, LogOut, Bell, CreditCard, BookOpen, Edit, Save, X, Menu, Trash2, TrendingUp, BarChart as BarChartIcon, Printer } from 'lucide-react';
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
  const [progress, setProgress] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState('Hadir');
  const [quote, setQuote] = useState('');

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

  const handlePrintRapot = () => {
    if (!userData) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let itemsHtml = '';
    
    // Sort progress ascending by date or createdAt
    const sortedProgress = [...progress].sort((a,b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    sortedProgress.forEach((p, idx) => {
       const scoreNum = Number(p.score) || 0;
       const gradeInfo = getScoreGradeInfo(scoreNum);
       itemsHtml += `
         <tr>
           <td style="padding: 10px; border-bottom: 1px solid #eee;">${idx + 1}</td>
           <td style="padding: 10px; border-bottom: 1px solid #eee;">
             <strong style="display:block;">${p.title}</strong>
             <small style="color: #666;">${p.category}</small>
           </td>
           <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${scoreNum}</td>
           <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;"><strong>${gradeInfo.grade}</strong> <br><small>${gradeInfo.text}</small></td>
         </tr>
       `;
    });

    if (sortedProgress.length === 0) {
      itemsHtml = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #666; font-style: italic;">Belum ada data evaluasi belajar.</td></tr>`;
    }

    const html = `
      <html>
        <head>
          <title>Rapot Belajar - ${userData.name}</title>
          <style>
            ${getPrintStyles()}
          </style>
        </head>
        <body onload="window.print();">
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
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

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
          <title>Bukti Pembayaran - ${pay.description}</title>
          <style>
            ${getPrintStyles()}
          </style>
        </head>
        <body onload="window.print();">
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
      {/* Mobile Header */}
      <div className="md:hidden glass-3d p-4 flex justify-between items-center sticky top-0 z-40">
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 glass-3d flex justify-around items-center p-3 z-50 pb-safe rounded-t-[2.5rem]">
        {[
          { id: 'overview', icon: Calendar, label: 'Beranda' },
          { id: 'progress', icon: BookOpen, label: 'Laporan' },
          { id: 'attendance', icon: CheckCircle, label: 'Absensi' },
          { id: 'announcements', icon: Bell, label: 'Info' },
          { id: 'administration', icon: CreditCard, label: 'Admin' },
          { id: 'profile', icon: User, label: 'Profil' },
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)} 
            className={`flex flex-col items-center gap-1 p-0.5 transition-all ${activeTab === item.id ? 'text-green-600' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl transition-all ${activeTab === item.id ? 'bg-green-600 text-white shadow-xl shadow-green-100' : 'hover:bg-gray-50'}`}>
              <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            </div>
            <span className={`text-[7px] font-black uppercase tracking-[0.5px] transition-all duration-300 ${activeTab === item.id ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-1 h-0'}`}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">Halo, {userData?.name || 'Siswa'}!</h2>
            <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-2xl">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-xs md:text-sm text-green-700 font-bold italic">"{quote}"</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
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
          <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
            {/* Top Stat Bubbles for Unified UI */}
            <div className="card-3d p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 md:mb-10">Ringkasan Aktivitas</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: 'Total Kehadiran', value: attendance.length, color: 'bg-blue-500', icon: CheckCircle },
                  { label: 'Laporan Belajar', value: progress.length, color: 'bg-green-500', icon: BookOpen },
                  { label: 'Pengumuman', value: announcements.length, color: 'bg-purple-500', icon: Bell },
                  { label: 'Absensi Hari Ini', value: attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length > 0 ? 'Hadir' : '-', color: 'bg-orange-500', icon: Clock },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-gray-50/50 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-gray-100 flex flex-col items-center justify-center text-center group hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all">
                    <div className={`w-12 h-12 md:w-14 md:h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-opacity-20 mb-3 md:mb-4 group-hover:scale-110 transition-transform`}>
                      <stat.icon size={24} className="md:w-7 md:h-7" />
                    </div>
                    <p className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-widest mb-1">{stat.label}</p>
                    <h4 className="text-lg md:text-2xl font-black text-gray-800 tracking-tight">{stat.value}</h4>
                  </div>
                ))}
              </div>
            </div>

            {/* Riwayat Absensi Terakhir */}
            <div className="card-3d overflow-hidden">
               <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                 <h3 className="text-lg md:text-xl font-bold text-gray-800">Riwayat Kehadiran Terakhir</h3>
                <button onClick={() => setActiveTab('attendance')} className="text-[10px] md:text-xs font-bold text-green-600 hover:text-green-700 uppercase tracking-widest">Kehadiran Lengkap</button>
               </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                      <tr>
                       <th className="px-6 py-4 md:px-8 md:py-5">Tanggal</th>
                       <th className="px-6 py-4 md:px-8 md:py-5">Waktu</th>
                        <th className="px-6 py-4 md:px-8 md:py-5">Foto</th>
                        <th className="px-6 py-4 md:px-8 md:py-5">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {attendance.slice(0, 3).map((a) => (
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
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${a.status === 'masuk' || a.status === 'Hadir' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span>
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

               {/* Mobile View Kehadiran Terakhir */}
               <div className="md:hidden divide-y divide-gray-50 border-t border-gray-50">
                  {attendance.slice(0, 3).map((a) => (
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
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${a.status === 'masuk' || a.status === 'Hadir' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span>
                    </div>
                  ))}
                  {attendance.length === 0 && (
                    <div className="p-8 text-center text-gray-400 italic">Belum ada riwayat absensi.</div>
                  )}
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
                onClick={handlePrintRapot}
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
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                          <User size={14} /> Guru: {p.teacherName || 'Wali Kelas'}
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

        {activeTab === 'attendance' && (
          <div className="card-3d overflow-hidden animate-in slide-in-from-bottom duration-500">
            <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">Riwayat Absensi Lengkap</h3>
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 md:px-8 md:py-5">Tanggal</th>
                    <th className="px-6 py-4 md:px-8 md:py-5">Waktu</th>
                    <th className="px-6 py-4 md:px-8 md:py-5">Foto</th>
                    <th className="px-6 py-4 md:px-8 md:py-5">Status</th>
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
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${a.status === 'masuk' || a.status === 'Hadir' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span>
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
                   <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${a.status === 'masuk' || a.status === 'Hadir' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span>
                 </div>
               ))}
               {attendance.length === 0 && (
                 <div className="p-8 text-center text-gray-400 italic">Belum ada riwayat absensi.</div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'administration' && (
          <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
            <div className="card-3d p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 md:mb-10">Ringkasan Administrasi Keuangan</h3>
               <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                <div className="p-8 md:p-10 bg-gradient-to-br from-green-600 to-green-700 rounded-[24px] md:rounded-[32px] text-white shadow-xl shadow-green-100 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                   <h4 className="font-bold mb-3 md:mb-4 flex items-center gap-2 md:gap-3 text-green-100 uppercase tracking-widest text-[10px] md:text-xs"><CreditCard size={20} /> Saldo Tabungan</h4>
                  <p className="text-3xl md:text-4xl font-bold">Rp {(userData?.savings || 0).toLocaleString()}</p>
                   <p className="text-[10px] md:text-xs text-green-100/60 mt-3 md:mt-4 leading-relaxed italic">Gunakan tabungan untuk keperluan sekolah yang terencana.</p>
                 </div>
                 <div className="p-8 md:p-10 bg-gradient-to-br from-red-500 to-red-600 rounded-[24px] md:rounded-[32px] text-white shadow-xl shadow-red-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                   <h4 className="font-bold mb-3 md:mb-4 flex items-center gap-2 md:gap-3 text-red-100 uppercase tracking-widest text-[10px] md:text-xs"><CreditCard size={20} /> Total Tunggakan</h4>
                  <p className="text-3xl md:text-4xl font-bold">Rp {(userData?.arrears || 0).toLocaleString()}</p>
                   <p className="text-[10px] md:text-xs text-red-100/60 mt-3 md:mt-4 leading-relaxed italic">Harap segera lunasi tunggakan untuk kelancaran administrasi.</p>
                </div>
              </div>
            </div>

             <div className="card-3d overflow-hidden">
               <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">Riwayat Transaksi Finansial</h3>
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
                    {payments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 md:px-8 md:py-6 font-medium text-gray-700">{pay.date}</td>
                        <td className="px-6 py-4 md:px-8 md:py-6">
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
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center text-gray-400 italic">Belum ada riwayat transaksi finansial.</td>
                      </tr>
                     )}
                   </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden divide-y divide-gray-50">
                {payments.map((pay) => (
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
                        {pay.proof && (
                          <button 
                            onClick={() => setSelectedPhoto(pay.proof)}
                            className="text-[9px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md uppercase tracking-widest transition-colors"
                          >
                            Bukti
                          </button>
                        )}
                        <button 
                          onClick={() => handlePrintReceipt(pay)}
                          className="text-[9px] font-black text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-md uppercase tracking-widest transition-colors"
                        >
                          Cetak
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <p className="text-gray-400 italic text-xs">Belum ada riwayat transaksi finansial.</p>
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
              {announcements.map((ann) => (
                <div key={ann.id} className="card-3d p-6 md:p-8">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg md:text-xl font-bold text-gray-800">{ann.title}</h4>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{ann.date}</span>
                  </div>
                  <div className="markdown-body">
                    <ReactMarkdown>{ann.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="bg-white p-12 rounded-[32px] border border-dashed border-gray-200 text-center text-gray-400 font-medium">
                  Belum ada pengumuman baru.
                </div>
              )}
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
