import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { getApps, initializeApp } from 'firebase/app';
import { sendPasswordResetEmail, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, getDoc, updateDoc, setDoc, orderBy, getDocs, where } from 'firebase/firestore';
import { Users, Shield, Plus, Trash2, Edit, BarChart, Bell, LogOut, User, Download, CreditCard, Megaphone, X, Menu, Settings, Image as ImageIcon, Key, Upload, CheckCircle, Camera, TrendingUp, BookOpen, Clock, Printer, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { compressImage } from '../lib/imageUtils';
import { getPrintHeaderHTML, getPrintStyles, getPrintSignatureHTML } from '../lib/printUtils';
import * as XLSX from 'xlsx';
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

export default function DashboardAdmin() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
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
  const [showPayConfirmModal, setShowPayConfirmModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer' | 'Tabungan'>('Tunai');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentProof, setPaymentProof] = useState('');
  const [activeDetailToPay, setActiveDetailToPay] = useState<any>(null);
  const [activeStudentForPayment, setActiveStudentForPayment] = useState<any>(null);
  const paymentProofRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  // Manage Finance Modal States
  const [showManageFinanceModal, setShowManageFinanceModal] = useState(false);
  const [selectedStudentForFinance, setSelectedStudentForFinance] = useState<any>(null);

  // Profile Edit States
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  
  // Photo Viewer State
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Attendance Filter States
  const [filterRole, setFilterRole] = useState<'semua' | 'siswa' | 'guru'>('semua');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [studentPaymentHistory, setStudentPaymentHistory] = useState<any[]>([]);

  // Academic States
  const [schoolClasses, setSchoolClasses] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [showMutasiModal, setShowMutasiModal] = useState(false);
  const [mutasiTargetClass, setMutasiTargetClass] = useState('');
  const [selectedStudentsForMutasi, setSelectedStudentsForMutasi] = useState<string[]>([]);
  const [selectedStudentForRapot, setSelectedStudentForRapot] = useState<any>(null);

  useEffect(() => {
    if (showManageFinanceModal && selectedStudentForFinance) {
      const q = query(
        collection(db, 'payments'),
        where('studentId', '==', selectedStudentForFinance.id),
        orderBy('createdAt', 'desc')
      );
      const unsub = onSnapshot(q, (snap) => {
        setStudentPaymentHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsub();
    }
  }, [showManageFinanceModal, selectedStudentForFinance]);

  const handlePrintReceipt = (pay: any) => {
    const student = allUsers.find(u => u.id === pay.studentId);
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
              <span class="receipt-value">${student?.name || 'Unknown'}</span>
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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (!userDoc.exists() || userDoc.data().role !== 'admin') {
            navigate('/login');
            return;
          }
          
          setUser(currentUser);
          setUserData(userDoc.data());
          setEditName(userDoc.data().name || '');
          setEditPhoto(userDoc.data().photoURL || '');
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

  useEffect(() => {
    if (!user) return;

    // Listeners
    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      if (!error.message.includes('insufficient permissions')) {
        console.error("Error fetching users:", error);
      }
    });

    const unsubAttendance = onSnapshot(query(collection(db, 'attendance'), orderBy('timestamp', 'desc')), (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      if (!error.message.includes('insufficient permissions')) {
        console.error("Error fetching attendance:", error);
      }
    });

    const unsubAnnounce = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      if (!error.message.includes('insufficient permissions')) {
        console.error("Error fetching announcements:", error);
      }
    });

    const unsubPayments = onSnapshot(query(collection(db, 'payments'), orderBy('createdAt', 'desc')), (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      if (!error.message.includes('insufficient permissions')) {
        console.error("Error fetching payments:", error);
      }
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'landingPage'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
      setLoading(false);
    }, (error) => {
      if (!error.message.includes('insufficient permissions')) {
        console.error("Error fetching settings:", error);
      }
      setLoading(false);
    });

    const unsubClasses = onSnapshot(query(collection(db, 'classes'), orderBy('name', 'asc')), (snapshot) => {
      setSchoolClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {});

    const unsubProgress = onSnapshot(query(collection(db, 'progress'), orderBy('createdAt', 'desc')), (snapshot) => {
      setProgressData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {});

    return () => {
      unsubUsers();
      unsubAttendance();
      unsubAnnounce();
      unsubPayments();
      unsubSettings();
      unsubClasses();
      unsubProgress();
    };
  }, [user]);

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
      
      // Log to payments history
      await addDoc(collection(db, 'payments'), {
        studentId: userId,
        amount: Number(value),
        description: `Update manual ${field === 'savings' ? 'Tabungan' : 'Tunggakan'}`,
        type: field,
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      });
      
      if (selectedStudentForFinance && selectedStudentForFinance.id === userId) {
        setSelectedStudentForFinance((prev: any) => ({
          ...prev,
          [field]: Number(value)
        }));
      }

      alert('Data administrasi berhasil disimpan!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handlePelunasan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudentForPayment || !activeDetailToPay) return;

    try {
      const student = activeStudentForPayment;
      const detailToPay = activeDetailToPay;

      // Special logic for Tabungan
      if (paymentMethod === 'Tabungan') {
        const currentSavings = student.savings || 0;
        if (currentSavings < detailToPay.amount) {
          alert('Tabungan tidak cukup untuk melakukan pelunasan ini.');
          return;
        }
        
        const newSavings = currentSavings - detailToPay.amount;
        await updateDoc(doc(db, 'users', student.id), { savings: newSavings });
      }

      const newDetails = (student.arrears_details || []).filter((d: any) => d.id !== detailToPay.id);
      const newArrears = Math.max(0, (student.arrears || 0) - detailToPay.amount);
      
      await updateDoc(doc(db, 'users', student.id), {
        arrears: newArrears,
        arrears_details: newDetails
      });

      // Log to payments history
      await addDoc(collection(db, 'payments'), {
        studentId: student.id,
        amount: detailToPay.amount,
        description: `Pelunasan: ${detailToPay.name}${paymentNote ? ` (${paymentNote})` : ''}`,
        type: 'iuran',
        method: paymentMethod,
        proof: paymentProof || null,
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      });
      
      if (selectedStudentForFinance && selectedStudentForFinance.id === student.id) {
        // Refresh local student data if needed
        const updatedStudent = {
          ...student,
          arrears: newArrears,
          arrears_details: newDetails,
          savings: paymentMethod === 'Tabungan' ? (student.savings || 0) - detailToPay.amount : student.savings
        };
        setSelectedStudentForFinance(updatedStudent);
        
        // Also update allUsers list to stay in sync
        setAllUsers(prev => prev.map(u => u.id === student.id ? updatedStudent : u));
      }
      
      alert('Pelunasan berhasil dicatat!');
      setShowPayConfirmModal(false);
      setPaymentNote('');
      setPaymentMethod('Tunai');
      setPaymentProof('');
      setActiveDetailToPay(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${activeStudentForPayment.id}`);
    }
  };

  const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        try {
          const compressed = await compressImage(result, 800, 800, 0.7);
          setPaymentProof(compressed);
        } catch (error) {
          console.error("Compression failed:", error);
          setPaymentProof(result);
        }
      };
      reader.readAsDataURL(file);
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
      
      // Log to payments history
      await addDoc(collection(db, 'payments'), {
        studentId: financeStudentId,
        amount: Number(financeAmount),
        description: 'Setoran Tabungan',
        type: 'tabungan',
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

        // Log to payments history (Notification of new charge)
        await addDoc(collection(db, 'payments'), {
          studentId: student.id,
          amount: amount,
          description: `Tagihan Baru: ${financeIuranName}`,
          type: 'tagihan',
          date: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
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

  const getMonthlyFinanceData = () => {
    const months: { [key: string]: { month: string, savings: number, arrears: number } } = {};
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('id-ID', { month: 'short', year: '2-digit' });
      months[key] = { month: monthLabel, savings: 0, arrears: 0 };
      last6Months.push(key);
    }

    payments.forEach(p => {
      if (!p.date) return;
      const [year, month] = p.date.split('-');
      const key = `${year}-${month}`;
      if (months[key]) {
        if (p.type === 'tabungan' || p.type === 'savings') {
          months[key].savings += p.amount || 0;
        } else if (p.type === 'iuran' || p.type === 'arrears') {
          months[key].arrears += p.amount || 0;
        }
      }
    });

    return last6Months.map(key => months[key]);
  };

  // Academic Action Handlers
  const handleAddClassCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;
    try {
      await addDoc(collection(db, 'classes'), {
        name: newClassName.toUpperCase(),
        createdAt: serverTimestamp()
      });
      setNewClassName('');
      setShowClassModal(false);
      alert('Kategori Kelas berhasil ditambahkan!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'classes');
    }
  };

  const handleMutasiMassal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentsForMutasi.length === 0 || !mutasiTargetClass) {
      alert('Pilih minimal 1 siswa dan kelas tujuan!');
      return;
    }
    
    if (!window.confirm(`Yakin ingin memutasi ${selectedStudentsForMutasi.length} siswa ke ${mutasiTargetClass === 'Lulus' ? 'Lulus/Alumni' : 'Kelas ' + mutasiTargetClass}?`)) {
      return;
    }

    try {
      setLoading(true);
      for (const studentId of selectedStudentsForMutasi) {
        if (mutasiTargetClass === 'Lulus') {
          // Mutasi menjadi alumni/lulus
          await updateDoc(doc(db, 'users', studentId), {
            kelas: 'Lulus',
            status: 'Alumni',
            updatedAt: serverTimestamp()
          });
        } else {
          // Mutasi ke kelas baru
          const classDoc = schoolClasses.find(c => c.id === mutasiTargetClass);
          await updateDoc(doc(db, 'users', studentId), {
            kelas: classDoc?.name || '',
            updatedAt: serverTimestamp()
          });
        }
      }
      setSelectedStudentsForMutasi([]);
      setShowMutasiModal(false);
      alert('Mutasi siswa berhasil!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users (mutasi)');
    } finally {
      setLoading(false);
    }
  };

  const getScoreGradeInfo = (score: number) => {
    if (score >= 90) return { grade: 'A', text: 'Sangat Baik', color: 'text-green-600' };
    if (score >= 80) return { grade: 'B', text: 'Baik', color: 'text-blue-600' };
    if (score >= 70) return { grade: 'C', text: 'Cukup', color: 'text-orange-600' };
    return { grade: 'D', text: 'Kurang', color: 'text-red-600' };
  };

  const handlePrintRapot = (studentId: string) => {
    const student = allUsers.find(u => u.id === studentId);
    if (!student) return;
    
    // Get student's progress data and sort ascending by date
    const studentProgressList = progressData
      .filter(p => p.studentId === studentId)
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let itemsHtml = '';
    studentProgressList.forEach((p, idx) => {
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

    if (studentProgressList.length === 0) {
      itemsHtml = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #666; font-style: italic;">Belum ada data evaluasi belajar.</td></tr>`;
    }

    const html = `
      <html>
        <head>
          <title>Rapot Belajar - ${student.name}</title>
          <style>
            ${getPrintStyles()}
          </style>
        </head>
        <body onload="window.print();">
          ${getPrintHeaderHTML('LAPORAN HASIL BELAJAR (RAPOT)', settings?.schoolName, settings?.logoUrl)}
          
          <div class="student-info">
            <div>Nama Siswa</div><div>: ${student.name}</div>
            <div>NIS/NISN</div><div>: ${student.email?.split('@')[0] || '-'}</div>
            <div>Kelas</div><div>: ${student.kelas || 'Belum Ditentukan'}</div>
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Memuat data...</div>;

  const NavItems = () => (
    <nav className="space-y-2 flex-1">
      <button 
        onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'overview' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <BarChart size={20} className={activeTab === 'overview' ? 'text-white' : 'text-gray-400'} /> Dashboard
      </button>
      <button 
        onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'users' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <Users size={20} className={activeTab === 'users' ? 'text-white' : 'text-gray-400'} /> User Management
      </button>
      <button 
        onClick={() => { setActiveTab('academic'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'academic' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <BookOpen size={20} className={activeTab === 'academic' ? 'text-white' : 'text-gray-400'} /> Akademik & Rapot
      </button>
      <button 
        onClick={() => { setActiveTab('finance'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'finance' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <CreditCard size={20} className={activeTab === 'finance' ? 'text-white' : 'text-gray-400'} /> Administrasi
      </button>
      <button 
        onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'attendance' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <CheckCircle size={20} className={activeTab === 'attendance' ? 'text-white' : 'text-gray-400'} /> Absensi
      </button>
      <button 
        onClick={() => { setActiveTab('announcements'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'announcements' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <Megaphone size={20} className={activeTab === 'announcements' ? 'text-white' : 'text-gray-400'} /> Pengumuman
      </button>
      <button 
        onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'settings' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <Settings size={20} className={activeTab === 'settings' ? 'text-white' : 'text-gray-400'} /> Pengaturan Web
      </button>
      <button 
        onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'profile' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <User size={20} className={activeTab === 'profile' ? 'text-white' : 'text-gray-400'} /> Profil Admin
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
            <span className="font-bold text-gray-800 block leading-tight">Portal Admin</span>
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">RA Darusyifa</span>
          </div>
        </div>
        <button onClick={() => auth.signOut()} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
          <LogOut size={20} />
        </button>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="w-72 bg-white border-r border-gray-100 p-6 hidden md:flex flex-col shadow-sm z-10">
        <div className="flex items-center gap-4 mb-12">
          {settings?.logoUrl ? (
            <div className="w-12 h-12 overflow-hidden rounded-2xl border-2 border-green-600 p-0.5 bg-white">
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-green-200">RA</div>
          )}
          <div>
            <h1 className="font-bold text-xl text-gray-800 tracking-tight">Portal Admin</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">RA Darusyifa</p>
          </div>
        </div>
        <NavItems />
        <div className="mt-auto pt-10 border-t border-gray-100">
          <button onClick={() => auth.signOut()} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-50 text-red-600 font-medium transition-all group">
            <div className="p-2 bg-red-100 rounded-xl group-hover:bg-red-200 transition-colors"><LogOut size={18} /></div>
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center p-2 z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] overflow-x-auto">
        <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[60px] ${activeTab === 'overview' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <div className={`p-1.5 rounded-lg ${activeTab === 'overview' ? 'bg-green-50' : ''}`}>
            <BarChart size={22} />
          </div>
          <span className="text-[10px] font-bold">Beranda</span>
        </button>
        <button onClick={() => setActiveTab('users')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[60px] ${activeTab === 'users' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <div className={`p-1.5 rounded-lg ${activeTab === 'users' ? 'bg-green-50' : ''}`}>
            <Users size={22} />
          </div>
          <span className="text-[10px] font-bold">Users</span>
        </button>
        <button onClick={() => setActiveTab('academic')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[60px] ${activeTab === 'academic' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <div className={`p-1.5 rounded-lg ${activeTab === 'academic' ? 'bg-green-50' : ''}`}>
            <BookOpen size={22} />
          </div>
          <span className="text-[10px] font-bold">Akademik</span>
        </button>
        <button onClick={() => setActiveTab('finance')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[60px] ${activeTab === 'finance' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <div className={`p-1.5 rounded-lg ${activeTab === 'finance' ? 'bg-green-50' : ''}`}>
            <CreditCard size={22} />
          </div>
          <span className="text-[10px] font-bold">Admin</span>
        </button>
        <button onClick={() => setActiveTab('attendance')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[60px] ${activeTab === 'attendance' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <div className={`p-1.5 rounded-lg ${activeTab === 'attendance' ? 'bg-green-50' : ''}`}>
            <CheckCircle size={22} />
          </div>
          <span className="text-[10px] font-bold">Absen</span>
        </button>
        <button onClick={() => setActiveTab('announcements')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[60px] ${activeTab === 'announcements' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <div className={`p-1.5 rounded-lg ${activeTab === 'announcements' ? 'bg-green-50' : ''}`}>
            <Megaphone size={22} />
          </div>
          <span className="text-[10px] font-bold">Info</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {showClassModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative">
              <button onClick={() => setShowClassModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
              <h3 className="text-xl font-black text-gray-800 mb-6">Tambah Kategori Kelas</h3>
              <form onSubmit={handleAddClassCategory} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nama Kelas Baru (Cth: KELAS A1, KELAS B2)</label>
                  <input type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 uppercase" required placeholder="NAMA KELAS" />
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-100 mt-2">Simpan Kelas</button>
              </form>
            </div>
          </div>
        )}

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
          <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
            <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-sm border border-gray-100 p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 md:mb-10">Ringkasan Aktivitas</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: 'Total Siswa', value: allUsers.filter(u => u.role === 'siswa').length, color: 'bg-blue-500', icon: Users },
                  { label: 'Total Guru', value: allUsers.filter(u => u.role === 'guru').length, color: 'bg-green-500', icon: Shield },
                  { label: 'Absensi Hari Ini', value: attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length, color: 'bg-purple-500', icon: CheckCircle },
                  { label: 'Total Tabungan', value: `Rp ${allUsers.reduce((acc, curr) => acc + (curr.savings || 0), 0).toLocaleString()}`, color: 'bg-yellow-500', icon: CreditCard }
                ].map((stat, i) => (
                  <div key={i} className="bg-gray-50 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-gray-100 flex flex-col items-center justify-center text-center group hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all">
                    <div className={`w-12 h-12 md:w-14 md:h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-opacity-20 mb-3 md:mb-4 group-hover:scale-110 transition-transform`}>
                      <stat.icon size={24} className="md:w-7 md:h-7" />
                    </div>
                    <p className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-widest mb-1">{stat.label}</p>
                    <h4 className="text-lg md:text-2xl font-black text-gray-800 tracking-tight">{stat.value}</h4>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2 bg-white rounded-[32px] md:rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight">Peluncur Aktivitas Terbaru</h3>
                  <button onClick={() => setActiveTab('attendance')} className="text-[10px] md:text-xs font-bold text-blue-600 hover:underline uppercase tracking-widest">Lihat Semua</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                      <tr>
                        <th className="px-4 py-3 md:px-6 md:py-4 rounded-l-xl">Siswa</th>
                        <th className="px-4 py-3 md:px-6 md:py-4">Waktu</th>
                        <th className="px-4 py-3 md:px-6 md:py-4">Status</th>
                        <th className="px-4 py-3 md:px-6 md:py-4 rounded-r-xl">Lokasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {attendance.slice(0, 10).map((a) => {
                        const student = allUsers.find(u => u.id === a.studentId);
                        return (
                          <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 md:px-6 md:py-4">
                              <div className="font-bold text-gray-800 text-sm md:text-base">{student?.name || 'Unknown'}</div>
                              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">{student?.email}</div>
                            </td>
                            <td className="px-4 py-3 md:px-6 md:py-4">
                              <div className="text-xs md:text-sm font-bold text-gray-600">{a.date}</div>
                              <span className="text-[10px] text-gray-400 font-bold uppercase">{a.timestamp ? new Date(a.timestamp.seconds * 1000).toLocaleTimeString() : ''}</span>
                            </td>
                            <td className="px-4 py-3 md:px-6 md:py-4">
                              <span className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider ${a.status === 'masuk' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 md:px-6 md:py-4">
                              {a.location?.latitude ? (
                                <a href={`https://www.google.com/maps?q=${a.location.latitude},${a.location.longitude}`} target="_blank" rel="noreferrer" className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                                  <MapPin size={16} />
                                </a>
                              ) : (
                                <span className="text-[10px] text-gray-400 italic">No Loc</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {attendance.length === 0 && (
                         <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic text-sm">Belum ada riwayat absensi.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-6 md:space-y-8">
                <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-sm border border-gray-100">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
                    <ImageIcon size={20} className="text-blue-500" /> Pengaturan Logo
                  </h3>
                  <div className="aspect-video bg-gray-50 rounded-2xl md:rounded-[24px] border border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 relative group overflow-hidden">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2 md:p-4" referrerPolicy="no-referrer" />
                    ) : (
                      <Upload size={28} className="text-gray-300" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <label className="cursor-pointer text-[10px] md:text-xs font-bold text-white uppercase tracking-widest border border-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl hover:bg-white/20 transition-colors">
                        Ganti Logo
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                             const reader = new FileReader();
                             reader.onloadend = async () => {
                               const result = reader.result as string;
                               try {
                                 const compressed = await compressImage(result, 600, 600, 0.7);
                                 setSettings({...settings, logoUrl: compressed});
                                 await setDoc(doc(db, 'settings', 'landingPage'), {...settings, logoUrl: compressed});
                               } catch (error) {
                                  console.error(error);
                               }
                             };
                             reader.readAsDataURL(file);
                          }
                        }} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[32px] md:rounded-[40px] p-6 md:p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2 opacity-90 tracking-tight"><Megaphone size={20} /> Pengumuman</h3>
                  {announcements.length > 0 ? (
                    <div>
                      <h4 className="font-bold text-base md:text-lg mb-2 line-clamp-1">{announcements[0].title}</h4>
                      <p className="text-indigo-100/70 text-xs md:text-sm line-clamp-2 md:line-clamp-3 leading-relaxed mb-4 md:mb-6">{announcements[0].content}</p>
                      <button onClick={() => setActiveTab('announcements')} className="w-full py-2.5 md:py-3 bg-white/10 hover:bg-white/20 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold uppercase tracking-[2px] transition-all">Kelola Info</button>
                    </div>
                  ) : (
                    <p className="text-indigo-100/50 text-xs md:text-sm italic mb-4">Belum ada pengumuman.</p>
                  )}
                </div>
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

        {activeTab === 'academic' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Class Categories Manager */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h3 className="text-xl font-black text-gray-800 tracking-tight">Kategori Kelas</h3>
                  <p className="text-xs text-gray-400 font-bold mt-1">Buat kelas untuk memutasi siswa di tahun ajaran baru.</p>
                </div>
                <button 
                  onClick={() => setShowClassModal(true)}
                  className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all text-xs shadow-lg shadow-green-100"
                >
                  <Plus size={16} /> Buat Kelas
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {schoolClasses.length > 0 ? schoolClasses.map(c => (
                  <div key={c.id} className="bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-3">
                    <BookOpen size={16} className="text-gray-400" />
                    <span className="font-bold text-gray-700 text-sm uppercase tracking-widest">{c.name}</span>
                    <button onClick={async () => {
                      if(window.confirm('Hapus kelas ini?')) {
                        await deleteDoc(doc(db, 'classes', c.id));
                      }
                    }} className="text-red-400 hover:text-red-600 transition-colors ml-2"><Trash2 size={14}/></button>
                  </div>
                )) : (
                  <p className="text-gray-400 italic text-sm">Belum ada kategori kelas. Silakan buat baru.</p>
                )}
              </div>
            </div>

            {/* Mutasi & Rapot Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/30">
                <div>
                  <h3 className="text-xl font-black text-gray-800 tracking-tight">Akademik & Rapot Siswa</h3>
                  <p className="text-xs text-gray-400 font-bold mt-1">Pilih siswa untuk mutasi (kenaikan/kelulusan) atau cetak Rapot.</p>
                </div>
                {selectedStudentsForMutasi.length > 0 && (
                  <div className="flex gap-3 items-center w-full sm:w-auto bg-blue-50 p-3 rounded-2xl border border-blue-100">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest px-2">{selectedStudentsForMutasi.length} Dipilih</span>
                    <select 
                      value={mutasiTargetClass} 
                      onChange={(e) => setMutasiTargetClass(e.target.value)} 
                      className="text-xs p-2 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700"
                    >
                      <option value="">-- Pilih Tujuan --</option>
                      {schoolClasses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                      <option value="Lulus">LULUS / ALUMNI</option>
                    </select>
                    <button onClick={handleMutasiMassal} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md">Eksekusi Mutasi</button>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4 w-12">
                        <input 
                          type="checkbox" 
                          onChange={(e) => {
                            if(e.target.checked) setSelectedStudentsForMutasi(allUsers.filter(u => u.role === 'siswa').map(u => u.id));
                            else setSelectedStudentsForMutasi([]);
                          }} 
                          checked={selectedStudentsForMutasi.length === allUsers.filter(u => u.role === 'siswa').length && allUsers.filter(u => u.role === 'siswa').length > 0}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-4">Nama Siswa</th>
                      <th className="px-6 py-4">Kelas Saat Ini</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Rapot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allUsers.filter(u => u.role === 'siswa').map(student => (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            checked={selectedStudentsForMutasi.includes(student.id)}
                            onChange={(e) => {
                              if(e.target.checked) setSelectedStudentsForMutasi([...selectedStudentsForMutasi, student.id]);
                              else setSelectedStudentsForMutasi(selectedStudentsForMutasi.filter(id => id !== student.id));
                            }}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800">{student.name}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-widest">{student.kelas || 'Belum Ditentukan'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${student.status === 'Alumni' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                            {student.status || 'Aktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handlePrintRapot(student.id)}
                            className="bg-gray-800 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors inline-flex items-center gap-2"
                          >
                            <Printer size={14} /> Cetak
                          </button>
                        </td>
                      </tr>
                    ))}
                    {allUsers.filter(u => u.role === 'siswa').length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic font-medium">Brak data siswa ditemukan.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">Kelola Absensi</h3>
                <p className="text-gray-400 text-sm font-medium">Filter dan monitoring kehadiran warga sekolah.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="flex bg-gray-100 p-1 rounded-2xl">
                  {['semua', 'siswa', 'guru'].map(role => (
                    <button
                      key={role}
                      onClick={() => setFilterRole(role as any)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterRole === role ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={exportToCSV}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 text-xs"
                >
                  <Download size={18} /> EXPORT ABSENSI
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Hadir', count: attendance.filter(a => a.status === 'masuk').length, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Sakit', count: attendance.filter(a => a.status === 'sakit').length, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Izin', count: attendance.filter(a => a.status === 'izin').length, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Alpha', count: attendance.filter(a => a.status === 'alpha').length, color: 'text-red-600', bg: 'bg-red-50' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} p-6 rounded-[2rem] border border-white flex flex-col items-center justify-center text-center shadow-sm`}>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
                  <h4 className={`text-2xl font-black ${s.color}`}>{s.count}</h4>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h4 className="text-lg font-black text-gray-800 mb-6 tracking-tight">Statistik Kehadiran</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Hadir', value: attendance.filter(a => a.status === 'masuk').length, color: '#16a34a' },
                          { name: 'Sakit', value: attendance.filter(a => a.status === 'sakit').length, color: '#2563eb' },
                          { name: 'Izin', value: attendance.filter(a => a.status === 'izin').length, color: '#9333ea' },
                          { name: 'Alpha', value: attendance.filter(a => a.status === 'alpha').length, color: '#dc2626' },
                        ]}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { color: '#16a34a' },
                          { color: '#2563eb' },
                          { color: '#9333ea' },
                          { color: '#dc2626' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h4 className="text-lg font-black text-gray-800 mb-6 tracking-tight">Tren Mingguan</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={(() => {
                      const days = [];
                      for (let i = 6; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        const dateStr = d.toISOString().split('T')[0];
                        days.push({
                          name: dateStr.split('-').slice(1).reverse().join('/'),
                          hadir: attendance.filter(a => a.date === dateStr && a.status === 'masuk').length
                        });
                      }
                      return days;
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="hadir" fill="#16a34a" radius={[6, 6, 0, 0]} barSize={20} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dari</span>
                    <input type="date" value={filterDateStart} onChange={(e) => setFilterDateStart(e.target.value)} className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sampai</span>
                    <input type="date" value={filterDateEnd} onChange={(e) => setFilterDateEnd(e.target.value)} className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-5">Subjek</th>
                      <th className="px-8 py-5">Waktu Presensi</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5">Dokumentasi</th>
                      <th className="px-8 py-5">Lokasi</th>
                      <th className="px-8 py-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {attendance
                      .filter(a => {
                        const student = allUsers.find(u => u.id === a.studentId);
                        if (filterRole !== 'semua' && student?.role !== filterRole) return false;
                        if (filterDateStart && a.date < filterDateStart) return false;
                        if (filterDateEnd && a.date > filterDateEnd) return false;
                        return true;
                      })
                      .map((a) => {
                        const student = allUsers.find(u => u.id === a.studentId);
                        return (
                          <tr key={a.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="font-bold text-gray-800">{student?.name || 'Unknown'}</div>
                              <div className="text-[10px] font-black text-gray-400 uppercase tracking-tight">{student?.role === 'guru' ? 'STAFF GURU' : (student?.kelas || 'SISWA')}</div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="text-sm font-bold text-gray-600">{a.date}</div>
                              <span className="text-[10px] text-gray-400 font-bold uppercase">{a.timestamp ? new Date(a.timestamp.seconds * 1000).toLocaleTimeString() : ''}</span>
                            </td>
                            <td className="px-8 py-6">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                a.status === 'masuk' ? 'bg-green-100 text-green-700' : 
                                a.status === 'sakit' ? 'bg-blue-100 text-blue-700' :
                                a.status === 'izin' ? 'bg-purple-100 text-purple-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              {a.photo ? (
                                <img 
                                  src={a.photo} 
                                  alt="Absensi" 
                                  className="h-12 w-12 object-cover rounded-2xl border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform" 
                                  onClick={() => setSelectedPhoto(a.photo)} 
                                />
                              ) : (
                                <span className="text-[10px] font-bold text-gray-300 uppercase italic">Tanpa Foto</span>
                              )}
                            </td>
                            <td className="px-8 py-6">
                              <a href={`https://www.google.com/maps?q=${a.location?.latitude},${a.location?.longitude}`} target="_blank" rel="noreferrer" className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                <MapPin size={18} />
                              </a>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <button onClick={async () => {
                                if(window.confirm('Hapus data absensi ini?')) {
                                  try {
                                    await deleteDoc(doc(db, 'attendance', a.id));
                                    alert('Absensi berhasil dihapus!');
                                  } catch (error) {
                                    handleFirestoreError(error, OperationType.DELETE, `attendance/${a.id}`);
                                  }
                                }
                              }} className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all group-hover:shadow-lg">
                                <Trash2 size={18} />
                              </button>
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

            {/* Visual Summary Chart */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h4 className="text-xl font-black text-gray-800 tracking-tight">Ringkasan Keuangan</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase mt-1">Total Tabungan vs Pelunasan Iuran (6 Bulan Terakhir)</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Tabungan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Iuran</span>
                  </div>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={getMonthlyFinanceData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                      tickFormatter={(value) => `Rp${(value / 1000).toLocaleString()}k`}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '15px' }}
                      formatter={(value: any) => [`Rp ${value.toLocaleString()}`, '']}
                    />
                    <Bar dataKey="savings" fill="#10b981" radius={[6, 6, 0, 0]} name="Tabungan" barSize={25} />
                    <Bar dataKey="arrears" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Pelunasan Iuran" barSize={25} />
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Nama Siswa</th>
                      <th className="px-6 py-4">Kelas</th>
                      <th className="px-6 py-4">Total Tabungan</th>
                      <th className="px-6 py-4">Total Tunggakan</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allUsers.filter(u => u.role === 'siswa').map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-800">{u.name}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{u.kelas || '-'}</td>
                        <td className="px-6 py-4 font-bold text-green-600">Rp {(u.savings || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 font-bold text-red-600">Rp {(u.arrears || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => {
                              setSelectedStudentForFinance(u);
                              setShowManageFinanceModal(true);
                            }}
                            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                          >
                            Kelola Keuangan
                          </button>
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
                    <h4 className="font-bold text-gray-800 text-xl">{a.title}</h4>
                    <div className="text-gray-600 text-sm mt-4 leading-relaxed whitespace-pre-wrap">{a.content}</div>
                    <div className="mt-6 flex items-center gap-2 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      <span>{a.author}</span>
                      <span>•</span>
                      <span>{a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleString() : ''}</span>
                    </div>
                  </div>
                  <button onClick={async () => {
                    if(window.confirm('Hapus pengumuman ini?')) {
                      try {
                        await deleteDoc(doc(db, 'announcements', a.id));
                        alert('Pengumuman berhasil dihapus!');
                      } catch (error) {
                        handleFirestoreError(error, OperationType.DELETE, `announcements/${a.id}`);
                      }
                    }
                  }} className="text-gray-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
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
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-4xl">
            <h3 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
              <Settings size={22} className="text-green-600" /> Editor Konten Website
            </h3>
            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nama Sekolah</label>
                  <input 
                    type="text" 
                    value={settings.schoolName || ''} 
                    onChange={(e) => setSettings({...settings, schoolName: e.target.value})} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                    placeholder="RA Darusyifa Arjawinangun"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Teks Akreditasi</label>
                  <input 
                    type="text" 
                    value={settings.accreditationText || ''} 
                    onChange={(e) => setSettings({...settings, accreditationText: e.target.value})} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                    placeholder="Terakreditasi B"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nomor WhatsApp (62...)</label>
                  <input 
                    type="text" 
                    value={settings.whatsappNumber || ''} 
                    onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Judul Tentang Kami</label>
                  <input 
                    type="text" 
                    value={settings.aboutTitle || ''} 
                    onChange={(e) => setSettings({...settings, aboutTitle: e.target.value})} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Konten Tentang Kami</label>
                <textarea 
                  value={settings.aboutText || ''} 
                  onChange={(e) => setSettings({...settings, aboutText: e.target.value})} 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 h-32" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Alamat Sekolah</label>
                <textarea 
                  value={settings.address || ''} 
                  onChange={(e) => setSettings({...settings, address: e.target.value})} 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 h-24" 
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">URL Logo Sekolah</label>
                  <input 
                    type="url" 
                    value={settings.logoUrl || ''} 
                    onChange={(e) => setSettings({...settings, logoUrl: e.target.value})} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                  />
                  {settings.logoUrl && <img src={settings.logoUrl} alt="Logo Preview" className="mt-2 h-16 object-contain" referrerPolicy="no-referrer" />}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">URL Gambar Hero</label>
                  <input 
                    type="url" 
                    value={settings.heroImageUrl || ''} 
                    onChange={(e) => setSettings({...settings, heroImageUrl: e.target.value})} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                  />
                  {settings.heroImageUrl && <img src={settings.heroImageUrl} alt="Hero Preview" className="mt-2 h-32 rounded-lg object-cover" referrerPolicy="no-referrer" />}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">URL Foto Kegiatan (Pisahkan dengan koma)</label>
                <textarea 
                  value={(settings.galleryImages || []).join(',\n')} 
                  onChange={(e) => setSettings({...settings, galleryImages: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 h-32" 
                />
              </div>
              <button type="submit" className="w-full md:w-auto px-10 py-5 bg-green-600 text-white rounded-[24px] font-bold uppercase tracking-widest hover:bg-green-700 shadow-2xl shadow-green-100 transition-all flex items-center justify-center gap-3">
                <CheckCircle size={24} /> Simpan Perubahan Website
              </button>
            </form>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-8 max-w-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-8">Profil Admin</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex flex-col items-center gap-6 mb-8 bg-gray-50 p-8 rounded-[40px] border border-gray-100">
                <div className="relative group cursor-pointer" onClick={() => profileFileInputRef.current?.click()}>
                  <div className="w-32 h-32 rounded-[32px] bg-white overflow-hidden border-4 border-white shadow-2xl transition-transform hover:scale-105">
                    {editPhoto ? (
                      <img src={editPhoto} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <User size={60} />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-[32px] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={32} />
                  </div>
                </div>
                <input type="file" ref={profileFileInputRef} onChange={handleProfilePhotoChange} accept="image/*" className="hidden" />
                <div className="text-center">
                  <button type="button" onClick={() => profileFileInputRef.current?.click()} className="text-xs font-bold text-green-600 uppercase tracking-widest hover:underline">Ganti Foto Dari File</button>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">Status: Administrator</p>
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

        {/* Manage Finance Modal */}
        {showManageFinanceModal && selectedStudentForFinance && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowManageFinanceModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Kelola Keuangan: {selectedStudentForFinance.name}</h3>
              <p className="text-gray-500 text-sm mb-6">Kelas: {selectedStudentForFinance.kelas || '-'}</p>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                  <p className="text-green-800 text-sm font-bold mb-1">Total Tabungan</p>
                  <p className="text-3xl font-bold text-green-600 mb-4">Rp {(selectedStudentForFinance.savings || 0).toLocaleString()}</p>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      id="update-savings"
                      placeholder="Nominal baru"
                      className="w-full p-2 rounded-lg border border-green-200 outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                    <button 
                      onClick={() => {
                        const val = (document.getElementById('update-savings') as HTMLInputElement).value;
                        if(val) updateFinance(selectedStudentForFinance.id, 'savings', val);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700"
                    >
                      Update
                    </button>
                  </div>
                </div>
                
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                  <p className="text-red-800 text-sm font-bold mb-1">Total Tunggakan</p>
                  <p className="text-3xl font-bold text-red-600 mb-4">Rp {(selectedStudentForFinance.arrears || 0).toLocaleString()}</p>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      id="update-arrears"
                      placeholder="Nominal baru"
                      className="w-full p-2 rounded-lg border border-red-200 outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    />
                    <button 
                      onClick={() => {
                        const val = (document.getElementById('update-arrears') as HTMLInputElement).value;
                        if(val) updateFinance(selectedStudentForFinance.id, 'arrears', val);
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>

              <h4 className="font-bold text-gray-800 mb-4">Rincian Tunggakan (Belum Lunas)</h4>
              {selectedStudentForFinance.arrears_details && selectedStudentForFinance.arrears_details.length > 0 ? (
                <div className="space-y-3 mb-8">
                  {selectedStudentForFinance.arrears_details.map((detail: any) => (
                    <div key={detail.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="font-bold text-gray-800">{detail.name}</p>
                        <p className="text-xs text-gray-500">{detail.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-red-600">Rp {detail.amount.toLocaleString()}</span>
                        <button 
                          onClick={() => {
                            setActiveStudentForPayment(selectedStudentForFinance);
                            setActiveDetailToPay(detail);
                            setPaymentProof('');
                            setPaymentNote('');
                            setPaymentMethod('Tunai');
                            setShowPayConfirmModal(true);
                          }}
                          className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-200 transition-colors"
                        >
                          Bayar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-xl border border-gray-100 mb-8">Tidak ada rincian tunggakan.</p>
              )}

              <h4 className="font-bold text-gray-800 mb-4">Riwayat Pembayaran</h4>
              {studentPaymentHistory.length > 0 ? (
                <div className="space-y-3">
                  {studentPaymentHistory.map((pay) => (
                    <div key={pay.id} className="p-4 bg-white rounded-xl border border-gray-100 flex justify-between items-center group">
                      <div>
                        <p className="text-sm font-black text-gray-800">{pay.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            pay.type === 'tabungan' ? 'bg-orange-100 text-orange-600' : 
                            pay.type === 'tagihan' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {pay.type}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">{pay.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-black ${pay.type === 'tagihan' ? 'text-red-500' : 'text-green-600'}`}>
                          {pay.type === 'tagihan' ? '+' : '-'} Rp {pay.amount.toLocaleString()}
                        </span>
                        <button 
                          onClick={() => handlePrintReceipt(pay)}
                          className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Cetak Bukti"
                        >
                          <Printer size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-xl border border-gray-100">Belum ada riwayat pembayaran.</p>
              )}
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
                  <textarea value={announceContent} onChange={(e) => setAnnounceContent(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 h-64 resize-y" placeholder="Ketik pengumuman di sini... (Spasi dan baris baru akan dipertahankan agar rapi)" required />
                </div>
                <button type="submit" className="w-full px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-xl shadow-green-200 transition-all mt-4">Kirim Broadcast</button>
              </form>
            </div>
          </div>
        )}

        {showPayConfirmModal && activeDetailToPay && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[300] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <button onClick={() => setShowPayConfirmModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 z-10"><X /></button>
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Konfirmasi Pembayaran</h3>
                <p className="text-sm text-gray-500 mt-1">Selesaikan pelunasan untuk tagihan berikut</p>
              </div>

              <div className="bg-blue-50 p-6 rounded-3xl mb-6 border border-blue-100">
                <p className="text-blue-800 text-xs font-bold uppercase tracking-wider mb-2">Rincian Tagihan</p>
                <p className="text-xl font-bold text-blue-900">{activeDetailToPay.name}</p>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-blue-200/50">
                  <span className="text-sm font-medium text-blue-700">Total Bayar</span>
                  <span className="text-2xl font-black text-blue-600">Rp {activeDetailToPay.amount.toLocaleString()}</span>
                </div>
              </div>

              <form onSubmit={handlePelunasan} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Metode Pembayaran</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Tunai', 'Transfer', 'Tabungan'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method as any)}
                        className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all border ${
                          paymentMethod === method 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'Transfer' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Bukti Transfer</label>
                    <div 
                      onClick={() => paymentProofRef.current?.click()}
                      className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all overflow-hidden relative group"
                    >
                      {paymentProof ? (
                        <>
                          <img src={paymentProof} alt="Bukti Transfer" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={32} />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-400 mb-2">
                            <Upload size={24} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center px-4">Ketuk untuk unggah bukti transfer</span>
                        </>
                      )}
                    </div>
                    <input type="file" ref={paymentProofRef} onChange={handlePaymentProofChange} accept="image/*" className="hidden" />
                  </div>
                )}

                {paymentMethod === 'Tabungan' && (
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest">Saldo Tabungan Saat Ini</p>
                        <p className="text-lg font-black text-orange-600">Rp {(activeStudentForPayment?.savings || 0).toLocaleString()}</p>
                        { (activeStudentForPayment?.savings || 0) < activeDetailToPay.amount && (
                          <p className="text-[10px] text-red-500 font-bold mt-1">Saldo tidak cukup!</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Keterangan (Opsional)</label>
                  <input 
                    type="text" 
                    value={paymentNote} 
                    onChange={(e) => setPaymentNote(e.target.value)} 
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium placeholder:text-gray-300" 
                    placeholder="Contoh: Titipan orang tua"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={paymentMethod === 'Tabungan' && (activeStudentForPayment?.savings || 0) < activeDetailToPay.amount}
                  className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-bold text-lg hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <CheckCircle size={22} /> Konfirmasi Lunas
                </button>
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
