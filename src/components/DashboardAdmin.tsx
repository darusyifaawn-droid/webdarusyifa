import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { getApps, initializeApp } from 'firebase/app';
import { sendPasswordResetEmail, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, getDoc, updateDoc, setDoc, orderBy, getDocs, where } from 'firebase/firestore';
import { Users, Shield, Plus, Trash2, Edit, BarChart, Bell, LogOut, User, Download, CreditCard, Megaphone, X, Menu, Settings, Image as ImageIcon, Key, Upload, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import * as XLSX from 'xlsx';

export default function DashboardAdmin() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ galleryImages: [], logoUrl: '', heroImageUrl: '' });
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [showTabunganModal, setShowTabunganModal] = useState(false);
  const [showIuranModal, setShowIuranModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form States
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [newUserRole, setNewUserRole] = useState('siswa');
  const [newUserKelas, setNewUserKelas] = useState('');
  const [newUserWhatsapp, setNewUserWhatsapp] = useState('');
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');
  
  // Finance Form States
  const [financeStudentId, setFinanceStudentId] = useState('');
  const [financeAmount, setFinanceAmount] = useState('');
  const [financeDate, setFinanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [financeIuranName, setFinanceIuranName] = useState('');
  const [financeIuranTarget, setFinanceIuranTarget] = useState('all');
  
  // Profile Edit States
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  
  // Photo Viewer State
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists() || userDoc.data().role !== 'admin') {
            navigate('/login');
            return;
          }
          
          setUser(user);
          setUserData(userDoc.data());
          setEditName(userDoc.data().name || '');
          setEditPhoto(userDoc.data().photoURL || '');
          
          // Listeners
          const unsubUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
            setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }, (error) => {
            console.error("Error fetching users:", error);
            alert("Gagal mengambil data users: " + error.message);
          });

          const unsubAttendance = onSnapshot(query(collection(db, 'attendance'), orderBy('timestamp', 'desc')), (snapshot) => {
            setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }, (error) => {
            console.error("Error fetching attendance:", error);
            alert("Gagal mengambil data absensi: " + error.message);
          });

          const unsubAnnounce = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), (snapshot) => {
            setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }, (error) => {
            console.error("Error fetching announcements:", error);
            alert("Gagal mengambil data pengumuman: " + error.message);
          });

          const unsubSettings = onSnapshot(doc(db, 'settings', 'landingPage'), (docSnap) => {
            if (docSnap.exists()) {
              setSettings(docSnap.data());
            }
            setLoading(false);
          }, (error) => {
            console.error("Error fetching settings:", error);
            alert("Gagal mengambil data pengaturan: " + error.message);
            setLoading(false);
          });

          return () => {
            unsubUsers();
            unsubAttendance();
            unsubAnnounce();
            unsubSettings();
          };
        } catch (error) {
          console.error('Error verifying admin role:', error);
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = 'users';
    try {
      // Create user in Firebase Auth using a secondary app to prevent logging out the admin
      const secondaryApp = getApps().find(app => app.name === 'SecondaryApp') || initializeApp(auth.app.options, 'SecondaryApp');
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUserEmail, newUserPassword);
      await secondaryAuth.signOut();

      const userData: any = {
        name: newUserName,
        email: newUserEmail,
        plainPassword: newUserPassword,
        role: newUserRole,
        createdAt: serverTimestamp(),
        savings: 0,
        arrears: 0
      };
      if (newUserRole === 'siswa') {
        userData.kelas = newUserKelas;
        userData.whatsapp = newUserWhatsapp;
      }
      
      // Save to Firestore using the UID from Auth
      await setDoc(doc(db, path, userCredential.user.uid), userData);
      
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('123456');
      setNewUserKelas('');
      setNewUserWhatsapp('');
      setShowAddUser(false);
      alert(`User berhasil ditambahkan! Guru/Siswa sekarang bisa login menggunakan email ini dengan password: ${newUserPassword}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        alert('Email sudah terdaftar di sistem.');
      } else {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const userData: any = {
        name: editingUser.name,
        role: editingUser.role,
      };
      if (editingUser.role === 'siswa') {
        userData.kelas = editingUser.kelas || '';
        userData.whatsapp = editingUser.whatsapp || '';
      }
      await updateDoc(doc(db, 'users', editingUser.id), userData);
      setShowEditUser(false);
      setEditingUser(null);
      alert('Data user berhasil diperbarui!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${editingUser.id}`);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', userToDelete.id));
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      alert('User berhasil dihapus!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userToDelete.id}`);
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        let successCount = 0;
        const secondaryApp = getApps().find(app => app.name === 'SecondaryApp') || initializeApp(auth.app.options, 'SecondaryApp');
        const secondaryAuth = getAuth(secondaryApp);

        for (const row of data as any[]) {
          if (row.Nama && row.Email) {
            try {
              const q = query(collection(db, 'users'), where('email', '==', row.Email));
              const querySnapshot = await getDocs(q);
              
              if (!querySnapshot.empty) {
                // Update existing user
                const userDoc = querySnapshot.docs[0];
                const userData: any = {
                  name: row.Nama,
                  role: row.Role?.toLowerCase() || 'siswa',
                };
                if (userData.role === 'siswa') {
                  userData.kelas = row.Kelas || '';
                  userData.whatsapp = row.WhatsApp || '';
                }
                await updateDoc(doc(db, 'users', userDoc.id), userData);
                successCount++;
              } else {
                // Create new user
                const userCredential = await createUserWithEmailAndPassword(secondaryAuth, row.Email, '123456');
                
                const userData: any = {
                  name: row.Nama,
                  email: row.Email,
                  plainPassword: '123456',
                  role: row.Role?.toLowerCase() || 'siswa',
                  createdAt: serverTimestamp(),
                  savings: 0,
                  arrears: 0
                };
                if (userData.role === 'siswa') {
                  userData.kelas = row.Kelas || '';
                  userData.whatsapp = row.WhatsApp || '';
                }
                await setDoc(doc(db, 'users', userCredential.user.uid), userData);
                successCount++;
              }
            } catch (err: any) {
              console.error(`Gagal mengimpor ${row.Email}:`, err.message);
              // Lanjutkan ke baris berikutnya jika email sudah ada atau error lain
            }
          }
        }
        await secondaryAuth.signOut();
        alert(`Berhasil mengimpor ${successCount} user dari Excel! Password default: 123456`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        alert('Gagal mengimpor data Excel. Pastikan format sesuai.');
        console.error(error);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'announcements'), {
        title: announceTitle,
        content: announceContent,
        createdAt: serverTimestamp(),
        author: user.displayName || 'Admin'
      });
      setAnnounceTitle('');
      setAnnounceContent('');
      setShowAnnounceModal(false);
      alert('Pengumuman berhasil dikirim!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'announcements');
    }
  };

  const updateFinance = async (userId: string, field: 'savings' | 'arrears', value: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        [field]: Number(value)
      });
      alert('Data administrasi berhasil disimpan!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleAddTabungan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!financeStudentId || !financeAmount || !financeDate) return;
    try {
      const student = allUsers.find(u => u.id === financeStudentId);
      if (!student) return;
      const newSavings = (student.savings || 0) + Number(financeAmount);
      await updateDoc(doc(db, 'users', financeStudentId), { savings: newSavings });
      
      // Optional: Save history to a subcollection or separate collection
      await addDoc(collection(db, 'savings_history'), {
        studentId: financeStudentId,
        amount: Number(financeAmount),
        date: financeDate,
        createdAt: serverTimestamp()
      });

      setShowTabunganModal(false);
      setFinanceStudentId('');
      setFinanceAmount('');
      alert('Tabungan berhasil ditambahkan!');
    } catch (error) {
      alert('Gagal menambahkan tabungan.');
      console.error(error);
    }
  };

  const handleAddIuran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!financeIuranName || !financeAmount) return;
    try {
      const amount = Number(financeAmount);
      let targetStudents = [];
      
      if (financeIuranTarget === 'all') {
        targetStudents = allUsers.filter(u => u.role === 'siswa');
      } else if (financeIuranTarget.startsWith('kelas_')) {
        const targetKelas = financeIuranTarget.replace('kelas_', '').toLowerCase();
        targetStudents = allUsers.filter(u => {
          if (u.role !== 'siswa') return false;
          const k = (u.kelas || '').toLowerCase();
          return k === targetKelas || k === `kelas ${targetKelas}` || k.includes(targetKelas);
        });
      } else {
        const student = allUsers.find(u => u.id === financeIuranTarget);
        if (student) targetStudents.push(student);
      }

      const newArrearDetail = {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        name: financeIuranName,
        amount: amount,
        date: new Date().toISOString().split('T')[0]
      };

      for (const student of targetStudents) {
        const newArrears = (student.arrears || 0) + amount;
        const currentDetails = student.arrears_details || [];
        await updateDoc(doc(db, 'users', student.id), { 
          arrears: newArrears,
          arrears_details: [...currentDetails, newArrearDetail]
        });
      }

      setShowIuranModal(false);
      setFinanceIuranName('');
      setFinanceAmount('');
      setFinanceIuranTarget('all');
      alert('Iuran berhasil ditetapkan!');
    } catch (error) {
      alert('Gagal menetapkan iuran.');
      console.error(error);
    }
  };

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [userToReset, setUserToReset] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToReset) return;
    
    try {
      if (!userToReset.plainPassword) {
        // Fallback to email reset
        await sendPasswordResetEmail(auth, userToReset.email);
        alert(`Password lama tidak tersimpan. Link reset password telah dikirim ke email ${userToReset.email}`);
        setShowResetPassword(false);
        setUserToReset(null);
        setNewPassword('');
        return;
      }

      if (!newPassword) return;

      // Use secondary app to sign in and update password
      const secondaryApp = getApps().find(app => app.name === 'SecondaryApp') || initializeApp(auth.app.options, 'SecondaryApp');
      const secondaryAuth = getAuth(secondaryApp);
      
      await signInWithEmailAndPassword(secondaryAuth, userToReset.email, userToReset.plainPassword);
      if (secondaryAuth.currentUser) {
        const { updatePassword } = await import('firebase/auth');
        await updatePassword(secondaryAuth.currentUser, newPassword);
        await secondaryAuth.signOut();

        // Update plainPassword in Firestore
        await updateDoc(doc(db, 'users', userToReset.id), {
          plainPassword: newPassword
        });

        alert(`Password untuk ${userToReset.email} berhasil diubah!`);
        setShowResetPassword(false);
        setUserToReset(null);
        setNewPassword('');
      }
    } catch (error: any) {
      console.error(error);
      alert('Gagal mereset password: ' + error.message);
    }
  };

  const exportToCSV = () => {
    const headers = ['Nama', 'Email', 'Tanggal', 'Jam', 'Status', 'Latitude', 'Longitude'];
    const rows = attendance.map(a => {
      const student = allUsers.find(u => u.id === a.studentId);
      const date = a.timestamp ? new Date(a.timestamp.seconds * 1000).toLocaleString() : '';
      return [
        student?.name || 'Unknown',
        student?.email || 'Unknown',
        a.date,
        date.split(', ')[1] || '',
        a.status,
        a.location?.latitude || '',
        a.location?.longitude || ''
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.map(h => `"${h}"`).join(",") + "\n" 
      + rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `absensi_ra_darusyifa_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanSettings = Object.fromEntries(Object.entries(settings).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'settings', 'landingPage'), cleanSettings);
      alert('Pengaturan web berhasil diperbarui!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/landingPage');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Memuat data...</div>;

  const NavItems = () => (
    <nav className="space-y-2 flex-1">
      <button 
        onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-green-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
      >
        <BarChart size={20} /> Overview
      </button>
      <button 
        onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-green-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
      >
        <Users size={20} /> User Management
      </button>
      <button 
        onClick={() => { setActiveTab('finance'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'finance' ? 'bg-green-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
      >
        <CreditCard size={20} /> Administrasi
      </button>
      <button 
        onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'attendance' ? 'bg-green-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
      >
        <CheckCircle size={20} /> Absensi
      </button>
      <button 
        onClick={() => { setActiveTab('announcements'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'announcements' ? 'bg-green-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
      >
        <Megaphone size={20} /> Pengumuman
      </button>
      <button 
        onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-green-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
      >
        <Settings size={20} /> Pengaturan Web
      </button>
      <button 
        onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-green-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
      >
        <User size={20} /> Profil Admin
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">RA</div>
          <span className="font-bold">Admin Portal</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-800 rounded-lg">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="w-64 bg-gray-900 text-white p-6 hidden md:flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">RA</div>
          <span className="font-bold text-lg">Portal Admin</span>
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
                <span className="font-bold text-lg">Portal Admin</span>
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
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Control Panel</h2>
            <p className="text-gray-500 text-sm">Monitoring operasional sekolah secara real-time.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={exportToCSV}
              className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <Download size={18} /> Export CSV
            </button>
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 overflow-hidden border-2 border-white shadow-sm">
              {userData?.photoURL ? (
                <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={24} />
              )}
            </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Siswa', value: allUsers.filter(u => u.role === 'siswa').length, color: 'bg-blue-500' },
                { label: 'Total Guru', value: allUsers.filter(u => u.role === 'guru').length, color: 'bg-green-500' },
                { label: 'Absensi Hari Ini', value: attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length, color: 'bg-purple-500' },
                { label: 'Total Tabungan', value: `Rp ${allUsers.reduce((acc, curr) => acc + (curr.savings || 0), 0).toLocaleString()}`, color: 'bg-yellow-500' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-wider">{stat.label}</p>
                  <h4 className="text-2xl font-bold text-gray-800">{stat.value}</h4>
                  <div className={`mt-4 h-1 w-full rounded-full ${stat.color} opacity-20`}></div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">Absensi Terbaru</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Siswa</th>
                      <th className="px-6 py-4">Waktu</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Lokasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attendance.slice(0, 10).map((a) => {
                      const student = allUsers.find(u => u.id === a.studentId);
                      return (
                        <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-800">{student?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-400">{student?.email}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-sm">
                            {a.date} <br/>
                            <span className="text-xs text-gray-400">{a.timestamp ? new Date(a.timestamp.seconds * 1000).toLocaleTimeString() : ''}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${a.status === 'masuk' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <a href={`https://www.google.com/maps?q=${a.location?.latitude},${a.location?.longitude}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                              <MapPin size={12} /> Lihat Maps
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-bold text-gray-800">User Management</h3>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  ref={fileInputRef} 
                  onChange={handleImportExcel} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 sm:flex-none bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-all"
                >
                  <Upload size={20} /> Import Excel
                </button>
                <button 
                  onClick={() => setShowAddUser(true)}
                  className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all"
                >
                  <Plus size={20} /> Tambah User
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Nama</th>
                    <th className="px-6 py-4">Email (Username)</th>
                    <th className="px-6 py-4">Password</th>
                    <th className="px-6 py-4">Kelas</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">{u.name}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{u.email}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{u.plainPassword || '***'}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{u.kelas || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-red-100 text-red-600' :
                          u.role === 'guru' ? 'bg-blue-100 text-blue-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          <button onClick={() => { setUserToReset(u); setShowResetPassword(true); }} className="text-gray-400 hover:text-yellow-600 transition-colors" title="Reset Password"><Key size={18} /></button>
                          <button onClick={() => { setEditingUser(u); setShowEditUser(true); }} className="text-gray-400 hover:text-blue-600 transition-colors"><Edit size={18} /></button>
                          <button onClick={() => { setUserToDelete(u); setShowDeleteConfirm(true); }} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Kelola Absensi Kehadiran</h3>
              <button 
                onClick={exportToCSV}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                <Download size={18} /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Siswa</th>
                    <th className="px-6 py-4">Waktu</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Foto Absen</th>
                    <th className="px-6 py-4">Lokasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendance.map((a) => {
                    const student = allUsers.find(u => u.id === a.studentId);
                    return (
                      <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">{student?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-400">{student?.kelas || '-'}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {a.date} <br/>
                          <span className="text-xs text-gray-400">{a.timestamp ? new Date(a.timestamp.seconds * 1000).toLocaleTimeString() : ''}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${a.status === 'masuk' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {a.photo ? (
                            <img src={a.photo} alt="Absensi" className="h-12 w-12 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setSelectedPhoto(a.photo)} />
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <a href={`https://www.google.com/maps?q=${a.location?.latitude},${a.location?.longitude}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                            <MapPin size={12} /> Lihat Maps
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-bold text-gray-800">Administrasi & Keuangan</h3>
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setShowTabunganModal(true)}
                  className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all"
                >
                  <Plus size={18} /> Input Tabungan
                </button>
                <button 
                  onClick={() => setShowIuranModal(true)}
                  className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
                >
                  <Plus size={18} /> Penetapan Iuran
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Nama Siswa</th>
                      <th className="px-6 py-4">Kelas</th>
                      <th className="px-6 py-4">Total Tabungan (Rp)</th>
                      <th className="px-6 py-4">Total Tunggakan (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allUsers.filter(u => u.role === 'siswa').map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-800">{u.name}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{u.kelas || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              defaultValue={u.savings || 0}
                              id={`savings-${u.id}`}
                              className="w-full max-w-[150px] p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                            />
                            <button 
                              onClick={() => {
                                const val = (document.getElementById(`savings-${u.id}`) as HTMLInputElement).value;
                                updateFinance(u.id, 'savings', val);
                              }}
                              className="text-xs bg-green-100 text-green-700 px-3 py-2 rounded-lg font-bold hover:bg-green-200"
                            >
                              Simpan
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              defaultValue={u.arrears || 0}
                              id={`arrears-${u.id}`}
                              className="w-full max-w-[150px] p-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 focus:ring-2 focus:ring-red-500 outline-none"
                            />
                            <button 
                              onClick={() => {
                                const val = (document.getElementById(`arrears-${u.id}`) as HTMLInputElement).value;
                                updateFinance(u.id, 'arrears', val);
                              }}
                              className="text-xs bg-red-100 text-red-700 px-3 py-2 rounded-lg font-bold hover:bg-red-200"
                            >
                              Simpan
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Broadcast Pengumuman</h3>
              <button 
                onClick={() => setShowAnnounceModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"
              >
                <Plus size={20} /> Buat Baru
              </button>
            </div>
            <div className="grid gap-4">
              {announcements.map(a => (
                <div key={a.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{a.title}</h4>
                    <p className="text-gray-600 text-sm mt-2 leading-relaxed">{a.content}</p>
                    <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      <span>{a.author}</span>
                      <span>•</span>
                      <span>{a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleString() : ''}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteDoc(doc(db, 'announcements', a.id))} className="text-gray-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
                  Belum ada pengumuman yang dikirim.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Pengaturan Web Landing Page</h3>
            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Teks Akreditasi (Contoh: Terakreditasi B)</label>
                <input 
                  type="text" 
                  value={settings.accreditationText || ''} 
                  onChange={(e) => setSettings({...settings, accreditationText: e.target.value})} 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                  placeholder="Terakreditasi B"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nomor WhatsApp (Mulai dengan 62...)</label>
                <input 
                  type="text" 
                  value={settings.whatsappNumber || ''} 
                  onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})} 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                  placeholder="6283199863444"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">URL Logo Sekolah</label>
                <input 
                  type="url" 
                  value={settings.logoUrl || ''} 
                  onChange={(e) => setSettings({...settings, logoUrl: e.target.value})} 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                  placeholder="https://example.com/logo.png"
                />
                {settings.logoUrl && <img src={settings.logoUrl} alt="Logo Preview" className="mt-2 h-16 object-contain" referrerPolicy="no-referrer" />}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">URL Gambar Hero (Utama)</label>
                <input 
                  type="url" 
                  value={settings.heroImageUrl || ''} 
                  onChange={(e) => setSettings({...settings, heroImageUrl: e.target.value})} 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                  placeholder="https://example.com/hero.png"
                />
                {settings.heroImageUrl && <img src={settings.heroImageUrl} alt="Hero Preview" className="mt-2 h-32 rounded-lg object-cover" referrerPolicy="no-referrer" />}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">URL Foto Kegiatan (Pisahkan dengan koma)</label>
                <textarea 
                  value={(settings.galleryImages || []).join(',\n')} 
                  onChange={(e) => setSettings({...settings, galleryImages: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 h-32" 
                  placeholder="https://example.com/img1.png,&#10;https://example.com/img2.png"
                />
              </div>
              <button type="submit" className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all">Simpan Pengaturan</button>
            </form>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-6 max-w-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Profil Admin</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-lg">
                  {editPhoto ? (
                    <img src={editPhoto} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User size={40} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">URL Foto Profil</label>
                  <input 
                    type="url" 
                    value={editPhoto} 
                    onChange={(e) => setEditPhoto(e.target.value)} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                    placeholder="https://example.com/photo.png"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email (Tidak dapat diubah)</label>
                <input 
                  type="email" 
                  value={userData?.email || ''} 
                  disabled
                  className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl outline-none text-gray-500 cursor-not-allowed" 
                />
              </div>
              <button type="submit" className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all">Simpan Profil</button>
            </form>
          </div>
        )}

        {/* Modals */}
        {showEditUser && editingUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
              <button onClick={() => { setShowEditUser(false); setEditingUser(null); }} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Edit User</h3>
              <form onSubmit={handleEditUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Lengkap</label>
                  <input type="text" value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Tidak dapat diubah)</label>
                  <input type="email" value={editingUser.email} disabled className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl outline-none text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                  <select value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500">
                    <option value="siswa">Siswa</option>
                    <option value="guru">Guru</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {editingUser.role === 'siswa' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kelas</label>
                      <input type="text" value={editingUser.kelas || ''} onChange={(e) => setEditingUser({...editingUser, kelas: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">No WhatsApp</label>
                      <input type="text" value={editingUser.whatsapp || ''} onChange={(e) => setEditingUser({...editingUser, whatsapp: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required />
                    </div>
                  </>
                )}
                <button type="submit" className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all mt-4">Simpan Perubahan</button>
              </form>
            </div>
          </div>
        )}

        {showDeleteConfirm && userToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Hapus User?</h3>
              <p className="text-gray-500 mb-6">Apakah Anda yakin ingin menghapus user <strong>{userToDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteConfirm(false); setUserToDelete(null); }} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all">Batal</button>
                <button onClick={handleDeleteUser} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200">Hapus</button>
              </div>
            </div>
          </div>
        )}

        {showResetPassword && userToReset && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl relative">
              <button onClick={() => { setShowResetPassword(false); setUserToReset(null); setNewPassword(''); }} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
              <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">Reset Password</h3>
              <p className="text-gray-500 mb-6 text-center text-sm">Ubah password untuk <strong>{userToReset.name}</strong> ({userToReset.email})</p>
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password Baru</label>
                  <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500" placeholder="Masukkan password baru" required minLength={6} />
                </div>
                <button type="submit" className="w-full px-4 py-3 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-200">Simpan Password</button>
              </form>
            </div>
          </div>
        )}

        {showAddUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
              <button onClick={() => setShowAddUser(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Tambah User Baru</h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Lengkap</label>
                  <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Username)</label>
                  <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                  <input type="text" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required minLength={6} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                  <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500">
                    <option value="siswa">Siswa</option>
                    <option value="guru">Guru</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {newUserRole === 'siswa' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kelas</label>
                      <input type="text" value={newUserKelas} onChange={(e) => setNewUserKelas(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">No WhatsApp</label>
                      <input type="text" value={newUserWhatsapp} onChange={(e) => setNewUserWhatsapp(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required />
                    </div>
                  </>
                )}
                <button type="submit" className="w-full px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-xl shadow-green-200 transition-all mt-4">Simpan User</button>
              </form>
            </div>
          </div>
        )}

        {showTabunganModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
              <button onClick={() => setShowTabunganModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Input Tabungan Siswa</h3>
              <form onSubmit={handleAddTabungan} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pilih Siswa</label>
                  <select value={financeStudentId} onChange={(e) => setFinanceStudentId(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required>
                    <option value="">-- Pilih Siswa --</option>
                    {allUsers.filter(u => u.role === 'siswa').map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.kelas || '-'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal</label>
                  <input type="date" value={financeDate} onChange={(e) => setFinanceDate(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nominal (Rp)</label>
                  <input type="number" value={financeAmount} onChange={(e) => setFinanceAmount(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" placeholder="Contoh: 10000" required min="0" />
                </div>
                <button type="submit" className="w-full px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-xl shadow-green-200 transition-all mt-4">Simpan Tabungan</button>
              </form>
            </div>
          </div>
        )}

        {showIuranModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
              <button onClick={() => setShowIuranModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Penetapan Iuran</h3>
              <form onSubmit={handleAddIuran} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Iuran (Group)</label>
                  <input type="text" value={financeIuranName} onChange={(e) => setFinanceIuranName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: SPP Bulan Juli" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nominal (Rp)</label>
                  <input type="number" value={financeAmount} onChange={(e) => setFinanceAmount(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: 50000" required min="0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Siswa</label>
                  <select value={financeIuranTarget} onChange={(e) => setFinanceIuranTarget(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="all">Semua Siswa</option>
                    <option value="kelas_A">Semua Siswa Kelas A</option>
                    <option value="kelas_B">Semua Siswa Kelas B</option>
                    <option value="kelas_C">Semua Siswa Kelas C</option>
                    <optgroup label="Pilih Siswa Spesifik">
                      {allUsers.filter(u => u.role === 'siswa').map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.kelas || '-'})</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <button type="submit" className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all mt-4">Tetapkan Iuran</button>
              </form>
            </div>
          </div>
        )}

        {showAnnounceModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
              <button onClick={() => setShowAnnounceModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Buat Pengumuman</h3>
              <form onSubmit={handleAddAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Judul</label>
                  <input type="text" value={announceTitle} onChange={(e) => setAnnounceTitle(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Isi Pengumuman</label>
                  <textarea value={announceContent} onChange={(e) => setAnnounceContent(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 h-32 resize-none" required />
                </div>
                <button type="submit" className="w-full px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-xl shadow-green-200 transition-all mt-4">Kirim Broadcast</button>
              </form>
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

const MapPin = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);
