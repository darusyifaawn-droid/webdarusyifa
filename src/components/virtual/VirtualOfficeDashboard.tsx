/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VirtualOfficeDashboard.tsx
 * High-fidelity Virtual Office RA Darusyifa Command Center.
 * Recreates the exact layout from the user reference:
 * - Real 3D cutaway isometric building with interactive floating room pills
 * - Left navigation sidebar with RA Darusyifa logo & school address
 * - Top search bar, date chip, notification badge, and Super Admin profile
 * - 6 Bottom KPI metric cards with colored icon boxes & trend badges
 * - Right panel with Pusat Pemantauan Admin & Status Agen
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  voRepository, 
  RoomEntity, 
  AgentEntity, 
  TaskItem, 
  ActivityFeedItem, 
  NotificationItem, 
  AuditLogItem 
} from './VirtualOfficeRepository';
import { VirtualOffice3DBuilding } from './VirtualOffice3DBuilding';
import { 
  RoomDetailModal, 
  AgentDetailModal, 
  NewTaskModal, 
  AIAssistantModal, 
  ActivityDetailModal,
  ActivityCenterModal 
} from './VirtualOfficeModals';
import { 
  Home, 
  Building2, 
  Users, 
  BookOpen, 
  FileText, 
  Calendar, 
  Bookmark, 
  Megaphone, 
  BarChart3, 
  Settings, 
  Search, 
  Bell, 
  ChevronDown, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  GraduationCap, 
  Wallet, 
  Radio, 
  CreditCard, 
  UserCheck, 
  Sparkles, 
  RotateCcw,
  Menu,
  X
} from 'lucide-react';

