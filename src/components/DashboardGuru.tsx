import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, getDoc, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { Users, BookOpen, Plus, Trash2, Edit, LogOut, User, Bell, CheckCircle, X, Menu, Save, Camera, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export default function DashboardGuru() {
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Form States
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [editingProgress, setEditingProgress] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [progressTitle, setProgressTitle] = useState('');
  const [progressCategory, setProgressCategory] = useState('Akademik');
  const [progressDesc, setProgressDesc] = useState('');

  // Camera States
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists() || userDoc.data().role !== 'guru') {
            navigate('/login');
            return;
          }
          
          setUser(user);

          // Listeners
          const unsubStudents = onSnapshot(query(collection(db, 'users')), (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)).filter(u => u.role === 'siswa'));
          });

          const unsubProgress = onSnapshot(query(collection(db, 'progress'), orderBy('createdAt', 'desc')), (snapshot) => {
            setProgress(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          });

          const unsubAnnounce = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), (snapshot) => {
            setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          });

          const unsubAttendance = onSnapshot(query(collection(db, 'attendance'), orderBy('timestamp', 'desc')), (snapshot) => {
            setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
          });

          return () => {
            unsubStudents();
            unsubProgress();
            unsubAnnounce();
            unsubAttendance();
          };
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
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser Anda.');
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const photoDataUrl = canvasRef.current.toDataURL('image/jpeg');

      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const today = new Date().toISOString().split('T')[0];
        const path = 'attendance';

        try {
          await addDoc(collection(db, path), {
            studentId: user.uid,
            date: today,
            timestamp: serverTimestamp(),
            status: 'masuk',
            location: { latitude, longitude },
            photo: photoDataUrl
          });
          alert('Absensi berhasil dicatat!');
          stopCamera();
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, path);
        }
      }, (error) => {
        alert('Gagal mendapatkan lokasi: ' + error.message);
      });
    }
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = 'progress';
    try {
      const data = {
        studentId: selectedStudent,
        title: progressTitle,
        category: progressCategory,
        description: progressDesc,
        date: new Date().toISOString().split('T')[0],
        teacherId: user.uid,
        teacherName: user.displayName || 'Guru'
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

  const resetForm = () => {
    setSelectedStudent('');
    setProgressTitle('');
    setProgressCategory('Akademik');
    setProgressDesc('');
    setEditingProgress(null);
    setShowProgressModal(false);
  };

  const handleEdit = (p: any) => {
    setEditingProgress(p);
    setSelectedStudent(p.studentId);
    setProgressTitle(p.title);
    setProgressCategory(p.category);
    setProgressDesc(p.description);
    setShowProgressModal(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-blue-50">Memuat data...</div>;

  const NavItems = () => (
    <nav className="space-y-2 flex-1">
      <button 
        onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
      >
        <CheckCircle size={20} /> Overview
      </button>
      <button 
        onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'students' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
      >
        <Users size={20} /> Daftar Siswa
      </button>
      <button 
        onClick={() => { setActiveTab('progress'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'progress' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
      >
        <BookOpen size={20} /> Laporan Belajar
      </button>
      <button 
        onClick={() => { setActiveTab('announcements'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'announcements' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
      >
        <Bell size={20} /> Pengumuman
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-blue-700 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">RA</div>
          <span className="font-bold">Guru Portal</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-blue-600 rounded-lg">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="w-64 bg-gray-900 text-white p-6 hidden md:flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">RA</div>
          <span className="font-bold text-lg">Portal Guru</span>
        </div>
        <NavItems />
        <div className="mt-auto pt-10">
          <button onClick={() => auth.signOut()} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-600 transition-colors text-red-100"><LogOut size={20} /> Keluar</button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[150] md:hidden" onClick={() => setIsSidebarOpen(false)}>
          <aside className="w-64 h-full bg-gray-900 text-white p-6 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">RA</div>
                <span className="font-bold text-lg">Portal Guru</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)}><X /></button>
            </div>
            <NavItems />
            <div className="mt-auto pt-10">
              <button onClick={() => auth.signOut()} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-600 transition-colors text-red-100"><LogOut size={20} /> Keluar</button>
            </div>
          </aside>
        </div>
      )}

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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { label: 'Total Siswa', value: students.length, color: 'bg-blue-500' },
              { label: 'Laporan Dibuat', value: progress.length, color: 'bg-green-500' },
              { label: 'Pengumuman', value: announcements.length, color: 'bg-yellow-500' },
              { label: 'Siswa Aktif', value: students.length, color: 'bg-purple-500' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs font-bold uppercase mb-1">{stat.label}</p>
                <h4 className="text-2xl font-bold text-gray-800">{stat.value}</h4>
                <div className={`mt-4 h-1 w-full rounded-full ${stat.color} opacity-20`}></div>
              </div>
            ))}
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
                      <p className="text-gray-600 text-sm mt-4 leading-relaxed line-clamp-2">{p.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(p)} className="text-gray-400 hover:text-blue-600 p-2"><Edit size={18} /></button>
                      <button onClick={() => {
                        if(window.confirm('Hapus laporan ini?')) deleteDoc(doc(db, 'progress', p.id));
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

        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Pengumuman Sekolah</h3>
            <div className="grid gap-4">
              {announcements.map(a => (
                <div key={a.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <h4 className="font-bold text-gray-800">{a.title}</h4>
                  <p className="text-gray-600 text-sm mt-2">{a.content}</p>
                  <div className="mt-4 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
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
            <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
              <button onClick={resetForm} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">{editingProgress ? 'Edit Laporan' : 'Laporan Baru'}</h3>
              <form onSubmit={handleSaveProgress} className="space-y-4">
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kategori</label>
                  <select 
                    value={progressCategory} 
                    onChange={(e) => setProgressCategory(e.target.value)} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Akademik">Akademik</option>
                    <option value="Karakter">Karakter</option>
                    <option value="Ibadah">Ibadah</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Judul Laporan</label>
                  <input type="text" value={progressTitle} onChange={(e) => setProgressTitle(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Hafalan Surat Pendek" required />
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

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black/90 z-[300] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-4 bg-gray-900 flex justify-between items-center text-white shrink-0">
                <h3 className="font-bold">Ambil Foto Absensi</h3>
                <button onClick={stopCamera} className="p-1 hover:bg-gray-800 rounded-full"><X size={20} /></button>
              </div>
              <div className="relative flex-1 bg-black min-h-0">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="p-4 sm:p-6 bg-white flex justify-center shrink-0">
                <button 
                  onClick={handleAttendance}
                  className="bg-green-600 text-white px-8 py-4 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-green-700 hover:scale-105 transition-all shadow-lg w-full"
                >
                  <Camera size={24} /> Ambil Foto & Absen
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
