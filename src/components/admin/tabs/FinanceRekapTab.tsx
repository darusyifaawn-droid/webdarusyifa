import React from 'react';
import { Search, Download, User, Wallet, History, AlertCircle, CreditCard, CheckCircle, Users, BarChart as BarChartIcon, Printer, Edit, Trash2, FileText, TrendingUp, RefreshCw } from 'lucide-react';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FinanceRekapTabProps {
  filteredUsersForFinance: any[];
  filterFinanceAcademicYear: string;
  setFilterFinanceAcademicYear: (val: string) => void;
  filterFinanceKelas: string;
  setFilterFinanceKelas: (val: string) => void;
  schoolClasses: any[];
  allFinanceCategories: any[];
  payments: any[];
  allUsers: any[];
  exportFinanceToExcel: () => void;
  setFilterFinanceStudentName: (val: string) => void;
  filterFinanceCategory: string;
  setFilterFinanceCategory: (val: string) => void;
  setFilterFinanceMethod: (val: string) => void;
  setFilterFinanceStartDate: (val: string) => void;
  setFilterFinanceEndDate: (val: string) => void;
  setFilterFinanceIuranName: (val: string) => void;
  setFilterKeuanganStatus: (val: any) => void;
  filterKeuanganStatus: string;
  filterFinanceStudentName: string;
  setSelectedStudentForFinance: (val: any) => void;
  setShowManageFinanceModal: (val: boolean) => void;
  setEditingUser: (val: any) => void;
  setShowEditUser: (val: boolean) => void;
  setUserToDelete: (val: any) => void;
  setShowDeleteConfirm: (val: boolean) => void;
  getMonthlyFinanceData: () => any[];
  displayTotalTabungan: number;
  displayTotalTunggakan: number;
}

