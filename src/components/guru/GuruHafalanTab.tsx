import React, { useState, useMemo } from 'react';
import { 
  Star, Search, Filter, BookOpen, CheckCircle, Clock, 
  Printer, Play, Video, Mic, ExternalLink, Sparkles, ChevronRight, 
  Award, Plus, Edit, Trash2, X, Save, AlertCircle, ChevronLeft,
  ChevronsLeft, ChevronsRight, Layers, FileText, CheckCircle2, RotateCcw,
  Tag, FolderPlus, Settings2, Edit3, Check
} from 'lucide-react';
import { 
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, 
  serverTimestamp, writeBatch 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestoreUtils';
import { StudentHafalanProgress, HafalanStatus, HafalanMaterial, HafalanCategory, DEFAULT_HAFALAN_CATEGORIES, staticHafalanMaterials } from '../../data/hafalanData';
import { useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';

interface GuruHafalanTabProps {
  hafalanProgress: StudentHafalanProgress[];
  hafalanMaterials: HafalanMaterial[];
  students: any[];
  allStudents?: any[];
  schoolClasses?: any[];
  userData: any;
  onEvaluateHafalan: (p: StudentHafalanProgress) => void;
  onPromptPrintRapotHafalan: (student: any) => void;
}

export default function GuruHafalanTab({
  hafalanProgress,
  hafalanMaterials,
  students,
  allStudents = [],
  schoolClasses = [],
  userData,
  onEvaluateHafalan,
  onPromptPrintRapotHafalan
}: GuruHafalanTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'eval' | 'modul'>('eval');

  // --- Filter states for Setoran & Evaluasi ---
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [classFilter, setClassFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Siap Dinilai' | 'Sudah Dinilai' | 'Belum Dinilai'>('Semua');
  const [evalPage, setEvalPage] = useState(1);
  const [evalPerPage, setEvalPerPage] = useState(9);

  // --- Filter states for Katalog Modul ---
  const [modulSearchTerm, setModulSearchTerm] = useState('');
  const [modulCategoryFilter, setModulCategoryFilter] = useState('Semua');
  const [modulClassFilter, setModulClassFilter] = useState('Semua');
  const [modulPage, setModulPage] = useState(1);
  const [modulPerPage, setModulPerPage] = useState(8);

  // --- Category Data (Admin-managed, Read-only for Guru/Wali Kelas) ---
  const [customCategories, setCustomCategories] = useState<HafalanCategory[]>([]);

  // --- Modal states for Material Management (Tambah / Edit) ---
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<HafalanMaterial | null>(null);
  const [formJudul, setFormJudul] = useState('');
  const [formKategori, setFormKategori] = useState<string>('Surat Pendek');
  const [formKelas, setFormKelas] = useState<'Utsman' | 'Umar Bin Khattab' | string>('Utsman');
  const [formUrutan, setFormUrutan] = useState(1);
  const [formArab, setFormArab] = useState('');
  const [formLatin, setFormLatin] = useState('');
  const [formTerjemahan, setFormTerjemahan] = useState('');
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);
  const [isSyncingDefaults, setIsSyncingDefaults] = useState(false);

  // Real-time listener for hafalan_categories from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'hafalan_categories'), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as HafalanCategory));
      setCustomCategories(docs);
    }, (err) => {
      console.error('Error fetching hafalan categories:', err);
    });
    return () => unsub();
  }, []);

  // --- Modal states for Direct Evaluation (Input Nilai Langsung) ---
  const [showDirectEvalModal, setShowDirectEvalModal] = useState(false);
  const [directStudentId, setDirectStudentId] = useState('');
  const [directMaterialId, setDirectMaterialId] = useState('');
  const [directStars, setDirectStars] = useState(4);
  const [directStatus, setDirectStatus] = useState<HafalanStatus>('Sedang Menghafal');
  const [directSemester, setDirectSemester] = useState('PTS Ganjil');
  const [directNotes, setDirectNotes] = useState('');
  const [isSavingDirectEval, setIsSavingDirectEval] = useState(false);

  const effectiveStudents = allStudents.length > 0 ? allStudents : students;
  const studentMap = useMemo(() => new Map(effectiveStudents.map(s => [s.id, s])), [effectiveStudents]);
  const materialMap = useMemo(() => new Map(hafalanMaterials.map(m => [m.id, m])), [hafalanMaterials]);

  // Combined Categories list (Admin-managed, with deleted categories filtered)
  const categories = useMemo(() => {
    const deletedNames = customCategories.filter(c => c.isDeleted).map(c => c.name?.trim().toLowerCase());
    const activeCustom = customCategories.filter(c => !c.isDeleted);
    const customNames = activeCustom.map(c => c.name?.trim()).filter(Boolean);
    const activeDefaults = (DEFAULT_HAFALAN_CATEGORIES as readonly string[]).filter(d => !deletedNames.includes(d.toLowerCase()));
    const materialCats = hafalanMaterials
      .map(m => m.kategori?.trim())
      .filter((cat): cat is string => !!cat && !deletedNames.includes(cat.toLowerCase()));

    return Array.from(new Set([...activeDefaults, ...customNames, ...materialCats]));
  }, [customCategories, hafalanMaterials]);

  // Classes list - only official classes UTSMAN BIN AFFAN and UMAR BIN KHATTAB
  const classOptions = useMemo(() => {
    const raw = [
      'UTSMAN BIN AFFAN',
      'UMAR BIN KHATTAB',
      ...schoolClasses.map(c => c.name).filter(Boolean),
      ...hafalanMaterials.map(m => m.kelas).filter(Boolean)
    ];
    const cleaned = raw.filter(c => {
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

    const unique = Array.from(new Set(cleaned));
    return unique.length > 0 ? unique : ['UTSMAN BIN AFFAN', 'UMAR BIN KHATTAB'];
  }, [schoolClasses, hafalanMaterials]);

  // ===============================================================
  // SETORAN & EVALUASI FILTERED & PAGINATED
  // ===============================================================
  const filteredSubmissions = useMemo(() => {
    return hafalanProgress.filter(p => {
      const student = studentMap.get(p.studentId);
      const material = materialMap.get(p.materialId);

      // Search match
      const matchSearch = !searchTerm || 
        (student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (material?.judul || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.catatanGuru || '').toLowerCase().includes(searchTerm.toLowerCase());

      // Category match
      const matchCat = categoryFilter === 'Semua' || material?.kategori === categoryFilter;

      // Class match (supports "Utsman", "UTSMAN BIN AFFAN", "Umar", "UMAR BIN KHATTAB")
      let matchClass = true;
      if (classFilter !== 'Semua') {
        const sKelas = (student?.kelas || '').toLowerCase();
        const mKelas = (material?.kelas || '').toLowerCase();
        const cf = classFilter.toLowerCase();
        if (cf.includes('utsman')) {
          matchClass = sKelas.includes('utsman') || mKelas.includes('utsman');
        } else if (cf.includes('umar')) {
          matchClass = sKelas.includes('umar') || mKelas.includes('umar');
        } else {
          matchClass = sKelas === cf || mKelas === cf || sKelas.includes(cf) || mKelas.includes(cf);
        }
      }

      // Status match (Siap Dinilai, Sudah Dinilai, Belum Dinilai)
      let matchStatus = true;
      const isReady = !!(p.isReadyForTest || p.submissionMethod || (p.status === 'Sedang Menghafal' && (!p.stars || p.stars === 0)));
      const isGraded = (p.stars && p.stars > 0) || p.status === 'Mumtaz (Lulus)' || p.status === 'Lancar';

      if (statusFilter === 'Siap Dinilai') {
        matchStatus = isReady && !isGraded;
      } else if (statusFilter === 'Sudah Dinilai') {
        matchStatus = !!isGraded;
      } else if (statusFilter === 'Belum Dinilai') {
        matchStatus = !isGraded;
      }

      return matchSearch && matchCat && matchClass && matchStatus;
    });
  }, [hafalanProgress, studentMap, materialMap, searchTerm, categoryFilter, classFilter, statusFilter]);

  // Reset page when filter changes
  const totalEvalPages = Math.ceil(filteredSubmissions.length / evalPerPage) || 1;
  const currentEvalPage = Math.min(evalPage, totalEvalPages);
  const paginatedSubmissions = useMemo(() => {
    const start = (currentEvalPage - 1) * evalPerPage;
    return filteredSubmissions.slice(start, start + evalPerPage);
  }, [filteredSubmissions, currentEvalPage, evalPerPage]);

  // Counts for status badges
  const readyCount = useMemo(() => {
    return hafalanProgress.filter(p => {
      const isGraded = (p.stars && p.stars > 0) || p.status === 'Mumtaz (Lulus)' || p.status === 'Lancar';
      return (p.isReadyForTest || p.submissionMethod || p.status === 'Sedang Menghafal') && !isGraded;
    }).length;
  }, [hafalanProgress]);

  const gradedCount = useMemo(() => {
    return hafalanProgress.filter(p => (p.stars && p.stars > 0) || p.status === 'Mumtaz (Lulus)' || p.status === 'Lancar').length;
  }, [hafalanProgress]);

  // ===============================================================
  // MODUL MATERI FILTERED & PAGINATED
  // ===============================================================
  const filteredMaterials = useMemo(() => {
    return hafalanMaterials.filter(mat => {
      const matchSearch = !modulSearchTerm || 
        mat.judul.toLowerCase().includes(modulSearchTerm.toLowerCase()) ||
        (mat.latin || '').toLowerCase().includes(modulSearchTerm.toLowerCase()) ||
        (mat.terjemahan || '').toLowerCase().includes(modulSearchTerm.toLowerCase());

      const matchCat = modulCategoryFilter === 'Semua' || mat.kategori === modulCategoryFilter;
      
      let matchClass = true;
      if (modulClassFilter !== 'Semua') {
        const mK = (mat.kelas || '').toLowerCase();
        const cf = modulClassFilter.toLowerCase();
        if (cf.includes('utsman')) {
          matchClass = mK.includes('utsman');
        } else if (cf.includes('umar')) {
          matchClass = mK.includes('umar');
        } else {
          matchClass = mK === cf || mK.includes(cf) || cf.includes(mK);
        }
      }

      return matchSearch && matchCat && matchClass;
    });
  }, [hafalanMaterials, modulSearchTerm, modulCategoryFilter, modulClassFilter]);

  const totalModulPages = Math.ceil(filteredMaterials.length / modulPerPage) || 1;
  const currentModulPage = Math.min(modulPage, totalModulPages);
  const paginatedMaterials = useMemo(() => {
    const start = (currentModulPage - 1) * modulPerPage;
    return filteredMaterials.slice(start, start + modulPerPage);
  }, [filteredMaterials, currentModulPage, modulPerPage]);

  // ===============================================================
  // MATERIAL MODAL ACTIONS (Add / Edit / Delete)
  // ===============================================================
  const handleOpenAddMaterial = () => {
    setEditingMaterial(null);
    setFormJudul('');
    setFormKategori(categories[0] || 'Surat Pendek');
    setFormKelas(userData?.assignedClass || userData?.kelas || 'UTSMAN BIN AFFAN');
    setFormUrutan(hafalanMaterials.length + 1);
    setFormArab('');
    setFormLatin('');
    setFormTerjemahan('');
    setShowMaterialModal(true);
  };

  const handleOpenEditMaterial = (mat: HafalanMaterial) => {
    setEditingMaterial(mat);
    setFormJudul(mat.judul);
    setFormKategori(mat.kategori || 'Surat Pendek');
    setFormKelas(mat.kelas || 'Utsman');
    setFormUrutan(mat.urutan || 1);
    setFormArab(mat.arab || '');
    setFormLatin(mat.latin || '');
    setFormTerjemahan(mat.terjemahan || '');
    setShowMaterialModal(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim()) {
      alert('Judul materi hafalan wajib diisi!');
      return;
    }

    setIsSavingMaterial(true);
    try {
      const payload: any = {
        judul: formJudul.trim(),
        kategori: formKategori || categories[0] || 'Surat Pendek',
        kelas: formKelas,
        urutan: Number(formUrutan) || 1,
        arab: formArab.trim(),
        latin: formLatin.trim(),
        terjemahan: formTerjemahan.trim(),
        updatedAt: serverTimestamp(),
        updatedBy: userData?.name || 'Guru'
      };

      if (editingMaterial?.id) {
        // Save / Update existing
        await setDoc(doc(db, 'hafalan_materials', editingMaterial.id), payload, { merge: true });
        alert(`Materi hafalan "${formJudul}" berhasil diperbarui!`);
      } else {
        // Add new material
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'hafalan_materials'), payload);
        alert(`Materi hafalan baru "${formJudul}" berhasil ditambahkan!`);
      }

      setShowMaterialModal(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'hafalan_materials');
    } finally {
      setIsSavingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (mat: HafalanMaterial) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus materi hafalan "${mat.judul}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'hafalan_materials', mat.id));
      alert(`Materi hafalan "${mat.judul}" berhasil dihapus.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `hafalan_materials/${mat.id}`);
    }
  };

  const handleSyncDefaultsToFirestore = async () => {
    if (!window.confirm(`Sinkronkan ${staticHafalanMaterials.length} materi hafalan standar kurikulum ke database Firestore?`)) {
      return;
    }

    setIsSyncingDefaults(true);
    try {
      const batch = writeBatch(db);
      staticHafalanMaterials.forEach(m => {
        const ref = doc(db, 'hafalan_materials', m.id);
        batch.set(ref, {
          ...m,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      });
      await batch.commit();
      alert('Semua materi hafalan standar berhasil disinkronkan ke database Firestore!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'hafalan_materials');
    } finally {
      setIsSyncingDefaults(false);
    }
  };

  // ===============================================================
  // DIRECT EVALUATION MODAL ACTIONS (Input Nilai Langsung)
  // ===============================================================
  const handleOpenDirectEval = () => {
    const firstStudent = effectiveStudents.find(s => (s.status || 'Aktif') === 'Aktif')?.id || '';
    const firstMat = hafalanMaterials[0]?.id || '';
    setDirectStudentId(firstStudent);
    setDirectMaterialId(firstMat);
    setDirectStars(5);
    setDirectStatus('Mumtaz (Lulus)');
    setDirectSemester('PTS Ganjil');
    setDirectNotes('');
    setShowDirectEvalModal(true);
  };

  const handleSaveDirectEval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directStudentId || !directMaterialId) {
      alert('Silakan pilih santri dan materi hafalan!');
      return;
    }

    setIsSavingDirectEval(true);
    try {
      // Check if existing progress exists
      const existing = hafalanProgress.find(p => p.studentId === directStudentId && p.materialId === directMaterialId);
      const student = studentMap.get(directStudentId);
      const material = materialMap.get(directMaterialId);

      const payload = {
        studentId: directStudentId,
        studentName: student?.name || 'Santri',
        materialId: directMaterialId,
        materialTitle: material?.judul || 'Materi',
        stars: directStars,
        status: directStatus,
        evaluationSemester: directSemester,
        catatanGuru: directNotes.trim(),
        isReadyForTest: false,
        updatedAt: new Date().toISOString(),
        updatedBy: userData?.name || 'Guru'
      };

      if (existing?.id) {
        await updateDoc(doc(db, 'hafalan_progress', existing.id), payload);
      } else {
        await addDoc(collection(db, 'hafalan_progress'), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }

      alert('Penilaian hafalan santri berhasil disimpan!');
      setShowDirectEvalModal(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'hafalan_progress');
    } finally {
      setIsSavingDirectEval(false);
    }
  };

  // ===============================================================
  // RENDER PAGINATION COMPONENT
  // ===============================================================
  const renderPagination = (currentPage: number, totalPages: number, onPageChange: (p: number) => void, totalItems: number, itemsPerPage: number) => {
    if (totalPages <= 1 && totalItems <= itemsPerPage) return null;

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Build page buttons range
    const pageButtons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(i);
    }

    return (
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <strong className="text-slate-800">{startItem} - {endItem}</strong> dari <strong className="text-slate-800">{totalItems}</strong> data
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {/* First Page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Halaman Pertama"
          >
            <ChevronsLeft size={16} />
          </button>

          {/* Prev Page */}
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Page numbers */}
          {pageButtons.map(pageNum => (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`w-9 h-9 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center ${
                currentPage === pageNum
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-200 font-black scale-105'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {pageNum}
            </button>
          ))}

          {/* Next Page */}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Halaman Berikutnya"
          >
            <ChevronRight size={16} />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Halaman Terakhir"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
            Modul & Evaluasi Hafalan Tahfidz
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Kelola materi hafalan (Surat Pendek, Hadist, Doa) dan filter setoran santri yang siap dinilai / sudah dinilai.
          </p>
        </div>

        {/* Action Buttons & Subtab Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {activeSubTab === 'modul' ? (
            <>
              <button
                type="button"
                onClick={handleSyncDefaultsToFirestore}
                disabled={isSyncingDefaults}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Salin materi standar bawaan kurikulum ke Firestore"
              >
                <RotateCcw size={14} className={isSyncingDefaults ? 'animate-spin' : ''} />
                <span>Sinkron Standar</span>
              </button>



              <button
                type="button"
                onClick={handleOpenAddMaterial}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>+ Tambah Materi Hafalan</span>
              </button>
            </>
          ) : (
            <>


              <button
                type="button"
                onClick={handleOpenDirectEval}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-200 transition-all cursor-pointer"
              >
                <Award size={16} />
                <span>+ Input Nilai Hafalan</span>
              </button>
            </>
          )}

          {/* Subtab Toggle */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center shrink-0 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('eval');
                setEvalPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'eval'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award size={14} />
              <span>Setoran & Evaluasi ({filteredSubmissions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('modul');
                setModulPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'modul'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen size={14} />
              <span>Katalog Materi ({hafalanMaterials.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* =============================================================== */}
      {/* SUBTAB 1: SETORAN & EVALUASI HAFALAN */}
      {/* =============================================================== */}
      {activeSubTab === 'eval' && (
        <>
          {/* Quick Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrolling-touch">
            {[
              { id: 'Semua', label: 'Semua Setoran', count: hafalanProgress.length },
              { id: 'Siap Dinilai', label: 'Siap Setoran / Perlu Dinilai', count: readyCount, color: 'text-rose-600 bg-rose-50 border-rose-200' },
              { id: 'Sudah Dinilai', label: 'Sudah Dinilai', count: gradedCount, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
              { id: 'Belum Dinilai', label: 'Belum Dinilai', count: Math.max(0, hafalanProgress.length - gradedCount) }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id as any);
                  setEvalPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border flex items-center gap-2 cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  statusFilter === tab.id ? 'bg-white/20 text-white' : (tab.color || 'bg-slate-100 text-slate-700')
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setEvalPage(1);
                }}
                placeholder="Cari nama santri atau judul materi hafalan..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <Filter size={15} className="text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setEvalPage(1);
                  }}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Semua">Semua Kategori</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Class Filter */}
              <select
                value={classFilter}
                onChange={(e) => {
                  setClassFilter(e.target.value);
                  setEvalPage(1);
                }}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Semua">Semua Kelas</option>
                {classOptions.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>

              {/* Per Page Selector */}
              <select
                value={evalPerPage}
                onChange={(e) => {
                  setEvalPerPage(Number(e.target.value));
                  setEvalPage(1);
                }}
                className="px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
                title="Jumlah per halaman"
              >
                <option value={6}>6 / hal</option>
                <option value={9}>9 / hal</option>
                <option value={18}>18 / hal</option>
                <option value={36}>36 / hal</option>
              </select>
            </div>
          </div>

          {/* Submissions Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedSubmissions.map((p) => {
              const student = studentMap.get(p.studentId);
              const material = materialMap.get(p.materialId);
              const isReady = p.isReadyForTest || p.submissionMethod;
              const isGraded = (p.stars && p.stars > 0) || p.status === 'Mumtaz (Lulus)' || p.status === 'Lancar';

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight ${
                            !isGraded && isReady
                              ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                              : isGraded
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {!isGraded && isReady ? 'Siap Setoran / Dinilai' : p.status || 'Sedang Menghafal'}
                          </span>
                          {p.evaluationSemester && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-100">
                              {p.evaluationSemester}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {student?.name || (p as any).studentName || 'Santri'}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium truncate">
                          Kelas: {student?.kelas || (material?.kelas) || '-'}
                        </p>
                      </div>

                      {/* Stars badge */}
                      <div className="flex items-center gap-0.5 text-amber-400 shrink-0 bg-amber-50 px-2 py-1 rounded-xl border border-amber-100">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={13}
                            fill={(p.stars || 0) >= star ? 'currentColor' : 'none'}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Material Info Card */}
                    <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-amber-950 truncate">
                          {material?.judul || (p as any).materialTitle || 'Materi Hafalan'}
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 uppercase shrink-0">
                          {material?.kategori || 'Tahfidz'}
                        </span>
                      </div>

                      {/* Audio / Video Submissions Preview */}
                      {p.recordingDataUrl && (
                        <div className="pt-1">
                          <audio controls src={p.recordingDataUrl} className="w-full h-8" />
                        </div>
                      )}

                      {p.recordingLink && (
                        <a
                          href={p.recordingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline pt-0.5"
                        >
                          <ExternalLink size={12} />
                          <span>Buka Lampiran Setoran (Drive)</span>
                        </a>
                      )}

                      {p.catatanGuru && (
                        <p className="text-[11px] text-slate-600 italic line-clamp-2">
                          "{p.catatanGuru}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onPromptPrintRapotHafalan(student || { id: p.studentId, name: (p as any).studentName })}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer size={14} />
                      <span>Rapot</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onEvaluateHafalan(p)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-200 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Award size={14} />
                      <span>{isGraded ? 'Ubah Nilai' : 'Beri Nilai'}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredSubmissions.length === 0 && (
              <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
                <Award size={40} className="mx-auto text-slate-300" />
                <h3 className="text-sm font-bold text-slate-700">Tidak ada data setoran hafalan</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {statusFilter !== 'Semua' 
                    ? `Tidak ditemukan santri dengan status "${statusFilter}". Coba ubah filter atau gunakan tombol "+ Input Nilai Hafalan".`
                    : 'Gunakan tombol "+ Input Nilai Hafalan" di atas atau menu "Penilaian Terpadu Kelas" untuk memberi nilai santri.'}
                </p>
                <button
                  type="button"
                  onClick={handleOpenDirectEval}
                  className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Input Nilai Santri Sekarang</span>
                </button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {renderPagination(currentEvalPage, totalEvalPages, setEvalPage, filteredSubmissions.length, evalPerPage)}
        </>
      )}

      {/* =============================================================== */}
      {/* SUBTAB 2: KATALOG MODUL MATERI HAFALAN */}
      {/* =============================================================== */}
      {activeSubTab === 'modul' && (
        <>
          {/* Search and Filters Bar for Modul */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={modulSearchTerm}
                onChange={(e) => {
                  setModulSearchTerm(e.target.value);
                  setModulPage(1);
                }}
                placeholder="Cari judul surat, doa, hadist, atau teks latin..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={modulCategoryFilter}
                onChange={(e) => {
                  setModulCategoryFilter(e.target.value);
                  setModulPage(1);
                }}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Semua">Semua Kategori ({hafalanMaterials.length})</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Class Filter */}
              <select
                value={modulClassFilter}
                onChange={(e) => {
                  setModulClassFilter(e.target.value);
                  setModulPage(1);
                }}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Semua">Semua Kelas</option>
                {classOptions.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>

              {/* Per Page Selector */}
              <select
                value={modulPerPage}
                onChange={(e) => {
                  setModulPerPage(Number(e.target.value));
                  setModulPage(1);
                }}
                className="px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                title="Jumlah per halaman"
              >
                <option value={6}>6 / hal</option>
                <option value={8}>8 / hal</option>
                <option value={16}>16 / hal</option>
                <option value={32}>32 / hal</option>
              </select>
            </div>
          </div>

          {/* Modul Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedMaterials.map((mat) => (
              <div
                key={mat.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase">
                          {mat.kategori || 'Surat Pendek'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                          Kelas: {mat.kelas || 'Semua Kelas'}
                        </span>
                        <span className="text-[10px] font-extrabold text-slate-400">
                          #{mat.urutan || 1}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {mat.judul}
                      </h3>
                    </div>

                    {/* Edit / Delete Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditMaterial(mat)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                        title="Edit materi hafalan"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMaterial(mat)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Hapus materi hafalan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Arabic Text Display */}
                  {mat.arab && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <p className="text-xl font-serif text-slate-900 leading-loose text-right" dir="rtl">
                        {mat.arab}
                      </p>
                      {mat.latin && (
                        <p className="text-xs text-slate-600 font-medium italic pt-1 border-t border-slate-200/60">
                          {mat.latin}
                        </p>
                      )}
                      {mat.terjemahan && (
                        <p className="text-xs text-slate-500">
                          "{mat.terjemahan}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredMaterials.length === 0 && (
              <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
                <BookOpen size={40} className="mx-auto text-slate-300" />
                <h3 className="text-sm font-bold text-slate-700">Tidak ada materi hafalan yang sesuai filter</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Tambahkan materi baru menggunakan tombol "+ Tambah Materi Hafalan" di atas.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddMaterial}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Tambah Materi Sekarang</span>
                </button>
              </div>
            )}
          </div>

          {/* Modul Pagination */}
          {renderPagination(currentModulPage, totalModulPages, setModulPage, filteredMaterials.length, modulPerPage)}
        </>
      )}

      {/* =============================================================== */}
      {/* MODAL 1: TAMBAH / EDIT MATERI HAFALAN */}
      {/* =============================================================== */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-xl w-full rounded-3xl p-5 sm:p-7 shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {editingMaterial ? 'Edit Materi Hafalan' : 'Tambah Materi Hafalan Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMaterialModal(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-4 pt-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Judul Materi Hafalan *
                </label>
                <input
                  type="text"
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  placeholder="Contoh: QS. Al-Balad / Hadits Menuntut Ilmu / Doa Masuk Masjid"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kategori *</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kelas Target</label>
                  <select
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {classOptions.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                    <option value="Semua Kelas">Semua Kelas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Urutan</label>
                  <input
                    type="number"
                    min={1}
                    value={formUrutan}
                    onChange={(e) => setFormUrutan(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Teks Arab (Opsional)
                </label>
                <textarea
                  value={formArab}
                  onChange={(e) => setFormArab(e.target.value)}
                  placeholder="Tuliskan ayat / hadist / doa dalam bahasa Arab..."
                  dir="rtl"
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-serif outline-none focus:ring-2 focus:ring-emerald-500 leading-loose"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Teks Latin / Transliterasi (Opsional)
                </label>
                <textarea
                  value={formLatin}
                  onChange={(e) => setFormLatin(e.target.value)}
                  placeholder="Contoh: Qul huwallahu ahad..."
                  rows={2}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Arti / Terjemahan (Opsional)
                </label>
                <textarea
                  value={formTerjemahan}
                  onChange={(e) => setFormTerjemahan(e.target.value)}
                  placeholder="Artinya: Katakanlah Dialah Allah Yang Maha Esa..."
                  rows={2}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingMaterial}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{isSavingMaterial ? 'Menyimpan...' : 'Simpan Materi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL 2: INPUT NILAI HAFALAN LANGSUNG */}
      {/* =============================================================== */}
      {showDirectEvalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full rounded-3xl p-5 sm:p-7 shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award size={20} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Input Penilaian Hafalan Santri
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectEvalModal(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDirectEval} className="space-y-4 pt-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pilih Santri *</label>
                <select
                  value={directStudentId}
                  onChange={(e) => setDirectStudentId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">-- Pilih Santri --</option>
                  {effectiveStudents.filter(s => (s.status || 'Aktif') === 'Aktif').map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.kelas || '-'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pilih Materi Hafalan *</label>
                <select
                  value={directMaterialId}
                  onChange={(e) => setDirectMaterialId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">-- Pilih Materi --</option>
                  {hafalanMaterials.map(m => (
                    <option key={m.id} value={m.id}>
                      [{m.kategori}] {m.judul} ({m.kelas || 'Semua'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Periode / Semester</label>
                  <select
                    value={directSemester}
                    onChange={(e) => setDirectSemester(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="PTS Ganjil">PTS Ganjil</option>
                    <option value="PAS Ganjil">PAS Ganjil</option>
                    <option value="PTS Genap">PTS Genap</option>
                    <option value="PAS Genap">PAS Genap</option>
                    <option value="Harian">Harian</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status Kelulusan</label>
                  <select
                    value={directStatus}
                    onChange={(e) => setDirectStatus(e.target.value as HafalanStatus)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Mumtaz (Lulus)">Mumtaz (Lulus)</option>
                    <option value="Lancar">Lancar</option>
                    <option value="Sedang Menghafal">Sedang Menghafal</option>
                    <option value="Belum Mulai">Belum Mulai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bintang Penilaian (1 - 5)</label>
                <div className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setDirectStars(star)}
                      className={`p-1 text-2xl transition-transform active:scale-125 cursor-pointer ${
                        directStars >= star ? 'text-amber-400' : 'text-slate-200'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 ml-2">
                    {directStars} Bintang
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Catatan Ustadz/Ustadzah
                </label>
                <textarea
                  value={directNotes}
                  onChange={(e) => setDirectNotes(e.target.value)}
                  placeholder="Contoh: Makhraj huruf sangat fasih, hafalan lancar dan tartil..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDirectEvalModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingDirectEval}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{isSavingDirectEval ? 'Menyimpan...' : 'Simpan Nilai'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

          </div>
  );
}