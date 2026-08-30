import React from 'react';
import { Search, Users, Trash2, CheckCircle, X, Clock, Image as ImageIcon, RefreshCw, Printer } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../../lib/firestoreUtils';
import ReactMarkdown from 'react-markdown';

interface FinanceRiwayatTabProps {
 searchTransactionText: string;
 setSearchTransactionText: (val: string) => void;
 filterLogStatus: string;
 setFilterLogStatus: (val: any) => void;
 filterLogMethod: string;
 setFilterLogMethod: (val: any) => void;
 filterLogStartDate: string;
 setFilterLogStartDate: (val: string) => void;
 filterLogEndDate: string;
 setFilterLogEndDate: (val: string) => void;
 payments: any[];
 allUsers: any[];
 setSelectedPhoto: (val: string | null) => void;
 handlePrintReceipt: (pay: any) => void;
}

export default function FinanceRiwayatTab({
 searchTransactionText,
 setSearchTransactionText,
 filterLogStatus,
 setFilterLogStatus,
 filterLogMethod,
 setFilterLogMethod,
 filterLogStartDate,
 setFilterLogStartDate,
 filterLogEndDate,
 setFilterLogEndDate,
 payments,
 allUsers,
 setSelectedPhoto,
 handlePrintReceipt
}: FinanceRiwayatTabProps) {
 const filteredLogPayments = payments.filter(pay => {
 const student = allUsers.find(u => u.id === pay.studentId);
 const studentName = student?.name || '';
 const desc = pay.description || '';
 const searchLower = searchTransactionText.toLowerCase();
 const matchesSearch = studentName.toLowerCase().includes(searchLower) || desc.toLowerCase().includes(searchLower);
 
 // 1. Filter Status
 const matchesStatus = filterLogStatus === 'semua' || pay.status === filterLogStatus;

 // 2. Filter Metode
 const matchesMethod = filterLogMethod === 'semua' || pay.method === filterLogMethod;
 
 // 3. Filter Waktu (Date range)
 let matchesDate = true;
 if (pay.createdAt) {
 try {
 const dObj = pay.createdAt.toDate ? pay.createdAt.toDate() : new Date(pay.createdAt);
 const y = dObj.getFullYear();
 const m = String(dObj.getMonth() + 1).padStart(2, '0');
 const d = String(dObj.getDate()).padStart(2, '0');
 const payDateStr = `${y}-${m}-${d}`;
 
 if (filterLogStartDate && payDateStr < filterLogStartDate) matchesDate = false;
 if (filterLogEndDate && payDateStr > filterLogEndDate) matchesDate = false;
 } catch (e) {
 // ignore
 }
 }
 
 return matchesSearch && matchesStatus && matchesMethod && matchesDate;
 }).sort((a, b) => {
 const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
 const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
 return dateB.getTime() - dateA.getTime();
 });

 return (
 <div className="space-y-6 text-left">
 <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden text-sm transition-colors">
 <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="text-left">
 <h3 className="font-black text-slate-900 tracking-tight text-xl">Arsip Log Keuangan</h3>
 <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-wider">Jejak rekaman transaksi yang telah difinalisasi</p>
 </div>
 
 <div className="relative w-full md:w-96 text-left">
 <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
 <input 
 type="text"
 placeholder="Cari nama siswa atau transaksi..."
 value={searchTransactionText}
 onChange={(e) => setSearchTransactionText(e.target.value)}
 className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 "
 />
 </div>
 </div>

 <div className="bg-slate-50/50 p-6 grid grid-cols-1 md:grid-cols-5 gap-4 border-b border-slate-100 text-left">
 <div className="space-y-1.5">
 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Status Log</label>
 <select 
 value={filterLogStatus} 
 onChange={(e) => setFilterLogStatus(e.target.value as any)} 
 className="w-full text-xs p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-black text-slate-700 "
 >
 <option value="semua">Semua Status</option>
 <option value="pending">Tertunda</option>
 <option value="lunas">Diterima</option>
 <option value="ditolak">Ditolak</option>
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Metode Bayar</label>
 <select 
 value={filterLogMethod} 
 onChange={(e) => setFilterLogMethod(e.target.value as any)} 
 className="w-full text-xs p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-black text-slate-700 "
 >
 <option value="semua">Semua Metode</option>
 <option value="Tunai">Tunai (Cash)</option>
 <option value="Transfer">Transfer</option>
 <option value="Tabungan">Tabungan</option>
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dari Tanggal</label>
 <input 
 type="date" 
 value={filterLogStartDate} 
 onChange={(e) => setFilterLogStartDate(e.target.value)} 
 className="w-full text-xs p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-black text-slate-700 font-mono" 
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Sampai Tanggal</label>
 <input 
 type="date" 
 value={filterLogEndDate} 
 onChange={(e) => setFilterLogEndDate(e.target.value)} 
 className="w-full text-xs p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-black text-slate-700 font-mono" 
 />
 </div>
 <div className="flex items-end">
 <button 
 onClick={() => { 
 setFilterLogStatus('semua'); 
 setFilterLogMethod('semua');
 setFilterLogStartDate(''); 
 setFilterLogEndDate(''); 
 setSearchTransactionText(''); 
 }}
 className="w-full bg-slate-200 text-slate-700 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all flex items-center justify-center gap-2"
 >
 <RefreshCw size={14} /> RESET FILTER
 </button>
 </div>
 </div>

 <div className="hidden md:block overflow-x-auto">
 <table className="w-full text-left border-collapse min-w-[900px]">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-100 ">
 <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu & Transaksi</th>
 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Siswa</th>
 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal</th>
 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode</th>
 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
 <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tindakan</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {filteredLogPayments.length === 0 ? (
 <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-black text-[10px] uppercase tracking-widest">Tidak ada data riwayat</td></tr>
 ) : (
 filteredLogPayments.map((pay) => {
 const student = allUsers.find(u => u.id === pay.studentId);
 const statusColor = pay.status === 'lunas' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 ' : 
 pay.status === 'ditolak' ? 'bg-rose-50 text-rose-600 border-rose-200 ' : 
 'bg-amber-50 text-amber-600 border-amber-200 ';
 
 return (
 <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors group">
 <td className="px-8 py-5">
 <div className="flex flex-col gap-1">
 <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{pay.createdAt ? (pay.createdAt.toDate ? pay.createdAt.toDate().toLocaleString() : new Date(pay.createdAt).toLocaleString()) : '-'}</p>
 <p className="font-bold text-slate-800 text-sm">{pay.description}</p>
 </div>
 </td>
 <td className="px-6 py-5">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-indigo-600 font-black text-[10px] border border-slate-200 ">
 {student?.name?.charAt(0) || '?'}
 </div>
 <span className="truncate max-w-[150px] font-black text-slate-800 ">{student?.name || 'Unknown'}</span>
 </div>
 </td>
 <td className="px-6 py-5 font-black text-indigo-600 ">Rp {(pay.amount || 0).toLocaleString('id-ID')}</td>
 <td className="px-6 py-5">
 {pay.method === 'Transfer' ? (
 <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-blue-200 font-mono">TF</span>
 ) : pay.method === 'Tunai' ? (
 <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-200 font-mono">CASH</span>
 ) : (
 <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-200 font-mono">SAVE</span>
 )}
 </td>
 <td className="px-6 py-5 text-left">
 <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColor}`}>
 {pay.status === 'lunas' ? 'Diterima' : pay.status}
 </span>
 </td>
 <td className="px-8 py-5 text-center">
 <div className="flex items-center justify-center gap-2">
 <button 
 onClick={() => handlePrintReceipt(pay)}
 className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100 "
 title="Cetak Kuitansi"
 >
 <Printer size={15} />
 </button>
 {pay.proofStr && (
 <button 
 onClick={() => setSelectedPhoto(pay.proofStr)}
 className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
 title="Lihat Bukti"
 >
 <ImageIcon size={15} />
 </button>
 )}
 <button 
 onClick={async () => {
 if(window.confirm('Hapus log transaksi ini permanen?')) {
 try {
 await deleteDoc(doc(db, 'payments', pay.id));
 } catch (error) {
 handleFirestoreError(error, OperationType.DELETE, `payments/${pay.id}`);
 }
 }
 }}
 className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
 title="Hapus"
 >
 <Trash2 size={15} />
 </button>
 </div>
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>

 <div className="md:hidden divide-y divide-gray-100">
 {filteredLogPayments.length === 0 ? (
 <div className="p-20 text-center text-gray-300 font-black text-[10px] uppercase tracking-widest italic flex flex-col items-center gap-4">
 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200"><Search size={32} /></div>
 Tidak ada riwayat
 </div>
 ) : (
 filteredLogPayments.map((pay) => {
 const student = allUsers.find(u => u.id === pay.studentId);
 return (
 <div key={pay.id} className="p-5 flex flex-col gap-4 active:bg-slate-50">
 <div className="flex justify-between items-start">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs border border-slate-100">
 {student?.name?.charAt(0) || '?'}
 </div>
 <div>
 <p className="font-black text-gray-800 text-[11px] uppercase tracking-tight">{student?.name || 'Unknown'}</p>
 <p className="text-[9px] text-gray-400 font-medium">{pay.createdAt ? (pay.createdAt.toDate ? pay.createdAt.toDate().toLocaleDateString() : new Date(pay.createdAt).toLocaleDateString()) : '-'}</p>
 </div>
 </div>
 <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
 pay.status === 'lunas' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
 pay.status === 'ditolak' ? 'bg-red-50 text-red-600 border-red-100' : 
 'bg-orange-50 text-orange-600 border-orange-100'
 }`}>
 {pay.status === 'lunas' ? 'Diterima' : pay.status}
 </span>
 </div>

 <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaksi</span>
 <span className="text-[10px] font-bold text-gray-700 truncate max-w-[200px]">{pay.description}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal</span>
 <span className="text-xs font-black text-indigo-600">Rp {(pay.amount || 0).toLocaleString('id-ID')}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode</span>
 <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{pay.method}</span>
 </div>
 </div>

 <div className="flex items-center justify-end gap-3 pt-1">
 <button 
 onClick={() => handlePrintReceipt(pay)}
 className="px-4 py-2.5 bg-white border border-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all"
 >
 <Printer size={14} /> Cetak
 </button>
 {pay.proofStr && (
 <button 
 onClick={() => setSelectedPhoto(pay.proofStr)}
 className="px-4 py-2.5 bg-white border border-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all"
 >
 <ImageIcon size={14} /> Bukti
 </button>
 )}
 <button 
 onClick={async () => {
 if(window.confirm('Hapus log transaksi ini permanen?')) {
 try {
 await deleteDoc(doc(db, 'payments', pay.id));
 } catch (error) {
 handleFirestoreError(error, OperationType.DELETE, `payments/${pay.id}`);
 }
 }
 }}
 className="px-4 py-2.5 bg-rose-50 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-100 active:scale-95 transition-all"
 >
 <Trash2 size={14} /> Hapus
 </button>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>
 </div>
 );
}