export default function FinanceRekapTab({
  filteredUsersForFinance,
  filterFinanceAcademicYear,
  setFilterFinanceAcademicYear,
  filterFinanceKelas,
  setFilterFinanceKelas,
  schoolClasses,
  allFinanceCategories,
  payments,
  allUsers,
  exportFinanceToExcel,
  setFilterFinanceStudentName,
  filterFinanceCategory,
  setFilterFinanceCategory,
  setFilterFinanceMethod,
  setFilterFinanceStartDate,
  setFilterFinanceEndDate,
  setFilterFinanceIuranName,
  setFilterKeuanganStatus,
  filterKeuanganStatus,
  filterFinanceStudentName,
  setSelectedStudentForFinance,
  setShowManageFinanceModal,
  setEditingUser,
  setShowEditUser,
  setUserToDelete,
  setShowDeleteConfirm,
  getMonthlyFinanceData,
  displayTotalTabungan,
  displayTotalTunggakan
}: FinanceRekapTabProps) {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const academicYearOptions = [
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${nextYear}`,
    `${nextYear}/${nextYear + 1}`
  ];

  const totalTagihanValue = (allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif').reduce((acc, curr) => acc + (curr.arrears || 0), 0) + payments.filter(p => p.type === 'iuran' && p.status === 'lunas').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0));
  const totalDibayarValue = payments.filter(p => p.type === 'iuran' && p.status === 'lunas').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalSisaTunggakanValue = allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif').reduce((acc, curr) => acc + (curr.arrears || 0), 0);

  return (
    <div className="space-y-8 text-left">
      {/* 1. Filter Panel */}
      <div className="bg-white border border-gray-100 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          <div className="space-y-1.5 md:space-y-2">
            <label className="text-[10px] font-black text-gray-400 md:text-gray-500 uppercase tracking-widest ml-1">Cari Siswa</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Nama atau NISN..." 
                value={filterFinanceStudentName}
                onChange={(e) => setFilterFinanceStudentName(e.target.value)}
                className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-slate-50 border-none rounded-xl md:rounded-2xl text-[11px] md:text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 placeholder:text-gray-400 transition-all font-sans"
              />
            </div>
          </div>
          
          <div className="space-y-1.5 md:space-y-2">
            <label className="text-[10px] font-black text-gray-400 md:text-gray-500 uppercase tracking-widest ml-1">Tahun Ajaran</label>
            <select 
              value={filterFinanceAcademicYear}
              onChange={(e) => setFilterFinanceAcademicYear(e.target.value)}
              className="w-full text-[11px] md:text-xs p-3 md:p-4 bg-slate-50 border-none rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 cursor-pointer appearance-none font-sans"
            >
              {academicYearOptions.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <label className="text-[10px] font-black text-gray-400 md:text-gray-500 uppercase tracking-widest ml-1">Filter Kelas</label>
            <select 
              value={filterFinanceKelas}
              onChange={(e) => setFilterFinanceKelas(e.target.value)}
              className="w-full text-[11px] md:text-xs p-3 md:p-4 bg-slate-50 border-none rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 cursor-pointer appearance-none font-sans"
            >
              <option value="">Semua Kelas</option>
              {schoolClasses.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <label className="text-[10px] font-black text-gray-400 md:text-gray-500 uppercase tracking-widest ml-1">Grup Iuran</label>
            <select 
              value={filterFinanceCategory} 
              onChange={(e) => setFilterFinanceCategory(e.target.value)}
              className="w-full text-[11px] md:text-xs p-3 md:p-4 bg-slate-50 border-none rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 cursor-pointer appearance-none font-sans"
            >
              <option value="">Semua Kategori</option>
              {allFinanceCategories.map((cat: any) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <label className="text-[10px] font-black text-gray-400 md:text-gray-500 uppercase tracking-widest ml-1">Status Bayar</label>
            <select 
              value={filterKeuanganStatus} 
              onChange={(e) => setFilterKeuanganStatus(e.target.value as any)}
              className="w-full text-[11px] md:text-xs p-3 md:p-4 bg-slate-50 border-none rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 cursor-pointer appearance-none font-sans"
            >
              <option value="semua">Semua Status</option>
              <option value="lunas">Lunas</option>
              <option value="menunggak">Menunggak</option>
            </select>
          </div>
        </div>

        <div className="mt-6 md:mt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-50 pt-6">
          <button 
            onClick={() => {
              setFilterFinanceStudentName('');
              setFilterFinanceKelas('');
              setFilterFinanceCategory('');
              setFilterFinanceMethod('');
              setFilterFinanceStartDate('');
              setFilterFinanceEndDate('');
              setFilterFinanceIuranName('');
              setFilterKeuanganStatus('semua');
            }}
            className="w-full md:w-auto px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
          >
            Reset Filter
          </button>
          <div className="flex w-full md:w-auto items-center gap-3">
            <button 
              onClick={exportFinanceToExcel}
              className="flex-1 md:flex-none px-6 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Download size={14} /> XLSX
            </button>
          </div>
        </div>
      </div>

      {/* 2. Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-indigo-600">
            <CreditCard size={64} />
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            <CreditCard size={24} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Tagihan</p>
          <h4 className="text-2xl font-black text-gray-800 tracking-tight mt-1">Rp {totalTagihanValue.toLocaleString('id-ID')}</h4>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-emerald-600">
            <CheckCircle size={64} />
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle size={24} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Dibayar</p>
          <h4 className="text-2xl font-black text-gray-800 tracking-tight mt-1">Rp {totalDibayarValue.toLocaleString('id-ID')}</h4>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group text-left">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-red-500">
            <AlertCircle size={64} />
          </div>
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
            <AlertCircle size={24} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sisa Tunggakan</p>
          <h4 className="text-2xl font-black text-red-600 tracking-tight mt-1 text-left">Rp {totalSisaTunggakanValue.toLocaleString('id-ID')}</h4>
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden group text-left">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-indigo-400">
            <Users size={64} />
          </div>
          <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center mb-4">
            <Users size={24} />
          </div>
          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest opacity-70">Siswa Menunggak</p>
          <h4 className="text-2xl font-black text-white tracking-tight mt-1 text-left">
            {allUsers.filter(u => u.role === 'siswa' && (u.arrears || 0) > 0).length} Siswa
          </h4>
        </div>
      </div>

      {/* 3. DataTable Section */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
          <h4 className="text-lg font-black text-gray-800 tracking-tight">Rincian Tagihan Siswa</h4>
          <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            {filteredUsersForFinance.length} Total Baris
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">No</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama & NISN</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Kelas</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Tagihan</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Dibayar</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Sisa</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsersForFinance.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <Users size={48} />
                      <p className="font-black text-sm uppercase tracking-widest">Data Tidak Ditemukan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsersForFinance.map((u, idx) => {
                  const sumDibayar = payments.filter(p => p.studentId === u.id && p.type === 'iuran' && p.status === 'lunas').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
                  const totalTagihan = (u.arrears || 0) + sumDibayar;
                  const sisa = u.arrears || 0;
                  
                  let statusBadge = (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest">Lunas</span>
                  );
                  if (sisa > 0) {
                    statusBadge = (
                      <span className={sisa >= totalTagihan ? "px-3 py-1 bg-red-100 text-red-700 rounded-full text-[9px] font-black uppercase tracking-widest" : "px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-widest"}>
                        {sisa >= totalTagihan ? 'Menunggak' : 'Belum Lunas'}
                      </span>
                    );
                  }

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5 font-black text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col text-left">
                          <span className="font-black text-gray-800 text-sm group-hover:text-indigo-600 transition-colors uppercase">{u.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 tracking-widest">{u.nisn || 'NISN : -'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200/50">{u.kelas || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-5 font-black text-slate-700 text-xs text-right">Rp {totalTagihan.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-5 font-black text-emerald-600 text-xs text-right">Rp {sumDibayar.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-5 font-black text-red-500 text-xs text-right">Rp {sisa.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-5 text-center">{statusBadge}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => { setSelectedStudentForFinance(u); setShowManageFinanceModal(true); }}
                            className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            title="Detail"
                          >
                            <FileText size={16} />
                          </button>
                          <button 
                            onClick={() => { setSelectedStudentForFinance(u); setShowManageFinanceModal(true); }}
                            className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                            title="Bayar"
                          >
                            <CreditCard size={16} />
                          </button>
                          <button 
                            onClick={() => { setEditingUser(u); setShowEditUser(true); }}
                            className="w-9 h-9 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => { setUserToDelete(u); setShowDeleteConfirm(true); }}
                            className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
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
      </div>

      {/* 4. Monthly Chart */}
      <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 text-left">
          <div>
            <h4 className="text-2xl font-black text-white tracking-tight">Analisis Penerimaan Iuran</h4>
            <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-wider">Perbandingan Tabungan vs Pelunasan Tagihan</p>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={getMonthlyFinanceData()}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900', fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900', fill: '#64748b' }} tickFormatter={(val) => `Rp${(val / 1000).toLocaleString()}k`} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '20px', border: '1px solid #1e293b', padding: '15px' }} 
              />
              <Bar dataKey="savings" fill="#10b981" radius={[8, 8, 0, 0]} name="TABUNGAN" barSize={40} />
              <Bar dataKey="arrears" fill="#6366f1" radius={[8, 8, 0, 0]} name="TAGIHAN" barSize={40} />
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
