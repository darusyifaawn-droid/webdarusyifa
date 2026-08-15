import React, { useState, useEffect } from 'react';
import { Search, X, Users, CreditCard, Calendar, PlusCircle, Check, CheckCircle2, Sparkles, ArrowRight, Tag, Coins } from 'lucide-react';

interface FinancePenetapanTabProps {
  allUsers: any[];
  financeIuranStudentIds: string[];
  setFinanceIuranStudentIds: React.Dispatch<React.SetStateAction<string[]>>;
  filterFinanceKelas: string;
  setFilterFinanceKelas: (val: string) => void;
  schoolClasses: any[];
  financeIuranName: string;
  setFinanceIuranName: (val: string) => void;
  financeAmount: string;
  setFinanceAmount: (val: string) => void;
  financeDueDate: string;
  setFinanceDueDate: (val: string) => void;
  selectedCategoryId: string;
  setSelectedCategoryId: (val: string) => void;
  iuranCategories: any[];
  handleAddIuran: (e: any) => Promise<void>;
  setShowIuranCategoryModal: (val: boolean) => void;
}

export default function FinancePenetapanTab({
  allUsers,
  financeIuranStudentIds,
  setFinanceIuranStudentIds,
  filterFinanceKelas,
  setFilterFinanceKelas,
  schoolClasses,
  financeIuranName,
  setFinanceIuranName,
  financeAmount,
  setFinanceAmount,
  financeDueDate,
  setFinanceDueDate,
  selectedCategoryId,
  setSelectedCategoryId,
  iuranCategories,
  handleAddIuran,
  setShowIuranCategoryModal
}: FinancePenetapanTabProps) {
  const [searchStudent, setSearchStudent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const students = allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif');
  
  const filteredStudents = students.filter(s => {
    const matchClass = !filterFinanceKelas || s.kelas === filterFinanceKelas;
    if (!matchClass) return false;
    if (!searchStudent.trim()) return true;
    const q = searchStudent.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) || (s.nisn || '').toLowerCase().includes(q);
  });

  // Handle category selection and auto-populate name and nominal
  const handleCategorySelect = (catId: string) => {
    setSelectedCategoryId(catId);
    const cat = iuranCategories.find((c: any) => c.id === catId);
    if (cat) {
      // Auto-set nama iuran
      setFinanceIuranName(cat.name || '');
      // Auto-set nominal iuran
      const nominal = cat.amount !== undefined && cat.amount !== null 
        ? String(cat.amount) 
        : (cat.nominal !== undefined && cat.nominal !== null ? String(cat.nominal) : '');
      setFinanceAmount(nominal);
    }
  };

  // If a category was already selected or only 1 category exists and fields are empty, sync them
  useEffect(() => {
    if (selectedCategoryId && (!financeIuranName || !financeAmount)) {
      const cat = iuranCategories.find((c: any) => c.id === selectedCategoryId);
      if (cat) {
        if (!financeIuranName && cat.name) setFinanceIuranName(cat.name);
        if (!financeAmount && (cat.amount || cat.nominal)) {
          setFinanceAmount(String(cat.amount || cat.nominal));
        }
      }
    }
  }, [selectedCategoryId, iuranCategories]);

  const selectedCategoryObj = iuranCategories.find((c: any) => c.id === selectedCategoryId);
  const totalAmountCalc = (Number(financeAmount) || 0) * financeIuranStudentIds.length;

  const handleSubmit = async (e: React.FormEvent) => {
    setIsSubmitting(true);
    try {
      await handleAddIuran(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 text-left animate-in fade-in duration-300">
      {/* Kolom Kiri: Pemilihan Target Siswa */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xs overflow-hidden transition-all">
          {/* Header Card Pemilihan Siswa */}
          <div className="p-6 sm:p-8 border-b border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 border border-indigo-100">
                  <Users size={12} />
                  <span>Pilih Target Penerima Tagihan</span>
                </div>
                <h3 className="font-black text-slate-900 tracking-tight text-xl sm:text-2xl">
                  Daftar Siswa Aktif
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Centang siswa yang akan dikenakan tagihan iuran berikut
                </p>
              </div>

              {/* Action Buttons: Pilih Semua / Batalkan */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <button 
                  type="button"
                  onClick={() => {
                    const ids = filteredStudents.map(s => s.id);
                    setFinanceIuranStudentIds(Array.from(new Set([...financeIuranStudentIds, ...ids])));
                  }}
                  className="text-[11px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-2.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  Pilih Semua ({filteredStudents.length})
                </button>
                {financeIuranStudentIds.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => setFinanceIuranStudentIds([])}
                    className="text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-3.5 py-2.5 rounded-xl hover:bg-slate-200 transition-all active:scale-95 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Filter Bar: Cari Siswa & Pilih Kelas */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  placeholder="Cari nama siswa atau NISN..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                {searchStudent && (
                  <button onClick={() => setSearchStudent('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>

              <select 
                value={filterFinanceKelas}
                onChange={(e) => setFilterFinanceKelas(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200/80 text-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">Semua Kelas ({students.length} Siswa)</option>
                {schoolClasses.map((c: any) => (
                  <option key={c.id} value={c.name}>Kelas {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* List Grid Siswa */}
          <div className="p-4 sm:p-6 max-h-[560px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3.5 custom-scrollbar">
            {filteredStudents.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 space-y-2">
                <Users size={32} className="mx-auto opacity-30" />
                <p className="text-xs font-bold">Tidak ada siswa yang sesuai filter pencarian</p>
              </div>
            ) : (
              filteredStudents.map(student => {
                const isSelected = financeIuranStudentIds.includes(student.id);
                return (
                  <div 
                    key={student.id} 
                    onClick={() => {
                      if (isSelected) {
                        setFinanceIuranStudentIds(prev => prev.filter(id => id !== student.id));
                      } else {
                        setFinanceIuranStudentIds(prev => [...prev, student.id]);
                      }
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between select-none ${
                      isSelected 
                        ? 'bg-indigo-50/90 border-indigo-500 shadow-sm shadow-indigo-100/50' 
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                        isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {student.name?.charAt(0) || 'S'}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-black text-xs sm:text-sm truncate uppercase tracking-tight ${
                          isSelected ? 'text-indigo-950' : 'text-slate-800'
                        }`}>
                          {student.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {student.kelas || 'RA'}
                          </span>
                          {student.nisn && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              • {student.nisn}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs' 
                        : 'border-slate-200 bg-slate-50'
                    }`}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Card Siswa */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Menampilkan {filteredStudents.length} siswa</span>
            <span className="text-indigo-600 font-black">{financeIuranStudentIds.length} siswa terpilih</span>
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Konfigurasi Tagihan (Auto-Filled) */}
      <div className="lg:col-span-1">
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden sticky top-8 border border-indigo-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider mb-2 border border-white/10 text-indigo-300">
                <Coins size={12} />
                <span>Formulir Tagihan</span>
              </div>
              <h4 className="text-2xl font-black tracking-tight text-white">Konfigurasi Tagihan</h4>
              <p className="text-xs text-indigo-200/70 mt-1 font-medium">
                Pilih kategori iuran untuk mengisi nama &amp; nominal otomatis
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. KATEGORI IURAN (Main Selector) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Tag size={12} />
                    <span>Kategori Iuran *</span>
                  </label>
                  <button 
                    type="button"
                    onClick={() => setShowIuranCategoryModal(true)}
                    className="text-[10px] font-bold text-indigo-300 hover:text-white underline cursor-pointer flex items-center gap-1"
                    title="Tambah atau kelola kategori iuran"
                  >
                    <PlusCircle size={12} />
                    <span>Kelola Kategori</span>
                  </button>
                </div>
                
                <div className="relative">
                  <select 
                    value={selectedCategoryId}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                    className="w-full bg-white/10 border border-white/15 rounded-2xl px-4 py-3.5 text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 transition-all appearance-none cursor-pointer text-white"
                    required
                  >
                    <option value="" className="text-slate-900 bg-white">-- Pilih Kategori Iuran --</option>
                    {iuranCategories.map((cat: any) => (
                      <option key={cat.id} value={cat.id} className="text-slate-900 bg-white">
                        {cat.name} {cat.amount ? `— Rp ${Number(cat.amount).toLocaleString('id-ID')}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCategoryObj && (
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-300 font-medium">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span>Grup: <strong>{selectedCategoryObj.name}</strong></span>
                    {selectedCategoryObj.amount ? (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md font-bold text-[10px] border border-emerald-500/30">
                        Rp {Number(selectedCategoryObj.amount).toLocaleString('id-ID')}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              {/* 2. NAMA IURAN (Auto-filled from Category) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                    Nama / Keterangan Iuran *
                  </label>
                  {selectedCategoryObj && (
                    <span className="text-[9px] font-bold text-indigo-200/80 bg-white/10 px-2 py-0.5 rounded-full">
                      Otomatis
                    </span>
                  )}
                </div>
                <input 
                  type="text" 
                  value={financeIuranName}
                  onChange={(e) => setFinanceIuranName(e.target.value)}
                  placeholder="Misal: SPP Bulan Agustus 2026"
                  className="w-full bg-white/10 border border-white/15 rounded-2xl px-4 py-3.5 text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 placeholder:text-white/30 transition-all text-white"
                  required
                />
              </div>

              {/* 3. NOMINAL & JATUH TEMPO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                      Nominal (Rp) *
                    </label>
                    {selectedCategoryObj && (
                      <span className="text-[9px] font-bold text-indigo-200/80 bg-white/10 px-1.5 py-0.5 rounded-full">
                        Otomatis
                      </span>
                    )}
                  </div>
                  <input 
                    type="number" 
                    value={financeAmount}
                    onChange={(e) => setFinanceAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full bg-white/10 border border-white/15 rounded-2xl px-4 py-3.5 text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 placeholder:text-white/30 text-white transition-all"
                    required
                  />
                  {financeAmount && Number(financeAmount) > 0 && (
                    <p className="text-[10px] text-indigo-300 font-semibold truncate">
                      Rp {Number(financeAmount).toLocaleString('id-ID')} / siswa
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                    Jatuh Tempo (Opsional)
                  </label>
                  <input 
                    type="date" 
                    value={financeDueDate}
                    onChange={(e) => setFinanceDueDate(e.target.value)}
                    className="w-full bg-white/10 border border-white/15 rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 text-white transition-all"
                  />
                </div>
              </div>

              {/* 4. KALKULASI TARGET & SUMMARY */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Target Siswa:</span>
                  <span className="text-base font-black text-white">
                    {financeIuranStudentIds.length} <span className="text-xs text-indigo-300 font-bold">Siswa</span>
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Total Tagihan:</span>
                  <span className="text-sm sm:text-base font-black text-emerald-400">
                    Rp {totalAmountCalc.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* 5. TOMBOL PUBLISH TAGIHAN */}
              <button 
                type="submit"
                disabled={financeIuranStudentIds.length === 0 || isSubmitting}
                className="w-full bg-white text-indigo-950 py-4 sm:py-4.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-indigo-50 active:scale-98 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Menerbitkan Tagihan...</span>
                ) : (
                  <>
                    <span>Publish Tagihan Massal</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {financeIuranStudentIds.length === 0 && (
                <p className="text-center text-[10px] text-indigo-300/70 font-medium">
                  * Centang minimal satu siswa di daftar sebelah kiri untuk menerbitkan tagihan.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
