import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { getApps, initializeApp } from 'firebase/app';
import { sendPasswordResetEmail, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, getDoc, updateDoc, setDoc, orderBy, getDocs, where } from 'firebase/firestore';
import { Users, Shield, Plus, Trash2, Edit, BarChart, Bell, LogOut, User, Download, CreditCard, Megaphone, X, Menu, Settings, Image as ImageIcon, Key, Upload, CheckCircle, Camera, TrendingUp, BookOpen, Clock, Printer, FileText, AlertCircle, RefreshCw, Calendar, Save, Trophy, Star, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [exams, setExams] = useState<any[]>([]);
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
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer' | 'Tabungan' | 'Campuran'>('Tunai');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentProof, setPaymentProof] = useState('');
  const [mixedSavingsAmount, setMixedSavingsAmount] = useState('');
  const [mixedCashAmount, setMixedCashAmount] = useState('');
  const [activeDetailToPay, setActiveDetailToPay] = useState<any>(null);
  const [activeStudentForPayment, setActiveStudentForPayment] = useState<any>(null);
  const paymentProofRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [iuranCategories, setIuranCategories] = useState<any[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const importTabunganInputRef = useRef<HTMLInputElement>(null);
  
  // Form States
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [newUserRole, setNewUserRole] = useState('siswa');
  const [newUserKelas, setNewUserKelas] = useState('');
  const [newUserTeacherType, setNewUserTeacherType] = useState('Guru Kelas');
  const [newUserAssignedClass, setNewUserAssignedClass] = useState('');
  const [newUserWhatsapp, setNewUserWhatsapp] = useState('');
  const [newUserTempatLahir, setNewUserTempatLahir] = useState('');
  const [newUserTanggalLahir, setNewUserTanggalLahir] = useState('');
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
  const [searchTransactionText, setSearchTransactionText] = useState('');
  
  // Exam States
  const [showExamModal, setShowExamModal] = useState(false);
  const [examType, setExamType] = useState('PTS Ganjil');
  const [examYear, setExamYear] = useState('2024/2025');
  const [showExamScheduleModal, setShowExamScheduleModal] = useState(false);
  const [activeExamId, setActiveExamId] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleSubject, setScheduleSubject] = useState('');
  const [scheduleClass, setScheduleClass] = useState('Semua Kelas');
  
  // Manage Finance Modal States
  const [filterFinanceIuranName, setFilterFinanceIuranName] = useState('');
  const [filterFinanceCategory, setFilterFinanceCategory] = useState('');
  const [filterFinanceStartDate, setFilterFinanceStartDate] = useState('');
  const [filterFinanceEndDate, setFilterFinanceEndDate] = useState('');
  const [showManageFinanceModal, setShowManageFinanceModal] = useState(false);
  const [selectedStudentForFinance, setSelectedStudentForFinance] = useState<any>(null);

  // Profile Edit States
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  
  // Change Password State
  const [newPasswordProfile, setNewPasswordProfile] = useState('');
  const [confirmPassword, setConfirmPasswordProfile] = useState('');
  
  // Photo Viewer State
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Attendance Filter States
  const [filterUserRole, setFilterUserRole] = useState<'semua' | 'admin' | 'guru' | 'siswa'>('semua');
  const [filterRole, setFilterRole] = useState<'semua' | 'siswa' | 'guru'>('semua');
  const [filterSiswaStatus, setFilterSiswaStatus] = useState<'Aktif' | 'Alumni' | 'Tidak Aktif' | 'Pindah'>('Aktif');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterTeacherType, setFilterTeacherType] = useState('semua');
  const [filterName, setFilterName] = useState('');
  const [studentPaymentHistory, setStudentPaymentHistory] = useState<any[]>([]);
  const [rankingClassFilter, setRankingClassFilter] = useState('Semua');
  const [filterKeuanganStatus, setFilterKeuanganStatus] = useState<'semua' | 'menunggak' | 'lunas'>('semua');
  const [financeSubTab, setFinanceSubTab] = useState<'siswa' | 'validasi' | 'riwayat'>('siswa');
  const [filterFinanceKelas, setFilterFinanceKelas] = useState('');
  const [filterLogStatus, setFilterLogStatus] = useState<'semua' | 'pending' | 'lunas' | 'ditolak'>('semua');
  const [filterLogStartDate, setFilterLogStartDate] = useState('');
  const [filterLogEndDate, setFilterLogEndDate] = useState('');

  // Achievement Filters
  const [filterAchievementKelas, setFilterAchievementKelas] = useState('Semua');
  const [filterAchievementCategory, setFilterAchievementCategory] = useState('Semua');
  const [filterAchievementSearch, setFilterAchievementSearch] = useState('');
  const [filterAchievementPeriod, setFilterAchievementPeriod] = useState('Semua');

  // Academic States
  const [schoolClasses, setSchoolClasses] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [hafalanData, setHafalanData] = useState<any[]>([]);
  const [filterAssessmentName, setFilterAssessmentName] = useState('');
  const [filterAssessmentKelas, setFilterAssessmentKelas] = useState('');
  const [filterAssessmentCategory, setFilterAssessmentCategory] = useState('Semua');
  const [expandedStudentIds, setExpandedStudentIds] = useState<Record<string, boolean>>({});
  const [kaldikData, setKaldikData] = useState<any[]>([]);
  const [materialsData, setMaterialsData] = useState<any[]>([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  
  // Kaldik States
  const [showAddKaldik, setShowAddKaldik] = useState(false);
  const [editKaldikId, setEditKaldikId] = useState<string | null>(null);
  const [newKaldik, setNewKaldik] = useState({ date: '', title: '', description: '', type: 'Libur' });

  const [showMutasiModal, setShowMutasiModal] = useState(false);
  const [mutasiTargetClass, setMutasiTargetClass] = useState('');
  const [selectedStudentsForMutasi, setSelectedStudentsForMutasi] = useState<string[]>([]);
  const [selectedStudentForRapot, setSelectedStudentForRapot] = useState<any>(null);
  const [showPrintRapotModal, setShowPrintRapotModal] = useState(false);
  const [printRapotPeriod, setPrintRapotPeriod] = useState('PTS Ganjil');

  const isFinanceFiltered = filterFinanceIuranName || filterFinanceCategory || filterFinanceStartDate || filterFinanceEndDate;
  
  // Available Iurans for filtering (categorized)
  const availableIuranDetails = Array.from(new Set(allUsers.filter(u => u.role === 'siswa').flatMap(u => (u.arrears_details || []).map((d: any) => JSON.stringify({ name: d.name, category: d.category || 'Umum' })))))
    .map(s => JSON.parse(s));

  const filteredAvailableIuranNames = Array.from(new Set(
    availableIuranDetails
      .filter(d => !filterFinanceCategory || d.category === filterFinanceCategory)
      .map(d => d.name)
  )).sort();

  const filteredUsersForFinance = isFinanceFiltered ? allUsers.map(u => {
    if (u.role !== 'siswa') return u;

    let filteredArrears = 0;
    const details = u.arrears_details || [];
    details.forEach((d: any) => {
      let match = true;
      if (filterFinanceIuranName && !d.name.toLowerCase().includes(filterFinanceIuranName.toLowerCase())) match = false;
      if (filterFinanceCategory) {
        const catName = d.category || 'Umum';
        if (catName !== filterFinanceCategory) match = false;
      }
      if (filterFinanceStartDate && d.date < filterFinanceStartDate) match = false;
      if (filterFinanceEndDate && d.date > filterFinanceEndDate) match = false;
      if (match) filteredArrears += d.amount;
    });

    let filteredSavings = 0;
    payments.forEach(p => {
      if (p.studentId !== u.id) return;
      let match = true;
      if (filterFinanceCategory) {
        const pCat = p.iuranCategory || 'Umum';
        if (p.type === 'tagihan' && pCat !== filterFinanceCategory) match = false;
        // Tabungan typically doesn't have a category in the same sense, 
        // but if we are filtering by category, we might want to hide savings 
        // unless specified. For now, let's keep savings accurate to the user's total 
        // unless it's a specific payment record filter.
      }
      if (filterFinanceStartDate && p.date < filterFinanceStartDate) match = false;
      if (filterFinanceEndDate && p.date > filterFinanceEndDate) match = false;
      if (!match) return;
      if (p.type === 'tabungan') filteredSavings += Number(p.amount || 0);
      else if (p.method === 'Tabungan') filteredSavings -= Number(p.amount || 0);
    });

    if ((filterFinanceIuranName || filterFinanceCategory) && !filterFinanceStartDate && !filterFinanceEndDate) {
      filteredSavings = u.savings || 0;
    }

    return {
      ...u,
      viewArrears: filteredArrears,
      viewSavings: filteredSavings
    };
  }) : allUsers;

  const displayTotalTunggakan = isFinanceFiltered 
    ? filteredUsersForFinance.filter(u => u.role === 'siswa').reduce((acc, curr) => acc + (curr.viewArrears || 0), 0)
    : allUsers.filter(u => u.role === 'siswa').reduce((acc, curr) => acc + (curr.arrears || 0), 0);
    
  const displayTotalTabungan = isFinanceFiltered
    ? filteredUsersForFinance.filter(u => u.role === 'siswa').reduce((acc, curr) => acc + (curr.viewSavings || 0), 0)
    : allUsers.reduce((acc, curr) => acc + (curr.savings || 0), 0);

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

  useEffect(() => {
    if (filterFinanceCategory && filterFinanceIuranName) {
      const isValidForCategory = availableIuranDetails.some(d => d.name === filterFinanceIuranName && d.category === filterFinanceCategory);
      if (!isValidForCategory) {
        setFilterFinanceIuranName('');
      }
    }
  }, [filterFinanceCategory, availableIuranDetails, filterFinanceIuranName]);

  const handlePrintReceipt = (pay: any) => {
    const student = allUsers.find(u => u.id === pay.studentId);
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
        <body>
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
      <script>window.onload = function() { setTimeout(function(){ window.print(); window.close(); }, 500); }</script>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
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

    const unsubExams = onSnapshot(query(collection(db, 'exams'), orderBy('createdAt', 'desc')), (snapshot) => {
      setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      if (!error.message.includes('insufficient permissions')) {
        console.error("Error fetching exams:", error);
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

    const unsubKaldik = onSnapshot(query(collection(db, 'kaldik')), (snapshot) => {
      setKaldikData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {});

    const unsubMaterials = onSnapshot(query(collection(db, 'materials'), orderBy('createdAt', 'desc')), (snapshot) => {
      setMaterialsData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {});

    const unsubHafalan = onSnapshot(query(collection(db, 'hafalan_progress'), orderBy('createdAt', 'desc')), (snapshot) => {
      setHafalanData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {});

    const unsubCategories = onSnapshot(query(collection(db, 'iuran_categories'), orderBy('name', 'asc')), (snapshot) => {
      setIuranCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {});

    return () => {
      unsubUsers();
      unsubAttendance();
      unsubAnnounce();
      unsubExams();
      unsubPayments();
      unsubSettings();
      unsubClasses();
      unsubProgress();
      unsubKaldik();
      unsubMaterials();
      unsubHafalan();
      unsubCategories();
    };
  }, [user]);

  const handleSaveKaldik = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKaldik.title || !newKaldik.date) return;
    try {
      if (editKaldikId) {
        await updateDoc(doc(db, 'kaldik', editKaldikId), { ...newKaldik });
        alert('Kalender Pendidikan berhasil diperbarui!');
      } else {
        await addDoc(collection(db, 'kaldik'), { ...newKaldik, createdAt: serverTimestamp() });
        alert('Event Kaldik berhasil ditambahkan!');
      }
      setShowAddKaldik(false);
      setNewKaldik({ date: '', title: '', description: '', type: 'Libur' });
      setEditKaldikId(null);
    } catch (error) {
      handleFirestoreError(error, editKaldikId ? OperationType.UPDATE : OperationType.CREATE, 'kaldik');
    }
  };

  const handleDeleteKaldik = async (id: string) => {
    if (window.confirm('Hapus event Kalender Pendidikan ini?')) {
      try {
        await deleteDoc(doc(db, 'kaldik', id));
        alert('Event Kaldik dihapus!');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `kaldik/${id}`);
      }
    }
  };

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
        userData.tempatLahir = newUserTempatLahir;
        userData.tanggalLahir = newUserTanggalLahir;
      }
      if (newUserRole === 'guru') {
        userData.teacherType = newUserTeacherType;
        userData.assignedClass = newUserAssignedClass;
      }
      
      // Save to Firestore using the UID from Auth
      await setDoc(doc(db, path, userCredential.user.uid), userData);
      
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('123456');
      setNewUserKelas('');
      setNewUserWhatsapp('');
      setNewUserTempatLahir('');
      setNewUserTanggalLahir('');
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
        userData.tempatLahir = editingUser.tempatLahir || '';
        userData.tanggalLahir = editingUser.tanggalLahir || '';
      }
      if (editingUser.role === 'guru') {
        userData.teacherType = editingUser.teacherType || 'Guru Kelas';
        userData.assignedClass = editingUser.assignedClass || '';
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

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    try {
      await addDoc(collection(db, 'iuran_categories'), {
        name: newCategoryName,
        description: newCategoryDescription,
        createdAt: serverTimestamp()
      });
      setNewCategoryName('');
      setNewCategoryDescription('');
      alert('Kategori iuran berhasil ditambahkan!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'iuran_categories');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Hapus kategori iuran ini?')) return;
    try {
      await deleteDoc(doc(db, 'iuran_categories', id));
      alert('Kategori iuran berhasil dihapus!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `iuran_categories/${id}`);
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

  const handleTarikTabungan = async (userId: string, amountTarik: string, desc?: string) => {
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
        description: desc ? `Penarikan: ${desc}` : 'Penarikan/Kurangi Tabungan',
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

  const updateFinance = async (userId: string, field: 'savings' | 'arrears', value: string, desc?: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        [field]: Number(value)
      });
      
      const defaultDesc = `Update manual ${field === 'savings' ? 'Tabungan' : 'Tunggakan'}`;
      
      // Log to payments history
      await addDoc(collection(db, 'payments'), {
        studentId: userId,
        amount: Number(value),
        description: desc ? `${defaultDesc} - ${desc}` : defaultDesc,
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

  const handleAddSingleTabungan = async (userId: string, amount: string, desc: string) => {
    try {
      const student = allUsers.find(u => u.id === userId);
      if (!student) return;

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        alert("Nominal tabungan harus lebih dari 0");
        return;
      }

      const finalDesc = desc.trim() ? desc : "Nabung manual";

      const newSavings = (student.savings || 0) + numAmount;
      
      await updateDoc(doc(db, 'users', student.id), { 
        savings: newSavings
      });

      await addDoc(collection(db, 'payments'), {
        studentId: student.id,
        amount: numAmount,
        description: `Tambah Tabungan: ${finalDesc}`,
        type: 'tabungan',
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      });

      if (selectedStudentForFinance && selectedStudentForFinance.id === userId) {
        setSelectedStudentForFinance((prev: any) => ({
          ...prev,
          savings: newSavings
        }));
      }

      alert('Tabungan berhasil ditambahkan!');
    } catch (error) {
      console.error(error);
      alert('Gagal menambahkan tabungan.');
    }
  };

  const handleAddSingleTunggakan = async (userId: string, amount: string, desc: string) => {
    try {
      const student = allUsers.find(u => u.id === userId);
      if (!student) return;

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        alert("Nominal harus lebih dari 0");
        return;
      }

      if (!desc.trim()) {
        alert("Keterangan/Nama Tagihan harus diisi!");
        return;
      }

      const newArrearDetail = {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        name: desc,
        amount: numAmount,
        date: new Date().toISOString().split('T')[0],
        dueDate: null
      };

      const newArrears = (student.arrears || 0) + numAmount;
      const currentDetails = student.arrears_details || [];
      const newDetails = [...currentDetails, newArrearDetail];
      
      await updateDoc(doc(db, 'users', student.id), { 
        arrears: newArrears,
        arrears_details: newDetails
      });

      await addDoc(collection(db, 'payments'), {
        studentId: student.id,
        amount: numAmount,
        description: `Tagihan Baru: ${desc}`,
        type: 'tagihan',
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      });

      if (selectedStudentForFinance && selectedStudentForFinance.id === userId) {
        setSelectedStudentForFinance((prev: any) => ({
          ...prev,
          arrears: newArrears,
          arrears_details: newDetails
        }));
      }

      alert('Tagihan berhasil ditambahkan!');
    } catch (error) {
      console.error(error);
      alert('Gagal menambahkan tagihan.');
    }
  };

  const handlePelunasan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudentForPayment || !activeDetailToPay) return;

    try {
      const student = activeStudentForPayment;
      const detailToPay = activeDetailToPay;

      // Logic for Tabungan and Mixed
      if (paymentMethod === 'Tabungan') {
        const currentSavings = student.savings || 0;
        if (currentSavings < detailToPay.amount) {
          alert('Tabungan tidak cukup untuk melakukan pelunasan ini.');
          return;
        }
        
        const newSavings = currentSavings - detailToPay.amount;
        await updateDoc(doc(db, 'users', student.id), { savings: newSavings });
      } else if (paymentMethod === 'Campuran') {
        const savingsAmount = Number(mixedSavingsAmount) || 0;
        const cashAmount = Number(mixedCashAmount) || 0;
        
        if (savingsAmount > (student.savings || 0)) {
          alert('Input nominal tabungan melebihi saldo yang ada.');
          return;
        }

        if (savingsAmount + cashAmount < detailToPay.amount) {
          if (!window.confirm('Nominal total kurang dari jumlah tagihan. Tetap proses sebagai pembayaran sebagian?')) {
            return;
          }
        }

        // Deduct from savings
        if (savingsAmount > 0) {
          const newSavings = (student.savings || 0) - savingsAmount;
          await updateDoc(doc(db, 'users', student.id), { savings: newSavings });
        }
      }

      const totalPaid = paymentMethod === 'Campuran' 
        ? (Number(mixedSavingsAmount) || 0) + (Number(mixedCashAmount) || 0)
        : detailToPay.amount;

      let newArrears = student.arrears || 0;
      let newDetails = student.arrears_details || [];

      if (totalPaid >= detailToPay.amount) {
        // Fully paid
        newDetails = newDetails.filter((d: any) => d.id !== detailToPay.id);
        newArrears = Math.max(0, (student.arrears || 0) - detailToPay.amount);
      } else {
        // Partially paid
        newDetails = newDetails.map((d: any) => {
          if (d.id === detailToPay.id) {
            return { ...d, amount: d.amount - totalPaid };
          }
          return d;
        });
        newArrears = Math.max(0, (student.arrears || 0) - totalPaid);
      }
      
      await updateDoc(doc(db, 'users', student.id), {
        arrears: newArrears,
        arrears_details: newDetails
      });

      // Log to payments history
      await addDoc(collection(db, 'payments'), {
        studentId: student.id,
        amount: totalPaid,
        description: `Pelunasan: ${detailToPay.name}${paymentMethod === 'Campuran' ? ` (Campuran: Tabungan Rp ${Number(mixedSavingsAmount).toLocaleString()} & Tunai/Transfer Rp ${Number(mixedCashAmount).toLocaleString()})` : ''}${paymentNote ? ` - ${paymentNote}` : ''}`,
        type: 'iuran',
        method: paymentMethod,
        proof: paymentProof || null,
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        mixedDetails: paymentMethod === 'Campuran' ? {
          fromSavings: Number(mixedSavingsAmount) || 0,
          fromCash: Number(mixedCashAmount) || 0
        } : null
      });
      
      if (selectedStudentForFinance && selectedStudentForFinance.id === student.id) {
        const updatedStudent = {
          ...student,
          arrears: newArrears,
          arrears_details: newDetails,
          savings: paymentMethod === 'Tabungan' 
            ? (student.savings || 0) - detailToPay.amount 
            : paymentMethod === 'Campuran'
              ? (student.savings || 0) - (Number(mixedSavingsAmount) || 0)
              : student.savings
        };
        setSelectedStudentForFinance(updatedStudent);
        setAllUsers(prev => prev.map(u => u.id === student.id ? updatedStudent : u));
      }
      
      alert(totalPaid >= detailToPay.amount ? 'Pelunasan berhasil dicatat!' : 'Pembayaran sebagian berhasil dicatat!');
      setShowPayConfirmModal(false);
      setPaymentNote('');
      setPaymentMethod('Tunai');
      setPaymentProof('');
      setMixedSavingsAmount('');
      setMixedCashAmount('');
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
      const selectedCategory = iuranCategories.find(c => c.id === selectedCategoryId);
      
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

      if (targetStudents.length === 0) {
        alert('Tidak ada siswa yang terpilih sebagai target tagihan.');
        return;
      }

      const categoryName = selectedCategory?.name || 'Umum';

      const newArrearDetail = {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        name: financeIuranName,
        category: categoryName,
        categoryId: selectedCategoryId || null,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        dueDate: financeDueDate || null
      };

      for (const student of targetStudents) {
        const currentDetails = student.arrears_details || [];
        const newArrears = (student.arrears || 0) + amount;
        
        await updateDoc(doc(db, 'users', student.id), { 
          arrears: newArrears,
          arrears_details: [...currentDetails, newArrearDetail]
        });

        // Log to payments history (Notification of new charge)
        await addDoc(collection(db, 'payments'), {
          studentId: student.id,
          amount: amount,
          description: `Tagihan Baru [${categoryName}]: ${financeIuranName}`,
          type: 'tagihan',
          iuranCategory: categoryName,
          date: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        });
      }

      setShowIuranModal(false);
      setFinanceIuranName('');
      setFinanceAmount('');
      setFinanceIuranTarget('all');
      setFinanceDueDate('');
      setSelectedCategoryId('');
      alert(`Iuran ${categoryName} berhasil ditetapkan untuk ${targetStudents.length} siswa!`);
    } catch (error) {
      alert('Gagal menetapkan iuran.');
      console.error(error);
    }
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examType || !examYear) return;
    try {
      await addDoc(collection(db, 'exams'), {
        type: examType,
        academicYear: examYear,
        createdAt: serverTimestamp(),
        schedules: []
      });
      setShowExamModal(false);
      setExamType('PTS Ganjil');
      alert('Jadwal Ujian berhasil dibuat!');
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'exams');
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus ujian ini?")) return;
    try {
      await deleteDoc(doc(db, 'exams', examId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `exams/${examId}`);
    }
  };

  const handleAddExamSchedule = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!activeExamId || !scheduleDate || !scheduleTime || !scheduleSubject) return;
     try {
       const exam = exams.find(ex => ex.id === activeExamId);
       if (!exam) return;
       const newSchedule = {
         id: Date.now().toString(),
         date: scheduleDate,
         time: scheduleTime,
         subject: scheduleSubject,
         kelas: scheduleClass
       };
       const updatedSchedules = [...(exam.schedules || []), newSchedule];
       await updateDoc(doc(db, 'exams', activeExamId), {
         schedules: updatedSchedules
       });
       setScheduleDate('');
       setScheduleTime('');
       setScheduleSubject('');
       setShowExamScheduleModal(false);
       alert('Jadwal berhasil ditambahkan!');
     } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `exams/${activeExamId}`);
     }
  };

  const handleDeleteExamSchedule = async (examId: string, scheduleId: string) => {
      if (!window.confirm("Hapus jadwal ini?")) return;
      try {
        const exam = exams.find(ex => ex.id === examId);
        if (!exam) return;
        const updatedSchedules = (exam.schedules || []).filter((s: any) => s.id !== scheduleId);
        await updateDoc(doc(db, 'exams', examId), {
          schedules: updatedSchedules
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `exams/${examId}`);
      }
  };

  const handleApprovePayment = async (pay: any) => {
    if (!window.confirm(`Verifikasi pembayaran ${pay.method} ini? Tindakan ini akan mengupdate status menjadi lunas dan mengurangi tunggakan siswa.`)) return;
    try {
      const studentId = pay.studentId;
      const amountPaid = pay.amount;
      const arrearDetailId = pay.arrearDetailId;
      const payId = pay.id;
      
      const student = allUsers.find(u => u.id === studentId);
      if (student) {
        const updates: any = {};
        
        // Handle Arrears (Full or Partial)
        if (arrearDetailId) {
          const currentArrears = student.arrears || 0;
          const currentDetails = student.arrears_details || [];
          const targetDetail = currentDetails.find((d: any) => d.id === arrearDetailId);
          
          if (targetDetail) {
            if (amountPaid >= targetDetail.amount) {
              // Full payment
              updates.arrears = Math.max(0, currentArrears - targetDetail.amount);
              updates.arrears_details = currentDetails.filter((d: any) => d.id !== arrearDetailId);
            } else {
              // Partial payment
              updates.arrears = Math.max(0, currentArrears - amountPaid);
              updates.arrears_details = currentDetails.map((d: any) => {
                if (d.id === arrearDetailId) {
                  return { ...d, amount: d.amount - amountPaid };
                }
                return d;
              });
            }
          }
        }

        // Handle Savings deduction
        if (pay.method === 'Tabungan') {
          const currentSavings = student.savings || 0;
          if (currentSavings < amountPaid) {
            alert('Saldo tabungan siswa tidak mencukupi saat divalidasi. Validasi dibatalkan.');
            return;
          }
          updates.savings = currentSavings - amountPaid;
        } else if (pay.method === 'Campuran' && pay.mixedDetails) {
          const currentSavings = student.savings || 0;
          const fromSavings = pay.mixedDetails.fromSavings || 0;
          
          if (currentSavings < fromSavings) {
            alert('Saldo tabungan siswa tidak mencukupi untuk porsi tabungan pada pembayaran campuran ini. Validasi dibatalkan.');
            return;
          }
          updates.savings = currentSavings - fromSavings;
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

  const handleDeletePayment = async (pay: any) => {
    if (!window.confirm('Hapus riwayat transaksi ini secara permanen? Perhatian: Menghapus riwayat tabungan akan otomatis mengupdate total saldo.')) return;
    try {
      if (pay.type === 'tabungan' || pay.type === 'tabungan_keluar') {
        const student = allUsers.find(u => u.id === pay.studentId);
        if (student) {
          let newSavings = student.savings || 0;
          if (pay.type === 'tabungan') {
            newSavings -= pay.amount; // Removing an "add" reverses the addition
          } else if (pay.type === 'tabungan_keluar') {
            newSavings += pay.amount; // Removing a "tarik" reverses the deduction
          }
          
          await updateDoc(doc(db, 'users', pay.studentId), {
            savings: newSavings
          });
          
          if (selectedStudentForFinance?.id === pay.studentId) {
            setSelectedStudentForFinance((prev: any) => ({
              ...prev,
              savings: newSavings
            }));
          }
        }
      }
    
      await deleteDoc(doc(db, 'payments', pay.id));
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
    // 1. Ringkasan & Tabungan
    const students = filteredUsersForFinance.filter((u: any) => {
      const matchBase = u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif';
      const matchKelas = !filterKelas || (u.kelas || '').toLowerCase() === filterKelas.toLowerCase();
      const matchName = !searchFinanceList || u.name.toLowerCase().includes(searchFinanceList.toLowerCase());
      const displayArrears = isFinanceFiltered ? (u.viewArrears || 0) : (u.arrears || 0);
      const matchStatus = filterKeuanganStatus === 'semua' ? true : (filterKeuanganStatus === 'menunggak' ? (displayArrears > 0) : (displayArrears === 0));
      return matchBase && matchKelas && matchName && matchStatus;
    });

    const summaryData = students.map((s: any) => ({
      "Nama Siswa": s.name,
      "Kelas": s.kelas || '',
      "Status": s.status || 'Aktif',
      "Total Tabungan (Rp)": isFinanceFiltered ? (s.viewSavings || 0) : (s.savings || 0),
      "Total Tunggakan (Rp)": isFinanceFiltered ? (s.viewArrears || 0) : (s.arrears || 0)
    }));

    // 2. Riwayat Pembayaran & Transaksi (Filtered to match view)
    const transactionsData = payments
      .filter(p => {
        if (!isFinanceFiltered) return true;
        let match = true;
        if (filterFinanceCategory) {
          const pCat = p.iuranCategory || 'Umum';
          if (p.type === 'tagihan' && pCat !== filterFinanceCategory) match = false;
        }
        if (filterFinanceStartDate && p.date < filterFinanceStartDate) match = false;
        if (filterFinanceEndDate && p.date > filterFinanceEndDate) match = false;
        return match;
      })
      .map((pay: any) => {
        const student = allUsers.find(u => u.id === pay.studentId);
      let dateText = '-';
      if (pay.createdAt) {
        try {
          const dateObj = pay.createdAt.toDate ? pay.createdAt.toDate() : new Date(pay.createdAt);
          dateText = dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' WIB';
        } catch (e) {
          dateText = String(pay.createdAt);
        }
      }
      return {
        "Waktu Transaksi": dateText,
        "Nama Siswa": student?.name || 'Siswa tidak ditemukan',
        "Kelas": student?.kelas || '-',
        "Kategori": pay.iuranCategory || 'Umum',
        "Keterangan / Item": pay.description || (pay.type === 'tabungan' ? 'Setor Tabungan' : pay.type === 'tabungan_keluar' ? 'Tarik Tabungan' : 'Pembayaran'),
        "Nominal (Rp)": pay.amount || 0,
        "Metode Pembayaran": pay.method || (pay.type === 'tabungan' || pay.type === 'tabungan_keluar' ? 'Tabungan (Tunai)' : '-'),
        "Status Transaksi": pay.status === 'lunas' ? 'LUNAS / BERHASIL' : pay.status === 'pending' ? 'MENUNGGU VALIDASI' : pay.status === 'ditolak' ? 'DITOLAK' : (pay.status || 'SUCCESS'),
        "Catatan Tambahan": pay.meetDate ? `Janji Tunai: ${pay.meetDate}` : (pay.proofStr ? 'Bukti Transfer Terlampir (Online)' : '')
      };
    });

    // 3. Detail Tunggakan Siswa
    const arrearsListData: any[] = [];
    students.forEach((s: any) => {
      if (s.arrears_details && s.arrears_details.length > 0) {
        s.arrears_details.forEach((detail: any) => {
          let match = true;
          if (isFinanceFiltered) {
            if (filterFinanceIuranName && !detail.name.toLowerCase().includes(filterFinanceIuranName.toLowerCase())) match = false;
            if (filterFinanceCategory) {
              const catName = detail.category || 'Umum';
              if (catName !== filterFinanceCategory) match = false;
            }
            if (filterFinanceStartDate && detail.date < filterFinanceStartDate) match = false;
            if (filterFinanceEndDate && detail.date > filterFinanceEndDate) match = false;
          }
          if (match) {
            arrearsListData.push({
              "Nama Siswa": s.name,
              "Kelas": s.kelas || '',
              "Kategori": detail.category || 'Umum',
              "Tanggal Tagihan": detail.date || '',
              "Nama Tagihan / Iuran": detail.name || '',
              "Nominal Tagihan (Rp)": detail.amount || 0
            });
          }
        });
      }
    });

    // Generate Sheet
    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const wsTransactions = XLSX.utils.json_to_sheet(transactionsData);
    const wsArrears = XLSX.utils.json_to_sheet(arrearsListData);

    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan & Tabungan");
    XLSX.utils.book_append_sheet(wb, wsTransactions, "Riwayat Transaksi");
    XLSX.utils.book_append_sheet(wb, wsArrears, "Detail Tunggakan Spesifik");

    // Auto-fit Column Widths for a clean look
    [wsSummary, wsTransactions, wsArrears].forEach(ws => {
      if (ws['!ref']) {
        const range = XLSX.utils.decode_range(ws['!ref']);
        const colWidths = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          let maxWidth = 12; // base min width
          for (let R = range.s.r; R <= range.e.r; ++R) {
            const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
            if (cell && cell.v) {
              const len = String(cell.v).length;
              if (len > maxWidth) maxWidth = len;
            }
          }
          colWidths.push({ wch: maxWidth + 3 });
        }
        ws['!cols'] = colWidths;
      }
    });

    XLSX.writeFile(wb, `Rekap_Keuangan_Konsolidasi_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportRincianTunggakanToExcel = () => {
    const students = filteredUsersForFinance.filter((u: any) => {
      const matchBase = u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif';
      const matchKelas = !filterKelas || (u.kelas || '').toLowerCase() === filterKelas.toLowerCase();
      const matchName = !searchFinanceList || u.name.toLowerCase().includes(searchFinanceList.toLowerCase());
      const displayArrears = isFinanceFiltered ? (u.viewArrears || 0) : (u.arrears || 0);
      const matchStatus = filterKeuanganStatus === 'semua' ? true : (filterKeuanganStatus === 'menunggak' ? (displayArrears > 0) : (displayArrears === 0));
      return matchBase && matchKelas && matchName && matchStatus;
    });
    
    const data: any[] = [];
    students.forEach((s: any) => {
      if (s.arrears_details && s.arrears_details.length > 0) {
        s.arrears_details.forEach((detail: any) => {
          let match = true;
          if (isFinanceFiltered) {
            if (filterFinanceIuranName && !detail.name.toLowerCase().includes(filterFinanceIuranName.toLowerCase())) match = false;
            if (filterFinanceStartDate && detail.date < filterFinanceStartDate) match = false;
            if (filterFinanceEndDate && detail.date > filterFinanceEndDate) match = false;
          }
          if (match) {
            data.push({
              Nama_Siswa: s.name,
              Kelas: s.kelas || '',
              Tgl_Tagihan: detail.date || '',
              Nama_Tagihan: detail.name || '',
              Nominal: detail.amount || 0
            });
          }
        });
      }
    });

    if (data.length === 0) {
      alert("Tidak ada rincian tunggakan untuk filter yang dipilih.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rincian Tunggakan");
    XLSX.writeFile(wb, `Rincian_Tunggakan_Siswa_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  const handleChangePasswordProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordProfile !== confirmPassword) {
      alert("Password baru dan konfirmasi password tidak cocok!");
      return;
    }
    if (newPasswordProfile.length < 6) {
      alert("Password minimal 6 karakter!");
      return;
    }
    
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPasswordProfile);
        alert("Password berhasil diubah!");
        setNewPasswordProfile("");
        setConfirmPasswordProfile("");
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        alert("Untuk alasan keamanan, Anda harus login ulang sebelum mengubah password.");
      } else {
        alert("Gagal mengubah password: " + error.message);
      }
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
      .filter(p => p.evaluationPeriod === printRapotPeriod)
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
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
               <strong style="display:block;">${p.category}</strong>
               ${periodBadge}
             </div>
             ${p.title && p.title.trim() !== '' ? `<small style="color: #666;">${p.title}</small>` : ''}
           </td>
           <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${scoreNum}</td>
           <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;"><strong>${gradeInfo.grade}</strong> <br><small>${gradeInfo.text}</small></td>
         </tr>
       `;
    });

    if (studentProgressList.length === 0) {
      itemsHtml = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #666; font-style: italic;">Belum ada data evaluasi belajar.</td></tr>`;
    }

    let reportTitle = `Rapot ${printRapotPeriod} - ${student.name}`;

    const html = `
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            ${getPrintStyles()}
          </style>
        </head>
        <body>
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
      <script>window.onload = function() { setTimeout(function(){ window.print(); window.close(); }, 500); }</script>
    `;
    
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
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
        <BarChart size={20} className={activeTab === 'overview' ? 'text-white' : 'text-gray-500'} /> Dashboard
      </button>
      <button 
        onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'users' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <Users size={20} className={activeTab === 'users' ? 'text-white' : 'text-gray-500'} /> User Management
      </button>
      <button 
        onClick={() => { setActiveTab('academic'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'academic' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <BookOpen size={20} className={activeTab === 'academic' ? 'text-white' : 'text-gray-500'} /> Akademik & Rapot
      </button>
      <button 
        onClick={() => { setActiveTab('finance'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'finance' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <CreditCard size={20} className={activeTab === 'finance' ? 'text-white' : 'text-gray-500'} /> Administrasi
      </button>
      <button 
        onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'attendance' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <CheckCircle size={20} className={activeTab === 'attendance' ? 'text-white' : 'text-gray-500'} /> Absensi
      </button>
      <button 
        onClick={() => { setActiveTab('achievements'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'achievements' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <Trophy size={20} className={activeTab === 'achievements' ? 'text-white' : 'text-gray-500'} /> Siswa Berprestasi
      </button>
      <button 
        onClick={() => { setActiveTab('announcements'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'announcements' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <Megaphone size={20} className={activeTab === 'announcements' ? 'text-white' : 'text-gray-500'} /> Pengumuman
      </button>
      <button 
        onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'profile' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <User size={20} className={activeTab === 'profile' ? 'text-white' : 'text-gray-500'} /> Profil Admin
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row pb-20 md:pb-0">
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
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">RA Darusyifa Arjawinangun</p>
          </div>
        </div>
        <NavItems />
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-xl border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] flex justify-around items-center px-4 py-2 z-50 pb-safe" style={{ WebkitBackdropFilter: 'blur(24px)' }}>
        <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${activeTab === 'overview' ? 'text-blue-600' : 'text-gray-500'}`}>
          <div className={`p-2 rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-blue-100 scale-110 shadow-sm' : ''}`}>
            <BarChart size={24} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
        </button>
        <button onClick={() => { setActiveTab('profile') }} className="flex flex-col items-center gap-1 flex-1 text-gray-500">
           <div className="w-14 h-14 bg-blue-600 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-200 -mt-8 border-4 border-white">
            <User size={28} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter mt-1">Profil</span>
        </button>
        <button onClick={async () => { await auth.signOut(); navigate('/login'); }} className="flex flex-col items-center gap-1 transition-all flex-1 text-gray-500">
          <div className="p-2 rounded-2xl transition-all hover:bg-red-50 hover:text-red-600">
            <LogOut size={24} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pt-6 md:pt-8 scrolling-touch">
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

        {activeTab === 'overview' && (
          <div className="space-y-6 pb-24 md:pb-0 animate-in fade-in duration-500">
            {/* Mobile Header (Hidden on Desktop) */}
            <div className="md:hidden -mx-4 -mt-8 mb-6 bg-blue-600 bg-gradient-to-br from-blue-500 to-blue-600 p-8 pt-10 rounded-b-[40px] text-white relative shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="flex justify-between items-center mb-6 relative z-10 pt-4">
                <div className="text-center flex-1 ml-10">
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
                  className="bg-white/25 p-2.5 rounded-2xl backdrop-blur-md border border-white/40 shadow-lg relative active:scale-95 transition-all text-white"
                  style={{ WebkitBackdropFilter: 'blur(8px)' }}
                >
                  <Bell size={20} />
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full scale-in shadow-sm"></span>
                </button>
              </div>
              
              <div className="flex items-center gap-5 bg-white/10 p-6 rounded-[3rem] backdrop-blur-md border border-white/40 relative z-10 shadow-xl overflow-hidden" style={{ WebkitBackdropFilter: 'blur(12px)' }}>
                <div className="w-20 h-20 rounded-full border-4 border-white/50 overflow-hidden bg-white/98 flex items-center justify-center shadow-xl shrink-0">
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
                    <p className="text-[8px] text-blue-900 font-black uppercase tracking-wider">Administrator</p>
                  </div>
                  <h2 className="text-xl font-black tracking-tight leading-tight text-white mb-1">
                    {userData?.name || 'Administrator'}
                  </h2>
                  <div className="flex flex-col mt-1">
                    <p className="text-[10px] opacity-90 font-black text-yellow-300 leading-tight uppercase tracking-tighter">
                      Admin Utama
                    </p>
                    <p className="text-[9px] mt-0.5 opacity-80 font-bold text-white leading-tight uppercase tracking-widest">
                      {settings?.schoolName || 'RA Darusyifa Arjawinangun'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Header */}
            <header className="hidden md:flex justify-between items-center mb-8 pt-2">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 leading-tight tracking-tight underline decoration-blue-500 decoration-4 underline-offset-8 uppercase italic">Beranda</h2>
                <p className="text-gray-500 text-sm font-medium mt-4">Monitoring operasional sekolah secara real-time.</p>
              </div>
              <div className="flex items-center gap-4">
                 <button onClick={() => setActiveTab('announcements')} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-400 hover:text-blue-600 transition-all relative">
                  <Bell size={24} />
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                </button>
                <div className="bg-white p-2 pr-6 rounded-full border border-gray-100 shadow-sm flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                    {userData?.name?.[0] || 'A'}
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-800 leading-tight">{userData?.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Administrator</p>
                  </div>
                </div>
              </div>
            </header>

            {/* Stats Cards Section */}
            <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: 'Jumlah Siswa', value: allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif').length, detail: `♂: ${allUsers.filter(u => u.role === 'siswa' && (u.jenisKelamin === 'Laki-laki')).length} | ♀: ${allUsers.filter(u => u.role === 'siswa' && (u.jenisKelamin === 'Perempuan')).length}`, color: 'bg-indigo-600 bg-gradient-to-br from-purple-500 to-indigo-600', icon: Users },
                { label: 'Jumlah Kelas', value: schoolClasses.length, detail: 'Aktif Tahun Ini', color: 'bg-teal-500 bg-gradient-to-br from-emerald-400 to-teal-500', icon: BookOpen },
                { label: 'Total Tabungan', value: `Rp ${displayTotalTabungan.toLocaleString('id-ID')}`, detail: isFinanceFiltered ? 'Berdasarkan Filter' : 'Saldo Sekolah', color: 'bg-orange-500 bg-gradient-to-br from-amber-400 to-orange-500', icon: CreditCard },
                { label: 'Total Tunggakan', value: `Rp ${displayTotalTunggakan.toLocaleString('id-ID')}`, detail: isFinanceFiltered ? 'Berdasarkan Filter' : 'Tagihan Berjalan', color: 'bg-pink-600 bg-gradient-to-br from-rose-500 to-pink-600', icon: AlertCircle }
              ].map((stat, i) => (
                <div key={i} className={`relative overflow-hidden ${stat.color} p-5 md:p-6 rounded-[32px] text-white shadow-xl shadow-black/10 group hover:scale-[1.02] transition-all flex flex-col justify-between h-52 sm:h-48 md:h-44`}>
                  <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform rotate-12">
                    <stat.icon size={100} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-80 mb-1">{stat.label}</p>
                    <h4 className={`font-black tracking-tighter leading-none break-all ${String(stat.value).length > 15 ? 'text-lg' : String(stat.value).length > 12 ? 'text-xl' : String(stat.value).length > 8 ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>
                      {stat.value}
                    </h4>
                  </div>
                  <div className="relative z-10 inline-flex items-center self-start px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black tracking-wide uppercase mt-2" style={{ WebkitBackdropFilter: 'blur(8px)' }}>
                    {stat.detail}
                  </div>
                </div>
              ))}
            </div>

            {/* Menu Utama Section */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                  <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Menu Utama</h3>
                </div>
                {payments.filter(p => p.status === 'pending').length > 0 && (
                  <button 
                    onClick={() => setActiveTab('finance')}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl animate-pulse cursor-pointer hover:bg-amber-100 transition-all"
                  >
                    <AlertCircle size={14} className="animate-bounce" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Ada {payments.filter(p => p.status === 'pending').length} Pembayaran Perlu Validasi</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-10">
                {[
                  { id: 'academic', label: 'Kelas', icon: BookOpen, color: 'bg-orange-500 bg-gradient-to-br from-orange-400 to-orange-500', action: () => setActiveTab('academic') },
                  { id: 'users', label: 'Siswa', icon: Users, color: 'bg-purple-500 bg-gradient-to-br from-purple-400 to-purple-500', action: () => { setActiveTab('users'); setFilterUserRole('siswa'); } },
                  { id: 'attendance', label: 'Absensi', icon: CheckCircle, color: 'bg-emerald-500 bg-gradient-to-br from-emerald-400 to-emerald-500', action: () => setActiveTab('attendance') },
                  { id: 'kaldik', label: 'Kaldik', icon: Calendar, color: 'bg-pink-500 bg-gradient-to-br from-pink-400 to-pink-500', action: () => setActiveTab('kaldik') },
                  { id: 'materials', label: 'Materi', icon: BookOpen, color: 'bg-blue-500 bg-gradient-to-br from-blue-400 to-blue-500', action: () => setActiveTab('materials') },
                  { id: 'achievements', label: 'Prestasi', icon: Trophy, color: 'bg-yellow-500 bg-gradient-to-br from-yellow-400 to-yellow-500', action: () => setActiveTab('achievements') },
                  { id: 'assessments', label: 'Penilaian', icon: TrendingUp, color: 'bg-indigo-500 bg-gradient-to-br from-indigo-400 to-indigo-500', action: () => setActiveTab('assessments') },
                  { id: 'exams', label: 'Ujian', icon: Edit, color: 'bg-rose-500 bg-gradient-to-br from-rose-400 to-rose-500', action: () => setActiveTab('exams') },
                  { id: 'users', label: 'Guru', icon: Shield, color: 'bg-teal-500 bg-gradient-to-br from-teal-400 to-teal-500', action: () => { setActiveTab('users'); setFilterUserRole('guru'); } },
                  { id: 'finance', label: 'Administrasi', icon: CreditCard, color: 'bg-amber-500 bg-gradient-to-br from-amber-400 to-amber-500', action: () => setActiveTab('finance') },
                  { id: 'announcements', label: 'Info', icon: Megaphone, color: 'bg-blue-600 bg-gradient-to-br from-blue-500 to-blue-600', action: () => setActiveTab('announcements') },
                  { id: 'settings', label: 'Settings', icon: Settings, color: 'bg-slate-500 bg-gradient-to-br from-slate-400 to-slate-500', action: () => setActiveTab('settings') },
                ].map((item, idx) => (
                  <button 
                    key={idx} 
                    onClick={item.action}
                    className="group flex flex-col items-center gap-3 transition-all"
                  >
                    <div className={`w-16 h-16 md:w-20 md:h-20 ${item.color} rounded-[28px] shadow-lg flex items-center justify-center text-white transition-all overflow-hidden group-active:scale-95 group-hover:scale-110`}>
                      <item.icon size={28} className="md:w-10 md:h-10" />
                    </div>
                    <span className="text-[11px] md:text-sm font-black text-gray-700 tracking-tight text-center">{item.label}</span>
                  </button>
                ))}
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
                  value={filterUserRole}
                  onChange={(e) => setFilterUserRole(e.target.value as any)}
                  className="w-full sm:w-auto p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-600"
                >
                  <option value="semua">Semua Role</option>
                  <option value="admin">Admin</option>
                  <option value="guru">Guru</option>
                  <option value="siswa">Siswa</option>
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
                <select 
                  value={filterTeacherType}
                  onChange={(e) => setFilterTeacherType(e.target.value)}
                  className="w-full sm:w-auto p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-600"
                >
                  <option value="semua">Semua Tipe Guru</option>
                  <option value="Wali Kelas">Wali Kelas</option>
                  <option value="Guru Kelas">Guru Kelas</option>
                  <option value="Guru Bidang">Guru Bidang</option>
                </select>
                <button 
                  onClick={() => { setNewUserRole(filterUserRole === 'guru' ? 'guru' : 'siswa'); setShowAddUser(true); }}
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
                     <th className="px-6 py-4">Nama Lengkap</th>
                     <th className="px-6 py-4">Username & Password</th>
                     <th className="px-6 py-4">Keterangan</th>
                     <th className="px-6 py-4">Tipe / Role</th>
                     <th className="px-6 py-4">Status / Jabatan</th>
                     <th className="px-6 py-4 text-right">Aksi</th>
                   </tr>
                 </thead>
                <tbody className="divide-y divide-gray-100">
                  {allUsers.filter(u => {
                    const matchRole = filterUserRole === 'semua' || u.role === filterUserRole;
                    const matchKelas = !filterKelas || (u.kelas || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(filterKelas.toLowerCase().replace(/[^a-z0-9]/g, '')) || (u.assignedClass || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(filterKelas.toLowerCase().replace(/[^a-z0-9]/g, ''));
                    const matchName = !filterName || u.name.toLowerCase().includes(filterName.toLowerCase());
                    const matchTeacherType = filterTeacherType === 'semua' || u.teacherType === filterTeacherType;
                    return matchRole && matchKelas && matchName && matchTeacherType;
                  }).map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{u.name}</div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{u.role === 'admin' ? 'Administrator' : u.role === 'guru' ? 'Tenaga Pengajar' : 'Peserta Didik'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-700">{u.email}</div>
                        <div className="text-[10px] text-gray-400 border border-gray-100 w-fit px-1.5 rounded bg-gray-50 mt-1">PW: {u.plainPassword || '***'}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {u.role === 'siswa' ? (u.kelas || '-') : (u.assignedClass || 'Umum')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          u.role === 'admin' ? 'bg-red-50 text-red-600 border border-red-100' :
                          u.role === 'guru' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          'bg-green-50 text-green-600 border border-green-100'
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
                        ) : u.role === 'guru' ? (
                           <div className="flex flex-col gap-0.5">
                             <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase border border-indigo-100 w-fit">
                               {u.teacherType || 'Guru Kelas'}
                             </span>
                             {u.assignedClass && <span className="text-[10px] text-gray-400 font-medium ml-1">Unit: {u.assignedClass}</span>}
                           </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => { setUserToReset(u); setShowResetPassword(true); }} className="p-2 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-100 transition-all" title="Reset Password"><Key size={16} /></button>
                          <button onClick={() => { setEditingUser(u); setShowEditUser(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"><Edit size={16} /></button>
                          <button onClick={() => { setUserToDelete(u); setShowDeleteConfirm(true); }} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"><Trash2 size={16} /></button>
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
                const matchRole = filterUserRole === 'semua' || u.role === filterUserRole;
                const matchKelas = filterKelas ? (u.kelas || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(filterKelas.toLowerCase().replace(/[^a-z0-9]/g, '')) || (u.assignedClass || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(filterKelas.toLowerCase().replace(/[^a-z0-9]/g, '')) : true;
                const matchName = filterName ? u.name.toLowerCase().includes(filterName.toLowerCase()) : true;
                const matchTeacherType = filterTeacherType === 'semua' || u.teacherType === filterTeacherType;
                return matchRole && matchKelas && matchName && matchTeacherType;
              }).map((u) => (
                <div key={u.id} className="p-4 hover:bg-gray-50 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-800">{u.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">{u.email}</p>
                      {u.role === 'guru' && (
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">{u.teacherType} - {u.assignedClass || 'Umum'}</p>
                      )}
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
                      {u.role === 'siswa' ? `KL: ${u.kelas || '-'} | ` : `ASS: ${u.assignedClass || '-'} | `}PW: <span className="text-gray-800">{u.plainPassword || '***'}</span>
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
                    {allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === filterSiswaStatus && (!filterKelas || (u.kelas || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(filterKelas.toLowerCase().replace(/[^a-z0-9]/g, ''))) && (!filterName || u.name.toLowerCase().includes(filterName.toLowerCase()))).map(student => (
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

              <div className="md:hidden divide-y divide-gray-100">
                {allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === filterSiswaStatus && (!filterKelas || (u.kelas || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(filterKelas.toLowerCase().replace(/[^a-z0-9]/g, ''))) && (!filterName || u.name.toLowerCase().includes(filterName.toLowerCase()))).map(student => (
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

        {activeTab === 'exams' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="card-3d p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                    <Edit size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight">Manajemen Ujian</h3>
                </div>
                <p className="text-gray-400 text-sm font-medium">Atur jadwal ujian seperti PTS, PAS untuk siswa dan guru.</p>
              </div>
              <button 
                onClick={() => setShowExamModal(true)}
                className="bg-rose-600 text-white px-5 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-200 transition-all text-sm w-full md:w-auto"
              >
                <Plus size={18} /> Tambah Ujian
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {exams.map(exam => (
                <div key={exam.id} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-[100px] z-0 opacity-50 group-hover:bg-rose-100 transition-colors"></div>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">{exam.academicYear}</span>
                        <h4 className="text-xl font-bold text-gray-800">{exam.type}</h4>
                      </div>
                      <p className="text-gray-500 text-sm font-medium mb-4 flex items-center gap-2">
                        <Calendar size={14} /> {(exam.schedules || []).length} Jadwal Mata Pelajaran
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => {
                            setActiveExamId(exam.id);
                            setShowExamScheduleModal(true);
                          }}
                          className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-2"
                        >
                          <Plus size={14} /> Tambah Jadwal
                        </button>
                        <button 
                          onClick={() => handleDeleteExam(exam.id)}
                          className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Hapus Ujian
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50/50 rounded-3xl p-6 flex-1 border border-gray-100">
                      <h5 className="font-black text-gray-700 text-xs uppercase tracking-wider mb-4">Daftar Jadwal Mata Pelajaran</h5>
                      {(exam.schedules || []).length === 0 ? (
                        <p className="text-xs text-gray-400 italic font-medium py-4">Belum ada jadwal yang ditambahkan.</p>
                      ) : (
                        <div className="space-y-3">
                          {(exam.schedules || []).map((s: any) => (
                            <div key={s.id} className="group relative bg-white p-4 rounded-2xl border border-gray-100 hover:border-rose-100 hover:shadow-md hover:shadow-rose-50/10 transition-all flex items-center justify-between gap-4 pl-6 overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-2xl"></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <p className="text-sm font-black text-gray-800 truncate">{s.subject}</p>
                                  <span className="bg-rose-50 text-rose-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg">
                                    {s.kelas}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                                  <span className="flex items-center gap-1.5 font-bold text-gray-600">
                                    <Calendar size={12} className="text-rose-500" />
                                    {new Date(s.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                  <span className="flex items-center gap-1.5 font-bold text-rose-600">
                                    <Clock size={12} />
                                    {s.time}
                                  </span>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleDeleteExamSchedule(exam.id, s.id)} 
                                className="text-gray-400 hover:text-red-600 p-2 rounded-xl bg-gray-50 hover:bg-red-50 transition-all"
                                title="Hapus Jadwal"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {exams.length === 0 && (
                <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 border-dashed">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Edit size={24} />
                  </div>
                  <h4 className="text-gray-600 font-bold mb-2">Belum ada Jadwal Ujian</h4>
                  <p className="text-gray-400 text-sm">Tambahkan ujian baru seperti PTS atau PAS.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="card-3d p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                    <Trophy size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight">Siswa Berprestasi</h3>
                </div>
                <p className="text-gray-400 text-sm font-medium">Monitoring capaian terbaik siswa untuk acuan beasiswa & apresiasi.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex-1 md:flex-none relative">
                  <input 
                    type="text" 
                    placeholder="Cari nama siswa..." 
                    value={filterAchievementSearch}
                    onChange={(e) => setFilterAchievementSearch(e.target.value)}
                    className="w-full md:w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <Users className="absolute left-3 top-2.5 text-gray-400" size={14} />
                </div>
                <select 
                  value={filterAchievementKelas}
                  onChange={(e) => setFilterAchievementKelas(e.target.value)}
                  className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-yellow-500 font-bold text-gray-600"
                >
                  <option value="Semua">Semua Kelas</option>
                  {schoolClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <select 
                  value={filterAchievementCategory}
                  onChange={(e) => setFilterAchievementCategory(e.target.value)}
                  className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-yellow-500 font-bold text-gray-600"
                >
                  <option value="Semua">Semua Kategori</option>
                  <option value="Akademik">Penilaian Rapot</option>
                  <option value="Hafalan">Penilaian Hafalan</option>
                </select>
                <select 
                  value={filterAchievementPeriod}
                  onChange={(e) => setFilterAchievementPeriod(e.target.value)}
                  className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-yellow-500 font-bold text-gray-600"
                >
                  <option value="Semua">Semua Periode</option>
                  <option value="PTS Ganjil">PTS Ganjil</option>
                  <option value="PAS Ganjil">PAS Ganjil</option>
                  <option value="PTS Genap">PTS Genap</option>
                  <option value="PAS Genap">PAS Genap</option>
                </select>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Top Hafalan Section */}
              {(filterAchievementCategory === 'Semua' || filterAchievementCategory === 'Hafalan') && (
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-8 border-b border-gray-50 bg-yellow-50/30 flex items-center justify-between">
                    <h4 className="text-lg font-black text-gray-800 flex items-center gap-2">
                      <Star className="text-yellow-500" size={20} fill="currentColor" /> Ranking Hafalan
                    </h4>
                    <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-yellow-100 shadow-sm">Berdasarkan Total Bintang</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rank</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Siswa</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kelas</th>
                          <th className="px-6 py-4 text-[10px] font-black text-center text-gray-400 uppercase tracking-widest">Tuntas</th>
                          <th className="px-6 py-4 text-[10px] font-black text-right text-gray-400 uppercase tracking-widest">Total Bintang</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {allUsers
                          .filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif')
                          .filter(u => filterAchievementKelas === 'Semua' || (u.kelas || '').toLowerCase() === filterAchievementKelas.toLowerCase())
                          .filter(u => !filterAchievementSearch || u.name.toLowerCase().includes(filterAchievementSearch.toLowerCase()))
                          .map(student => {
                            const studentHafalan = hafalanData.filter(h => h.studentId === student.id && (filterAchievementPeriod === 'Semua' || h.evaluationSemester === filterAchievementPeriod));
                            const totalStars = studentHafalan.reduce((sum, h) => sum + (h.stars || 0), 0);
                            const completedCount = studentHafalan.filter(h => h.status === 'Lulus' || h.status === 'Sudah Setor' || h.status === 'Mumtaz (Lulus)' || h.status === 'Jayyid Jiddan (Lulus)' || h.status === 'Jayyid (Lulus)' || h.status === 'Maqbul (Lulus)').length;
                            return { ...student, totalStars, completedCount };
                          })
                          .sort((a, b) => b.totalStars - a.totalStars)
                          .slice(0, 10)
                          .map((s, idx) => (
                            <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                  idx === 0 ? 'bg-yellow-400 text-white' : 
                                  idx === 1 ? 'bg-gray-300 text-white' : 
                                  idx === 2 ? 'bg-orange-300 text-white' : 
                                  'bg-gray-100 text-gray-400'
                                }`}>
                                  {idx + 1}
                                </div>
                              </td>
                              <td className="px-6 py-4 font-bold text-gray-800 text-sm">{s.name}</td>
                              <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{s.kelas || '-'}</td>
                              <td className="px-6 py-4 text-center">
                                <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-lg text-[10px] font-black">{s.completedCount} Materi</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1 text-yellow-500 font-black">
                                  <span>{s.totalStars}</span>
                                  <Star size={14} fill="currentColor" />
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top Academic Section */}
              {(filterAchievementCategory === 'Semua' || filterAchievementCategory === 'Akademik') && (
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-8 border-b border-gray-50 bg-blue-50/30 flex items-center justify-between">
                    <h4 className="text-lg font-black text-gray-800 flex items-center gap-2">
                      <BookOpen className="text-blue-500" size={20} /> Juara Kelas Rapot
                    </h4>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-blue-100 shadow-sm">Berdasarkan Rata-rata Nilai</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rank</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Siswa</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kelas</th>
                          <th className="px-6 py-4 text-[10px] font-black text-center text-gray-400 uppercase tracking-widest">Mapel Dilalui</th>
                          <th className="px-6 py-4 text-[10px] font-black text-right text-gray-400 uppercase tracking-widest">Rata-rata</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {allUsers
                          .filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif')
                          .filter(u => filterAchievementKelas === 'Semua' || (u.kelas || '').toLowerCase() === filterAchievementKelas.toLowerCase())
                          .filter(u => !filterAchievementSearch || u.name.toLowerCase().includes(filterAchievementSearch.toLowerCase()))
                          .map(student => {
                            const studentProgress = progressData.filter(p => p.studentId === student.id && (p.score !== undefined) && (filterAchievementPeriod === 'Semua' || p.evaluationPeriod === filterAchievementPeriod));
                            const totalScore = studentProgress.reduce((sum, p) => sum + (Number(p.score) || 0), 0);
                            const avgScore = studentProgress.length > 0 ? (totalScore / studentProgress.length) : 0;
                            return { ...student, avgScore, subjectCount: studentProgress.length };
                          })
                          .filter(s => s.subjectCount > 0)
                          .sort((a, b) => b.avgScore - a.avgScore)
                          .slice(0, 10)
                          .map((s, idx) => (
                            <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                  idx === 0 ? 'bg-blue-600 text-white' : 
                                  idx === 1 ? 'bg-blue-400 text-white' : 
                                  idx === 2 ? 'bg-blue-300 text-white' : 
                                  'bg-gray-100 text-gray-400'
                                }`}>
                                  {idx + 1}
                                </div>
                              </td>
                              <td className="px-6 py-4 font-bold text-gray-800 text-sm">{s.name}</td>
                              <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{s.kelas || '-'}</td>
                              <td className="px-6 py-4 text-center">
                                <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-black">{s.subjectCount} Mapel</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className={`font-black text-base ${s.avgScore >= 85 ? 'text-emerald-600' : s.avgScore >= 75 ? 'text-blue-600' : 'text-gray-600'}`}>
                                  {s.avgScore.toFixed(1)}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Insight Beasiswa Card */}
            <div className="bg-emerald-500 bg-gradient-to-r from-emerald-500 to-teal-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 overflow-hidden relative">
              <div className="absolute -right-10 -bottom-10 opacity-20 rotate-12">
                <Trophy size={200} />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="p-6 bg-white/20 backdrop-blur-md rounded-[2rem] border border-white/30 hidden sm:block">
                  <GraduationCap size={64} className="text-white" />
                </div>
                <div>
                  <h4 className="text-2xl font-black mb-2 tracking-tight">Rekomendasi Penerima Beasiswa</h4>
                  <p className="text-emerald-50 mb-6 font-medium max-w-xl">
                    Data di atas dikalkulasi secara otomatis berdasarkan akumulasi nilai akademik dan hafalan (tahfidz) periode berjalan. Gunakan data ini sebagai referensi utama penentuan bantuan beasiswa atau apresiasi siswa teladan.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button className="px-6 py-3 bg-white text-emerald-600 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">
                      Cetak Laporan Prestasi
                    </button>
                    <button className="px-6 py-3 bg-emerald-700/30 backdrop-blur-sm border border-white/30 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700/50 transition-all">
                      Log Beasiswa Terakhir
                    </button>
                  </div>
                </div>
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
                  <thead className="bg-gray-100/50 text-gray-600 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-5 text-gray-600">Subjek</th>
                      <th className="px-8 py-5 text-gray-600">Waktu Presensi</th>
                      <th className="px-8 py-5 text-gray-600">Status</th>
                      <th className="px-8 py-5 text-gray-600">Dokumentasi</th>
                      <th className="px-8 py-5 text-gray-600">Lokasi</th>
                      <th className="px-8 py-5 text-right text-gray-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {attendance
                      .filter(a => {
                        const student = allUsers.find(u => u.id === a.studentId);
                        if (filterRole !== 'semua' && student?.role !== filterRole) return false;
                        if (filterKelas && student?.role === 'siswa') {
                          const uK = (student.kelas || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                          const fK = filterKelas.toLowerCase().replace(/[^a-z0-9]/g, '');
                          if (!uK.includes(fK) && !fK.includes(uK)) return false;
                        }
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

        {activeTab === 'kaldik' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="card-3d p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">Kalender Pendidikan</h3>
                <p className="text-gray-400 text-sm font-medium">Informasi agenda kalender pendidikan RA Darusyifa Arjawinangun.</p>
              </div>
              <button 
                onClick={() => setShowAddKaldik(true)}
                className="w-full sm:w-auto bg-pink-500 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-pink-600 transition-all text-sm shadow-sm"
              >
                <Plus size={18} /> Tambah Agenda Kaldik
              </button>
            </div>
            <div className="grid gap-4">
              {kaldikData.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(item => (
                <div key={item.id} className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-pink-50 rounded-2xl flex flex-col items-center justify-center border border-pink-100 text-pink-500 shrink-0">
                      <span className="text-xs font-bold uppercase">{new Date(item.date).toLocaleString('id-ID', { month: 'short' })}</span>
                      <span className="text-xl font-black">{new Date(item.date).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">{item.title}</h4>
                      <p className="text-gray-500 text-sm">{item.description}</p>
                      <span className={`mt-2 inline-block px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded-lg border ${item.type === 'Libur' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                        {item.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 justify-end">
                    <button onClick={() => { setEditKaldikId(item.id); setNewKaldik(item); setShowAddKaldik(true); }} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteKaldik(item.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {kaldikData.length === 0 && (
                <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-gray-200">
                  <Calendar className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-400 font-medium">Belum ada agenda Kalender Pendidikan.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="card-3d p-8">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">Kumpulan Materi Guru</h3>
              <p className="text-gray-400 text-sm font-medium mt-1">Daftar Mata Pelajaran / Materi yang dimasukkan oleh Tenaga Pengajar.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materialsData.map(mat => {
                const teacher = allUsers.find(u => u.id === mat.teacherId);
                return (
                  <div key={mat.id} className="card-3d p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                       <BookOpen size={64} className="text-blue-500" />
                    </div>
                    <div className="relative z-10">
                      <h4 className="text-xl font-bold text-gray-800 mb-2">{mat.name}</h4>
                      <p className="text-xs text-blue-500 font-bold mb-4 uppercase tracking-widest">{mat.topic || 'Umum'}</p>
                      
                      {mat.tulisanArab && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                           <p className="text-xl font-arab text-gray-800 leading-loose" dir="rtl">{mat.tulisanArab}</p>
                           {mat.terjemahan && <p className="text-[10px] text-gray-500 mt-2 font-medium">"{mat.terjemahan}"</p>}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 mt-4">
                        <img src={teacher?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher?.name || 'G')}&background=random`} alt="Teacher" className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <p className="text-xs font-bold text-gray-800">{teacher?.name || 'Guru Tidak Diketahui'}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{new Date(mat.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('id-ID')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {materialsData.length === 0 && (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center p-12 bg-white rounded-3xl border border-dashed border-gray-200">
                  <BookOpen className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-400 font-medium">Belum ada materi atau mata pelajaran dari guru.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="card-3d p-5 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">Log Penilaian Detail Siswa</h3>
              <p className="text-gray-400 text-[10px] sm:text-sm font-medium mt-1">Laporan harian / progress penilaian yang diberikan oleh guru kepada siswa.</p>
              
              <div className="mt-6 sm:mt-8 flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users size={16} className="text-gray-500" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Cari Nama Siswa / Guru..." 
                    value={filterAssessmentName}
                    onChange={(e) => setFilterAssessmentName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 shadow-sm transition-all"
                  />
                </div>
                <div className="w-full md:w-64">
                  <select 
                    value={filterAssessmentKelas}
                    onChange={(e) => setFilterAssessmentKelas(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 shadow-sm transition-all"
                  >
                    <option value="">Semua Kelas</option>
                    {schoolClasses.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full md:w-64">
                  <select 
                    value={filterAssessmentCategory}
                    onChange={(e) => setFilterAssessmentCategory(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 shadow-sm transition-all"
                  >
                    <option value="Semua">Semua Kategori</option>
                    <option value="Rapot">Penilaian Rapot</option>
                    <option value="Hafalan">Penilaian Hafalan</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {(() => {
                const filteredProgress = (filterAssessmentCategory === 'Semua' || filterAssessmentCategory === 'Rapot')
                  ? progressData.filter(p => {
                      const student = allUsers.find(u => u.id === p.studentId);
                      const matchesName = 
                        student?.name?.toLowerCase().includes(filterAssessmentName.toLowerCase()) || 
                        p.teacherName?.toLowerCase().includes(filterAssessmentName.toLowerCase());
                      const matchesKelas = !filterAssessmentKelas || student?.kelas === filterAssessmentKelas;
                      return matchesName && matchesKelas;
                    })
                  : [];

                const filteredHafalan = (filterAssessmentCategory === 'Semua' || filterAssessmentCategory === 'Hafalan')
                  ? hafalanData.filter(h => {
                      const student = allUsers.find(u => u.id === h.studentId);
                      const matchesName = student?.name?.toLowerCase().includes(filterAssessmentName.toLowerCase());
                      const matchesKelas = !filterAssessmentKelas || student?.kelas === filterAssessmentKelas;
                      return matchesName && matchesKelas;
                    })
                  : [];

                const studentIdsWithRecords = Array.from(new Set([
                  ...filteredProgress.map(p => p.studentId),
                  ...filteredHafalan.map(h => h.studentId)
                ])).filter(Boolean);

                const matchingStudents = allUsers
                  .filter(u => u.role === 'siswa' && studentIdsWithRecords.includes(u.id))
                  .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

                if (matchingStudents.length === 0) {
                  return (
                    <div className="p-12 text-center text-gray-400 font-medium italic bg-white rounded-3xl border border-gray-100">
                      Tidak ada data penilaian siswa yang cocok dengan filter pencarian.
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {matchingStudents.map(student => {
                      const studentProgress = filteredProgress.filter(p => p.studentId === student.id);
                      const studentHafalan = filteredHafalan.filter(h => h.studentId === student.id);
                      const totalAssessments = studentProgress.length + studentHafalan.length;
                      const isExpanded = !!expandedStudentIds[student.id];

                      return (
                        <div key={student.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
                          {/* Header Accordion */}
                          <button
                            onClick={() => {
                              setExpandedStudentIds(prev => ({
                                ...prev,
                                [student.id]: !prev[student.id]
                              }));
                            }}
                            className="w-full text-left p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 font-extrabold text-sm uppercase">
                                {(student.name || 'S').substring(0, 2)}
                              </div>
                              <div>
                                <h4 className="text-base font-black text-gray-800 leading-tight">{student.name}</h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-black uppercase tracking-tight">
                                    Kelas: {student.kelas || '-'}
                                  </span>
                                  <span className="text-[10px] bg-slate-50 text-slate-500 px-2.5 py-0.5 rounded-full font-bold">
                                    {student.nisn ? `NISN: ${student.nisn}` : 'No NISN'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <div className="flex items-center gap-2">
                                {studentProgress.length > 0 && (
                                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-xl font-bold border border-blue-100/50">
                                    {studentProgress.length} Rapot
                                  </span>
                                )}
                                {studentHafalan.length > 0 && (
                                  <span className="text-[10px] bg-yellow-50 text-yellow-600 px-2.5 py-1 rounded-xl font-bold border border-yellow-100/50">
                                    {studentHafalan.length} Hafalan
                                  </span>
                                )}
                              </div>
                              <div className="p-1.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-600">
                                {isExpanded ? <ChevronUp size={18} className="text-indigo-600" /> : <ChevronDown size={18} />}
                              </div>
                            </div>
                          </button>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="border-t border-gray-100 bg-gray-50/20">
                              <div className="overflow-x-auto scrolling-touch custom-scrollbar">
                                <table className="w-full text-left table-fixed min-w-[700px] sm:min-w-[800px]">
                                  <thead className="bg-gray-50 text-gray-500 text-[9px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
                                    <tr>
                                      <th className="px-6 py-4 w-1/5">Kategori / Tanggal</th>
                                      <th className="px-6 py-4 w-1/4 text-indigo-600">Guru/Sistem Penilai</th>
                                      <th className="px-6 py-4 w-2/5">Detail Penilaian</th>
                                      <th className="px-6 py-4 w-1/5 text-center">Hasil & Skor</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 bg-white">
                                    {/* Render Rapot Progress first */}
                                    {studentProgress.map(p => {
                                      const teacher = allUsers.find(u => u.id === p.teacherId);
                                      const gradeInfo = getScoreGradeInfo(Number(p.score) || 0);
                                      return (
                                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                          <td className="px-6 py-4 whitespace-normal">
                                            <div className="flex flex-col">
                                              <div className="flex items-center gap-1.5 mb-1"><BookOpen size={11} className="text-blue-500" /><span className="text-[8px] text-blue-500 font-bold uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full">Rapot</span></div>
                                              <span className="text-xs font-black text-indigo-500">{new Date(p.date || p.createdAt).toLocaleDateString('id-ID')}</span>
                                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{p.evaluationPeriod || 'Harian'}</span>
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 whitespace-normal">
                                            <div className="flex items-center gap-2.5">
                                              <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                                                <User size={14} />
                                              </div>
                                              <div>
                                                <p className="text-xs font-black text-gray-800 leading-tight">{p.teacherName || teacher?.name || 'Guru'}</p>
                                                <p className="text-[8px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">Penilai Utama</p>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 whitespace-normal">
                                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                              <span className="text-[9px] font-black text-indigo-600 block mb-1 uppercase tracking-widest">{p.category || 'Penilaian Umum'}</span>
                                              <p className="text-[11px] text-gray-650 leading-relaxed font-semibold italic">"{p.description || 'Guru tidak memberikan catatan detail.'}"</p>
                                              {p.target && (
                                                <div className="mt-2 flex items-center gap-1">
                                                  <TrendingUp size={10} className="text-emerald-500" />
                                                  <span className="text-[9px] text-emerald-600 font-black uppercase tracking-tighter">Target: {p.target}</span>
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-3">
                                              <div className={`px-2 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${p.status === 'Lulus' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                {p.status || 'Selesai'}
                                              </div>
                                              <div className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl font-black ${gradeInfo.color} bg-white shadow-sm border border-gray-100`}>
                                                <span className="text-xs leading-none">{p.score || 0}</span>
                                                <span className="text-[8px] font-black opacity-85 mt-0.5">{gradeInfo.grade}</span>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}

                                    {/* Render Hafalan second */}
                                    {studentHafalan.map(h => {
                                      const mat = materialsData.find(m => m.id === h.materialId);
                                      return (
                                        <tr key={h.id} className="hover:bg-gray-50/50 transition-colors group">
                                          <td className="px-6 py-4 whitespace-normal">
                                            <div className="flex flex-col">
                                              <div className="flex items-center gap-1.5 mb-1"><Star size={11} className="text-yellow-500" /><span className="text-[8px] text-yellow-600 font-bold uppercase tracking-widest bg-yellow-50 px-2 py-0.5 rounded-full">Hafalan</span></div>
                                              <span className="text-xs font-black text-indigo-500">{h.createdAt ? new Date(h.createdAt?.toDate ? h.createdAt.toDate() : h.createdAt).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID')}</span>
                                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{h.evaluationSemester || 'Semester'}</span>
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 whitespace-normal">
                                            <div className="flex items-center gap-2.5">
                                              <div className="w-8 h-8 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600 border border-yellow-100">
                                                <User size={14} />
                                              </div>
                                              <div>
                                                <p className="text-xs font-black text-gray-800 leading-tight">Sistem Hafalan</p>
                                                <p className="text-[8px] text-yellow-500 font-black uppercase tracking-widest mt-0.5">Catatan Update</p>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 whitespace-normal">
                                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                              <span className="text-[9px] font-black text-yellow-600 block mb-1 uppercase tracking-widest">{mat ? mat.title : 'Tahfidz / Surah'}</span>
                                              <p className="text-[11px] text-gray-650 leading-relaxed font-semibold italic">"{h.catatanGuru || 'Guru tidak memberikan catatan detail.'}"</p>
                                            </div>
                                          </td>
                                          <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-3">
                                              <div className={`px-2 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${h.status?.includes('Lulus') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                {h.status || 'Berjalan'}
                                              </div>
                                              <div className="flex flex-col items-center justify-center w-11 h-11 rounded-xl font-black text-yellow-600 bg-white shadow-sm border border-yellow-100">
                                                <div className="flex items-center gap-0.5">
                                                  <span className="text-xs leading-none">{h.stars || 0}</span>
                                                  <Star size={8} fill="currentColor" />
                                                </div>
                                                <span className="text-[6px] font-black opacity-85 uppercase tracking-widest mt-0.5">Bintang</span>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">Administrasi & Keuangan</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Laporan Real-time, Validasi Pembayaran, & Log Transaksi</p>
              </div>

              {/* Terapkan Tab Navigation */}
              <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 self-start md:self-center">
                <button
                  type="button"
                  onClick={() => setFinanceSubTab('siswa')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${financeSubTab === 'siswa' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Users size={14} /> Daftar Siswa
                </button>
                <button
                  type="button"
                  onClick={() => setFinanceSubTab('validasi')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 relative ${financeSubTab === 'validasi' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Clock size={14} /> Validasi
                  {payments.filter(p => p.status === 'pending').length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                      {payments.filter(p => p.status === 'pending').length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setFinanceSubTab('riwayat')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${financeSubTab === 'riwayat' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <FileText size={14} /> Riwayat Log
                </button>
              </div>
            </div>

            {/* Consolidated & Ultra-Clean Actions Panel */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-[28px] border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/15 rounded-full blur-3xl"></div>
              <div className="absolute left-1/3 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <h4 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <Shield size={20} className="text-indigo-400" /> Ekspor & Pengaturan Finansial
                  </h4>
                  <p className="text-xs text-indigo-200 mt-1 max-w-xl">Unduh satu dokumen excel lengkap berisi: data ringkasan tabungan, seluruh riwayat transaksi pembayaran digital/tunai, serta rincian tunggakan spesifik per siswa untuk laporan yang profesional.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  <button 
                    onClick={exportFinanceToExcel}
                    className="bg-indigo-500 text-white hover:bg-indigo-600 px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    <Download size={18} /> Export Rekap Keuangan Lengkap
                  </button>
                </div>
              </div>

              {/* Secondary Clean Actions Row */}
              <div className="border-t border-slate-800/80 mt-6 pt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => setShowIuranModal(true)}
                  className="bg-slate-800/50 border border-slate-750 text-slate-200 hover:bg-slate-800 p-3.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all text-left"
                >
                  <div className="p-2 bg-indigo-500/15 text-indigo-400 rounded-lg"><Plus size={16} /></div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Iuran Siswa</p>
                    <p className="text-xs leading-none mt-0.5">Buat Tagihan</p>
                  </div>
                </button>

                <button
                  onClick={() => setShowImportTabunganModal(true)}
                  className="bg-slate-800/50 border border-slate-750 text-slate-200 hover:bg-slate-800 p-3.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all text-left"
                >
                  <div className="p-2 bg-purple-500/15 text-purple-400 rounded-lg"><Upload size={16} /></div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tabungan</p>
                    <p className="text-xs leading-none mt-0.5">Impor Massal</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                      const ws = XLSX.utils.json_to_sheet([{ Nama: "Contoh Siswa", "Nominal Tabungan": 150000 }]);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "Format Tabungan");
                      XLSX.writeFile(wb, "Format_Import_Tabungan.xlsx");
                  }}
                  className="bg-slate-800/50 border border-slate-750 text-slate-200 hover:bg-slate-800 p-3.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all text-left"
                >
                  <div className="p-2 bg-slate-500/15 text-slate-300 rounded-lg"><Download size={16} /></div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Format Impor</p>
                    <p className="text-xs leading-none mt-0.5">Unduh Template</p>
                  </div>
                </button>

                <button
                  onClick={() => setShowDeleteIuranModal(true)}
                  className="bg-slate-800/50 border border-slate-750 text-slate-200 hover:bg-slate-800 p-3.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all text-left hover:border-red-610 group hover:bg-red-500/10"
                >
                  <div className="p-2 bg-red-500/15 text-red-400 group-hover:bg-red-500/25 group-hover:text-red-300 rounded-lg"><Trash2 size={16} /></div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-red-300">Penghapusan</p>
                    <p className="text-xs leading-none mt-0.5 group-hover:text-white">Hapus Iuran Massal</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Visual KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-16 h-16 bg-green-50 rounded-full blur-xl z-0"></div>
                <div className="relative z-10 w-11 h-11 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 shrink-0">
                  <CreditCard size={20} />
                </div>
                <div className="relative z-10 min-w-0">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Tabungan</p>
                  <h4 className="text-base sm:text-lg font-black text-gray-800 tracking-tight mt-0.5">Rp {displayTotalTabungan.toLocaleString('id-ID')}</h4>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-16 h-16 bg-red-50 rounded-full blur-xl z-0"></div>
                <div className="relative z-10 w-11 h-11 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div className="relative z-10 min-w-0">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Tunggakan</p>
                  <h4 className="text-base sm:text-lg font-black text-gray-800 tracking-tight mt-0.5 text-red-600">Rp {displayTotalTunggakan.toLocaleString('id-ID')}</h4>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-16 h-16 bg-blue-50 rounded-full blur-xl z-0"></div>
                <div className="relative z-10 w-11 h-11 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                  <Shield size={20} />
                </div>
                <div className="relative z-10 min-w-0">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Pendapatan Online</p>
                  <h4 className="text-base sm:text-lg font-black text-gray-800 tracking-tight mt-0.5">
                    Rp {payments.filter(p => p.status === 'lunas' && p.method === 'Transfer').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toLocaleString('id-ID')}
                  </h4>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-16 h-16 bg-orange-50 rounded-full blur-xl z-0"></div>
                <div className="relative z-10 w-11 h-11 bg-orange-150 rounded-2xl flex items-center justify-center text-orange-600 shrink-0">
                  <Clock size={20} />
                </div>
                <div className="relative z-10 min-w-0">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Antrean Validasi</p>
                  <h4 className="text-base sm:text-lg font-black text-gray-800 tracking-tight mt-0.5">
                    {payments.filter(p => p.status === 'pending').length} Permintaan
                  </h4>
                </div>
              </div>
            </div>

            {/* Sub Tab: Daftar Siswa */}
            {financeSubTab === 'siswa' && (
              <div className="space-y-6">
                {/* Filter Spesifik Keuangan */}
                <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-3xl p-5">
                  <h4 className="text-sm font-black text-indigo-800 tracking-tight mb-3">Pencarian & Penyaringan Khusus</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-indigo-500 uppercase mb-1">Cari Nama</label>
                      <input 
                        type="text" 
                        placeholder="Ketik nama siswa..." 
                        value={searchFinanceList} 
                        onChange={(e) => setSearchFinanceList(e.target.value)} 
                        className="w-full text-xs p-3 bg-white border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-indigo-500 uppercase mb-1">Status Keuangan</label>
                      <select 
                        value={filterKeuanganStatus} 
                        onChange={(e) => setFilterKeuanganStatus(e.target.value as any)} 
                        className="w-full text-xs p-3 bg-white border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      >
                        <option value="semua">Semua Status</option>
                        <option value="menunggak">Menunggak</option>
                        <option value="lunas">Lunas</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-indigo-500 uppercase mb-1">Kelas</label>
                      <select 
                        value={filterFinanceKelas} 
                        onChange={(e) => setFilterFinanceKelas(e.target.value)} 
                        className="w-full text-xs p-3 bg-white border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      >
                        <option value="">Semua Kelas</option>
                        {schoolClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-indigo-100/40">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[9px] font-bold text-indigo-500 uppercase">Kategori Tagihan</label>
                        {filterFinanceCategory && (
                          <button onClick={() => setFilterFinanceCategory('')} className="text-[8px] font-bold text-indigo-400 hover:text-red-500 transition-colors uppercase">Reset</button>
                        )}
                      </div>
                      <select 
                        value={filterFinanceCategory} 
                        onChange={(e) => setFilterFinanceCategory(e.target.value)} 
                        className={`w-full text-xs p-3 border rounded-xl outline-none transition-all font-bold ${filterFinanceCategory ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-indigo-100 text-gray-700 focus:ring-2 focus:ring-indigo-500'}`}
                      >
                        <option value="">Semua Kategori</option>
                        {iuranCategories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                        <option value="Umum">Umum (Tidak terdata)</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[9px] font-bold text-indigo-500 uppercase">Item Spesifik</label>
                        {filterFinanceIuranName && (
                          <button onClick={() => setFilterFinanceIuranName('')} className="text-[8px] font-bold text-indigo-400 hover:text-red-500 transition-colors uppercase">Reset</button>
                        )}
                      </div>
                      <select 
                        value={filterFinanceIuranName} 
                        onChange={(e) => setFilterFinanceIuranName(e.target.value)} 
                        className={`w-full text-xs p-3 border rounded-xl outline-none transition-all font-bold ${filterFinanceIuranName ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-indigo-100 text-gray-700 focus:ring-2 focus:ring-indigo-500'}`}
                      >
                        <option value="">{filterFinanceCategory ? `Semua Tagihan ${filterFinanceCategory}` : 'Semua Tagihan'}</option>
                        {filteredAvailableIuranNames.map((name: any) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-indigo-500 uppercase mb-1">Mulai Tanggal</label>
                      <input type="date" value={filterFinanceStartDate} onChange={(e) => setFilterFinanceStartDate(e.target.value)} className={`w-full text-xs p-3 border rounded-xl outline-none transition-all font-medium ${filterFinanceStartDate ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-indigo-100 text-gray-700 focus:ring-2 focus:ring-indigo-500'}`} />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-indigo-500 uppercase mb-1">Sampai Tanggal</label>
                      <input type="date" value={filterFinanceEndDate} onChange={(e) => setFilterFinanceEndDate(e.target.value)} className={`w-full text-xs p-3 border rounded-xl outline-none transition-all font-medium ${filterFinanceEndDate ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-indigo-100 text-gray-700 focus:ring-2 focus:ring-indigo-500'}`} />
                    </div>
                  </div>
                </div>

                {/* Table & Mobile Card layouts */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap min-w-[700px]">
                      <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Nama Siswa</th>
                          <th className="px-6 py-4">Kelas</th>
                          <th className="px-6 py-4">Total Tabungan</th>
                          <th className="px-6 py-4">Total Tunggakan</th>
                          <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredUsersForFinance.filter(u => {
                          const matchBase = u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif';
                          const matchKelas = !filterFinanceKelas || (u.kelas || '').toLowerCase() === filterFinanceKelas.toLowerCase();
                          const matchName = !searchFinanceList || u.name.toLowerCase().includes(searchFinanceList.toLowerCase());
                          const displayArrears = isFinanceFiltered ? (u.viewArrears || 0) : (u.arrears || 0);
                          const matchStatus = filterKeuanganStatus === 'semua' ? true : (filterKeuanganStatus === 'menunggak' ? (displayArrears > 0) : (displayArrears === 0));
                          return matchBase && matchKelas && matchName && matchStatus;
                        }).map((u) => {
                          const displayArrears = isFinanceFiltered ? (u.viewArrears || 0) : (u.arrears || 0);
                          const displaySavings = isFinanceFiltered ? (u.viewSavings || 0) : (u.savings || 0);
                          return (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-gray-800">{u.name}</td>
                              <td className="px-6 py-4 text-gray-500 text-sm">{u.kelas || '-'}</td>
                              <td className="px-6 py-4 font-bold text-green-600">Rp {displaySavings.toLocaleString()}</td>
                              <td className="px-6 py-4 font-bold text-red-600">Rp {displayArrears.toLocaleString()}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {u.whatsapp && (displayArrears > 0) && (
                                    <button 
                                      onClick={() => {
                                        let firstArrear = u.arrears_details?.[0];
                                        if (isFinanceFiltered && filterFinanceIuranName) {
                                          firstArrear = u.arrears_details?.find((d: any) => d.name.toLowerCase().includes(filterFinanceIuranName.toLowerCase())) || firstArrear;
                                        }
                                        if (firstArrear) {
                                          handleWhatsAppFollowUp(u, firstArrear);
                                        } else {
                                          alert("Tidak ada rincian tunggakan spesifik.");
                                        }
                                      }}
                                      className="bg-green-50 text-green-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-green-600 hover:text-white transition-all flex items-center gap-1"
                                      title="Follow up via WA"
                                    >
                                      <Megaphone size={14} /> Tagih WA
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
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Responsive Mobile Card List */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {filteredUsersForFinance.filter(u => {
                      const matchBase = u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif';
                      const matchKelas = !filterFinanceKelas || (u.kelas || '').toLowerCase() === filterFinanceKelas.toLowerCase();
                      const matchName = !searchFinanceList || u.name.toLowerCase().includes(searchFinanceList.toLowerCase());
                      const displayArrears = isFinanceFiltered ? (u.viewArrears || 0) : (u.arrears || 0);
                      const matchStatus = filterKeuanganStatus === 'semua' ? true : (filterKeuanganStatus === 'menunggak' ? (displayArrears > 0) : (displayArrears === 0));
                      return matchBase && matchKelas && matchName && matchStatus;
                    }).map((u) => {
                      const displayArrears = isFinanceFiltered ? (u.viewArrears || 0) : (u.arrears || 0);
                      const displaySavings = isFinanceFiltered ? (u.viewSavings || 0) : (u.savings || 0);
                      return (
                        <div key={u.id} className="p-4 hover:bg-slate-50/50 flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-gray-850">{u.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{u.kelas || 'Belum Ditentukan'}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center bg-gray-55/60 p-3 rounded-xl border border-gray-100/50 text-xs">
                            <div>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Tabungan</p>
                              <p className="font-bold text-green-600 mt-0.5">Rp {displaySavings.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Tunggakan</p>
                              <p className="font-bold text-red-650 mt-0.5">Rp {displayArrears.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 text-xs">
                            {u.whatsapp && (displayArrears > 0) && (
                              <button 
                                onClick={() => {
                                  let firstArrear = u.arrears_details?.[0];
                                  if (isFinanceFiltered && filterFinanceIuranName) {
                                    firstArrear = u.arrears_details?.find((d: any) => d.name.toLowerCase().includes(filterFinanceIuranName.toLowerCase())) || firstArrear;
                                  }
                                  if (firstArrear) handleWhatsAppFollowUp(u, firstArrear);
                                }}
                                className="flex-1 bg-green-50 text-green-600 px-3 py-2.5 rounded-xl font-bold hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-1.5"
                              >
                                <Megaphone size={14} /> Tagih WA
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setSelectedStudentForFinance(u);
                                setShowManageFinanceModal(true);
                              }}
                              className="flex-1 bg-blue-50 text-blue-600 px-4 py-2.5 rounded-xl font-bold hover:bg-blue-100 transition-colors text-center"
                            >
                              Kelola Keuangan
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Monthly Chart Section */}
                <div className="card-3d p-6 md:p-8 overflow-hidden z-10">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="text-lg font-black text-gray-800 tracking-tight">Perkembangan Transaksi Keuangan</h4>
                      <p className="text-[10px] text-gray-450 font-bold uppercase mt-1">Total Tabungan vs Pelunasan Tagihan (6 Bulan Terakhir)</p>
                    </div>
                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                        <span>Tabungan</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>
                        <span>Iuran</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={getMonthlyFinanceData()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} tickFormatter={(val) => `Rp${(val / 1000).toLocaleString()}k`} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '15px' }} formatter={(value: any) => [`Rp ${value.toLocaleString()}`, '']} />
                        <Bar dataKey="savings" fill="#10b981" radius={[5, 5, 0, 0]} name="Tabungan" barSize={24} />
                        <Bar dataKey="arrears" fill="#6366f1" radius={[5, 5, 0, 0]} name="Pelunasan Iuran" barSize={24} />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Sub Tab: Menunggu Validasi Pembayaran */}
            {financeSubTab === 'validasi' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-gray-850 tracking-tight text-lg">Persetujuan & Validasi Keuangan</h3>
                      <p className="text-xs text-slate-400 mt-1">Siswa telah mengirim pengajuan setoran tabungan, penyelesaian iuran, tunai atau transfer.</p>
                    </div>
                    <span className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-xs font-black">
                      {payments.filter(p => p.status === 'pending').length} Menunggu Proses
                    </span>
                  </div>

                  {payments.filter(p => p.status === 'pending').length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 text-slate-450 border border-slate-100 rounded-full flex items-center justify-center mb-4 text-emerald-500 bg-emerald-50">
                        <CheckCircle size={28} />
                      </div>
                      <h4 className="font-black text-gray-800 text-lg">Semua Pembayaran Bersih!</h4>
                      <p className="text-xs text-gray-400 mt-1 max-w-sm">Tidak ada permintaan konfirmasi atau transfer dari siswa yang pending untuk divalidasi hari ini.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                      {payments.filter(p => p.status === 'pending').map((pay) => {
                        const student = allUsers.find(u => u.id === pay.studentId);
                        return (
                          <div key={pay.id} className="p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                            <div className="space-y-2 min-w-0 flex-1">
                              <div>
                                <p className="font-bold text-gray-805 text-base">{student?.name || 'Siswa tidak ditemukan'}</p>
                                <p className="text-[10px] text-gray-400 tracking-wider font-extrabold uppercase mt-0.5">{student?.kelas || 'Tanpa Kelas'} • {pay.description || 'Pembayaran'}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {pay.method === 'Transfer' && pay.proofStr && (
                                  <button 
                                    onClick={() => setSelectedPhoto(pay.proofStr)}
                                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 border border-blue-100"
                                  >
                                    <ImageIcon size={13} /> Lihat Bukti Transfer
                                  </button>
                                )}
                                {pay.method === 'Tunai' && pay.meetDate && (
                                  <div className="bg-amber-100/50 text-amber-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-amber-100/40">
                                    <Calendar size={13} /> Janji Temu: {pay.meetDate}
                                  </div>
                                )}
                                {pay.method === 'Tabungan' && (
                                  <div className="bg-emerald-100/50 text-emerald-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-emerald-100/40">
                                    <CreditCard size={13} /> Bayar Potong Tabungan
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                              <div className="text-left md:text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Jumlah Nominal</p>
                                <p className="font-black text-indigo-650 text-lg">Rp {(pay.amount || 0).toLocaleString('id-ID')}</p>
                              </div>
                              
                              <div className="flex items-center gap-2 shrink-0">
                                <button 
                                  onClick={() => handleApprovePayment(pay)}
                                  className="bg-green-600 text-white hover:bg-green-700 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md items-center flex gap-1.5"
                                >
                                  <CheckCircle size={14} /> Validasi
                                </button>
                                <button 
                                  onClick={() => handleRejectPayment(pay.id)}
                                  className="bg-red-50 text-red-650 hover:bg-red-100 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all items-center flex gap-1.5"
                                >
                                  <X size={14} /> Tolak
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub Tab: Riwayat Validasi & Pembayaran */}
            {financeSubTab === 'riwayat' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-black text-gray-850 tracking-tight text-lg">Log Historis Keuangan & Validasi</h3>
                      <p className="text-xs text-slate-400 mt-1">Daftar lengkap transaksi: Transfer (online), Tunai, atau Tabungan yang telah divalidasi atau ditolak.</p>
                    </div>
                    {/* Search Bar untuk Riwayat Logs */}
                    <div className="relative w-full md:w-72">
                      <input 
                        type="text"
                        placeholder="Cari nama siswa atau transaksi..."
                        value={searchTransactionText}
                        onChange={(e) => setSearchTransactionText(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                      <Users className="absolute left-3.5 top-3.5 text-gray-400" size={15} />
                    </div>
                  </div>

                  {/* Advanced Filters: Status & Date Range (Filter Waktu) */}
                  <div className="bg-slate-50/70 border-b border-gray-150 p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-1.5">Status Transaksi</label>
                      <select 
                        value={filterLogStatus} 
                        onChange={(e) => setFilterLogStatus(e.target.value as any)} 
                        className="w-full text-xs p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700"
                      >
                        <option value="semua">Semua Status Log</option>
                        <option value="pending">Menunggu Validasi (Pending)</option>
                        <option value="lunas">Diterima / Lunas</option>
                        <option value="ditolak">Ditolak</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-1.5">Dari Tanggal (Mulai)</label>
                      <input 
                        type="date" 
                        value={filterLogStartDate} 
                        onChange={(e) => setFilterLogStartDate(e.target.value)} 
                        className="w-full text-xs p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-1.5">Sampai Tanggal (Selesai)</label>
                      <input 
                        type="date" 
                        value={filterLogEndDate} 
                        onChange={(e) => setFilterLogEndDate(e.target.value)} 
                        className="w-full text-xs p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700" 
                      />
                    </div>
                    <div className="flex items-end">
                      <button 
                        type="button"
                        onClick={() => {
                          setFilterLogStatus('semua');
                          setFilterLogStartDate('');
                          setFilterLogEndDate('');
                        }}
                        className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        Reset Saring Waktu
                      </button>
                    </div>
                  </div>

                  {/* Transaction History Log Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Waktu Transaksi</th>
                          <th className="px-6 py-4">Siswa</th>
                          <th className="px-6 py-4">Nama Tagihan / Transaksi</th>
                          <th className="px-6 py-4">Nominal</th>
                          <th className="px-6 py-4">Metode</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-center">Bukti / Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs font-semibold">
                        {(() => {
                          const filteredLogPayments = payments.filter(pay => {
                            const student = allUsers.find(u => u.id === pay.studentId);
                            const studentName = student?.name || '';
                            const desc = pay.description || '';
                            const searchLower = searchTransactionText.toLowerCase();
                            const matchesSearch = studentName.toLowerCase().includes(searchLower) || desc.toLowerCase().includes(searchLower);
                            
                            // 1. Filter Status
                            const matchesStatus = filterLogStatus === 'semua' || pay.status === filterLogStatus;
                            
                            // 2. Filter Waktu (Date range)
                            let matchesDate = true;
                            if (pay.createdAt) {
                              try {
                                const dObj = pay.createdAt.toDate ? pay.createdAt.toDate() : new Date(pay.createdAt);
                                const y = dObj.getFullYear();
                                const m = String(dObj.getMonth() + 1).padStart(2, '0');
                                const d = String(dObj.getDate()).padStart(2, '0');
                                const payDateStr = `${y}-${m}-${d}`;
                                
                                if (filterLogStartDate && payDateStr < filterLogStartDate) matchesDate = false;
                                if (filterLogEndDate && payDateStr > filterLogEndDate) matchesDate = false;
                              } catch (e) {
                                // ignore parse issues
                              }
                            }
                            
                            return matchesSearch && matchesStatus && matchesDate;
                          });

                          if (filteredLogPayments.length === 0) {
                            return (
                              <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-bold">
                                  Belum ada catatan riwayat transaksi pembayaran ditemukan.
                                </td>
                              </tr>
                            );
                          }

                          return filteredLogPayments.map((pay) => {
                            const student = allUsers.find(u => u.id === pay.studentId);
                            let formattedDate = '-';
                            if (pay.createdAt) {
                              try {
                                const dObj = pay.createdAt.toDate ? pay.createdAt.toDate() : new Date(pay.createdAt);
                                formattedDate = dObj.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' WIB';
                              } catch (e) {
                                formattedDate = String(pay.createdAt);
                              }
                            }
                            return (
                              <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-gray-400 font-mono">{formattedDate}</td>
                                <td className="px-6 py-4">
                                  <span className="font-bold text-gray-800 block">{student?.name || 'Siswa tidak ditemukan'}</span>
                                  <span className="text-[10px] text-gray-400 tracking-wider font-extrabold uppercase mt-0.5">{student?.kelas || 'Tanpa Kelas'}</span>
                                </td>
                                <td className="px-6 py-4 text-gray-700 font-medium">
                                  {pay.description || (pay.type === 'tabungan' ? 'Setoran Tabungan' : pay.type === 'tabungan_keluar' ? 'Penarikan Tabungan' : 'Pembayaran Iuran')}
                                </td>
                                <td className="px-6 py-4 font-black text-indigo-950">Rp {(pay.amount || 0).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                  {pay.method === 'Transfer' ? (
                                    <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100">Transfer Mandiri</span>
                                  ) : pay.method === 'Tunai' ? (
                                    <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-100">Tunai Langsung</span>
                                  ) : pay.method === 'Tabungan' ? (
                                    <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100">Auto Tabungan</span>
                                  ) : (
                                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-200">System</span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  {pay.status === 'lunas' ? (
                                    <span className="text-green-600 font-black tracking-widest text-[9.5px] uppercase">● Diterima</span>
                                  ) : pay.status === 'ditolak' ? (
                                    <span className="text-red-500 font-black tracking-widest text-[9.5px] uppercase">● Ditolak</span>
                                  ) : (
                                    <span className="text-orange-500 font-black tracking-widest text-[9.5px] uppercase animate-pulse">● Pending</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {pay.proofStr ? (
                                    <button 
                                      onClick={() => setSelectedPhoto(pay.proofStr)}
                                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition select-none"
                                    >
                                      Lihat Bukti
                                    </button>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
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

            <div className="mt-12 pt-8 border-t border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Ubah Password</h3>
              <form onSubmit={handleChangePasswordProfile} className="space-y-6 max-w-lg">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Password Baru</label>
                  <input 
                    type="password" 
                    value={newPasswordProfile}
                    onChange={(e) => setNewPasswordProfile(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                    placeholder="Minimal 6 karakter"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Konfirmasi Password Baru</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPasswordProfile(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                    placeholder="Ulangi password baru"
                    required
                  />
                </div>
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                  Update Password
                </button>
              </form>
            </div>
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
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tempat Lahir</label>
                      <input type="text" value={editingUser.tempatLahir || ''} onChange={(e) => setEditingUser({...editingUser, tempatLahir: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" placeholder="Contoh: Cirebon" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal Lahir</label>
                      <input type="date" value={editingUser.tanggalLahir || ''} onChange={(e) => setEditingUser({...editingUser, tanggalLahir: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                  </>
                )}
                {editingUser.role === 'guru' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipe Guru</label>
                      <select value={editingUser.teacherType || 'Guru Kelas'} onChange={(e) => setEditingUser({...editingUser, teacherType: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required>
                        <option value="Wali Kelas">Wali Kelas</option>
                        <option value="Guru Kelas">Guru Kelas</option>
                        <option value="Guru Bidang">Guru Bidang</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unit / Kelas Tugas</label>
                      <select value={editingUser.assignedClass || ''} onChange={(e) => setEditingUser({...editingUser, assignedClass: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500">
                        <option value="">-- Pilih Unit/Kelas --</option>
                        {schoolClasses.map((c: any) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
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

        {showExamModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white max-w-md w-full rounded-[2.5rem] p-8 shadow-2xl relative">
              <button onClick={() => setShowExamModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors z-10">
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
                  <Edit size={24} />
                </div>
                <h3 className="text-xl font-black text-gray-800">Tambah Ujian</h3>
              </div>
              <form onSubmit={handleAddExam} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Jenis Ujian</label>
                  <select 
                    value={examType} 
                    onChange={(e) => setExamType(e.target.value)} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-bold text-gray-700" 
                    required
                  >
                    <option value="PTS Ganjil">PTS Ganjil</option>
                    <option value="PAS Ganjil">PAS Ganjil</option>
                    <option value="PTS Genap">PTS Genap</option>
                    <option value="PAS Genap">PAS Genap</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Tahun Ajaran</label>
                  <input 
                    type="text" 
                    value={examYear} 
                    onChange={(e) => setExamYear(e.target.value)} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-bold text-gray-800" 
                    placeholder="Contoh: 2024/2025"
                    required 
                  />
                </div>
                <button type="submit" className="w-full bg-rose-600 text-white p-4 rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 mt-2">
                  Simpan Ujian
                </button>
              </form>
            </div>
          </div>
        )}

        {showExamScheduleModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
             <div className="bg-white max-w-md w-full rounded-[2.5rem] p-8 shadow-2xl relative">
                <button onClick={() => setShowExamScheduleModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors z-10">
                  <X size={20} />
                </button>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
                    <Calendar size={24} />
                  </div>
                  <h3 className="text-xl font-black text-gray-800">Tambah Jadwal Pelajaran</h3>
                </div>
                <form onSubmit={handleAddExamSchedule} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Tanggal</label>
                      <input 
                        type="date" 
                        value={scheduleDate} 
                        onChange={(e) => setScheduleDate(e.target.value)} 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-bold text-gray-800" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Waktu</label>
                      <input 
                        type="text" 
                        value={scheduleTime} 
                        onChange={(e) => setScheduleTime(e.target.value)} 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-bold text-gray-800" 
                        placeholder="08:00 - 09:30"
                        required 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Mata Pelajaran</label>
                    <input 
                      type="text" 
                      value={scheduleSubject} 
                      onChange={(e) => setScheduleSubject(e.target.value)} 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-bold text-gray-800"
                      placeholder="Contoh: Matematika" 
                      required 
                    />
                  </div>
                  <div>
                     <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Kelas</label>
                     <select 
                      value={scheduleClass} 
                      onChange={(e) => setScheduleClass(e.target.value)} 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-bold text-gray-800"
                     >
                       <option value="Semua Kelas">Semua Kelas</option>
                       {schoolClasses.map((c: any) => (
                         <option key={c.id} value={c.name}>{c.name}</option>
                       ))}
                     </select>
                  </div>
                  <button type="submit" className="w-full bg-rose-600 text-white p-4 rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 mt-2">
                    Simpan Jadwal
                  </button>
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
              <div className="hidden md:flex flex-col justify-end w-1/3 bg-green-600 p-8 text-white relative overflow-hidden">
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

                        <div className="col-span-2 sm:col-span-1 animate-in fade-in slide-in-from-top-2">
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Tempat Lahir</label>
                          <input 
                            type="text" 
                            value={newUserTempatLahir} 
                            onChange={(e) => setNewUserTempatLahir(e.target.value)} 
                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-800 transition-all placeholder:text-gray-400 placeholder:font-medium" 
                            placeholder="Contoh: Cirebon"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-1 animate-in fade-in slide-in-from-top-2">
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Tanggal Lahir</label>
                          <input 
                            type="date" 
                            value={newUserTanggalLahir} 
                            onChange={(e) => setNewUserTanggalLahir(e.target.value)} 
                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-850 transition-all text-sm" 
                          />
                        </div>
                      </>
                    )}

                    {newUserRole === 'guru' && (
                      <>
                        <div className="col-span-2 sm:col-span-1 animate-in fade-in slide-in-from-top-2">
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Tipe Guru</label>
                          <select 
                            value={newUserTeacherType} 
                            onChange={(e) => setNewUserTeacherType(e.target.value)} 
                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 transition-all cursor-pointer" 
                            required
                          >
                            <option value="Wali Kelas">Wali Kelas</option>
                            <option value="Guru Kelas">Guru Kelas</option>
                            <option value="Guru Bidang">Guru Bidang</option>
                          </select>
                        </div>
                        
                        <div className="col-span-2 sm:col-span-1 animate-in fade-in slide-in-from-top-2">
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Unit / Kelas Tugas</label>
                          <select 
                            value={newUserAssignedClass} 
                            onChange={(e) => setNewUserAssignedClass(e.target.value)} 
                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 transition-all cursor-pointer" 
                          >
                            <option value="">-- PILIH UNIT/KELAS --</option>
                            {schoolClasses.map((c: any) => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
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
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Kategori Iuran</label>
                    <button 
                      type="button" 
                      onClick={() => setShowCategoryModal(true)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 underline"
                    >
                      Manajemen Kategori
                    </button>
                  </div>
                  <select 
                    value={selectedCategoryId} 
                    onChange={(e) => {
                      setSelectedCategoryId(e.target.value);
                      const cat = iuranCategories.find(c => c.id === e.target.value);
                      if (cat) setFinanceIuranName(cat.name);
                    }} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                    required
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {iuranCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Deskripsi Iuran</label>
                  <input 
                    type="text" 
                    list="existing-iurans"
                    value={financeIuranName} 
                    onChange={(e) => setFinanceIuranName(e.target.value)} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Contoh: SPP Bulan Juli 2024" 
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
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-green-800 text-sm font-bold mb-1">Total Tabungan</p>
                      <p className="text-3xl font-bold text-green-600">Rp {(selectedStudentForFinance.savings || 0).toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={() => {
                        const newVal = window.prompt("Masukkan nominal tabungan baru (Setel ulang):", selectedStudentForFinance.savings?.toString() || "0");
                        if (newVal !== null && !isNaN(Number(newVal))) {
                          const desc = window.prompt("Keterangan update (contoh: Koreksi saldo):", "Koreksi saldo");
                          updateFinance(selectedStudentForFinance.id, 'savings', newVal, desc || "Koreksi saldo");
                          setSelectedStudentForFinance((prev: any) => ({ ...prev, savings: Number(newVal) }));
                        }
                      }}
                      className="text-[10px] bg-green-200 text-green-800 px-2 py-1 rounded font-bold uppercase tracking-widest hover:bg-green-300 transition"
                    >
                      Koreksi
                    </button>
                  </div>
                  
                  <div className="mt-auto space-y-4">
                    {/* Update Tabungan */}
                    <div className="bg-white/60 p-4 rounded-xl border border-green-100">
                      <p className="text-[10px] font-bold text-green-800 uppercase tracking-wider mb-2">Tambah Tabungan</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                        <input 
                          type="number" 
                          id="update-savings"
                          placeholder="Nominal Tabungan"
                          className="w-full p-2.5 rounded-lg border border-green-200 outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
                        />
                        <input 
                          type="text" 
                          id="update-savings-desc"
                          placeholder="Keterangan (opsional)"
                          className="w-full p-2.5 rounded-lg border border-green-200 outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const val = (document.getElementById('update-savings') as HTMLInputElement).value;
                          const desc = (document.getElementById('update-savings-desc') as HTMLInputElement).value;
                          if(val) {
                            handleAddSingleTabungan(selectedStudentForFinance.id, val, desc || 'Nabung manual');
                            (document.getElementById('update-savings') as HTMLInputElement).value = '';
                            (document.getElementById('update-savings-desc') as HTMLInputElement).value = '';
                          }
                        }}
                        className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-green-700 transition"
                      >
                        Tambah
                      </button>
                    </div>

                    {/* Tarik Tabungan */}
                    <div className="bg-white/60 p-4 rounded-xl border border-orange-100">
                      <p className="text-[10px] font-bold text-orange-800 uppercase tracking-wider mb-2">Tarik Tabungan</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                        <input 
                          type="number" 
                          id="kurang-savings"
                          placeholder="Nominal Tarik"
                          className="w-full p-2.5 rounded-lg border border-orange-200 outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white"
                        />
                        <input 
                          type="text" 
                          id="kurang-savings-desc"
                          placeholder="Keterangan Tarik (opsional)"
                          className="w-full p-2.5 rounded-lg border border-orange-200 outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const val = (document.getElementById('kurang-savings') as HTMLInputElement).value;
                          const desc = (document.getElementById('kurang-savings-desc') as HTMLInputElement).value;
                          if(val && Number(val) > 0) {
                            handleTarikTabungan(selectedStudentForFinance.id, val, desc);
                            (document.getElementById('kurang-savings') as HTMLInputElement).value = '';
                            (document.getElementById('kurang-savings-desc') as HTMLInputElement).value = '';
                          }
                        }}
                        className="w-full bg-orange-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-orange-600 transition"
                      >
                        Tarik
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-red-800 text-sm font-bold mb-1">Total Tunggakan</p>
                      <p className="text-3xl font-bold text-red-600">Rp {(selectedStudentForFinance.arrears || 0).toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={() => {
                        const newVal = window.prompt("Masukkan nominal tunggakan baru (Setel ulang):", selectedStudentForFinance.arrears?.toString() || "0");
                        if (newVal !== null && !isNaN(Number(newVal))) {
                          const desc = window.prompt("Keterangan update (contoh: Koreksi tunggakan):", "Koreksi tunggakan");
                          updateFinance(selectedStudentForFinance.id, 'arrears', newVal, desc || "Koreksi tunggakan");
                          setSelectedStudentForFinance((prev: any) => ({ ...prev, arrears: Number(newVal) }));
                        }
                      }}
                      className="text-[10px] bg-red-200 text-red-800 px-2 py-1 rounded font-bold uppercase tracking-widest hover:bg-red-300 transition"
                    >
                      Koreksi
                    </button>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="bg-white/60 p-4 rounded-xl border border-red-100">
                      <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider mb-2">Tambah Tagihan / Tunggakan</p>
                      <div className="grid grid-cols-1 gap-2 mb-2">
                        <input 
                          type="number" 
                          id="update-arrears"
                          placeholder="Nominal Tunggakan"
                          className="w-full p-2.5 rounded-lg border border-red-200 outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
                        />
                        <input 
                          type="text" 
                          id="update-arrears-desc"
                          placeholder="Keterangan Tunggakan"
                          className="w-full p-2.5 rounded-lg border border-red-200 outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const val = (document.getElementById('update-arrears') as HTMLInputElement).value;
                          const desc = (document.getElementById('update-arrears-desc') as HTMLInputElement).value;
                          if(val && desc) {
                            handleAddSingleTunggakan(selectedStudentForFinance.id, val, desc);
                            (document.getElementById('update-arrears') as HTMLInputElement).value = '';
                            (document.getElementById('update-arrears-desc') as HTMLInputElement).value = '';
                          } else {
                            alert("Mohon isi nominal dan keterangan tunggakan.");
                          }
                        }}
                        className="w-full bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-red-700 transition"
                      >
                        Tambah
                      </button>
                    </div>
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
                          onClick={() => handleDeletePayment(pay)}
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
            <div className="bg-white w-full max-w-sm rounded-[1.5rem] p-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <button 
                onClick={() => {
                  setShowPayConfirmModal(false);
                  setPaymentProof('');
                  setPaymentNote('');
                }} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={18} />
              </button>
              
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <CheckCircle size={14} />
                  </div>
                  <h3 className="text-lg font-black text-gray-800 tracking-tight">Konfirmasi Lunas</h3>
                </div>
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/30 flex justify-between items-center">
                  <p className="text-xs font-bold text-blue-900 truncate mr-2">{activeDetailToPay.name}</p>
                  <span className="text-sm font-black text-blue-600 whitespace-nowrap">Rp {activeDetailToPay.amount.toLocaleString()}</span>
                </div>
              </div>

              <form onSubmit={handlePelunasan} className="space-y-3.5">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Pilih Metode</label>
                  <div className="grid grid-cols-4 gap-1">
                    {['Tunai', 'Transfer', 'Tabungan', 'Campuran'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(method as any);
                          if (method !== 'Transfer' && method !== 'Campuran') setPaymentProof('');
                          if (method === 'Campuran') {
                            setMixedSavingsAmount((activeStudentForPayment?.savings || 0).toString());
                            const remaining = Math.max(0, activeDetailToPay.amount - (activeStudentForPayment?.savings || 0));
                            setMixedCashAmount(remaining.toString());
                          }
                        }}
                        className={`py-1.5 px-0.5 rounded-lg text-[9px] font-black transition-all border ${
                          paymentMethod === method 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                            : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'Campuran' && (
                  <div className="space-y-2 p-2.5 bg-blue-50/30 rounded-xl border border-blue-100/30 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[8px] font-black text-blue-800/50 uppercase tracking-widest mb-1 ml-1">Tabungan</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-blue-300">Rp</span>
                          <input 
                            type="number" 
                            value={mixedSavingsAmount}
                            onChange={(e) => {
                              setMixedSavingsAmount(e.target.value);
                              const total = activeDetailToPay.amount;
                              const currentTab = Number(e.target.value) || 0;
                              setMixedCashAmount(Math.max(0, total - currentTab).toString());
                            }}
                            className="w-full pl-6 pr-2 py-1.5 bg-white border border-blue-50 rounded-lg outline-none focus:ring-1 focus:ring-blue-100 text-[10px] font-bold text-blue-900"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-[8px] font-black text-blue-800/50 uppercase tracking-widest mb-1 ml-1">Cash/Transfer</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-blue-300">Rp</span>
                          <input 
                            type="number" 
                            value={mixedCashAmount}
                            onChange={(e) => {
                              setMixedCashAmount(e.target.value);
                              const total = activeDetailToPay.amount;
                              const currentCash = Number(e.target.value) || 0;
                              setMixedSavingsAmount(Math.max(0, total - currentCash).toString());
                            }}
                            className="w-full pl-6 pr-2 py-1.5 bg-white border border-blue-50 rounded-lg outline-none focus:ring-1 focus:ring-blue-100 text-[10px] font-bold text-blue-900"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-1 font-black text-[9px]">
                      <span className="text-blue-400 uppercase tracking-tighter">Total Periksa</span>
                      <span className="text-blue-600">Rp {(Number(mixedSavingsAmount) + Number(mixedCashAmount)).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {(paymentMethod === 'Transfer' || paymentMethod === 'Campuran') && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Bukti Bayar</label>
                    <div 
                      onClick={() => paymentProofRef.current?.click()}
                      className="w-full h-24 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all overflow-hidden relative group"
                    >
                      {paymentProof ? (
                        <>
                          <img src={paymentProof} alt="Bukti Transfer" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={18} />
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-2">
                          <Upload size={16} className="text-gray-300 mx-auto mb-1" />
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-tight block">Upload Bukti</span>
                        </div>
                      )}
                    </div>
                    <input type="file" ref={paymentProofRef} onChange={handlePaymentProofChange} accept="image/*" className="hidden" />
                  </div>
                )}

                {paymentMethod === 'Tabungan' && (
                  <div className="p-2.5 bg-orange-50/50 border border-orange-100/50 rounded-xl animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-orange-500" />
                        <span className="text-[9px] font-black text-orange-800 uppercase tracking-wide">Saldo Tabungan</span>
                      </div>
                      <span className="text-[11px] font-black text-orange-600">Rp {(activeStudentForPayment?.savings || 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Keterangan</label>
                  <input 
                    type="text" 
                    value={paymentNote} 
                    onChange={(e) => setPaymentNote(e.target.value)} 
                    className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-1 focus:ring-blue-100 focus:border-blue-500 transition-all text-[10px] font-bold text-gray-700 placeholder:text-gray-300 placeholder:font-medium" 
                    placeholder="Catatan tambahan..."
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={paymentMethod === 'Tabungan' && (activeStudentForPayment?.savings || 0) < activeDetailToPay.amount}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all mt-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} /> Konfirmasi Lunas
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Category Management Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto translate-z-0">
              <button onClick={() => setShowCategoryModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-2 bg-gray-50 rounded-full transition-colors"><X size={20} /></button>
              
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                    <BookOpen size={20} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight">Kategori Iuran</h3>
                </div>
                <p className="text-sm text-gray-500 font-medium">Kelola kategori untuk mengorganisir tagihan siswa secara rapih.</p>
              </div>

              <form onSubmit={handleSaveCategory} className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-inner">
                <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Plus size={12} strokeWidth={4} /> Tambah Kategori Baru
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black text-blue-800/60 uppercase tracking-widest mb-1.5 ml-1">Nama Kategori</label>
                    <input 
                      type="text" 
                      value={newCategoryName} 
                      onChange={(e) => setNewCategoryName(e.target.value)} 
                      className="w-full p-3 bg-white border border-blue-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm font-bold transition-all placeholder:text-blue-200" 
                      placeholder="Contoh: SPP Bulanan" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-blue-800/60 uppercase tracking-widest mb-1.5 ml-1">Keterangan (Opsional)</label>
                    <input 
                      type="text" 
                      value={newCategoryDescription} 
                      onChange={(e) => setNewCategoryDescription(e.target.value)} 
                      className="w-full p-3 bg-white border border-blue-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm font-bold transition-all placeholder:text-blue-200" 
                      placeholder="Misal: Tagihan rutin setiap bulan..." 
                    />
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Save size={16} /> Simpan Kategori
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1 mb-2">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daftar Kategori ({iuranCategories.length})</h4>
                </div>
                {iuranCategories.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                    <img src="https://illustrations.popsy.co/gray/folder-is-empty.svg" alt="Empty" className="w-32 h-32 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Belum ada kategori iuran</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {iuranCategories.map((cat) => (
                      <div key={cat.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex justify-between items-center group hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300">
                        <div className="min-w-0 pr-4">
                          <p className="font-black text-gray-800 text-sm uppercase tracking-tight group-hover:text-blue-700 transition-colors">{cat.name}</p>
                          {cat.description && <p className="text-[10px] text-gray-400 font-bold truncate leading-none mt-1">{cat.description}</p>}
                        </div>
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100 shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Modal Add Kaldik */}
      {showAddKaldik && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden scale-in">
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-pink-100 rounded-full blur-2xl opacity-60"></div>
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-3 relative z-10"><Calendar className="text-pink-500" /> {editKaldikId ? 'Edit Agenda Kaldik' : 'Tambah Agenda Kaldik'}</h3>
              <button onClick={() => { setShowAddKaldik(false); setEditKaldikId(null); setNewKaldik({ date: '', title: '', description: '', type: 'Libur' }); }} className="text-gray-400 hover:text-red-500 transition-colors relative z-10"><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveKaldik} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Tanggal Kegiatan</label>
                <input 
                  type="date" 
                  value={newKaldik.date} 
                  onChange={(e) => setNewKaldik({...newKaldik, date: e.target.value})} 
                  placeholder="Pilih Tanggal Kegiatan"
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-500 transition-all font-bold text-gray-700" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nama / Judul Agenda</label>
                <input 
                  type="text" 
                  value={newKaldik.title} 
                  onChange={(e) => setNewKaldik({...newKaldik, title: e.target.value})} 
                  required
                  placeholder="Contoh: Maulid Nabi Muhammad SAW"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-500 transition-all font-bold text-gray-700 placeholder:text-gray-300" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Keterangan Tambahan</label>
                <input 
                  type="text" 
                  value={newKaldik.description} 
                  onChange={(e) => setNewKaldik({...newKaldik, description: e.target.value})} 
                  placeholder="Opsional"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-500 transition-all font-medium text-gray-700 placeholder:text-gray-300" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Jenis Agenda</label>
                <select 
                  value={newKaldik.type} 
                  onChange={(e) => setNewKaldik({...newKaldik, type: e.target.value})} 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-500 transition-all font-bold text-gray-700" 
                >
                  <option value="Libur">Libur / Hari Besar</option>
                  <option value="Kegiatan">Kegiatan Sekolah</option>
                  <option value="Ujian">Evaluasi / Ujian</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                className="w-full py-5 border-none bg-pink-500 text-white rounded-[1.5rem] font-bold text-lg hover:bg-pink-600 shadow-2xl flex items-center justify-center gap-2 transition-all mt-4 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Save size={20} /> Simpan Agenda
              </button>
            </form>
          </div>
        </div>
      )}

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
