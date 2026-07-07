import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { getApps, initializeApp } from 'firebase/app';
import { sendPasswordResetEmail, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, getDoc, updateDoc, setDoc, orderBy, getDocs, where } from 'firebase/firestore';
import { Users, Shield, Plus, Trash2, Edit, BarChart, Bell, LogOut, User, Download, CreditCard, Megaphone, X, Menu, Settings, Image as ImageIcon, Key, Upload, CheckCircle, Camera, TrendingUp, BookOpen, Clock, Printer, FileText, AlertCircle, RefreshCw, Calendar, Save, Trophy, Star, GraduationCap, ChevronDown, ChevronUp, ArrowRight, Search, PlusCircle, History as HistoryIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { compressImage } from '../lib/imageUtils';
import { getPrintHeaderHTML, getPrintStyles, getPrintSignatureHTML } from '../lib/printUtils';
import UserTab from './admin/tabs/UserTab';
import FinanceRekapTab from './admin/tabs/FinanceRekapTab';
import FinanceGrupTab from './admin/tabs/FinanceGrupTab';
import FinancePenetapanTab from './admin/tabs/FinancePenetapanTab';
import FinanceValidasiTab from './admin/tabs/FinanceValidasiTab';
import FinanceRiwayatTab from './admin/tabs/FinanceRiwayatTab';
import FinanceSetelanTab from './admin/tabs/FinanceSetelanTab';
import HafalanTab from './admin/tabs/HafalanTab';
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
  const [selectedAttendanceIds, setSelectedAttendanceIds] = useState<string[]>([]);
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
  const [announceAttachments, setAnnounceAttachments] = useState<any[]>([]);
  const [editingAnnounceId, setEditingAnnounceId] = useState<string | null>(null);
  const announceFileRef = useRef<HTMLInputElement>(null);
  
  // Finance Form States
  const [financeStudentIds, setFinanceStudentIds] = useState<string[]>([]);
  const [financeAmount, setFinanceAmount] = useState('');
  const [financeDate, setFinanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [financeIuranName, setFinanceIuranName] = useState('');
  const [financeIuranTarget, setFinanceIuranTarget] = useState('all');
  const [financeDueDate, setFinanceDueDate] = useState('');
  const [financeIuranCategory, setFinanceIuranCategory] = useState('');
  const [showIuranCategoryModal, setShowIuranCategoryModal] = useState(false);
  const [editingIuranCategory, setEditingIuranCategory] = useState<any>(null);
  const [newIuranCategoryName, setNewIuranCategoryName] = useState('');
  const [newIuranCategoryAmount, setNewIuranCategoryAmount] = useState('');
  const [searchStudentFinance, setSearchStudentFinance] = useState('');
  const [searchStudentIuran, setSearchStudentIuran] = useState('');
  const [deleteIuranTarget, setDeleteIuranTarget] = useState('all');
  const [deleteIuranDescription, setDeleteIuranDescription] = useState('');
  const [deleteIuranSearchName, setDeleteIuranSearchName] = useState('');
  const [searchStudentDelete, setSearchStudentDelete] = useState('');
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
  const [filterFinanceStudentName, setFilterFinanceStudentName] = useState('');
  const [filterFinanceClass, setFilterFinanceClass] = useState('');
  const [filterFinanceMethod, setFilterFinanceMethod] = useState('');
  const [filterFinanceIuranName, setFilterFinanceIuranName] = useState('');
  const [filterFinanceCategory, setFilterFinanceCategory] = useState('');
  const [filterFinanceStartDate, setFilterFinanceStartDate] = useState('');
  const [filterFinanceEndDate, setFilterFinanceEndDate] = useState('');
  const [showManageFinanceModal, setShowManageFinanceModal] = useState(false);
  const [financeModalMode, setFinanceModalMode] = useState<'detail' | 'bayar'>('detail');
  const [selectedStudentForFinance, setSelectedStudentForFinance] = useState<any>(null);

  const formatDateForUI = (dateInput: any, options?: Intl.DateTimeFormatOptions) => {
    if (!dateInput) return '-';
    try {
      let d: Date;
      if (dateInput.toDate && typeof dateInput.toDate === 'function') {
        d = dateInput.toDate();
      } else if (dateInput && typeof dateInput === 'object' && 'seconds' in dateInput) {
        d = new Date(dateInput.seconds * 1000);
      } else {
        d = new Date(dateInput);
      }
      
      if (isNaN(d.getTime())) return '-';
      
      // Default to date only if no options provided
      const defaultOptions: Intl.DateTimeFormatOptions = options || { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      };
      
      return d.toLocaleString('id-ID', defaultOptions);
    } catch (e) {
      return '-';
    }
  };

  // Profile Edit States
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  
  // Change Password State
  const [newPasswordProfile, setNewPasswordProfile] = useState('');
  const [confirmPassword, setConfirmPasswordProfile] = useState('');
  
  // Photo Viewer State
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  
  const [filterFinanceAcademicYear, setFilterFinanceAcademicYear] = useState('');
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
  const [financeSubTab, setFinanceSubTab] = useState<'dashboard' | 'grup' | 'penetapan' | 'validasi' | 'riwayat' | 'setelan'>('dashboard');
  const [financeIuranStudentIds, setFinanceIuranStudentIds] = useState<string[]>([]);
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

  const isFinanceFiltered = filterFinanceIuranName || filterFinanceCategory || filterFinanceStartDate || filterFinanceEndDate || filterFinanceStudentName || filterFinanceClass || filterFinanceAcademicYear;
  
  // Available Iurans for filtering (categorized)
  const availableIuranDetails = Array.from(new Set(allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif').flatMap(u => (u.arrears_details || []).map((d: any) => JSON.stringify({ name: d.name, category: d.category || 'Umum' })))))
    .map(s => JSON.parse(s));

  const filteredAvailableIuranNames = Array.from(new Set(
    availableIuranDetails
      .filter(d => !filterFinanceCategory || d.category === filterFinanceCategory)
      .map(d => d.name)
  )).sort();

  const filteredAttendance = attendance.filter(a => {
    const student = allUsers.find(u => u.id === a.studentId);
    if (!student || (student.role === 'siswa' && (student.status || 'Aktif') !== 'Aktif')) return false;
    if (filterRole !== 'semua' && student.role !== filterRole) return false;
    if (filterKelas && student.role === 'siswa') {
      const uK = (student.kelas || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const fK = filterKelas.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!uK.includes(fK) && !fK.includes(uK)) return false;
    }
    if (filterDateStart && a.date < filterDateStart) return false;
    if (filterDateEnd && a.date > filterDateEnd) return false;
    return true;
  });

  const filteredUsersForFinance = isFinanceFiltered ? allUsers.map(u => {
    if (u.role !== 'siswa') return u;

    // Apply basic user filters first
    const searchLower = filterFinanceStudentName.toLowerCase();
    const matchesName = u.name.toLowerCase().includes(searchLower);
    const matchesNISN = u.nisn && u.nisn.toLowerCase().includes(searchLower);
    
    if (filterFinanceStudentName && !matchesName && !matchesNISN) {
        return { ...u, viewArrears: 0, viewSavings: 0, hideByFilter: true };
    }
    if (filterFinanceClass && u.kelas !== filterFinanceClass) {
        return { ...u, viewArrears: 0, viewSavings: 0, hideByFilter: true };
    }

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
      if (filterFinanceAcademicYear && d.academicYear !== filterFinanceAcademicYear) match = false;
      if (match) filteredArrears += d.amount;
    });

    let filteredSavings = 0;
    payments.forEach(p => {
      if (p.studentId !== u.id) return;
      let match = true;
      if (filterFinanceCategory) {
        const pCat = p.iuranCategory || 'Umum';
        if (p.type === 'tagihan' && pCat !== filterFinanceCategory) match = false;
      }
      if (filterFinanceMethod && p.method !== filterFinanceMethod) match = false;
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
      viewSavings: filteredSavings,
      hideByFilter: false
    };
  }).filter(u => u.role === 'siswa' && !u.hideByFilter) : allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif');

  const displayTotalTunggakan = isFinanceFiltered 
    ? filteredUsersForFinance.filter(u => u.role === 'siswa').reduce((acc, curr) => acc + (curr.viewArrears || 0), 0)
    : allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif').reduce((acc, curr) => acc + (curr.arrears || 0), 0);
    
  const displayTotalTabungan = isFinanceFiltered
    ? filteredUsersForFinance.filter(u => u.role === 'siswa').reduce((acc, curr) => acc + (curr.viewSavings || 0), 0)
    : allUsers.filter(u => (u.status || 'Aktif') === 'Aktif').reduce((acc, curr) => acc + (curr.savings || 0), 0);

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

  const handleBulkDeleteAttendance = async () => {
    if (selectedAttendanceIds.length === 0) return;
    if (window.confirm(`Hapus ${selectedAttendanceIds.length} data absensi yang dipilih?`)) {
      try {
        await Promise.all(selectedAttendanceIds.map(id => deleteDoc(doc(db, 'attendance', id))));
        setSelectedAttendanceIds([]);
        alert('Data absensi terpilih berhasil dihapus!');
      } catch (error) {
        console.error("Error bulk deleting attendance:", error);
        alert('Gagal menghapus beberapa data.');
      }
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

  const handleResetAllFinance = async () => {
    if (!window.confirm('⚠️ PERINGATAN KRITIS: Tindakan ini akan MENGHAPUS PERMANEN seluruh Saldo Tabungan, Daftar Tunggakan, dan Riwayat Pembayaran SEMUA siswa. Pastikan Anda sudah mengekspor data penting ke Excel. Lanjutkan?')) return;
    if (!window.confirm('KONFIRMASI TERAKHIR: Anda yakin ingin mengosongkan seluruh buku keuangan sekolah dan memulai dari awal?')) return;
    
    setLoading(true);
    try {
      const { writeBatch } = await import('firebase/firestore');
      let batch = writeBatch(db);
      let count = 0;

      // 1. Reset Students Data
      const siswaUsers = allUsers.filter(u => u.role === 'siswa');
      for (const s of siswaUsers) {
        batch.update(doc(db, 'users', s.id), {
          arrears: 0,
          arrears_details: [],
          savings: 0
        });
        count++;
        if (count >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }

      // 2. Clear Payments Collection
      const paymentsSnap = await getDocs(collection(db, 'payments'));
      for (const p of paymentsSnap.docs) {
        batch.delete(doc(db, 'payments', p.id));
        count++;
        if (count >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) await batch.commit();

      alert('Seluruh data keuangan siswa berhasil di-reset ke nol!');
    } catch (error) {
      console.error('Reset error:', error);
      alert('Gagal melakukan reset data keuangan. Periksa koneksi atau izin anda.');
    } finally {
      setLoading(false);
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
    if (!user) return;

    try {
      const announceData = {
        title: announceTitle,
        content: announceContent,
        target: announceTarget,
        attachments: announceAttachments,
        updatedAt: serverTimestamp(),
        author: user.displayName || 'Admin'
      };

      if (editingAnnounceId) {
        await updateDoc(doc(db, 'announcements', editingAnnounceId), announceData);
        alert('Pengumuman berhasil diperbarui!');
      } else {
        await addDoc(collection(db, 'announcements'), {
          ...announceData,
          createdAt: serverTimestamp(),
        });
        alert('Pengumuman berhasil dikirim!');
      }

      setAnnounceTitle('');
      setAnnounceContent('');
      setAnnounceTarget('all');
      setAnnounceAttachments([]);
      setEditingAnnounceId(null);
      setShowAnnounceModal(false);
    } catch (error) {
      handleFirestoreError(error, editingAnnounceId ? OperationType.UPDATE : OperationType.CREATE, editingAnnounceId ? `announcements/${editingAnnounceId}` : 'announcements');
    }
  };

  const handleAnnounceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments = [...announceAttachments];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 800 * 1024) {
        alert(`File ${file.name} terlalu besar (max 800KB)`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setAnnounceAttachments(prev => [...prev, {
          name: file.name,
          type: file.type,
          data: dataUrl
        }]);
      };
      reader.readAsDataURL(file);
    }
    if (announceFileRef.current) announceFileRef.current.value = '';
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
    if (!financeIuranName || !financeAmount) {
      alert('Mohon isi nama iuran dan nominal.');
      return;
    }
    
    if (financeIuranStudentIds.length === 0 && financeIuranTarget === 'specific') {
      alert('Mohon pilih minimal satu siswa.');
      return;
    }

    try {
      const amount = Number(financeAmount);
      let targetStudents = [];
      const selectedCategory = iuranCategories.find(c => c.id === selectedCategoryId);
      
      // Fix: If in penetration tab, prioritize specific selected students
      const effectiveTarget = (financeSubTab === 'penetapan' && financeIuranStudentIds.length > 0) ? 'specific' : financeIuranTarget;

      if (effectiveTarget === 'all') {
        targetStudents = allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif');
      } else if (effectiveTarget === 'specific') {
        targetStudents = allUsers.filter(u => financeIuranStudentIds.includes(u.id));
      } else if (effectiveTarget.startsWith('kelas_')) {
        const targetKelas = effectiveTarget.replace('kelas_', '').toLowerCase();
        targetStudents = allUsers.filter(u => {
          if (u.role !== 'siswa') return false;
          if ((u.status || 'Aktif') !== 'Aktif') return false;
          const k = (u.kelas || '').toLowerCase();
          return k === targetKelas || k === `kelas ${targetKelas}` || k.includes(targetKelas);
        });
      }

      if (targetStudents.length === 0) {
        alert('Tidak ada siswa yang terpilih sebagai target tagihan.');
        return;
      }

      const categoryName = selectedCategory?.name || 'Umum';
      const batchId = Date.now().toString();

      const newArrearDetailBase = {
        name: financeIuranName,
        category: categoryName,
        categoryId: selectedCategoryId || null,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        dueDate: financeDueDate || null,
        batchId: batchId,
        academicYear: settings.academicYear || '2024/2025'
      };

      for (const student of targetStudents) {
        const currentDetails = student.arrears_details || [];
        const newArrears = (student.arrears || 0) + amount;
        
        const specificDetail = {
          ...newArrearDetailBase,
          id: Date.now().toString() + Math.random().toString(36).substring(7)
        };

        await updateDoc(doc(db, 'users', student.id), { 
          arrears: newArrears,
          arrears_details: [...currentDetails, specificDetail]
        });

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
      setFinanceIuranStudentIds([]);
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

  const handleDeleteIuranCategory = async (id: string) => {
    if (!window.confirm('Hapus kategori iuran ini?')) return;
    try {
      await deleteDoc(doc(db, 'iuran_categories', id));
      alert('Grup iuran berhasil dihapus!');
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveIuranCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIuranCategoryName || !newIuranCategoryAmount) {
      alert('Mohon isi nama dan nominal grup iuran.');
      return;
    }
    try {
      const data = {
        name: newIuranCategoryName,
        amount: Number(newIuranCategoryAmount),
        updatedAt: serverTimestamp()
      };
      if (editingIuranCategory) {
        await updateDoc(doc(db, 'iuran_categories', editingIuranCategory.id), data);
      } else {
        await addDoc(collection(db, 'iuran_categories'), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
      setShowIuranCategoryModal(false);
      setEditingIuranCategory(null);
      setNewIuranCategoryName('');
      setNewIuranCategoryAmount('');
      alert('Grup iuran berhasil disimpan!');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan grup iuran.');
    }
  };

  const handleOneClickPaymentFromTabungan = async (student: any, detail: any) => {
    if ((student.savings || 0) < detail.amount) {
      alert('Saldo Tabungan Tidak Mencukupi!');
      return;
    }
    if (!window.confirm(`Bayar ${detail.name} menggunakan Saldo Tabungan?`)) return;
    
    try {
      await updateDoc(doc(db, 'users', student.id), {
        savings: student.savings - detail.amount,
        arrears: student.arrears - detail.amount,
        arrears_details: student.arrears_details.filter((d: any) => d.id !== detail.id)
      });
      
      await addDoc(collection(db, 'payments'), {
        studentId: student.id,
        amount: detail.amount,
        description: `Bayar ${detail.name} (Saldo Tabungan)`,
        method: 'Tabungan',
        status: 'lunas',
        type: 'pembayaran',
        createdAt: serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
      });
      
      setSelectedStudentForFinance((prev: any) => ({
        ...prev,
        savings: prev.savings - detail.amount,
        arrears: prev.arrears - detail.amount,
        arrears_details: prev.arrears_details.filter((d: any) => d.id !== detail.id)
      }));
      alert('Pembayaran Berhasil!');
    } catch (e) { console.error(e); }
  };

  const handleOneClickPayment = async (student: any, detail: any) => {
    if (!window.confirm(`Bayar ${detail.name} secara Tunai?`)) return;
    
    try {
      await updateDoc(doc(db, 'users', student.id), {
        arrears: student.arrears - detail.amount,
        arrears_details: student.arrears_details.filter((d: any) => d.id !== detail.id)
      });
      
      await addDoc(collection(db, 'payments'), {
        studentId: student.id,
        amount: detail.amount,
        description: `Bayar ${detail.name} (Tunai Admin)`,
        method: 'Tunai',
        status: 'lunas',
        type: 'pembayaran',
        createdAt: serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
      });
      
      setSelectedStudentForFinance((prev: any) => ({
        ...prev,
        arrears: prev.arrears - detail.amount,
        arrears_details: prev.arrears_details.filter((d: any) => d.id !== detail.id)
      }));
      alert('Pembayaran Tunai Berhasil!');
    } catch (e) { console.error(e); }
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
    // 1. Ringkasan & Tabungan (Filtered students already computed in filteredUsersForFinance)
    const students = filteredUsersForFinance;

    const summaryData = students.map((s: any) => ({
      "Nama Siswa": s.name,
      "Kelas": s.kelas || '',
      "Status": s.status || 'Aktif',
      "Total Tabungan (Rp)": (s.viewSavings || 0),
      "Total Tunggakan (Rp)": (s.viewArrears || 0)
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
        if (filterFinanceMethod && p.method !== filterFinanceMethod) match = false;
        if (filterFinanceStartDate && p.date < filterFinanceStartDate) match = false;
        if (filterFinanceEndDate && p.date > filterFinanceEndDate) match = false;
        
        const student = allUsers.find(u => u.id === p.studentId);
        if (filterFinanceStudentName && student && !student.name.toLowerCase().includes(filterFinanceStudentName.toLowerCase())) match = false;
        if (filterFinanceClass && student && student.kelas !== filterFinanceClass) match = false;
        
        return match;
      })
      .map((pay: any) => {
        const student = allUsers.find(u => u.id === pay.studentId);
      let dateText = '-';
      if (pay.createdAt) {
        try {
          const dateObj = pay.createdAt?.toDate ? pay.createdAt.toDate() : (pay.createdAt ? new Date(pay.createdAt) : new Date());
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
      const matchName = !filterFinanceStudentName || u.name.toLowerCase().includes(filterFinanceStudentName.toLowerCase());
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
        onClick={() => { setActiveTab('hafalan'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'hafalan' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <BookOpen size={20} className={activeTab === 'hafalan' ? 'text-white' : 'text-gray-500'} /> Modul Hafalan
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
      <button 
        onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'settings' ? 'bg-slate-600 text-white shadow-lg shadow-slate-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <Settings size={20} className={activeTab === 'settings' ? 'text-white' : 'text-gray-500'} /> Pengaturan
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-gray-100 shadow-[0_-15px_40px_rgba(0,0,0,0.06)] flex justify-between items-center px-4 py-2.5 z-50 pb-safe-offset-2" style={{ WebkitBackdropFilter: 'blur(20px)' }}>
        <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-1.5 transition-all flex-1 py-1 ${activeTab === 'overview' ? 'text-indigo-600 font-black' : 'text-slate-400 font-bold'}`}>
          <div className={`p-2.5 rounded-[1.25rem] transition-all relative ${activeTab === 'overview' ? 'bg-indigo-50 shadow-sm scale-110' : 'hover:bg-slate-50'}`}>
            <BarChart size={20} />
            {activeTab === 'overview' && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"></span>}
          </div>
          <span className="text-[8px] uppercase tracking-widest font-black">Dash</span>
        </button>

        <button onClick={() => setActiveTab('finance')} className={`flex flex-col items-center gap-1.5 transition-all flex-1 py-1 ${activeTab === 'finance' ? 'text-indigo-600 font-black' : 'text-slate-400 font-bold'}`}>
          <div className={`p-2.5 rounded-[1.25rem] transition-all relative ${activeTab === 'finance' ? 'bg-indigo-50 shadow-sm scale-110' : 'hover:bg-slate-50'}`}>
            <CreditCard size={20} />
            {activeTab === 'finance' && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"></span>}
          </div>
          <span className="text-[8px] uppercase tracking-widest font-black">Uang</span>
        </button>

        <div className="flex-1 flex justify-center -mt-8 relative z-10">
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-14 h-14 rounded-[1.75rem] flex items-center justify-center transition-all shadow-xl shadow-indigo-100 border-4 border-white ${activeTab === 'users' ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-900 text-white'}`}
          >
            <Users size={24} />
          </button>
        </div>

        <button onClick={() => setActiveTab('academic')} className={`flex flex-col items-center gap-1.5 transition-all flex-1 py-1 ${activeTab === 'academic' ? 'text-indigo-600 font-black' : 'text-slate-400 font-bold'}`}>
          <div className={`p-2.5 rounded-[1.25rem] transition-all relative ${activeTab === 'academic' ? 'bg-indigo-50 shadow-sm scale-110' : 'hover:bg-slate-50'}`}>
            <BookOpen size={20} />
            {activeTab === 'academic' && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"></span>}
          </div>
          <span className="text-[8px] uppercase tracking-widest font-black">Buku</span>
        </button>

        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1.5 transition-all flex-1 py-1 ${activeTab === 'profile' ? 'text-indigo-600 font-black' : 'text-slate-400 font-bold'}`}>
          <div className={`p-2.5 rounded-[1.25rem] transition-all relative ${activeTab === 'profile' ? 'bg-indigo-50 shadow-sm scale-110' : 'hover:bg-slate-50'}`}>
            <User size={20} />
            {activeTab === 'profile' && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"></span>}
          </div>
          <span className="text-[8px] uppercase tracking-widest font-black">Profil</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-5 md:p-10 overflow-y-auto pb-32 md:pb-10 scrolling-touch custom-scrollbar">
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
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-10">
                {[
                  { id: 'academic', label: 'Kelas', icon: BookOpen, color: 'bg-indigo-600 bg-gradient-to-br from-indigo-500 to-indigo-600', action: () => setActiveTab('academic') },
                  { id: 'hafalan', label: 'Hafalan', icon: Star, color: 'bg-amber-500 bg-gradient-to-br from-amber-400 to-amber-500', action: () => setActiveTab('hafalan') },
                  { id: 'users', label: 'Siswa', icon: Users, color: 'bg-purple-600 bg-gradient-to-br from-purple-500 to-purple-600', action: () => { setActiveTab('users'); setFilterUserRole('siswa'); } },
                  { id: 'attendance', label: 'Absen', icon: CheckCircle, color: 'bg-emerald-600 bg-gradient-to-br from-emerald-500 to-emerald-600', action: () => setActiveTab('attendance') },
                  { id: 'kaldik', label: 'Kaldik', icon: Calendar, color: 'bg-rose-600 bg-gradient-to-br from-rose-500 to-rose-600', action: () => setActiveTab('kaldik') },
                  { id: 'materials', label: 'Materi', icon: BookOpen, color: 'bg-sky-600 bg-gradient-to-br from-sky-500 to-sky-600', action: () => setActiveTab('materials') },
                  { id: 'achievements', label: 'Rank', icon: Trophy, color: 'bg-amber-600 bg-gradient-to-br from-amber-500 to-amber-600', action: () => setActiveTab('achievements') },
                  { id: 'assessments', label: 'Nilai', icon: TrendingUp, color: 'bg-blue-600 bg-gradient-to-br from-blue-500 to-blue-600', action: () => setActiveTab('assessments') },
                  { id: 'exams', label: 'Ujian', icon: Edit, color: 'bg-pink-600 bg-gradient-to-br from-pink-500 to-pink-600', action: () => setActiveTab('exams') },
                  { id: 'users', label: 'Guru', icon: Shield, color: 'bg-teal-600 bg-gradient-to-br from-teal-500 to-teal-600', action: () => { setActiveTab('users'); setFilterUserRole('guru'); } },
                  { id: 'finance', label: 'Uang', icon: CreditCard, color: 'bg-orange-600 bg-gradient-to-br from-orange-500 to-orange-600', action: () => setActiveTab('finance') },
                  { id: 'announcements', label: 'Info', icon: Megaphone, color: 'bg-blue-600 bg-gradient-to-br from-blue-500 to-blue-600', action: () => setActiveTab('announcements') },
                  { id: 'settings', label: 'Setelan', icon: Settings, color: 'bg-slate-600 bg-gradient-to-br from-slate-500 to-slate-600', action: () => setActiveTab('settings') },
                ].map((item, idx) => (
                  <button 
                    key={idx} 
                    onClick={item.action}
                    className="group flex flex-col items-center gap-2 transition-all p-2 rounded-3xl hover:bg-slate-50 active:scale-95"
                  >
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 ${item.color} rounded-[22px] md:rounded-[28px] shadow-lg shadow-black/5 flex items-center justify-center text-white transition-all overflow-hidden group-hover:scale-110 group-hover:shadow-xl`}>
                      <item.icon size={24} className="md:w-10 md:h-10" />
                    </div>
                    <span className="text-[9px] md:text-sm font-black text-gray-700 tracking-tight text-center uppercase whitespace-nowrap">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <UserTab
            allUsers={allUsers}
            filterName={filterName}
            setFilterName={setFilterName}
            filterUserRole={filterUserRole}
            setFilterUserRole={setFilterUserRole}
            filterKelas={filterKelas}
            setFilterKelas={setFilterKelas}
            filterTeacherType={filterTeacherType}
            setFilterTeacherType={setFilterTeacherType}
            schoolClasses={schoolClasses}
            setNewUserRole={setNewUserRole}
            setShowAddUser={setShowAddUser}
            setUserToReset={setUserToReset}
            setShowResetPassword={setShowResetPassword}
            setEditingUser={setEditingUser}
            setShowEditUser={setShowEditUser}
            setUserToDelete={setUserToDelete}
            setShowDeleteConfirm={setShowDeleteConfirm}
            exportUsersToExcel={exportUsersToExcel}
            filterSiswaStatus={filterSiswaStatus}
            setFilterSiswaStatus={setFilterSiswaStatus}
          />
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
                                    {formatDateForUI(s.date, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
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
                { label: 'Hadir', count: filteredAttendance.filter(a => (a.status || '').toLowerCase() === 'hadir').length, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Sakit', count: filteredAttendance.filter(a => (a.status || '').toLowerCase() === 'sakit').length, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Izin', count: filteredAttendance.filter(a => (a.status || '').toLowerCase() === 'izin').length, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Alpha', count: filteredAttendance.filter(a => (a.status || '').toLowerCase() === 'tk' || (a.status || '').toLowerCase() === 'alpha').length, color: 'text-red-600', bg: 'bg-red-50' },
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
                          { name: 'Hadir', value: filteredAttendance.filter(a => (a.status || '').toLowerCase() === 'hadir').length, color: '#16a34a' },
                          { name: 'Sakit', value: filteredAttendance.filter(a => (a.status || '').toLowerCase() === 'sakit').length, color: '#2563eb' },
                          { name: 'Izin', value: filteredAttendance.filter(a => (a.status || '').toLowerCase() === 'izin').length, color: '#9333ea' },
                          { name: 'Alpha', value: filteredAttendance.filter(a => (a.status || '').toLowerCase() === 'tk' || (a.status || '').toLowerCase() === 'alpha').length, color: '#dc2626' },
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
                          hadir: attendance.filter(a => a.date === dateStr && (a.status || '').toLowerCase() === 'hadir').length
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
              <div className="p-4 md:p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/20">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Dari</span>
                    <input type="date" value={filterDateStart} onChange={(e) => setFilterDateStart(e.target.value)} className="w-full sm:w-auto p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Sampai</span>
                    <input type="date" value={filterDateEnd} onChange={(e) => setFilterDateEnd(e.target.value)} className="w-full sm:w-auto p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {selectedAttendanceIds.length > 0 && (
                    <button 
                      onClick={handleBulkDeleteAttendance}
                      className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Trash2 size={14} /> Hapus ({selectedAttendanceIds.length})
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if (selectedAttendanceIds.length === filteredAttendance.length) {
                        setSelectedAttendanceIds([]);
                      } else {
                        setSelectedAttendanceIds(filteredAttendance.map(a => a.id));
                      }
                    }}
                    className="bg-blue-50 text-blue-600 border border-blue-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    {selectedAttendanceIds.length === filteredAttendance.length ? 'Batal Pilih' : 'Pilih Semua'}
                  </button>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-100/50 text-gray-600 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-5 w-10">
                        <input 
                          type="checkbox"
                          checked={filteredAttendance.length > 0 && selectedAttendanceIds.length === filteredAttendance.length}
                          onChange={() => {
                            if (selectedAttendanceIds.length === filteredAttendance.length) {
                              setSelectedAttendanceIds([]);
                            } else {
                              setSelectedAttendanceIds(filteredAttendance.map(a => a.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-8 py-5">Subjek</th>
                      <th className="px-8 py-5">Waktu Presensi</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5 text-center">Dokumentasi</th>
                      <th className="px-8 py-5 text-center">Lokasi</th>
                      <th className="px-8 py-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredAttendance.map((a) => {
                         const student = allUsers.find(u => u.id === a.studentId);
                         return (
                           <tr key={a.id} className={`hover:bg-gray-50/50 transition-colors group ${selectedAttendanceIds.includes(a.id) ? 'bg-blue-50/30' : ''}`}>
                             <td className="px-8 py-6 w-10">
                               <input 
                                 type="checkbox"
                                 checked={selectedAttendanceIds.includes(a.id)}
                                 onChange={() => {
                                   if (selectedAttendanceIds.includes(a.id)) {
                                     setSelectedAttendanceIds(prev => prev.filter(id => id !== a.id));
                                   } else {
                                     setSelectedAttendanceIds(prev => [...prev, a.id]);
                                   }
                                 }}
                                 className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                               />
                             </td>
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
                                (a.status || '').toLowerCase() === 'hadir' ? 'bg-green-100 text-green-700' : 
                                (a.status || '').toLowerCase() === 'sakit' ? 'bg-blue-100 text-blue-700' :
                                (a.status || '').toLowerCase() === 'izin' ? 'bg-purple-100 text-purple-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-center">
                              {a.photo ? (
                                <img 
                                  src={a.photo} 
                                  alt="Absensi" 
                                  className="h-12 w-12 object-cover rounded-2xl border-2 border-white shadow-md mx-auto cursor-pointer hover:scale-110 transition-transform" 
                                  onClick={() => setSelectedPhoto(a.photo)} 
                                />
                              ) : (
                                <span className="text-[10px] font-bold text-gray-300 uppercase italic">Tanpa Foto</span>
                              )}
                            </td>
                            <td className="px-8 py-6 text-center">
                              <a href={`https://www.google.com/maps?q=${a.location?.latitude},${a.location?.longitude}`} target="_blank" rel="noreferrer" className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl inline-flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
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
                              }} className="w-10 h-10 bg-red-50 text-red-400 rounded-xl inline-flex items-center justify-center hover:bg-red-600 hover:text-white transition-all group-hover:shadow-lg">
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredAttendance.map((a) => {
                    const student = allUsers.find(u => u.id === a.studentId);
                    return (
                      <div key={a.id} className="p-5 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-800 text-sm truncate uppercase tracking-tight">{student?.name || 'Unknown'}</h4>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">{student?.role === 'guru' ? 'STAFF GURU' : (student?.kelas || 'SISWA')}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${
                            (a.status || '').toLowerCase() === 'hadir' ? 'bg-green-100 text-green-700' : 
                            (a.status || '').toLowerCase() === 'sakit' ? 'bg-blue-100 text-blue-700' :
                            (a.status || '').toLowerCase() === 'izin' ? 'bg-purple-100 text-purple-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {a.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-white">
                              {a.photo ? (
                                <img 
                                  src={a.photo} 
                                  alt="Absensi" 
                                  className="h-12 w-12 object-cover rounded-xl border border-gray-100 shadow-sm cursor-pointer" 
                                  onClick={() => setSelectedPhoto(a.photo)} 
                                />
                              ) : (
                                <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300">
                                  <Camera size={18} />
                                </div>
                              )}
                            </div>
                            <div>
                               <div className="text-xs font-bold text-gray-600">{a.date}</div>
                               <div className="text-[10px] text-gray-400 font-bold uppercase">{a.timestamp ? new Date(a.timestamp.seconds * 1000).toLocaleTimeString() : ''}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                             <a href={`https://www.google.com/maps?q=${a.location?.latitude},${a.location?.longitude}`} target="_blank" rel="noreferrer" className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center active:bg-blue-600 active:text-white transition-all">
                               <MapPin size={18} />
                             </a>
                             <button onClick={async () => {
                               if(window.confirm('Hapus data absensi ini?')) {
                                 try {
                                   await deleteDoc(doc(db, 'attendance', a.id));
                                   alert('Absensi berhasil dihapus!');
                                 } catch (error) {
                                   handleFirestoreError(error, OperationType.DELETE, `attendance/${a.id}`);
                                 }
                               }
                             }} className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center active:bg-red-600 active:text-white transition-all">
                               <Trash2 size={18} />
                             </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {materialsData.map(mat => {
                const teacher = allUsers.find(u => u.id === mat.teacherId);
                return (
                  <div key={mat.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                       <BookOpen size={64} className="text-blue-500" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full">
                      <h4 className="text-lg font-black text-gray-800 mb-1 leading-tight uppercase tracking-tight">{mat.name}</h4>
                      <p className="text-[10px] text-blue-600 font-extrabold mb-4 uppercase tracking-[0.1em]">{mat.topic || 'Umum'}</p>
                      
                      {mat.tulisanArab && (
                        <div className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                           <p className="text-xl font-arab text-gray-800 leading-relaxed" dir="rtl">{mat.tulisanArab}</p>
                           {mat.terjemahan && <p className="text-[10px] text-gray-400 mt-2 font-bold italic">"{mat.terjemahan}"</p>}
                        </div>
                      )}
                      
                      <div className="mt-auto flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <img src={teacher?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher?.name || 'G')}&background=random`} alt="Teacher" className="w-8 h-8 rounded-xl object-cover shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-gray-800 truncate uppercase tracking-tight">{teacher?.name || 'Unknown'}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{formatDateForUI(mat.createdAt)}</p>
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
                      if (!student || (student.role === 'siswa' && (student.status || 'Aktif') !== 'Aktif')) return false;
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
                      if (!student || (student.role === 'siswa' && (student.status || 'Aktif') !== 'Aktif')) return false;
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
                  .filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif' && studentIdsWithRecords.includes(u.id))
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
                                              <span className="text-xs font-black text-indigo-500">{formatDateForUI(p.createdAt || p.date)}</span>
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
                                              <span className="text-xs font-black text-indigo-500">{formatDateForUI(h.createdAt)}</span>
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

        {activeTab === 'hafalan' && (
          <HafalanTab />
        )}

        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <CreditCard className="text-indigo-600" size={28} />
                  Daftar Transaksi Iuran Siswa
                </h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1 opacity-70">Monitor arus kas, tabungan, & penagihan iuran secara real-time</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={exportFinanceToExcel}
                  className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-200 hover:bg-slate-900 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Download size={18} /> Download Export Rekap Keuangan Lengkap
                </button>
                
                <div className="bg-white p-1.5 rounded-2xl flex flex-wrap gap-1 shadow-sm border border-gray-100">
                  <button
                    type="button"
                    onClick={() => setFinanceSubTab('dashboard')}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${financeSubTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    <BarChart size={14} /> Dashboard Iuran
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinanceSubTab('grup')}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${financeSubTab === 'grup' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    <BookOpen size={14} /> Grup Iuran
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinanceSubTab('validasi')}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 relative ${financeSubTab === 'validasi' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
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
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${financeSubTab === 'riwayat' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    <FileText size={14} /> Arsip Log
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinanceSubTab('setelan')}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${financeSubTab === 'setelan' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    <Settings size={14} /> Setelan
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-[2rem] flex items-center gap-4 group transition-all hover:bg-emerald-100/50">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                  <CreditCard size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-700/60 uppercase tracking-widest mb-0.5">Total Tabungan</p>
                  <h4 className="text-xl font-black text-emerald-900 tracking-tight">Rp {displayTotalTabungan.toLocaleString('id-ID')}</h4>
                </div>
              </div>

              <div className="bg-red-50 border border-red-100 p-5 rounded-[2rem] flex items-center gap-4 group transition-all hover:bg-red-100/50">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-red-600 shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-red-700/60 uppercase tracking-widest mb-0.5">Total Tunggakan</p>
                  <h4 className="text-xl font-black text-red-900 tracking-tight">Rp {displayTotalTunggakan.toLocaleString('id-ID')}</h4>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-[2rem] flex items-center gap-4 group transition-all hover:bg-indigo-100/50">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                  <TrendingUp size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-indigo-700/60 uppercase tracking-widest mb-0.5">Terbayar (Online)</p>
                  <h4 className="text-xl font-black text-indigo-900 tracking-tight truncate">
                    Rp {payments.filter(p => p.status === 'lunas' && p.method === 'Transfer').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toLocaleString('id-ID')}
                  </h4>
                </div>
              </div>
            </div>

              {/* Sub Tab: Dashboard Iuran */}
            {financeSubTab === 'dashboard' && (
              <FinanceRekapTab
                filteredUsersForFinance={filteredUsersForFinance}
                filterFinanceAcademicYear={filterFinanceAcademicYear}
                setFilterFinanceAcademicYear={setFilterFinanceAcademicYear}
                filterFinanceKelas={filterFinanceKelas}
                setFilterFinanceKelas={setFilterFinanceKelas}
                schoolClasses={schoolClasses}
                allFinanceCategories={iuranCategories}
                payments={payments}
                allUsers={allUsers}
                exportFinanceToExcel={exportFinanceToExcel}
                setFilterFinanceStudentName={setFilterFinanceStudentName}
                filterFinanceCategory={filterFinanceCategory}
                setFilterFinanceCategory={setFilterFinanceCategory}
                setFilterFinanceMethod={setFilterFinanceMethod}
                setFilterFinanceStartDate={setFilterFinanceStartDate}
                setFilterFinanceEndDate={setFilterFinanceEndDate}
                setFilterFinanceIuranName={setFilterFinanceIuranName}
                setFilterKeuanganStatus={setFilterKeuanganStatus}
                filterKeuanganStatus={filterKeuanganStatus}
                filterFinanceStudentName={filterFinanceStudentName}
                setSelectedStudentForFinance={setSelectedStudentForFinance}
                setShowManageFinanceModal={setShowManageFinanceModal}
                setFinanceModalMode={setFinanceModalMode}
                setEditingUser={setEditingUser}
                setShowEditUser={setShowEditUser}
                setUserToDelete={setUserToDelete}
                setShowDeleteConfirm={setShowDeleteConfirm}
                getMonthlyFinanceData={getMonthlyFinanceData}
                displayTotalTabungan={displayTotalTabungan}
                displayTotalTunggakan={displayTotalTunggakan}
              />
            )}

            {financeSubTab === 'grup' && (
              <FinanceGrupTab
                iuranCategories={iuranCategories}
                setEditingIuranCategory={setEditingIuranCategory}
                setNewIuranCategoryName={setNewIuranCategoryName}
                setNewIuranCategoryAmount={setNewIuranCategoryAmount}
                setShowIuranCategoryModal={setShowIuranCategoryModal}
                handleDeleteIuranCategory={handleDeleteIuranCategory}
              />
            )}
            {financeSubTab === 'validasi' && (
              <FinanceValidasiTab
                payments={payments}
                allUsers={allUsers}
                setSelectedPhoto={setSelectedPhoto}
                handleApprovePayment={handleApprovePayment}
                handleRejectPayment={handleRejectPayment}
              />
            )}

            {/* Sub Tab: Riwayat Validasi & Pembayaran */}
            {financeSubTab === 'riwayat' && (
              <FinanceRiwayatTab
                searchTransactionText={searchTransactionText}
                setSearchTransactionText={setSearchTransactionText}
                filterLogStatus={filterLogStatus}
                setFilterLogStatus={setFilterLogStatus}
                filterLogStartDate={filterLogStartDate}
                setFilterLogStartDate={setFilterLogStartDate}
                filterLogEndDate={filterLogEndDate}
                setFilterLogEndDate={setFilterLogEndDate}
                payments={payments}
                allUsers={allUsers}
                setSelectedPhoto={setSelectedPhoto}
                handlePrintReceipt={handlePrintReceipt}
              />
            )}

            {/* Sub Tab: Setelan Keuangan */}
            {financeSubTab === 'setelan' && (
              <FinanceSetelanTab
                setShowCategoryModal={setShowCategoryModal}
                handleResetAllFinance={handleResetAllFinance}
                exportFinanceToExcel={exportFinanceToExcel}
                settings={settings}
                setSettings={setSettings}
              />
            )}
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
               <div>
                  <h3 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">Manajemen Informasi</h3>
                  <p className="text-sm text-gray-400 font-medium">Kelola semua broadcast dan pengumuman sekolah.</p>
               </div>
               <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setShowBroadcastPulangModal(true)}
                  className="flex-1 sm:flex-none bg-blue-50 text-blue-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
                >
                  <Megaphone size={18} /> Broadcast Pulang
                </button>
                <button 
                  onClick={() => {
                    setEditingAnnounceId(null);
                    setAnnounceTitle('');
                    setAnnounceContent('');
                    setAnnounceTarget('all');
                    setAnnounceAttachments([]);
                    setShowAnnounceModal(true);
                  }}
                  className="flex-1 sm:flex-none bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all"
                >
                  <Plus size={18} /> Info Baru
                </button>
              </div>
            </div>

            <div className="grid gap-6">
              {announcements.map(a => (
                <div key={a.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative group">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h4 className="font-black text-gray-800 text-lg md:text-xl uppercase tracking-tight">{a.title}</h4>
                      {a.target && a.target !== 'all' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[9px] font-black uppercase tracking-widest rounded-full">
                          Target: {a.target.startsWith('kelas_') ? 'Kelas ' + a.target.replace('kelas_', '').toUpperCase() : a.target.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: a.content }}>
                    </div>

                    {a.attachments && a.attachments.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {a.attachments.map((file: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-bold text-gray-500">
                            {file.type.includes('image') ? <ImageIcon size={12} className="text-blue-400" /> : <FileText size={12} className="text-red-400" />}
                            <span className="max-w-[120px] truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-6 flex items-center gap-2 text-[9px] text-gray-400 uppercase font-black tracking-widest">
                      <span className="text-gray-600">{a.author}</span>
                      <span>•</span>
                      <span>{formatDateForUI(a.createdAt, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="flex md:flex-col gap-2 shrink-0">
                    <button 
                      onClick={() => {
                        setEditingAnnounceId(a.id);
                        setAnnounceTitle(a.title);
                        setAnnounceContent(a.content);
                        setAnnounceTarget(a.target || 'all');
                        setAnnounceAttachments(a.attachments || []);
                        setShowAnnounceModal(true);
                      }}
                      className="w-12 h-12 bg-blue-50 text-blue-500 hover:bg-blue-600 hover:text-white rounded-2xl transition-all flex items-center justify-center shadow-sm border border-blue-100"
                    >
                      <Edit size={20} />
                    </button>
                    <button 
                      onClick={async () => {
                        if(window.confirm('Hapus pengumuman ini?')) {
                          try {
                            await deleteDoc(doc(db, 'announcements', a.id));
                            alert('Pengumuman berhasil dihapus!');
                          } catch (error) {
                            handleFirestoreError(error, OperationType.DELETE, `announcements/${a.id}`);
                          }
                        }
                      }} 
                      className="w-12 h-12 bg-red-50 text-red-400 hover:bg-red-600 hover:text-white rounded-2xl transition-all flex items-center justify-center shadow-sm border border-red-100"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-gray-100 text-center flex flex-col items-center justify-center gap-4">
                   <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                      <Megaphone size={40} />
                   </div>
                   <p className="text-gray-400 font-black text-sm uppercase tracking-widest">Belum ada pengumuman yang dikirim</p>
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-hidden">
            <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2rem] p-6 md:p-8 shadow-2xl relative">
              <button 
                onClick={() => { setShowEditUser(false); setEditingUser(null); }} 
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl active:scale-95 transition-all z-10"
              >
                <X size={18} />
              </button>
              <h3 className="text-xl md:text-2xl font-black text-gray-800 mb-6 tracking-tight uppercase">Edit Data User</h3>
              <form onSubmit={handleEditUser} className="space-y-4 md:space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <input type="text" value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-gray-700 font-sans" required />
                </div>
                <div className="space-y-1.5 opacity-60">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email (Akun Utama)</label>
                  <input type="email" value={editingUser.email} disabled className="w-full p-3.5 bg-gray-100 border-none rounded-xl md:rounded-2xl outline-none text-[11px] text-gray-400 cursor-not-allowed font-medium font-sans" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role Jabatan</label>
                  <select value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-gray-700 cursor-pointer appearance-none font-sans">
                    <option value="siswa">Siswa</option>
                    <option value="guru">Guru</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {editingUser.role === 'siswa' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status Keaktifan</label>
                      <select value={editingUser.status || 'Aktif'} onChange={(e) => setEditingUser({...editingUser, status: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-gray-700 cursor-pointer appearance-none font-sans" required>
                        <option value="Aktif">Aktif</option>
                        <option value="Tidak Aktif">Tidak Aktif</option>
                        <option value="Pindah">Pindah Sekolah</option>
                        <option value="Alumni">Alumni / Lulus</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Penempatan Kelas</label>
                      <select value={editingUser.kelas || ''} onChange={(e) => setEditingUser({...editingUser, kelas: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-gray-700 cursor-pointer appearance-none font-sans" required>
                        <option value="">-- Pilih Kelas --</option>
                        {schoolClasses.map((c: any) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. WhatsApp Orang Tua</label>
                      <input type="text" value={editingUser.whatsapp || ''} onChange={(e) => setEditingUser({...editingUser, whatsapp: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-gray-700 font-sans" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tempat Lahir</label>
                        <input type="text" value={editingUser.tempatLahir || ''} onChange={(e) => setEditingUser({...editingUser, tempatLahir: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-[11px] text-gray-700 font-sans" placeholder="Cirebon" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Lahir</label>
                        <input type="date" value={editingUser.tanggalLahir || ''} onChange={(e) => setEditingUser({...editingUser, tanggalLahir: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-[11px] text-gray-700 font-sans" />
                      </div>
                    </div>
                  </div>
                )}
                {editingUser.role === 'guru' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipe Guru</label>
                      <select value={editingUser.teacherType || 'Guru Kelas'} onChange={(e) => setEditingUser({...editingUser, teacherType: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-gray-700 appearance-none font-sans" required>
                        <option value="Wali Kelas">Wali Kelas</option>
                        <option value="Guru Kelas">Guru Kelas</option>
                        <option value="Guru Bidang">Guru Bidang</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unit / Kelas Tugas</label>
                      <select value={editingUser.assignedClass || ''} onChange={(e) => setEditingUser({...editingUser, assignedClass: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-gray-700 appearance-none font-sans">
                        <option value="">-- Pilih Unit/Kelas --</option>
                        {schoolClasses.map((c: any) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                <div className="pt-4">
                  <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-95 transition-all">Simpan Perubahan</button>
                </div>
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
                      onClick={() => setShowIuranCategoryModal(true)}
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
                        if (cat) {
                          setFinanceIuranName(cat.name);
                          if (cat.amount) setFinanceAmount(cat.amount.toString());
                        }
                      }} 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
                    >
                      <option value="">-- Tanpa Kategori (Umum) --</option>
                      {iuranCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name} {cat.amount ? ` - Rp ${Number(cat.amount).toLocaleString('id-ID')}` : ''}</option>
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Siswa / Penerima Tagihan</label>
                  <select 
                    value={financeIuranTarget} 
                    onChange={(e) => setFinanceIuranTarget(e.target.value)} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold mb-3" 
                    required
                  >
                    <option value="all">Semua Siswa Aktif</option>
                    {schoolClasses.map(c => (
                      <option key={`target_kelas_${c.id}`} value={`kelas_${c.name}`}>Satu Kelas: {c.name}</option>
                    ))}
                    <option value="specific">Pilih Siswa Secara Spesifik</option>
                  </select>

                  {financeIuranTarget === 'specific' && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="text"
                          placeholder="Cari nama siswa..."
                          value={searchStudentIuran}
                          onChange={(e) => setSearchStudentIuran(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto bg-gray-50 border border-gray-200 rounded-xl p-2 space-y-1">
                        {allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif' && (!searchStudentIuran || u.name.toLowerCase().includes(searchStudentIuran.toLowerCase()))).map(u => (
                          <label key={u.id} className="flex items-center gap-3 p-2.5 hover:bg-blue-50 rounded-lg cursor-pointer group transition-colors">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={financeIuranStudentIds.includes(u.id)}
                              onChange={(e) => {
                                if (e.target.checked) setFinanceIuranStudentIds([...financeIuranStudentIds, u.id]);
                                else setFinanceIuranStudentIds(financeIuranStudentIds.filter(id => id !== u.id));
                              }}
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-gray-800 group-hover:text-blue-700">{u.name}</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{u.kelas || 'N/A'}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-2 px-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{financeIuranStudentIds.length} Siswa Terpilih</p>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setFinanceIuranStudentIds(allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif').map(u => u.id))} className="text-[9px] font-black text-blue-600 border-b border-blue-600 uppercase tracking-widest">Pilih Semua</button>
                          <button type="button" onClick={() => setFinanceIuranStudentIds([])} className="text-[9px] font-black text-red-500 border-b border-red-500 uppercase tracking-widest">Reset</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button type="submit" className="w-full px-6 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-900 shadow-xl shadow-blue-100 transition-all active:scale-95">
                  Proses & Terbitkan Tagihan
                </button>
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-2 md:p-4 overflow-hidden">
            <div className="bg-[#F8FAFC] w-full max-w-4xl rounded-[2.5rem] md:rounded-[3rem] shadow-2xl relative max-h-[96vh] md:max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
              {/* Header */}
              <div className="bg-white px-6 md:px-10 py-5 md:py-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-50 rounded-xl md:rounded-[1.5rem] flex items-center justify-center text-indigo-600 font-black text-xl md:text-2xl shadow-sm border border-indigo-100">
                    {selectedStudentForFinance.name?.charAt(0)}
                  </div>
                  <div className="max-w-[150px] sm:max-w-none">
                    <h3 className="text-sm md:text-2xl font-black text-gray-800 tracking-tight uppercase truncate">{selectedStudentForFinance.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1 md:mt-1.5">
                      <span className="px-2 md:px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-slate-200/50">KLS: {selectedStudentForFinance.kelas || 'N/A'}</span>
                      <span className="px-2 md:px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-indigo-100">NISN: {selectedStudentForFinance.nisn || '-'}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowManageFinanceModal(false)} 
                  className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 text-slate-400 rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
                >
                  <X size={18} />
                </button>
              </div>
              
              {/* Modal Tabs */}
              <div className="bg-white px-6 md:px-10 border-b border-gray-100 flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => setFinanceModalMode('detail')}
                  className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${financeModalMode === 'detail' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                  Detail & Riwayat
                </button>
                <button 
                  onClick={() => setFinanceModalMode('bayar')}
                  className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${financeModalMode === 'bayar' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                  Setoran & Bayar
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 md:p-10 space-y-8 md:space-y-10 custom-scrollbar">
                {financeModalMode === 'bayar' ? (
                  /* Stats Grid (Bayar Mode) */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* Tabungan Panel */}
                    <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Tabungan</p>
                          <h4 className="text-xl md:text-3xl font-black text-emerald-600 tracking-tight">Rp {(selectedStudentForFinance.savings || 0).toLocaleString('id-ID')}</h4>
                        </div>
                        <button 
                          onClick={() => {
                            const newVal = window.prompt("Nominal tabungan baru (Setel ulang):", selectedStudentForFinance.savings?.toString() || "0");
                            if (newVal !== null && !isNaN(Number(newVal))) {
                              updateFinance(selectedStudentForFinance.id, 'savings', newVal, "Koreksi saldo admin");
                              setSelectedStudentForFinance((prev: any) => ({ ...prev, savings: Number(newVal) }));
                            }
                          }}
                          className="w-8 h-8 md:w-9 md:h-9 bg-emerald-50 text-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-sm"
                        >
                          <Edit size={14} />
                        </button>
                      </div>

                      <div className="bg-slate-50 p-5 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 space-y-3">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"> <PlusCircle size={12} /> Setoran Cepat</p>
                          <div className="flex flex-col gap-2">
                             <input 
                               type="number" id="update-savings" placeholder="Nominal Rp"
                               className="w-full text-[11px] md:text-xs p-3 md:p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold font-sans"
                             />
                             <input 
                               type="text" id="update-savings-desc" placeholder="Keterangan setoran..."
                               className="w-full text-[11px] md:text-xs p-3 md:p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold font-sans"
                             />
                             <button 
                               onClick={() => {
                                 const val = (document.getElementById('update-savings') as HTMLInputElement).value;
                                 const desc = (document.getElementById('update-savings-desc') as HTMLInputElement).value;
                                 if(val) {
                                   handleAddSingleTabungan(selectedStudentForFinance.id, val, desc || 'Setoran manual');
                                   (document.getElementById('update-savings') as HTMLInputElement).value = '';
                                   (document.getElementById('update-savings-desc') as HTMLInputElement).value = '';
                                 }
                               }}
                               className="w-full bg-emerald-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg active:scale-95 transition-all font-sans"
                             >
                               Konfirmasi
                             </button>
                          </div>
                      </div>
                    </div>

                    {/* Tunggakan Panel */}
                    <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Tunggakan</p>
                          <h4 className="text-xl md:text-3xl font-black text-red-500 tracking-tight">Rp {(selectedStudentForFinance.arrears || 0).toLocaleString('id-ID')}</h4>
                        </div>
                        <button 
                          onClick={() => {
                            const newVal = window.prompt("Nominal tunggakan baru (Setel ulang):", selectedStudentForFinance.arrears?.toString() || "0");
                            if (newVal !== null && !isNaN(Number(newVal))) {
                              updateFinance(selectedStudentForFinance.id, 'arrears', newVal, "Koreksi tunggakan admin");
                              setSelectedStudentForFinance((prev: any) => ({ ...prev, arrears: Number(newVal) }));
                            }
                          }}
                          className="w-8 h-8 md:w-9 md:h-9 bg-red-50 text-red-500 rounded-lg md:rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-sm"
                        >
                          <Edit size={14} />
                        </button>
                      </div>

                      <div className="bg-slate-50 p-5 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 space-y-3">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"> <AlertCircle size={12} /> Buat Tagihan</p>
                         <div className="flex flex-col gap-2">
                            <input 
                              type="number" id="update-arrears" placeholder="Rp"
                              className="w-full text-[11px] md:text-xs p-3 md:p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 font-bold font-sans"
                            />
                            <input 
                              type="text" id="update-arrears-desc" placeholder="Keterangan..."
                              className="w-full text-[11px] md:text-xs p-3 md:p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 font-bold font-sans"
                            />
                            <button 
                              onClick={() => {
                                const val = (document.getElementById('update-arrears') as HTMLInputElement).value;
                                const desc = (document.getElementById('update-arrears-desc') as HTMLInputElement).value;
                                if(val && desc) {
                                  handleAddSingleTunggakan(selectedStudentForFinance.id, val, desc);
                                  (document.getElementById('update-arrears') as HTMLInputElement).value = '';
                                  (document.getElementById('update-arrears-desc') as HTMLInputElement).value = '';
                                }
                              }}
                              className="w-full bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 transition-all font-sans"
                            >
                              Tambah Tagihan
                            </button>
                         </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Detail Mode */
                  <div className="space-y-8 md:space-y-10">
                    {/* Arrears Details & Payments */}
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
                       <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                               <FileText size={16} />
                            </div>
                            <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Rincian Komponen Tagihan</h4>
                          </div>
                          <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                            {selectedStudentForFinance.arrears_details?.length || 0} ITEM
                          </span>
                       </div>
                       <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto custom-scrollbar">
                          {(selectedStudentForFinance.arrears_details || []).length === 0 ? (
                            <div className="p-12 text-center text-gray-300 font-black text-[10px] uppercase tracking-widest italic opacity-40">
                               Tidak ada tagihan aktif
                            </div>
                          ) : (
                            selectedStudentForFinance.arrears_details.map((item: any, i: number) => (
                               <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                  <div className="flex items-center gap-4">
                                     <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400">
                                        {i + 1}
                                     </div>
                                     <div className="flex flex-col">
                                        <span className="font-black text-gray-800 text-xs uppercase tracking-tighter">{item.name}</span>
                                        <span className="text-[9px] font-bold text-gray-400 mt-0.5 tracking-widest">{item.date || 'Tagihan Aktif'}</span>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-8 text-right">
                                     <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Nominal</p>
                                        <p className="font-black text-red-500 text-xs uppercase">Rp {Number(item.amount).toLocaleString('id-ID')}</p>
                                     </div>
                                     <div className="flex items-center gap-2">
                                        <button 
                                          onClick={() => handleOneClickPaymentFromTabungan(selectedStudentForFinance, item)}
                                          disabled={(selectedStudentForFinance.savings || 0) < Number(item.amount)}
                                          className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-30 disabled:grayscale shrink-0 border border-indigo-100"
                                        >
                                          Potong Tabungan
                                        </button>
                                        <button 
                                          onClick={() => handleOneClickPayment(selectedStudentForFinance, item)}
                                          className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shrink-0"
                                        >
                                          Bayar Tunai
                                        </button>
                                     </div>
                                  </div>
                               </div>
                            ))
                          )}
                       </div>
                    </div>

                    {/* History Section */}
                    <div className="bg-slate-50 border border-gray-100 rounded-[2.5rem] p-8 space-y-6">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white text-slate-400 rounded-lg flex items-center justify-center border border-slate-100">
                               <HistoryIcon size={16} />
                            </div>
                            <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Riwayat Transaksi Terakhir</h4>
                         </div>
                       </div>
                       <div className="space-y-3">
                          {payments.filter(p => p.studentId === selectedStudentForFinance.id).slice(0, 10).length === 0 ? (
                            <div className="p-8 text-center text-gray-300 font-black text-[10px] uppercase tracking-widest italic opacity-40">
                               Belum ada riwayat transaksi
                            </div>
                          ) : (
                            payments.filter(p => p.studentId === selectedStudentForFinance.id).slice(0, 10).map(p => (
                              <div key={p.id} className="bg-white p-4 rounded-2xl border border-white flex items-center justify-between shadow-sm">
                                 <div className="flex items-center gap-4">
                                    <span className={`w-2 h-2 rounded-full ${p.status === 'lunas' ? 'bg-emerald-500' : p.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                                    <div className="flex flex-col">
                                       <span className="font-black text-gray-800 text-[10px] uppercase tracking-tighter">{p.iuranName || p.type}</span>
                                       <span className="text-[9px] font-bold text-gray-400 tracking-widest italic">{formatDateForUI(p.createdAt || p.timestamp || p.date)} - {p.method} {p.description ? `(${p.description})` : ''}</span>
                                    </div>
                                 </div>
                                 <span className="font-black text-slate-700 text-[10px]">Rp {Number(p.amount).toLocaleString('id-ID')}</span>
                              </div>
                            ))
                          )}
                       </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Footer Actions */}
              <div className="bg-white px-10 py-8 border-t border-gray-100 flex items-center justify-between shrink-0">
                 <button 
                   onClick={() => handleWhatsAppFollowUp(selectedStudentForFinance, selectedStudentForFinance.arrears_details?.[0])}
                   className="px-6 py-4 bg-green-50 text-green-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all flex items-center gap-2 border border-green-100"
                 >
                   <Megaphone size={16} /> Kirim WhatsApp Tagihan
                 </button>
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setShowManageFinanceModal(false)}
                      className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                      Tutup
                    </button>
                 </div>
              </div>
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
            <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowAnnounceModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{editingAnnounceId ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}</h3>
              <p className="text-xs text-gray-400 mb-6 font-medium uppercase tracking-widest">Format dokumen resmi sekolah</p>
              
              <form onSubmit={handleAddAnnouncement} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Penerima / Target</label>
                     <select value={announceTarget} onChange={(e) => setAnnounceTarget(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm">
                       <option value="all">Semua Pengguna</option>
                       <option value="guru">Khusus Guru</option>
                       {schoolClasses.map(c => (
                         <option key={c.id} value={`kelas_${c.name}`}>Khusus Kelas: {c.name}</option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Judul Pengumuman</label>
                     <input 
                       type="text" 
                       value={announceTitle} 
                       onChange={(e) => setAnnounceTitle(e.target.value)} 
                       className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" 
                       placeholder="Contoh: Pemberitahuan Libur Semester"
                       required 
                     />
                   </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Isi Pengumuman (Word Style)</label>
                   <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden quill-container">
                      <ReactQuill 
                        theme="snow"
                        value={announceContent}
                        onChange={setAnnounceContent}
                        placeholder="Tulis pengumuman di sini..."
                        className="quill-editor"
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'align': [] }],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            [{ 'color': [] }, { 'background': [] }],
                            ['link', 'clean']
                          ],
                        }}
                      />
                   </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Lampiran (Gambar/PDF)</label>
                   <div className="flex flex-wrap gap-3 mb-3">
                      {announceAttachments.map((file, idx) => (
                         <div key={idx} className="bg-blue-50 text-blue-600 px-3 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 border border-blue-100 group">
                            {file.type.includes('image') ? <ImageIcon size={14} /> : <FileText size={14} />}
                            <span className="max-w-[100px] truncate">{file.name}</span>
                            <button 
                              type="button" 
                              onClick={() => setAnnounceAttachments(prev => prev.filter((_, i) => i !== idx))}
                              className="text-blue-300 hover:text-red-500 transition-colors"
                            >
                               <X size={14} />
                            </button>
                         </div>
                      ))}
                   </div>
                   <input 
                     type="file" 
                     ref={announceFileRef} 
                     onChange={handleAnnounceFileChange} 
                     className="hidden" 
                     accept="image/*,application/pdf"
                     multiple
                   />
                   <button 
                     type="button"
                     onClick={() => announceFileRef.current?.click()}
                     className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all text-xs font-bold"
                   >
                      <Plus size={16} /> Tambah Lampiran (Max 800KB)
                   </button>
                </div>

                <div className="flex items-center gap-4 pt-4">
                   <button type="button" onClick={() => {
                     setShowAnnounceModal(false);
                     setEditingAnnounceId(null);
                   }} className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">Batal</button>
                   <button type="submit" className="flex-[2] px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2">
                      <Megaphone size={16} /> {editingAnnounceId ? 'Perbarui Pengumuman' : 'Kirim Pengumuman'}
                   </button>
                </div>
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

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 shadow-inner">
                  <Settings size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight">Pengaturan Keamanan & Database</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Kelola data krusial dan utilitas sistem</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-red-50 border border-red-100 rounded-[2rem] flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black text-red-800 uppercase tracking-tight mb-2">Reset Total Keuangan</h3>
                    <p className="text-xs text-red-600 font-medium leading-relaxed opacity-80">
                      Tindakan ini akan mengosongkan seluruh data tunggakan siswa, saldo tabungan, dan riwayat pembayaran digital maupun tunai secara permanen. Gunakan hanya saat pergantian tahun ajaran baru atau audit total.
                    </p>
                  </div>
                  <div className="mt-8">
                    <button 
                      onClick={handleResetAllFinance}
                      className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <RefreshCw size={18} /> Reset Semua Keuangan Siswa
                    </button>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2rem] flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Backup Database Dasar</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed opacity-80">
                      Selalu lakukan backup berkala dengan mengunduh seluruh data dalam format Excel melalui tombol Export di setiap halaman (User, Absensi, Administrasi).
                    </p>
                  </div>
                  <div className="mt-8">
                    <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 italic text-[10px] font-medium justify-center">
                      <AlertCircle size={14} /> Gunakan tombol Export di masing-masing menu.
                    </div>
                  </div>
                </div>
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

      {/* Iuran Category Modal (GRUP IURAN) */}
      {showIuranCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowIuranCategoryModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
            
            <div className="mb-8">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <BookOpen size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">{editingIuranCategory ? 'Edit Grup Iuran' : 'Tambah Grup Iuran'}</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Grup digunakan untuk kategorisasi & nominal standar</p>
            </div>

            <form onSubmit={handleSaveIuranCategory} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Grup Iuran</label>
                <input 
                  type="text" 
                  value={newIuranCategoryName} 
                  onChange={(e) => setNewIuranCategoryName(e.target.value)} 
                  placeholder="Contoh: SPP BULANAN" 
                  required 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-black text-gray-700 placeholder:text-slate-300"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nominal Standar (Rp)</label>
                <input 
                  type="number" 
                  value={newIuranCategoryAmount} 
                  onChange={(e) => setNewIuranCategoryAmount(e.target.value)} 
                  placeholder="Contoh: 150000" 
                  required 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-black text-gray-700 placeholder:text-slate-300"
                />
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <Save size={18} /> Simpan Grup Iuran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

const MapPin = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);
