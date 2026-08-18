import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, getDoc, doc, updateDoc, deleteDoc, orderBy, where, getDocs, setDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { Users, BookOpen, Plus, Trash2, Edit, LogOut, User, Bell, CheckCircle, X, Menu, Save, Camera, Clock, BarChart as BarChartIcon, TrendingUp, Printer, Star, Megaphone, GraduationCap, Calendar, Search, Filter, Image as ImageIcon, FileText, Download, ExternalLink, RefreshCw, ChevronDown, ChevronRight, HelpCircle, ShieldCheck, Sparkles, Award, Wallet, FileCheck } from 'lucide-react';
import KaldikIframe from './KaldikIframe';
import { staticHafalanMaterials as initialHafalanMaterials, StudentHafalanProgress, HafalanStatus, getNextMaterialId } from '../data/hafalanData';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import KaldikCalendar from './KaldikCalendar';
import { compressImage } from '../lib/imageUtils';
import { getPrintHeaderHTML, getPrintStyles, getPrintSignatureHTML } from '../lib/printUtils';
import HafalanTab from './admin/tabs/HafalanTab';
import HafalanProgressTab from './admin/tabs/HafalanProgressTab';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

export default function DashboardGuru() {
 const [user, setUser] = useState<any>(null);
 const [userData, setUserData] = useState<any>(null);
 const [students, setStudents] = useState<any[]>([]);
 const [allStudents, setAllStudents] = useState<any[]>([]);
 const [progress, setProgress] = useState<any[]>([]);
 const [kaldikData, setKaldikData] = useState<any[]>([]);
 const [materialsData, setMaterialsData] = useState<any[]>([]);
 const [hafalanProgress, setHafalanProgress] = useState<StudentHafalanProgress[]>([]);
 const [hafalanMaterials, setHafalanMaterials] = useState<any[]>(initialHafalanMaterials);
 const [announcements, setAnnouncements] = useState<any[]>([]);
 const [exams, setExams] = useState<any[]>([]);
 const [attendance, setAttendance] = useState<any[]>([]);
 const [subjects, setSubjects] = useState<any[]>([]);
 const [hiddenSubjects, setHiddenSubjects] = useState<string[]>([]);
 const [settings, setSettings] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'students', 'kaldik', 'penilaian-kelas', 'progress', 'exams', 'hafalan', 'attendance', 'announcements', 'profile'
 const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 const profileFileInputRef = useRef<HTMLInputElement>(null);
 
 // Form States
 const [showProgressModal, setShowProgressModal] = useState(false);
 const [editingProgress, setEditingProgress] = useState<any>(null);
 const [rapotSearch, setRapotSearch] = useState('');
 const [rapotPeriod, setRapotPeriod] = useState('Semua');
 const [selectedStudent, setSelectedStudent] = useState('');
 const [progressTitle, setProgressTitle] = useState('');
 const [progressCategory, setProgressCategory] = useState('');
 const [progressEvaluationPeriod, setProgressEvaluationPeriod] = useState('Harian');
 const [progressDesc, setProgressDesc] = useState('');
 const [progressTarget, setProgressTarget] = useState('');
 const [progressStatus, setProgressStatus] = useState('Lulus');
 const [progressScore, setProgressScore] = useState<number>(90); // Penilaian A,B,C,D
 const [progressDate, setProgressDate] = useState(new Date().toISOString().split('T')[0]);
 const [newSubjectName, setNewSubjectName] = useState('');
 const [showSubjectModal, setShowSubjectModal] = useState(false);
 const [evaluateHafalan, setEvaluateHafalan] = useState<StudentHafalanProgress | null>(null);
 const [showHafalanModal, setShowHafalanModal] = useState(false);
 const [hafalanEvalStars, setHafalanEvalStars] = useState<number>(0);
 const [hafalanSubTab, setHafalanSubTab] = useState<'eval' | 'modul' | 'all'>('eval');
 const [hafalanEvalNotes, setHafalanEvalNotes] = useState('');
 const [hafalanEvalStatus, setHafalanEvalStatus] = useState<HafalanStatus>('Sedang Menghafal');
 const [hafalanEvalSemester, setHafalanEvalSemester] = useState<any>('PTS Ganjil');
 const [editingSubject, setEditingSubject] = useState<any>(null);
 
 // Materials States
 const [showMaterialModal, setShowMaterialModal] = useState(false);
 const [newMaterial, setNewMaterial] = useState({ name: '', topic: '', tulisanArab: '', terjemahan: '' });
 const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);

 const [editName, setEditName] = useState('');
 const [editPhoto, setEditPhoto] = useState('');
 const [newPassword, setNewPasswordProfile] = useState('');
 const [confirmPassword, setConfirmPasswordProfile] = useState('');
 const [selectedStudentForRapot, setSelectedStudentForRapot] = useState<any>(null);
 const [showPrintRapotModal, setShowPrintRapotModal] = useState(false);
 const [showPrintRapotHafalanModal, setShowPrintRapotHafalanModal] = useState(false);
 const [printRapotPeriod, setPrintRapotPeriod] = useState('PTS Ganjil');
 const [printRapotHafalanSemester, setPrintRapotHafalanSemester] = useState('Semua');

 // Camera States
 const [showCamera, setShowCamera] = useState(false);
 const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
 const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
 const [attendanceStatus, setAttendanceStatus] = useState('Hadir'); // Hadir, Sakit, Izin, TK
 const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
 const videoRef = useRef<HTMLVideoElement>(null);

 useEffect(() => {
 if (attendance && user) {
 const today = new Date().toISOString().split('T')[0];
 const todayAbsence = attendance.find(a => a.date === today && a.studentId === user.uid);
 setHasCheckedInToday(!!todayAbsence);
 }
 }, [attendance, user]);
 const canvasRef = useRef<HTMLCanvasElement>(null);
 
 const [searchStudentProgress, setSearchStudentProgress] = useState('');
 
 // Photo Viewer State
 const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
 
 const [filterName, setFilterName] = useState('');
 const [filterKelas, setFilterKelas] = useState('');

 useEffect(() => {
 // Prevent back button from exiting the app
 window.history.pushState(null, '', window.location.href);
 const handlePopState = () => {
 window.history.pushState(null, '', window.location.href);
 };
 window.addEventListener('popstate', handlePopState);
 return () => window.removeEventListener('popstate', handlePopState);
 }, []);

 // Editor settings for DashboardGuru.tsx
 const [filterKelasHafalan, setFilterKelasHafalan] = useState('');
 const [filterHafalanStatus, setFilterHafalanStatus] = useState('Semua'); // 'Semua', 'Sudah Setor', 'Belum Setor'
 const [filterHafalanCategory, setFilterHafalanCategory] = useState('Semua Kategori'); // 'Semua Kategori', 'Surat Pendek', 'Hadist', 'Doa Sehari-hari', 'Bacaan Sholat'

 // Penilaian Siswa States
 const [pkType, setPkType] = useState<'Hafalan'|'Rapot'>('Hafalan');
 const [pkRapotPeriod, setPkRapotPeriod] = useState('PTS Ganjil');
 const [pkClass, setPkClass] = useState('');
 const [pkMaterialId, setPkMaterialId] = useState('');
 const [pkCategory, setPkCategory] = useState('');
 const [pkDate, setPkDate] = useState(new Date().toISOString().split('T')[0]);
 const [pkSemester, setPkSemester] = useState<any>('PTS Ganjil');
 const [pkStudentData, setPkStudentData] = useState<Record<string, any>>({});
 const [pkIsSaving, setPkIsSaving] = useState(false);
 const [pkSearch, setPkSearch] = useState('');
 const [pkFilterUnfinished, setPkFilterUnfinished] = useState(false);

 const [schoolClasses, setSchoolClasses] = useState<any[]>([]);

 const navigate = useNavigate();

 useEffect(() => {
 const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
 if (currentUser) {
 try {
 const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
 const data = userDoc.data();
 if (!data || data.role !== 'guru') {
 navigate('/login');
 return;
 }
 
 setUser(currentUser);
 setUserData(data);
 setEditName(data.name || '');
 setEditPhoto(data.photoURL || '');
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
 // Filter out non-active students explicitly on client side (since we don't have composite index for status)
 const mapped = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
 setAllStudents(mapped);
 setStudents(mapped.filter(u => {
 const isActive = (u.status || 'Aktif') === 'Aktif';
 const userClass = userData?.assignedClass || userData?.kelas;
 const isSameClass = userClass ? (
 u.kelas === userClass ||
 (u.kelas || '').trim().toLowerCase() === userClass.trim().toLowerCase() ||
 (u.kelas || '').toLowerCase().includes(userClass.toLowerCase()) ||
 userClass.toLowerCase().includes((u.kelas || '').toLowerCase())
 ) : true;
 return isActive && isSameClass;
 }));
 }, (error) => {
 handleFirestoreError(error, OperationType.LIST, 'users');
 });

 const unsubProgress = onSnapshot(query(collection(db, 'progress'), orderBy('createdAt', 'desc')), (snapshot) => {
 setProgress(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 }, (error) => {
 handleFirestoreError(error, OperationType.LIST, 'progress');
 });

 const unsubHafalanProgress = onSnapshot(collection(db, 'hafalan_progress'), (snapshot) => {
 setHafalanProgress(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentHafalanProgress)));
 }, (error) => {
 handleFirestoreError(error, OperationType.LIST, 'hafalan_progress');
 });

 const unsubAnnounce = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), (snapshot) => {
 setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 }, (error) => {
 handleFirestoreError(error, OperationType.LIST, 'announcements');
 });

 const unsubExams = onSnapshot(query(collection(db, 'exams'), orderBy('createdAt', 'desc')), (snapshot) => {
 setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 }, (error) => {
 handleFirestoreError(error, OperationType.LIST, 'exams');
 });

 const unsubAttendance = onSnapshot(query(collection(db, 'attendance'), orderBy('timestamp', 'desc')), (snapshot) => {
 setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 setLoading(false);
 }, (error) => {
 handleFirestoreError(error, OperationType.LIST, 'attendance');
 setLoading(false);
 });

 const unsubSubjects = onSnapshot(query(collection(db, 'subjects'), orderBy('createdAt', 'desc')), (snapshot) => {
 setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 }, (error) => {
 handleFirestoreError(error, OperationType.LIST, 'subjects');
 });

 const unsubSubjectsConfig = onSnapshot(doc(db, 'settings', 'subjectsConfig'), (snap) => {
 if (snap.exists() && Array.isArray(snap.data().hiddenSubjects)) {
 setHiddenSubjects(snap.data().hiddenSubjects);
 }
 }, (error) => {
 // Ignore config snapshot errors gracefully
 });

 const unsubClasses = onSnapshot(query(collection(db, 'classes')), (snapshot) => {
 setSchoolClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 }, (error) => {
 handleFirestoreError(error, OperationType.LIST, 'classes');
 });

 const unsubSettings = onSnapshot(doc(db, 'settings', 'landingPage'), (snap) => {
 if (snap.exists()) {
 setSettings(snap.data());
 }
 }, (error) => {
 handleFirestoreError(error, OperationType.GET, 'settings/landingPage');
 });

 const unsubKaldik = onSnapshot(query(collection(db, 'kaldik')), (snapshot) => {
 setKaldikData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 }, (error) => {
 handleFirestoreError(error, OperationType.LIST, 'kaldik');
 });

 const unsubMaterials = onSnapshot(query(collection(db, 'materials'), orderBy('createdAt', 'desc')), (snapshot) => {
 setMaterialsData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 }, (error) => {
 handleFirestoreError(error, OperationType.LIST, 'materials');
 });

 const unsubHafalanMaterials = onSnapshot(collection(db, 'hafalan_materials'), (snapshot) => {
 if (snapshot.empty) {
 setHafalanMaterials(initialHafalanMaterials);
 } else {
 const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
 // Sort client-side
 const sortedDocs = [...docs].sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
 setHafalanMaterials(sortedDocs);
 }
 }, (error) => {
 handleFirestoreError(error, OperationType.LIST, 'hafalan_materials');
 });

 return () => {
 unsubStudents();
 unsubProgress();
 unsubHafalanProgress();
 unsubAnnounce();
 unsubExams();
 unsubAttendance();
 unsubSubjects();
 unsubSubjectsConfig();
 unsubClasses();
 unsubSettings();
 unsubKaldik();
 unsubMaterials();
 unsubHafalanMaterials();
 };
 }, [user, userData?.assignedClass, userData?.kelas]);

 useEffect(() => {
 if (!allStudents.length) return;
 const userClass = userData?.assignedClass || userData?.kelas;
 if (userClass && !filterKelasHafalan) {
 setFilterKelasHafalan(userClass);
 }
 setStudents(allStudents.filter(u => {
 const isActive = (u.status || 'Aktif') === 'Aktif';
 const isSameClass = userClass ? (
 u.kelas === userClass ||
 (u.kelas || '').trim().toLowerCase() === userClass.trim().toLowerCase() ||
 (u.kelas || '').toLowerCase().includes(userClass.toLowerCase()) ||
 userClass.toLowerCase().includes((u.kelas || '').toLowerCase())
 ) : true;
 return isActive && isSameClass;
 }));
 }, [allStudents, userData]);

 useEffect(() => {
 if (activeTab !== 'penilaian-kelas') return;
 
 // Auto set class to teacher's class if available and not yet set
 const userClass = userData?.assignedClass || userData?.kelas;
 if (!pkClass && userClass) {
 setPkClass(userClass);
 }
 
 // Default class if none text
 const clsFilter = pkClass || userClass || '';

 // Reset material if class changes and it doesn't match
 if (pkType === 'Hafalan' && pkMaterialId && clsFilter && clsFilter !== 'Semua') {
 const material = hafalanMaterials.find(m => m.id === pkMaterialId);
 const isMatch = (mK: string, tK: string) => {
 const k1 = mK.toLowerCase().trim();
 const k2 = tK.toLowerCase().trim();
 return k1.includes(k2) || k2.includes(k1);
 };
 if (material && !isMatch(material.kelas, clsFilter)) {
 setPkMaterialId('');
 }
 }

 if (!clsFilter) return;

 if (pkType === 'Hafalan' && pkMaterialId) {
 const clsStudents = students.filter(s => s.kelas === clsFilter || clsFilter === 'Semua');
 const newData: Record<string, any> = {};
 clsStudents.forEach(s => {
 // Find existing record for this student & material
 const existingList = hafalanProgress.filter(p => p.studentId === s.id && p.materialId === pkMaterialId);
 // Find the one that's not readyForTest or the primary one
 const existing = existingList.sort((a,b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0];

 if (existing) {
 newData[s.id] = {
 id: existing.id,
 status: existing.status || 'Sedang Menghafal',
 stars: existing.stars || 0,
 notes: existing.catatanGuru || ''
 };
 } else {
 newData[s.id] = {
 id: null,
 status: 'Sedang Menghafal',
 stars: 0,
 notes: ''
 };
 }
 });
 setPkStudentData(newData);
 } else if (pkType === 'Rapot' && pkCategory) {
 const clsStudents = students.filter(s => s.kelas === clsFilter || clsFilter === 'Semua');
 const newData: Record<string, any> = {};
 clsStudents.forEach(s => {
 newData[s.id] = {
 score: '',
 status: 'Lulus',
 notes: ''
 };
 });
 setPkStudentData(newData);
 }
 }, [pkType, pkClass, pkMaterialId, pkCategory, pkSemester, students, hafalanProgress, activeTab, userData]);

 const handleSavePk = async () => {
 if (pkIsSaving) return;
 setPkIsSaving(true);
 try {
 const userClass = userData?.assignedClass || userData?.kelas;
 const clsFilter = pkClass || userClass || '';
 const clsStudents = students.filter(s => s.kelas === clsFilter || clsFilter === 'Semua');
 
 let savedCount = 0;

 for (const s of clsStudents) {
 const data = pkStudentData[s.id];
 if (!data) continue;
 
 if (pkType === 'Hafalan') {
 // If status isn't Belum Mulai (which we skip if no existing ID)
 if (data.status !== 'Belum Mulai' || data.id) {
 const payload = {
 studentId: s.id,
 materialId: pkMaterialId,
 status: data.status,
 stars: Number(data.stars),
 catatanGuru: data.notes,
 evaluationSemester: pkSemester,
 isReadyForTest: false,
 updatedAt: new Date().toISOString()
 };
 
 // Use fixed ID pattern to match student dashboard and ensure synchronization
 const docRef = doc(db, 'hafalan_progress', `${s.id}_${pkMaterialId}`);
 await setDoc(docRef, {
 ...payload,
 createdAt: serverTimestamp()
 }, { merge: true });
 
 savedCount++;
 }
 } else if (pkType === 'Rapot') {
 // For Harian/Rapot, append if score is valid
 if (data.score !== '' || data.notes) {
 await addDoc(collection(db, 'progress'), {
 studentId: s.id,
 title: '', // For Rapot we can leave title empty
 category: pkCategory, // This is the mapel name
 evaluationPeriod: pkRapotPeriod,
 description: data.notes,
 target: '',
 status: data.status,
 score: Number(data.score) || 0,
 date: pkDate,
 teacherId: user.uid,
 teacherName: editName || 'Guru',
 createdAt: serverTimestamp()
 });
 savedCount++;
 }
 }
 }
 alert(`Selamat! Berhasil menyimpan penilaian untuk ${savedCount} siswa.`);
 
 if (pkType === 'Rapot') {
 // clear data
 const newData = {...pkStudentData};
 Object.keys(newData).forEach(k => {
 newData[k] = { score: '', status: 'Lulus', notes: '' };
 });
 setPkStudentData(newData);
 }
 } catch (error) {
 console.error(error);
 alert('Gagal menyimpan penilaian');
 } finally {
 setPkIsSaving(false);
 }
 };

 const getScoreGradeInfo = (score: number) => {
 if (score >= 90) return { grade: 'A', text: 'Sangat Baik', color: 'text-green-600' };
 if (score >= 80) return { grade: 'B', text: 'Baik', color: 'text-blue-600' };
 if (score >= 70) return { grade: 'C', text: 'Cukup', color: 'text-orange-600' };
 return { grade: 'D', text: 'Kurang', color: 'text-red-600' };
 };

 const handleSaveMaterial = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newMaterial.name) return;
 try {
 if (editingMaterialId) {
 await updateDoc(doc(db, 'materials', editingMaterialId), { ...newMaterial });
 alert('Materi / Mata Pelajaran berhasil diperbarui!');
 } else {
 await addDoc(collection(db, 'materials'), { 
 ...newMaterial, 
 teacherId: user.uid,
 createdAt: serverTimestamp() 
 });
 alert('Materi / Mata Pelajaran berhasil ditambahkan!');
 }
 setShowMaterialModal(false);
 setNewMaterial({ name: '', topic: '', tulisanArab: '', terjemahan: '' });
 setEditingMaterialId(null);
 } catch (error) {
 handleFirestoreError(error, editingMaterialId ? OperationType.UPDATE : OperationType.CREATE, 'materials');
 }
 };

 const handleDeleteMaterial = async (id: string) => {
 if (window.confirm('Hapus materi / mata pelajaran ini?')) {
 try {
 await deleteDoc(doc(db, 'materials', id));
 alert('Berhasil dihapus!');
 } catch (error) {
 handleFirestoreError(error, OperationType.DELETE, `materials/${id}`);
 }
 }
 };

 const promptPrintRapotHafalan = (student: any) => {
 setSelectedStudentForRapot(student);
 setPrintRapotHafalanSemester('Semua');
 setShowPrintRapotHafalanModal(true);
 };

 const handleExecutePrintRapotHafalanConfirm = () => {
 const student = selectedStudentForRapot;
 if (!student) return;
 
 // Get student's progress data
 const studentHafalanProgressList = hafalanProgress
 .filter(p => p.studentId === student.id)
 // Only include already evaluated items
 .filter(p => !p.isReadyForTest)
 .filter(p => printRapotHafalanSemester === 'Semua' || p.evaluationSemester === printRapotHafalanSemester)
 .sort((a,b) => new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime());
 
 const printWindow = window.open('', '_blank');
 if (!printWindow) return;

 let itemsHtml = '';
 studentHafalanProgressList.forEach((p, idx) => {
 const mat = hafalanMaterials.find(m => m.id === p.materialId);
 let starStr = '';
 for(let i=0; i<(p.stars || 0); i++) { starStr += '★ '; }
 itemsHtml += `
 <tr>
 <td style="padding: 12px; border-bottom: 1px solid #eee;">${idx + 1}</td>
 <td style="padding: 12px; border-bottom: 1px solid #eee;">
 <strong style="display:block;">${mat?.judul || 'Materi tidak ditemukan'}</strong>
 <small style="color: #666;">${mat?.kategori || ''}</small>
 ${p.evaluationSemester ? `<br/><span style="font-size:10px; background:#eef2ff; color:#4f46e5; padding:2px 6px; border-radius:10px; margin-top:4px; display:inline-block;">${p.evaluationSemester}</span>` : ''}
 </td>
 <td style="padding: 12px; border-bottom: 1px solid #eee;">
 <strong style="color: #2563eb;">${p.status}</strong>
 <br/><small style="color: #eab308; font-size: 14px;">${starStr}</small>
 </td>
 <td style="padding: 12px; border-bottom: 1px solid #eee;">${p.catatanGuru || '-'}</td>
 </tr>
 `;
 });

 if (studentHafalanProgressList.length === 0) {
 itemsHtml = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #666; font-style: italic;">Belum ada data evaluasi hafalan pada semester ini.</td></tr>`;
 }

 let reportTitle = `Rapot Hafalan - ${student.name}`;
 if (printRapotHafalanSemester !== 'Semua') {
 reportTitle = `Rapot Hafalan ${printRapotHafalanSemester} - ${student.name}`;
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
 ${getPrintHeaderHTML('LAPORAN HASIL HAFALAN (RAPOT)', settings?.schoolName, settings?.logoUrl)}
 
 <div class="student-info">
 <div>Nama Siswa</div><div>: ${student.name}</div>
 <div>NIS/NISN</div><div>: ${student.email?.split('@')[0] || '-'}</div>
 <div>Kelas</div><div>: ${student.kelas || 'Belum Ditentukan'}</div>
 <div>Semester</div><div>: ${printRapotHafalanSemester}</div>
 <div>Tahun Ajaran</div><div>: ${new Date().getFullYear()}/${new Date().getFullYear()+1}</div>
 </div>
 
 <table>
 <thead>
 <tr>
 <th style="width: 50px;">No</th>
 <th>Judul Hafalan</th>
 <th>Status / Nilai</th>
 <th>Catatan Guru</th>
 </tr>
 </thead>
 <tbody>
 ${itemsHtml}
 </tbody>
 </table>
 
 <div class="footer-signatures">
 <div class="signature-box">
 <p>Mengetahui,</p>
 <p>Wali Kelas</p>
 <br><br><br>
 <p><strong>${userData?.name || '_________________________'}</strong></p>
 </div>
 </div>
 </body>
 </html>
 `;

 printWindow.document.write(html);
 printWindow.document.close();
 };

 const handleExecutePrintRapot = () => {
 if (!selectedStudentForRapot) return;
 const student = students.find(s => s.id === selectedStudentForRapot.id);
 if (!student) return;
 
 // Get student's progress data and sort ascending by date
 const studentProgressList = progress
 .filter(p => p.studentId === student.id)
 .filter(p => p.evaluationPeriod === printRapotPeriod)
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

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        alert('Gagal membaca file foto.');
      };
      reader.onloadend = async () => {
        const result = reader.result as string;
        try {
          const compressed = await compressImage(result, 600, 600, 0.7);
          setEditPhoto(compressed);
          if (user?.uid) {
            await updateDoc(doc(db, 'users', user.uid), { photoURL: compressed });
            setUserData((prev: any) => ({ ...prev, photoURL: compressed }));
          }
        } catch (error) {
          console.error("Compression failed:", error);
          setEditPhoto(result);
          if (user?.uid) {
            await updateDoc(doc(db, 'users', user.uid), { photoURL: result });
            setUserData((prev: any) => ({ ...prev, photoURL: result }));
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

 const handleChangePasswordProfile = async (e: React.FormEvent) => {
 e.preventDefault();
 if (newPassword !== confirmPassword) {
 alert("Password baru dan konfirmasi password tidak cocok!");
 return;
 }
 if (newPassword.length < 6) {
 alert("Password minimal 6 karakter!");
 return;
 }
 
 try {
 if (auth.currentUser) {
 await updatePassword(auth.currentUser, newPassword);
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

 const startCamera = async () => {
 setShowCamera(true);
 setCapturedPhoto(null);
 setIsSubmittingAttendance(false);
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
 setCapturedPhoto(null);
 setIsSubmittingAttendance(false);
 };

 const takePhoto = () => {
 try {
 if (!videoRef.current || !canvasRef.current) return;
 const video = videoRef.current;
 const canvas = canvasRef.current;
 
 // Scale down resolution for ultra fast capture & light payload (~40KB)
 const maxDim = 800;
 let w = video.videoWidth || 640;
 let h = video.videoHeight || 480;
 if (w > h) {
 if (w > maxDim) {
 h = Math.round((h * maxDim) / w);
 w = maxDim;
 }
 } else {
 if (h > maxDim) {
 w = Math.round((w * maxDim) / h);
 h = maxDim;
 }
 }

 canvas.width = w;
 canvas.height = h;

 const ctx = canvas.getContext('2d');
 if (ctx) {
 // Mirror horizontal for natural selfie view
 ctx.translate(w, 0);
 ctx.scale(-1, 1);
 ctx.drawImage(video, 0, 0, w, h);
 const photoDataUrl = canvas.toDataURL('image/jpeg', 0.7);

 // Safely stop stream and clear srcObject before updating state
 if (video.srcObject) {
 const stream = video.srcObject as MediaStream;
 stream.getTracks().forEach(track => track.stop());
 video.srcObject = null;
 }

 setCapturedPhoto(photoDataUrl);
 }
 } catch (err) {
 console.error("Error taking photo:", err);
 alert("Terjadi kesalahan saat mengambil foto. Silakan coba lagi.");
 }
 };

 const retakePhoto = async () => {
 setCapturedPhoto(null);
 try {
 const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
 if (videoRef.current) {
 videoRef.current.srcObject = stream;
 }
 } catch (err) {
 console.error("Error restarting camera:", err);
 }
 };

 const handleConfirmAttendance = async () => {
 if (attendanceStatus === 'Hadir' && !capturedPhoto) {
 alert('Silakan ambil foto presensi terlebih dahulu.');
 return;
 }

 if (isSubmittingAttendance) return;
 setIsSubmittingAttendance(true);

 const today = new Date().toISOString().split('T')[0];
 const path = 'attendance';

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

 const saveRecord = async (location: any = null) => {
 try {
 await addDoc(collection(db, path), {
 studentId: user.uid,
 studentName: user.displayName || editName || 'Guru',
 date: today,
 timestamp: serverTimestamp(),
 status: attendanceStatus,
 location: location,
 photo: attendanceStatus === 'Hadir' ? capturedPhoto : null
 });
 alert('Absensi berhasil dicatat!');
 stopCamera();
 } catch (error) {
 handleFirestoreError(error, OperationType.CREATE, path);
 } finally {
 setIsSubmittingAttendance(false);
 }
 };

 if (attendanceStatus === 'Hadir' && navigator.geolocation) {
 navigator.geolocation.getCurrentPosition(
 async (position) => {
 const { latitude, longitude } = position.coords;
 await saveRecord({ latitude, longitude });
 }, 
 async (error) => {
 console.warn('Geolocation error:', error.message);
 await saveRecord(null);
 },
 { timeout: 5000 }
 );
 } else {
 await saveRecord(null);
 }
 } catch (error) {
 handleFirestoreError(error, OperationType.GET, path);
 setIsSubmittingAttendance(false);
 }
 };

 const handleDeleteProgress = async (id: string) => {
 if (window.confirm('Yakin ingin menghapus laporan belajar/rapot ini?')) {
 try {
 await deleteDoc(doc(db, 'progress', id));
 alert('Laporan berhasil dihapus!');
 } catch (error) {
 handleFirestoreError(error, OperationType.DELETE, `progress/${id}`);
 }
 }
 };

 const handleSaveProgress = async (e: React.FormEvent) => {
 e.preventDefault();
 const path = 'progress';
 try {
 const data = {
 studentId: selectedStudent,
 title: progressCategory, // Use Mapel as Title to simplify
 category: progressCategory,
 evaluationPeriod: progressEvaluationPeriod,
 description: progressDesc,
 target: progressTarget,
 status: progressStatus,
 score: progressScore,
 date: progressDate,
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

 const getAvailableSubjects = (periodFilter?: string, classFilter?: string) => {
 const subjectSet = new Set<string>();

 // 1. Saved subjects from Firestore
 subjects.forEach(s => {
 if (s.name && typeof s.name === 'string') subjectSet.add(s.name.trim());
 });

 // 2. Default RA/TK subjects
 const defaultSubjects = [
 "Nilai Agama & Moral",
 "Fisik Motorik",
 "Kognitif & Sains",
 "Bahasa & Literasi",
 "Seni & Kreativitas",
 "Sosial Emosional",
 "Al-Qur'an & Hafalan",
 "Fiqih & Ibadah",
 "Bahasa Arab",
 "Akidah Akhlak",
 "Pancasila / Kewarganegaraan"
 ];
 defaultSubjects.forEach(s => subjectSet.add(s));

 // 3. Subjects from exam schedules
 if (periodFilter) {
 const matchingExams = exams.filter(ex => ex.type === periodFilter);
 const schedules = matchingExams.flatMap(ex => ex.schedules || []);
 const classSpecificSchedules = schedules.filter((s: any) => 
 !s.kelas || s.kelas.toLowerCase() === "semua kelas" ||
 !classFilter || classFilter === "Semua" || 
 (s.kelas && classFilter && s.kelas.trim().toLowerCase() === classFilter.trim().toLowerCase())
 );
 classSpecificSchedules.forEach((s: any) => {
 if (s.subject && typeof s.subject === 'string') subjectSet.add(s.subject.trim());
 });
 }

 if (pkCategory) subjectSet.add(pkCategory.trim());
 if (progressCategory) subjectSet.add(progressCategory.trim());

 return Array.from(subjectSet)
 .filter(Boolean)
 .filter(sub => !hiddenSubjects.includes(sub));
 };

 const handleDeleteSubject = async (subjectName: string) => {
 if (!confirm(`Apakah Anda yakin ingin menghapus mata pelajaran "${subjectName}"?`)) return;
 try {
 const trimmedName = subjectName.trim();
 
 // Delete any matching document in Firestore 'subjects' collection
 const matchedDocs = subjects.filter(s => s.name?.trim().toLowerCase() === trimmedName.toLowerCase());
 for (const d of matchedDocs) {
 if (d.id) {
 await deleteDoc(doc(db, 'subjects', d.id));
 }
 }

 // Add to hiddenSubjects in settings/subjectsConfig
 const newHidden = Array.from(new Set([...hiddenSubjects, trimmedName]));
 await setDoc(doc(db, 'settings', 'subjectsConfig'), { hiddenSubjects: newHidden }, { merge: true });

 if (pkCategory === trimmedName) setPkCategory('');
 if (progressCategory === trimmedName) setProgressCategory('');

 if (editingSubject && editingSubject.name === trimmedName) {
 setEditingSubject(null);
 setNewSubjectName('');
 }

 alert(`Mata pelajaran "${trimmedName}" berhasil dihapus!`);
 } catch (error) {
 handleFirestoreError(error, OperationType.DELETE, 'subjects');
 }
 };

 const handleSaveSubject = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newSubjectName.trim()) return;
 const path = 'subjects';
 try {
 const trimmed = newSubjectName.trim();

 if (editingSubject) {
 if (editingSubject.id) {
 await updateDoc(doc(db, path, editingSubject.id), { name: trimmed });
 } else {
 const oldName = editingSubject.name;
 if (oldName && oldName !== trimmed) {
 const newHidden = Array.from(new Set([...hiddenSubjects, oldName]));
 await setDoc(doc(db, 'settings', 'subjectsConfig'), { hiddenSubjects: newHidden }, { merge: true });
 }
 await addDoc(collection(db, path), {
 name: trimmed,
 teacherId: user.uid,
 createdAt: serverTimestamp()
 });
 }
 alert('Mata pelajaran diperbarui!');
 } else {
 if (hiddenSubjects.includes(trimmed)) {
 const newHidden = hiddenSubjects.filter(h => h !== trimmed);
 await setDoc(doc(db, 'settings', 'subjectsConfig'), { hiddenSubjects: newHidden }, { merge: true });
 }

 await addDoc(collection(db, path), {
 name: trimmed,
 teacherId: user.uid,
 createdAt: serverTimestamp()
 });
 alert('Mata pelajaran ditambahkan!');
 }

 setPkCategory(trimmed);
 setProgressCategory(trimmed);
 setNewSubjectName('');
 setEditingSubject(null);
 } catch (error) {
 handleFirestoreError(error, editingSubject ? OperationType.UPDATE : OperationType.CREATE, path);
 }
 };

 const resetForm = () => {
 setSelectedStudent('');
 setProgressTitle('');
 setProgressCategory('');
 setProgressEvaluationPeriod('Harian');
 setProgressDesc('');
 setProgressTarget('');
 setProgressStatus('Lulus');
 setProgressScore(90);
 setProgressDate(new Date().toISOString().split('T')[0]);
 setEditingProgress(null);
 setShowProgressModal(false);
 };

 const handleEdit = (p: any) => {
 setEditingProgress(p);
 setSelectedStudent(p.studentId);
 setProgressTitle(p.title);
 setProgressCategory(p.category);
 setProgressEvaluationPeriod(p.evaluationPeriod || 'Harian');
 setProgressDesc(p.description);
 setProgressTarget(p.target || '');
 setProgressStatus(p.status || 'Lulus');
 setProgressScore(p.score || 90);
 setProgressDate(p.date || new Date().toISOString().split('T')[0]);
 setShowProgressModal(true);
 };

 if (loading) return <div className="min-h-screen flex items-center justify-center bg-blue-50">Memuat data...</div>;

   const NavItems = () => (
    <nav className="space-y-2 flex-1">
      {[
        { id: 'overview', label: 'Beranda', icon: BarChartIcon },
        { id: 'students', label: 'Daftar Siswa', icon: Users },
        { id: 'penilaian-kelas', label: 'Penilaian Kelas', icon: Edit },
        { id: 'progress', label: 'Rapot Belajar', icon: GraduationCap },
        { id: 'exams', label: 'Jadwal & Kartu Ujian', icon: FileCheck },
        { id: 'hafalan', label: 'Modul Hafalan', icon: Star },
        { id: 'kaldik', label: 'Kalender Pendidikan', icon: Calendar },
        { id: 'attendance', label: 'Absensi Guru', icon: Camera },
        { id: 'announcements', label: 'Info Sekolah', icon: Bell, badge: announcements.filter(a => !a.target || a.target === 'all' || a.target === 'guru').length },
        { id: 'profile', label: 'Profil Saya', icon: User },
      ].map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button 
            key={item.id}
            onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold group ${
              isActive 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-4">
              <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600 transition-colors'} />
              <span className="text-sm tracking-tight">{item.label}</span>
            </div>
            {item.badge ? (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'
              }`}>
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}

      <button 
        onClick={() => { navigate('/kaldik'); setIsSidebarOpen(false); }}
        className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 group"
      >
        <Calendar size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
        <span className="text-sm tracking-tight">Kaldik Fullscreen</span>
      </button>

      <button 
        onClick={() => { navigate('/juknis'); setIsSidebarOpen(false); }}
        className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100 mt-3"
      >
        <BookOpen size={20} className="text-emerald-600" />
        <span className="text-sm tracking-tight">Juknis Tenaga Pendidik</span>
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-20 md:pb-0 relative font-sans text-slate-900 transition-colors duration-300">
      {/* Sidebar (Desktop) */}
      <aside className="w-72 bg-white border-r border-slate-100 p-8 hidden md:flex flex-col shadow-sm z-30 transition-colors duration-300">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 overflow-hidden rounded-2xl border-2 border-emerald-600/10 p-0.5 bg-white shadow-sm flex items-center justify-center">
            <img 
              src="/logo_ra.jpeg" 
              alt="Logo Resmi" 
              className="w-10 h-10 object-contain" 
            />
          </div>
          <div>
            <h1 className="font-display font-black text-slate-900 leading-none tracking-tight">Portal Guru</h1>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-1.5 leading-none">RA Darusyifa</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <NavItems />
        </div>
        <div className="mt-6 pt-6 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-50 font-bold transition-all group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm tracking-tight">Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Bottom Navigation Bar (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] flex justify-around items-center py-2 px-2 z-[100]" style={{ WebkitBackdropFilter: 'blur(16px)' }}>
        {[
          { id: 'overview', label: 'Beranda', icon: BarChartIcon },
          { id: 'students', label: 'Siswa', icon: Users },
          { id: 'penilaian-kelas', label: 'Penilaian', icon: Edit },
          { id: 'hafalan', label: 'Hafalan', icon: Star },
        ].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
              className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all py-1 ${isActive ? 'text-blue-600 font-black' : 'text-slate-400 hover:text-slate-600 font-medium'}`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600 scale-110 shadow-xs' : 'text-slate-400'}`}>
                <item.icon size={20} />
              </div>
              <span className={`text-[10px] tracking-tight ${isActive ? 'font-black text-blue-600' : 'font-semibold text-slate-500'}`}>{item.label}</span>
            </button>
          );
        })}
        {/* Menu Tab */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all py-1 ${isSidebarOpen ? 'text-blue-600 font-black' : 'text-slate-400 hover:text-slate-600 font-medium'}`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${isSidebarOpen ? 'bg-blue-50 text-blue-600 scale-110 shadow-xs' : 'text-slate-400'}`}>
            <Menu size={20} />
          </div>
          <span className={`text-[10px] tracking-tight ${isSidebarOpen ? 'font-black text-blue-600' : 'font-semibold text-slate-500'}`}>Lainnya</span>
        </button>
      </div>

      {/* Mobile Bottom Sheet Menu */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Bottom Sheet */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed bottom-0 inset-x-0 bg-white rounded-t-[2.5rem] shadow-2xl p-6 z-[100] md:hidden max-h-[88vh] flex flex-col border-t border-slate-100"
            >
              {/* Drag indicator */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 overflow-hidden rounded-xl border border-emerald-600/10 p-0.5 bg-white shadow-sm flex items-center justify-center">
                    <img 
                      src="/logo_ra.jpeg" 
                      alt="Logo Resmi" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <div>
                    <h2 className="font-display font-black text-slate-900 text-sm leading-tight">Portal Guru - Menu</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">RA Darusyifa Arjawinangun</p>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 p-1.5 hover:bg-slate-50 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pb-6 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { id: 'overview', label: 'Beranda Guru', icon: BarChartIcon, color: 'text-blue-600 bg-blue-50' },
                    { id: 'students', label: 'Daftar Siswa', icon: Users, color: 'text-purple-600 bg-purple-50' },
                    { id: 'penilaian-kelas', label: 'Penilaian Kelas', icon: Edit, color: 'text-indigo-600 bg-indigo-50' },
                    { id: 'progress', label: 'Rapot Siswa', icon: GraduationCap, color: 'text-sky-600 bg-sky-50' },
                    { id: 'exams', label: 'Jadwal & Ujian', icon: FileCheck, color: 'text-rose-600 bg-rose-50' },
                    { id: 'hafalan', label: 'Modul Hafalan', icon: Star, color: 'text-amber-600 bg-amber-50' },
                    { id: 'kaldik', label: 'Kalender (Kaldik)', icon: Calendar, color: 'text-pink-600 bg-pink-50' },
                    { id: 'attendance', label: 'Absensi Saya', icon: Camera, color: 'text-emerald-600 bg-emerald-50' },
                    { id: 'announcements', label: 'Info & Notif', icon: Bell, color: 'text-blue-600 bg-blue-50' },
                    { id: 'profile', label: 'Profil Saya', icon: User, color: 'text-teal-600 bg-teal-50' },
                  ].map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                          isActive
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold shadow-xs'
                            : 'bg-slate-50/80 border-slate-100 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                          <item.icon size={16} />
                        </div>
                        <span className="text-xs font-bold tracking-tight leading-tight">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <button 
                    onClick={() => { navigate('/kaldik'); setIsSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-slate-700 bg-slate-50 border border-slate-100 font-bold text-xs transition-all hover:bg-slate-100"
                  >
                    <Calendar size={18} className="text-pink-600" />
                    <span>Kalender Akademik (Kaldik) Full</span>
                  </button>
                  <button 
                    onClick={() => { navigate('/juknis'); setIsSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-emerald-800 bg-emerald-50 border border-emerald-100 font-bold text-xs transition-all hover:bg-emerald-100"
                  >
                    <BookOpen size={18} className="text-emerald-600" />
                    <span>Panduan / Juknis Tenaga Pendidik</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-auto">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-all text-xs"
                >
                  <LogOut size={16} />
                  <span>Keluar Sesi</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 min-h-screen relative overflow-y-auto scrolling-touch bg-[#F8FAFC]">
        {/* Top Bar / Mobile Header */}
        <div className="md:hidden bg-white/95 border-b border-slate-100 px-4 py-3.5 flex items-center justify-between sticky top-0 z-[90] shadow-xs backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 overflow-hidden rounded-xl border border-emerald-500/20 p-1 bg-emerald-50/40 shadow-xs flex items-center justify-center">
              <img 
                src="/logo_ra.jpeg" 
                alt="Logo RA Darusyifa" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <h2 className="font-display font-black text-slate-900 text-[15px] leading-tight">Portal Guru</h2>
              <p className="text-[8px] font-black uppercase tracking-wider text-slate-400 mt-0.5">RA DARUSYIFA ARJAWINANGUN</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Notification Bell */}
            <button 
              onClick={() => setActiveTab('announcements')}
              className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all relative active:scale-95 shadow-xs"
              title="Notifikasi"
            >
              <Bell size={18} />
              {announcements.filter(a => !a.target || a.target === 'all' || a.target === 'guru').length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {announcements.filter(a => !a.target || a.target === 'all' || a.target === 'guru').length}
                </span>
              )}
            </button>

            {/* Menu Hamburger Toggle */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 hover:text-emerald-600 transition-all active:scale-95 shadow-xs"
              title="Menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8 space-y-6">
          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div className="space-y-6 pb-20 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">Papan Informasi Sekolah</h3>
                  <p className="text-sm text-gray-400 font-medium">Informasi resmi, pengumuman, dan berita terbaru untuk Tenaga Pengajar.</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                  <Megaphone size={14} /> {announcements.filter(a => !a.target || a.target === 'all' || a.target === 'guru').length} Pengumuman
                </div>
              </div>

              <div className="grid gap-6">
                {announcements
                  .filter(a => !a.target || a.target === 'all' || a.target === 'guru')
                  .map((ann) => (
                    <div key={ann.id} className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-100 flex flex-col gap-4 w-full max-w-full overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                          {ann.target && ann.target !== 'all' ? ann.target.toUpperCase() : 'Semua Guru'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          {ann.createdAt ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        </span>
                      </div>

                      <h4 className="text-base sm:text-lg md:text-xl font-black text-slate-900 tracking-tight leading-snug">{ann.title}</h4>
                      
                      <div className="w-full max-w-full overflow-x-auto my-1">
                        <div className="prose prose-slate max-w-none text-slate-700 text-xs sm:text-sm leading-relaxed announcement-html-content break-words" dangerouslySetInnerHTML={{ __html: ann.content }}></div>
                      </div>

                      {ann.attachments && ann.attachments.length > 0 && (
                        <div className="mt-2 pt-3 border-t border-slate-100">
                          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5">Lampiran Berkas:</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ann.attachments.map((file: any, idx: number) => (
                              <div 
                                key={idx} 
                                className="bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-2xl p-3 transition-all flex items-center gap-3 cursor-pointer"
                                onClick={() => {
                                  if (file.type.includes('image')) {
                                    setSelectedPhoto(file.data);
                                  } else {
                                    const link = document.createElement('a');
                                    link.href = file.data;
                                    link.download = file.name;
                                    link.click();
                                  }
                                }}
                              >
                                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-xs shrink-0">
                                  {file.type.includes('image') ? <ImageIcon size={16} className="text-blue-500" /> : <FileText size={16} className="text-rose-500" />}
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-xs font-bold text-slate-700 truncate">{file.name}</span>
                                </div>
                                <Download size={13} className="text-slate-400 shrink-0" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-1 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                        Oleh: {ann.author || 'Pihak Sekolah'}
                      </div>
                    </div>
                  ))}

                {announcements.filter(a => !a.target || a.target === 'all' || a.target === 'guru').length === 0 && (
                  <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-gray-100 text-center flex flex-col items-center justify-center gap-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                      <Megaphone size={40} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400 font-black text-sm uppercase tracking-widest">Belum ada pengumuman</p>
                      <p className="text-xs text-gray-300 font-medium">Semua informasi terbaru akan muncul di sini.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

 {/* Hafalan Evaluation Modal */}
 {showHafalanModal && evaluateHafalan && (
 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
 <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
 <button onClick={() => setShowHafalanModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
 <h3 className="text-2xl font-bold text-gray-800 mb-2">Evaluasi Hafalan</h3>
 {(() => {
 const mat = hafalanMaterials.find(m => m.id === evaluateHafalan.materialId);
 const st = students.find(s => s.id === evaluateHafalan.studentId);
 
 const hasRecording = evaluateHafalan.recordingDataUrl || evaluateHafalan.recordingLink;
 
 return (
 <>
 <p className="text-sm text-gray-500 mb-6">Siswa: <span className="font-bold text-gray-800 ">{st?.name}</span> • Materi: <span className="font-bold border-b border-gray-300">{mat?.judul}</span></p>
 
 {mat?.arab && (
 <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center space-y-4">
 <p className="text-2xl font-arab text-gray-800 leading-loose" dir="rtl">{mat.arab}</p>
 <p className="text-sm text-gray-600 font-medium italic">{mat.latin}</p>
 <p className="text-sm text-gray-500 leading-relaxed font-medium">"{mat.terjemahan}"</p>
 </div>
 )}
 
 {evaluateHafalan.submissionMethod && (
 <div className="mb-6 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex items-center justify-between">
 <div>
 <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Metode Setoran Siswa</p>
 <p className="text-sm font-black text-gray-800 uppercase tabular-nums">{evaluateHafalan.submissionMethod}</p>
 </div>
 <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
 {evaluateHafalan.submissionMethod === 'Google Drive' ? <Megaphone size={18} /> : 
 evaluateHafalan.submissionMethod === 'Setoran Langsung' ? <GraduationCap size={18} /> : <Camera size={18} />}
 </div>
 </div>
 )}

 {hasRecording && (
 <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
 <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
 {evaluateHafalan.submissionMethod === 'Google Drive' ? 'Link Google Drive' : 'File Rekaman / Rekaman Langsung'}
 </h4>
 
 {evaluateHafalan.recordingDataUrl && (
 evaluateHafalan.recordingDataUrl.startsWith('data:video/') ? (
 <video controls src={evaluateHafalan.recordingDataUrl} className="w-full rounded-xl bg-black" />
 ) : (
 <audio controls src={evaluateHafalan.recordingDataUrl} className="w-full" />
 )
 )}
 
 {evaluateHafalan.recordingLink && (
 <a 
 href={evaluateHafalan.recordingLink} 
 target="_blank" 
 rel="noopener noreferrer"
 className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-200 transition-colors"
 >
 <BookOpen size={16} /> Buka Link Rekaman Eksternal
 </a>
 )}
 </div>
 )}
 
 <div className="space-y-6">
 <div>
 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilih Status Baru</label>
 <div className="grid grid-cols-2 gap-2">
 {['Sedang Menghafal', 'Lancar', 'Mumtaz (Lulus)'].map((s) => (
 <label key={s} className={`cursor-pointer p-3 border rounded-xl flex items-center gap-2 ${hafalanEvalStatus === s ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-gray-100'}`}>
 <input type="radio" value={s} checked={hafalanEvalStatus === s} onChange={e => setHafalanEvalStatus(e.target.value as HafalanStatus)} className="hidden" />
 <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${hafalanEvalStatus === s ? 'border-blue-600' : 'border-gray-300'}`}>
 {hafalanEvalStatus === s && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
 </div>
 <span className={`text-sm font-bold ${hafalanEvalStatus === s ? 'text-blue-800' : 'text-gray-600'}`}>{s}</span>
 </label>
 ))}
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bintang Penilaian (1-5)</label>
 <div className="flex gap-2">
 {[1, 2, 3, 4, 5].map(star => (
 <button 
 key={star} type="button" 
 onClick={() => setHafalanEvalStars(star)}
 className={`p-2 transition-colors ${hafalanEvalStars >= star ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-200'}`}
 >
 <Star size={32} fill={hafalanEvalStars >= star ? "currentColor" : "none"} />
 </button>
 ))}
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catatan Tambahan</label>
 <textarea 
 value={hafalanEvalNotes} 
 onChange={e => setHafalanEvalNotes(e.target.value)}
 placeholder="Contoh: Tajwid sudah bagus, tapi perhatikan panjang pendeknya."
 className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Periode Evaluasi</label>
 <select
 value={hafalanEvalSemester}
 onChange={(e) => setHafalanEvalSemester(e.target.value as any)}
 className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-gray-700 "
 >
 <option value="PTS Ganjil">PTS Ganjil</option>
 <option value="PAS Ganjil">PAS Ganjil</option>
 <option value="PTS Genap">PTS Genap</option>
 <option value="PAS Genap">PAS Genap</option>
 </select>
 </div>
 
 <div className="pt-4 flex gap-4">
 <button onClick={() => setShowHafalanModal(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 flex-1 transition-colors">Batal</button>
 <button 
 onClick={async () => {
 try {
 const docRef = doc(db, 'hafalan_progress', evaluateHafalan.id);
 await updateDoc(docRef, {
 status: hafalanEvalStatus,
 stars: hafalanEvalStars,
 catatanGuru: hafalanEvalNotes,
 evaluationSemester: hafalanEvalSemester,
 isReadyForTest: false,
 updatedAt: new Date().toISOString()
 });
 // Automatically unlock next material if 'Mumtaz (Lulus)'
 if (hafalanEvalStatus === 'Mumtaz (Lulus)' && mat) {
 const nextId = getNextMaterialId(mat.id, mat.kelas, hafalanMaterials);
 if (nextId) {
 const nextRef = doc(db, 'hafalan_progress', `${evaluateHafalan.studentId}_${nextId}`);
 await setDoc(nextRef, {
 studentId: evaluateHafalan.studentId,
 materialId: nextId,
 status: 'Belum Mulai',
 stars: 0,
 catatanGuru: '',
 isReadyForTest: false,
 updatedAt: new Date().toISOString()
 }, { merge: true });
 }
 }
 alert('Evaluasi berhasil disimpan!');
 setShowHafalanModal(false);
 } catch (err) {
 handleFirestoreError(err, OperationType.UPDATE, `hafalan_progress/${evaluateHafalan.id}`);
 }
 }}
 className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex-1 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
 >
 Simpan Penilaian
 </button>
 </div>
 </div>
 </>
 );
 })()}
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
 <h3 className="text-2xl font-black text-gray-800 tracking-tight">Jadwal Ujian</h3>
 </div>
 <p className="text-gray-400 text-sm font-medium">Lihat jadwal evaluasi PTS dan PAS yang diatur Admin.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-6">
 {exams.filter(exam => {
 const classSchedules = (exam.schedules || []).filter((s: any) => {
 const userClass = userData?.assignedClass || userData?.kelas;
 return !s.kelas || s.kelas.toLowerCase() === "semua kelas" || 
 (userClass && s.kelas?.toLowerCase() === userClass?.toLowerCase());
 });
 return classSchedules.length > 0;
 }).map(exam => (
 <div key={exam.id} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-[100px] z-0 opacity-50 group-hover:bg-rose-100 transition-colors"></div>
 <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
 <div>
 <div className="flex items-center gap-3 mb-2">
 <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">{exam.academicYear}</span>
 <h4 className="text-xl font-bold text-gray-800 ">{exam.type}</h4>
 </div>
 <p className="text-gray-500 text-sm font-medium mb-4 flex items-center gap-2">
 <Calendar size={14} /> {(exam.schedules || []).length} Jadwal Mata Pelajaran
 </p>
 </div>
 
 <div className="bg-gray-50 rounded-2xl p-4 flex-1">
 <h5 className="font-bold text-gray-700 text-sm mb-3">Daftar Jadwal</h5>
 {(() => {
 const classSchedules = (exam.schedules || []).filter((s: any) => {
 const userClass = userData?.assignedClass || userData?.kelas;
 return !s.kelas || s.kelas.toLowerCase() === "semua kelas" || 
 (userClass && s.kelas?.toLowerCase() === userClass?.toLowerCase());
 });
 if (classSchedules.length === 0) {
 return <p className="text-xs text-gray-400 italic">Belum ada jadwal untuk kelas ini.</p>;
 }
 return (
 <div className="space-y-2">
 {classSchedules.map((s: any) => (
 <div key={s.id} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between gap-4">
 <div>
 <p className="text-sm font-bold text-gray-800 ">{s.subject} <span className="text-xs text-gray-400 font-medium ml-2">({s.kelas})</span></p>
 <p className="text-xs text-rose-600 font-bold mt-1">
 {new Date(s.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} | {s.time}
 </p>
 </div>
 </div>
 ))}
 </div>
 );
 })()}
 </div>
 </div>
 </div>
 ))}
 {exams.filter(exam => {
 const classSchedules = (exam.schedules || []).filter((s: any) => {
 const userClass = userData?.assignedClass || userData?.kelas;
 return !s.kelas || s.kelas.toLowerCase() === "semua kelas" || 
 (userClass && s.kelas?.toLowerCase() === userClass?.toLowerCase());
 });
 return classSchedules.length > 0;
 }).length === 0 && (
 <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 border-dashed">
 <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
 <Edit size={24} />
 </div>
 <h4 className="text-gray-600 font-bold mb-2">Belum ada Jadwal Ujian</h4>
 <p className="text-gray-400 text-sm">Harap cek secara berkala.</p>
 </div>
 )}
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
 <input 
 type="text"
 placeholder="Cari Nama Siswa..."
 value={searchStudentProgress}
 onChange={(e) => setSearchStudentProgress(e.target.value)}
 className="w-full p-2 mb-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
 />
 <select 
 value={selectedStudent} 
 onChange={(e) => setSelectedStudent(e.target.value)} 
 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
 required
 >
 <option value="">-- Pilih Siswa --</option>
 {students.filter(s => !searchStudentProgress || (s.name || '').toLowerCase().includes(searchStudentProgress.toLowerCase())).map(s => <option key={s.id} value={s.id}>{s.name} {s.kelas ? `(${s.kelas})` : ''}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jenis Penilaian</label>
 <select 
 value={progressEvaluationPeriod} 
 onChange={(e) => {
 setProgressEvaluationPeriod(e.target.value);
 setProgressCategory('');
 }} 
 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
 required
 >
 <option value="Harian">Laporan Harian / Mingguan</option>
 <option value="PTS Ganjil">PTS Ganjil</option>
 <option value="PAS Ganjil">PAS Ganjil</option>
 <option value="PTS Genap">PTS Genap</option>
 <option value="PAS Genap">PAS Genap</option>
 </select>
 </div>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <div className="flex justify-between items-center mb-1">
 <label className="block text-xs font-bold text-gray-500 uppercase">Pilih Mapel</label>
 <button
 type="button"
 onClick={() => {
 setEditingSubject(null);
 setNewSubjectName('');
 setShowSubjectModal(true);
 }}
 className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
 >
 <Plus size={12} /> + Mapel Baru
 </button>
 </div>
 <select 
 value={progressCategory} 
 onChange={(e) => {
 if (e.target.value === '__ADD_NEW__') {
 setEditingSubject(null);
 setNewSubjectName('');
 setShowSubjectModal(true);
 } else {
 setProgressCategory(e.target.value);
 }
 }} 
 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 "
 required
 >
 <option value="">-- Pilih Mapel --</option>
 {getAvailableSubjects(progressEvaluationPeriod).map((sub, idx) => (
 <option key={idx} value={sub}>{sub}</option>
 ))}
 <option value="__ADD_NEW__" className="font-bold text-blue-600 bg-blue-50">
 ➕ + Tambah Mata Pelajaran Baru...
 </option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal Laporan</label>
 <input type="date" value={progressDate} onChange={(e) => setProgressDate(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 " required />
 </div>
 </div>
 
 <div className="grid grid-cols-1 gap-4">
 <div>
 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Perkembangan</label>
 <input type="text" value={progressTarget} onChange={(e) => setProgressTarget(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Mampu membaca 1 paragraf, dikosongkan jika Ujian" />
 </div>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Keterangan Status</label>
 <select value={progressStatus} onChange={(e) => setProgressStatus(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required>
 <option value="Lulus">Lulus</option>
 <option value="Belum Lulus">Belum Lulus</option>
 <option value="Mengulang">Mengulang</option>
 <option value="Lanjut Perkembangan Lain">Lanjut Perkembangan Lain</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nilai (1 - 100)</label>
 <input type="number" min="1" max="100" value={progressScore || ''} onChange={(e) => setProgressScore(Number(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" required placeholder="0 - 100" />
 </div>
 </div>
 
 <div>
 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deskripsi Hasil Belajar</label>
 <textarea value={progressDesc} onChange={(e) => setProgressDesc(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none" placeholder="Tuliskan detail pencapaian hasil belajar anak..." required />
 </div>
 <button type="submit" className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all mt-4 flex items-center justify-center gap-2">
 <Save size={20} /> {editingProgress ? 'Simpan Perubahan' : 'Kirim Laporan'}
 </button>
 </form>
 </div>
 </div>
 )}

 {showSubjectModal && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
 <div className="bg-white w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
 <button 
 onClick={() => {
 setShowSubjectModal(false);
 setEditingSubject(null);
 setNewSubjectName('');
 }} 
 className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
 >
 <X size={20} />
 </button>
 
 <div className="mb-5 pr-8">
 <h3 className="text-xl font-bold text-gray-800 ">Kelola Mata Pelajaran</h3>
 <p className="text-xs text-gray-500 mt-1">Tambah, edit nama, atau hapus mata pelajaran untuk rapot dan nilai masal.</p>
 </div>

 {/* Form Input */}
 <form onSubmit={handleSaveSubject} className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mb-5 space-y-2">
 <label className="block text-xs font-bold text-blue-900 uppercase">
 {editingSubject ? `Edit Mapel: "${editingSubject.name}"` : 'Tambah Mata Pelajaran Baru'}
 </label>
 <div className="flex gap-2">
 <input 
 type="text" 
 value={newSubjectName} 
 onChange={(e) => setNewSubjectName(e.target.value)} 
 className="flex-1 p-3 bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-gray-800 " 
 placeholder="Contoh: Hijaiyah, Berhitung, Fiqih..." 
 required 
 />
 <button type="submit" className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 shadow-md shadow-blue-200 transition-all shrink-0">
 {editingSubject ? 'Simpan' : '+ Tambah'}
 </button>
 {editingSubject && (
 <button 
 type="button" 
 onClick={() => {
 setEditingSubject(null);
 setNewSubjectName('');
 }} 
 className="px-3 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-300 transition-all shrink-0"
 >
 Batal
 </button>
 )}
 </div>
 </form>

 {/* List of Subjects */}
 <div className="flex-1 overflow-y-auto pr-1">
 <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Daftar Mata Pelajaran Aktif ({getAvailableSubjects().length})</label>
 {getAvailableSubjects().length === 0 ? (
 <div className="p-6 text-center text-xs text-gray-400 border border-dashed rounded-2xl">
 Belum ada mata pelajaran. Silakan tambahkan mata pelajaran baru di atas.
 </div>
 ) : (
 <div className="space-y-2">
 {getAvailableSubjects().map((subName, idx) => {
 const matchedDoc = subjects.find(s => s.name?.trim().toLowerCase() === subName.toLowerCase());
 const isEditingThis = editingSubject && editingSubject.name === subName;

 return (
 <div 
 key={idx} 
 className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${isEditingThis ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100' : 'bg-gray-50/70 border-gray-100 hover:bg-gray-100/80'}`}
 >
 <div className="flex items-center gap-2 overflow-hidden">
 <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
 <span className="font-bold text-sm text-gray-800 truncate">{subName}</span>
 </div>

 <div className="flex items-center gap-1 shrink-0 ml-2">
 <button
 type="button"
 onClick={() => {
 setEditingSubject(matchedDoc || { name: subName });
 setNewSubjectName(subName);
 }}
 title="Edit nama mata pelajaran"
 className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
 >
 <Edit size={16} />
 </button>
 <button
 type="button"
 onClick={() => handleDeleteSubject(subName)}
 title="Hapus mata pelajaran ini"
 className="p-2 text-red-500 hover:bg-red-100 rounded-xl transition-all"
 >
 <Trash2 size={16} />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>

 <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
 <button
 type="button"
 onClick={() => {
 setShowSubjectModal(false);
 setEditingSubject(null);
 setNewSubjectName('');
 }}
 className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all"
 >
 Tutup
 </button>
 </div>
 </div>
 </div>
 )}

 {showMaterialModal && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
 <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl relative overflow-hidden scale-in">
 <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center relative overflow-hidden">
 <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-100 rounded-full blur-2xl opacity-60"></div>
 <h3 className="text-xl font-black text-gray-800 flex items-center gap-3 relative z-10"><BookOpen className="text-blue-500" /> {editingMaterialId ? 'Edit Materi' : 'Tambah Materi'}</h3>
 <button onClick={() => { setShowMaterialModal(false); setEditingMaterialId(null); setNewMaterial({ name: '', topic: '', tulisanArab: '', terjemahan: '' }); }} className="text-gray-400 hover:text-red-500 transition-colors relative z-10"><X size={24} /></button>
 </div>
 <form onSubmit={handleSaveMaterial} className="p-6 space-y-4">
 <div>
 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Judul Materi / Mata Pelajaran</label>
 <input 
 type="text" 
 value={newMaterial.name} 
 onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})} 
 className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-gray-700 " 
 placeholder="Masukkan judul..." 
 required 
 />
 </div>
 <div>
 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Topik Kategori</label>
 <input 
 type="text" 
 value={newMaterial.topic} 
 onChange={(e) => setNewMaterial({...newMaterial, topic: e.target.value})} 
 className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-gray-700 " 
 placeholder="Contoh: Matematika Dasar" 
 />
 </div>
 <div>
 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Tulisan Arab (Opsional)</label>
 <textarea 
 value={newMaterial.tulisanArab} 
 onChange={(e) => setNewMaterial({...newMaterial, tulisanArab: e.target.value})} 
 className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-arab text-xl text-gray-700 h-24 resize-none" 
 placeholder="Tulis teks arab di sini..." 
 dir="rtl"
 />
 </div>
 <div>
 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Terjemahan / Arti</label>
 <textarea 
 value={newMaterial.terjemahan} 
 onChange={(e) => setNewMaterial({...newMaterial, terjemahan: e.target.value})} 
 className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-gray-700 h-24 resize-none" 
 placeholder="Masukkan terjemahan materi..." 
 />
 </div>
 <button type="submit" className="w-full px-6 py-5 bg-blue-600 text-white rounded-[1.5rem] font-bold text-lg hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all mt-6 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
 <Save size={20} /> {editingMaterialId ? 'Simpan Perubahan' : 'Tambah Materi'}
 </button>
 </form>
 </div>
 </div>
 )}

 {/* Camera Modal */}
 {showCamera && (
 <div className="fixed inset-0 bg-white md:bg-black/60 md:backdrop-blur-md z-[300] flex flex-col items-center justify-center p-0 md:p-4">
 <div className="bg-white w-full h-[100dvh] md:h-auto md:max-h-[92vh] md:max-w-xl md:rounded-[40px] shadow-2xl flex flex-col relative overflow-hidden">
 <div className="p-4 sm:p-6 flex justify-between items-center border-b border-gray-100 shrink-0">
 <div>
 <h3 className="font-display font-bold text-lg sm:text-xl text-gray-800 uppercase tracking-tight">Presensi Guru & Staf</h3>
 <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">Status: {attendanceStatus}</p>
 </div>
 <button onClick={stopCamera} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={24} /></button>
 </div>

 <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
 <div>
 <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 sm:mb-3 tracking-widest text-center">Pilih Status Kehadiran</label>
 <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
 {['Hadir', 'Sakit', 'Izin', 'Alpha'].map((status) => (
 <button 
 key={status}
 onClick={() => {
 setAttendanceStatus(status);
 if (status !== 'Hadir') setCapturedPhoto(null);
 }}
 className={`py-2.5 sm:py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${attendanceStatus === status ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
 >
 {status === 'Alpha' ? 'Tanpa Keterangan' : status}
 </button>
 ))}
 </div>
 </div>

 {attendanceStatus === 'Hadir' && (
 <div className="space-y-3 sm:space-y-4 notranslate" translate="no">
 <div className="relative aspect-video max-h-[220px] sm:max-h-[300px] w-full bg-slate-900 rounded-2xl sm:rounded-[32px] overflow-hidden border-2 border-slate-100 shadow-inner flex items-center justify-center">
 {!capturedPhoto ? (
 <div key="live-video-box-guru" className="w-full h-full relative flex items-center justify-center">
 <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
 <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 z-10">
 <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Kamera Live
 </div>
 </div>
 ) : (
 <div key="captured-photo-box-guru" className="w-full h-full relative flex items-center justify-center">
 <img src={capturedPhoto} alt="Hasil Foto Absen" className="w-full h-full object-cover" />
 <div className="absolute top-3 left-3 bg-emerald-600/90 text-white backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-md z-10">
 <CheckCircle size={12} /> Hasil Foto Dikonfirmasi
 </div>
 </div>
 )}
 <canvas ref={canvasRef} className="hidden" />
 <div className="absolute inset-0 border-2 border-white/10 pointer-events-none rounded-2xl sm:rounded-[32px]"></div>
 </div>

 {/* Action Buttons directly below camera / photo preview */}
 {!capturedPhoto ? (
 <button 
 key="btn-take-photo-guru"
 type="button"
 onClick={takePhoto}
 className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 sm:py-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 active:scale-95 transition-all border-2 border-emerald-500 my-1"
 >
 <Camera size={20} /> Ambil Foto Sekarang
 </button>
 ) : (
 <div key="btn-confirm-group-guru" className="grid grid-cols-2 gap-3 my-1">
 <button 
 onClick={retakePhoto}
 disabled={isSubmittingAttendance}
 className="bg-white border-2 border-slate-300 text-slate-700 py-3.5 sm:py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
 >
 <RefreshCw size={16} /> Foto Ulang
 </button>
 <button 
 onClick={handleConfirmAttendance}
 disabled={isSubmittingAttendance}
 className="bg-emerald-600 text-white py-3.5 sm:py-4 rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50"
 >
 {isSubmittingAttendance ? (
 <span className="flex items-center gap-2"><RefreshCw className="animate-spin" size={16} /> Menyimpan...</span>
 ) : (
 <><CheckCircle size={18} /> OK, Kirim Presensi</>
 )}
 </button>
 </div>
 )}

 <p className="text-[10px] text-gray-400 font-bold text-center uppercase tracking-wider">
 {!capturedPhoto ? 'Pastikan wajah terlihat jelas di dalam bingkai' : 'Foto berhasil diambil! Klik "OK, Kirim Presensi" untuk konfirmasi.'}
 </p>
 </div>
 )}

 {attendanceStatus !== 'Hadir' && (
 <div className="py-6 sm:py-10 flex flex-col items-center justify-center text-center space-y-3">
 <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
 <CheckCircle size={32} />
 </div>
 <div>
 <h4 className="font-bold text-gray-800 text-sm">Status: {attendanceStatus === 'Alpha' ? 'Tanpa Keterangan' : attendanceStatus}</h4>
 <p className="text-xs text-gray-500 max-w-xs mt-1">Anda mencatat kehadiran sebagai {attendanceStatus}. Klik Simpan untuk konfirmasi.</p>
 </div>
 </div>
 )}
 </div>

 {attendanceStatus !== 'Hadir' && (
 <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 shrink-0 sticky bottom-0 z-30">
 <button 
 onClick={handleConfirmAttendance}
 disabled={isSubmittingAttendance}
 className="bg-indigo-600 text-white w-full py-3.5 sm:py-4 rounded-xl sm:rounded-[24px] font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
 >
 {isSubmittingAttendance ? (
 <span className="flex items-center gap-2"><RefreshCw className="animate-spin" size={16} /> Menyimpan...</span>
 ) : (
 <><Save size={18} /> Simpan Presensi</>
 )}
 </button>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
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
