import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, getDoc, doc, updateDoc, deleteDoc, orderBy, where, getDocs, setDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { Users, BookOpen, Plus, Trash2, Edit, LogOut, User, Bell, CheckCircle, X, Menu, Save, Camera, Clock, BarChart as BarChartIcon, TrendingUp, Printer, Star, Megaphone, GraduationCap, Calendar, Search, Filter, Image as ImageIcon, FileText, Download } from 'lucide-react';
import { staticHafalanMaterials as initialHafalanMaterials, StudentHafalanProgress, HafalanStatus, getNextMaterialId } from '../data/hafalanData';
import { useNavigate } from 'react-router-dom';
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
  const [progress, setProgress] = useState<any[]>([]);
  const [kaldikData, setKaldikData] = useState<any[]>([]);
  const [materialsData, setMaterialsData] = useState<any[]>([]);
  const [hafalanProgress, setHafalanProgress] = useState<StudentHafalanProgress[]>([]);
  const [hafalanMaterials, setHafalanMaterials] = useState<any[]>(initialHafalanMaterials);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
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
      setStudents(mapped.filter(u => {
        const isActive = (u.status || 'Aktif') === 'Aktif';
        const userClass = userData?.assignedClass || userData?.kelas;
        const isSameClass = userClass ? u.kelas === userClass : true;
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
      unsubClasses();
      unsubSettings();
      unsubKaldik();
      unsubMaterials();
      unsubHafalanMaterials();
    };
  }, [user, userData?.assignedClass, userData?.kelas]);

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
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        alert('Gagal membaca file foto.');
      };
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
      
      // Mirror the context
      context.translate(canvasRef.current.width, 0);
      context.scale(-1, 1);
      
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
        onClick={() => window.open('https://kaldikradarusyifa.netlify.app/', '_blank')}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium hover:bg-gray-50 text-gray-600`}
      >
        <BookOpen size={20} className={'text-gray-400'} /> Kaldik & Materi
      </button>
      <button 
        onClick={() => { setActiveTab('hafalan'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'hafalan' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <Star size={20} className={activeTab === 'hafalan' ? 'text-white' : 'text-gray-400'} /> Hafalan & Modul
      </button>
      <button 
        onClick={() => { setActiveTab('penilaian-kelas'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'penilaian-kelas' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <Edit size={20} className={activeTab === 'penilaian-kelas' ? 'text-white' : 'text-gray-400'} /> Penilaian Kelas
      </button>
      <button 
        onClick={() => { setActiveTab('progress'); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-medium ${activeTab === 'progress' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-50 text-gray-600'}`}
      >
        <GraduationCap size={20} className={activeTab === 'progress' ? 'text-white' : 'text-gray-400'} /> Rapot Siswa
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
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[2px] mt-1">RA Darusyifa Arjawinangun</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <NavItems />
        </div>
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-xl border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] flex justify-around items-center px-4 py-2 z-50 pb-safe transition-all" style={{ WebkitBackdropFilter: 'blur(24px)' }}>
        <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${activeTab === 'overview' ? 'text-blue-600' : 'text-gray-500'}`}>
          <div className={`p-2 rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-blue-100 scale-110 shadow-sm' : ''}`}>
            <BarChartIcon size={24} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-500'}`}>
           <div className={`w-14 h-14 bg-blue-600 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-200 -mt-8 border-4 border-white transition-all ${activeTab === 'profile' ? 'scale-110' : ''}`}>
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

      {/* Mobile Sidebar/Drawer */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                {settings?.logoUrl ? (
                  <div className="w-10 h-10 overflow-hidden rounded-xl border border-blue-600 bg-blue-50/50 backdrop-blur-sm p-0.5">
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">RA</div>
                )}
                <div>
                  <h2 className="font-bold text-gray-800 text-sm">Portal Guru</h2>
                  <p className="text-[8px] text-gray-400 font-bold uppercase">RA Darusyifa</p>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 p-1 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <NavItems />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto scrolling-touch">
        {activeTab === 'overview' && (
          <div className="space-y-6 pb-24 md:pb-0 animate-in fade-in duration-500">
            {/* Mobile Header */}
            <div className="md:hidden -mx-4 -mt-12 mb-6 bg-blue-600 bg-gradient-to-br from-blue-500 to-blue-600 p-8 pt-12 rounded-b-[40px] text-white relative shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="flex justify-between items-center mb-6 relative z-10 pt-4">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-sm border border-white/30 shadow-lg active:scale-95 transition-all text-white"
                  style={{ WebkitBackdropFilter: 'blur(8px)' }}
                >
                  <Menu size={20} />
                </button>
                <div className="text-center flex-1">
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
                  className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-sm border border-white/30 shadow-lg relative active:scale-95 transition-all text-white"
                  style={{ WebkitBackdropFilter: 'blur(8px)' }}
                >
                  <Bell size={20} />
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full scale-in"></span>
                </button>
              </div>
              
              <div className="flex items-center gap-5 bg-white/10 p-6 rounded-[3rem] backdrop-blur-md border border-white/20 relative z-10 shadow-xl overflow-hidden" style={{ WebkitBackdropFilter: 'blur(12px)' }}>
                <div className="w-20 h-20 rounded-full border-4 border-white/40 overflow-hidden bg-white/95 flex items-center justify-center shadow-xl shrink-0">
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
                    <p className="text-[8px] text-blue-900 font-black uppercase tracking-wider">Teacher Portal</p>
                  </div>
                  <h2 className="text-xl font-black tracking-tight leading-tight text-white mb-1">
                    {userData?.name || 'Guru Pengajar'}
                  </h2>
                  <div className="flex flex-col mt-1">
                    <p className="text-[10px] opacity-90 font-black text-yellow-300 leading-tight uppercase tracking-tighter">
                      {userData?.role || 'Guru'}
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
                <p className="text-gray-500 text-sm font-medium mt-4">Kelola perkembangan belajar siswa secara efisien.</p>
              </div>
              <div className="flex items-center gap-4">
                 <button onClick={() => setActiveTab('announcements')} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-400 hover:text-blue-600 transition-all relative">
                    <Bell size={24} />
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                 </button>
                 <div className="bg-white p-2 pr-6 rounded-full border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                      {userData?.name?.[0] || 'G'}
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-800 leading-tight">{userData?.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Guru Pengajar</p>
                    </div>
                 </div>
              </div>
            </header>

            {/* Stats Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: 'Jumlah Siswa', value: students.length, detail: 'Aktif Tahun Ini', color: 'bg-indigo-600 bg-gradient-to-br from-purple-500 to-indigo-600', icon: Users },
                  { label: 'Laporan Belajar', value: progress.length, detail: 'Telah Dibuat', color: 'bg-teal-500 bg-gradient-to-br from-emerald-400 to-teal-500', icon: BookOpen },
                  { label: 'Hafalan Siswa', value: hafalanProgress.filter(h => h.status === 'Mumtaz (Lulus)').length, detail: 'Lulus Materi', color: 'bg-orange-500 bg-gradient-to-br from-amber-400 to-orange-500', icon: Star },
                  { label: 'Absensi Saya', value: attendance.filter(a => a.studentId === user?.uid).length, detail: 'Total Kehadiran', color: 'bg-pink-600 bg-gradient-to-br from-rose-500 to-pink-600', icon: CheckCircle }
                ].map((stat, i) => (
                  <div key={i} className={`relative overflow-hidden ${stat.color} p-5 md:p-6 rounded-[32px] text-white shadow-xl shadow-black/10 group hover:scale-[1.02] transition-all flex flex-col justify-between h-52 sm:h-48 md:h-44`}>
                  <div className="absolute -right-4 -bottom-4 opacity-30 group-hover:scale-110 transition-transform rotate-12">
                    <stat.icon size={100} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-80 mb-1">{stat.label}</p>
                    <h4 className={`font-black tracking-tighter leading-none ${String(stat.value).length > 8 ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>{stat.value}</h4>
                  </div>
                  <div className="relative z-10 inline-flex items-center self-start px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black tracking-wide uppercase" style={{ WebkitBackdropFilter: 'blur(8px)' }}>
                    {stat.detail}
                  </div>
                </div>
              ))}
            </div>

            {/* Menu Utama - Guru Pattern */}
            <div className="mt-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Menu Utama</h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-10">
                {[
                  { id: 'students', label: 'Siswa', icon: Users, color: 'bg-purple-500 bg-gradient-to-br from-purple-400 to-purple-500' },
                  { id: 'kaldik', label: 'Kaldik & Materi', icon: Calendar, color: 'bg-pink-500 bg-gradient-to-br from-pink-400 to-pink-500', action: () => window.open('https://kaldikradarusyifa.netlify.app/', '_blank') },
                  { id: 'penilaian-kelas', label: 'Nilai Masal', icon: Edit, color: 'bg-indigo-600 bg-gradient-to-br from-blue-600 to-indigo-700' },
                  { id: 'progress', label: 'Rapot', icon: BookOpen, color: 'bg-blue-500 bg-gradient-to-br from-blue-400 to-blue-500' },
                  { id: 'exams', label: 'Ujian', icon: Edit, color: 'bg-rose-500 bg-gradient-to-br from-rose-400 to-rose-500' },
                  { id: 'hafalan', label: 'Hafalan', icon: Star, color: 'bg-amber-500 bg-gradient-to-br from-amber-400 to-amber-500' },
                  { id: 'attendance', label: 'Absensi', icon: Camera, color: 'bg-emerald-500 bg-gradient-to-br from-emerald-400 to-emerald-500' },
                  { id: 'announcements', label: 'Info', icon: Megaphone, color: 'bg-blue-600 bg-gradient-to-br from-blue-500 to-blue-600' },
                  { id: 'profile', label: 'Profil', icon: User, color: 'bg-indigo-500 bg-gradient-to-br from-indigo-400 to-indigo-500' },
                ].map((item, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveTab(item.id)}
                    className="group flex flex-col items-center gap-3 transition-all"
                  >
                    <div className={`w-16 h-16 md:w-20 md:h-20 ${item.color} rounded-[28px] shadow-lg flex items-center justify-center text-white transition-all group-active:scale-95 group-hover:scale-110`}>
                      <item.icon size={28} className="md:w-10 md:h-10" />
                    </div>
                    <span className="text-[11px] md:text-sm font-black text-gray-700 tracking-tight text-center">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Middle Section: Recent Laporan & Hafalan Review */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
               <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-xl font-black text-gray-800">Laporan Terakhir</h3>
                     <button onClick={() => setActiveTab('progress')} className="text-blue-600 font-bold text-xs uppercase tracking-widest hover:underline">Semua</button>
                  </div>
                  <div className="space-y-4">
                     {progress.slice(0, 4).map((p) => {
                        const s = students.find(st => st.id === p.studentId);
                        return (
                          <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl border border-gray-100">
                             <div className="min-w-0">
                                <p className="font-bold text-gray-800 truncate">{s?.name || 'Siswa'}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter truncate">{p.title}</p>
                             </div>
                             <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${p.status === 'Lulus' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {p.status || 'Aktif'}
                             </div>
                          </div>
                        );
                     })}
                     {progress.length === 0 && <p className="text-center py-6 text-gray-400 italic text-sm">Belum ada laporan belajar.</p>}
                  </div>
               </div>

               <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-xl font-black text-gray-800">Antrian Hafalan</h3>
                     <button onClick={() => setActiveTab('hafalan')} className="text-blue-600 font-bold text-xs uppercase tracking-widest hover:underline">Review</button>
                  </div>
                  <div className="space-y-4">
                     {hafalanProgress.filter(h => h.isReadyForTest).slice(0, 4).map((h) => {
                        const s = students.find(st => st.id === h.studentId);
                        const mat = hafalanMaterials.find(m => m.id === h.materialId);
                        return (
                          <div key={h.id} className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-3xl border border-blue-100">
                             <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                                <Star size={20} fill="currentColor" />
                             </div>
                             <div className="min-w-0 flex-1">
                                <p className="font-bold text-gray-800 truncate">{s?.name || 'Siswa'}</p>
                                <p className="text-[10px] text-blue-600 font-black uppercase tracking-tighter truncate">{mat?.judul || 'Materi'}</p>
                             </div>
                             <button onClick={() => { setEvaluateHafalan(h); setShowHafalanModal(true); }} className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-100">
                                <CheckCircle size={18} />
                             </button>
                          </div>
                        );
                     })}
                     {hafalanProgress.filter(h => h.isReadyForTest).length === 0 && <p className="text-center py-6 text-gray-400 italic text-sm">Tidak ada antrian setoran.</p>}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="card-3d overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-bold text-gray-800">Daftar Siswa</h3>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <input 
                  type="text" 
                  placeholder="Cari Nama Siswa..." 
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="w-full sm:w-auto p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-600"
                />
                <select 
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                  className="w-full sm:w-auto p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-600"
                >
                  <option value="">Semua Kelas</option>
                  {schoolClasses.map((c: any) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Nama</th>
                    <th className="px-6 py-4">Kelas</th>
                    <th className="px-6 py-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.filter(s => {
                    const matchName = filterName ? (s.name || '').toLowerCase().includes(filterName.toLowerCase()) : true;
                    const matchKelas = filterKelas ? (s.kelas || '').toLowerCase() === filterKelas.toLowerCase() : true;
                    return matchName && matchKelas;
                  }).map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">{s.name}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{s.kelas || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => {
                              setSelectedStudentForRapot(s);
                              setPrintRapotPeriod('PTS Ganjil');
                              setShowPrintRapotModal(true);
                            }}
                            className="bg-gray-800 text-white hover:bg-gray-900 font-bold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                          >
                            <Printer size={12} /> Cetak Rapot
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View Daftar Siswa */}
            <div className="md:hidden divide-y divide-gray-100">
               {students.filter(s => {
                  const matchName = filterName ? (s.name || '').toLowerCase().includes(filterName.toLowerCase()) : true;
                  const matchKelas = filterKelas ? (s.kelas || '').toLowerCase() === filterKelas.toLowerCase() : true;
                  return matchName && matchKelas;
                }).map((s) => (
                 <div key={s.id} className="p-4 bg-white flex flex-col gap-3 border-t border-gray-50">
                    <div>
                      <p className="font-bold text-gray-800">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </div>
                    <div className="flex gap-2 isolate">
                      <button 
                        onClick={() => {
                          setSelectedStudentForRapot(s);
                          setPrintRapotPeriod('PTS Ganjil');
                          setShowPrintRapotModal(true);
                        }}
                        className="flex-1 bg-gray-800 text-white hover:bg-gray-900 font-bold text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        <Printer size={12} /> Cetak
                      </button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

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
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700"
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
                  className="w-full py-4 bg-gray-800 text-white rounded-2xl font-bold hover:bg-gray-900 transition-colors shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
                >
                  <Printer size={18} /> Cetak Dokumen
                </button>
              </div>
            </div>
          </div>
        )}

        {showPrintRapotHafalanModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative">
              <button 
                onClick={() => {
                  setShowPrintRapotHafalanModal(false);
                  setSelectedStudentForRapot(null);
                }} 
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
              >
                <X />
              </button>
              <h3 className="text-xl font-black text-gray-800 mb-2">Cetak Rapot Hafalan</h3>
              <p className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-widest">{selectedStudentForRapot?.name}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pilih Semester</label>
                  <select 
                    value={printRapotHafalanSemester} 
                    onChange={(e) => setPrintRapotHafalanSemester(e.target.value)} 
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700"
                  >
                    <option value="Semua">Cetak Semua Semester</option>
                    <option value="PTS Ganjil">PTS Ganjil</option>
                    <option value="PAS Ganjil">PAS Ganjil</option>
                    <option value="PTS Genap">PTS Genap</option>
                    <option value="PAS Genap">PAS Genap</option>
                  </select>
                </div>
                <button 
                  onClick={() => {
                    handleExecutePrintRapotHafalanConfirm();
                    setShowPrintRapotHafalanModal(false);
                  }}
                  className="w-full py-4 bg-gray-800 text-white rounded-2xl font-bold hover:bg-gray-900 transition-colors shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
                >
                  <Printer size={18} /> Cetak Dokumen
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kaldik' && (
          <div className="space-y-6 pb-24 md:pb-0 animate-in fade-in duration-500">
            <div className="card-3d p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">Kaldik & Materi Belajar</h3>
                <p className="text-sm text-gray-400 mt-1 font-medium">Kalender Pendidikan dari Admin dan kumpulan materi pembelajaran Anda.</p>
              </div>
              <button 
                onClick={() => setShowMaterialModal(true)}
                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all text-sm shadow-md shadow-blue-200"
              >
                <Plus size={18} /> Tambah Materi
              </button>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Kalender Pendidikan */}
              <div>
                <h4 className="font-black text-gray-800 text-lg mb-4 flex items-center gap-2"><Calendar className="text-pink-500" /> Agenda Kaldik</h4>
                <div className="bg-white/50 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-xl p-4">
                  <KaldikCalendar events={kaldikData} isAdmin={false} />
                </div>
              </div>

              {/* Materi */}
              <div>
                <h4 className="font-black text-gray-800 text-lg mb-4 flex items-center gap-2"><BookOpen className="text-blue-500" /> Materi Pembelajaran Saya</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {materialsData.filter(m => m.teacherId === user.uid).map(mat => (
                    <div key={mat.id} className="card-3d p-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BookOpen size={48} className="text-blue-500" />
                      </div>
                      <div className="relative z-10">
                        <h5 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2">{mat.name}</h5>
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{mat.topic || 'Umum'}</p>
                        
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => { setEditingMaterialId(mat.id); setNewMaterial(mat); setShowMaterialModal(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all flex-1 flex justify-center items-center">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDeleteMaterial(mat.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all flex-1 flex justify-center items-center">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {materialsData.filter(m => m.teacherId === user.uid).length === 0 && (
                    <div className="col-span-1 sm:col-span-2 text-center p-8 bg-white border border-dashed border-gray-200 rounded-[2rem]">
                      <BookOpen className="mx-auto text-gray-300 mb-2" size={32} />
                      <p className="text-xs text-gray-400 font-medium">Belum ada materi yang Anda tambahkan.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hafalan' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
            <div className="flex gap-2 mb-6">
              <button 
                onClick={() => setHafalanSubTab('eval')}
                className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${hafalanSubTab === 'eval' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                Evaluasi Setoran
              </button>
              <button 
                onClick={() => setHafalanSubTab('modul')}
                className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${hafalanSubTab === 'modul' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                Kelola Modul
              </button>
              <button 
                onClick={() => setHafalanSubTab('all')}
                className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${hafalanSubTab === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                Semua Setoran
              </button>
            </div>

            {hafalanSubTab === 'eval' ? (
              <>
                <div className="card-3d p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight mb-2">Evaluasi Hafalan</h3>
                    <p className="text-sm text-gray-400 font-medium">Nilai hafalan surat, hadist, dan doa siswa.</p>
                  </div>
                </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select value={filterKelasHafalan} onChange={e => setFilterKelasHafalan(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-600 appearance-none">
                  <option value="">Semua Kelas</option>
                  <option value="Utsman">Utsman</option>
                  <option value="Umar Bin Khattab">Umar</option>
                </select>
                <select value={filterHafalanStatus} onChange={e => setFilterHafalanStatus(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-600 appearance-none">
                  <option value="Semua">Semua Status</option>
                  <option value="Menunggu Evaluasi">Ada Setoran (Menunggu Evaluasi)</option>
                  <option value="Sudah Dinilai">Sudah Dinilai (Selesai/Lulus)</option>
                  <option value="Sedang Menghafal">Belum Ada Setoran / Sedang Menghafal</option>
                </select>
                <select value={filterHafalanCategory} onChange={e => setFilterHafalanCategory(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-600 appearance-none">
                  <option value="Semua Kategori">Semua Kategori</option>
                  <option value="Surat Pendek">Surat Pendek</option>
                  <option value="Hadist">Hadist</option>
                  <option value="Doa Sehari-hari">Doa Sehari-hari</option>
                  <option value="Bacaan Sholat">Bacaan Sholat</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {students.filter(s => {
                if (!filterKelasHafalan) return true;
                const uK = (s.kelas || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const fK = filterKelasHafalan.toLowerCase().replace(/[^a-z0-9]/g, '');
                return uK.includes(fK) || fK.includes(uK);
              }).filter(student => {
                const sp = hafalanProgress.filter(p => p.studentId === student.id);
                
                if (filterHafalanStatus === 'Menunggu Evaluasi') {
                  return sp.some(p => p.isReadyForTest && p.status !== 'Mumtaz (Lulus)');
                }
                if (filterHafalanStatus === 'Sudah Dinilai') {
                  return sp.some(p => p.status === 'Mumtaz (Lulus)');
                }
                if (filterHafalanStatus === 'Sedang Menghafal') {
                  // True if they have no progress at all OR their progress doesn't include evaluated/pending ones
                  if (sp.length === 0) return true;
                  const hasDoneOrPending = sp.some(p => p.status === 'Mumtaz (Lulus)' || p.isReadyForTest);
                  return !hasDoneOrPending;
                }
                
                return true;
              }).map(student => {
                const studentProgress = hafalanProgress.filter(p => p.studentId === student.id);
                // Filter waiting for evaluation (isReadyForTest === true) - applied with category filter
                const pendingTestsFiltered = studentProgress.filter(p => p.isReadyForTest && p.status !== 'Mumtaz (Lulus)').filter(p => {
                    if (filterHafalanCategory === 'Semua Kategori') return true;
                    const m = hafalanMaterials.find(mat => mat.id === p.materialId);
                    return m?.kategori === filterHafalanCategory;
                });
                // The rest - applied with category filter
                const othersFiltered = studentProgress.filter(p => !p.isReadyForTest && p.status !== 'Mumtaz (Lulus)').filter(p => {
                    if (filterHafalanCategory === 'Semua Kategori') return true;
                    const m = hafalanMaterials.find(mat => mat.id === p.materialId);
                    return m?.kategori === filterHafalanCategory;
                });
                
                const evaluatedFiltered = studentProgress.filter(p => p.status === 'Mumtaz (Lulus)').filter(p => {
                    if (filterHafalanCategory === 'Semua Kategori') return true;
                    const m = hafalanMaterials.find(mat => mat.id === p.materialId);
                    return m?.kategori === filterHafalanCategory;
                });
                
                // Hide student card if no items left after filtering categories and they have no pending test
                 if (filterHafalanCategory !== 'Semua Kategori' && pendingTestsFiltered.length === 0 && othersFiltered.length === 0 && evaluatedFiltered.length === 0) return null;

                return (
                <div key={student.id} className="card-3d p-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        {student.photoURL ? (
                          <img src={student.photoURL} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <User size={24} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{student.name}</h4>
                        <p className="text-xs text-gray-500">{student.kelas || 'Belum ada kelas'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => promptPrintRapotHafalan(student)}
                      className="text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 p-2 rounded-xl transition-colors"
                      title="Cetak Rapot Hafalan"
                    >
                      <Printer size={18} />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {pendingTestsFiltered.length > 0 && <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Permintaan Setoran</p>}
                    {pendingTestsFiltered.map(p => {
                      const mat = hafalanMaterials.find(m => m.id === p.materialId);
                      return (
                        <div key={p.id} className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex justify-between items-center group relative">
                        <div>
                          <p className="text-sm font-bold text-gray-800">{mat?.judul || 'Materi tidak ditemukan'}</p>
                          <div className="flex items-center gap-2">
                             <p className="text-xs text-yellow-600 font-medium">Menunggu Evaluasi</p>
                             {p.submissionMethod && (
                               <span className="text-[10px] bg-yellow-200/50 text-yellow-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{p.submissionMethod}</span>
                             )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={async () => {
                              if (confirm('Yakin ingin menghapus setoran siswa ini? Status akan kembali menjadi Belum Mulai / Sedang Menghafal sesuai log terakhir atau dihapus.')) {
                                try {
                                  await deleteDoc(doc(db, 'hafalan_progress', p.id));
                                  alert('Berhasil dihapus!');
                                } catch (error) {
                                  handleFirestoreError(error, OperationType.DELETE, `hafalan_progress/${p.id}`);
                                }
                              }
                            }}
                            className="bg-red-50 text-red-500 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-1"
                          >
                            <Trash2 size={16} /> Hapus
                          </button>
                          <button 
                            onClick={() => {
                              setEvaluateHafalan(p);
                              setHafalanEvalStars(p.stars || 0);
                              setHafalanEvalNotes(p.catatanGuru || '');
                              setHafalanEvalStatus(p.status || 'Sedang Menghafal');
                              setHafalanEvalSemester(p.evaluationSemester || 'PTS Ganjil');
                              setShowHafalanModal(true);
                            }} 
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                          >
                            Beri Nilai
                          </button>
                        </div>
                      </div>
                    )})}
                    {othersFiltered.length > 0 && <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 mt-4">Sedang Dipelajari</p>}
                    {othersFiltered.map(p => {
                      const mat = hafalanMaterials.find(m => m.id === p.materialId);
                      return (
                      <div key={p.id} className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center mt-2 group relative">
                        <div>
                          <p className="text-sm font-bold text-gray-500">{mat?.judul || 'Materi tidak ditemukan'}</p>
                          <p className="text-xs text-gray-400 font-medium">{p.status}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={async () => {
                              if (confirm('Yakin ingin menghapus riwayat hafalan anak ini pada materi ini?')) {
                                try {
                                  await deleteDoc(doc(db, 'hafalan_progress', p.id));
                                  alert('Berhasil dihapus!');
                                } catch (error) {
                                  handleFirestoreError(error, OperationType.DELETE, `hafalan_progress/${p.id}`);
                                }
                              }
                            }}
                            className="bg-red-50 text-red-500 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-1"
                          >
                            <Trash2 size={16} /> Hapus
                          </button>
                          <button 
                            onClick={() => {
                              setEvaluateHafalan(p);
                              setHafalanEvalStars(p.stars || 0);
                              setHafalanEvalNotes(p.catatanGuru || '');
                              setHafalanEvalStatus(p.status || 'Sedang Menghafal');
                              setHafalanEvalSemester(p.evaluationSemester || 'PTS Ganjil');
                              setShowHafalanModal(true);
                            }} 
                            className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50"
                          >
                            Ubah
                          </button>
                        </div>
                      </div>
                    )})}
                    {evaluatedFiltered.length > 0 && <p className="text-xs font-bold text-green-500 uppercase tracking-widest mb-2 mt-4">Sudah Lulus</p>}
                    {evaluatedFiltered.map(p => {
                      const mat = hafalanMaterials.find(m => m.id === p.materialId);
                      return (
                      <div key={p.id} className="bg-green-50/50 p-4 rounded-2xl flex justify-between items-center mt-2 group relative border border-green-100">
                        <div>
                          <p className="text-sm font-bold text-green-800">{mat?.judul || 'Materi tidak ditemukan'}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{p.status}</span>
                            <span className="text-[10px] font-bold text-yellow-500">★ {p.stars}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={async () => {
                              if (confirm('Yakin ingin menghapus riwayat hafalan anak ini pada materi ini?')) {
                                try {
                                  await deleteDoc(doc(db, 'hafalan_progress', p.id));
                                  alert('Berhasil dihapus!');
                                } catch (error) {
                                  handleFirestoreError(error, OperationType.DELETE, `hafalan_progress/${p.id}`);
                                }
                              }
                            }}
                            className="bg-red-50 text-red-500 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-1"
                          >
                            <Trash2 size={16} /> Hapus
                          </button>
                          <button 
                            onClick={() => {
                              setEvaluateHafalan(p);
                              setHafalanEvalStars(p.stars || 0);
                              setHafalanEvalNotes(p.catatanGuru || '');
                              setHafalanEvalStatus(p.status || 'Sedang Menghafal');
                              setHafalanEvalSemester(p.evaluationSemester || 'PTS Ganjil');
                              setShowHafalanModal(true);
                            }} 
                            className="bg-white border border-green-200 text-green-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-50"
                          >
                            Revisi
                          </button>
                        </div>
                      </div>
                    )})}
                    {pendingTestsFiltered.length === 0 && othersFiltered.length === 0 && evaluatedFiltered.length === 0 && (
                      <div className="text-center p-4 bg-gray-50 rounded-2xl text-xs text-gray-400 border border-dashed border-gray-200">Tidak ada data untuk filter ini.</div>
                    )}
                  </div>
                </div>
              )})}
              {students.length === 0 && (
                <div className="lg:col-span-2 text-center p-8 bg-white rounded-3xl text-gray-400 border border-dashed border-gray-200">
                  Belum ada data siswa.
                </div>
              )}
            </div>
          </>
        ) : hafalanSubTab === 'modul' ? (
          <HafalanTab />
        ) : (
          <HafalanProgressTab />
        )}
      </div>
    )}

        {activeTab === 'penilaian-kelas' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Penilaian Siswa</h3>
            <p className="text-gray-500 mb-6">Penilaian masal untuk seluruh siswa dalam satu kelas.</p>

            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Jenis Penilaian</label>
                  <select value={pkType} onChange={e => {
                    setPkType(e.target.value as 'Hafalan'|'Rapot');
                    setPkCategory('');
                  }} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 text-gray-700 font-bold transition-all">
                    <option value="Hafalan">Penilaian Hafalan (Modul)</option>
                    <option value="Rapot">Penilaian Rapot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Pilih Kelas</label>
                  <select value={pkClass} onChange={e => {
                    setPkClass(e.target.value);
                    if (pkType === 'Rapot') setPkCategory('');
                  }} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 text-gray-700 font-bold transition-all">
                    <option value="">-- Pilih Kelas --</option>
                    <option value="Semua">Semua Kelas</option>
                    {schoolClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    {schoolClasses.length === 0 && (userData?.assignedClass || userData?.kelas) && <option value={userData?.assignedClass || userData?.kelas}>{userData?.assignedClass || userData?.kelas}</option>}
                  </select>
                </div>
                <div>
                  {pkType === 'Rapot' ? (
                    <>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Periode Ujian</label>
                      <select value={pkRapotPeriod} onChange={e => {
                        setPkRapotPeriod(e.target.value);
                        setPkCategory('');
                      }} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 text-gray-700 font-bold transition-all">
                        <option value="PTS Ganjil">PTS Ganjil</option>
                        <option value="PAS Ganjil">PAS Ganjil</option>
                        <option value="PTS Genap">PTS Genap</option>
                        <option value="PAS Genap">PAS Genap</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Tanggal Penilaian</label>
                      <input type="date" value={pkDate} onChange={e => setPkDate(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 text-gray-700 font-bold transition-all" />
                    </>
                  )}
                </div>
              </div>

              {pkType === 'Hafalan' && (
                <div className="animate-in slide-in-from-top duration-300">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Mata Pelajaran / Topik Hafalan</label>
                  <select value={pkMaterialId} onChange={e => setPkMaterialId(e.target.value)} className="w-full p-4 bg-blue-50/30 border border-blue-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-blue-900 font-black transition-all">
                    <option value="">-- Pilih Modul / Surat --</option>
                    {hafalanMaterials
                      .filter(m => {
                        if (!pkClass || pkClass === 'Semua') return true;
                        const k1 = m.kelas.toLowerCase().trim();
                        const k2 = pkClass.toLowerCase().trim();
                        return k1.includes(k2) || k2.includes(k1);
                      })
                      .map(m => (
                        <option key={m.id} value={m.id}>{m.judul} ({m.kategori})</option>
                      ))
                    }
                  </select>
                </div>
              )}

              {pkType === 'Rapot' && (
                <div className="animate-in slide-in-from-top duration-300">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Mata Pelajaran</label>
                  <select value={pkCategory} onChange={e => setPkCategory(e.target.value)} className="w-full p-4 bg-blue-50/30 border border-blue-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-blue-900 font-black transition-all">
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {(() => {
                      if (pkType === 'Rapot') {
                        const matchingExams = exams.filter(ex => ex.type === pkRapotPeriod);
                        const schedules = matchingExams.flatMap(ex => ex.schedules || []);
                        const classSpecificSchedules = schedules.filter((s: any) => 
                          !s.kelas || s.kelas.toLowerCase() === "semua kelas" ||
                          !pkClass || pkClass === "Semua" || 
                          (s.kelas && pkClass && s.kelas.trim().toLowerCase() === pkClass.trim().toLowerCase())
                        );
                        const uniqueSubjects = Array.from(new Set(classSpecificSchedules.map((s: any) => s.subject))).filter(Boolean);
                        if (uniqueSubjects.length > 0) {
                          return uniqueSubjects.map((sub: any, idx: number) => <option key={idx} value={sub}>{sub}</option>);
                        } else {
                          return <option value="" disabled>Belum ada jadwal mapel untuk Kelas ini di {pkRapotPeriod}</option>;
                        }
                      }
                      return subjects.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ));
                    })()}
                  </select>
                </div>
              )}
            </div>

            {((pkType === 'Hafalan' && pkMaterialId && pkClass) || (pkType === 'Rapot' && pkCategory && pkClass)) ? (() => {
              const filteredPkStudents = students.filter(s => {
                // Class filter
                if (pkClass !== 'Semua' && s.kelas !== pkClass) return false;
                
                // Search filter
                if (pkSearch && !s.name.toLowerCase().includes(pkSearch.toLowerCase())) return false;
                
                // Unfinished filter (Hafalan only)
                if (pkType === 'Hafalan' && pkFilterUnfinished && pkMaterialId) {
                  const prog = hafalanProgress.find(p => p.studentId === s.id && p.materialId === pkMaterialId);
                  if (prog?.status === 'Mumtaz (Lulus)') return false;
                }
                
                return true;
              });

              return (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 animate-in fade-in duration-500">
                    <div className="flex-1 relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <Search size={20} />
                      </span>
                      <input 
                        type="text" 
                        placeholder="Cari nama siswa..." 
                        value={pkSearch}
                        onChange={e => setPkSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 text-sm font-bold shadow-sm transition-all"
                      />
                    </div>
                    {pkType === 'Hafalan' && (
                      <button 
                        onClick={() => setPkFilterUnfinished(!pkFilterUnfinished)}
                        className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-2 ${pkFilterUnfinished ? 'bg-amber-500 border-amber-500 text-white shadow-xl shadow-amber-100 scale-105' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}
                      >
                        <Filter size={18} /> {pkFilterUnfinished ? 'Hanya Belum Lulus' : 'Tampilkan Semua'}
                      </button>
                    )}
                  </div>

                  {/* Responsive List / Table */}
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="p-4 text-sm font-bold text-gray-600">Nama Siswa</th>
                            <th className="p-4 text-sm font-bold text-gray-600 w-48">{pkType === 'Hafalan' ? 'Status' : 'Predikat'}</th>
                            <th className="p-4 text-sm font-bold text-gray-600 w-32">{pkType === 'Hafalan' ? 'Bintang' : 'Nilai'}</th>
                            <th className="p-4 text-sm font-bold text-gray-600">Catatan Guru</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPkStudents.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-12 text-center text-gray-400 font-medium">Data siswa tidak ditemukan dengan filter ini.</td>
                            </tr>
                          ) : (
                            filteredPkStudents.map(s => (
                              <tr key={s.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                                <td className="p-4">
                                  <div className="font-bold text-gray-800">{s.name}</div>
                                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{s.email?.split('@')[0]}</div>
                                </td>
                              <td className="p-4">
                                <select 
                                  value={pkStudentData[s.id]?.status || ''} 
                                  onChange={e => setPkStudentData(prev => ({...prev, [s.id]: {...prev[s.id], status: e.target.value}}))}
                                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 font-medium"
                                >
                                  {pkType === 'Hafalan' ? (
                                    <>
                                      <option value="Belum Mulai">-- Lewati --</option>
                                      <option value="Sedang Menghafal">Sedang Menghafal</option>
                                      <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                                      <option value="Mumtaz (Lulus)">Mumtaz (Lulus)</option>
                                    </>
                                  ) : (
                                    <>
                                      <option value="Lulus">Lulus / Selesai</option>
                                      <option value="Mengulang">Mengulang / Remedial</option>
                                      <option value="Lanjut Perkembangan Lain">Lanjut Perkemb. Lain</option>
                                    </>
                                  )}
                                </select>
                              </td>
                              <td className="p-4">
                                {pkType === 'Hafalan' ? (
                                  <div className="flex items-center justify-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        onClick={() => setPkStudentData(prev => ({...prev, [s.id]: {...prev[s.id], stars: star}}))}
                                        className="transition-transform active:scale-95 group cursor-pointer"
                                      >
                                        <Star 
                                          size={20} 
                                          className={`${(pkStudentData[s.id]?.stars || 0) >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} group-hover:scale-110 transition-all`} 
                                        />
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <input 
                                    type="number"
                                    min={0} 
                                    max={100}
                                    value={pkStudentData[s.id]?.score ?? ''}
                                    onChange={e => setPkStudentData(prev => ({...prev, [s.id]: {...prev[s.id], score: e.target.value}}))}
                                    placeholder="0-100"
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 font-bold text-center"
                                  />
                                )}
                              </td>
                              <td className="p-4">
                                <input 
                                  type="text"
                                  value={pkStudentData[s.id]?.notes || ''}
                                  onChange={e => setPkStudentData(prev => ({...prev, [s.id]: {...prev[s.id], notes: e.target.value}}))}
                                  placeholder="Catatan..."
                                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700"
                                />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View - Cards Layout */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {filteredPkStudents.length === 0 ? (
                      <div className="p-12 text-center text-gray-400 font-medium">Data siswa tidak ditemukan dengan filter ini.</div>
                    ) : (
                      filteredPkStudents.map(s => (
                        <div key={s.id} className="p-5 space-y-4">
                          <div className="flex justify-between items-center bg-blue-50 -mx-5 -mt-5 p-4 mb-4">
                            <div className="font-black text-blue-900 tracking-tight">{s.name}</div>
                            <div className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-md font-bold">{s.kelas}</div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{pkType === 'Hafalan' ? 'Status Hafalan' : 'Predikat Lulus'}</label>
                                <select 
                                  value={pkStudentData[s.id]?.status || ''} 
                                  onChange={e => setPkStudentData(prev => ({...prev, [s.id]: {...prev[s.id], status: e.target.value}}))}
                                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 font-bold"
                                >
                                  {pkType === 'Hafalan' ? (
                                    <>
                                      <option value="Belum Mulai">-- Lewati --</option>
                                      <option value="Sedang Menghafal">Sedang Menghafal</option>
                                      <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                                      <option value="Mumtaz (Lulus)">Mumtaz (Lulus)</option>
                                    </>
                                  ) : (
                                    <>
                                      <option value="Lulus">Lulus / Selesai</option>
                                      <option value="Mengulang">Mengulang / Remedial</option>
                                      <option value="Lanjut Perkembangan Lain">Lanjut Perkemb. Lain</option>
                                    </>
                                  )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{pkType === 'Hafalan' ? 'Bintang Pencapaian' : 'Nilai (0-100)'}</label>
                                {pkType === 'Hafalan' ? (
                                  <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        onClick={() => setPkStudentData(prev => ({...prev, [s.id]: {...prev[s.id], stars: star}}))}
                                        className="transition-all active:scale-90"
                                      >
                                        <Star 
                                          size={28} 
                                          className={`${(pkStudentData[s.id]?.stars || 0) >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} transition-all`} 
                                        />
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <input 
                                    type="number"
                                    min={0} 
                                    max={100}
                                    value={pkStudentData[s.id]?.score ?? ''}
                                    onChange={e => setPkStudentData(prev => ({...prev, [s.id]: {...prev[s.id], score: e.target.value}}))}
                                    placeholder="0-100"
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 font-black text-center"
                                  />
                                )}
                            </div>
                            <div className="flex items-end">
                                <p className="text-[9px] text-gray-400 italic leading-tight">Gunakan angka bulat untuk memudahkan sistem rapot.</p>
                            </div>
                          </div>
                          
                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Catatan Khusus Guru</label>
                              <input 
                                type="text"
                                value={pkStudentData[s.id]?.notes || ''}
                                onChange={e => setPkStudentData(prev => ({...prev, [s.id]: {...prev[s.id], notes: e.target.value}}))}
                                placeholder="Catatan perkembangan..."
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 font-medium"
                              />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="p-6 bg-white rounded-3xl border border-gray-100 flex justify-end">
                  <button 
                    onClick={handleSavePk}
                    disabled={pkIsSaving}
                    className="w-full md:w-auto bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-70 disabled:hover:scale-100 uppercase tracking-widest text-sm"
                  >
                    <Save size={20} /> {pkIsSaving ? 'Sedang Memproses...' : 'Simpan Semua Nilai'}
                  </button>
                </div>
              </div>
              );
            })() : (
               <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
                  Pilih Kelas dan Materi/Mapel terlebih dahulu untuk mulai menilai secara masal.
               </div>
            )}
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-2xl font-black text-gray-800">Laporan Hasil Belajar (Rapot)</h3>
                <p className="text-sm text-gray-500">Kelola rapot perkembangan belajar harian, mingguan, PTS, dan PAS siswa.</p>
              </div>
              <button 
                onClick={() => { resetForm(); setShowProgressModal(true); }}
                className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-100"
              >
                <Plus size={20} /> Input Laporan Baru
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
              <div className="flex-grow relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={18} />
                </span>
                <input 
                  type="text" 
                  placeholder="Cari Nama Siswa..." 
                  value={rapotSearch}
                  onChange={(e) => setRapotSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-750 text-sm"
                />
              </div>
              <div className="w-full md:w-64">
                <select 
                  value={rapotPeriod} 
                  onChange={(e) => setRapotPeriod(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700 text-sm"
                >
                  <option value="Semua">Semua Periode</option>
                  <option value="Harian">Laporan Harian / Mingguan</option>
                  <option value="PTS Ganjil">PTS Ganjil</option>
                  <option value="PAS Ganjil">PAS Ganjil</option>
                  <option value="PTS Genap">PTS Genap</option>
                  <option value="PAS Genap">PAS Genap</option>
                </select>
              </div>
            </div>

            {/* Progress List */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="hidden md:block">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">Siswa</th>
                      <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">Periode / Mapel</th>
                      <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">Detail & Keterangan</th>
                      <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest w-36 text-center">Nilai</th>
                      <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center w-40">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {progress.filter(p => {
                      const s = students.find(st => st.id === p.studentId);
                      const matchName = !rapotSearch || (s?.name || '').toLowerCase().includes(rapotSearch.toLowerCase());
                      const matchPeriod = rapotPeriod === 'Semua' || p.evaluationPeriod === rapotPeriod;
                      return matchName && matchPeriod;
                    }).map((p) => {
                      const s = students.find(st => st.id === p.studentId);
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-5">
                            <div className="font-bold text-gray-800">{s?.name || 'Siswa'}</div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-tight">{s?.kelas || 'Tanpa Kelas'}</div>
                          </td>
                          <td className="p-5">
                            <span className="text-xs font-black px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full inline-block mb-1">{p.evaluationPeriod || 'Harian'}</span>
                            <div className="font-medium text-sm text-gray-700">{p.title || p.category}</div>
                          </td>
                          <td className="p-5 max-w-xs">
                            {p.target && (
                              <p className="text-xs text-gray-500 font-bold mb-1">Target: {p.target}</p>
                            )}
                            <p className="text-xs text-gray-600 line-clamp-3">{p.description}</p>
                            <span className="text-[10px] text-gray-400 font-bold block mt-1">Tanggal: {p.date}</span>
                          </td>
                          <td className="p-5 text-center">
                            <div className="text-lg font-black text-blue-600">{p.score || 0}</div>
                            <span className={`inline-block text-[10px] font-black uppercase tracking-tight px-2 py-0.5 rounded ${p.status === 'Lulus' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {p.status || 'Status'}
                            </span>
                          </td>
                          <td className="p-5">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => handleEdit(p)}
                                className="p-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                                title="Edit Laporan"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteProgress(p.id)}
                                className="p-2 border border-red-100 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="Hapus Laporan"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {progress.filter(p => {
                      const s = students.find(st => st.id === p.studentId);
                      const matchName = !rapotSearch || (s?.name || '').toLowerCase().includes(rapotSearch.toLowerCase());
                      const matchPeriod = rapotPeriod === 'Semua' || p.evaluationPeriod === rapotPeriod;
                      return matchName && matchPeriod;
                    }).length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-gray-400 font-medium">Laporan tidak ditemukan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card-Based View */}
              <div className="md:hidden divide-y divide-gray-100">
                {progress.filter(p => {
                  const s = students.find(st => st.id === p.studentId);
                  const matchName = !rapotSearch || (s?.name || '').toLowerCase().includes(rapotSearch.toLowerCase());
                  const matchPeriod = rapotPeriod === 'Semua' || p.evaluationPeriod === rapotPeriod;
                  return matchName && matchPeriod;
                }).map((p) => {
                  const s = students.find(st => st.id === p.studentId);
                  return (
                    <div key={p.id} className="p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-800">{s?.name || 'Siswa'}</h4>
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{s?.kelas || 'Tanpa Kelas'}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-blue-600">{p.score || 0}</div>
                          <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded ${p.status === 'Lulus' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {p.status || 'Status'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-xs text-gray-700 space-y-1">
                        <div><strong className="text-[10px] text-gray-400 uppercase tracking-wider">Topik/Mapel:</strong> {p.title || p.category}</div>
                        <div><strong className="text-[10px] text-gray-450 uppercase tracking-wider">Periode:</strong> {p.evaluationPeriod || 'Harian'}</div>
                        {p.target && <div><strong className="text-[10px] text-gray-400 uppercase tracking-wider">Target:</strong> {p.target}</div>}
                        <div className="pt-2 border-t border-gray-200/50 text-gray-600 font-medium">{p.description}</div>
                        <p className="text-[9px] text-gray-400 pt-1 font-bold">Tanggal: {p.date}</p>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(p)}
                          className="flex-1 max-w-[120px] py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Edit size={14} /> Ubah
                        </button>
                        <button 
                          onClick={() => handleDeleteProgress(p.id)}
                          className="flex-1 max-w-[120px] py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Trash2 size={14} /> Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
                {progress.filter(p => {
                  const s = students.find(st => st.id === p.studentId);
                  const matchName = !rapotSearch || (s?.name || '').toLowerCase().includes(rapotSearch.toLowerCase());
                  const matchPeriod = rapotPeriod === 'Semua' || p.evaluationPeriod === rapotPeriod;
                  return matchName && matchPeriod;
                }).length === 0 && (
                  <div className="p-12 text-center text-gray-400 font-medium">Laporan tidak ditemukan.</div>
                )}
              </div>
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
                    disabled={hasCheckedInToday}
                    onClick={() => setAttendanceStatus(status)}
                    className={`py-3 rounded-2xl font-bold transition-all ${attendanceStatus === status ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'} ${hasCheckedInToday ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {hasCheckedInToday ? (
               <div className="flex flex-col items-center gap-4 mb-12 animate-in fade-in zoom-in duration-300">
                  <div className="w-24 h-24 bg-green-50 rounded-[32px] flex items-center justify-center text-green-600 shadow-xl shadow-green-100">
                     <CheckCircle size={40} />
                  </div>
                  <div className="text-center">
                     <p className="text-sm font-black uppercase tracking-widest text-green-700">Sudah Terabsen</p>
                     <p className="text-xs text-gray-400 font-bold">Terima kasih, data Anda sudah kami terima hari ini.</p>
                  </div>
               </div>
            ) : (
              <button 
                onClick={startCamera}
                className="w-24 h-24 bg-blue-600 text-white rounded-[32px] flex items-center justify-center shadow-2xl shadow-blue-200 hover:scale-110 transition-transform active:scale-95 group mb-12"
              >
                <Camera size={40} className="group-hover:rotate-12 transition-transform" />
              </button>
            )}
            
            <div className="w-full text-left">
              <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Clock size={20} className="text-blue-600" /> Riwayat Absensi Terkini
              </h4>
              <div className="card-3d overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100/50 text-gray-600 text-xs font-bold uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4 text-gray-600">Hari/Tanggal</th>
                        <th className="px-6 py-4 text-gray-600">Waktu</th>
                        <th className="px-6 py-4 text-gray-600">Status</th>
                        <th className="px-6 py-4 text-right text-gray-600">Aksi</th>
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
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${ (a.status || '').toLowerCase() === 'hadir' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
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

                {/* Mobile View Riwayat Absensi Terkini */}
                <div className="md:hidden divide-y divide-gray-100">
                  {attendance.filter(a => a.studentId === user.uid).map(a => (
                    <div key={a.id} className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start border-b border-gray-50 pb-2">
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{a.date}</p>
                          <p className="text-xs text-gray-500">{a.timestamp ? new Date(a.timestamp.seconds * 1000).toLocaleTimeString() : '-'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${ (a.status || '').toLowerCase() === 'hadir' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                          {a.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                           {a.photo && <button onClick={() => setSelectedPhoto(a.photo)} className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors hover:bg-blue-100">Lihat Foto</button>}
                        </div>
                        <button onClick={async () => {
                           if(window.confirm('Hapus data absensi ini?')) {
                             try {
                               await deleteDoc(doc(db, 'attendance', a.id));
                               alert('Absensi berhasil dihapus!');
                             } catch (error) {
                               handleFirestoreError(error, OperationType.DELETE, `attendance/${a.id}`);
                             }
                           }
                        }} className="text-gray-400 hover:text-red-500 transition-colors bg-gray-50 p-2 rounded-lg">
                           <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {attendance.filter(a => a.studentId === user.uid).length === 0 && (
                    <div className="p-6 text-center text-gray-400 text-sm italic">Belum ada riwayat absensi.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="card-3d p-8 max-w-2xl mx-auto md:mx-0">
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
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest">RA Darusyifa Arjawinangun - Portal Guru</p>
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
                <CheckCircle size={24} />
                Simpan Perubahan
              </button>
            </form>
            
            <div className="mt-12 pt-8 border-t border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Ubah Password</h3>
              <form onSubmit={handleChangePasswordProfile} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Password Baru</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPasswordProfile(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium" 
                    placeholder="Minimal 6 karakter"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Konfirmasi Password Baru</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPasswordProfile(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium" 
                    placeholder="Ulangi password baru"
                    required
                  />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3">
                  <CheckCircle size={24} />
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-8 animate-in slide-in-from-bottom duration-500 pb-20">
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
                <div key={ann.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg md:text-xl font-bold text-gray-800">{ann.title}</h4>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{ann.createdAt ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString() : ''}</span>
                  </div>
                  
                  <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: ann.content }}>
                  </div>

                  {ann.attachments && ann.attachments.length > 0 && (
                    <div className="mt-2 pt-4 border-t border-gray-50">
                      <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Lampiran:</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ann.attachments.map((file: any, idx: number) => (
                          <div key={idx} className="group/file bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-2xl p-3 transition-all flex items-center gap-3 cursor-pointer" onClick={() => {
                            if (file.type.includes('image')) {
                              setSelectedPhoto(file.data);
                            } else if (file.type.includes('pdf')) {
                              const link = document.createElement('a');
                              link.href = file.data;
                              link.download = file.name;
                              link.click();
                            }
                          }}>
                            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center border border-gray-100 group-hover/file:border-blue-100 transition-colors shadow-sm">
                              {file.type.includes('image') ? <ImageIcon size={16} className="text-blue-500" /> : <FileText size={16} className="text-red-500" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-bold text-gray-700 truncate">{file.name}</span>
                            </div>
                            <Download size={12} className="ml-auto text-gray-300 group-hover/file:text-blue-500 transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 text-[9px] text-gray-400 uppercase font-bold tracking-widest">
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
                     <p className="text-sm text-gray-500 mb-6">Siswa: <span className="font-bold text-gray-800">{st?.name}</span> • Materi: <span className="font-bold border-b border-gray-300">{mat?.judul}</span></p>
                     
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
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-gray-700"
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
                        <h4 className="text-xl font-bold text-gray-800">{exam.type}</h4>
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
                                  <p className="text-sm font-bold text-gray-800">{s.subject} <span className="text-xs text-gray-400 font-medium ml-2">({s.kelas})</span></p>
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
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pilih Mapel</label>
                    <select 
                      value={progressCategory} 
                      onChange={(e) => setProgressCategory(e.target.value)} 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">-- Pilih Mapel --</option>
                      {(() => {
                        if (['PTS Ganjil', 'PAS Ganjil', 'PTS Genap', 'PAS Genap'].includes(progressEvaluationPeriod)) {
                          const matchingExams = exams.filter(ex => ex.type === progressEvaluationPeriod);
                          const schedules = matchingExams.flatMap(ex => ex.schedules || []);
                          // In the individual single student form, maybe we can filter by the selected student's class,
                          // but wait, we only query the subject list here
                          const uniqueSubjects = Array.from(new Set(schedules.map((s: any) => s.subject))).filter(Boolean);
                          if (uniqueSubjects.length > 0) {
                            return uniqueSubjects.map((sub: any, idx: number) => <option key={idx} value={sub}>{sub}</option>);
                          } else {
                            return <option value="" disabled>Belum ada jadwal mapel di Ujian {progressEvaluationPeriod}</option>;
                          }
                        }
                        return subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>);
                      })()}
                      {!['PTS Ganjil', 'PAS Ganjil', 'PTS Genap', 'PAS Genap'].includes(progressEvaluationPeriod) && <option value="Umum">Umum / Lainnya</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal Laporan</label>
                    <input type="date" value={progressDate} onChange={(e) => setProgressDate(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" required />
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
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-gray-700" 
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
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-gray-700" 
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
          <div className="fixed inset-0 bg-black z-[200] flex flex-col">
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
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
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Portal Guru RA Darusyifa Arjawinangun</p>
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
