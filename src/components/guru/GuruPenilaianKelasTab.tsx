import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Edit, Star, Save, CheckCircle, Search, Filter,
  BookOpen, GraduationCap, Calendar, Sparkles, RefreshCw, AlertCircle,
  LayoutGrid, User, Users, ChevronRight, ChevronLeft, ArrowRight, ArrowLeft,
  Check, CheckCheck, Zap, Info, CheckCircle2, ChevronDown
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { StudentHafalanProgress } from '../../data/hafalanData';

interface GuruPenilaianKelasTabProps {
  students: any[];
  allStudents: any[];
  userData: any;
  hafalanMaterials: any[];
  hafalanProgress: StudentHafalanProgress[];
  pkType: 'Hafalan' | 'Rapot';
  setPkType: (type: 'Hafalan' | 'Rapot') => void;
  pkClass: string;
  setPkClass: (cls: string) => void;
  pkMaterialId: string;
  setPkMaterialId: (id: string) => void;
  pkCategory: string;
  setPkCategory: (cat: string) => void;
  pkDate: string;
  setPkDate: (date: string) => void;
  pkSemester: string;
  setPkSemester: (sem: string) => void;
  pkRapotPeriod: string;
  setPkRapotPeriod: (p: string) => void;
  pkStudentData: Record<string, any>;
  setPkStudentData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  pkIsSaving: boolean;
  onSavePk: () => void;
  getAvailableSubjects: (period?: string, classFilter?: string) => string[];
  getCategorizedSubjects?: (period?: string, classFilter?: string) => {
    examSubjects: string[];
    waliAspects: string[];
    standardSubjects: string[];
    all: string[];
  };
  onOpenClassAspectModal?: () => void;
  schoolClasses: any[];
  progress?: any[];
  user?: any;
}

interface CellData {
  score: string;
  notes: string;
  status: string;
  docId?: string;
  isDirty?: boolean;
}

