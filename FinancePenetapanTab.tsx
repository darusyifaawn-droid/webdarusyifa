import React from 'react';
import { Search, X, Users, CreditCard, Calendar, PlusCircle } from 'lucide-react';

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
  const students = allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif');
  const filteredStudents = students.filter(s => !filterFinanceKelas || s.kelas === filterFinanceKelas);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-gray-800 tracking-tight text-xl">Buat Tagihan Massal</h3>
              <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-wider">Tentukan target siswa dan nominal iuran yang akan ditagihkan</p>
            </div>
            <div className="flex items-center gap-3">
               <select 
                 value={filterFinanceKelas}
                 onChange={(e) => setFilterFinanceKelas(e.target.value)}
                 className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border-none rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
               >
                 <option value="">Semua Kelas</option>
                 {schoolClasses.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
               </select>
               <button 
                 onClick={() => {
                   const ids = filteredStudents.map(s => s.id);
                   setFinanceIuranStudentIds(Array.from(new Set([...financeIuranStudentIds, ...ids])));
                 }}
                 className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
               >
                 Pilih Semua
               </button>
            </div>
          </div>
          
          <div className="p-4 md:p-8 max-h-[600px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 custom-scrollbar">
            {filteredStudents.map(student => {
              const isSelected = financeIuranStudentIds.includes(student.id);
              return (
                <div 
                  key={student.id} 
                  onClick={() => {
                    if (isSelected) setFinanceIuranStudentIds(prev => prev.filter(id => id !== student.id));
                    else setFinanceIuranStudentIds(prev => [...prev, student.id]);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-50 hover:border-indigo-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {student.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-gray-800 text-sm truncate uppercase tracking-tight">{student.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{student.kelas}</p>
                    </div>
                  </div>
                  {isSelected && <CheckCircle size={18} className="text-indigo-600 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
         <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden sticky top-8">
            <div className="relative z-10">
               <h4 className="text-2xl font-black tracking-tight mb-6">Konfigurasi Tagihan</h4>
               <form onSubmit={handleAddIuran} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Nama Iuran</label>
                    <input 
                      type="text" 
                      value={financeIuranName}
                      onChange={(e) => setFinanceIuranName(e.target.value)}
                      placeholder="Misal: SPP Bulan Juli"
                      className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-white/30 placeholder:text-white/30 transition-all"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Kategori Iuran</label>
                    <div className="flex gap-2">
                      <select 
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-white/30 transition-all appearance-none cursor-pointer"
                        required
                      >
                        <option value="" className="text-gray-800">Pilih Kategori</option>
                        {iuranCategories.map((cat: any) => (
                          <option key={cat.id} value={cat.id} className="text-gray-800">{cat.name}</option>
                        ))}
                      </select>
                      <button 
                        type="button"
                        onClick={() => setShowIuranCategoryModal(true)}
                        className="p-4 bg-white/10 border border-white/10 rounded-2xl hover:bg-white/20 transition-all"
                      >
                        <PlusCircle size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Nominal (Rp)</label>
                      <input 
                        type="number" 
                        value={financeAmount}
                        onChange={(e) => setFinanceAmount(e.target.value)}
                        placeholder="0"
                        className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-white/30 placeholder:text-white/30"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Jatuh Tempo</label>
                      <input 
                        type="date" 
                        value={financeDueDate}
                        onChange={(e) => setFinanceDueDate(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-[10px] font-bold outline-none focus:ring-2 focus:ring-white/30"
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                       <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Kalkulasi Target</p>
                       <p className="text-2xl font-black">{financeIuranStudentIds.length} <span className="text-xs text-indigo-400 font-bold italic ml-1 text-white">Siswa Terpilih</span></p>
                    </div>
                    <button 
                      type="submit"
                      disabled={financeIuranStudentIds.length === 0}
                      className="w-full bg-white text-indigo-900 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      Publish Tagihan <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
               </form>
            </div>
            <div className="absolute -right-24 -bottom-24 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
         </div>
      </div>
    </div>
  );
}

function CheckCircle({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowRight({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
