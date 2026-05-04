import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { getApps, initializeApp } from 'firebase/app';
import { sendPasswordResetEmail, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, getDoc, updateDoc, setDoc, orderBy, getDocs, where } from 'firebase/firestore';
import { Users, Shield, Plus, Trash2, Edit, BarChart, Bell, LogOut, User, Download, CreditCard, Megaphone, X, Menu, Settings, Image as ImageIcon, Key, Upload, CheckCircle, Camera, TrendingUp, BookOpen, Clock, Printer, FileText, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { compressImage } from '../lib/imageUtils';
import { getPrintHeaderHTML, getPrintStyles, getPrintSignatureHTML } from '../lib/printUtils';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
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
  const [showBroadcastPulangModal, setShowBroadcastPulangModal] = useState(false);
  const [broadcastPulangTarget, setBroadcastPulangTarget] = useState('all');
  const [searchStudentBroadcast, setSearchStudentBroadcast] = useState('');
  const [showTabunganModal, setShowTabunganModal] = useState(false);
  const [showImportTabunganModal, setShowImportTabunganModal] = useState(false);
  const [importTabunganStartDate, setImportTabunganStartDate] = useState('');
  const [importTabunganEndDate, setImportTabunganEndDate] = useState('');
  const [showIuranModal, setShowIuranModal] = useState(false);
  const [showDeleteIuranModal, setShowDeleteIuranModal] = useState(false);
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
  const importTabunganInputRef = useRef<HTMLInputElement>(null);
  
  // Form States
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [newUserRole, setNewUserRole] = useState('siswa');
  const [newUserKelas, setNewUserKelas] = useState('');
  const [newUserWhatsapp, setNewUserWhatsapp] = useState('');
  const [editUserWhatsapp, setEditUserWhatsapp] = useState('');
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');
  const [announceTarget, setAnnounceTarget] = useState('all');
  
  // Finance Form States
  const [financeStudentIds, setFinanceStudentIds] = useState<string[]>([]);
  const [financeAmount, setFinanceAmount] = useState('');
  const [financeDate, setFinanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [financeIuranName, setFinanceIuranName] = useState('');
  const [financeIuranTarget, setFinanceIuranTarget] = useState('all');
  const [financeDueDate, setFinanceDueDate] = useState('');
  const [searchStudentFinance, setSearchStudentFinance] = useState('');
  const [searchStudentIuran, setSearchStudentIuran] = useState('');
  const [deleteIuranTarget, setDeleteIuranTarget] = useState('all');
  const [deleteIuranDescription, setDeleteIuranDescription] = useState('');
  const [deleteIuranSearchName, setDeleteIuranSearchName] = useState('');
  const [searchStudentDelete, setSearchStudentDelete] = useState('');
  const [searchFinanceList, setSearchFinanceList] = useState('');
  
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
  const [filterSiswaStatus, setFilterSiswaStatus] = useState<'Aktif' | 'Alumni' | 'Tidak Aktif' | 'Pindah'>('Aktif');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterName, setFilterName] = useState('');
  const [studentPaymentHistory, setStudentPaymentHistory] = useState<any[]>([]);
  const [rankingClassFilter, setRankingClassFilter] = useState('Semua');
  const [filterKeuanganStatus, setFilterKeuanganStatus] = useState<'semua' | 'menunggak' | 'lunas'>('semua');

  // Academic States
  const [schoolClasses, setSchoolClasses] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [showMutasiModal, setShowMutasiModal] = useState(false);
  const [mutasiTargetClass, setMutasiTargetClass] = useState('');
  const [selectedStudentsForMutasi, setSelectedStudentsForMutasi] = useState<string[]>([]);
  const [selectedStudentForRapot, setSelectedStudentForRapot] = useState<any>(null);
  const [showPrintRapotModal, setShowPrintRapotModal] = useState(false);
  const [printRapotPeriod, setPrintRapotPeriod] = useState('Semua');

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
        userData.status = editingUser.status || 'Aktif';
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
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      alert('Gagal membaca file Excel.');
    };
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
            const userPassword = row.Password || '123456';
            const userRole = row.Role?.toLowerCase() || 'siswa';
            try {
              const q = query(collection(db, 'users'), where('email', '==', row.Email));
              const querySnapshot = await getDocs(q);
              
              if (!querySnapshot.empty) {
                // Update existing user
                const userDoc = querySnapshot.docs[0];
                const userData: any = {
                  name: row.Nama,
                  role: userRole,
                };
                if (userPassword && userPassword !== '123456' && !userDoc.data().plainPassword) {
                   userData.plainPassword = userPassword;
                   // Note: we can't easily update auth password here without old credentials,
                   // so we mainly rely on initial creation for password setting via excel.
                }
                if (userData.role === 'siswa') {
                  userData.kelas = row.Kelas || '';
                  userData.whatsapp = row.WhatsApp || '';
                }
                await updateDoc(doc(db, 'users', userDoc.id), userData);
                successCount++;
              } else {
                // Create new user
                const userCredential = await createUserWithEmailAndPassword(secondaryAuth, row.Email, userPassword);
                
                const userData: any = {
                  name: row.Nama,
                  email: row.Email,
                  plainPassword: userPassword,
                  role: userRole,
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
        target: announceTarget,
        createdAt: serverTimestamp(),
        author: user.displayName || 'Admin'
      });
      setAnnounceTitle('');
      setAnnounceContent('');
      setAnnounceTarget('all');
      setShowAnnounceModal(false);
      alert('Pengumuman berhasil dikirim!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'announcements');
    }
  };

  const handleTarikTabungan = async (userId: string, amountTarik: string) => {
    try {
      const student = allUsers.find(u => u.id === userId);
      if (!student) return;
      const currentSavings = student.savings || 0;
      if (currentSavings < Number(amountTarik)) {
        alert('Saldo tabungan tidak cukup!');
        return;
      }
      const newSavings = currentSavings - Number(amountTarik);
      await updateDoc(doc(db, 'users', userId), { savings: newSavings });
      
      await addDoc(collection(db, 'payments'), {
        studentId: userId,
        amount: Number(amountTarik),
        description: 'Penarikan/Kurangi Tabungan',
        type: 'tabungan_keluar',
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      });
      
      if (selectedStudentForFinance && selectedStudentForFinance.id === userId) {
        setSelectedStudentForFinance((prev: any) => ({ ...prev, savings: newSavings }));
      }
      alert('Berhasil ditarik!');
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat penarikan.');
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
    if (financeStudentIds.length === 0 || !financeAmount || !financeDate) {
      alert('Pilih siswa, masukkan nominal, dan tanggal!');
      return;
    }
    
    try {
      const amount = Number(financeAmount);
      
      for (const studentId of financeStudentIds) {
        const student = allUsers.find(u => u.id === studentId);
        if (!student) continue;

        const newSavings = (student.savings || 0) + amount;
        await updateDoc(doc(db, 'users', studentId), { savings: newSavings });
        
        // Log to payments history
        await addDoc(collection(db, 'payments'), {
          studentId: studentId,
          amount: amount,
          description: financeStudentIds.length > 1 ? 'Setoran Tabungan Massal/Grup' : 'Setoran Tabungan',
          type: 'tabungan',
          date: financeDate,
          createdAt: serverTimestamp()
        });
      }

      setShowTabunganModal(false);
      setFinanceStudentIds([]);
      setFinanceAmount('');
      alert(`Tabungan berhasil ditambahkan untuk ${financeStudentIds.length} siswa!`);
    } catch (error) {
      alert('Gagal menambahkan tabungan.');
      console.error(error);
    }
  };

  const handleWhatsAppFollowUp = (student: any, detail: any) => {
    if (!student.whatsapp) {
      alert("Nomor WhatsApp siswa/wali belum terdaftar!");
      return;
    }
    
    let number = student.whatsapp.replace(/\D/g, '');
    if (number.startsWith('0')) {
      number = '62' + number.substring(1);
    }
    
    let message = `Halo Bapak/Ibu Wali Murid & Ananda *${student.name}*,\n\n`;
    message += `Kami dari Tata Usaha mengingatkan kembali terkait administrasi sekolah yang belum diselesaikan:\n\n`;
    message += `📌 *Tagihan:* ${detail.name}\n`;
    message += `💰 *Nominal:* Rp ${detail.amount.toLocaleString()}\n`;
    if (detail.dueDate) {
      message += `⏳ *Jatuh Tempo:* ${detail.dueDate}\n`;
    }
    message += `\nMohon bantuannya untuk dapat segera diselesaikan. Terima kasih atas kerja samanya. 🙏`;
    
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleBroadcastPulang = (e: React.FormEvent) => {
    e.preventDefault();
    let targetStudents = [];
    
    if (broadcastPulangTarget === 'all') {
      targetStudents = allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif' && u.whatsapp);
    } else if (broadcastPulangTarget.startsWith('kelas_')) {
      const targetKelas = broadcastPulangTarget.replace('kelas_', '').toLowerCase();
      targetStudents = allUsers.filter(u => {
        if (u.role !== 'siswa' || (u.status || 'Aktif') !== 'Aktif' || !u.whatsapp) return false;
        const k = (u.kelas || '').toLowerCase();
        return k === targetKelas || k === `kelas ${targetKelas}` || k.includes(targetKelas);
      });
    } else {
      const s = allUsers.find(u => u.id === broadcastPulangTarget);
      if (s && s.whatsapp) targetStudents = [s];
    }

    if (targetStudents.length === 0) {
      alert('Tidak ada siswa dengan nomor WhatsApp di target yang dipilih.');
      return;
    }

    const confirmMsg = `Pesan akan dikirim ke ${targetStudents.length} nomor WhatsApp secara berurutan.\n\nPastikan Anda mengizinkan (ALLOW POPUPS) di browser agar semua tab WhatsApp bisa terbuka.\n\nLanjutkan?`;
    if (!window.confirm(confirmMsg)) return;

    let delay = 0;
    targetStudents.forEach(student => {
      let number = student.whatsapp.replace(/\D/g, '');
      if (number.startsWith('0')) {
        number = '62' + number.substring(1);
      }
      const message = `Halo Bapak/Ibu Wali Murid dari *${student.name}*,\n\nKami menginformasikan bahwa Ananda telah selesai mengikuti kegiatan belajar di sekolah hari ini dan sedang bersiap untuk kepulangan. 🏠🔔\n\nBapak/Ibu sudah bisa menjemput Ananda di sekolah.\n\nTerima kasih atas perhatiannya. 🙏`;
      
      setTimeout(() => {
        window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
      }, delay);
      
      delay += 800; // Open a new tab every 800ms to prevent browser crashing
    });

    setShowBroadcastPulangModal(false);
  };

  const handleImportTabunganSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTabunganStartDate) {
      alert("Masukkan minimal Tanggal Mulai periode!");
      return;
    }
    importTabunganInputRef.current?.click();
  };

  const handleImportTabungan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      alert('Gagal membaca file Excel.');
    };
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        let successCount = 0;
        let notFoundCount = 0;

        for (const row of data as any[]) {
          const nameField = Object.keys(row).find(k => k.toLowerCase() === 'nama' || k.toLowerCase().includes('name') || k.toLowerCase().includes('siswa'));
          const savingField = Object.keys(row).find(k => k.toLowerCase().includes('tabungan') || k.toLowerCase().includes('saving') || k.toLowerCase().includes('nominal'));

          if (nameField && savingField && row[nameField] && row[savingField] !== undefined) {
            const studentName = String(row[nameField]).trim().toLowerCase();
            const savingAmountStr = String(row[savingField]).replace(/[^0-9-]/g, "");
            const savingAmount = parseInt(savingAmountStr, 10);

            if (!isNaN(savingAmount)) {
              const student = allUsers.find(u => u.name?.trim().toLowerCase() === studentName);
              if (student) {
                const currentSavings = student.savings || 0;
                await updateDoc(doc(db, 'users', student.id), { savings: currentSavings + savingAmount });
                
                let periodText = '';
                if (importTabunganStartDate && importTabunganEndDate) {
                    periodText = ` (Periode: ${importTabunganStartDate} s/d ${importTabunganEndDate})`;
                } else if (importTabunganStartDate) {
                    periodText = ` (Tanggal: ${importTabunganStartDate})`;
                }

                await addDoc(collection(db, 'payments'), {
                  studentId: student.id,
                  amount: savingAmount,
                  description: `Import Tabungan Excel${periodText}`,
                  type: 'tabungan',
                  date: importTabunganEndDate || importTabunganStartDate || new Date().toISOString().split('T')[0],
                  createdAt: serverTimestamp()
                });

                successCount++;
              } else {
                notFoundCount++;
              }
            }
          }
        }
        alert(`Impor tabungan selesai!\nBerhasil update tabungan: ${successCount} siswa.\nTidak ditemukan/Gagal: ${notFoundCount} baris data.`);
        if (importTabunganInputRef.current) importTabunganInputRef.current.value = '';
        setShowImportTabunganModal(false);
        setImportTabunganStartDate('');
        setImportTabunganEndDate('');
      } catch (error) {
        alert('Gagal mengimpor data Excel. Pastikan format sesuai.');
        console.error(error);
      }
    };
    reader.readAsBinaryString(file);
  };


  const handleAddIuran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!financeIuranName || !financeAmount) return;
    try {
      const amount = Number(financeAmount);
      let targetStudents = [];
      
      if (financeIuranTarget === 'all') {
        targetStudents = allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif');
      } else if (financeIuranTarget.startsWith('kelas_')) {
        const targetKelas = financeIuranTarget.replace('kelas_', '').toLowerCase();
        targetStudents = allUsers.filter(u => {
          if (u.role !== 'siswa') return false;
          if ((u.status || 'Aktif') !== 'Aktif') return false;
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
        date: new Date().toISOString().split('T')[0],
        dueDate: financeDueDate || null
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
      setFinanceDueDate('');
      alert('Iuran berhasil ditetapkan!');
    } catch (error) {
      alert('Gagal menetapkan iuran.');
      console.error(error);
    }
  };

  const handleApprovePayment = async (pay: any) => {
    if (!window.confirm(`Verifikasi pembayaran ${pay.method} ini? Tindakan ini akan mengupdate status menjadi lunas dan mengurangi tunggakan siswa.`)) return;
    try {
      const studentId = pay.studentId;
      const amount = pay.amount;
      const arrearDetailId = pay.arrearDetailId;
      const payId = pay.id;
      
      const student = allUsers.find(u => u.id === studentId);
      if (student) {
        const updates: any = {};
        
        // Only modify arrears if it was a payment for a specific arrear
        if (arrearDetailId) {
          const currentArrears = student.arrears || 0;
          const newArrears = Math.max(0, currentArrears - amount);
          const currentDetails = student.arrears_details || [];
          const newDetails = currentDetails.filter((d: any) => d.id !== arrearDetailId);
          
          updates.arrears = newArrears;
          updates.arrears_details = newDetails;
        }

        // If it's a Savings request, deduct the savings
        if (pay.method === 'Tabungan') {
          const currentSavings = student.savings || 0;
          if (currentSavings < amount) {
            alert('Saldo tabungan siswa tidak mencukupi saat divalidasi. Validasi dibatalkan.');
            return;
          }
          updates.savings = currentSavings - amount;
        }

        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, 'users', studentId), updates);
        }
      }

      await updateDoc(doc(db, 'payments', payId), {
        status: 'lunas',
        updatedAt: serverTimestamp()
      });

      alert('Pembayaran berhasil divalidasi!');
    } catch (error) {
      console.error("Error approving payment:", error);
      alert('Terjadi kesalahan saat memvalidasi pembayaran.');
    }
  };

  const handleRejectPayment = async (payId: string) => {
    if (!window.confirm('Tolak permintaan pembayaran ini? Siswa harus mengirim ulang jika ada kesalahan.')) return;
    try {
      await updateDoc(doc(db, 'payments', payId), {
        status: 'ditolak',
        updatedAt: serverTimestamp()
      });
      alert('Pembayaran ditolak.');
    } catch (error) {
      console.error("Error rejecting payment:", error);
      alert('Gagal menolak pembayaran.');
    }
  };

  const handleDeletePayment = async (payId: string) => {
    if (!window.confirm('Hapus riwayat transaksi ini secara permanen? Catatan pada saldo/tunggakan tidak akan berubah otomatis.')) return;
    try {
      await deleteDoc(doc(db, 'payments', payId));
      alert('Riwayat transaksi berhasil dihapus.');
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert('Gagal menghapus riwayat transaksi.');
    }
  };

  const handleDeleteArrear = async (studentId: string, arrearId: string) => {
    if (!window.confirm('Hapus rincian tunggakan ini? Tindakan ini akan mengurangi total tunggakan siswa secara otomatis.')) return;
    try {
      const student = allUsers.find(u => u.id === studentId);
      if (student) {
        const detailToDelete = student.arrears_details?.find((d: any) => d.id === arrearId);
        if (!detailToDelete) return;

        const newArrears = Math.max(0, (student.arrears || 0) - (detailToDelete.amount || 0));
        const newDetails = student.arrears_details.filter((d: any) => d.id !== arrearId);

        await updateDoc(doc(db, 'users', studentId), {
          arrears: newArrears,
          arrears_details: newDetails
        });
        
        // Update selected student in modal if it's the same one
        if (selectedStudentForFinance?.id === studentId) {
          setSelectedStudentForFinance({
            ...selectedStudentForFinance,
            arrears: newArrears,
            arrears_details: newDetails
          });
        }
        
        alert('Rincian tunggakan berhasil dihapus.');
      }
    } catch (error) {
      console.error("Error deleting arrear:", error);
      alert('Gagal menghapus tunggakan.');
    }
  };

  const handleMassDeleteIuran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteIuranDescription) {
      alert('Mohon masukkan deskripsi iuran yang ingin dihapus.');
      return;
    }

    if (!window.confirm(`Hapus iuran "${deleteIuranDescription}" untuk target yang dipilih? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      let targets = [];
      if (deleteIuranTarget === 'all') {
        targets = allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif');
      } else if (deleteIuranTarget.startsWith('kelas_')) {
        const className = deleteIuranTarget.replace('kelas_', '');
        targets = allUsers.filter(u => u.role === 'siswa' && u.kelas === className && (u.status || 'Aktif') === 'Aktif');
      } else {
        targets = allUsers.filter(u => u.id === deleteIuranTarget);
      }

      if (targets.length === 0) {
        alert('Tidak ada siswa yang ditemukan untuk target tersebut.');
        return;
      }

      let count = 0;
      for (const student of targets) {
        const details = student.arrears_details || [];
        const itemToDelete = details.find((d: any) => d.name.toLowerCase() === deleteIuranDescription.toLowerCase());
        
        if (itemToDelete) {
          const newDetails = details.filter((d: any) => d.id !== itemToDelete.id);
          const newArrears = Math.max(0, (student.arrears || 0) - itemToDelete.amount);
          
          await updateDoc(doc(db, 'users', student.id), {
            arrears: newArrears,
            arrears_details: newDetails
          });
          count++;
        }
      }

      alert(`Berhasil menghapus iuran dari ${count} siswa.`);
      setShowDeleteIuranModal(false);
      setDeleteIuranDescription('');
    } catch (error) {
      console.error("Error mass deleting iuran:", error);
      alert('Gagal menghapus iuran secara massal.');
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

  const exportUsersToExcel = () => {
    const students = allUsers.filter(u => {
      const matchKelas = filterKelas ? (u.kelas || '').toLowerCase() === filterKelas.toLowerCase() : true;
      const matchName = filterName ? u.name.toLowerCase().includes(filterName.toLowerCase()) : true;
      return matchKelas && matchName;
    });
    
    students.sort((a, b) => {
      if (a.role === b.role) return a.name.localeCompare(b.name);
      return a.role.localeCompare(b.role);
    });

    const data = students.map(s => ({
      Nama: s.name,
      Peran: s.role.toUpperCase(),
      Kelas: s.kelas || '-',
      WhatsApp: s.whatsapp || '-',
      Email: s.email || '-',
      Status: s.status || 'Aktif'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    
    if(data.length > 0) {
      const colWidths = Object.keys(data[0]).map(k => ({ wch: k.length + 5 }));
      data.forEach(row => {
          Object.values(row).forEach((v, i) => {
              if (String(v).length + 5 > colWidths[i].wch) colWidths[i].wch = String(v).length + 5;
          });
      });
      ws['!cols'] = colWidths;
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data User List");
    const safeKelas = filterKelas ? `_Kelas_${filterKelas}` : '';
    XLSX.writeFile(wb, `Data_User${safeKelas}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportAttendanceToExcel = () => {
    let filteredAttendance = attendance;
    if (filterDateStart) filteredAttendance = filteredAttendance.filter(a => a.date >= filterDateStart);
    if (filterDateEnd) filteredAttendance = filteredAttendance.filter(a => a.date <= filterDateEnd);

    const uniqueDates = Array.from(new Set(filteredAttendance.map(a => a.date))).sort();

    if (uniqueDates.length === 0) {
      alert("Tidak ada data presensi pada rentang tanggal tersebut.");
      return;
    }

    const filteredUsers = allUsers.filter(u => {
      const matchRole = filterRole === 'semua' ? true : u.role === filterRole;
      const matchKelas = filterKelas ? (u.role === 'siswa' && (u.kelas || '').toLowerCase() === filterKelas.toLowerCase()) : true;
      const matchStatus = (u.status || 'Aktif') === 'Aktif'; 
      return matchRole && matchKelas && matchStatus;
    });

    const data: any[] = [];

    for (const date of uniqueDates) {
      for (const user of filteredUsers) {
        const att = filteredAttendance.find(a => a.date === date && a.studentId === user.id);
        
        let statusDisplay = 'ALPHA';
        if (att?.status) {
          if (Array.isArray(att.status)) {
            statusDisplay = att.status.map(s => s.replace(/_/g, ' ')).join(', ').toUpperCase();
          } else {
            statusDisplay = typeof att.status === 'string' ? att.status.replace(/_/g, ' ').toUpperCase() : 'HADIR';
          }
        } else if (att) {
           statusDisplay = 'HADIR';
        }

        data.push({
          Tanggal: date,
          Nama: user.name,
          Peran: user.role.toUpperCase(),
          Kelas: user.kelas || '-',
          Waktu: att?.timestamp ? new Date(att.timestamp.seconds * 1000).toLocaleTimeString() : '-',
          Status: statusDisplay,
          Keterangan_Gambar: att?.imageUrl ? 'Ada' : '-',
          Lokasi: att?.location ? `Lat: ${att.location.latitude}, Lng: ${att.location.longitude}` : '-'
        });
      }
    }

    const ws = XLSX.utils.json_to_sheet(data);
    if(data.length > 0) {
      const colWidths = Object.entries(data[0]).map(([k]) => ({ wch: k.length + 5 }));
      data.forEach(row => {
          Object.values(row).forEach((v, i) => {
              if (String(v).length + 5 > colWidths[i].wch) colWidths[i].wch = String(v).length + 5;
          });
      });
      ws['!cols'] = colWidths;
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Absensi Lengkap");
    const safeKelas = filterKelas ? `_Kelas_${filterKelas}` : '_Semua';
    XLSX.writeFile(wb, `Data_Absensi${safeKelas}_${filterDateStart || 'Awal'}_SD_${filterDateEnd || 'Akhir'}.xlsx`);
  };

  const exportFinanceToExcel = () => {
    const students = allUsers.filter(u => {
      const matchBase = u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif';
      const matchKelas = !filterKelas || (u.kelas || '').toLowerCase() === filterKelas.toLowerCase();
      const matchName = !searchFinanceList || u.name.toLowerCase().includes(searchFinanceList.toLowerCase());
      const matchStatus = filterKeuanganStatus === 'semua' ? true : (filterKeuanganStatus === 'menunggak' ? (u.arrears > 0) : ((u.arrears || 0) === 0));
      return matchBase && matchKelas && matchName && matchStatus;
    });
    
    const data = students.map(s => ({
      Nama: s.name,
      Kelas: s.kelas || '',
      Status: s.status || 'Aktif',
      Total_Tabungan: s.savings || 0,
      Total_Tunggakan: s.arrears || 0
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Keuangan");
    XLSX.writeFile(wb, `Data_Keuangan_Siswa_${new Date().toISOString().split('T')[0]}.xlsx`);
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
      alert('Pilih minimal 1 siswa dan target mutasi!');
      return;
    }
    
    // Konfirmasi pesan sesuai dengan target
    let targetName = `Kelas ${mutasiTargetClass}`;
    if (mutasiTargetClass === 'Lulus') targetName = 'Lulus/Alumni';
    if (mutasiTargetClass === 'Tidak Aktif') targetName = 'Tidak Aktif';
    if (mutasiTargetClass === 'Pindah') targetName = 'Pindah Sekolah';
    if (mutasiTargetClass === 'Hapus') targetName = 'HAPUS PERMANEN (Tindakan tidak dapat dibatalkan)';

    if (!window.confirm(`Yakin ingin memutasi/mengubah ${selectedStudentsForMutasi.length} siswa menjadi ${targetName}?`)) {
      return;
    }

    try {
      setLoading(true);
      for (const studentId of selectedStudentsForMutasi) {
        if (mutasiTargetClass === 'Hapus') {
          // Hard delete
          await deleteDoc(doc(db, 'users', studentId));
        } else if (mutasiTargetClass === 'Lulus') {
          // Mutasi menjadi alumni/lulus
          await updateDoc(doc(db, 'users', studentId), {
            kelas: 'Lulus',
            status: 'Alumni',
            updatedAt: serverTimestamp()
          });
        } else if (mutasiTargetClass === 'Tidak Aktif' || mutasiTargetClass === 'Pindah') {
          await updateDoc(doc(db, 'users', studentId), {
            status: mutasiTargetClass,
            updatedAt: serverTimestamp()
          });
        } else {
          // Mutasi ke kelas baru
          const classDoc = schoolClasses.find(c => c.id === mutasiTargetClass);
          await updateDoc(doc(db, 'users', studentId), {
            kelas: classDoc?.name || '',
            status: 'Aktif',
            updatedAt: serverTimestamp()
          });
        }
      }
      setSelectedStudentsForMutasi([]);
      alert(mutasiTargetClass === 'Hapus' ? 'Siswa berhasil dihapus secara permanen!' : 'Mutasi status siswa berhasil!');
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

  const handleExecutePrintRapot = () => {
    if (!selectedStudentForRapot) return;
    const student = allUsers.find(u => u.id === selectedStudentForRapot.id);
    if (!student) return;
    
    // Filter by student and evaluation period
    const studentProgressList = progressData
      .filter(p => p.studentId === student.id)
      .filter(p => printRapotPeriod === 'Semua' || p.evaluationPeriod === printRapotPeriod)
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let itemsHtml = '';
    studentProgressList.forEach((p, idx) => {
       const scoreNum = Number(p.score) || 0;
       const gradeInfo = getScoreGradeInfo(scoreNum);
       let periodBadge = p.evaluationPeriod ? `<span style="font-size:10px; background:#eef2ff; color:#4f46e5; padding:2px 6px; border-radius:10px; margin-left:8px;">${p.evaluationPeriod}</span>` : '';
       itemsHtml += `
         <tr>
           <td style="padding: 12px; border-bottom: 1px solid #eee;">${idx + 1}</td>
           <td style="padding: 12px; border-bottom: 1px solid #eee;">
             <div style="display:flex; align-items:center;">
               <strong style="display:block;">${p.title}</strong>
               ${periodBadge}
             </div>
             <small style="color: #666;">${p.category}</small>
           </td>
           <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${scoreNum}</td>
           <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;"><strong>${gradeInfo.grade}</strong> <br><small>${gradeInfo.text}</small></td>
         </tr>
       `;
    });

    if (studentProgressList.length === 0) {
      itemsHtml = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #666; font-style: italic;">Belum ada data evaluasi belajar.</td></tr>`;
    }

    let reportTitle = `Rapot Belajar - ${student.name}`;
    if (printRapotPeriod !== 'Semua') {
       reportTitle = `Rapot ${printRapotPeriod} - ${student.name}`;
    }

    const html = `
      <html>
        <head>
          <title>${reportTitle}</title>
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

  const getFinanceChartData = () => {
    const dataMap: any = {};
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toISOString().split('T')[0].substring(0, 7);
      months.push(monthStr);
      dataMap[monthStr] = { 
        month: monthStr, 
        name: d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }), 
        ['Tabungan Masuk']: 0, 
        ['Pelunasan Iuran']: 0 
      };
    }

    payments.forEach(pay => {
      if (!pay.date) return;
      const monthStr = pay.date.substring(0, 7);
      if (dataMap[monthStr]) {
        if (pay.type === 'tabungan') {
          dataMap[monthStr]['Tabungan Masuk'] += pay.amount || 0;
        } else if (pay.type === 'iuran') {
          dataMap[monthStr]['Pelunasan Iuran'] += pay.amount || 0;
        }
      }
    });

    return months.map(m => dataMap[m]);
  };
  const financeChartData = getFinanceChartData();

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
      <div className="md:hidden fixed bottom-0 left-0 right-0 glass-3d flex justify-around items-center p-2 z-50 pb-safe overflow-x-auto">
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
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pt-6 md:pt-8">
        {showPrintRapotModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative">
              <button 
                onClick={() => {
                  setShowPrintRapotModal(false);
                  setSelectedStudentForRapot(null);
                }} 
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
              >
                <X />
              </button>
              <h3 className="text-xl font-black text-gray-800 mb-2">Cetak Rapot Siswa</h3>
              <p className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-widest">{selectedStudentForRapot?.name}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pilih Periode Penilaian</label>
                  <select 
                    value={printRapotPeriod} 
                    onChange={(e) => setPrintRapotPeriod(e.target.value)} 
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700"
                  >
                    <option value="Semua">Cetak Semua Periode</option>
                    <option value="PTS Ganjil">PTS Ganjil</option>
                    <option value="PAS Ganjil">PAS Ganjil</option>
                    <option value="PTS Genap">PTS Genap</option>
                    <option value="PAS Genap">PAS Genap</option>
                  </select>
                </div>
                <button 
                  onClick={() => {
                    handleExecutePrintRapot();
                    setShowPrintRapotModal(false);
                  }}
                  className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                >
                  <Printer size={18} /> Cetak Dokumen
                </button>
              </div>
            </div>
          </div>
        )}

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

        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pt-2">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">Control Panel</h2>
            <p className="text-gray-500 text-sm">Monitoring operasional sekolah secara real-time.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
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
            <div className="card-3d p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 md:mb-10">Ringkasan Aktivitas</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-6">
                {[
                  { label: 'Total Siswa Aktif', value: allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif').length, color: 'bg-blue-500', icon: Users },
                  { label: 'Total Guru', value: allUsers.filter(u => u.role === 'guru').length, color: 'bg-green-500', icon: Shield },
                  { label: 'Absensi Hari Ini', value: attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length, color: 'bg-purple-500', icon: CheckCircle },
                  { label: 'Total Tabungan', value: `Rp ${allUsers.reduce((acc, curr) => acc + (curr.savings || 0), 0).toLocaleString()}`, color: 'bg-yellow-500', icon: CreditCard },
                  { label: 'Total Tunggakan', value: `Rp ${allUsers.filter(u => u.role === 'siswa').reduce((acc, curr) => acc + (curr.arrears || 0), 0).toLocaleString()}`, color: 'bg-red-500', icon: AlertCircle }
                ].map((stat, i) => (
                  <div key={i} className="bg-gray-50/50 p-4 md:p-8 rounded-[24px] md:rounded-[32px] border border-gray-100 flex flex-col items-center justify-center text-center group hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all h-full">
                    <div className={`w-10 h-10 md:w-14 md:h-14 ${stat.color} rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-opacity-20 mb-2 md:mb-4 group-hover:scale-110 transition-transform`}>
                      <stat.icon size={20} className="md:w-7 md:h-7" />
                    </div>
                    <p className="text-gray-400 text-[8px] md:text-xs font-black uppercase tracking-widest mb-1 leading-tight">{stat.label}</p>
                    <h4 className="text-sm md:text-xl xl:text-2xl font-black text-gray-800 tracking-tight">{stat.value}</h4>
                  </div>
                ))}
              </div>
            </div>

            {/* Siswa Berprestasi Section */}
            <div className="card-3d p-6 md:p-8 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
                    <TrendingUp className="text-yellow-500" /> Siswa Berprestasi
                  </h3>
                  <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">Peringkat berdasarkan nilai rata-rata raport</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                  {['Semua', ...schoolClasses.map(c => c.name)].map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setRankingClassFilter(cls)}
                      className={`whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${rankingClassFilter === cls ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(() => {
                  let students = allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif');
                  if (rankingClassFilter !== 'Semua') {
                    students = students.filter(s => (s.kelas || '').toUpperCase() === rankingClassFilter.toUpperCase());
                  }
                  
                  const ranked = students.map(s => {
                    const sProgress = progressData.filter(p => p.studentId === s.id);
                    const avgScore = sProgress.length > 0 
                      ? sProgress.reduce((acc, p) => acc + (Number(p.score) || 0), 0) / sProgress.length 
                      : 0;
                    return { ...s, avgScore };
                  }).sort((a, b) => b.avgScore - a.avgScore).slice(0, 3);

                  if (ranked.length === 0) {
                    return <div className="col-span-full py-12 text-center text-gray-400 italic">Belum ada data prestasi untuk filter ini.</div>;
                  }

                  return ranked.map((s, idx) => (
                    <div key={s.id} className={`relative p-6 rounded-[2.5rem] border ${idx === 0 ? 'bg-yellow-50 border-yellow-100' : 'bg-gray-50 border-gray-100'} flex items-center gap-4 group hover:scale-[1.02] transition-all`}>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black ${
                        idx === 0 ? 'bg-yellow-500 text-white' : 
                        idx === 1 ? 'bg-gray-300 text-gray-700' : 
                        'bg-orange-300 text-orange-800'
                      } shadow-lg shadow-opacity-20`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 truncate">{s.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{s.kelas || 'N/A'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1.5 flex-1 bg-white rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${s.avgScore}%` }}></div>
                          </div>
                          <span className="text-xs font-black text-yellow-600">{s.avgScore.toFixed(1)}</span>
                        </div>
                      </div>
                      {idx === 0 && (
                        <div className="absolute -top-2 -right-2 text-3xl animate-bounce">🏆</div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2 card-3d overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight">Peluncur Aktivitas Terbaru</h3>
                  <button onClick={() => setActiveTab('attendance')} className="text-[10px] md:text-xs font-bold text-blue-600 hover:underline uppercase tracking-widest">Lihat Semua</button>
                </div>
                <div className="hidden md:block overflow-x-auto">
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

                {/* Mobile View Peluncur Aktivitas */}
                <div className="md:hidden divide-y divide-gray-100">
                  {attendance.slice(0, 10).map((a) => {
                    const student = allUsers.find(u => u.id === a.studentId);
                    return (
                      <div key={a.id} className="p-4 hover:bg-gray-50 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{student?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{student?.email}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${a.status === 'masuk' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {a.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 p-2.5 border border-gray-100 rounded-lg">
                           <div>
                             <p className="text-xs font-bold text-gray-700">{a.date}</p>
                             <p className="text-[10px] text-gray-400 uppercase tracking-widest">{a.timestamp ? new Date(a.timestamp.seconds * 1000).toLocaleTimeString() : ''}</p>
                           </div>
                           {a.location?.latitude ? (
                             <a href={`https://www.google.com/maps?q=${a.location.latitude},${a.location.longitude}`} target="_blank" rel="noreferrer" className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                               <MapPin size={14} />
                             </a>
                           ) : (
                             <span className="text-[10px] text-gray-400 italic">No Loc</span>
                           )}
                        </div>
                      </div>
                    );
                  })}
                  {attendance.length === 0 && (
                    <div className="p-6 text-center text-gray-400 italic text-sm">Belum ada riwayat absensi.</div>
                  )}
                </div>
              </div>

              <div className="space-y-6 md:space-y-8">
                <div className="card-3d p-6 md:p-8">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
                    <Settings size={20} className="text-blue-500" /> Pengaturan Sekolah
                  </h3>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nama Sekolah</label>
                      <input 
                        type="text" 
                        value={settings.schoolName || ''} 
                        onChange={(e) => setSettings({...settings, schoolName: e.target.value})} 
                        onBlur={async (e) => {
                          try {
                            await setDoc(doc(db, 'settings', 'landingPage'), {...settings, schoolName: e.target.value}, { merge: true });
                          } catch(err) {
                            console.error(err);
                          }
                        }}
                        placeholder="Contoh: SD Negeri 1"
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 transition-all placeholder:text-gray-400 placeholder:font-medium" 
                      />
                    </div>
                  </div>
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
                                 await setDoc(doc(db, 'settings', 'landingPage'), {...settings, logoUrl: compressed}, { merge: true });
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
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={exportUsersToExcel}
                  className="w-full sm:w-auto bg-indigo-50 text-indigo-600 border border-indigo-100 hover:border-indigo-300 px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all text-xs"
                >
                  <Download size={16} /> Export Data User
                </button>
                <input 
                  type="text" 
                  placeholder="Cari Nama..." 
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="w-full sm:w-auto p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-600"
                />
                <select 
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                  className="w-full sm:w-auto p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-600"
                >
                  <option value="">Semua Kelas</option>
                  {schoolClasses.map((c: any) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <button 
                  onClick={() => { setNewUserRole('siswa'); setShowAddUser(true); }}
                  className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all"
                >
                  <Plus size={20} /> Tambah User
                </button>
              </div>
            </div>
            <div className="hidden md:block overflow-x-auto">
               <table className="w-full text-left whitespace-nowrap min-w-[800px]">
                 <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                   <tr>
                     <th className="px-6 py-4">Nama</th>
                     <th className="px-6 py-4">Email (Username)</th>
                     <th className="px-6 py-4">Password</th>
                     <th className="px-6 py-4">Kelas</th>
                     <th className="px-6 py-4">Role</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4">Aksi</th>
                   </tr>
                 </thead>
                <tbody className="divide-y divide-gray-100">
                  {allUsers.filter(u => {
                    const matchKelas = filterKelas ? (u.kelas || '').toLowerCase() === filterKelas.toLowerCase() : true;
                    const matchName = filterName ? u.name.toLowerCase().includes(filterName.toLowerCase()) : true;
                    return matchKelas && matchName;
                  }).map((u) => (
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
                        {u.role === 'siswa' ? (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            (u.status || 'Aktif') === 'Aktif' ? 'bg-green-100 text-green-700' :
                            u.status === 'Alumni' ? 'bg-purple-100 text-purple-700' : 
                            u.status === 'Pindah' ? 'bg-orange-100 text-orange-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {u.status || 'Aktif'}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
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

            {/* Mobile View User Management */}
            <div className="md:hidden divide-y divide-gray-100">
              {allUsers.filter(u => {
                const matchKelas = filterKelas ? (u.kelas || '').toLowerCase() === filterKelas.toLowerCase() : true;
                const matchName = filterName ? u.name.toLowerCase().includes(filterName.toLowerCase()) : true;
                return matchKelas && matchName;
              }).map((u) => (
                <div key={u.id} className="p-4 hover:bg-gray-50 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-800">{u.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">{u.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                         u.role === 'admin' ? 'bg-red-100 text-red-600' :
                         u.role === 'guru' ? 'bg-blue-100 text-blue-600' :
                         'bg-green-100 text-green-600'
                       }`}>
                      {u.role}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-2.5 border border-gray-100 rounded-lg shrink-0">
                    <div className="text-[10px] font-bold text-gray-400">
                      KL: <span className="text-gray-800">{u.kelas || '-'}</span> | PW: <span className="text-gray-800">{u.plainPassword || '***'}</span>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => { setUserToReset(u); setShowResetPassword(true); }} className="text-gray-400 hover:text-yellow-600"><Key size={16} /></button>
                      <button onClick={() => { setEditingUser(u); setShowEditUser(true); }} className="text-gray-400 hover:text-blue-600"><Edit size={16} /></button>
                      <button onClick={() => { setUserToDelete(u); setShowDeleteConfirm(true); }} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'academic' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Tambah Siswa / Import Siswa Section */}
            <div className="card-3d p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
                <div>
                  <h3 className="text-xl font-black text-gray-800 tracking-tight">Data Siswa Aktif</h3>
                  <p className="text-xs text-gray-400 font-bold mt-1">Tambah siswa baru atau import dari Excel (Username, Password, Kelas).</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-nowrap items-center gap-3 w-full lg:w-auto">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    ref={fileInputRef} 
                    onChange={handleImportExcel} 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => {
                        const ws = XLSX.utils.json_to_sheet([
                            { Nama: "Contoh Siswa", Email: "siswa1@ra.com", Password: "password123", Kelas: "KELAS A", WhatsApp: "08123456789" }
                        ]);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "FormatSiswa");
                        XLSX.writeFile(wb, "Format_Import_Siswa.xlsx");
                    }}
                    className="w-full text-gray-500 hover:text-green-600 bg-gray-50 hover:bg-green-50 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs border border-gray-200"
                  >
                    <Download size={16} /> Download Format Excel
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-blue-50 text-blue-600 border border-blue-100 hover:border-blue-300 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-all text-xs"
                  >
                    <Upload size={16} /> Import Siswa via Excel
                  </button>
                  <button 
                    onClick={() => { setNewUserRole('siswa'); setShowAddUser(true); }}
                    className="w-full sm:col-span-2 lg:col-span-1 bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all text-xs shadow-lg shadow-green-100"
                  >
                    <Plus size={16} /> Tambah Siswa (Manual)
                  </button>
                </div>
              </div>
            </div>

            {/* Class Categories Manager */}
            <div className="card-3d overflow-hidden p-8">
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
              <div className="p-8 border-b border-gray-50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-gray-50/30">
                <div>
                  <h3 className="text-xl font-black text-gray-800 tracking-tight">Akademik & Rapot Siswa</h3>
                  <p className="text-xs text-gray-400 font-bold mt-1">Pilih siswa untuk mutasi (kenaikan/kelulusan) atau cetak Rapot.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                  <input 
                    type="text" 
                    placeholder="Cari Siswa..." 
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    className="w-full sm:w-auto p-3 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-600"
                  />
                  <select 
                    value={filterKelas}
                    onChange={(e) => setFilterKelas(e.target.value)}
                    className="text-xs p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-600 bg-white"
                  >
                    <option value="">Semua Kelas</option>
                    {schoolClasses.map((c: any) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={filterSiswaStatus}
                    onChange={(e) => setFilterSiswaStatus(e.target.value as any)}
                    className="text-xs p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-600 bg-white"
                  >
                    <option value="Aktif">Tampilkan: Siswa Aktif</option>
                    <option value="Alumni">Tampilkan: Alumni / Lulus</option>
                    <option value="Pindah">Tampilkan: Pindah Sekolah</option>
                    <option value="Tidak Aktif">Tampilkan: Tidak Aktif</option>
                  </select>

                  {selectedStudentsForMutasi.length > 0 && (
                    <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center w-full sm:w-auto bg-blue-50 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-blue-100 overflow-x-auto no-scrollbar">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-widest px-2 whitespace-nowrap">{selectedStudentsForMutasi.length} Dipilih</span>
                      <select 
                        value={mutasiTargetClass} 
                        onChange={(e) => setMutasiTargetClass(e.target.value)} 
                        className="text-xs p-2 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700 bg-white"
                      >
                        <option value="">-- Pilih Tujuan --</option>
                        {schoolClasses.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                        <option value="Lulus">LULUS / ALUMNI</option>
                        <option value="Pindah">PINDAH SEKOLAH</option>
                        <option value="Tidak Aktif">TIDAK AKTIF</option>
                        <option value="Hapus">HAPUS PERMANEN</option>
                      </select>
                      <button onClick={handleMutasiMassal} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md flex-shrink-0 whitespace-nowrap">Eksekusi Mutasi</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap min-w-[700px]">
                  <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4 w-12">
                        <input 
                          type="checkbox" 
                          onChange={(e) => {
                            const filtered = allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === filterSiswaStatus && (!filterKelas || (u.kelas || '').toLowerCase() === filterKelas.toLowerCase()) && (!filterName || u.name.toLowerCase().includes(filterName.toLowerCase())));
                            if(e.target.checked) setSelectedStudentsForMutasi(filtered.map(u => u.id));
                            else setSelectedStudentsForMutasi([]);
                          }} 
                          checked={selectedStudentsForMutasi.length > 0 && selectedStudentsForMutasi.length === allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === filterSiswaStatus && (!filterKelas || (u.kelas || '').toLowerCase() === filterKelas.toLowerCase()) && (!filterName || u.name.toLowerCase().includes(filterName.toLowerCase()))).length}
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
                    {allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === filterSiswaStatus && (!filterKelas || (u.kelas || '').toLowerCase() === filterKelas.toLowerCase()) && (!filterName || u.name.toLowerCase().includes(filterName.toLowerCase()))).map(student => (
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
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            (student.status || 'Aktif') === 'Aktif' ? 'bg-green-100 text-green-700' :
                            student.status === 'Alumni' ? 'bg-purple-100 text-purple-700' : 
                            student.status === 'Pindah' ? 'bg-orange-100 text-orange-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {student.status || 'Aktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => {
                              setSelectedStudentForRapot(student);
                              setPrintRapotPeriod('Semua');
                              setShowPrintRapotModal(true);
                            }}
                            className="bg-gray-800 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors inline-flex items-center gap-2"
                          >
                            <Printer size={14} /> Cetak
                          </button>
                        </td>
                      </tr>
                    ))}
                    {allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === filterSiswaStatus && (!filterKelas || (u.kelas || '').toLowerCase() === filterKelas.toLowerCase()) && (!filterName || u.name.toLowerCase().includes(filterName.toLowerCase()))).length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic font-medium">Data siswa dengan status tersebut belum tersedia.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Academic */}
              <div className="md:hidden divide-y divide-gray-100">
                {allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === filterSiswaStatus && (!filterKelas || (u.kelas || '').toLowerCase() === filterKelas.toLowerCase()) && (!filterName || u.name.toLowerCase().includes(filterName.toLowerCase()))).map(student => (
                  <div key={student.id} className="p-4 hover:bg-gray-50 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <input 
                          type="checkbox" 
                          checked={selectedStudentsForMutasi.includes(student.id)}
                          onChange={(e) => {
                            if(e.target.checked) setSelectedStudentsForMutasi([...selectedStudentsForMutasi, student.id]);
                            else setSelectedStudentsForMutasi(selectedStudentsForMutasi.filter(id => id !== student.id));
                          }}
                          className="w-4 h-4 mt-1 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-bold text-gray-800">{student.name}</p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{student.kelas || 'Belum Ditentukan'}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          (student.status || 'Aktif') === 'Aktif' ? 'bg-green-100 text-green-700' :
                          student.status === 'Alumni' ? 'bg-purple-100 text-purple-700' : 
                          student.status === 'Pindah' ? 'bg-orange-100 text-orange-700' : 
                          'bg-gray-100 text-gray-700'
                        }`}>
                        {student.status || 'Aktif'}
                      </span>
                    </div>
                    <div className="flex justify-end mt-2">
                      <button 
                        onClick={() => {
                          setSelectedStudentForRapot(student);
                          setPrintRapotPeriod('Semua');
                          setShowPrintRapotModal(true);
                        }}
                        className="bg-gray-800 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors inline-flex items-center gap-2"
                      >
                        <Printer size={14} /> Cetak Rapot
                      </button>
                    </div>
                  </div>
                ))}
                {allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === filterSiswaStatus).length === 0 && (
                  <div className="p-6 text-center text-gray-400 italic text-sm">Data siswa dengan status tersebut belum tersedia.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="card-3d p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">Kelola Absensi</h3>
                <p className="text-gray-400 text-sm font-medium">Filter dan monitoring kehadiran warga sekolah.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={exportAttendanceToExcel}
                  className="bg-indigo-50 text-indigo-600 border border-indigo-100 hover:border-indigo-300 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-100 transition-colors inline-flex items-center gap-2"
                >
                  <Download size={14} /> Export Excel
                </button>
                <select 
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                  className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-600"
                >
                  <option value="">Semua Kelas</option>
                  {schoolClasses.map((c: any) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
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
                        if (filterKelas && student?.role === 'siswa' && (student?.kelas || '').toLowerCase() !== filterKelas.toLowerCase()) return false;
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
                              <div className="flex items-center justify-end gap-2">
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
                            </div>
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
              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                <button 
                  onClick={exportFinanceToExcel}
                  className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all text-xs sm:text-sm"
                >
                  <Download size={18} /> Export Keuangan (Excel)
                </button>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => setShowImportTabunganModal(true)}
                    className="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all text-xs sm:text-sm"
                  >
                    <Upload size={18} /> Import Tabungan
                  </button>
                  <button 
                    onClick={() => {
                        const ws = XLSX.utils.json_to_sheet([
                            { Nama: "Contoh Siswa", "Nominal Tabungan": 150000 }
                        ]);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Format Tabungan");
                        XLSX.writeFile(wb, "Format_Import_Tabungan.xlsx");
                    }}
                    className="flex-1 sm:flex-none bg-gray-100 text-gray-600 px-4 py-2 rounded-xl border border-gray-200 font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all text-xs sm:text-sm"
                    title="Download format Excel untuk import tabungan otomatis"
                  >
                    <Download size={18} /> Format Import
                  </button>
                </div>
                <button 
                  onClick={() => setShowTabunganModal(true)}
                  className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all text-xs sm:text-sm"
                >
                  <Plus size={18} /> Input Tabungan
                </button>
                <button 
                  onClick={() => setShowDeleteIuranModal(true)}
                  className="flex-1 sm:flex-none bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-100 font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all text-xs sm:text-sm"
                >
                  <Trash2 size={18} /> Hapus Iuran Massal
                </button>
                <button 
                  onClick={() => setShowIuranModal(true)}
                  className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all text-xs sm:text-sm"
                >
                  <Plus size={18} /> Penetapan Iuran
                </button>
              </div>
            </div>

            {/* Visual Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-green-100 rounded-3xl flex items-center justify-center text-green-600">
                  <CreditCard size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Tabungan Siswa</p>
                  <h4 className="text-2xl font-black text-gray-800">Rp {allUsers.reduce((acc, curr) => acc + (curr.savings || 0), 0).toLocaleString()}</h4>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center text-red-600">
                  <AlertCircle size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Tunggakan Siswa</p>
                  <h4 className="text-2xl font-black text-gray-800">Rp {allUsers.filter(u => u.role === 'siswa').reduce((acc, curr) => acc + (curr.arrears || 0), 0).toLocaleString()}</h4>
                </div>
              </div>
            </div>

            {/* Visual Summary Chart */}
            <div className="card-3d p-8 overflow-hidden">
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
            
            {/* Validasi Pembayaran Section */}
            {payments.filter(p => p.status === 'pending').length > 0 && (
              <div className="bg-orange-50/50 rounded-3xl shadow-sm border border-orange-100 overflow-hidden mt-6">
                <div className="p-6 border-b border-orange-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2">
                    <Clock size={20} /> Menunggu Validasi Pembayaran
                  </h3>
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                    {payments.filter(p => p.status === 'pending').length} Menunggu
                  </span>
                </div>
                <div className="divide-y divide-orange-100 max-h-96 overflow-y-auto">
                  {payments.filter(p => p.status === 'pending').map((pay) => {
                    const student = allUsers.find(u => u.id === pay.studentId);
                    return (
                      <div key={pay.id} className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-orange-50 transition-colors">
                        <div>
                          <p className="font-bold text-gray-800">{student?.name || 'Siswa tidak ditemukan'}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {pay.method === 'Transfer' && pay.proofStr && (
                                <button 
                                  onClick={() => setSelectedPhoto(pay.proofStr)}
                                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                                >
                                  <ImageIcon size={12} /> Bukti Transfer
                                </button>
                              )}
                              {pay.method === 'Tunai' && pay.meetDate && (
                                <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                  <Calendar size={12} /> Janji: {pay.meetDate}
                                </div>
                              )}
                              {pay.method === 'Tabungan' && (
                                <div className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                  <CreditCard size={12} /> Potong Tabungan
                                </div>
                              )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <div className="text-left md:text-right flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Nominal</p>
                            <p className="font-black text-blue-600">Rp {pay.amount.toLocaleString()}</p>
                          </div>
                          
                            <div className="flex items-center gap-2 shrink-0">
                              <button 
                                onClick={() => handleApprovePayment(pay)}
                                className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg flex items-center gap-1"
                              >
                                <CheckCircle size={14} /> Validasi
                              </button>
                              <button 
                                onClick={() => handleRejectPayment(pay.id)}
                                className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1"
                              >
                                <X size={14} /> Tolak
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-6">
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-bold text-gray-800">Daftar Keuangan Siswa</h3>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <input 
                      type="text"
                      placeholder="Cari Nama Siswa..."
                      value={searchFinanceList}
                      onChange={(e) => setSearchFinanceList(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500 font-medium"
                    />
                    <Users className="absolute left-3 top-2 text-gray-400" size={16} />
                  </div>
                  <select 
                    value={filterKeuanganStatus}
                    onChange={(e) => setFilterKeuanganStatus(e.target.value as any)}
                    className="w-full sm:w-auto p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-600"
                  >
                    <option value="semua">Semua Status Keuangan</option>
                    <option value="menunggak">Menunggak</option>
                    <option value="lunas">Lunas</option>
                  </select>
                  <select 
                    value={filterKelas}
                    onChange={(e) => setFilterKelas(e.target.value)}
                    className="w-full sm:w-auto p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-600"
                  >
                    <option value="">Semua Kelas</option>
                    {schoolClasses.map((c: any) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap min-w-[700px]">
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
                    {allUsers.filter(u => {
                      const matchBase = u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif';
                      const matchKelas = !filterKelas || (u.kelas || '').toLowerCase() === filterKelas.toLowerCase();
                      const matchName = !searchFinanceList || u.name.toLowerCase().includes(searchFinanceList.toLowerCase());
                      const matchStatus = filterKeuanganStatus === 'semua' ? true : (filterKeuanganStatus === 'menunggak' ? (u.arrears > 0) : ((u.arrears || 0) === 0));
                      return matchBase && matchKelas && matchName && matchStatus;
                    }).map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-800">{u.name}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{u.kelas || '-'}</td>
                        <td className="px-6 py-4 font-bold text-green-600">Rp {(u.savings || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 font-bold text-red-600">Rp {(u.arrears || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.whatsapp && (u.arrears > 0) && (
                              <button 
                                onClick={() => {
                                  // Find the first arrear detail to follow up
                                  const firstArrear = u.arrears_details?.[0];
                                  if (firstArrear) {
                                    handleWhatsAppFollowUp(u, firstArrear);
                                  } else {
                                    alert("Tidak ada rincian tunggakan spesifik.");
                                  }
                                }}
                                className="bg-green-50 text-green-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-green-600 hover:text-white transition-all flex items-center gap-1"
                                title="Follow up Tagihan via WA"
                              >
                                <Megaphone size={14} /> Follow-up
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setSelectedStudentForFinance(u);
                                setShowManageFinanceModal(true);
                              }}
                              className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                            >
                              Kelola Keuangan
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Keuangan */}
              <div className="md:hidden divide-y divide-gray-100">
                {allUsers.filter(u => {
                  const matchBase = u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif';
                  const matchKelas = !filterKelas || (u.kelas || '').toLowerCase() === filterKelas.toLowerCase();
                  const matchName = !searchFinanceList || u.name.toLowerCase().includes(searchFinanceList.toLowerCase());
                  const matchStatus = filterKeuanganStatus === 'semua' ? true : (filterKeuanganStatus === 'menunggak' ? (u.arrears > 0) : ((u.arrears || 0) === 0));
                  return matchBase && matchKelas && matchName && matchStatus;
                }).map((u) => (
                  <div key={u.id} className="p-4 hover:bg-gray-50 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800">{u.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{u.kelas || 'Belum Ditentukan'}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-3 border border-gray-100 rounded-lg">
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tabungan</p>
                        <p className="font-bold text-green-600">Rp {(u.savings || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tunggakan</p>
                        <p className="font-bold text-red-600">Rp {(u.arrears || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex justify-end items-center gap-2 mt-4">
                       {u.whatsapp && u.arrears > 0 && (
                         <button 
                           onClick={() => {
                             const firstArrear = u.arrears_details?.[0];
                             if (firstArrear) handleWhatsAppFollowUp(u, firstArrear);
                           }}
                           className="flex-1 bg-green-50 text-green-600 px-4 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2"
                         >
                           <Megaphone size={14} /> Tagih WA
                         </button>
                       )}
                       <button 
                         onClick={() => {
                           setSelectedStudentForFinance(u);
                           setShowManageFinanceModal(true);
                         }}
                         className="flex-1 bg-blue-50 text-blue-600 px-4 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2"
                       >
                         Detail Keuangan
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-bold text-gray-800">Broadcast & Pengumuman</h3>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => setShowBroadcastPulangModal(true)}
                  className="w-full sm:w-auto bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-all text-sm border border-blue-200"
                >
                  <Megaphone size={18} /> Broadcast Kepulangan (WA)
                </button>
                <button 
                  onClick={() => setShowAnnounceModal(true)}
                  className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all text-sm"
                >
                  <Plus size={18} /> Buat Info Baru
                </button>
              </div>
            </div>
            <div className="grid gap-4">
              {announcements.map(a => (
                <div key={a.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-gray-800 text-xl">{a.title}</h4>
                      {a.target && a.target !== 'all' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                          Target: {a.target.replace('kelas_', 'Kelas ')}
                        </span>
                      )}
                    </div>
                    <div className="markdown-body mt-4">
                      <ReactMarkdown>{a.content}</ReactMarkdown>
                    </div>
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



        {activeTab === 'profile' && (
          <div className="card-3d p-8 max-w-2xl">
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
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status Siswa</label>
                      <select value={editingUser.status || 'Aktif'} onChange={(e) => setEditingUser({...editingUser, status: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required>
                        <option value="Aktif">Aktif</option>
                        <option value="Tidak Aktif">Tidak Aktif</option>
                        <option value="Pindah">Pindah Sekolah</option>
                        <option value="Alumni">Alumni / Lulus</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kelas</label>
                      <select value={editingUser.kelas || ''} onChange={(e) => setEditingUser({...editingUser, kelas: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required>
                        <option value="">-- Pilih Kelas --</option>
                        {schoolClasses.map((c: any) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
              <button 
                onClick={() => setShowAddUser(false)} 
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors z-10"
              >
                <X size={20} />
              </button>
              
              {/* Left Decoration / Hero */}
              <div className="hidden md:flex flex-col justify-end w-1/3 bg-gradient-to-br from-green-500 to-green-700 p-8 text-white relative overflow-hidden">
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                    {newUserRole === 'siswa' ? <Users size={24} className="text-white" /> : <Shield size={24} className="text-white" />}
                  </div>
                  <h3 className="text-2xl font-black mb-2 leading-tight">Registrasi<br/>Data Baru</h3>
                  <p className="text-sm font-medium text-green-50 opacity-90">
                    Tambahkan data {newUserRole} secara manual ke sistem portal akademik.
                  </p>
                </div>
              </div>

              {/* Form Content */}
              <div className="w-full md:w-2/3 p-8 md:p-10 max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-black text-gray-800 mb-6 md:hidden">Tambah User Baru</h3>
                
                <form onSubmit={handleAddUser} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Role Akses</label>
                      <select 
                        value={newUserRole} 
                        onChange={(e) => setNewUserRole(e.target.value)} 
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 transition-all cursor-pointer"
                      >
                        <option value="siswa">Siswa</option>
                        <option value="guru">Guru</option>
                        <option value="admin">Admin / Staff</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
                      <input 
                        type="text" 
                        value={newUserName} 
                        onChange={(e) => setNewUserName(e.target.value)} 
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-800 transition-all placeholder:text-gray-400 placeholder:font-medium" 
                        placeholder="Contoh: Ahmad Abdullah"
                        required 
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Email Akses</label>
                      <input 
                        type="email" 
                        value={newUserEmail} 
                        onChange={(e) => setNewUserEmail(e.target.value)} 
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-800 transition-all placeholder:text-gray-400 placeholder:font-medium" 
                        placeholder="email@sekolah.com"
                        required 
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Password</label>
                      <input 
                        type="text" 
                        value={newUserPassword} 
                        onChange={(e) => setNewUserPassword(e.target.value)} 
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-800 transition-all placeholder:text-gray-400 placeholder:font-medium" 
                        placeholder="Min. 6 Karakter"
                        required 
                        minLength={6} 
                      />
                    </div>

                    {newUserRole === 'siswa' && (
                      <>
                        <div className="col-span-2 sm:col-span-1 animate-in fade-in slide-in-from-top-2">
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Kategori Kelas</label>
                          <select 
                            value={newUserKelas} 
                            onChange={(e) => setNewUserKelas(e.target.value)} 
                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 transition-all cursor-pointer" 
                            required
                          >
                            <option value="">-- PILIH KELAS --</option>
                            {schoolClasses.map((c: any) => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="col-span-2 sm:col-span-1 animate-in fade-in slide-in-from-top-2">
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">WhatsApp Wali</label>
                          <input 
                            type="text" 
                            value={newUserWhatsapp} 
                            onChange={(e) => setNewUserWhatsapp(e.target.value)} 
                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-800 transition-all placeholder:text-gray-400 placeholder:font-medium" 
                            placeholder="08123456789"
                            required 
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="pt-4 mt-6 border-t border-gray-100">
                    <button 
                      type="submit" 
                      className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-green-700 shadow-xl shadow-green-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Simpan Data {newUserRole}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showImportTabunganModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
              <button onClick={() => setShowImportTabunganModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Upload className="text-indigo-600" /> Import Tabungan</h3>
              <form onSubmit={handleImportTabunganSubmit} className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                  <AlertCircle className="text-indigo-600 shrink-0 mt-0.5" size={18} />
                  <p className="text-[10px] text-indigo-800 font-medium">Unggah file Excel berisi Nama siswa dan Nominal Tabungan. Nominal akan <strong className="text-indigo-700">dijumlahkan</strong> ke total tabungan saat ini berdasarkan periode yang dipilih.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dari Tanggal *</label>
                  <input type="date" value={importTabunganStartDate} onChange={(e) => setImportTabunganStartDate(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sampai Tanggal (Opsional)</label>
                  <input type="date" value={importTabunganEndDate} onChange={(e) => setImportTabunganEndDate(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  ref={importTabunganInputRef} 
                  onChange={handleImportTabungan} 
                  className="hidden" 
                />

                <button type="submit" className="w-full px-6 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all mt-4">
                  Pilih File & Import Excel
                </button>
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pilih Siswa (Bisa lebih dari 1)</label>
                  <input
                    type="text"
                    placeholder="Cari Nama Siswa..."
                    value={searchStudentFinance}
                    onChange={(e) => setSearchStudentFinance(e.target.value)}
                    className="w-full p-2 mb-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <div className="max-h-40 overflow-y-auto bg-gray-50 border border-gray-200 rounded-xl p-2 space-y-1">
                    {allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif' && (!searchStudentFinance || u.name.toLowerCase().includes(searchStudentFinance.toLowerCase()))).map(u => (
                      <label key={u.id} className="flex items-center gap-2 p-2 hover:bg-green-50 rounded-lg cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="rounded text-green-600 focus:ring-green-500"
                          checked={financeStudentIds.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) setFinanceStudentIds([...financeStudentIds, u.id]);
                            else setFinanceStudentIds(financeStudentIds.filter(id => id !== u.id));
                          }}
                        />
                        <span className="text-sm font-medium text-gray-700">{u.name} ({u.kelas || '-'})</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button type="button" onClick={() => {
                      const visibleIds = allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif' && (!searchStudentFinance || u.name.toLowerCase().includes(searchStudentFinance.toLowerCase()))).map(u => u.id);
                      setFinanceStudentIds(Array.from(new Set([...financeStudentIds, ...visibleIds])));
                    }} className="text-[10px] bg-gray-100 px-3 py-1 rounded-md text-gray-600 hover:bg-gray-200 font-bold">Pilih Semua (Terlihat)</button>
                    <button type="button" onClick={() => setFinanceStudentIds([])} className="text-[10px] bg-red-50 px-3 py-1 rounded-md text-red-600 hover:bg-red-100 font-bold">Reset</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal</label>
                  <input type="date" value={financeDate} onChange={(e) => setFinanceDate(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nominal (Rp) Per Siswa</label>
                  <input type="number" value={financeAmount} onChange={(e) => setFinanceAmount(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" placeholder="Contoh: 10000" required min="1" />
                </div>
                <button type="submit" className="w-full px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-xl shadow-green-200 transition-all mt-4">
                  Simpan Tabungan ({financeStudentIds.length} Siswa)
                </button>
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
                  <input 
                    type="text" 
                    list="existing-iurans"
                    value={financeIuranName} 
                    onChange={(e) => setFinanceIuranName(e.target.value)} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Contoh: SPP Bulan Juli" 
                    required 
                  />
                  <datalist id="existing-iurans">
                    {Array.from(new Set(allUsers.flatMap(u => (u.arrears_details || []).map((d: any) => d.name)))).map(name => (
                      <option key={`opt_${name}`} value={name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jatuh Tempo (Opsional)</label>
                  <input type="date" value={financeDueDate} onChange={(e) => setFinanceDueDate(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nominal (Rp)</label>
                  <input type="number" value={financeAmount} onChange={(e) => setFinanceAmount(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: 50000" required min="0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Siswa</label>
                  <input
                    type="text"
                    placeholder="Cari Nama Siswa (untuk pilihan spesifik)..."
                    value={searchStudentIuran}
                    onChange={(e) => setSearchStudentIuran(e.target.value)}
                    className="w-full p-2 mb-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select value={financeIuranTarget} onChange={(e) => setFinanceIuranTarget(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="all">Semua Siswa Aktif</option>
                    {schoolClasses.map(c => (
                      <option key={`kelas_${c.id}`} value={`kelas_${c.name}`}>Khusus Kelas: {c.name}</option>
                    ))}
                    <optgroup label="Pilih Siswa Spesifik (Gunakan pencarian di atas)">
                      {allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif' && (!searchStudentIuran || u.name.toLowerCase().includes(searchStudentIuran.toLowerCase()))).map(u => (
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

        {showDeleteIuranModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative">
              <button onClick={() => setShowDeleteIuranModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
              <div className="p-6 bg-red-600 text-white">
                <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                  <Trash2 size={24} /> Hapus Iuran Massal
                </h3>
                <p className="text-xs text-red-100 mt-1">Hapus tagihan secara massal per kelas atau siswa</p>
              </div>
              <form onSubmit={handleMassDeleteIuran} className="p-6 space-y-4">
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-start gap-3">
                  <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
                  <p className="text-[10px] text-red-800 font-medium">Masukkan Nama Iuran yang tepat (sama persis dengan yang ada di daftar tunggakan siswa).</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cari & Pilih Nama Iuran (Target Hapus)</label>
                  <input
                    type="text"
                    placeholder="Filter nama iuran yang ada..."
                    value={deleteIuranSearchName}
                    onChange={(e) => setDeleteIuranSearchName(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 mb-2"
                  />
                  <select 
                    value={deleteIuranDescription} 
                    onChange={(e) => setDeleteIuranDescription(e.target.value)} 
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
                    required
                  >
                    <option value="">-- Pilih Iuran --</option>
                    {Array.from(new Set(allUsers.flatMap(u => (u.arrears_details || []).map((d: any) => d.name))))
                      .filter(name => !deleteIuranSearchName || name.toLowerCase().includes(deleteIuranSearchName.toLowerCase()))
                      .map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Siswa</label>
                  <input
                    type="text"
                    placeholder="Cari Nama Siswa (untuk filter daftar)..."
                    value={searchStudentDelete}
                    onChange={(e) => setSearchStudentDelete(e.target.value)}
                    className="w-full p-2 mb-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <select value={deleteIuranTarget} onChange={(e) => setDeleteIuranTarget(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500" required>
                    <option value="all">Semua Siswa Aktif</option>
                    {schoolClasses.map(c => (
                      <option key={`del_iuran_${c.id}`} value={`kelas_${c.name}`}>Siswa Kelas {c.name}</option>
                    ))}
                    <optgroup label="Siswa Spesifik">
                      {allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif' && (!searchStudentDelete || u.name.toLowerCase().includes(searchStudentDelete.toLowerCase()))).map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.kelas || '-'})</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <button type="submit" className="w-full px-6 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-xl shadow-red-200 transition-all mt-4">Hapus Massal Sekarang</button>
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
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        id="update-savings"
                        placeholder="Ubah Total"
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
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        id="kurang-savings"
                        placeholder="Nominal Tarik"
                        className="w-full p-2 rounded-lg border border-orange-200 outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      />
                      <button 
                        onClick={() => {
                          const val = (document.getElementById('kurang-savings') as HTMLInputElement).value;
                          if(val && Number(val) > 0) {
                            handleTarikTabungan(selectedStudentForFinance.id, val);
                            (document.getElementById('kurang-savings') as HTMLInputElement).value = '';
                          }
                        }}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-600 whitespace-nowrap"
                      >
                        Tarik
                      </button>
                    </div>
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
                    <div key={detail.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 rounded-xl border border-gray-100 gap-4">
                      <div>
                        <p className="font-bold text-gray-800">{detail.name}</p>
                        <p className="text-xs text-gray-500">Ditetapkan: {detail.date}</p>
                        {detail.dueDate && (
                          <p className={`text-[10px] font-bold uppercase mt-1 ${new Date(detail.dueDate) < new Date() ? 'text-red-500' : 'text-orange-500'}`}>
                            Jatuh Tempo: {detail.dueDate}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold text-red-600">Rp {detail.amount.toLocaleString()}</span>
                        <button 
                          onClick={() => handleWhatsAppFollowUp(selectedStudentForFinance, detail)}
                          className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors flex items-center gap-1"
                        >
                          Follow Up WA
                        </button>
                        <button 
                          onClick={() => handleDeleteArrear(selectedStudentForFinance.id, detail.id)}
                          className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors flex items-center gap-1"
                          title="Hapus Tagihan"
                        >
                          <Trash2 size={12} />
                        </button>
                        <button 
                          onClick={() => {
                            setActiveStudentForPayment(selectedStudentForFinance);
                            setActiveDetailToPay(detail);
                            setPaymentProof('');
                            setPaymentNote('');
                            setPaymentMethod('Tunai');
                            setShowPayConfirmModal(true);
                          }}
                          className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors"
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
                        <button 
                          onClick={() => handleDeletePayment(pay.id)}
                          className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Hapus Riwayat"
                        >
                          <Trash2 size={18} />
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

        {showBroadcastPulangModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
              <button onClick={() => setShowBroadcastPulangModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                 <Megaphone size={28} className="text-blue-500" /> WhatsApp Kepulangan
              </h3>
              <form onSubmit={handleBroadcastPulang} className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                  <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                  <p className="text-[10px] text-blue-800 font-medium">Pesan "Info Kepulangan" akan dikirimkan otomatis via tab WhatsApp Web baru untuk setiap siswa. Mohon izinkan popup di browser Anda.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pilih Target Siswa</label>
                  <input
                    type="text"
                    placeholder="Cari Nama Siswa (Jika spesifik)..."
                    value={searchStudentBroadcast}
                    onChange={(e) => setSearchStudentBroadcast(e.target.value)}
                    className="w-full p-2 mb-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select value={broadcastPulangTarget} onChange={(e) => setBroadcastPulangTarget(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="all">Semua Siswa Aktif</option>
                    {schoolClasses.map(c => (
                      <option key={`bc_kelas_${c.id}`} value={`kelas_${c.name}`}>Khusus Kelas: {c.name}</option>
                    ))}
                    <optgroup label="Siswa Spesifik">
                      {allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif' && (!searchStudentBroadcast || u.name.toLowerCase().includes(searchStudentBroadcast.toLowerCase()))).map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.kelas || '-'})</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <button type="submit" className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all mt-4">Kirim Pesan WA Kepulangan</button>
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target</label>
                  <select value={announceTarget} onChange={(e) => setAnnounceTarget(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500">
                    <option value="all">Semua Pengguna</option>
                    <option value="guru">Khusus Guru</option>
                    {schoolClasses.map(c => (
                      <option key={c.id} value={`kelas_${c.name}`}>Khusus Kelas: {c.name}</option>
                    ))}
                  </select>
                </div>
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
