import React, { useState, useMemo, useEffect } from 'react';
import { 
  Download, 
  Plus, 
  Search, 
  Key, 
  Edit, 
  Trash2, 
  Users, 
  Monitor, 
  Smartphone, 
  MoreVertical, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  ShieldCheck, 
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';

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
  // Mobile Action Drawer / Modal State
  const [selectedMobileUser, setSelectedMobileUser] = useState<any | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<{ [id: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination State - 10 items per page by default for neat display
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const matchRole = filterUserRole === 'semua' || u.role === filterUserRole;
      const matchKelas = !filterKelas || 
        (u.kelas || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(filterKelas.toLowerCase().replace(/[^a-z0-9]/g, '')) || 
        (u.assignedClass || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(filterKelas.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const matchName = !filterName || 
        (u.name || '').toLowerCase().includes(filterName.toLowerCase()) || 
        (u.email || '').toLowerCase().includes(filterName.toLowerCase()) ||
        (u.nisn || '').includes(filterName);
      const matchTeacherType = filterTeacherType === 'semua' || u.teacherType === filterTeacherType;
      const matchStatus = u.role === 'siswa' ? (u.status || 'Aktif') === filterSiswaStatus : true;
      return matchRole && matchKelas && matchName && matchTeacherType && matchStatus;
    });
  }, [allUsers, filterUserRole, filterKelas, filterName, filterTeacherType, filterSiswaStatus]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterName, filterUserRole, filterKelas, filterTeacherType, filterSiswaStatus, itemsPerPage]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredUsers.length);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Helper for Initials
  const getInitials = (name: string) => {
    if (!name) return 'RA';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Subtitle label helper
  const getSubLabel = (user: any) => {
    if (user.role === 'admin') return 'ADMINISTRATOR';
    if (user.role === 'guru') {
      return (user.teacherType || 'INSTANSI GURU').toUpperCase();
    }
    return user.kelas ? `INTERNAL SISWA • ${user.kelas}` : 'INTERNAL SISWA';
  };

  // Role Badge Style Helper
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            ADMIN
          </span>
        );
      case 'guru':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            GURU
          </span>
        );
      case 'siswa':
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            SISWA
          </span>
        );
    }
  };

  const handleCopyPassword = (pass: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!pass) return;
    navigator.clipboard.writeText(pass);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-5 text-left animate-in fade-in duration-300 pb-20 md:pb-6">
      
      {/* 1. Header (Matches Screenshot Desktop & Mobile) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            User Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Kelola akun pengguna dan akses sistem dengan mudah.
          </p>
        </div>
      </div>

      {/* 2. Mobile Banner Card (Matches Mobile Screenshot Top Banner) */}
      <div className="md:hidden bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 p-4 rounded-2xl border border-emerald-100/80 flex items-center justify-between shadow-2xs">
        <div className="max-w-[70%]">
          <h4 className="text-xs font-black text-slate-800 leading-snug">
            Kelola akun pengguna dan akses sistem
          </h4>
          <p className="text-[10px] text-emerald-700 font-bold mt-1">
            Total {allUsers.length} akun terdaftar
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center border border-emerald-200/50 shrink-0">
          <ShieldCheck size={26} />
        </div>
      </div>

      {/* 3. Search & Filters Container (Matches Screenshot Layout) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs space-y-3.5">
        
        {/* Desktop Filter Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Left Inputs Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-2.5 flex-1">
            
            {/* Search Input */}
            <div className="relative min-w-[200px] lg:w-64">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama pengguna..." 
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              {filterName && (
                <button 
                  onClick={() => setFilterName('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Dropdown: Role */}
            <div className="relative">
              <select 
                value={filterUserRole}
                onChange={(e) => setFilterUserRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none pr-8"
              >
                <option value="semua">Semua Role</option>
                <option value="admin">Admin</option>
                <option value="guru">Guru</option>
                <option value="siswa">Siswa</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>

            {/* Dropdown: Kelas */}
            <div className="relative">
              <select 
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none pr-8"
              >
                <option value="">Semua Kelas</option>
                {schoolClasses.map((c: any) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>

            {/* Dropdown: Tipe Guru or Status Siswa */}
            <div className="relative">
              {filterUserRole === 'siswa' && setFilterSiswaStatus ? (
                <select 
                  value={filterSiswaStatus}
                  onChange={(e) => setFilterSiswaStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-emerald-50/60 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none pr-8"
                >
                  <option value="Aktif">Siswa Aktif</option>
                  <option value="Alumni">Alumni / Lulus</option>
                  <option value="Pindah">Pindah Sekolah</option>
                  <option value="Tidak Aktif">Tidak Aktif</option>
                </select>
              ) : (
                <select 
                  value={filterTeacherType}
                  onChange={(e) => setFilterTeacherType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none pr-8"
                >
                  <option value="semua">Tipe Guru</option>
                  <option value="Wali Kelas">Wali Kelas</option>
                  <option value="Guru Kelas">Guru Kelas</option>
                  <option value="Guru Bidang">Guru Bidang</option>
                </select>
              )}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>

            {/* Reset filter button if active */}
            {(filterName || String(filterUserRole) !== 'semua' || filterKelas || filterTeacherType !== 'semua' || (String(filterUserRole) === 'siswa' && filterSiswaStatus !== 'Aktif')) && (
              <button 
                onClick={() => {
                  setFilterName('');
                  setFilterUserRole('semua');
                  setFilterKelas('');
                  setFilterTeacherType('semua');
                  if (setFilterSiswaStatus) setFilterSiswaStatus('Aktif');
                }}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Reset Filter"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

          </div>

          {/* Right Action Buttons: Export (Purple Outlined) & + Tambah User (Green Solid) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button 
              onClick={exportUsersToExcel}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50/60 hover:bg-indigo-100/80 text-indigo-600 border border-indigo-200/80 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <Download size={15} />
              <span>Export</span>
            </button>
            
            <button 
              onClick={() => { 
                setNewUserRole(filterUserRole === 'guru' ? 'guru' : filterUserRole === 'admin' ? 'admin' : 'siswa'); 
                setShowAddUser(true); 
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>+ Tambah User</span>
            </button>
          </div>

        </div>

      </div>

      {/* 4. Desktop View: Clean Table Matching Screenshot */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[760px]">
            <thead className="bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">IDENTITAS</th>
                <th className="px-6 py-4">KREDENSIAL</th>
                <th className="px-6 py-4">ROLE</th>
                <th className="px-6 py-4 text-center">PLATFORM AKSES</th>
                <th className="px-6 py-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-medium">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                        <Users size={24} />
                      </div>
                      <p className="text-xs font-bold">Tidak ada data pengguna yang sesuai dengan filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const isPasswordVisible = showPasswordMap[u.id];
                  const plainPass = u.plainPassword || 'DARUSYIFA123';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors group">
                      
                      {/* IDENTITAS */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          {u.photoURL ? (
                            <img 
                              src={u.photoURL} 
                              alt={u.name} 
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/80 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                              {getInitials(u.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight truncate">
                              {u.name}
                            </h4>
                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-wider mt-0.5">
                              {getSubLabel(u)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* KREDENSIAL */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-xs font-bold text-slate-700 font-sans truncate max-w-[220px]">
                            {u.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70">
                              PWD: {isPasswordVisible ? plainPass : '••••••••'}
                            </span>
                            <button 
                              onClick={(e) => togglePasswordVisibility(u.id, e)}
                              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                              title={isPasswordVisible ? 'Sembunyikan' : 'Lihat'}
                            >
                              {isPasswordVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button 
                              onClick={(e) => handleCopyPassword(plainPass, u.id, e)}
                              className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                              title="Salin Password"
                            >
                              {copiedId === u.id ? <Check size={13} className="text-emerald-600" /> : <Key size={13} />}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* ROLE */}
                      <td className="px-6 py-4">
                        {getRoleBadge(u.role)}
                      </td>

                      {/* PLATFORM AKSES */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <div 
                            className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0"
                            title="Akses Desktop Web Aktif"
                          >
                            <Monitor size={14} />
                          </div>
                          <div 
                            className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0"
                            title="Akses Mobile App / PWA Aktif"
                          >
                            <Smartphone size={14} />
                          </div>
                        </div>
                      </td>

                      {/* AKSI */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Pencil Button */}
                          <button 
                            onClick={() => { setEditingUser(u); setShowEditUser(true); }}
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Edit User"
                          >
                            <Edit size={14} />
                          </button>

                          {/* 3-Dots Dropdown Menu */}
                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === u.id ? null : u.id);
                              }}
                              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                              title="Menu Opsi"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {/* Dropdown Menu */}
                            {openDropdownId === u.id && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150"
                              >
                                <button
                                  onClick={() => {
                                    setUserToReset(u);
                                    setShowResetPassword(true);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-bold text-amber-600 hover:bg-amber-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Key size={14} />
                                  <span>Reset Password</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setUserToDelete(u);
                                    setShowDeleteConfirm(true);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                  <span>Hapus User</span>
                                </button>
                              </div>
                            )}
                          </div>
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

      {/* 5. Mobile View: Clean User Cards List (Matches Screenshot Mobile) */}
      <div className="md:hidden space-y-2.5">
        {paginatedUsers.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
              <Users size={24} />
            </div>
            <p className="text-xs font-bold text-slate-600">Tidak ada pengguna ditemukan</p>
          </div>
        ) : (
          paginatedUsers.map((u) => (
            <div 
              key={u.id}
              onClick={() => setSelectedMobileUser(u)}
              className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs active:scale-[0.99] transition-all flex items-center justify-between gap-3 cursor-pointer"
            >
              {/* Left: Avatar + Name + Sublabel */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {u.photoURL ? (
                  <img 
                    src={u.photoURL} 
                    alt={u.name} 
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/80 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                    {getInitials(u.name)}
                  </div>
                )}
                
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-900 text-xs tracking-tight truncate">
                    {u.name}
                  </h4>
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-wider mt-0.5 truncate">
                    {getSubLabel(u)}
                  </p>
                </div>
              </div>

              {/* Right: Role Badge + Chevron */}
              <div className="flex items-center gap-2 shrink-0">
                {getRoleBadge(u.role)}
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* 6. Pagination Navigation Bar (Displays <= 10 items per page with page controls) */}
      {filteredUsers.length > 0 && (
        <div className="bg-white p-4 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Info Status */}
          <div className="text-xs font-bold text-slate-500">
            Menampilkan <strong className="text-slate-800">{startIndex + 1}</strong> - <strong className="text-slate-800">{endIndex}</strong> dari <strong className="text-slate-800">{filteredUsers.length}</strong> pengguna
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            
            {/* Previous */}
            <button 
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                })
                .map((page, index, array) => {
                  const prevPage = array[index - 1];
                  const hasGap = prevPage && page - prevPage > 1;

                  return (
                    <React.Fragment key={page}>
                      {hasGap && <span className="text-slate-400 text-xs px-1">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          currentPage === page
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            {/* Next */}
            <button 
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Selanjutnya</span>
              <ChevronRight size={14} />
            </button>

          </div>

        </div>
      )}

      {/* 7. Mobile User Detail & Actions Modal */}
      {selectedMobileUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative animate-in slide-in-from-bottom duration-200 border border-slate-100 max-h-[90vh] overflow-y-auto">
            
            {/* Top Close Button */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                {selectedMobileUser.photoURL ? (
                  <img 
                    src={selectedMobileUser.photoURL} 
                    alt={selectedMobileUser.name} 
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black text-sm shadow-xs">
                    {getInitials(selectedMobileUser.name)}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight leading-tight">
                    {selectedMobileUser.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(selectedMobileUser.role)}
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                      {getSubLabel(selectedMobileUser)}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedMobileUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Credential & Details Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-3 my-4">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Email Akun</span>
                <p className="text-xs font-bold text-slate-800 font-sans">{selectedMobileUser.email}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Password Akun</span>
                  <p className="text-xs font-mono font-bold text-slate-800">
                    {selectedMobileUser.plainPassword || 'DARUSYIFA123'}
                  </p>
                </div>
                <button 
                  onClick={(e) => handleCopyPassword(selectedMobileUser.plainPassword || 'DARUSYIFA123', selectedMobileUser.id, e)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 flex items-center gap-1 shadow-2xs"
                >
                  {copiedId === selectedMobileUser.id ? <Check size={12} className="text-emerald-600" /> : <Key size={12} />}
                  <span>{copiedId === selectedMobileUser.id ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Akses</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold">
                    Web Desktop
                  </span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-bold">
                    Mobile PWA
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-2 pt-2">
              <button 
                onClick={() => {
                  setEditingUser(selectedMobileUser);
                  setShowEditUser(true);
                  setSelectedMobileUser(null);
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Edit size={15} />
                <span>Edit Pengguna</span>
              </button>

              <button 
                onClick={() => {
                  setUserToReset(selectedMobileUser);
                  setShowResetPassword(true);
                  setSelectedMobileUser(null);
                }}
                className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Key size={15} />
                <span>Reset Password</span>
              </button>

              <button 
                onClick={() => {
                  setUserToDelete(selectedMobileUser);
                  setShowDeleteConfirm(true);
                  setSelectedMobileUser(null);
                }}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 size={15} />
                <span>Hapus Pengguna</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
