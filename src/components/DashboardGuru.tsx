import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  collection, query, onSnapshot, addDoc, serverTimestamp, 
  getDoc, doc, updateDoc, deleteDoc, orderBy, where, getDocs, setDoc 
} from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { 
  Users, BookOpen, Plus, Trash2, Edit, LogOut, User, 
  Bell, CheckCircle, X, Menu, Save, Camera, Clock, 
  BarChart as BarChartIcon, TrendingUp, Printer, Star, Megaphone, 
  GraduationCap, Calendar, Search, Filter, Image as ImageIcon, 
  FileText, Download, ExternalLink, RefreshCw, ChevronDown, 
  ChevronRight, HelpCircle, ShieldCheck, Sparkles, Award, Wallet, FileCheck,
  Eye, EyeOff
} from 'lucide-react';
import { staticHafalanMaterials as initialHafalanMaterials, StudentHafalanProgress, HafalanStatus, getNextMaterialId } from '../data/hafalanData';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import KaldikCalendar from './KaldikCalendar';
import { compressImage } from '../lib/imageUtils';
import { getPrintHeaderHTML, getPrintStyles, getPrintSignatureHTML } from '../lib/printUtils';
import { useAuth } from './AuthProvider';

// Modular Guru Tab Components
import GuruOverviewTab from './guru/GuruOverviewTab';
import GuruStudentsTab from './guru/GuruStudentsTab';
import GuruPenilaianKelasTab from './guru/GuruPenilaianKelasTab';
import GuruProgressRapotTab from './guru/GuruProgressRapotTab';
import GuruHafalanTab from './guru/GuruHafalanTab';
import GuruAttendanceTab from './guru/GuruAttendanceTab';
import GuruProfileTab from './guru/GuruProfileTab';