export default function GuruPenilaianKelasTab({
  students,
  allStudents,
  userData,
  hafalanMaterials,
  hafalanProgress,
  pkType,
  setPkType,
  pkClass,
  setPkClass,
  pkMaterialId,
  setPkMaterialId,
  pkCategory,
  setPkCategory,
  pkDate,
  setPkDate,
  pkSemester,
  setPkSemester,
  pkRapotPeriod,
  setPkRapotPeriod,
  pkStudentData,
  setPkStudentData,
  pkIsSaving,
  onSavePk,
  getAvailableSubjects,
  getCategorizedSubjects,
  onOpenClassAspectModal,
  schoolClasses,
  progress = [],
  user
}: GuruPenilaianKelasTabProps) {
  // Mode selection for Rapot: 'matrix' (Ledger Semua Mapel), 'studentCard' (Per Siswa Lengkap), 'singleSubject' (Per Satu Mapel)
  const [rapotMode, setRapotMode] = useState<'matrix' | 'studentCard' | 'singleSubject'>('matrix');
  const [search, setSearch] = useState('');
  const [filterCompletion, setFilterCompletion] = useState<'all' | 'incomplete' | 'complete'>('all');
  
  // Selected student for studentCard mode
  const [selectedStudentCardId, setSelectedStudentCardId] = useState<string>('');

  // Matrix draft state: studentId -> subjectName -> CellData
  const [matrixDraft, setMatrixDraft] = useState<Record<string, Record<string, CellData>>>({});
  const [matrixSaving, setMatrixSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Quick fill modal state
  const [showQuickFill, setShowQuickFill] = useState(false);
  const [qfSubject, setQfSubject] = useState<string>('ALL');
  const [qfScore, setQfScore] = useState<number>(80);
  const [qfOnlyEmpty, setQfOnlyEmpty] = useState<boolean>(true);

  const rawTeacherClass = (userData?.assignedClass || userData?.kelas || '').trim();
  const isGeneralTeacher = !rawTeacherClass || 
    ['semua', 'semua kelas', 'wali kelas', 'guru', 'guru ra', '-'].includes(rawTeacherClass.toLowerCase());
  
  const teacherClass = isGeneralTeacher ? 'Semua' : rawTeacherClass;
  const effectiveClass = pkClass || teacherClass;

  const pool = useMemo(() => {
    return (allStudents && allStudents.length > 0 ? allStudents : students)
      .filter(s => (s.status || 'Aktif').toString().toLowerCase() === 'aktif');
  }, [allStudents, students]);

  const targetStudents = useMemo(() => {
    let list = effectiveClass === 'Semua' 
      ? pool 
      : pool.filter(s => {
          const sK = (s.kelas || '').toLowerCase().trim();
          const effK = effectiveClass.toLowerCase().trim();
          const normSK = sK.replace(/[^a-z0-9]/g, '');
          const normEffK = effK.replace(/[^a-z0-9]/g, '');
          return sK === effK || normSK === normEffK || sK.includes(effK) || effK.includes(sK) || normSK.includes(normEffK) || normEffK.includes(normSK);
        });

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => 
        s.name?.toLowerCase().includes(q) || 
        s.email?.toLowerCase().includes(q) ||
        s.nisn?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [effectiveClass, pool, search]);

  // Hafalan materials for class
  const filteredMaterials = useMemo(() => {
    return hafalanMaterials.filter(m => {
      if (!effectiveClass || effectiveClass === 'Semua') return true;
      return (m.kelas || '').toLowerCase().includes(effectiveClass.toLowerCase()) || 
             effectiveClass.toLowerCase().includes((m.kelas || '').toLowerCase());
    });
  }, [hafalanMaterials, effectiveClass]);

  // Categorized subjects for current period & class
  const subjectsData = useMemo(() => {
    if (getCategorizedSubjects) {
      return getCategorizedSubjects(pkRapotPeriod, effectiveClass);
    }
    const avail = getAvailableSubjects(pkRapotPeriod, effectiveClass);
    return {
      examSubjects: [],
      waliAspects: [],
      standardSubjects: avail,
      all: avail
    };
  }, [getCategorizedSubjects, getAvailableSubjects, pkRapotPeriod, effectiveClass]);

  // List of all active subjects for this period
  const activePeriodSubjects = useMemo(() => {
    return subjectsData.all && subjectsData.all.length > 0
      ? subjectsData.all
      : getAvailableSubjects(pkRapotPeriod, effectiveClass);
  }, [subjectsData, getAvailableSubjects, pkRapotPeriod, effectiveClass]);

  const availableClassList = useMemo(() => {
    return Array.from(new Set([
      'UTSMAN BIN AFFAN',
      'UMAR BIN KHATTAB',
      ...schoolClasses.map(c => c.name).filter(Boolean),
      ...pool.map(s => s.kelas).filter(Boolean)
    ])).filter(c => {
      const lower = c.toLowerCase();
      return !lower.includes('kelas a') && 
             !lower.includes('kelas b') && 
             !lower.includes('kelompok a') && 
             !lower.includes('kelompok b') && 
             !lower.includes('playgroup');
    }).map(c => {
      if (c.toLowerCase() === 'utsman') return 'UTSMAN BIN AFFAN';
      if (c.toLowerCase() === 'umar' || c.toLowerCase() === 'umar bin khattab') return 'UMAR BIN KHATTAB';
      return c;
    });
  }, [schoolClasses, pool]);

  // Synchronize matrixDraft with existing database progress whenever period, class, or progress changes
  useEffect(() => {
    const newDraft: Record<string, Record<string, CellData>> = {};

    // First, seed with existing progress docs matching pkRapotPeriod
    const periodLower = (pkRapotPeriod || '').toLowerCase().trim();
    progress.forEach(p => {
      const pPeriod = (p.evaluationPeriod || '').toLowerCase().trim();
      if (pPeriod === periodLower || (periodLower.includes('pts') && pPeriod.includes('pts') && periodLower.includes('ganjil') && pPeriod.includes('ganjil'))) {
        const studentId = p.studentId;
        const subj = p.category || p.title;
        if (!studentId || !subj) return;

        if (!newDraft[studentId]) newDraft[studentId] = {};
        newDraft[studentId][subj] = {
          score: p.score !== undefined && p.score !== null ? String(p.score) : '',
          notes: p.description || '',
          status: p.status || 'Lulus',
          docId: p.id,
          isDirty: false
        };
      }
    });

    setMatrixDraft(newDraft);
  }, [progress, pkRapotPeriod]);

  // Set default selected student for card view
  useEffect(() => {
    if (targetStudents.length > 0 && (!selectedStudentCardId || !targetStudents.some(s => s.id === selectedStudentCardId))) {
      setSelectedStudentCardId(targetStudents[0].id);
    }
  }, [targetStudents, selectedStudentCardId]);

  // Helper: grade info
  const getGradeInfo = (scoreNum: number) => {
    if (scoreNum >= 90) return { grade: 'A', text: 'Sangat Baik', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (scoreNum >= 80) return { grade: 'B', text: 'Baik', badge: 'bg-blue-100 text-blue-800 border-blue-300' };
    if (scoreNum >= 70) return { grade: 'C', text: 'Cukup', badge: 'bg-amber-100 text-amber-800 border-amber-300' };
    return { grade: 'D', text: 'Perlu Bimbingan', badge: 'bg-rose-100 text-rose-800 border-rose-300' };
  };

  // Helper: stats per student
  const getStudentMatrixStats = (studentId: string) => {
    const sMap = matrixDraft[studentId] || {};
    let totalScore = 0;
    let gradedCount = 0;

    activePeriodSubjects.forEach(sub => {
      const cell = sMap[sub];
      if (cell && cell.score !== '' && cell.score !== undefined && !isNaN(Number(cell.score))) {
        totalScore += Number(cell.score);
        gradedCount++;
      }
    });

    const totalSub = activePeriodSubjects.length;
    const avgScore = gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0;
    const isComplete = totalSub > 0 && gradedCount === totalSub;
    const percent = totalSub > 0 ? Math.round((gradedCount / totalSub) * 100) : 0;

    return { totalScore, gradedCount, totalSub, avgScore, isComplete, percent };
  };

  // Filter students by completion status
  const filteredTargetStudents = useMemo(() => {
    if (filterCompletion === 'all') return targetStudents;
    return targetStudents.filter(s => {
      const stats = getStudentMatrixStats(s.id);
      if (filterCompletion === 'complete') return stats.isComplete;
      if (filterCompletion === 'incomplete') return !stats.isComplete;
      return true;
    });
  }, [targetStudents, filterCompletion, matrixDraft, activePeriodSubjects]);

  // Update cell in matrix draft
  const handleMatrixCellChange = (studentId: string, subject: string, field: keyof CellData, value: any) => {
    setMatrixDraft(prev => {
      const sMap = { ...(prev[studentId] || {}) };
      const current = sMap[subject] || { score: '', notes: '', status: 'Lulus' };
      sMap[subject] = {
        ...current,
        [field]: value,
        isDirty: true
      };
      return {
        ...prev,
        [studentId]: sMap
      };
    });
  };

  // Keyboard navigation for spreadsheet matrix
  const handleKeyDownMatrix = (e: React.KeyboardEvent<HTMLInputElement>, sIdx: number, subIdx: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextId = `cell-${sIdx + 1}-${subIdx}`;
      const el = document.getElementById(nextId);
      if (el) (el as HTMLInputElement).focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevId = `cell-${sIdx - 1}-${subIdx}`;
      const el = document.getElementById(prevId);
      if (el) (el as HTMLInputElement).focus();
    }
  };

  // Quick fill implementation
  const handleApplyQuickFill = () => {
    if (isNaN(qfScore) || qfScore < 0 || qfScore > 100) {
      alert('Masukkan nilai yang valid antara 0 - 100');
      return;
    }

    setMatrixDraft(prev => {
      const next = { ...prev };
      targetStudents.forEach(s => {
        const sMap = { ...(next[s.id] || {}) };
        const subjectsToFill = qfSubject === 'ALL' ? activePeriodSubjects : [qfSubject];

        subjectsToFill.forEach(sub => {
          const current = sMap[sub] || { score: '', notes: '', status: 'Lulus' };
          const isEmpty = current.score === '' || current.score === undefined || current.score === null;
          if (!qfOnlyEmpty || isEmpty) {
            sMap[sub] = {
              ...current,
              score: String(qfScore),
              isDirty: true
            };
          }
        });
        next[s.id] = sMap;
      });
      return next;
    });

    setShowQuickFill(false);
    setSaveSuccessMsg(`Nilai default ${qfScore} berhasil diterapkan ke draft! Klik "Simpan Semua Nilai" untuk menyimpan ke sistem.`);
    setTimeout(() => setSaveSuccessMsg(null), 5000);
  };

  // Save ALL matrix entries across students and subjects
  const handleSaveMatrixBulk = async () => {
    try {
      setMatrixSaving(true);
      let count = 0;
      const batchLimit = 350;
      let currentBatch = writeBatch(db);
      let opCount = 0;

      for (const s of targetStudents) {
        const sMap = matrixDraft[s.id] || {};
        for (const sub of activePeriodSubjects) {
          const cell = sMap[sub];
          if (!cell) continue;

          // Only save if dirty or has a valid score
          if (cell.isDirty || (cell.score !== '' && !cell.docId)) {
            const numScore = Number(cell.score);
            if (cell.score !== '' && !isNaN(numScore)) {
              if (cell.docId) {
                // Update existing record
                const docRef = doc(db, 'progress', cell.docId);
                currentBatch.update(docRef, {
                  score: numScore,
                  description: cell.notes || '',
                  status: cell.status || (numScore >= 70 ? 'Lulus' : 'Belum Lulus'),
                  evaluationPeriod: pkRapotPeriod,
                  updatedAt: serverTimestamp()
                });
              } else {
                // Create new record
                const newRef = doc(collection(db, 'progress'));
                currentBatch.set(newRef, {
                  studentId: s.id,
                  title: sub,
                  category: sub,
                  evaluationPeriod: pkRapotPeriod,
                  score: numScore,
                  description: cell.notes || '',
                  status: cell.status || (numScore >= 70 ? 'Lulus' : 'Belum Lulus'),
                  date: pkDate || new Date().toISOString().split('T')[0],
                  teacherId: user?.uid || '',
                  teacherName: userData?.name || 'Guru',
                  createdAt: serverTimestamp()
                });
                // Attach new doc ID to local draft
                cell.docId = newRef.id;
              }
              cell.isDirty = false;
              count++;
              opCount++;

              if (opCount >= batchLimit) {
                await currentBatch.commit();
                currentBatch = writeBatch(db);
                opCount = 0;
              }
            }
          }
        }
      }

      if (opCount > 0) {
        await currentBatch.commit();
      }

      setSaveSuccessMsg(`Alhamdulillah! Berhasil menyimpan ${count} nilai mata pelajaran untuk kelas ${effectiveClass}.`);
      setTimeout(() => setSaveSuccessMsg(null), 6000);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan nilai secara massal. Silakan coba kembali.');
    } finally {
      setMatrixSaving(false);
    }
  };

  // Save single student's complete scorecard in studentCard mode
  const handleSaveStudentCard = async (studentId: string, advanceNext = false) => {
    try {
      setMatrixSaving(true);
      const sMap = matrixDraft[studentId] || {};
      const batch = writeBatch(db);
      let count = 0;

      for (const sub of activePeriodSubjects) {
        const cell = sMap[sub];
        if (!cell || cell.score === '' || isNaN(Number(cell.score))) continue;

        const numScore = Number(cell.score);
        if (cell.docId) {
          batch.update(doc(db, 'progress', cell.docId), {
            score: numScore,
            description: cell.notes || '',
            status: cell.status || (numScore >= 70 ? 'Lulus' : 'Belum Lulus'),
            evaluationPeriod: pkRapotPeriod,
            updatedAt: serverTimestamp()
          });
        } else {
          const newRef = doc(collection(db, 'progress'));
          batch.set(newRef, {
            studentId,
            title: sub,
            category: sub,
            evaluationPeriod: pkRapotPeriod,
            score: numScore,
            description: cell.notes || '',
            status: cell.status || (numScore >= 70 ? 'Lulus' : 'Belum Lulus'),
            date: pkDate || new Date().toISOString().split('T')[0],
            teacherId: user?.uid || '',
            teacherName: userData?.name || 'Guru',
            createdAt: serverTimestamp()
          });
          cell.docId = newRef.id;
        }
        cell.isDirty = false;
        count++;
      }

      await batch.commit();

      const studentName = targetStudents.find(s => s.id === studentId)?.name || 'Santri';
      setSaveSuccessMsg(`Tersimpan! Nilai seluruh mapel ${studentName} berhasil diperbarui.`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);

      if (advanceNext) {
        const currentIdx = targetStudents.findIndex(s => s.id === studentId);
        if (currentIdx !== -1 && currentIdx < targetStudents.length - 1) {
          setSelectedStudentCardId(targetStudents[currentIdx + 1].id);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan nilai santri.');
    } finally {
      setMatrixSaving(false);
    }
  };

  // Count dirty cells
  const dirtyCount = useMemo(() => {
    let count = 0;
    Object.values(matrixDraft).forEach(sMap => {
      Object.values(sMap).forEach(cell => {
        if (cell.isDirty && cell.score !== '') count++;
      });
    });
    return count;
  }, [matrixDraft]);

  // Single-subject change handler (preserves backwards-compat)
  const handleStudentFieldChange = (studentId: string, field: string, value: any) => {
    setPkStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'Sedang Menghafal', stars: 0, notes: '', score: '' }),
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Toast Notification */}
      {saveSuccessMsg && (
        <div className="fixed top-20 right-5 z-50 bg-emerald-700 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={20} className="text-emerald-200 shrink-0" />
          <p className="text-xs sm:text-sm font-bold">{saveSuccessMsg}</p>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
              Penilaian Cepat & Terpadu Kelas
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-200 flex items-center gap-1">
              <Zap size={12} className="fill-current text-emerald-600" /> Mode Kilat
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Nilai seluruh mata pelajaran {pkRapotPeriod} secara efisien dan cepat tanpa perlu berulang kali ganti halaman.
          </p>
        </div>

        {/* Mode Selector Pill: Hafalan vs Rapot */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center shrink-0 border border-slate-200">
          <button
            type="button"
            onClick={() => setPkType('Hafalan')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              pkType === 'Hafalan'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen size={14} />
            <span>Hafalan (Tahfidz)</span>
          </button>
          <button
            type="button"
            onClick={() => setPkType('Rapot')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              pkType === 'Rapot'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap size={14} />
            <span>Nilai Rapot / Mapel</span>
          </button>
        </div>
      </div>

      {/* Rapot Speed Modes Switcher (Only in Rapot mode) */}
      {pkType === 'Rapot' && (
        <div className="bg-white p-3.5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Metode Nilai:</span>
            
            <button
              type="button"
              onClick={() => setRapotMode('matrix')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                rapotMode === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <LayoutGrid size={15} />
              <span>Matriks Semua Mapel (Ledger Spreadsheet)</span>
              <span className="text-[10px] bg-indigo-700/60 text-indigo-100 px-1.5 py-0.5 rounded-md">Tercepat</span>
            </button>

            <button
              type="button"
              onClick={() => setRapotMode('studentCard')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                rapotMode === 'studentCard'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <User size={15} />
              <span>Lembar Santri (Input Cepat Per-Siswa)</span>
            </button>

            <button
              type="button"
              onClick={() => setRapotMode('singleSubject')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                rapotMode === 'singleSubject'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Filter size={15} />
              <span>Per Satu Mapel (Fokus Satuan)</span>
            </button>
          </div>

          {rapotMode === 'matrix' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQuickFill(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                title="Isi nilai default KKM ke semua atau mapel tertentu"
              >
                <Zap size={13} className="fill-current" />
                <span>Isi Nilai Cepat (KKM)</span>
              </button>

              <button
                type="button"
                onClick={handleSaveMatrixBulk}
                disabled={matrixSaving}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-200 cursor-pointer transition-all disabled:opacity-50"
              >
                {matrixSaving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Simpan Semua ({dirtyCount > 0 ? `${dirtyCount} Baru/Diedit` : 'Lengkap'})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Configuration Controls Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Kelas Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Pilih Kelas
            </label>
            <select
              value={pkClass || teacherClass}
              onChange={(e) => setPkClass(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Semua">Semua Kelas</option>
              {availableClassList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Period / Semester Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Periode Penilaian
            </label>
            <select
              value={pkType === 'Hafalan' ? pkSemester : pkRapotPeriod}
              onChange={(e) => {
                if (pkType === 'Hafalan') setPkSemester(e.target.value);
                else setPkRapotPeriod(e.target.value);
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="PTS Ganjil">PTS Ganjil (Tengah Semester 1)</option>
              <option value="PAS Ganjil">PAS Ganjil (Akhir Semester 1)</option>
              <option value="PTS Genap">PTS Genap (Tengah Semester 2)</option>
              <option value="PAS Genap">PAS Genap (Akhir Semester 2)</option>
              {pkType === 'Rapot' && <option value="Harian">Laporan Harian / Formatif</option>}
            </select>
          </div>

          {/* Conditional 3rd & 4th Columns */}
          {pkType === 'Hafalan' ? (
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Pilih Materi Hafalan
              </label>
              <select
                value={pkMaterialId}
                onChange={(e) => setPkMaterialId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Pilih Materi Hafalan --</option>
                {filteredMaterials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.judul} ({m.kategori || 'Hafalan'} - {m.kelas || 'Umum'})
                  </option>
                ))}
              </select>
            </div>
          ) : rapotMode === 'singleSubject' ? (
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Pilih Mata Pelajaran / Aspek
              </label>
              <select
                value={pkCategory}
                onChange={(e) => setPkCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Pilih Mata Pelajaran / Aspek --</option>
                {subjectsData.examSubjects.length > 0 && (
                  <optgroup label={`📋 Jadwal Ujian ${pkRapotPeriod} (Otomatis)`}>
                    {subjectsData.examSubjects.map((sub, idx) => (
                      <option key={`exam-${idx}`} value={sub}>{sub}</option>
                    ))}
                  </optgroup>
                )}
                {subjectsData.waliAspects.length > 0 && (
                  <optgroup label={`⭐ Aspek Perkembangan Kelas (${effectiveClass})`}>
                    {subjectsData.waliAspects.map((sub, idx) => (
                      <option key={`wali-${idx}`} value={sub}>{sub}</option>
                    ))}
                  </optgroup>
                )}
                {subjectsData.standardSubjects.length > 0 && (
                  <optgroup label="📚 Mata Pelajaran Standar RA">
                    {subjectsData.standardSubjects.map((sub, idx) => (
                      <option key={`std-${idx}`} value={sub}>{sub}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          ) : (
            <div className="lg:col-span-2 flex items-center justify-between bg-indigo-50/60 p-2.5 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {activePeriodSubjects.length}
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-900 leading-tight">
                    {activePeriodSubjects.length} Mata Pelajaran Terdaftar ({pkRapotPeriod})
                  </p>
                  <p className="text-[10px] text-indigo-600">
                    {subjectsData.examSubjects.length > 0 ? `${subjectsData.examSubjects.length} dari jadwal ujian + ` : ''}
                    Semua kolom mapel otomatis ditampilkan untuk kelas {effectiveClass}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-indigo-100">
                  {targetStudents.length} Santri
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari santri berdasarkan nama..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {pkType === 'Rapot' && rapotMode === 'matrix' && (
              <select
                value={filterCompletion}
                onChange={(e: any) => setFilterCompletion(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
              >
                <option value="all">Semua Status</option>
                <option value="incomplete">Belum Lengkap</option>
                <option value="complete">Sudah Lengkap</option>
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            {pkType === 'Hafalan' || (pkType === 'Rapot' && rapotMode === 'singleSubject') ? (
              <button
                type="button"
                onClick={onSavePk}
                disabled={pkIsSaving || (pkType === 'Hafalan' ? !pkMaterialId : !pkCategory)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer"
              >
                {pkIsSaving ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Simpan Nilai ({targetStudents.length} Santri)</span>
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: MATRIX / LEDGER SPREADSHEET (ALL SUBJECTS FOR PTS GANJIL)       */}
      {/* ========================================================================= */}
      {pkType === 'Rapot' && rapotMode === 'matrix' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-0">
          {/* Quick instructions strip */}
          <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Sparkles size={13} className="text-amber-500" /> Tips Efisiensi:
              </span>
              <span>Ketik angka (0-100) lalu tekan <b>Enter</b> untuk santri berikutnya, atau <b>Tab</b> untuk mapel berikutnya.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Hijau: &ge; 85
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Biru: 75-84
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Oranye: &lt; 75
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[70vh] relative">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="sticky top-0 z-20 bg-slate-100 text-slate-700 shadow-xs">
                <tr className="border-b border-slate-200 text-[11px] font-black uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center bg-slate-100 sticky left-0 z-20 border-r border-slate-200">No</th>
                  <th className="py-3 px-3 w-52 bg-slate-100 sticky left-10 z-20 border-r border-slate-200">
                    Nama Santri
                  </th>
                  
                  {/* Dynamic Subjects Columns */}
                  {activePeriodSubjects.map((sub, sIdx) => {
                    const isExam = subjectsData.examSubjects.includes(sub);
                    return (
                      <th key={sIdx} className="py-3 px-2 text-center min-w-[110px] max-w-[130px] border-r border-slate-200">
                        <div className="flex flex-col items-center">
                          <span className="truncate w-full block text-slate-800" title={sub}>{sub}</span>
                          {isExam ? (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold uppercase mt-0.5">Ujian</span>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-normal">Mapel</span>
                          )}
                        </div>
                      </th>
                    );
                  })}

                  <th className="py-3 px-3 w-20 text-center bg-indigo-50/70 border-r border-slate-200 text-indigo-900">Rerata</th>
                  <th className="py-3 px-3 w-28 text-center bg-slate-100">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTargetStudents.map((student, sIdx) => {
                  const stats = getStudentMatrixStats(student.id);
                  const gradeInfo = getGradeInfo(stats.avgScore);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Fixed Col 1: No */}
                      <td className="py-2.5 px-2 text-center font-bold text-slate-400 bg-white sticky left-0 z-10 border-r border-slate-100">
                        {sIdx + 1}
                      </td>

                      {/* Fixed Col 2: Student Name */}
                      <td className="py-2.5 px-3 bg-white sticky left-10 z-10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                            {student.photoURL ? (
                              <img src={student.photoURL} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                              student.name?.charAt(0) || 'S'
                            )}
                          </div>
                          <div className="truncate max-w-[140px]">
                            <p className="font-bold text-slate-900 leading-tight truncate" title={student.name}>{student.name}</p>
                            <p className="text-[9px] text-slate-400">{student.kelas || effectiveClass}</p>
                          </div>
                        </div>
                      </td>

                      {/* Dynamic Subject Score Inputs */}
                      {activePeriodSubjects.map((sub, subIdx) => {
                        const cell = matrixDraft[student.id]?.[sub] || { score: '', notes: '', status: 'Lulus' };
                        const scoreVal = cell.score;
                        const scoreNum = Number(scoreVal);
                        
                        let cellBg = 'bg-white border-slate-200';
                        if (scoreVal !== '' && !isNaN(scoreNum)) {
                          if (scoreNum >= 85) cellBg = 'bg-emerald-50 text-emerald-900 font-black border-emerald-300';
                          else if (scoreNum >= 75) cellBg = 'bg-blue-50 text-blue-900 font-bold border-blue-300';
                          else cellBg = 'bg-amber-50 text-amber-900 font-bold border-amber-300';
                        }

                        return (
                          <td key={subIdx} className="py-2 px-1 text-center border-r border-slate-100">
                            <input
                              id={`cell-${sIdx}-${subIdx}`}
                              type="number"
                              min="0"
                              max="100"
                              value={scoreVal}
                              onChange={(e) => handleMatrixCellChange(student.id, sub, 'score', e.target.value)}
                              onKeyDown={(e) => handleKeyDownMatrix(e, sIdx, subIdx)}
                              placeholder="-"
                              className={`w-full max-w-[80px] p-1.5 text-center rounded-lg text-xs outline-none transition-all focus:ring-2 focus:ring-indigo-500 border ${cellBg}`}
                            />
                          </td>
                        );
                      })}

                      {/* Average Column */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-100 bg-indigo-50/40 font-black text-indigo-900">
                        {stats.gradedCount > 0 ? (
                          <div className="flex flex-col items-center">
                            <span>{stats.avgScore}</span>
                            <span className="text-[9px] text-indigo-600 font-medium">{gradeInfo.grade}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="py-2.5 px-2 text-center">
                        {stats.isComplete ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 size={11} /> Lengkap
                          </span>
                        ) : stats.gradedCount > 0 ? (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            {stats.gradedCount}/{stats.totalSub} Mapel
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Belum diisi</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredTargetStudents.length === 0 && (
                  <tr>
                    <td colSpan={activePeriodSubjects.length + 4} className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada santri yang cocok dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Summary Bar */}
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
              <span>Total Santri: {targetStudents.length}</span>
              <span>•</span>
              <span className="text-emerald-700">
                Lengkap: {targetStudents.filter(s => getStudentMatrixStats(s.id).isComplete).length} Santri
              </span>
              <span>•</span>
              <span className="text-amber-700">
                Belum Lengkap: {targetStudents.filter(s => !getStudentMatrixStats(s.id).isComplete).length} Santri
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowQuickFill(true)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Zap size={14} />
                <span>Isi Cepat KKM</span>
              </button>

              <button
                type="button"
                onClick={handleSaveMatrixBulk}
                disabled={matrixSaving}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
              >
                {matrixSaving ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Menyimpan Semua Nilai...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Simpan Seluruh Nilai {pkRapotPeriod}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: STUDENT CARD SCORECARD (COMPLETE FORM PER STUDENT)                */}
      {/* ========================================================================= */}
      {pkType === 'Rapot' && rapotMode === 'studentCard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Student Selector List */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col max-h-[75vh]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Daftar Santri Kelas</h3>
                <p className="text-[10px] text-slate-500">Pilih santri untuk input rapot lengkap</p>
              </div>
              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">
                {targetStudents.length} Santri
              </span>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 flex-1 p-2 space-y-1">
              {targetStudents.map((st) => {
                const stats = getStudentMatrixStats(st.id);
                const isSelected = st.id === selectedStudentCardId;

                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStudentCardId(st.id)}
                    className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {st.name?.charAt(0) || 'S'}
                      </div>
                      <div className="truncate">
                        <p className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {st.name}
                        </p>
                        <p className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {st.kelas || effectiveClass}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {stats.isComplete ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          <CheckCircle2 size={10} /> Lengkap
                        </span>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {stats.gradedCount}/{stats.totalSub} Mapel
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Student's Multi-Subject Grading Sheet */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
            {(() => {
              const currentStudent = targetStudents.find(s => s.id === selectedStudentCardId);
              if (!currentStudent) {
                return (
                  <div className="p-12 text-center text-slate-400">
                    Pilih santri dari daftar di sebelah kiri untuk mengisi nilai.
                  </div>
                );
              }

              const stats = getStudentMatrixStats(currentStudent.id);
              const gradeInfo = getGradeInfo(stats.avgScore);
              const sIdx = targetStudents.findIndex(s => s.id === currentStudent.id);

              return (
                <div>
                  {/* Student Header */}
                  <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white text-base shrink-0 overflow-hidden">
                        {currentStudent.photoURL ? (
                          <img src={currentStudent.photoURL} alt={currentStudent.name} className="w-full h-full object-cover" />
                        ) : (
                          currentStudent.name?.charAt(0) || 'S'
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-white">{currentStudent.name}</h3>
                          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md text-white font-medium">
                            Santri #{sIdx + 1}
                          </span>
                        </div>
                        <p className="text-xs text-indigo-200">
                          Kelas: {currentStudent.kelas || effectiveClass} • NIS: {currentStudent.email?.split('@')[0] || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white/10 p-2.5 rounded-2xl border border-white/10 shrink-0">
                      <div className="text-center px-2 border-r border-white/10">
                        <p className="text-[9px] uppercase tracking-wider text-indigo-200 font-bold">Rerata Nilai</p>
                        <p className="text-lg font-black text-white">{stats.gradedCount > 0 ? stats.avgScore : '-'}</p>
                      </div>
                      <div className="text-center px-2">
                        <p className="text-[9px] uppercase tracking-wider text-indigo-200 font-bold">Predikat</p>
                        <p className="text-lg font-black text-emerald-400">{stats.gradedCount > 0 ? gradeInfo.grade : '-'}</p>
                      </div>
                      <div className="text-center px-2 border-l border-white/10">
                        <p className="text-[9px] uppercase tracking-wider text-indigo-200 font-bold">Progress</p>
                        <p className="text-sm font-black text-white">{stats.percent}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-1.5">
                    <div
                      className="bg-emerald-500 h-1.5 transition-all duration-300"
                      style={{ width: `${stats.percent}%` }}
                    />
                  </div>

                  {/* Subject List Inputs */}
                  <div className="p-5 space-y-4 max-h-[55vh] overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Daftar Nilai Mata Pelajaran ({pkRapotPeriod})
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {stats.gradedCount} dari {stats.totalSub} mapel terisi
                      </span>
                    </div>

                    <div className="space-y-3">
                      {activePeriodSubjects.map((sub, idx) => {
                        const cell = matrixDraft[currentStudent.id]?.[sub] || { score: '', notes: '', status: 'Lulus' };
                        const isExam = subjectsData.examSubjects.includes(sub);
                        const numScore = Number(cell.score);
                        const hasScore = cell.score !== '' && !isNaN(numScore);
                        const cellGrade = hasScore ? getGradeInfo(numScore) : null;

                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              hasScore
                                ? 'bg-white border-slate-200 shadow-xs'
                                : 'bg-slate-50/70 border-dashed border-slate-200'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 flex-1">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                  hasScore ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-200 text-slate-500'
                                }`}>
                                  {idx + 1}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-xs text-slate-900">{sub}</p>
                                    {isExam && (
                                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded uppercase">
                                        Jadwal Ujian
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400">
                                    {hasScore ? `Status: ${cell.status || 'Lulus'} • Predikat: ${cellGrade?.grade} (${cellGrade?.text})` : 'Belum dinilai'}
                                  </p>
                                </div>
                              </div>

                              {/* Score quick setter */}
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-1">
                                  {[75, 80, 85, 90].map(quickVal => (
                                    <button
                                      key={quickVal}
                                      type="button"
                                      onClick={() => handleMatrixCellChange(currentStudent.id, sub, 'score', String(quickVal))}
                                      className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-600 transition-colors cursor-pointer"
                                    >
                                      {quickVal}
                                    </button>
                                  ))}
                                </div>

                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={cell.score}
                                    onChange={(e) => handleMatrixCellChange(currentStudent.id, sub, 'score', e.target.value)}
                                    placeholder="0-100"
                                    className={`w-20 p-2 text-center rounded-xl text-xs font-black outline-none border focus:ring-2 focus:ring-indigo-500 ${
                                      hasScore
                                        ? numScore >= 85
                                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                          : numScore >= 75
                                          ? 'bg-blue-50 text-blue-900 border-blue-300'
                                          : 'bg-amber-50 text-amber-900 border-amber-300'
                                        : 'bg-white border-slate-200'
                                    }`}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Optional Notes Row */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2">
                              <input
                                type="text"
                                value={cell.notes || ''}
                                onChange={(e) => handleMatrixCellChange(currentStudent.id, sub, 'notes', e.target.value)}
                                placeholder="Catatan perkembangan khusus mapel ini (opsional)..."
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer Navigation & Save Buttons */}
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={sIdx === 0}
                        onClick={() => setSelectedStudentCardId(targetStudents[sIdx - 1].id)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <ChevronLeft size={15} />
                        <span>Santri Sebelumnya</span>
                      </button>

                      <button
                        type="button"
                        disabled={sIdx >= targetStudents.length - 1}
                        onClick={() => setSelectedStudentCardId(targetStudents[sIdx + 1].id)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <span>Santri Berikutnya</span>
                        <ChevronRight size={15} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveStudentCard(currentStudent.id, false)}
                        disabled={matrixSaving}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                      >
                        <Save size={14} />
                        <span>Simpan Santri Ini</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveStudentCard(currentStudent.id, true)}
                        disabled={matrixSaving}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-200 cursor-pointer transition-all disabled:opacity-50"
                      >
                        <span>Simpan & Lanjut ➔</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: SINGLE SUBJECT TABLE (CLASSIC TABLE FOR 1 SUBJECT OR HAFALAN)    */}
      {/* ========================================================================= */}
      {(pkType === 'Hafalan' || (pkType === 'Rapot' && rapotMode === 'singleSubject')) && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Santri</th>
                  <th className="py-3.5 px-4 w-36">Status Capaian</th>
                  {pkType === 'Hafalan' ? (
                    <th className="py-3.5 px-4 w-36 text-center">Bintang (1-5)</th>
                  ) : (
                    <th className="py-3.5 px-4 w-28 text-center">Nilai (1-100)</th>
                  )}
                  <th className="py-3.5 px-4">Catatan Perkembangan (Opsional)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {targetStudents.map((student, idx) => {
                  const sData = pkStudentData[student.id] || {
                    status: pkType === 'Hafalan' ? 'Sedang Menghafal' : 'Lulus',
                    stars: 0,
                    score: '',
                    notes: ''
                  };

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                            {student.photoURL ? (
                              <img src={student.photoURL} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                              student.name?.charAt(0) || 'S'
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{student.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">NIS: {student.email?.split('@')[0] || '-'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-4">
                        {pkType === 'Hafalan' ? (
                          <select
                            value={sData.status || 'Sedang Menghafal'}
                            onChange={(e) => handleStudentFieldChange(student.id, 'status', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="Sedang Menghafal">Sedang Menghafal</option>
                            <option value="Lancar">Lancar</option>
                            <option value="Mumtaz (Lulus)">Mumtaz (Lulus)</option>
                          </select>
                        ) : (
                          <select
                            value={sData.status || 'Lulus'}
                            onChange={(e) => handleStudentFieldChange(student.id, 'status', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="Lulus">Lulus</option>
                            <option value="Belum Lulus">Belum Lulus</option>
                            <option value="Mengulang">Mengulang</option>
                          </select>
                        )}
                      </td>

                      {/* Stars or Score input */}
                      {pkType === 'Hafalan' ? (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleStudentFieldChange(student.id, 'stars', star)}
                                className={`p-1 transition-transform active:scale-125 ${
                                  (sData.stars || 0) >= star ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'
                                }`}
                              >
                                <Star size={18} fill={(sData.stars || 0) >= star ? 'currentColor' : 'none'} />
                              </button>
                            ))}
                          </div>
                        </td>
                      ) : (
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={sData.score ?? ''}
                            onChange={(e) => handleStudentFieldChange(student.id, 'score', e.target.value)}
                            placeholder="0-100"
                            className="w-20 p-2 text-center font-bold bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>
                      )}

                      {/* Notes Field (Optional) */}
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={sData.notes || ''}
                          onChange={(e) => handleStudentFieldChange(student.id, 'notes', e.target.value)}
                          placeholder="Catatan perkembangan santri (opsional)..."
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                    </tr>
                  );
                })}

                {targetStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada data santri untuk kelas yang dipilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Fill Modal */}
      {showQuickFill && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Zap size={18} className="fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Isi Nilai Cepat (KKM)</h3>
                  <p className="text-[10px] text-slate-400">Terapkan nilai standar ke seluruh siswa sekaligus</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickFill(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Target Mata Pelajaran
                </label>
                <select
                  value={qfSubject}
                  onChange={(e) => setQfSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">★ Semua Mata Pelajaran ({activePeriodSubjects.length} Mapel)</option>
                  {activePeriodSubjects.map((sub, i) => (
                    <option key={i} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Nilai yang Diterapkan (0 - 100)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={qfScore}
                    onChange={(e) => setQfScore(Number(e.target.value))}
                    className="w-28 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="flex items-center gap-1.5 flex-1">
                    {[75, 80, 85, 90].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setQfScore(val)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          qfScore === val
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qfOnlyEmpty}
                    onChange={(e) => setQfOnlyEmpty(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Hanya untuk sel yang masih kosong</p>
                    <p className="text-[10px] text-slate-400">Tidak akan menimpa nilai yang sudah terisi sebelumnya</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowQuickFill(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyQuickFill}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-amber-200 cursor-pointer"
              >
                <Zap size={14} className="fill-current" />
                <span>Terapkan Nilai</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
