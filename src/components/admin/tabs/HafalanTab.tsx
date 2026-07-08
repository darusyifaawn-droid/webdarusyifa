import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, orderBy, getDocs, writeBatch, setDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit, Save, X, BookOpen, Search, Filter, RefreshCw, Languages, AlignLeft } from 'lucide-react';
import { staticHafalanMaterials, HafalanMaterial } from '../../../data/hafalanData';
import { handleFirestoreError, OperationType } from '../../../lib/firestoreUtils';

export default function HafalanTab() {
  const [materials, setMaterials] = useState<HafalanMaterial[]>(staticHafalanMaterials);
  const [isUsingStatic, setIsUsingStatic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [filterCategory, setFilterCategory] = useState('Semua');
  
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<HafalanMaterial | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<HafalanMaterial>>({
    kelas: 'Utsman',
    kategori: 'Surat Pendek',
    judul: '',
    arab: '',
    latin: '',
    terjemahan: '',
    urutan: 1
  });

  useEffect(() => {
    // Fetch materials without Firestore ordering to avoid index issues and missing field exclusion
    const q = query(collection(db, 'hafalan_materials'));
    
    // Set a safety timeout for loading state
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
        console.log(`Fetched ${docs.length} hafalan materials`);
        
        // Sort client-side
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

  const handleSyncData = async () => {
    if (!confirm('Pindahkan data hafalan statis ke database? Ini akan menambah data yang belum ada.')) return;
    
    try {
      setLoading(true);
      const batch = writeBatch(db);
      
      // Check existing IDs by fetching fresh copy to be sure
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        await updateDoc(doc(db, 'hafalan_materials', editingMaterial.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        alert('Materi berhasil diperbarui!');
      } else {
        const id = `${formData.kelas?.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
        await setDoc(doc(db, 'hafalan_materials', id), {
          ...formData,
          id,
          createdAt: serverTimestamp()
        });
        alert('Materi berhasil ditambahkan!');
      }
      setShowModal(false);
      setEditingMaterial(null);
      setFormData({
        kelas: 'Utsman',
        kategori: 'Surat Pendek',
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">MANAJEMEN MODUL HAFALAN</h2>
          <p className="text-sm text-gray-500 font-medium">Kelola materi hafalan surat, hadist, dan doa</p>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={handleSyncData}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border ${isUsingStatic ? 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`}
            >
              <RefreshCw size={18} className={isUsingStatic ? 'animate-spin' : ''} /> {isUsingStatic ? 'Klik untuk Sync ke Database' : 'Sync Data Statis'}
            </button>
          <button 
            onClick={() => {
              setEditingMaterial(null);
              setFormData({
                kelas: 'Utsman',
                kategori: 'Surat Pendek',
                judul: '',
                arab: '',
                latin: '',
                terjemahan: '',
                urutan: 1
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-200"
          >
            <Plus size={18} /> Tambah Materi
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari judul materi..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
          />
        </div>
        <select 
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
          className="p-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 shadow-sm font-bold text-gray-600 text-sm"
        >
          <option value="Semua">Semua Kelas</option>
          <option value="Utsman">Utsman</option>
          <option value="Umar Bin Khattab">Umar Bin Khattab</option>
        </select>
        <select 
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="p-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 shadow-sm font-bold text-gray-600 text-sm"
        >
          <option value="Semua">Semua Kategori</option>
          <option value="Surat Pendek">Surat Pendek</option>
          <option value="Hadist">Hadist</option>
          <option value="Doa Sehari-hari">Doa Sehari-hari</option>
          <option value="Bacaan Sholat">Bacaan Sholat</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMaterials.map((m) => (
          <div key={m.id} className="card-3d p-6 group">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center border border-green-100">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 group-hover:text-green-600 transition-colors uppercase tracking-tight">{m.judul}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 uppercase">{m.kelas}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full border border-purple-100 uppercase">{m.kategori}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full border border-gray-100 uppercase">Urutan: {m.urutan}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditingMaterial(m);
                    setFormData(m);
                    setShowModal(true);
                  }}
                  className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(m.id)}
                  className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {m.arab && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-right">
                  <p className="font-amiri text-2xl leading-[2] text-slate-800">{m.arab}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {m.latin && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Languages size={10} /> Transliterasi
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed italic">{m.latin}</p>
                  </div>
                )}
                {m.terjemahan && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <AlignLeft size={10} /> Terjemahan
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">{m.terjemahan}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading && <div className="text-center py-12">Memuat...</div>}
      {!loading && filteredMaterials.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-bold uppercase tracking-widest">Tidak ada materi ditemukan</p>
          {searchTerm || filterKelas !== 'Semua' || filterCategory !== 'Semua' ? (
            <button onClick={() => { setSearchTerm(''); setFilterKelas('Semua'); setFilterCategory('Semua'); }} className="text-green-600 text-sm font-bold mt-2 hover:underline">Reset Filter</button>
          ) : (
             <button onClick={handleSyncData} className="text-blue-600 text-sm font-bold mt-2 hover:underline">Sinkronkan data dari sistem</button>
          )}
        </div>
      )}

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
               <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{editingMaterial ? 'Edit' : 'Tambah'} Materi Hafalan</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Lengkapi data modul di bawah ini</p>
               </div>
               <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 transition-colors text-gray-400"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kelas</label>
                  <select 
                    value={formData.kelas}
                    onChange={(e) => setFormData({...formData, kelas: e.target.value as any})}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700"
                    required
                  >
                    <option value="Utsman">Utsman</option>
                    <option value="Umar Bin Khattab">Umar Bin Khattab</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kategori</label>
                  <select 
                    value={formData.kategori}
                    onChange={(e) => setFormData({...formData, kategori: e.target.value as any})}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700"
                    required
                  >
                    <option value="Surat Pendek">Surat Pendek</option>
                    <option value="Hadist">Hadist</option>
                    <option value="Doa Sehari-hari">Doa Sehari-hari</option>
                    <option value="Bacaan Sholat">Bacaan Sholat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Judul Materi</label>
                  <input 
                    type="text"
                    value={formData.judul}
                    onChange={(e) => setFormData({...formData, judul: e.target.value})}
                    placeholder="Contoh: QS. Al-Kautsar"
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Urutan</label>
                  <input 
                    type="number"
                    value={formData.urutan}
                    onChange={(e) => setFormData({...formData, urutan: parseInt(e.target.value)})}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Teks Arab</label>
                <textarea 
                  value={formData.arab}
                  onChange={(e) => setFormData({...formData, arab: e.target.value})}
                  placeholder="Masukkan teks bahasa Arab..."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-amiri text-xl text-right min-h-[100px] resize-y"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Transliterasi (Latin)</label>
                <textarea 
                  value={formData.latin}
                  onChange={(e) => setFormData({...formData, latin: e.target.value})}
                  placeholder="Masukkan bacaan latin..."
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-green-500 italic text-sm min-h-[80px] resize-y"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Terjemahan (Arti)</label>
                <textarea 
                  value={formData.terjemahan}
                  onChange={(e) => setFormData({...formData, terjemahan: e.target.value})}
                  placeholder="Masukkan arti bahasa Indonesia..."
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm min-h-[80px] resize-y"
                />
              </div>

              <div className="pt-6 flex gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 px-6 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 px-6 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-200"
                >
                  {editingMaterial ? 'Update Materi' : 'Simpan Materi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
