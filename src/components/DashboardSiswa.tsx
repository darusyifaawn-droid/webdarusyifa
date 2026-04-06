import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, orderBy } from 'firebase/firestore';
import { Camera, MapPin, CheckCircle, Clock, Calendar, User, LogOut, Bell, CreditCard, BookOpen, Edit, Save, X, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export default function DashboardSiswa() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState('');

  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists() || userDoc.data().role !== 'siswa') {
            navigate('/login');
            return;
          }
          
          setUser(user);
          setUserData(userDoc.data());
          setEditName(userDoc.data().name);
          setEditPhoto(userDoc.data().photoURL || '');

          // Listeners
          const unsubAttendance = onSnapshot(
            query(collection(db, 'attendance'), where('studentId', '==', user.uid), orderBy('timestamp', 'desc')),
            (snapshot) => setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
          );

          const unsubProgress = onSnapshot(
            query(collection(db, 'progress'), where('studentId', '==', user.uid), orderBy('createdAt', 'desc')),
            (snapshot) => setProgress(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
          );

          const unsubAnnounce = onSnapshot(
            query(collection(db, 'announcements'), orderBy('createdAt', 'desc')),
            (snapshot) => {
              setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
              setLoading(false);
            }
          );

          return () => {
            unsubAttendance();
            unsubProgress();
            unsubAnnounce();
          };
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
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-green-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
      >
        <Calendar size={20} /> Dashboard
      </button>
      <button 
        onClick={() => { setActiveTab('progress'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'progress' ? 'bg-green-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
      >
        <BookOpen size={20} /> Perkembangan
      </button>
      <button 
        onClick={() => { setActiveTab('finance'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'finance' ? 'bg-green-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
      >
        <CreditCard size={20} /> Administrasi
      </button>
      <button 
        onClick={() => { setActiveTab('announcements'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'announcements' ? 'bg-green-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
      >
        <Bell size={20} /> Pengumuman
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-green-700 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-green-700 font-bold text-xs">RA</div>
          <span className="font-bold">Siswa Portal</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-green-600 rounded-lg">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="w-64 bg-gray-900 text-white p-6 hidden md:flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">RA</div>
          <span className="font-bold text-lg">Portal Siswa</span>
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
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">RA</div>
                <span className="font-bold text-lg">Portal Siswa</span>
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
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 overflow-hidden border-2 border-white shadow-lg">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} />
                )}
              </div>
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-lg shadow-md text-gray-500 hover:text-green-600 transition-colors border border-gray-100"
              >
                <Edit size={14} />
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Halo, {userData?.name}!</h2>
              <p className="text-gray-500 text-sm">Selamat datang di portal belajar RA Darusyifa.</p>
            </div>
          </div>
          <button 
            onClick={startCamera}
            className="w-full sm:w-auto bg-green-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-green-700 transition-all shadow-xl shadow-green-100"
          >
            <Camera size={24} /> Absen Sekarang
          </button>
        </header>

        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Stats */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <div className="text-blue-500 mb-2"><CheckCircle size={20} /></div>
                  <p className="text-gray-500 text-xs font-bold uppercase">Hadir</p>
                  <h4 className="text-2xl font-bold text-gray-800">{attendance.length} Hari</h4>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <div className="text-purple-500 mb-2"><BookOpen size={20} /></div>
                  <p className="text-gray-500 text-xs font-bold uppercase">Materi</p>
                  <h4 className="text-2xl font-bold text-gray-800">{progress.length} Laporan</h4>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <div className="text-yellow-500 mb-2"><CreditCard size={20} /></div>
                  <p className="text-gray-500 text-xs font-bold uppercase">Tabungan</p>
                  <h4 className="text-2xl font-bold text-gray-800">Rp {(userData?.savings || 0).toLocaleString()}</h4>
                </div>
              </div>

              {/* Recent Attendance */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-800">Riwayat Absensi</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {attendance.slice(0, 5).map((a) => (
                    <div key={a.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{a.date}</p>
                          <p className="text-xs text-gray-400">Jam: {a.timestamp ? new Date(a.timestamp.seconds * 1000).toLocaleTimeString() : '-'}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-bold uppercase">Hadir</span>
                    </div>
                  ))}
                  {attendance.length === 0 && (
                    <div className="p-10 text-center text-gray-400">Belum ada riwayat absensi.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Announcements */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Bell size={20} className="text-yellow-500" /> Pengumuman
                </h3>
                <div className="space-y-4">
                  {announcements.slice(0, 3).map(a => (
                    <div key={a.id} className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                      <h4 className="font-bold text-yellow-900 text-sm">{a.title}</h4>
                      <p className="text-yellow-800 text-xs mt-1 line-clamp-2">{a.content}</p>
                    </div>
                  ))}
                  {announcements.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4">Tidak ada pengumuman baru.</p>
                  )}
                </div>
              </div>

              {/* Finance Card */}
              <div className="bg-green-900 text-white rounded-3xl p-8 shadow-xl shadow-green-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <h3 className="text-lg font-bold mb-6">Informasi Keuangan</h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-green-300 text-xs uppercase font-bold mb-1">Total Tabungan</p>
                    <p className="text-3xl font-bold">Rp {(userData?.savings || 0).toLocaleString()}</p>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-red-300 text-xs uppercase font-bold mb-1">Tunggakan</p>
                    <p className="text-xl font-bold">Rp {(userData?.arrears || 0).toLocaleString()}</p>
                  </div>
                </div>
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
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-8">Detail Administrasi</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 bg-green-50 rounded-3xl border border-green-100">
                <h4 className="text-green-800 font-bold mb-4 flex items-center gap-2"><CreditCard size={20} /> Tabungan Siswa</h4>
                <p className="text-3xl font-bold text-green-900">Rp {(userData?.savings || 0).toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-2">Saldo tabungan aktif untuk kegiatan sekolah.</p>
              </div>
              <div className="p-8 bg-red-50 rounded-3xl border border-red-100">
                <h4 className="text-red-800 font-bold mb-4 flex items-center gap-2"><CreditCard size={20} /> Tunggakan Biaya</h4>
                <p className="text-3xl font-bold text-red-900">Rp {(userData?.arrears || 0).toLocaleString()}</p>
                <p className="text-sm text-red-600 mt-2">Segera lakukan pelunasan di kantor administrasi.</p>
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
                  <h4 className="font-bold text-gray-800 text-lg">{a.title}</h4>
                  <p className="text-gray-600 mt-2 leading-relaxed">{a.content}</p>
                  <div className="mt-4 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                    {a.author} • {a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleString() : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Modal */}
        {isEditingProfile && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
              <button onClick={() => setIsEditingProfile(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Edit Profil</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Lengkap</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL Foto Profil</label>
                  <input type="text" value={editPhoto} onChange={(e) => setEditPhoto(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" placeholder="https://..." />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => { setEditPhoto(''); }} className="flex-1 px-4 py-3 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50">Hapus Foto</button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200">Simpan</button>
                </div>
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