export default function DashboardGuru() {
  const { user: authUser, userData: authUserData } = useAuth();
  const [user, setUser] = useState<any>(authUser);
  const [userData, setUserData] = useState<any>(authUserData);
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
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Form States for Progress
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [editingProgress, setEditingProgress] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [progressTitle, setProgressTitle] = useState('');
  const [progressCategory, setProgressCategory] = useState('');
  const [progressEvaluationPeriod, setProgressEvaluationPeriod] = useState('Harian');
  const [progressDesc, setProgressDesc] = useState('');
  const [progressTarget, setProgressTarget] = useState('');
  const [progressStatus, setProgressStatus] = useState('Lulus');
  const [progressScore, setProgressScore] = useState<number>(90);
  const [progressDate, setProgressDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchStudentProgress, setSearchStudentProgress] = useState('');

  // Subjects Management State
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);

  // Hafalan Evaluation Modal States
  const [evaluateHafalan, setEvaluateHafalan] = useState<StudentHafalanProgress | null>(null);
  const [showHafalanModal, setShowHafalanModal] = useState(false);
  const [hafalanEvalStars, setHafalanEvalStars] = useState<number>(0);
  const [hafalanEvalNotes, setHafalanEvalNotes] = useState('');
  const [hafalanEvalStatus, setHafalanEvalStatus] = useState<HafalanStatus>('Sedang Menghafal');
  const [hafalanEvalSemester, setHafalanEvalSemester] = useState<any>('PTS Ganjil');

  // Materials States
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', topic: '', tulisanArab: '', terjemahan: '' });
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);

  // Profile Form States
  const [editName, setEditName] = useState(authUserData?.name || '');
  const [editPhoto, setEditPhoto] = useState(authUserData?.photoURL || '');
  const [newPasswordProfile, setNewPasswordProfile] = useState('');
  const [confirmPasswordProfile, setConfirmPasswordProfile] = useState('');

  // Print Modals
  const [selectedStudentForRapot, setSelectedStudentForRapot] = useState<any>(null);
  const [showPrintRapotModal, setShowPrintRapotModal] = useState(false);
  const [showPrintRapotHafalanModal, setShowPrintRapotHafalanModal] = useState(false);
  const [printRapotPeriod, setPrintRapotPeriod] = useState('PTS Ganjil');
  const [printRapotHafalanSemester, setPrintRapotHafalanSemester] = useState('Semua');

  // Camera States
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('Hadir');
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Photo Viewer State
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Penilaian Siswa Massal States
  const [pkType, setPkType] = useState<'Hafalan' | 'Rapot'>('Hafalan');
  const [pkRapotPeriod, setPkRapotPeriod] = useState('PTS Ganjil');
  const [pkClass, setPkClass] = useState('');
  const [pkMaterialId, setPkMaterialId] = useState('');
  const [pkCategory, setPkCategory] = useState('');
  const [pkDate, setPkDate] = useState(new Date().toISOString().split('T')[0]);
  const [pkSemester, setPkSemester] = useState<any>('PTS Ganjil');
  const [pkStudentData, setPkStudentData] = useState<Record<string, any>>({});
  const [pkIsSaving, setPkIsSaving] = useState(false);
  const [schoolClasses, setSchoolClasses] = useState<any[]>([]);

  const navigate = useNavigate();

  // Keep local auth synced
  useEffect(() => {
    if (authUser) setUser(authUser);
    if (authUserData) {
      setUserData(authUserData);
      setEditName(authUserData.name || '');
      setEditPhoto(authUserData.photoURL || '');
    }
  }, [authUser, authUserData]);

  // Auth verify listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        try {
          let userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          let data = userDoc.data();
          if (!data && currentUser.email) {
            const q = query(collection(db, 'users'), where('email', '==', currentUser.email));
            const snap = await getDocs(q);
            if (!snap.empty) {
              data = snap.docs[0].data();
            }
          }
          if (data && data.role === 'guru') {
            setUser(currentUser);
            setUserData(data);
            setEditName(data.name || '');
            setEditPhoto(data.photoURL || '');
          }
        } catch (error) {
          console.error('Error verifying guru role:', error);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Firestore Realtime Data Listeners
  useEffect(() => {
    if (!user) return;

    // Fetch all users to extract students reliably
    const unsubStudents = onSnapshot(collection(db, 'users'), (snapshot) => {
      const mapped = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Extract all student accounts
      const studentDocs = mapped.filter(u => u.role === 'siswa' || u.role === 'student' || (!u.role && u.kelas));
      setAllStudents(studentDocs);

      const rawClass = (userData?.assignedClass || userData?.kelas || '').trim();
      const isGeneralTeacher = !rawClass || 
        rawClass.toLowerCase() === 'semua' || 
        rawClass.toLowerCase() === 'semua kelas' ||
        rawClass.toLowerCase() === 'semua tingkat' ||
        rawClass.toLowerCase() === 'wali kelas' ||
        rawClass.toLowerCase() === 'guru' ||
        rawClass.toLowerCase() === 'guru ra' ||
        rawClass.toLowerCase() === '-';

      const activeAll = studentDocs.filter(u => {
        const st = (u.status || 'Aktif').toString().trim().toLowerCase();
        return st === 'aktif' || st === 'active';
      });

      if (isGeneralTeacher) {
        setStudents(activeAll.length > 0 ? activeAll : studentDocs);
      } else {
        const tKelas = rawClass.toLowerCase();
        const normTKelas = tKelas.replace(/[^a-z0-9]/g, '');

        const filtered = activeAll.filter(u => {
          const sKelas = (u.kelas || '').toString().trim().toLowerCase();
          const normSKelas = sKelas.replace(/[^a-z0-9]/g, '');
          return (
            sKelas === tKelas ||
            normSKelas === normTKelas ||
            sKelas.includes(tKelas) ||
            tKelas.includes(sKelas) ||
            normSKelas.includes(normTKelas) ||
            normTKelas.includes(normSKelas)
          );
        });

        setStudents(filtered.length > 0 ? filtered : (activeAll.length > 0 ? activeAll : studentDocs));
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubProgress = onSnapshot(query(collection(db, 'progress'), orderBy('createdAt', 'desc')), (snapshot) => {
      setProgress(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'progress'));

    const unsubHafalanProgress = onSnapshot(collection(db, 'hafalan_progress'), (snapshot) => {
      setHafalanProgress(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentHafalanProgress)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'hafalan_progress'));

    const unsubAnnounce = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'announcements'));

    const unsubExams = onSnapshot(query(collection(db, 'exams'), orderBy('createdAt', 'desc')), (snapshot) => {
      setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'exams'));

    const unsubAttendance = onSnapshot(query(collection(db, 'attendance'), orderBy('timestamp', 'desc')), (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'attendance'));

    const unsubSubjects = onSnapshot(query(collection(db, 'subjects'), orderBy('createdAt', 'desc')), (snapshot) => {
      setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'subjects'));

    const unsubSubjectsConfig = onSnapshot(doc(db, 'settings', 'subjectsConfig'), (snap) => {
      if (snap.exists() && Array.isArray(snap.data().hiddenSubjects)) {
        setHiddenSubjects(snap.data().hiddenSubjects);
      }
    }, () => {});

    const unsubClasses = onSnapshot(query(collection(db, 'classes')), (snapshot) => {
      setSchoolClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'classes'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'landingPage'), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    }, () => {});

    const unsubKaldik = onSnapshot(query(collection(db, 'kaldik')), (snapshot) => {
      setKaldikData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    const unsubMaterials = onSnapshot(query(collection(db, 'materials'), orderBy('createdAt', 'desc')), (snapshot) => {
      setMaterialsData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    const unsubHafalanMaterials = onSnapshot(collection(db, 'hafalan_materials'), (snapshot) => {
      if (snapshot.empty) {
        setHafalanMaterials(initialHafalanMaterials);
      } else {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const sortedDocs = [...docs].sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
        setHafalanMaterials(sortedDocs);
      }
    }, () => {});

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

  // Keep students synced if userData or allStudents updates
  useEffect(() => {
    if (allStudents.length === 0) return;
    const rawClass = (userData?.assignedClass || userData?.kelas || '').trim();
    const isGeneralTeacher = !rawClass || 
      rawClass.toLowerCase() === 'semua' || 
      rawClass.toLowerCase() === 'semua kelas' ||
      rawClass.toLowerCase() === 'semua tingkat' ||
      rawClass.toLowerCase() === 'wali kelas' ||
      rawClass.toLowerCase() === 'guru' ||
      rawClass.toLowerCase() === 'guru ra' ||
      rawClass.toLowerCase() === '-';

    const activeAll = allStudents.filter(u => {
      const st = (u.status || 'Aktif').toString().trim().toLowerCase();
      return st === 'aktif' || st === 'active';
    });

    if (isGeneralTeacher) {
      setStudents(activeAll.length > 0 ? activeAll : allStudents);
      return;
    }

    const tKelas = rawClass.toLowerCase();
    const normTKelas = tKelas.replace(/[^a-z0-9]/g, '');

    const filtered = activeAll.filter(u => {
      const sKelas = (u.kelas || '').toString().trim().toLowerCase();
      const normSKelas = sKelas.replace(/[^a-z0-9]/g, '');
      return (
        sKelas === tKelas ||
        normSKelas === normTKelas ||
        sKelas.includes(tKelas) ||
        tKelas.includes(sKelas) ||
        normSKelas.includes(normTKelas) ||
        normTKelas.includes(normSKelas)
      );
    });

    setStudents(filtered.length > 0 ? filtered : (activeAll.length > 0 ? activeAll : allStudents));
  }, [allStudents, userData?.assignedClass, userData?.kelas]);

  // Check today's check-in status
  useEffect(() => {
    if (attendance && user) {
      const today = new Date().toISOString().split('T')[0];
      const todayAbsence = attendance.find(a => a.date === today && a.studentId === user.uid);
      setHasCheckedInToday(!!todayAbsence);
    }
  }, [attendance, user]);

  // Penilaian Kelas automatic data loader
  useEffect(() => {
    if (activeTab !== 'penilaian-kelas') return;
    const userClass = userData?.assignedClass || userData?.kelas;
    if (!pkClass && userClass) {
      setPkClass(userClass);
    }
    const clsFilter = pkClass || userClass || '';
    if (!clsFilter) return;

    if (pkType === 'Hafalan' && pkMaterialId) {
      const clsStudents = allStudents.filter(s => s.kelas === clsFilter || clsFilter === 'Semua');
      const newData: Record<string, any> = {};
      clsStudents.forEach(s => {
        const existingList = hafalanProgress.filter(p => p.studentId === s.id && p.materialId === pkMaterialId);
        const existing = existingList.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0];
        newData[s.id] = existing ? {
          id: existing.id,
          status: existing.status || 'Sedang Menghafal',
          stars: existing.stars || 0,
          notes: existing.catatanGuru || ''
        } : {
          id: null,
          status: 'Sedang Menghafal',
          stars: 0,
          notes: ''
        };
      });
      setPkStudentData(newData);
    } else if (pkType === 'Rapot' && pkCategory) {
      const clsStudents = allStudents.filter(s => s.kelas === clsFilter || clsFilter === 'Semua');
      const newData: Record<string, any> = {};
      clsStudents.forEach(s => {
        newData[s.id] = { score: '', status: 'Lulus', notes: '' };
      });
      setPkStudentData(newData);
    }
  }, [pkType, pkClass, pkMaterialId, pkCategory, pkSemester, allStudents, hafalanProgress, activeTab, userData]);

  const handleSavePk = async () => {
    if (pkIsSaving) return;
    setPkIsSaving(true);
    try {
      const userClass = userData?.assignedClass || userData?.kelas;
      const clsFilter = pkClass || userClass || '';
      const clsStudents = allStudents.filter(s => s.kelas === clsFilter || clsFilter === 'Semua');
      let savedCount = 0;

      for (const s of clsStudents) {
        const data = pkStudentData[s.id];
        if (!data) continue;

        if (pkType === 'Hafalan') {
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
          const docRef = doc(db, 'hafalan_progress', `${s.id}_${pkMaterialId}`);
          await setDoc(docRef, { ...payload, createdAt: serverTimestamp() }, { merge: true });
          savedCount++;
        } else if (pkType === 'Rapot') {
          if (data.score !== '' || data.notes) {
            await addDoc(collection(db, 'progress'), {
              studentId: s.id,
              title: '',
              category: pkCategory,
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
      alert(`Berhasil menyimpan penilaian untuk ${savedCount} siswa.`);
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan penilaian.');
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

  const getAvailableSubjects = (periodFilter?: string, classFilter?: string) => {
    const subjectSet = new Set<string>();
    subjects.forEach(s => {
      if (s.name && typeof s.name === 'string') subjectSet.add(s.name.trim());
    });
    const defaultSubjects = [
      "Nilai Agama & Moral", "Fisik Motorik", "Kognitif & Sains",
      "Bahasa & Literasi", "Seni & Kreativitas", "Sosial Emosional",
      "Al-Qur'an & Hafalan", "Fiqih & Ibadah", "Bahasa Arab",
      "Akidah Akhlak", "Pancasila / Kewarganegaraan"
    ];
    defaultSubjects.forEach(s => subjectSet.add(s));
    return Array.from(subjectSet).filter(Boolean).filter(sub => !hiddenSubjects.includes(sub));
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      alert('Nama mata pelajaran tidak boleh kosong!');
      return;
    }
    try {
      if (editingSubject) {
        if (editingSubject.id) {
          // Update existing custom subject in Firestore
          await updateDoc(doc(db, 'subjects', editingSubject.id), {
            name: newSubjectName.trim(),
            updatedAt: serverTimestamp()
          });
        } else {
          // If editing a default subject name, save it as custom subject and hide old default name
          await addDoc(collection(db, 'subjects'), {
            name: newSubjectName.trim(),
            createdAt: serverTimestamp(),
            createdBy: user?.uid || 'guru'
          });
          const updatedHidden = Array.from(new Set([...hiddenSubjects, editingSubject.name]));
          await setDoc(doc(db, 'settings', 'subjectsConfig'), { hiddenSubjects: updatedHidden }, { merge: true });
        }
        alert('Mata pelajaran berhasil diperbarui!');
      } else {
        await addDoc(collection(db, 'subjects'), {
          name: newSubjectName.trim(),
          createdAt: serverTimestamp(),
          createdBy: user?.uid || 'guru'
        });
        alert('Mata pelajaran berhasil ditambahkan!');
      }
      setNewSubjectName('');
      setEditingSubject(null);
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('Gagal menyimpan mata pelajaran.');
    }
  };

  const handleDeleteSubject = async (subject: any) => {
    const subName = typeof subject === 'string' ? subject : subject.name;
    if (!window.confirm(`Hapus/Sembunyikan mata pelajaran "${subName}"?`)) return;
    try {
      if (subject.id) {
        await deleteDoc(doc(db, 'subjects', subject.id));
      } else {
        const updatedHidden = Array.from(new Set([...hiddenSubjects, subName]));
        await setDoc(doc(db, 'settings', 'subjectsConfig'), { hiddenSubjects: updatedHidden }, { merge: true });
      }
      alert('Mata pelajaran berhasil dihapus/disembunyikan.');
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Gagal menghapus mata pelajaran.');
    }
  };

  const handleToggleHideSubject = async (subjectName: string) => {
    try {
      const isHidden = hiddenSubjects.includes(subjectName);
      const updatedHidden = isHidden
        ? hiddenSubjects.filter(s => s !== subjectName)
        : [...hiddenSubjects, subjectName];
      await setDoc(doc(db, 'settings', 'subjectsConfig'), { hiddenSubjects: updatedHidden }, { merge: true });
    } catch (error) {
      console.error('Error toggling hide subject:', error);
      alert('Gagal memperbarui status visibilitas mapel.');
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
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
      setUserData((prev: any) => ({ ...prev, name: editName, photoURL: editPhoto }));
      alert('Profil berhasil diperbarui!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleChangePasswordProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordProfile !== confirmPasswordProfile) {
      alert('Password baru dan konfirmasi tidak cocok!');
      return;
    }
    if (newPasswordProfile.length < 6) {
      alert('Password minimal 6 karakter!');
      return;
    }
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPasswordProfile);
        alert('Password berhasil diperbarui!');
        setNewPasswordProfile('');
        setConfirmPasswordProfile('');
      }
    } catch (error: any) {
      alert('Gagal mengubah password: ' + error.message);
    }
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
          if (user?.uid) {
            await updateDoc(doc(db, 'users', user.uid), { photoURL: compressed });
            setUserData((prev: any) => ({ ...prev, photoURL: compressed }));
          }
        } catch (err) {
          setEditPhoto(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera Attendance functions
  const startCamera = async () => {
    setShowCamera(true);
    setCapturedPhoto(null);
    setIsSubmittingAttendance(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error(err);
      alert('Gagal mengakses kamera. Pastikan izin kamera diberikan.');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
    setCapturedPhoto(null);
    setIsSubmittingAttendance(false);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const maxDim = 800;
    let w = video.videoWidth || 640;
    let h = video.videoHeight || 480;
    if (w > h && w > maxDim) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else if (h > maxDim) {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
      setCapturedPhoto(photoDataUrl);
    }
  };

  const handleConfirmAttendance = async () => {
    if (attendanceStatus === 'Hadir' && !capturedPhoto) {
      alert('Silakan ambil foto selfie presensi terlebih dahulu.');
      return;
    }
    if (isSubmittingAttendance) return;
    setIsSubmittingAttendance(true);
    const today = new Date().toISOString().split('T')[0];
    const path = 'attendance';

    try {
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
          alert('Presensi berhasil dicatat!');
          stopCamera();
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, path);
        } finally {
          setIsSubmittingAttendance(false);
        }
      };

      if (attendanceStatus === 'Hadir' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await saveRecord({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          },
          async () => {
            await saveRecord(null);
          },
          { timeout: 5000 }
        );
      } else {
        await saveRecord(null);
      }
    } catch (error) {
      setIsSubmittingAttendance(false);
    }
  };

  // Progress Save
  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = 'progress';
    try {
      const data = {
        studentId: selectedStudent,
        title: progressCategory,
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
        alert('Laporan berhasil diperbarui!');
      } else {
        await addDoc(collection(db, path), { ...data, createdAt: serverTimestamp() });
        alert('Laporan berhasil ditambahkan!');
      }
      setShowProgressModal(false);
      setEditingProgress(null);
    } catch (error) {
      handleFirestoreError(error, editingProgress ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const handleDeleteProgress = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus laporan penilaian ini?')) {
      try {
        await deleteDoc(doc(db, 'progress', id));
        alert('Laporan berhasil dihapus!');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `progress/${id}`);
      }
    }
  };

  // Execute Print Rapot
  const handleExecutePrintRapot = () => {
    if (!selectedStudentForRapot) return;
    const student = selectedStudentForRapot;
    const studentProgressList = progress
      .filter(p => p.studentId === student.id)
      .filter(p => printRapotPeriod === 'Semua' || p.evaluationPeriod === printRapotPeriod)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let itemsHtml = '';
    studentProgressList.forEach((p, idx) => {
      const scoreNum = Number(p.score) || 0;
      const gradeInfo = getScoreGradeInfo(scoreNum);
      itemsHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <strong>${p.category || p.title}</strong>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${scoreNum}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
            <strong>${gradeInfo.grade}</strong> (${gradeInfo.text})
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.description || '-'}</td>
        </tr>
      `;
    });

    if (studentProgressList.length === 0) {
      itemsHtml = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: #666; font-style: italic;">Belum ada data evaluasi belajar.</td></tr>`;
    }

    const html = `
      <html>
        <head>
          <title>Rapot Belajar - ${student.name}</title>
          <style>${getPrintStyles()}</style>
        </head>
        <body onload="window.print();">
          ${getPrintHeaderHTML('LAPORAN HASIL BELAJAR (RAPOT)', settings?.schoolName, settings?.logoUrl)}
          <div class="student-info" style="display: grid; grid-template-columns: 120px 1fr 120px 1fr; gap: 6px; margin: 20px 0; font-size: 13px;">
            <div>Nama Santri</div><div>: <strong>${student.name}</strong></div>
            <div>Kelas</div><div>: ${student.kelas || '-'}</div>
            <div>NIS/NISN</div><div>: ${student.email?.split('@')[0] || '-'}</div>
            <div>Periode</div><div>: ${printRapotPeriod}</div>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #f8fafc; text-align: left; font-size: 12px;">
                <th style="padding: 10px; border-bottom: 2px solid #ddd; width: 40px; text-align: center;">No</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd;">Mata Pelajaran</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd; width: 80px; text-align: center;">Nilai</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd; width: 120px; text-align: center;">Predikat</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd;">Catatan Hasil Belajar</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 13px;">
            <div><p>Mengetahui,</p><p>Orang Tua / Wali Santri</p><br><br><br><p>_______________________</p></div>
            <div><p>Arjawinangun, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p><p>Wali Kelas</p><br><br><br><p><strong>${editName || 'Ustadz/Ustadzah'}</strong></p></div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    setShowPrintRapotModal(false);
  };

  // Execute Print Rapot Hafalan
  const handleExecutePrintRapotHafalan = () => {
    if (!selectedStudentForRapot) return;
    const student = selectedStudentForRapot;
    const studentHafalanProgressList = hafalanProgress
      .filter(p => p.studentId === student.id)
      .filter(p => printRapotHafalanSemester === 'Semua' || p.evaluationSemester === printRapotHafalanSemester);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let itemsHtml = '';
    studentHafalanProgressList.forEach((p, idx) => {
      const mat = hafalanMaterials.find(m => m.id === p.materialId);
      let starStr = '';
      for (let i = 0; i < (p.stars || 0); i++) { starStr += '★ '; }
      itemsHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <strong>${mat?.judul || 'Materi'}</strong>
            <br><small style="color: #666;">${mat?.kategori || ''}</small>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
            <strong style="color: #059669;">${p.status}</strong>
            <br><small style="color: #d97706; font-size: 14px;">${starStr}</small>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.catatanGuru || '-'}</td>
        </tr>
      `;
    });

    if (studentHafalanProgressList.length === 0) {
      itemsHtml = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #666; font-style: italic;">Belum ada data evaluasi hafalan pada semester ini.</td></tr>`;
    }

    const html = `
      <html>
        <head>
          <title>Rapot Hafalan Tahfidz - ${student.name}</title>
          <style>${getPrintStyles()}</style>
        </head>
        <body onload="window.print();">
          ${getPrintHeaderHTML('LAPORAN HASIL HAFALAN TAHFIDZ (RAPOT)', settings?.schoolName, settings?.logoUrl)}
          <div class="student-info" style="display: grid; grid-template-columns: 120px 1fr 120px 1fr; gap: 6px; margin: 20px 0; font-size: 13px;">
            <div>Nama Santri</div><div>: <strong>${student.name}</strong></div>
            <div>Kelas</div><div>: ${student.kelas || '-'}</div>
            <div>NIS/NISN</div><div>: ${student.email?.split('@')[0] || '-'}</div>
            <div>Semester</div><div>: ${printRapotHafalanSemester}</div>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #f8fafc; text-align: left; font-size: 12px;">
                <th style="padding: 10px; border-bottom: 2px solid #ddd; width: 40px; text-align: center;">No</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd;">Judul Materi Hafalan</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd; width: 140px; text-align: center;">Status & Bintang</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd;">Catatan Ustadz/Ustadzah</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 13px;">
            <div><p>Mengetahui,</p><p>Orang Tua / Wali Santri</p><br><br><br><p>_______________________</p></div>
            <div><p>Arjawinangun, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p><p>Wali Kelas / Guru Tahfidz</p><br><br><br><p><strong>${editName || 'Ustadz/Ustadzah'}</strong></p></div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    setShowPrintRapotHafalanModal(false);
  };

  const navMenuItems = [
    { id: 'overview', label: 'Beranda Guru', icon: BarChartIcon },
    { id: 'students', label: 'Daftar Siswa', icon: Users },
    { id: 'penilaian-kelas', label: 'Penilaian Kelas', icon: Edit },
    { id: 'progress', label: 'Rapot Belajar', icon: GraduationCap },
    { id: 'hafalan', label: 'Modul Hafalan', icon: Star },
    { id: 'exams', label: 'Jadwal & Ujian', icon: FileCheck },
    { id: 'kaldik', label: 'Kalender (Kaldik)', icon: Calendar },
    { id: 'attendance', label: 'Presensi Guru', icon: Camera },
    { id: 'announcements', label: 'Info & Notif', icon: Bell, badge: announcements.filter(a => !a.target || a.target === 'all' || a.target === 'guru').length },
    { id: 'profile', label: 'Profil Saya', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-20 md:pb-0 relative font-sans text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200/80 p-6 hidden md:flex flex-col shadow-xs z-30 shrink-0">
        <div className="flex items-center gap-3.5 mb-8">
          <div className="w-11 h-11 overflow-hidden rounded-2xl border-2 border-emerald-600/10 p-0.5 bg-white shadow-xs flex items-center justify-center shrink-0">
            <img src="/logo_ra.jpeg" alt="Logo RA Darusyifa" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-black text-slate-900 leading-none tracking-tight text-base truncate">
              Portal Guru
            </h1>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
              RA Darusyifa
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
          {navMenuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all font-bold group cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600 transition-colors'} />
                  <span className="text-xs tracking-tight">{item.label}</span>
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
            onClick={() => navigate('/kaldik')}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
          >
            <Calendar size={18} className="text-slate-400" />
            <span className="text-xs tracking-tight">Kaldik Fullscreen</span>
          </button>

          <button
            onClick={() => navigate('/juknis')}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100 mt-2 cursor-pointer"
          >
            <BookOpen size={18} className="text-emerald-600" />
            <span className="text-xs tracking-tight">Panduan Juknis</span>
          </button>
        </div>

        {/* Sidebar Footer Profile & Logout */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
          <div 
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
              {editPhoto ? <img src={editPhoto} alt="Guru" className="w-full h-full object-cover" /> : editName?.charAt(0) || 'G'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">{editName || 'Guru RA'}</p>
              <p className="text-[10px] text-slate-400 truncate">{userData?.assignedClass || 'Wali Kelas'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 font-bold text-xs transition-all cursor-pointer"
          >
            <LogOut size={15} />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Bottom Navigation Bar (Mobile) - 5 tabs with Menu (Garis Tiga) */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] flex justify-around items-center py-2 px-3 z-50" 
        style={{ WebkitBackdropFilter: 'blur(16px)' }}
      >
        {[
          { id: 'overview', label: 'Beranda', icon: BarChartIcon },
          { id: 'students', label: 'Santri', icon: Users },
          { id: 'penilaian-kelas', label: 'Penilaian', icon: Edit },
          { id: 'hafalan', label: 'Hafalan', icon: Star },
          { id: 'menu', label: 'Menu', icon: Menu, isMenu: true },
        ].map((item) => {
          const isActive = item.isMenu ? isSidebarOpen : activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isMenu) {
                  setIsSidebarOpen(true);
                } else {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all py-1 relative ${
                isActive ? 'text-emerald-600 font-black' : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all relative ${isActive ? 'bg-emerald-50 text-emerald-600 scale-110 shadow-xs' : 'text-slate-400'}`}>
                <item.icon size={20} />
              </div>
              <span className={`text-[10.5px] tracking-tight ${isActive ? 'font-black text-emerald-600' : 'font-semibold text-slate-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Bottom Sheet Menu (Guru) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[90] md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Bottom Sheet */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed bottom-0 inset-x-0 bg-white rounded-t-[2.5rem] shadow-2xl p-6 z-[100] md:hidden max-h-[85vh] flex flex-col border-t border-slate-100"
            >
              {/* Drag indicator */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 overflow-hidden rounded-xl border border-emerald-600/10 p-0.5 bg-white shadow-xs flex items-center justify-center">
                    <img 
                      src="/logo_ra.jpeg" 
                      alt="Logo" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <div>
                    <h2 className="font-display font-black text-slate-900 text-sm leading-tight">Portal Guru - Menu</h2>
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">RA Darusyifa Arjawinangun</p>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 p-1.5 hover:bg-slate-50 rounded-xl">
                  <X size={22} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {navMenuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                        activeTab === item.id
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600 font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <item.icon size={20} className={activeTab === item.id ? 'text-emerald-600' : 'text-slate-400'} />
                      <span className="text-xs font-bold tracking-tight leading-tight">{item.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <button 
                    onClick={() => { navigate('/kaldik'); setIsSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-slate-600 bg-slate-50 border border-slate-100 font-bold text-xs transition-all hover:bg-slate-100"
                  >
                    <Calendar size={18} className="text-slate-400" />
                    <span>Kalender Akademik (Kaldik)</span>
                  </button>
                  <button 
                    onClick={() => { navigate('/juknis'); setIsSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-emerald-800 bg-emerald-50 border border-emerald-100 font-bold text-xs transition-all hover:bg-emerald-100"
                  >
                    <BookOpen size={18} className="text-emerald-600" />
                    <span>Panduan / Juknis Guru</span>
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

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen flex flex-col bg-[#F8FAFC] overflow-y-auto">
        {/* Desktop Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 px-6 lg:px-8 py-3.5 hidden md:flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">
              Selamat Bertugas di Portal Guru RA Darusyifa
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button
              onClick={() => setActiveTab('announcements')}
              className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              title="Notifikasi Pengumuman"
            >
              <Bell size={18} />
              {announcements.filter(a => !a.target || a.target === 'all' || a.target === 'guru').length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
              )}
            </button>

            {/* Profile Chip & Desktop Logout */}
            <div
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-3 pl-4 border-l border-slate-100 cursor-pointer group"
              title="Buka Pengaturan Profil Guru"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0 text-xs">
                {editPhoto ? <img src={editPhoto} alt="Guru" className="w-full h-full object-cover" /> : editName?.charAt(0) || 'G'}
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                  {editName || 'Guru RA'}
                </h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {userData?.assignedClass || 'WALI KELAS'}
                </p>
              </div>
            </div>

            {/* Direct Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all active:scale-95 border border-rose-100 cursor-pointer shadow-2xs ml-1"
              title="Keluar Sesi Akun"
            >
              <LogOut size={14} />
              <span>Keluar</span>
            </button>
          </div>
        </header>

        {/* Mobile Header Bar - Matching Screenshot Style without Top Hamburger */}
        <div className="md:hidden bg-white/95 border-b border-slate-100 px-4 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-xs backdrop-blur-md" style={{ WebkitBackdropFilter: 'blur(16px)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 overflow-hidden rounded-xl border border-emerald-500/20 p-1 bg-emerald-50/40 shadow-xs flex items-center justify-center">
              <img src="/logo_ra.jpeg" alt="Logo RA Darusyifa" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-display font-black text-slate-900 text-[15px] leading-tight">Portal Guru</h2>
              <p className="text-[8px] font-black uppercase tracking-wider text-slate-400 mt-0.5">RA DARUSYIFA ARJAWINANGUN</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('announcements')}
              className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 hover:text-emerald-600 transition-all relative active:scale-95 shadow-xs"
              title="Notifikasi"
            >
              <Bell size={18} />
              {announcements.filter(a => !a.target || a.target === 'all' || a.target === 'guru').length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                  {announcements.filter(a => !a.target || a.target === 'all' || a.target === 'guru').length > 9 ? '9+' : announcements.filter(a => !a.target || a.target === 'all' || a.target === 'guru').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 transition-colors active:scale-95"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-500/40 bg-slate-100 flex items-center justify-center shadow-xs text-xs font-bold text-slate-700">
                {editPhoto ? <img src={editPhoto} alt="Foto Guru" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : editName?.charAt(0) || 'G'}
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Dynamic Tab Body */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {activeTab === 'overview' && (
            <GuruOverviewTab
              user={user}
              userData={userData}
              students={students}
              progress={progress}
              hafalanProgress={hafalanProgress}
              hafalanMaterials={hafalanMaterials}
              announcements={announcements}
              exams={exams}
              hasCheckedInToday={hasCheckedInToday}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenAttendanceCamera={startCamera}
            />
          )}

          {activeTab === 'students' && (
            <GuruStudentsTab
              students={students}
              allStudents={allStudents}
              userData={userData}
              progress={progress}
              hafalanProgress={hafalanProgress}
              hafalanMaterials={hafalanMaterials}
              onOpenProgressModal={(studentId) => {
                setSelectedStudent(studentId);
                setEditingProgress(null);
                setShowProgressModal(true);
              }}
              onPrintRapot={(student) => {
                setSelectedStudentForRapot(student);
                setPrintRapotPeriod('PTS Ganjil');
                setShowPrintRapotModal(true);
              }}
              onPrintRapotHafalan={(student) => {
                setSelectedStudentForRapot(student);
                setPrintRapotHafalanSemester('Semua');
                setShowPrintRapotHafalanModal(true);
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'penilaian-kelas' && (
            <GuruPenilaianKelasTab
              students={students}
              allStudents={allStudents}
              userData={userData}
              hafalanMaterials={hafalanMaterials}
              hafalanProgress={hafalanProgress}
              pkType={pkType}
              setPkType={setPkType}
              pkClass={pkClass}
              setPkClass={setPkClass}
              pkMaterialId={pkMaterialId}
              setPkMaterialId={setPkMaterialId}
              pkCategory={pkCategory}
              setPkCategory={setPkCategory}
              pkDate={pkDate}
              setPkDate={setPkDate}
              pkSemester={pkSemester}
              setPkSemester={setPkSemester}
              pkRapotPeriod={pkRapotPeriod}
              setPkRapotPeriod={setPkRapotPeriod}
              pkStudentData={pkStudentData}
              setPkStudentData={setPkStudentData}
              pkIsSaving={pkIsSaving}
              onSavePk={handleSavePk}
              getAvailableSubjects={getAvailableSubjects}
              schoolClasses={schoolClasses}
            />
          )}

          {activeTab === 'progress' && (
            <GuruProgressRapotTab
              progress={progress}
              students={students}
              allStudents={allStudents}
              userData={userData}
              onOpenNewProgress={() => {
                setEditingProgress(null);
                setSelectedStudent('');
                setProgressCategory('');
                setProgressDesc('');
                setProgressScore(90);
                setShowProgressModal(true);
              }}
              onEditProgress={(p) => {
                setEditingProgress(p);
                setSelectedStudent(p.studentId);
                setProgressCategory(p.category || p.title);
                setProgressEvaluationPeriod(p.evaluationPeriod || 'Harian');
                setProgressDesc(p.description || '');
                setProgressScore(p.score || 90);
                setProgressDate(p.date || new Date().toISOString().split('T')[0]);
                setShowProgressModal(true);
              }}
              onDeleteProgress={handleDeleteProgress}
              onOpenSubjectModal={() => setShowSubjectModal(true)}
              onPromptPrintRapot={(student) => {
                setSelectedStudentForRapot(student);
                setPrintRapotPeriod('PTS Ganjil');
                setShowPrintRapotModal(true);
              }}
              getScoreGradeInfo={getScoreGradeInfo}
            />
          )}

          {activeTab === 'hafalan' && (
            <GuruHafalanTab
              hafalanProgress={hafalanProgress}
              hafalanMaterials={hafalanMaterials}
              students={students}
              allStudents={allStudents}
              schoolClasses={schoolClasses}
              userData={userData}
              onEvaluateHafalan={(p) => {
                setEvaluateHafalan(p);
                setHafalanEvalStars(p.stars || 0);
                setHafalanEvalNotes(p.catatanGuru || '');
                setHafalanEvalStatus(p.status || 'Sedang Menghafal');
                setHafalanEvalSemester(p.evaluationSemester || 'PTS Ganjil');
                setShowHafalanModal(true);
              }}
              onPromptPrintRapotHafalan={(student) => {
                setSelectedStudentForRapot(student);
                setPrintRapotHafalanSemester('Semua');
                setShowPrintRapotHafalanModal(true);
              }}
            />
          )}

          {activeTab === 'attendance' && (
            <GuruAttendanceTab
              user={user}
              userData={userData}
              attendance={attendance}
              hasCheckedInToday={hasCheckedInToday}
              onOpenAttendanceCamera={startCamera}
              onSelectPhoto={(url) => setSelectedPhoto(url)}
            />
          )}

          {activeTab === 'exams' && (
            <div className="space-y-6 animate-in fade-in duration-300 pb-20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">Jadwal Ujian & Evaluasi</h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Jadwal resmi PTS dan PAS untuk kelas yang diatur Admin.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {exams.map((exam) => (
                  <div key={exam.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-black uppercase">{exam.type}</span>
                        <span className="text-sm font-bold text-slate-700">{exam.academicYear}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {(exam.schedules || []).map((s: any) => (
                        <div key={s.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{s.subject} ({s.kelas || 'Semua Kelas'})</p>
                            <p className="text-[11px] text-slate-500">{s.date} • {s.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'kaldik' && (
            <div className="space-y-6 animate-in fade-in duration-300 pb-20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">Kalender Pendidikan (Kaldik)</h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Agenda resmi kegiatan belajar mengajar dan libur sekolah.</p>
                </div>
                <button
                  onClick={() => navigate('/kaldik')}
                  className="px-4 py-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ExternalLink size={15} />
                  <span>Buka Kaldik Penuh</span>
                </button>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <KaldikCalendar events={kaldikData} />
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="space-y-6 animate-in fade-in duration-300 pb-20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">Pengumuman & Informasi Sekolah</h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Informasi resmi dari pihak sekolah dan manajemen RA Darusyifa.</p>
                </div>
              </div>
              <div className="grid gap-4">
                {announcements.filter(a => !a.target || a.target === 'all' || a.target === 'guru').map((ann) => (
                  <div key={ann.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded-full">
                        {ann.target === 'guru' ? 'Khusus Guru' : 'Semua'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {ann.createdAt ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{ann.title}</h3>
                    <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: ann.content }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <GuruProfileTab
              user={user}
              userData={userData}
              editName={editName}
              setEditName={setEditName}
              editPhoto={editPhoto}
              newPassword={newPasswordProfile}
              setNewPassword={setNewPasswordProfile}
              confirmPassword={confirmPasswordProfile}
              setConfirmPassword={setConfirmPasswordProfile}
              onUpdateProfile={handleUpdateProfile}
              onChangePassword={handleChangePasswordProfile}
              onPhotoFileChange={handleProfilePhotoChange}
              onLogout={handleLogout}
            />
          )}
        </div>
      </main>

      {/* Progress Input Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowProgressModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-5">{editingProgress ? 'Edit Nilai Belajar' : 'Input Nilai Belajar Santri'}</h3>
            <form onSubmit={handleSaveProgress} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pilih Santri</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">-- Pilih Santri --</option>
                  {allStudents.filter(s => (s.status || 'Aktif') === 'Aktif').map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.kelas || '-'})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Periode</label>
                  <select
                    value={progressEvaluationPeriod}
                    onChange={(e) => setProgressEvaluationPeriod(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PTS Ganjil">PTS Ganjil</option>
                    <option value="PAS Ganjil">PAS Ganjil</option>
                    <option value="PTS Genap">PTS Genap</option>
                    <option value="PAS Genap">PAS Genap</option>
                    <option value="Harian">Harian</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mata Pelajaran</label>
                  <select
                    value={progressCategory}
                    onChange={(e) => setProgressCategory(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">-- Pilih Mapel --</option>
                    {getAvailableSubjects().map((sub, idx) => (
                      <option key={idx} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nilai (1-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progressScore}
                    onChange={(e) => setProgressScore(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                  <select
                    value={progressStatus}
                    onChange={(e) => setProgressStatus(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Lulus">Lulus</option>
                    <option value="Belum Lulus">Belum Lulus</option>
                    <option value="Mengulang">Mengulang</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Catatan Hasil Belajar</label>
                <textarea
                  value={progressDesc}
                  onChange={(e) => setProgressDesc(e.target.value)}
                  placeholder="Tuliskan catatan evaluasi perkembangan..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 h-24 resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save size={16} />
                <span>Simpan Penilaian</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hafalan Evaluation Modal */}
      {showHafalanModal && evaluateHafalan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <button onClick={() => setShowHafalanModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-slate-900">Evaluasi Hafalan Tahfidz</h3>
            {(() => {
              const mat = hafalanMaterials.find(m => m.id === evaluateHafalan.materialId);
              const st = allStudents.find(s => s.id === evaluateHafalan.studentId);
              return (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100">
                    <p className="text-xs font-bold text-amber-950">Santri: {st?.name}</p>
                    <p className="text-xs text-amber-800">Materi: {mat?.judul} ({mat?.kategori})</p>
                  </div>
                  {evaluateHafalan.recordingDataUrl && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                      <audio controls src={evaluateHafalan.recordingDataUrl} className="w-full" />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bintang Penilaian</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setHafalanEvalStars(star)}
                          className={`p-1.5 text-2xl transition-transform active:scale-125 ${
                            hafalanEvalStars >= star ? 'text-amber-400' : 'text-slate-200'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status Kelulusan</label>
                    <select
                      value={hafalanEvalStatus}
                      onChange={(e) => setHafalanEvalStatus(e.target.value as HafalanStatus)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Sedang Menghafal">Sedang Menghafal</option>
                      <option value="Lancar">Lancar</option>
                      <option value="Mumtaz (Lulus)">Mumtaz (Lulus)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Catatan Ustadz/Ustadzah</label>
                    <textarea
                      value={hafalanEvalNotes}
                      onChange={(e) => setHafalanEvalNotes(e.target.value)}
                      placeholder="Contoh: Tajwid sangat bagus, makhraj fasih..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 h-24 resize-none"
                    />
                  </div>
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
                        alert('Evaluasi hafalan berhasil disimpan!');
                        setShowHafalanModal(false);
                      } catch (err) {
                        handleFirestoreError(err, OperationType.UPDATE, `hafalan_progress/${evaluateHafalan.id}`);
                      }
                    }}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-amber-200 transition-all cursor-pointer"
                  >
                    Simpan Nilai Hafalan
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[300] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Presensi Foto Selfie</h3>
              <button onClick={stopCamera} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
              {!capturedPhoto ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
              ) : (
                <img src={capturedPhoto} alt="Selfie" className="w-full h-full object-cover" />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            {!capturedPhoto ? (
              <button
                type="button"
                onClick={takePhoto}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera size={18} />
                <span>Ambil Foto Sekarang</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCapturedPhoto(null);
                    startCamera();
                  }}
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Foto Ulang
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAttendance}
                  disabled={isSubmittingAttendance}
                  className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-200"
                >
                  {isSubmittingAttendance ? 'Menyimpan...' : 'Kirim Presensi'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Print Rapot Selection Modal */}
      {showPrintRapotModal && selectedStudentForRapot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Cetak Rapot Belajar Siswa</h3>
              <button onClick={() => setShowPrintRapotModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Santri: <strong>{selectedStudentForRapot.name}</strong> ({selectedStudentForRapot.kelas || '-'})
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pilih Periode Rapot</label>
              <select
                value={printRapotPeriod}
                onChange={(e) => setPrintRapotPeriod(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Semua">Semua Periode</option>
                <option value="PTS Ganjil">PTS Ganjil</option>
                <option value="PAS Ganjil">PAS Ganjil</option>
                <option value="PTS Genap">PTS Genap</option>
                <option value="PAS Genap">PAS Genap</option>
                <option value="Harian">Laporan Harian</option>
              </select>
            </div>
            <button
              onClick={handleExecutePrintRapot}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer size={16} />
              <span>Buka Jendela Cetak Rapot</span>
            </button>
          </div>
        </div>
      )}

      {/* Print Rapot Hafalan Modal */}
      {showPrintRapotHafalanModal && selectedStudentForRapot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Cetak Rapot Hafalan Tahfidz</h3>
              <button onClick={() => setShowPrintRapotHafalanModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Santri: <strong>{selectedStudentForRapot.name}</strong> ({selectedStudentForRapot.kelas || '-'})
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pilih Semester</label>
              <select
                value={printRapotHafalanSemester}
                onChange={(e) => setPrintRapotHafalanSemester(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Semua">Semua Semester</option>
                <option value="PTS Ganjil">PTS Ganjil</option>
                <option value="PAS Ganjil">PAS Ganjil</option>
                <option value="PTS Genap">PTS Genap</option>
                <option value="PAS Genap">PAS Genap</option>
              </select>
            </div>
            <button
              onClick={handleExecutePrintRapotHafalan}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-amber-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer size={16} />
              <span>Buka Jendela Cetak Rapot Hafalan</span>
            </button>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-[400] flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-3xl w-full flex justify-center">
            <button onClick={() => setSelectedPhoto(null)} className="absolute -top-10 right-0 text-white hover:text-slate-300">
              <X size={28} />
            </button>
            <img src={selectedPhoto} alt="Preview" className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain" />
          </div>
        </div>
      )}

      {/* Subject Management Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[250] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">Kelola Mata Pelajaran</h3>
                  <p className="text-xs text-slate-500">Tambah, edit nama, hapus atau atur visibilitas mapel</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowSubjectModal(false);
                  setEditingSubject(null);
                  setNewSubjectName('');
                }} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Input Tambah / Edit */}
            <form onSubmit={handleSaveSubject} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                {editingSubject ? `Edit Nama Mapel: ${editingSubject.name}` : 'Tambah Mata Pelajaran Baru'}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Contoh: Seni Rupa & Mewarnai"
                  className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Save size={15} />
                    <span>{editingSubject ? 'Simpan' : 'Tambah'}</span>
                  </button>
                  {editingSubject && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSubject(null);
                        setNewSubjectName('');
                      }}
                      className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>
            </form>

            {/* List Mapel Tambahan / Kustom */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Mata Pelajaran Tambahan ({subjects.length})
                </h4>
                <span className="text-[11px] text-slate-400">Tersimpan di Database</span>
              </div>
              {subjects.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 font-medium">
                  Belum ada mapel kustom. Tambahkan melalui form di atas.
                </div>
              ) : (
                <div className="space-y-2">
                  {subjects.map((sub: any) => (
                    <div key={sub.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-xs hover:border-emerald-200 transition-all">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800">{sub.name}</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold">Kustom</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSubject(sub);
                            setNewSubjectName(sub.name);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Nama Mapel"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubject(sub)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Mapel"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* List Mapel Standar / Bawaan Kurikulum */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Mata Pelajaran Standar Kurikulum RA
                </h4>
                <span className="text-[11px] text-slate-400">Bisa disembunyikan / diedit</span>
              </div>
              <div className="space-y-2">
                {[
                  "Nilai Agama & Moral", "Fisik Motorik", "Kognitif & Sains",
                  "Bahasa & Literasi", "Seni & Kreativitas", "Sosial Emosional",
                  "Al-Qur'an & Hafalan", "Fiqih & Ibadah", "Bahasa Arab",
                  "Akidah Akhlak", "Pancasila / Kewarganegaraan"
                ].map((defSub, idx) => {
                  const isHidden = hiddenSubjects.includes(defSub);
                  return (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isHidden ? 'bg-slate-50/70 border-slate-200/60 opacity-60' : 'bg-white border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${isHidden ? 'bg-slate-300' : 'bg-blue-500'}`}></span>
                        <span className={`text-xs sm:text-sm font-semibold ${isHidden ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {defSub}
                        </span>
                        {isHidden && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold">Tersembunyi</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSubject({ name: defSub });
                            setNewSubjectName(defSub);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Ubah nama mapel ini"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleHideSubject(defSub)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isHidden ? 'text-slate-500 hover:bg-slate-200' : 'text-amber-600 hover:bg-amber-50'
                          }`}
                          title={isHidden ? 'Tampilkan Mapel' : 'Sembunyikan Mapel'}
                        >
                          {isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
