import React from 'react';
import { Download, Plus, Search, Key, Edit, Trash2, Users } from 'lucide-react';

interface UserTabProps {
  allUsers: any[];
  filterName: string;
  setFilterName: (val: string) => void;
  filterUserRole: string;
  setFilterUserRole: (val: any) => void;
  filterKelas: string;
  setFilterKelas: (val: string) => void;
  filterTeacherType: string;
  setFilterTeacherType: (val: string) => void;
  filterSiswaStatus?: 'Aktif' | 'Alumni' | 'Pindah' | 'Tidak Aktif';
  setFilterSiswaStatus?: (val: 'Aktif' | 'Alumni' | 'Pindah' | 'Tidak Aktif') => void;
  schoolClasses: any[];
  setNewUserRole: (val: string) => void;
  setShowAddUser: (val: boolean) => void;
  setUserToReset: (user: any) => void;
  setShowResetPassword: (val: boolean) => void;
  setEditingUser: (user: any) => void;
  setShowEditUser: (val: boolean) => void;
  setUserToDelete: (user: any) => void;
  setShowDeleteConfirm: (val: boolean) => void;
  exportUsersToExcel: () => void;
}

export default function UserTab({
  allUsers,
  filterName,
  setFilterName,
  filterUserRole,
  setFilterUserRole,
  filterKelas,
  setFilterKelas,
  filterTeacherType,
  setFilterTeacherType,
  filterSiswaStatus = 'Aktif',
  setFilterSiswaStatus,
  schoolClasses,
  setNewUserRole,
  setShowAddUser,
  setUserToReset,
  setShowResetPassword,
  setEditingUser,
  setShowEditUser,
  setUserToDelete,
  setShowDeleteConfirm,
  exportUsersToExcel
}: UserTabProps) {
  const filteredUsers = allUsers.filter(u => {
    const matchRole = filterUserRole === 'semua' || u.role === filterUserRole;
    const matchKelas = !filterKelas || (u.kelas || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(filterKelas.toLowerCase().replace(/[^a-z0-9]/g, '')) || (u.assignedClass || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(filterKelas.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const matchName = !filterName || u.name.toLowerCase().includes(filterName.toLowerCase());
    const matchTeacherType = filterTeacherType === 'semua' || u.teacherType === filterTeacherType;
    const matchStatus = u.role === 'siswa' ? (u.status || 'Aktif') === filterSiswaStatus : true;
    return matchRole && matchKelas && matchName && matchTeacherType && matchStatus;
  });

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 md:p-8 border-b border-gray-100 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight uppercase">User Management</h3>
          <div className="md:hidden">
            <button 
              onClick={() => { setNewUserRole(filterUserRole === 'guru' ? 'guru' : 'siswa'); setShowAddUser(true); }}
              className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-all"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:flex md:flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari Nama Pengguna..." 
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-600 font-sans"
            />
          </div>
          
          <div className="grid grid-cols-2 lg:flex items-center gap-3">
            <select 
              value={filterUserRole}
              onChange={(e) => setFilterUserRole(e.target.value as any)}
              className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] outline-none focus:ring-2 focus:ring-indigo-500 font-black text-gray-400 uppercase tracking-widest cursor-pointer font-sans"
            >
              <option value="semua">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="guru">Guru</option>
              <option value="siswa">Siswa</option>
            </select>

            {filterUserRole === 'siswa' && setFilterSiswaStatus && (
              <select 
                value={filterSiswaStatus}
                onChange={(e) => setFilterSiswaStatus(e.target.value as any)}
                className="p-3.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl text-[10px] outline-none focus:ring-2 focus:ring-blue-500 font-black uppercase tracking-widest cursor-pointer font-sans"
              >
                <option value="Aktif">SISWA AKTIF</option>
                <option value="Alumni">ALUMNI / LULUS</option>
                <option value="Pindah">PINDAH SEKOLAH</option>
                <option value="Tidak Aktif">TIDAK AKTIF</option>
              </select>
            )}
            
            <select 
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] outline-none focus:ring-2 focus:ring-indigo-500 font-black text-gray-400 uppercase tracking-widest cursor-pointer font-sans"
            >
              <option value="">Semua Kelas</option>
              {schoolClasses.map((c: any) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex md:contents">
             <select 
                value={filterTeacherType}
                onChange={(e) => setFilterTeacherType(e.target.value)}
                className="flex-1 md:flex-none p-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] outline-none focus:ring-2 focus:ring-indigo-500 font-black text-gray-400 uppercase tracking-widest cursor-pointer font-sans"
              >
                <option value="semua">Tipe Guru</option>
                <option value="Wali Kelas">Wali Kelas</option>
                <option value="Guru Kelas">Guru Kelas</option>
                <option value="Guru Bidang">Guru Bidang</option>
              </select>

              <button 
                onClick={exportUsersToExcel}
                className="p-3.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-100 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest"
              >
                <Download size={16} /> <span className="hidden lg:inline">Export</span>
              </button>
          </div>

          <button 
            onClick={() => { setNewUserRole(filterUserRole === 'guru' ? 'guru' : 'siswa'); setShowAddUser(true); }}
            className="hidden md:flex bg-green-600 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-95"
          >
            <Plus size={18} /> Tambah User
          </button>
        </div>
      </div>
      
      <div className="hidden md:block overflow-x-auto">
         <table className="w-full text-left whitespace-nowrap min-w-[800px]">
           <thead className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
             <tr>
               <th className="px-8 py-5">Identitas</th>
               <th className="px-8 py-5">Kredensial</th>
               <th className="px-8 py-5">Platfrom / Grup</th>
               <th className="px-8 py-5">Role</th>
               <th className="px-8 py-5">Status</th>
               <th className="px-8 py-5 text-right">Manajemen</th>
             </tr>
           </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="group hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5">
                  <div className="font-bold text-gray-800 text-[13px]">{u.name}</div>
                  <div className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">{u.role === 'admin' ? 'Administrator' : u.role === 'guru' ? 'Instansi Guru' : 'Internal Siswa'}</div>
                </td>
                <td className="px-8 py-5">
                  <div className="text-xs font-bold text-gray-500 font-sans">{u.email}</div>
                  <div className="text-[9px] text-slate-400 border border-slate-100 w-fit px-2 py-0.5 rounded-lg bg-slate-50 mt-1.5 font-black uppercase tracking-widest">PWD: {u.plainPassword || '***'}</div>
                </td>
                <td className="px-8 py-5 text-gray-600 text-[11px] font-bold">
                  {u.role === 'siswa' ? (u.kelas || 'N/A') : (u.assignedClass || 'Umum')}
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                    u.role === 'admin' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    u.role === 'guru' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-8 py-5">
                  {u.role === 'siswa' ? (
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      (u.status || 'Aktif') === 'Aktif' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      u.status === 'Alumni' ? 'bg-violet-50 text-violet-600 border-violet-100' : 
                      u.status === 'Pindah' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                      'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      {u.status || 'Aktif'}
                    </span>
                  ) : u.role === 'guru' ? (
                     <div className="flex flex-col gap-1">
                       <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase border border-slate-100 w-fit">
                         {u.teacherType || 'Guru Kelas'}
                       </span>
                     </div>
                  ) : (
                    <span className="text-slate-300 text-[10px] font-black tracking-widest">N/A</span>
                  )}
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setUserToReset(u); setShowResetPassword(true); }} className="w-9 h-9 flex items-center justify-center bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm"><Key size={14} /></button>
                    <button onClick={() => { setEditingUser(u); setShowEditUser(true); }} className="w-9 h-9 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><Edit size={14} /></button>
                    <button onClick={() => { setUserToDelete(u); setShowDeleteConfirm(true); }} className="w-9 h-9 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-gray-50 bg-slate-50/30">
        {filteredUsers.map((u) => (
          <div key={u.id} className="p-6 active:bg-gray-50 transition-colors flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="font-black text-gray-800 text-sm tracking-tight uppercase">{u.name}</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-[0.15em] border ${
                    u.role === 'admin' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    u.role === 'guru' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>{u.role}</span>
                  <p className="text-[9px] text-slate-400 font-bold font-sans">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <button onClick={() => { setEditingUser(u); setShowEditUser(true); }} className="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl flex items-center justify-center text-indigo-500 active:scale-90 transition-all"><Edit size={16} /></button>
                 <button onClick={() => { setUserToDelete(u); setShowDeleteConfirm(true); }} className="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl flex items-center justify-center text-rose-500 active:scale-90 transition-all"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Users size={12} className="text-slate-300" />
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {u.role === 'siswa' ? `Kelas: ${u.kelas || '-'}` : u.role === 'guru' ? `Tipe: ${u.teacherType || '-'}` : 'Administrator'}
                     </span>
                  </div>
                  <button onClick={() => { setUserToReset(u); setShowResetPassword(true); }} className="flex items-center gap-2 text-[9px] font-black text-amber-500 uppercase tracking-widest">
                     <Key size={12} /> Reset Pass
                  </button>
               </div>
               <div className="h-px bg-slate-50 w-full" />
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Pass Key</span>
                    <span className="text-[10px] font-bold text-gray-700 bg-gray-50 px-2 rounded-lg py-0.5 border border-gray-100">{u.plainPassword || '***'}</span>
                  </div>
                  {(u.status || u.assignedClass) && (
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">
                      {u.role === 'siswa' ? (u.status || 'Aktif') : u.assignedClass}
                    </span>
                  )}
               </div>
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="p-20 text-center text-slate-300 font-black text-[10px] uppercase tracking-widest italic flex flex-col items-center gap-4">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200"><Search size={32} /></div>
             Data tidak ditemukan
          </div>
        )}
      </div>
    </div>
  );
}
