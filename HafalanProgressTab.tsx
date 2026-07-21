import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Trash2, Edit, User, BookOpen, Search, Filter, Calendar, Star, CheckCircle, X, Save } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../../lib/firestoreUtils';
import { StudentHafalanProgress, HafalanStatus } from '../../../data/hafalanData';

export default function HafalanProgressTab() {
  const [progress, setProgress] = useState<StudentHafalanProgress[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterSemester, setFilterSemester] = useState('Semua');
  
  const [editingRecord, setEditingRecord] = useState<StudentHafalanProgress | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    status: 'Sedang Menghafal' as HafalanStatus,
    stars: 0,
    catatanGuru: '',
    evaluationSemester: 'PTS Ganjil'
  });

  useEffect(() => {
    const unsubProgress = onSnapshot(collection(db, 'hafalan_progress'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentHafalanProgress));
      setProgress(docs.sort((a, b) => (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) - (a.updatedAt ? new Date(a.updatedAt).getTime() : 0)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'hafalan_progress');
      setLoading(false);
    });

    const unsubMaterials = onSnapshot(collection(db, 'hafalan_materials'), (snapshot) => {
      setMaterials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubStudents = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubProgress();
      unsubMaterials();
      unsubStudents();
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data setoran ini? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      await deleteDoc(doc(db, 'hafalan_progress', id));
      alert('Data berhasil dihapus!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `hafalan_progress/${id}`);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    try {
      await updateDoc(doc(db, 'hafalan_progress', editingRecord.id), {
        ...editFormData,
        updatedAt: new Date().toISOString()
      });
      setShowEditModal(false);
      setEditingRecord(null);
      alert('Data berhasil diperbarui!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `hafalan_progress/${editingRecord.id}`);
    }
  };

  const filteredProgress = progress.filter(p => {
    const student = students.find(s => s.id === p.studentId);
    const material = materials.find(m => m.id === p.materialId);
    
    const searchStr = searchTerm.toLowerCase();
    const matchSearch = 
      (student?.name || '').toLowerCase().includes(searchStr) ||
      (material?.judul || '').toLowerCase().includes(searchStr);
    
    const matchKelas = filterKelas === 'Semua' || student?.kelas === filterKelas;
    const matchStatus = filterStatus === 'Semua' || p.status === filterStatus;
    const matchSemester = filterSemester === 'Semua' || p.evaluationSemester === filterSemester;
    
    return matchSearch && matchKelas && matchStatus && matchSemester;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Manajemen Setoran Hafalan</h2>
          <p className="text-sm text-gray-500 font-medium">Monitoring dan kelola progres hafalan seluruh siswa</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari nama siswa atau judul materi..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
        <select 
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
          className="p-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold text-gray-600 text-sm"
        >
          <option value="Semua">Semua Kelas</option>
          <option value="Utsman">Utsman</option>
          <option value="Umar Bin Khattab">Umar Bin Khattab</option>
        </select>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold text-gray-600 text-sm"
        >
          <option value="Semua">Semua Status</option>
          <option value="Sedang Menghafal">Sedang Menghafal</option>
          <option value="Lancar">Lancar</option>
          <option value="Mumtaz (Lulus)">Mumtaz (Lulus)</option>
        </select>
        <select 
          value={filterSemester}
          onChange={(e) => setFilterSemester(e.target.value)}
          className="p-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold text-gray-600 text-sm"
        >
          <option value="Semua">Semua Semester</option>
          <option value="PTS Ganjil">PTS Ganjil</option>
          <option value="PAS Ganjil">PAS Ganjil</option>
          <option value="PTS Genap">PTS Genap</option>
          <option value="PAS Genap">PAS Genap</option>
        </select>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Siswa</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Materi</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nilai</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Waktu</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProgress.map((p) => {
                const student = students.find(s => s.id === p.studentId);
                const material = materials.find(m => m.id === p.materialId);
                
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden">
                          {student?.photoURL ? <img src={student.photoURL} className="w-full h-full object-cover" /> : <User size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{student?.name || 'Siswa tidak ditemukan'}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{student?.kelas}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-blue-500" />
                        <div>
                          <p className="text-sm font-bold text-gray-700">{material?.judul || 'Materi tidak ditemukan'}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{material?.kategori}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        p.status === 'Mumtaz (Lulus)' ? 'bg-green-50 text-green-600 border border-green-100' :
                        p.status === 'Lancar' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        'bg-yellow-50 text-yellow-600 border border-yellow-100'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-black">{p.stars}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-500 font-medium">
                        {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingRecord(p);
                            setEditFormData({
                              status: p.status,
                              stars: p.stars,
                              catatanGuru: p.catatanGuru || '',
                              evaluationSemester: p.evaluationSemester || 'PTS Ganjil'
                            });
                            setShowEditModal(true);
                          }}
                          className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProgress.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-gray-400 font-bold uppercase tracking-widest">Tidak ada data setoran ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Edit Progres Hafalan</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Ubah status atau nilai setoran</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 transition-colors text-gray-400">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
                <select 
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({...editFormData, status: e.target.value as HafalanStatus})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                >
                  <option value="Sedang Menghafal">Sedang Menghafal</option>
                  <option value="Lancar">Lancar</option>
                  <option value="Mumtaz (Lulus)">Mumtaz (Lulus)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Penilaian Bintang</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      type="button"
                      onClick={() => setEditFormData({...editFormData, stars: star})}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        editFormData.stars >= star ? 'bg-yellow-100 text-yellow-500' : 'bg-gray-50 text-gray-300'
                      }`}
                    >
                      <Star size={24} fill={editFormData.stars >= star ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Catatan Guru</label>
                <textarea 
                  value={editFormData.catatanGuru}
                  onChange={(e) => setEditFormData({...editFormData, catatanGuru: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[100px]"
                  placeholder="Masukkan catatan evaluasi..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Periode Semester</label>
                <select 
                  value={editFormData.evaluationSemester}
                  onChange={(e) => setEditFormData({...editFormData, evaluationSemester: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                >
                  <option value="PTS Ganjil">PTS Ganjil</option>
                  <option value="PAS Ganjil">PAS Ganjil</option>
                  <option value="PTS Genap">PTS Genap</option>
                  <option value="PAS Genap">PAS Genap</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
