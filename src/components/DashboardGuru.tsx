import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, getDoc, doc, updateDoc, deleteDoc, orderBy, where, getDocs } from 'firebase/firestore';
import { Users, BookOpen, Plus, Trash2, Edit, LogOut, User, Bell, CheckCircle, X, Menu, Save, Camera, Clock, BarChart as BarChartIcon, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { compressImage } from '../lib/imageUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

export default function DashboardGuru() {
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  
  // Form States
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [editingProgress, setEditingProgress] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [progressTitle, setProgressTitle] = useState('');
  const [progressCategory, setProgressCategory] = useState('Akademik');
  const [progressDesc, setProgressDesc] = useState('');
  const [progressTarget, setProgressTarget] = useState('');
  const [progressStatus, setProgressStatus] = useState('Belum Lulus');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState('');

  // Camera States
  const [showCamera, setShowCamera] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('Hadir'); // Hadir, Sakit, Izin, TK
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Photo Viewer State
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (!userDoc.exists() || userDoc.data().role !== 'guru') {
            navigate('/login');
            return;
          }
          
          setUser(currentUser);
          setEditName(userDoc.data().name || '');
          setEditPhoto(userDoc.data().photoURL || '');
        } catch (error) {
          console.error('Error verifying guru role:', error);
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

    // Listeners
    const unsubStudents = onSnapshot(query(collection(db, 'users'), where('role', '==', 'siswa')), (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    }, (error) => {
      if (!error.message.includes('insufficient permissions')) {
        console.error("Error fetching students:", error);
      }
    });

    const unsubProgress = onSnapshot(query(collection(db, 'progress'), orderBy('createdAt', 'desc')), (snapshot) => {
      setProgress(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      if (!error.message.includes('insufficient permissions')) {
        console.error("Error fetching progress:", error);
      }
    });

    const unsubAnnounce = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      if (!error.message.includes('insufficient permissions')) {
        console.error("Error fetching announcements:", error);
      }
    });

    const unsubAttendance = onSnapshot(query(collection(db, 'attendance'), orderBy('timestamp', 'desc')), (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      if (!error.message.includes('insufficient permissions')) {
        console.error("Error fetching attendance:", error);
      }
      setLoading(false);
    });

    const unsubSubjects = onSnapshot(query(collection(db, 'subjects'), orderBy('createdAt', 'desc')), (snapshot) => {
      setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      if (!error.message.includes('insufficient permissions')) {
        console.error("Error fetching subjects:", error);
      }
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'landingPage'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      }
    });

    return () => {
      unsubStudents();
      unsubProgress();
      unsubAnnounce();
      unsubAttendance();
      unsubSubjects();
      unsubSettings();
    };
  }, [user]);

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

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: editName,
        photoURL: editPhoto
      });
      alert('Profil berhasil diperbarui!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleAttendance = async () => {
    if (!navigator.geolocation && attendanceStatus === 'Hadir') {
      alert('Geolocation tidak didukung oleh browser Anda.');
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const photoDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.6);

      const today = new Date().toISOString().split('T')[0];
      const path = 'attendance';

      const saveAttendance = async (location: any = null) => {
        try {
          // Check if already attended today
          const q = query(
            collection(db, path), 
            where('studentId', '==', user.uid), 
            where('date', '==', today)
          );
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            alert('Anda sudah melakukan absensi hari ini.');
            stopCamera();
            return;
          }

          await addDoc(collection(db, path), {
            studentId: user.uid,
            studentName: user.displayName || editName,
            date: today,
            timestamp: serverTimestamp(),
            status: attendanceStatus,
            location: location,
            photo: attendanceStatus === 'Hadir' ? photoDataUrl : null
          });
          alert('Absensi berhasil dicatat!');
          stopCamera();
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, path);
        }
      };

      if (attendanceStatus === 'Hadir') {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await saveAttendance({ latitude, longitude });
          }, 
          (error) => {
            alert('Gagal mendapatkan lokasi: ' + error.message);
          }
        );
      } else {
        await saveAttendance();
      }
    }
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = 'progress';
    try {
      const data = {
        studentId: selectedStudent,
        title: progressTitle,
        category: progressCategory, // This will now represent the Subject Name
        description: progressDesc,
        target: progressTarget,
        status: progressStatus,
        date: new Date().toISOString().split('T')[0],
        teacherId: user.uid,
        teacherName: editName || 'Guru'
      };

      if (editingProgress) {
        await updateDoc(doc(db, 'progress', editingProgress.id), data);
        alert('Laporan diperbarui!');
      } else {
        await addDoc(collection(db, path), { ...data, createdAt: serverTimestamp() });
        alert('Laporan ditambahkan!');
      }
      
      resetForm();
    } catch (error) {
      handleFirestoreError(error, editingProgress ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = 'subjects';
    try {
      const data = {
        name: newSubjectName,
        teacherId: user.uid,
        createdAt: serverTimestamp()
      };

      if (editingSubject) {
        await updateDoc(doc(db, path, editingSubject.id), { name: newSubjectName });
        alert('Mata pelajaran diperbarui!');
      } else {
        await addDoc(collection(db, path), data);
        alert('Mata pelajaran ditambahkan!');
      }
      setNewSubjectName('');
      setEditingSubject(null);
      setShowSubjectModal(false);
    } catch (error) {
      handleFirestoreError(error, editingSubject ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const resetForm = () => {
    setSelectedStudent('');
    setProgressTitle('');
    setProgressCategory('Akademik');
    setProgressDesc('');
    setProgressTarget('');
    setProgressStatus('Belum Lulus');
    setEditingProgress(null);
    setShowProgressModal(false);
  };

  const handleEdit = (p: any) => {
    setEditingProgress(p);
    setSelectedStudent(p.studentId);
    setProgressTitle(p.title);
    setProgressCategory(p.category);
    setProgressDesc(p.description);
    setProgressTarget(p.target || '');
    setProgressStatus(p.status || 'Belum Lulus');
    setShowProgressModal(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-blue-50">Memuat data...</div>;

  const NavItems = () => (
    <nav className="space-y-2 flex-1">
      <button 
        onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <CheckCircle size={20} className={activeTab === 'overview' ? 'text-white' : 'text-gray-400'} /> Overview
      </button>
      <button 
        onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <Users size={20} className={activeTab === 'students' ? 'text-white' : 'text-gray-400'} /> Daftar Siswa
      </button>
      <button 
        onClick={() => { setActiveTab('progress'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'progress' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <BookOpen size={20} className={activeTab === 'progress' ? 'text-white' : 'text-gray-400'} /> Laporan Belajar
      </button>
      <button 
        onClick={() => { setActiveTab('subjects'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'subjects' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <TrendingUp size={20} className={activeTab === 'subjects' ? 'text-white' : 'text-gray-400'} /> Kategori Mapel
      </button>
      <button 
        onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'attendance' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <Camera size={20} className={activeTab === 'attendance' ? 'text-white' : 'text-gray-400'} /> Absensi Saya
      </button>
      <button 
        onClick={() => { setActiveTab('announcements'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'announcements' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <Bell size={20} className={activeTab === 'announcements' ? 'text-white' : 'text-gray-400'} /> Pengumuman
      </button>
      <button 
        onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-50 text-gray-600'}`}
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
            <div className="w-10 h-10 overflow-hidden rounded-xl border border-blue-600 bg-white">
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-200">RA</div>
          )}
          <div>
            <span className="font-bold text-gray-800 block leading-tight">Portal Guru</span>
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
            <div className="w-12 h-12 overflow-hidden rounded-2xl border-2 border-blue-600 p-0.5 bg-white">
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-blue-600 rounded-[20px] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-100">RA</div>
          )}
          <div>
            <h1 className="font-bold text-xl text-gray-800 tracking-tight">Portal Guru</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[2px] mt-1">RA Darusyifa</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <NavItems />
        </div>
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
          { id: 'overview', icon: CheckCircle, label: 'Beranda' },
          { id: 'students', icon: Users, label: 'Siswa' },
          { id: 'progress', icon: BookOpen, label: 'Laporan' },
          { id: 'subjects', icon: TrendingUp, label: 'Materi' },
          { id: 'attendance', icon: Camera, label: 'Absen' },
          { id: 'profile', icon: User, label: 'Profil' },
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)} 
            className={`flex flex-col items-center gap-1.5 p-1 transition-all ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <div className={`p-2.5 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'hover:bg-gray-50'}`}>
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
            <h2 className="text-2xl font-bold text-gray-800">Selamat Datang, Guru!</h2>
            <p className="text-gray-500 text-sm">Kelola perkembangan belajar siswa RA Darusyifa.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button 
              onClick={startCamera}
              className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-100"
            >
              <Camera size={20} /> Absen Sekarang
            </button>
            <button 
              onClick={() => setShowProgressModal(true)}
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <Plus size={20} /> Buat Laporan Baru
            </button>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Siswa', value: students.length, color: 'bg-blue-500', icon: Users },
                { label: 'Laporan Dibuat', value: progress.length, color: 'bg-green-500', icon: BookOpen },
                { label: 'Pengumuman', value: announcements.length, color: 'bg-orange-500', icon: Bell },
                { label: 'Total Absensi', value: attendance.length, color: 'bg-purple-500', icon: Clock },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center group hover:shadow-xl hover:shadow-gray-200/50 transition-all">
                  <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-opacity-20 mb-4 group-hover:scale-110 transition-transform`}>
                    <stat.icon size={28} />
                  </div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                  <h4 className="text-2xl font-black text-gray-800 tracking-tight">{stat.value}</h4>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                    <TrendingUp size={24} className="text-blue-500" /> Tren Aktivitas Siswa
                  </h3>
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase text-gray-400">Live Analytics</span>
                  </div>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progress.slice(0, 20).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" fontSize={10} tick={{fill: '#94a3b8', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} tick={{fill: '#94a3b8', fontWeight: 'bold'}} domain={[0, 100]} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '15px'}}
                      />
                      <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={5} dot={{r: 6, fill: '#3b82f6', strokeWidth: 3, stroke: '#fff'}} activeDot={{r: 8, strokeWidth: 0}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                <h3 className="text-xl font-black text-gray-800 mb-10 flex items-center gap-3">
                  <BarChartIcon size={24} className="text-purple-500" /> Distribusi Kelulusan
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
                        innerRadius={70}
                        outerRadius={90}
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
                        <span className="text-xs font-black uppercase text-gray-500 tracking-wider">{l.label}</span>
                      </div>
                      <span className="text-sm font-black text-gray-800">{l.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Daftar Siswa</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Nama</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">{s.name}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{s.email}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => { setSelectedStudent(s.id); setShowProgressModal(true); }}
                          className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                        >
                          Beri Laporan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Laporan Perkembangan</h3>
            <div className="grid gap-4">
              {progress.map(p => {
                const student = students.find(s => s.id === p.studentId);
                return (
                  <div key={p.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold uppercase">{p.category}</span>
                        <span className="text-xs text-gray-400">{p.date}</span>
                      </div>
                      <h4 className="font-bold text-gray-800 text-lg">{p.title}</h4>
                      <p className="text-gray-500 text-sm mt-1">Siswa: <span className="font-bold text-gray-700">{student?.name || 'Unknown'}</span></p>
                      {p.target && <p className="text-blue-600 text-sm mt-1 font-medium">Target: {p.target}</p>}
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
                      <p className="text-gray-600 text-sm mt-4 leading-relaxed line-clamp-2">{p.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(p)} className="text-gray-400 hover:text-blue-600 p-2"><Edit size={18} /></button>
                      <button onClick={async () => {
                        if(window.confirm('Hapus laporan ini?')) {
                          try {
                            await deleteDoc(doc(db, 'progress', p.id));
                            alert('Laporan berhasil dihapus!');
                          } catch (error) {
                            handleFirestoreError(error, OperationType.DELETE, `progress/${p.id}`);
                          }
                        }
                      }} className="text-gray-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                    </div>
                  </div>
                );
              })}
              {progress.length === 0 && (
                <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
                  Belum ada laporan yang dibuat.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Kategori Mata Pelajaran</h3>
              <button 
                onClick={() => { setEditingSubject(null); setNewSubjectName(''); setShowSubjectModal(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all text-sm"
              >
                <Plus size={18} /> Tambah Mapel
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map(s => (
                <div key={s.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center group">
                  <div>
                    <h4 className="font-bold text-gray-800">{s.name}</h4>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Kategori Perkembangan</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingSubject(s); setNewSubjectName(s.name); setShowSubjectModal(true); }}
                      className="p-2 text-gray-400 hover:text-blue-600"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={async () => {
                        if(window.confirm(`Hapus mata pelajaran ${s.name}?`)) {
                          try {
                            await deleteDoc(doc(db, 'subjects', s.id));
                            alert('Berhasil dihapus!');
                          } catch (error) {
                            handleFirestoreError(error, OperationType.DELETE, `subjects/${s.id}`);
                          }
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {subjects.length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3 bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
                  Belum ada kategori mata pelajaran. Silakan tambah mapel baru.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto w-full">
            <h3 className="text-3xl font-bold text-gray-800 mb-2">Presensi Mandiri</h3>
            <p className="text-gray-500 mb-10 max-w-sm">Pilih status kehadiran dan lakukan absensi dengan foto wajah.</p>
            
            <div className="w-full max-w-md bg-white p-6 rounded-[32px] shadow-2xl shadow-blue-100 border border-gray-100 mb-10">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Status Kehadiran</label>
              <div className="grid grid-cols-2 gap-3">
                {['Hadir', 'Izin', 'Sakit', 'TK'].map((status) => (
                  <button 
                    key={status}
                    onClick={() => setAttendanceStatus(status)}
                    className={`py-3 rounded-2xl font-bold transition-all ${attendanceStatus === status ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={startCamera}
              className="w-24 h-24 bg-blue-600 text-white rounded-[32px] flex items-center justify-center shadow-2xl shadow-blue-200 hover:scale-110 transition-transform active:scale-95 group mb-12"
            >
              <Camera size={40} className="group-hover:rotate-12 transition-transform" />
            </button>
            
            <div className="w-full text-left">
              <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Clock size={20} className="text-blue-600" /> Riwayat Absensi Terkini
              </h4>
              <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Hari/Tanggal</th>
                        <th className="px-6 py-4">Waktu</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {attendance.filter(a => a.studentId === user.uid).map(a => (
                        <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-800">{a.date}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {a.timestamp ? new Date(a.timestamp.seconds * 1000).toLocaleTimeString() : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${a.status === 'Hadir' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                            {a.photo && <button onClick={() => setSelectedPhoto(a.photo)} className="text-blue-600 hover:underline text-xs font-bold">Foto</button>}
                            <button onClick={async () => {
                              if(window.confirm('Hapus data absensi ini?')) {
                                try {
                                  await deleteDoc(doc(db, 'attendance', a.id));
                                  alert('Absensi berhasil dihapus!');
                                } catch (error) {
                                  handleFirestoreError(error, OperationType.DELETE, `attendance/${a.id}`);
                                }
                              }
                            }} className="text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {attendance.filter(a => a.studentId === user.uid).length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm italic">Belum ada riwayat absensi.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto md:mx-0">
            <h3 className="text-2xl font-bold text-gray-800 mb-10">Pengaturan Profil Guru</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-8">
              <div className="flex flex-col items-center gap-6 bg-gray-50 p-10 rounded-[48px] border border-gray-100">
                <div className="relative group cursor-pointer" onClick={() => profileFileInputRef.current?.click()}>
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
                <input type="file" ref={profileFileInputRef} onChange={handleProfilePhotoChange} accept="image/*" className="hidden" />
                <div className="text-center">
                  <button type="button" onClick={() => profileFileInputRef.current?.click()} className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:underline">Ganti Foto Profil</button>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest">RA Darusyifa - Portal Guru</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Email (Akun)</label>
                  <input 
                    type="text" 
                    value={user?.email} 
                    readOnly 
                    className="w-full p-4 bg-gray-100 border border-gray-200 rounded-2xl text-gray-400 font-medium" 
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-2xl font-bold text-lg hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3">
                <CheckCircle size={20} /> Simpan Perubahan
              </button>
            </form>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Pengumuman Sekolah</h3>
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

        {/* Progress Modal */}
        {showProgressModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={resetForm} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">{editingProgress ? 'Edit Laporan' : 'Laporan Baru'}</h3>
              <form onSubmit={handleSaveProgress} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pilih Siswa</label>
                    <select 
                      value={selectedStudent} 
                      onChange={(e) => setSelectedStudent(e.target.value)} 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">-- Pilih Siswa --</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mata Pelajaran</label>
                    <select 
                      value={progressCategory} 
                      onChange={(e) => setProgressCategory(e.target.value)} 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">-- Pilih Mapel --</option>
                      <option value="Umum">Umum</option>
                      {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Judul Laporan</label>
                  <input type="text" value={progressTitle} onChange={(e) => setProgressTitle(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Hafalan Surat Pendek" required />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Perkembangan</label>
                    <input type="text" value={progressTarget} onChange={(e) => setProgressTarget(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Mampu membaca 1 paragraf" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Keterangan / Status</label>
                    <select value={progressStatus} onChange={(e) => setProgressStatus(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Belum Lulus">Belum Lulus</option>
                      <option value="Mengulang">Mengulang</option>
                      <option value="Lulus">Lulus</option>
                      <option value="Lanjut Perkembangan Lain">Lanjut Perkembangan Lain</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deskripsi</label>
                  <textarea value={progressDesc} onChange={(e) => setProgressDesc(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none" placeholder="Tuliskan detail perkembangan anak..." required />
                </div>
                <button type="submit" className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all mt-4 flex items-center justify-center gap-2">
                  <Save size={20} /> {editingProgress ? 'Simpan Perubahan' : 'Kirim Laporan'}
                </button>
              </form>
            </div>
          </div>
        )}

        {showSubjectModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl relative">
              <button onClick={() => setShowSubjectModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">{editingSubject ? 'Edit Mapel' : 'Tambah Mapel'}</h3>
              <form onSubmit={handleSaveSubject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Mata Pelajaran</label>
                  <input 
                    type="text" 
                    value={newSubjectName} 
                    onChange={(e) => setNewSubjectName(e.target.value)} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Contoh: Hafalan Qur'an" 
                    required 
                  />
                </div>
                <button type="submit" className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all mt-4">
                  {editingSubject ? 'Simpan Perubahan' : 'Tambah Mata Pelajaran'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black z-[200] flex flex-col">
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute top-10 left-0 right-0 flex justify-center p-4">
                <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/30 text-white font-bold text-sm">
                  Status: {attendanceStatus}
                </div>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="bg-white p-10 rounded-t-[40px] flex flex-col items-center gap-8 shadow-[0_-10px_50px_rgba(0,0,0,0.3)]">
              <div className="w-16 h-1.5 bg-gray-100 rounded-full"></div>
              <div className="flex items-center gap-12">
                <button onClick={stopCamera} className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center">
                  <X size={24} />
                </button>
                <button onClick={handleAttendance} className="w-24 h-24 bg-blue-600 text-white rounded-[32px] flex items-center justify-center shadow-2xl shadow-blue-200 border-8 border-blue-50 active:scale-90 transition-all">
                  <Camera size={40} />
                </button>
                <div className="w-14 h-14"></div>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Portal Guru RA Darusyifa</p>
            </div>
          </div>
        )}
      </main>

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[400] flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-4xl w-full flex justify-center">
            <button onClick={() => setSelectedPhoto(null)} className="absolute -top-12 right-0 text-white hover:text-gray-300"><X size={32} /></button>
            <img src={selectedPhoto} alt="Absensi Full" className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
