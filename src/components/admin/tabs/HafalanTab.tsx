import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  deleteDoc, 
  doc, 
  updateDoc, 
  getDocs, 
  writeBatch, 
  setDoc 
} from 'firebase/firestore';
import { 
  Plus, 
  Trash2, 
  Edit, 
  BookOpen, 
  Search, 
  Filter, 
  RefreshCw, 
  Languages, 
  AlignLeft, 
  Tag, 
  Edit3, 
  X, 
  Check, 
  FolderPlus,
  Layers
} from 'lucide-react';
import { 
  staticHafalanMaterials, 
  HafalanMaterial, 
  HafalanCategory, 
  DEFAULT_HAFALAN_CATEGORIES 
} from '../../../data/hafalanData';
import { handleFirestoreError, OperationType } from '../../../lib/firestoreUtils';

export default function HafalanTab() {
  const [materials, setMaterials] = useState<HafalanMaterial[]>(staticHafalanMaterials);
  const [isUsingStatic, setIsUsingStatic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [filterCategory, setFilterCategory] = useState('Semua');
  
  // Custom categories state & modal
  const [customCategories, setCustomCategories] = useState<HafalanCategory[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HafalanCategory | null>(null);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [categoryDescInput, setCategoryDescInput] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Material Modal (Tambah / Edit Materi)
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<HafalanMaterial | null>(null);
  const [isCustomCategoryInput, setIsCustomCategoryInput] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  
  // Form State for Material
  const [formData, setFormData] = useState<Partial<HafalanMaterial>>({
    kelas: 'Utsman',
    kategori: 'Surat Pendek',
    judul: '',
    arab: '',
    latin: '',
    terjemahan: '',
    urutan: 1
  });

  // Listen to custom categories from Firestore
  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, 'hafalan_categories'), (snap) => {
      setCustomCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as HafalanCategory)));
    }, (error) => {
      console.error("Error fetching hafalan categories:", error);
    });
    return () => unsubCats();
  }, []);

  // Fetch materials
  useEffect(() => {
    const q = query(collection(db, 'hafalan_materials'));
    
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      clearTimeout(timeoutId);
      if (snapshot.empty) {
        setMaterials(staticHafalanMaterials);
        setIsUsingStatic(true);
      } else {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HafalanMaterial));
        const sortedDocs = [...docs].sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
        setMaterials(sortedDocs);
        setIsUsingStatic(false);
      }
      setLoading(false);
    }, (error) => {
      clearTimeout(timeoutId);
      console.error("Error fetching hafalan materials:", error);
      handleFirestoreError(error, OperationType.LIST, 'hafalan_materials');
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  // Combined distinct categories list
  const allCategories = useMemo(() => {
    const customNames = customCategories.map(c => c.name?.trim()).filter(Boolean);
    const materialCats = materials.map(m => m.kategori?.trim()).filter(Boolean);
    return Array.from(new Set([...DEFAULT_HAFALAN_CATEGORIES, ...customNames, ...materialCats]));
  }, [customCategories, materials]);

  const handleSyncData = async () => {
    if (!confirm('Pindahkan data hafalan statis ke database? Ini akan menambah data yang belum ada.')) return;
    
    try {
      setLoading(true);
      const batch = writeBatch(db);
      const snap = await getDocs(collection(db, 'hafalan_materials'));
      const existingIds = snap.docs.map(doc => doc.id);
      
      let count = 0;
      for (const m of staticHafalanMaterials) {
        if (!existingIds.includes(m.id)) {
          const newDocRef = doc(collection(db, 'hafalan_materials'), m.id);
          batch.set(newDocRef, {
            ...m,
            createdAt: serverTimestamp()
          });
          count++;
        }
      }
      
      if (count > 0) {
        await batch.commit();
        alert(`Berhasil menyinkronkan ${count} materi ke database!`);
      } else {
        alert('Semua data statis sudah ada di database.');
      }
    } catch (error) {
      console.error("Sync error:", error);
      handleFirestoreError(error, OperationType.CREATE, 'hafalan_materials_sync');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================================
  // CATEGORY MANAGEMENT ACTIONS
  // ===============================================================
  const handleOpenCategoryManager = () => {
    setEditingCategory(null);
    setCategoryNameInput('');
    setCategoryDescInput('');
    setShowCategoryModal(true);
  };

  const handleStartEditCategory = (cat: HafalanCategory) => {
    setEditingCategory(cat);
    setCategoryNameInput(cat.name);
    setCategoryDescInput(cat.description || '');
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setCategoryNameInput('');
    setCategoryDescInput('');
  };

  const handleSaveCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = categoryNameInput.trim();
    if (!trimmed) {
      alert('Nama kategori hafalan wajib diisi!');
      return;
    }

    setIsSavingCategory(true);
    try {
      if (editingCategory?.id) {
        const oldName = editingCategory.name;
        // Update category document
        await setDoc(doc(db, 'hafalan_categories', editingCategory.id), {
          name: trimmed,
          description: categoryDescInput.trim(),
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Update materials if name changed
        if (oldName !== trimmed) {
          const matsToUpdate = materials.filter(m => m.kategori === oldName);
          if (matsToUpdate.length > 0) {
            const batch = writeBatch(db);
            matsToUpdate.forEach(m => {
              batch.update(doc(db, 'hafalan_materials', m.id), {
                kategori: trimmed,
                updatedAt: serverTimestamp()
              });
            });
            await batch.commit();
          }
        }
        alert(`Kategori "${trimmed}" berhasil diperbarui!`);
      } else {
        // Check duplicate
        const isDuplicate = allCategories.some(c => c.toLowerCase() === trimmed.toLowerCase());
        if (isDuplicate) {
          alert(`Kategori "${trimmed}" sudah terdaftar!`);
          setIsSavingCategory(false);
          return;
        }

        await addDoc(collection(db, 'hafalan_categories'), {
          name: trimmed,
          description: categoryDescInput.trim(),
          createdAt: serverTimestamp(),
          isDefault: false
        });
        alert(`Kategori "${trimmed}" berhasil ditambahkan!`);
      }

      setEditingCategory(null);
      setCategoryNameInput('');
      setCategoryDescInput('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'hafalan_categories');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (catName: string, catDocId?: string) => {
    const usageCount = materials.filter(m => m.kategori === catName).length;
    let confirmMsg = `Hapus kategori hafalan "${catName}"?`;
    if (usageCount > 0) {
      confirmMsg = `PERINGATAN: Kategori "${catName}" saat ini digunakan pada ${usageCount} materi hafalan.\n\nApakah Anda tetap ingin menghapus kategori ini?`;
    }
    if (!confirm(confirmMsg)) return;

    setIsDeletingCategory(true);
    try {
      if (catDocId) {
        await deleteDoc(doc(db, 'hafalan_categories', catDocId));
      } else {
        const matchingDoc = customCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
        if (matchingDoc?.id) {
          await deleteDoc(doc(db, 'hafalan_categories', matchingDoc.id));
        }
      }
      alert(`Kategori "${catName}" berhasil dihapus.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `hafalan_categories/${catName}`);
    } finally {
      setIsDeletingCategory(false);
    }
  };

  // ===============================================================
  // MATERIAL FORM ACTIONS
  // ===============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Determine final category
      let finalCategory = formData.kategori || 'Surat Pendek';
      if (isCustomCategoryInput || formData.kategori === '__NEW__') {
        const customTrimmed = customCategoryName.trim();
        if (!customTrimmed) {
          alert('Silakan masukkan nama kategori baru!');
          return;
        }
        finalCategory = customTrimmed;

        // Auto-save category to Firestore if not present
        const exists = allCategories.some(c => c.toLowerCase() === customTrimmed.toLowerCase());
        if (!exists) {
          try {
            await addDoc(collection(db, 'hafalan_categories'), {
              name: customTrimmed,
              createdAt: serverTimestamp(),
              isDefault: false
            });
          } catch (cErr) {
            console.error("Auto add category failed:", cErr);
          }
        }
      }

      const payload = {
        ...formData,
        kategori: finalCategory
      };

      if (editingMaterial) {
        await updateDoc(doc(db, 'hafalan_materials', editingMaterial.id), {
          ...payload,
          updatedAt: serverTimestamp()
        });
        alert('Materi hafalan berhasil diperbarui!');
      } else {
        const id = `${formData.kelas?.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
        await setDoc(doc(db, 'hafalan_materials', id), {
          ...payload,
          id,
          createdAt: serverTimestamp()
        });
        alert('Materi hafalan baru berhasil ditambahkan!');
      }

      setShowModal(false);
      setEditingMaterial(null);
      setIsCustomCategoryInput(false);
      setCustomCategoryName('');
      setFormData({
        kelas: 'Utsman',
        kategori: allCategories[0] || 'Surat Pendek',
        judul: '',
        arab: '',
        latin: '',
        terjemahan: '',
        urutan: 1
      });
    } catch (error) {
      handleFirestoreError(error, editingMaterial ? OperationType.UPDATE : OperationType.CREATE, 'hafalan_materials');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus materi hafalan ini?')) return;
    try {
      await deleteDoc(doc(db, 'hafalan_materials', id));
      alert('Materi berhasil dihapus!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `hafalan_materials/${id}`);
    }
  };

  const filteredMaterials = materials.filter(m => {
    const searchStr = (searchTerm || '').toLowerCase();
    const judulMatch = (m.judul || '').toLowerCase().includes(searchStr);
    const matchKelas = filterKelas === 'Semua' || m.kelas === filterKelas;
    const matchCategory = filterCategory === 'Semua' || m.kategori === filterCategory;
    return judulMatch && matchKelas && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">MANAJEMEN MODUL HAFALAN</h2>
          <p className="text-sm text-gray-500 font-medium">Kelola materi hafalan surat, hadist, doa, dan kategori modul</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Kelola Kategori Button */}
          <button 
            type="button"
            onClick={handleOpenCategoryManager}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer"
            title="Kelola kategori materi hafalan (tambah, edit, dan hapus)"
          >
            <Tag size={16} className="text-indigo-600" />
            <span>Kelola Kategori ({allCategories.length})</span>
          </button>

          {/* Sync Data Button */}
          <button 
            type="button"
            onClick={handleSyncData}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
              isUsingStatic ? 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'
            }`}
          >
            <RefreshCw size={15} className={isUsingStatic ? 'animate-spin' : ''} /> 
            <span>{isUsingStatic ? 'Sync ke Database' : 'Sync Data Statis'}</span>
          </button>

          {/* Tambah Materi Button */}
          <button 
            type="button"
            onClick={() => {
              setEditingMaterial(null);
              setIsCustomCategoryInput(false);
              setCustomCategoryName('');
              setFormData({
                kelas: 'Utsman',
                kategori: allCategories[0] || 'Surat Pendek',
                judul: '',
                arab: '',
                latin: '',
                terjemahan: '',
                urutan: materials.length + 1
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-green-200 cursor-pointer"
          >
            <Plus size={16} /> 
            <span>+ Tambah Materi</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari judul materi hafalan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
        </div>
        <select 
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
          className="p-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 text-xs"
        >
          <option value="Semua">Semua Kelas</option>
          <option value="Utsman">Utsman</option>
          <option value="Umar Bin Khattab">Umar Bin Khattab</option>
        </select>
        <select 
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="p-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 text-xs"
        >
          <option value="Semua">Semua Kategori ({allCategories.length})</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Materials List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMaterials.map((m) => (
          <div key={m.id} className="card-3d p-6 group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center border border-green-100 shrink-0">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 group-hover:text-green-600 transition-colors uppercase tracking-tight">{m.judul}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 uppercase">{m.kelas}</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-100 uppercase">{m.kategori}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full border border-gray-200 uppercase">Urutan: {m.urutan}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button 
                  onClick={() => {
                    setEditingMaterial(m);
                    setFormData(m);
                    setIsCustomCategoryInput(false);
                    setCustomCategoryName('');
                    setShowModal(true);
                  }}
                  className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                  title="Edit materi hafalan"
                >
                  <Edit size={17} />
                </button>
                <button 
                  onClick={() => handleDelete(m.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                  title="Hapus materi hafalan"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {m.arab && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-right">
                  <p className="font-amiri text-2xl leading-[2] text-slate-800 ">{m.arab}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {m.latin && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Languages size={11} /> Transliterasi
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed italic">{m.latin}</p>
                  </div>
                )}
                {m.terjemahan && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <AlignLeft size={11} /> Terjemahan
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">{m.terjemahan}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading && <div className="text-center py-12 font-bold text-gray-500">Memuat materi hafalan...</div>}
      
      {!loading && filteredMaterials.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Tidak ada materi ditemukan</p>
          {searchTerm || filterKelas !== 'Semua' || filterCategory !== 'Semua' ? (
            <button 
              onClick={() => { setSearchTerm(''); setFilterKelas('Semua'); setFilterCategory('Semua'); }} 
              className="text-green-600 text-xs font-bold mt-2 hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          ) : (
            <button 
              onClick={handleSyncData} 
              className="text-blue-600 text-xs font-bold mt-2 hover:underline cursor-pointer"
            >
              Sinkronkan data dari sistem
            </button>
          )}
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL 1: TAMBAH / EDIT MATERI HAFALAN */}
      {/* =============================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-7 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                  {editingMaterial ? 'Edit Materi Hafalan' : 'Tambah Materi Hafalan'}
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                  Lengkapi data modul di bawah ini
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)} 
                className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 transition-colors text-gray-400 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-7 overflow-y-auto space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kelas */}
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Kelas *</label>
                  <select 
                    value={formData.kelas}
                    onChange={(e) => setFormData({...formData, kelas: e.target.value as any})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 text-xs"
                    required
                  >
                    <option value="Utsman">Utsman</option>
                    <option value="Umar Bin Khattab">Umar Bin Khattab</option>
                  </select>
                </div>

                {/* Kategori with Inline Add & Kelola Link */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider">Kategori *</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategoryInput(!isCustomCategoryInput);
                          if (!isCustomCategoryInput) {
                            setCustomCategoryName('');
                            setFormData({...formData, kategori: '__NEW__'});
                          } else {
                            setFormData({...formData, kategori: allCategories[0] || 'Surat Pendek'});
                          }
                        }}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                      >
                        {isCustomCategoryInput ? '← Pilih Dari List' : '+ Kategori Baru'}
                      </button>
                    </div>
                  </div>

                  {!isCustomCategoryInput && formData.kategori !== '__NEW__' ? (
                    <div className="space-y-1">
                      <select 
                        value={formData.kategori}
                        onChange={(e) => {
                          if (e.target.value === '__NEW__') {
                            setIsCustomCategoryInput(true);
                            setFormData({...formData, kategori: '__NEW__'});
                            setCustomCategoryName('');
                          } else {
                            setFormData({...formData, kategori: e.target.value as any});
                            setIsCustomCategoryInput(false);
                          }
                        }}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 text-xs"
                        required
                      >
                        {allCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="__NEW__">➕ + Tambah Kategori Baru Manual...</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1 animate-in fade-in duration-150">
                      <div className="relative">
                        <input
                          type="text"
                          value={customCategoryName}
                          onChange={(e) => setCustomCategoryName(e.target.value)}
                          placeholder="Ketik nama kategori baru..."
                          className="w-full p-2.5 pr-8 bg-emerald-50/60 border-2 border-emerald-400 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-900"
                          autoFocus
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomCategoryInput(false);
                            setFormData({...formData, kategori: allCategories[0] || 'Surat Pendek'});
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[10px] text-emerald-700 font-medium">
                        * Kategori baru akan otomatis ditambahkan ke database kategori admin.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Judul & Urutan */}
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Judul Materi *</label>
                  <input 
                    type="text" 
                    value={formData.judul}
                    onChange={(e) => setFormData({...formData, judul: e.target.value})}
                    placeholder="Contoh: QS. Al-Kautsar"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Urutan</label>
                  <input 
                    type="number" 
                    value={formData.urutan}
                    onChange={(e) => setFormData({...formData, urutan: parseInt(e.target.value) || 1})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-xs"
                    required
                  />
                </div>
              </div>

              {/* Teks Arab */}
              <div>
                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Teks Arab</label>
                <textarea 
                  value={formData.arab}
                  onChange={(e) => setFormData({...formData, arab: e.target.value})}
                  placeholder="Masukkan teks bahasa Arab..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-amiri text-xl text-right min-h-[100px] resize-y"
                />
              </div>

              {/* Transliterasi */}
              <div>
                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Transliterasi (Latin)</label>
                <textarea 
                  value={formData.latin}
                  onChange={(e) => setFormData({...formData, latin: e.target.value})}
                  placeholder="Masukkan bacaan latin..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 italic text-xs min-h-[70px] resize-y"
                />
              </div>

              {/* Terjemahan */}
              <div>
                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Terjemahan (Arti)</label>
                <textarea 
                  value={formData.terjemahan}
                  onChange={(e) => setFormData({...formData, terjemahan: e.target.value})}
                  placeholder="Masukkan arti bahasa Indonesia..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-xs min-h-[70px] resize-y"
                />
              </div>

              <div className="pt-4 flex gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-5 bg-gray-100 text-gray-600 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-gray-200 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-3 px-5 bg-green-600 text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-green-700 transition-all shadow-md shadow-green-200 cursor-pointer"
                >
                  {editingMaterial ? 'Simpan Perubahan' : 'Simpan Materi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL 2: KELOLA KATEGORI HAFALAN (ADMIN ONLY) */}
      {/* =============================================================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Tag size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                    Kelola Kategori Hafalan
                  </h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                    Tambah, edit nama, atau hapus kategori materi
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Form Tambah / Edit Kategori */}
              <form onSubmit={handleSaveCategory} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    {editingCategory ? <Edit3 size={14} className="text-indigo-600" /> : <FolderPlus size={14} className="text-emerald-600" />}
                    {editingCategory ? `Edit Kategori: "${editingCategory.name}"` : 'Tambah Kategori Baru'}
                  </span>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={handleCancelEditCategory}
                      className="text-[11px] font-bold text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nama Kategori *</label>
                  <input
                    type="text"
                    value={categoryNameInput}
                    onChange={(e) => setCategoryNameInput(e.target.value)}
                    placeholder="Contoh: Mahfudzot, Tahfidz Juz 30, Doa Khusus..."
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Keterangan / Deskripsi (Opsional)</label>
                  <input
                    type="text"
                    value={categoryDescInput}
                    onChange={(e) => setCategoryDescInput(e.target.value)}
                    placeholder="Keterangan singkat kategori materi ini..."
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={handleCancelEditCategory}
                      className="px-3.5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSavingCategory}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSavingCategory ? (
                      <span>Menyimpan...</span>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>{editingCategory ? 'Update Kategori' : 'Simpan Kategori'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* List Semua Kategori */}
              <div>
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Layers size={14} className="text-indigo-500" />
                  Daftar Kategori Terdaftar ({allCategories.length})
                </h4>

                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white">
                  {allCategories.map((catName) => {
                    const customDoc = customCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
                    const isDefault = (DEFAULT_HAFALAN_CATEGORIES as readonly string[]).includes(catName);
                    const usageCount = materials.filter(m => m.kategori === catName).length;

                    return (
                      <div key={catName} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                            🏷️
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-xs">{catName}</span>
                              {isDefault ? (
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                                  Default
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                                  Kustom
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {customDoc?.description || (isDefault ? 'Kategori bawaan kurikulum' : 'Kategori kustom admin')} • {usageCount} materi terkait
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (customDoc) {
                                handleStartEditCategory(customDoc);
                              } else {
                                handleStartEditCategory({
                                  name: catName,
                                  description: isDefault ? 'Kategori bawaan sistem' : ''
                                });
                              }
                            }}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="Edit nama kategori"
                          >
                            <Edit3 size={15} />
                          </button>
                          
                          <button
                            type="button"
                            disabled={isDeletingCategory}
                            onClick={() => handleDeleteCategory(catName, customDoc?.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                            title="Hapus kategori"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-gray-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
