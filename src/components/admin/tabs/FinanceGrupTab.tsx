import React from 'react';
import { BookOpen, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';

interface FinanceGrupTabProps {
 iuranCategories: any[];
 setEditingIuranCategory: (val: any) => void;
 setNewIuranCategoryName: (val: string) => void;
 setNewIuranCategoryAmount: (val: string) => void;
 setShowIuranCategoryModal: (val: boolean) => void;
 handleDeleteIuranCategory: (id: string) => void;
 handleSyncFinanceData: () => void;
}

export default function FinanceGrupTab({
 iuranCategories,
 setEditingIuranCategory,
 setNewIuranCategoryName,
 setNewIuranCategoryAmount,
 setShowIuranCategoryModal,
 handleDeleteIuranCategory,
 handleSyncFinanceData
}: FinanceGrupTabProps) {
 return (
 <div className="space-y-6 text-left">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h3 className="text-xl font-black text-gray-800 tracking-tight">Manajemen Grup Iuran</h3>
 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Kelola kategori iuran sekolah secara terorganisir</p>
 </div>
 <div className="flex items-center gap-3">
 <button 
 onClick={handleSyncFinanceData}
 className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
 title="Sinkronisasi tagihan siswa dengan grup iuran aktif"
 >
 <RefreshCw size={16} /> Sinkronisasi Data
 </button>
 <button 
 onClick={() => { setEditingIuranCategory(null); setNewIuranCategoryName(''); setNewIuranCategoryAmount(''); setShowIuranCategoryModal(true); }}
 className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 transition-all active:scale-95"
 >
 <Plus size={16} /> Tambah Grup
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {iuranCategories.length === 0 ? (
 <div className="md:col-span-2 lg:col-span-3 py-20 bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-300 ">
 <BookOpen size={48} className="mb-4 opacity-20" />
 <p className="font-black text-xs uppercase tracking-widest">Belum ada grup iuran</p>
 </div>
 ) : (
 iuranCategories.map((cat: any) => (
 <div key={cat.id} className="bg-white border border-gray-100 p-6 sm:p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all group relative overflow-hidden">
 <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-indigo-50 rounded-full -mr-10 -mt-10 sm:-mr-12 sm:-mt-12 group-hover:scale-110 transition-transform duration-500 opacity-50"></div>
 
 <div className="relative">
 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
 <BookOpen size={18} className="sm:w-5 sm:h-5" />
 </div>
 
 <h4 className="text-base sm:text-lg font-black text-gray-800 tracking-tight group-hover:text-indigo-600 transition-colors uppercase leading-tight">{cat.name}</h4>
 <div className="mt-2 flex flex-col sm:flex-row sm:items-baseline gap-1">
 <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Nominal Default:</span>
 <p className="text-indigo-600 font-black text-lg sm:text-xl tracking-tight leading-none mt-1 sm:mt-0">Rp {Number(cat.amount || 0).toLocaleString('id-ID')}</p>
 </div>

 <div className="mt-6 sm:mt-8 flex items-center gap-3 border-t border-gray-50 pt-5 sm:pt-6">
 <button 
 onClick={() => { setEditingIuranCategory(cat); setNewIuranCategoryName(cat.name); setNewIuranCategoryAmount(cat.amount?.toString() || ''); setShowIuranCategoryModal(true); }}
 className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
 >
 <Edit size={14} /> Edit
 </button>
 <button 
 onClick={() => handleDeleteIuranCategory(cat.id)}
 className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
 >
 <Trash2 size={14} />
 </button>
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 );
}