export default function VirtualOfficeDashboard() {
  const navigate = useNavigate();

  // Navigation state
  const [activeNav, setActiveNav] = useState<string>('virtual_office');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isActivityOpen, setIsActivityOpen] = useState<boolean>(false);
  const [activityLimit, setActivityLimit] = useState<number>(6);

  // Repository data state
  const [rooms, setRooms] = useState<RoomEntity[]>([]);
  const [agents, setAgents] = useState<AgentEntity[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>('room_komando');
  const [activeModalRoom, setActiveModalRoom] = useState<RoomEntity | null>(null);
  const [activeModalAgent, setActiveModalAgent] = useState<AgentEntity | null>(null);
  const [activeModalActivity, setActiveModalActivity] = useState<ActivityFeedItem | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState<boolean>(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);

  // Sync with repository
  useEffect(() => {
    const updateLocalState = () => {
      setRooms(voRepository.getRooms());
      setAgents(voRepository.getAgents());
      setTasks(voRepository.getTasks());
      const acts = voRepository.getActivities();
      setActivities(acts.length > 0 ? acts : voRepository.getActivities());
      setNotifications(voRepository.getNotifications());
      setAuditLogs(voRepository.getAuditLogs());
    };

    updateLocalState();
    const unsubscribe = voRepository.subscribe(updateLocalState);
    return () => unsubscribe();
  }, []);

  const handleNavClick = (navId: string, tab?: string) => {
    setActiveNav(navId);
    setIsMobileSidebarOpen(false);
    if (navId === 'virtual_office') return;
    if (navId === 'dashboard') {
      navigate('/admin-dashboard', { state: { defaultTab: 'overview' } });
    } else if (navId === 'ai_assistant') {
      setIsAIModalOpen(true);
    } else if (navId === 'activity') {
      setIsActivityOpen(true);
    } else {
      navigate('/admin-dashboard', { state: { defaultTab: tab || navId } });
    }
  };

  const kpis = useMemo(() => voRepository.getKPISummary(), [agents, tasks, rooms]);

  // Handle module transition
  const handleEnterModule = (tab: string) => {
    if (tab === 'ai-assistant') {
      setIsAIModalOpen(true);
    } else {
      navigate('/admin-dashboard', { state: { defaultTab: tab } });
    }
  };

  const handleTriggerSimulation = (type: 'hafalan' | 'finance' | 'announcement' | 'attendance') => {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
    if (type === 'hafalan') {
      voRepository.addActivity(
        'agt_h3',
        'Ustadzah Syarifah Habasyiyah',
        'HUMAN',
        'room_hafalan',
        'Ruang Hafalan',
        'Guru memeriksa hafalan Surah Al-Humazah santri',
        'Sukses',
        `Pemeriksaan kelancaran tajwid santri kelompok A jam ${timeStr}`
      );
    } else if (type === 'finance') {
      voRepository.addActivity(
        'agt_h5',
        'Syarifah Habasyiyah',
        'HUMAN',
        'room_bendahara',
        'Ruang Bendahara',
        'Bendahara memvalidasi pembayaran SPP santri',
        'Sukses',
        `Verifikasi mutasi rekening masuk Rp 120.000 jam ${timeStr}`
      );
    } else if (type === 'announcement') {
      voRepository.addActivity(
        'agt_h6',
        "Marfu'ah",
        'HUMAN',
        'room_pengumuman',
        'Studio Pengumuman',
        'Agen Pengumuman menerbitkan info kegiatan madrasah',
        'Sukses',
        `Siaran kalender akademik ke grup wali murid jam ${timeStr}`
      );
    } else if (type === 'attendance') {
      voRepository.addActivity(
        'agt_h8',
        'Kelas A - Umar bin Khattab',
        'HUMAN',
        'room_siswa',
        'Area Siswa & Absensi',
        'Siswa melakukan absensi kehadiran digital',
        'Sukses',
        `Pencatatan barcode kehadiran santri pagi jam ${timeStr}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] text-slate-800 flex font-sans antialiased">
      {/* ========================================================
          1. LEFT SIDEBAR (Matching User Reference)
          ======================================================== */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-[240px] bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-xs md:shadow-none
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col">
          {/* Logo & School Motto Header */}
          <div className="p-5 pb-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-100 bg-emerald-50 flex items-center justify-center shrink-0">
                <img src="/logo_ra.jpeg" alt="RA Darusyifa" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none mb-0.5">
                  RA Darusyifa
                </h1>
                <p className="text-[10px] font-black tracking-wider text-slate-500 uppercase leading-none mb-1">
                  ARJAWINANGUN
                </p>
                <p className="text-[9px] font-medium text-emerald-600 leading-none">
                  Cerdas • Sholeh • Berakhlak
                </p>
              </div>
            </div>

            {/* Mobile close */}
            <button 
              onClick={() => setIsMobileSidebarOpen(false)} 
              className="md:hidden p-1 text-slate-400 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1 text-xs font-semibold text-slate-600">
            {/* Dashboard */}
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === 'dashboard' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Home size={17} className={activeNav === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>Dashboard</span>
            </button>

            {/* Virtual Office (ACTIVE FILLED GREEN PILL) */}
            <button
              onClick={() => handleNavClick('virtual_office')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === 'virtual_office' 
                  ? 'bg-[#0F9E66] text-white font-bold shadow-xs' 
                  : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Building2 size={17} className={activeNav === 'virtual_office' ? 'text-white' : 'text-slate-400'} />
              <span>Virtual Office</span>
            </button>

            {/* User Management */}
            <button
              onClick={() => handleNavClick('users')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === 'users' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users size={17} className={activeNav === 'users' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>User Management</span>
            </button>

            {/* Akademik & Rapor */}
            <button
              onClick={() => handleNavClick('academic')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === 'academic' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BookOpen size={17} className={activeNav === 'academic' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>Akademik & Rapor</span>
            </button>

            {/* Administrasi */}
            <button
              onClick={() => handleNavClick('administrasi')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === 'administrasi' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FileText size={17} className={activeNav === 'administrasi' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>Administrasi</span>
            </button>

            {/* Absensi */}
            <button
              onClick={() => handleNavClick('attendance')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === 'attendance' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Calendar size={17} className={activeNav === 'attendance' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>Absensi</span>
            </button>

            {/* Hafalan Siswa */}
            <button
              onClick={() => handleNavClick('hafalan')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === 'hafalan' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Bookmark size={17} className={activeNav === 'hafalan' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>Hafalan Siswa</span>
            </button>

            {/* Pengumuman */}
            <button
              onClick={() => handleNavClick('announcements')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === 'announcements' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Megaphone size={17} className={activeNav === 'announcements' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>Pengumuman</span>
            </button>

            {/* Laporan */}
            <button
              onClick={() => handleNavClick('reports')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === 'reports' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BarChart3 size={17} className={activeNav === 'reports' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>Laporan</span>
            </button>

            {/* Pengaturan */}
            <button
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === 'settings' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings size={17} className={activeNav === 'settings' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>Pengaturan</span>
            </button>
          </nav>
        </div>

        {/* Bottom School Address Info Card */}
        <div className="p-4 m-3 bg-[#F8FAFC] border border-slate-200/70 rounded-2xl">
          <div className="flex items-start gap-2.5">
            <Home size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-tight text-slate-600">
              <strong className="block text-slate-800 font-bold mb-1">
                RA Darusyifa Arjawinangun
              </strong>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Perumahan Grand AWN, Jl. Grand Awn Blok Telar Baru RT 004/RW 014, Arjawinangun, Cirebon 45162
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================
          2. MAIN CONTENT AREA (Header + Center + Right Panel)
          ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Search & Profile Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3 flex items-center justify-between gap-4 shadow-2xs">
          {/* Left: Mobile Toggle & Search input */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setIsMobileSidebarOpen(o => !o)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl"
            >
              <Menu size={20} />
            </button>

            <div className="relative w-full">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari siswa, NISN, nama, atau fitur..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F9E66]"
              />
            </div>
          </div>

          {/* Right: Date, Notifications, Profile */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Calendar size={15} className="text-slate-400" />
              <span>Jumat, 9 Oktober 2026</span>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setIsActivityOpen(o => !o)}
              className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Notifikasi"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center shadow-2xs">
                3
              </span>
            </button>

            {/* Super Admin Profile Chip */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-slate-900 overflow-hidden flex items-center justify-center text-white font-bold text-xs shadow-2xs">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" 
                  alt="Super Admin"
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-black text-slate-900 leading-tight">SUPER ADMIN</div>
                <div className="text-[10px] text-slate-500 font-medium">RA Darusyifa</div>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden lg:block" />
            </div>
          </div>
        </header>

        {/* Dashboard Grid Container: Main Stage + Right Panel */}
        <div className="p-4 md:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* ====================================================
              LEFT & CENTER WORKSPACE (xl:col-span-8 or 9)
              ==================================================== */}
          <div className="xl:col-span-8 2xl:col-span-9 space-y-6">
            {/* 1. TITLE & ACTION CARD */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F8F0] text-[#0F9E66] flex items-center justify-center shadow-2xs">
                  <Building2 size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Virtual Office RA Darusyifa
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Pantau aktivitas seluruh agen dalam satu ruang kendali.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsActivityOpen(true)}
                  className="px-4 py-2 bg-white hover:bg-emerald-50 text-[#0F9E66] border border-[#0F9E66] rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95"
                >
                  <Eye size={14} />
                  <span>Lihat Aktivitas ({activities.length})</span>
                </button>

                <button
                  onClick={() => {
                    if (selectedRoomId) {
                      const r = rooms.find(room => room.id === selectedRoomId);
                      if (r) setActiveModalRoom(r);
                    }
                  }}
                  className="px-4 py-2 bg-[#0F9E66] hover:bg-[#0c8a58] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                >
                  <Building2 size={14} />
                  <span>Buka Ruang</span>
                </button>
              </div>
            </div>

            {/* 2. REAL 3D ISOMETRIC BUILDING VIEWER */}
            <VirtualOffice3DBuilding
              rooms={rooms}
              agents={agents}
              selectedRoomId={selectedRoomId}
              onSelectRoom={(roomId) => {
                setSelectedRoomId(roomId);
                const found = rooms.find(r => r.id === roomId);
                if (found) setActiveModalRoom(found);
              }}
              onEnterRoomModule={(roomId) => {
                const r = rooms.find(room => room.id === roomId);
                if (r) handleEnterModule(r.linkedModuleTab);
              }}
            />

            {/* 3. BOTTOM 6 KPI METRICS CARDS (Matching Screenshot Exactly) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {/* Card 1: Agen Aktif */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#E8F8F0] text-[#0F9E66] flex items-center justify-center">
                    <Users size={16} />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-0.5">Agen Aktif</span>
                  <div className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">
                    {kpis.onlineAgents}/{kpis.totalAgents}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mb-2">
                    dari total {kpis.totalAgents} agen
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <TrendingUp size={11} />
                    <span>0%</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Guru Mengajar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#EBF5FF] text-[#2563EB] flex items-center justify-center">
                    <GraduationCap size={16} />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-0.5">Guru Mengajar</span>
                  <div className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">
                    {kpis.teachingTeachers}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mb-2">
                    dari 4 guru
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                    <span>→ 0%</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Siswa Hadir */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center">
                    <Building2 size={16} />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-0.5">Siswa Hadir</span>
                  <div className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">
                    {kpis.presentStudents}/{kpis.totalStudents}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mb-2">
                    dari total {kpis.totalStudents} siswa
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <TrendingUp size={11} />
                    <span>5%</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Hafalan Diperiksa */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                    <Bookmark size={16} />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-0.5">Hafalan Diperiksa</span>
                  <div className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">
                    {kpis.hafalanVerified}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mb-2">
                    dari total {kpis.totalStudents} siswa
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <TrendingUp size={11} />
                    <span>12%</span>
                  </div>
                </div>
              </div>

              {/* Card 5: Pengumuman Aktif */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FCE7F3] text-[#DB2777] flex items-center justify-center">
                    <Megaphone size={16} />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-0.5">Pengumuman Aktif</span>
                  <div className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">
                    {kpis.activeAnnouncements}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mb-2">
                    dari total {kpis.totalAnnouncements}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <TrendingUp size={11} />
                    <span>0%</span>
                  </div>
                </div>
              </div>

              {/* Card 6: Transaksi Menunggu */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#CCFBF1] text-[#0D9488] flex items-center justify-center">
                    <Wallet size={16} />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-0.5">Transaksi Menunggu</span>
                  <div className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">
                    {kpis.pendingValidations}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mb-2">
                    dari total {kpis.totalValidations}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-rose-500">
                    <TrendingDown size={11} />
                    <span>17%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================
              RIGHT MONITORING PANEL (xl:col-span-4 or 3)
              ==================================================== */}
          <div className="xl:col-span-4 2xl:col-span-3 space-y-6">
            {/* Card 1: Pusat Pemantauan Admin */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E8F8F0] text-[#0F9E66] flex items-center justify-center shrink-0">
                    <Radio size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                      Pusat Pemantauan Admin
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Aktivitas terbaru dari seluruh agen.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsActivityOpen(true)}
                  className="text-[11px] font-bold text-[#0F9E66] hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
                >
                  <span>Lihat Semua ({activities.length})</span>
                </button>
              </div>

              {/* Activity List */}
              <div className="space-y-4 pt-1">
                {activities.length === 0 ? (
                  <div className="text-center py-6 space-y-2.5 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500 font-medium">Belum ada aktivitas baru hari ini.</p>
                    <button
                      onClick={() => voRepository.resetToDefaults()}
                      className="px-3.5 py-1.5 bg-[#0F9E66] hover:bg-[#0c8a58] text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                    >
                      Muat Aktivitas Demo
                    </button>
                  </div>
                ) : (
                  <>
                    {activities.slice(0, activityLimit).map((act) => {
                      // Icon according to activity
                      let iconBg = 'bg-[#E8F8F0] text-[#0F9E66]';
                      let icon = <Bookmark size={15} />;
                      if (act.activity.includes('pembayaran') || act.activity.includes('SPP')) {
                        iconBg = 'bg-[#EBF5FF] text-[#2563EB]';
                        icon = <CreditCard size={15} />;
                      } else if (act.activity.includes('Pengumuman') || act.activity.includes('agenda')) {
                        iconBg = 'bg-[#F3E8FF] text-[#9333EA]';
                        icon = <Megaphone size={15} />;
                      } else if (act.activity.includes('absensi') || act.activity.includes('siswa')) {
                        iconBg = 'bg-[#FEF3C7] text-[#D97706]';
                        icon = <Users size={15} />;
                      } else if (act.agentType === 'AI') {
                        iconBg = 'bg-[#E0F2FE] text-[#0284C7]';
                        icon = <Sparkles size={15} />;
                      }

                      return (
                        <div
                          key={act.id}
                          onClick={() => setActiveModalActivity(act)}
                          className="flex items-start justify-between gap-3 cursor-pointer group p-1.5 rounded-xl hover:bg-slate-50 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}>
                              {icon}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0F9E66] transition-colors leading-tight">
                                {act.activity}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                {act.agentName} ({act.roomName})
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                            {act.timestamp}
                          </span>
                        </div>
                      );
                    })}

                    {activities.length > 6 && (
                      <button
                        onClick={() => setActivityLimit(l => l === 6 ? activities.length : 6)}
                        className="w-full py-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-xl text-xs font-bold transition-all text-center border border-slate-200/80 cursor-pointer"
                      >
                        {activityLimit === 6 ? `Tampilkan Semua (${activities.length} Aktivitas)` : 'Tampilkan Lebih Sedikit'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Card 2: Status Agen */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-start gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-[#E8F8F0] text-[#0F9E66] flex items-center justify-center shrink-0">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                    Status Agen
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Daftar agen yang sedang aktif.
                  </p>
                </div>
              </div>

              {/* Agents List matching screenshot */}
              <div className="space-y-3.5 pt-1">
                {[
                  {
                    name: 'Admin & Operator',
                    person: 'M. Nugi Andri, S.H',
                    status: '• Online',
                    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'
                  },
                  {
                    name: 'Guru',
                    person: '4 Agen',
                    status: '• 4 Online',
                    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80'
                  },
                  {
                    name: 'Bendahara',
                    person: 'Syarifah Habasyiyah',
                    status: '• Online',
                    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=80&q=80'
                  },
                  {
                    name: 'Agen Pengumuman',
                    person: "Marfu'ah",
                    status: '• Online',
                    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=80&q=80'
                  },
                  {
                    name: 'Agen Hafalan',
                    person: 'Hulalul Anbiyaa, S.Pd',
                    status: '• Online',
                    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80'
                  },
                  {
                    name: 'Siswa',
                    person: '42 Siswa',
                    status: '• 42 Hadir',
                    isGroup: true
                  }
                ].map((agentItem, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                        {agentItem.isGroup ? (
                          <div className="w-full h-full bg-[#E8F8F0] text-[#0F9E66] flex items-center justify-center font-bold text-xs">
                            <Users size={14} />
                          </div>
                        ) : (
                          <img src={agentItem.avatarUrl} alt={agentItem.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {agentItem.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {agentItem.person}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{agentItem.status.replace('•', '').trim()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODALS & DRAWERS
          ======================================================== */}
      {activeModalRoom && (
        <RoomDetailModal
          room={activeModalRoom}
          agents={agents}
          tasks={tasks}
          onClose={() => setActiveModalRoom(null)}
          onSelectAgent={(agentId) => {
            const agt = agents.find(a => a.id === agentId);
            if (agt) {
              setActiveModalRoom(null);
              setActiveModalAgent(agt);
            }
          }}
          onEnterModule={(tab) => {
            setActiveModalRoom(null);
            handleEnterModule(tab);
          }}
          onOpenNewTask={(roomId) => {
            setActiveModalRoom(null);
            setIsNewTaskModalOpen(true);
          }}
        />
      )}

      {activeModalAgent && (
        <AgentDetailModal
          agent={activeModalAgent}
          rooms={rooms}
          tasks={tasks}
          onClose={() => setActiveModalAgent(null)}
          onOpenNewTask={() => {
            setActiveModalAgent(null);
            setIsNewTaskModalOpen(true);
          }}
          onOpenAIAction={() => {
            setActiveModalAgent(null);
            setIsAIModalOpen(true);
          }}
        />
      )}

      {isNewTaskModalOpen && (
        <NewTaskModal
          rooms={rooms}
          agents={agents}
          defaultRoomId={selectedRoomId || undefined}
          onClose={() => setIsNewTaskModalOpen(false)}
        />
      )}

      {isAIModalOpen && (
        <AIAssistantModal
          onClose={() => setIsAIModalOpen(false)}
        />
      )}

      {activeModalActivity && (
        <ActivityDetailModal
          activity={activeModalActivity}
          onClose={() => setActiveModalActivity(null)}
        />
      )}

      {/* Activity Center Modal (Opens on Lihat Aktivitas click) */}
      {isActivityOpen && (
        <ActivityCenterModal
          activities={activities}
          onClose={() => setIsActivityOpen(false)}
          onSelectActivity={(act) => {
            setActiveModalActivity(act);
          }}
          onTriggerSimulation={handleTriggerSimulation}
          onResetActivities={() => voRepository.resetToDefaults()}
        />
      )}
    </div>
  );
}
