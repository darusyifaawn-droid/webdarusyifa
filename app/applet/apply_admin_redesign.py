import re

with open('src/components/DashboardAdmin.tsx') as f:
    text = f.read()

# 1. Update lucide & recharts imports if needed
imports_code = """import { 
  Users, Shield, Plus, Trash2, Edit, BarChart, Bell, LogOut, User, Download, 
  CreditCard, Megaphone, X, Menu, Settings, Image as ImageIcon, Key, Upload, 
  CheckCircle, Camera, TrendingUp, BookOpen, Clock, Printer, FileText, AlertCircle, 
  RefreshCw, Calendar, Save, Trophy, Star, GraduationCap, ChevronDown, ChevronUp, 
  ChevronRight, ArrowRight, ArrowLeft, Search, PlusCircle, History as HistoryIcon, 
  ExternalLink, Sun, Moon, Wallet, QrCode, Scan, Home, LayoutDashboard, Check, 
  Sparkles, Layers
} from 'lucide-react';"""

text = re.sub(
    r"import\s*\{[^}]+\}\s*from\s*['\"]lucide-react['\"];",
    imports_code,
    text,
    count=1
)

# 2. Replace NavItems and Sidebar
navitems_start = text.find('const NavItems = () => (')
aside_end = text.find('</aside>', navitems_start)

if navitems_start == -1 or aside_end == -1:
    print('Failed to find NavItems or aside!')
    exit(1)

new_nav_and_aside = '''const NavItems = () => {
    const pendingCount = payments.filter(p => p.status === 'pending').length;
    const isFinanceActive = activeTab === 'finance';

    return (
      <nav className="space-y-4 flex-1 text-slate-600">
        {/* Primary Dashboard item */}
        <div>
          <button
            onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Home size={18} className={activeTab === 'overview' ? 'text-white' : 'text-slate-400'} />
            <span className="tracking-tight text-xs">Dashboard</span>
          </button>
        </div>

        {/* Group: Data & Informasi */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
            Data & Informasi
          </p>

          {[
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'academic', label: 'Akademik & Rapor', icon: BookOpen },
            { id: 'hafalan', label: 'Modul Hafalan', icon: Star },
            { id: 'finance', label: 'Administrasi', icon: CreditCard, hasSub: true },
            { id: 'finance-arus', label: 'Arus Keuangan', icon: TrendingUp },
            { id: 'attendance', label: 'Absensi', icon: CheckCircle },
            { id: 'calendar', label: 'Kalender Pendidikan', icon: Calendar },
            { id: 'achievements', label: 'Siswa Berprestasi', icon: Trophy },
          ].map((item) => {
            if (item.id === 'finance') {
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                      setActiveTab('finance');
                      setFinanceSubTab('dashboard');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all font-bold text-xs cursor-pointer group ${
                      isFinanceActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <item.icon size={18} className={isFinanceActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600 transition-colors'} />
                      <span className="tracking-tight text-xs">{item.label}</span>
                    </div>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isFinanceActive ? 'rotate-180 text-white' : 'text-slate-400'}`} />
                  </button>

                  {isFinanceActive && (
                    <div className="pl-4 pr-1 py-1 space-y-1 animate-in fade-in duration-200">
                      {[
                        { id: 'dashboard', label: 'Dashboard Administrasi', isDot: true },
                        { id: 'grup', label: 'Transaksi & Pembayaran' },
                        { id: 'tabungan', label: 'Tabungan Siswa', onClick: () => setShowTabunganModal(true) },
                        { id: 'penetapan', label: 'Penagihan Iuran' },
                        { id: 'validasi', label: 'Validasi Pembayaran', count: pendingCount },
                        { id: 'riwayat', label: 'Arsip Transaksi' },
                        { id: 'laporan', label: 'Laporan Keuangan' },
                        { id: 'setelan', label: 'Pengaturan Administrasi' },
                      ].map((sub) => {
                        const isSubActive = (sub.id === 'tabungan' ? showTabunganModal : financeSubTab === sub.id);
                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              if (sub.onClick) {
                                sub.onClick();
                              } else {
                                setFinanceSubTab(sub.id as any);
                              }
                              setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                              isSubActive
                                ? 'bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {sub.isDot ? (
                                <span className={`w-2 h-2 rounded-full ${financeSubTab === 'dashboard' ? 'bg-emerald-500' : 'bg-transparent'} shrink-0`} />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                              )}
                              <span className="truncate">{sub.label}</span>
                            </div>
                            {sub.count && sub.count > 0 ? (
                              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full leading-none">
                                {sub.count}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl transition-all font-bold text-xs cursor-pointer group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600 transition-colors'} />
                <span className="tracking-tight text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Group: Lainnya */}
        <div className="space-y-1 pt-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
            Lainnya
          </p>

          {[
            { id: 'announcements', label: 'Pengumuman', icon: Megaphone },
            { id: 'profile', label: 'Profil Admin', icon: User },
            { id: 'settings', label: 'Pengaturan', icon: Settings },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl transition-all font-bold text-xs cursor-pointer group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600 transition-colors'} />
                <span className="tracking-tight text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row pb-20 md:pb-0 relative font-sans text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Sidebar (Desktop) */}
      <aside className="w-64 bg-white border-r border-slate-100 p-5 hidden md:flex flex-col shadow-xs z-30 transition-colors duration-300 shrink-0">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="w-10 h-10 overflow-hidden rounded-2xl border border-emerald-600/10 p-0.5 bg-white shadow-xs flex items-center justify-center shrink-0">
            <img 
              src="/logo_ra.jpeg" 
              alt="Logo Resmi RA Darusyifa" 
              className="w-full h-full object-contain" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <div>
            <h1 className="font-display font-black text-slate-900 leading-none tracking-tight text-sm">RA Darusyifa</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-none">ARJAWINANGUN</p>
          </div>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-2 custom-scrollbar">
          <NavItems />
        </div>

        {/* Active Account Profile Footer */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400 font-bold tracking-wider">AKUN AKTIF</span>
          </div>

          <div 
            onClick={() => setActiveTab('profile')}
            className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 flex items-center justify-between cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  <img src="/logo_ra.jpeg" alt="Admin" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                  Admin RA
                </h4>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  {user?.email || 'darusyifa.awn@gmail.com'}
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </div>
      </aside>'''

text = text[:navitems_start] + new_nav_and_aside + text[aside_end+8:]

# 3. Update Mobile Bottom Navigation Bar & Sheet
bottom_bar_start = text.find('{/* Bottom Navigation Bar (Mobile) */}')
main_content_start = text.find('{/* Main Content */}')

if bottom_bar_start != -1 and main_content_start != -1:
    new_mobile_nav = '''{/* Bottom Navigation Bar (Mobile) */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-8px_25px_rgba(0,0,0,0.05)] flex justify-around items-center py-2 px-3 z-[100]"
        style={{ WebkitBackdropFilter: 'blur(16px)' }}
      >
        {/* Beranda */}
        <button
          onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all cursor-pointer ${
            activeTab === 'overview' ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home size={20} className={activeTab === 'overview' ? 'text-emerald-600' : 'text-slate-400'} />
          <span className="text-[10px] tracking-tight">Beranda</span>
        </button>

        {/* Transaksi */}
        <button
          onClick={() => { setActiveTab('finance'); setFinanceSubTab('grup'); setIsSidebarOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all cursor-pointer ${
            activeTab === 'finance' ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <CreditCard size={20} className={activeTab === 'finance' ? 'text-emerald-600' : 'text-slate-400'} />
          <span className="text-[10px] tracking-tight">Transaksi</span>
        </button>

        {/* Center Elevated Scan/QR button */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={() => { setShowTabunganModal(true); }}
            className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 border-4 border-white active:scale-95 transition-transform cursor-pointer"
            title="Scan / Tabungan"
          >
            <QrCode size={22} />
          </button>
        </div>

        {/* Notifikasi */}
        <button
          onClick={() => { setActiveTab('announcements'); setIsSidebarOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all relative cursor-pointer ${
            activeTab === 'announcements' ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <Bell size={20} className={activeTab === 'announcements' ? 'text-emerald-600' : 'text-slate-400'} />
            {payments.filter(p => p.status === 'pending').length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Notifikasi</span>
        </button>

        {/* Profil */}
        <button
          onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all cursor-pointer ${
            activeTab === 'profile' ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User size={20} className={activeTab === 'profile' ? 'text-emerald-600' : 'text-slate-400'} />
          <span className="text-[10px] tracking-tight">Profil</span>
        </button>
      </div>

      {/* Mobile Bottom Sheet Menu */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[90] md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed bottom-0 inset-x-0 bg-white rounded-t-[2.5rem] shadow-2xl p-6 z-[100] md:hidden max-h-[85vh] flex flex-col border-t border-slate-100"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 overflow-hidden rounded-xl border-2 border-emerald-600/10 p-0.5 bg-white shadow-xs flex items-center justify-center">
                    <img 
                      src="/logo_ra.jpeg" 
                      alt="Logo Resmi" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <div>
                    <h2 className="font-display font-black text-slate-800 text-sm">RA Darusyifa</h2>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">ARJAWINANGUN</p>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 p-1 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { id: 'overview', label: 'Dashboard', icon: Home },
                    { id: 'users', label: 'User Management', icon: Users },
                    { id: 'academic', label: 'Akademik & Rapor', icon: BookOpen },
                    { id: 'hafalan', label: 'Modul Hafalan', icon: Star },
                    { id: 'finance', label: 'Administrasi', icon: CreditCard },
                    { id: 'finance-arus', label: 'Arus Keuangan', icon: TrendingUp },
                    { id: 'attendance', label: 'Absensi', icon: CheckCircle },
                    { id: 'calendar', label: 'Kalender Pendidikan', icon: Calendar },
                    { id: 'achievements', label: 'Siswa Berprestasi', icon: Trophy },
                    { id: 'announcements', label: 'Pengumuman', icon: Megaphone },
                    { id: 'profile', label: 'Profil Admin', icon: User },
                    { id: 'settings', label: 'Pengaturan', icon: Settings },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setIsSidebarOpen(false);
                      }}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        activeTab === item.id
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600 font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <item.icon size={20} className={activeTab === item.id ? 'text-emerald-600' : 'text-slate-400'} />
                      <span className="text-xs font-bold tracking-tight leading-tight">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-auto">
                <button 
                  onClick={async () => {
                    await auth.signOut();
                    navigate('/login');
                  }}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-all text-sm cursor-pointer"
                >
                  <LogOut size={18} />
                  <span>Keluar Sesi</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>'''
    text = text[:bottom_bar_start] + new_mobile_nav + text[main_content_start:]

# 4. Update Desktop Header & Mobile Header
main_tag_start = text.find('<main className="flex-1 min-h-screen')
overview_start = text.find("{activeTab === 'overview' && (", main_tag_start)

if main_tag_start != -1 and overview_start != -1:
    new_headers = '''<main className="flex-1 min-h-screen relative overflow-y-auto scrolling-touch flex flex-col bg-[#f8fafc]">
        {/* Desktop & Tablet Top Header Bar */}
        <header className="bg-white border-b border-slate-100 px-6 lg:px-10 py-3.5 hidden md:flex items-center justify-between sticky top-0 z-20 shadow-xs">
          {/* Search Bar */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Cari siswa, NISN, atau transaksi..."
              value={globalSearchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setGlobalSearchQuery(val);
                setFilterFinanceStudentName(val);
                setFilterName(val);
              }}
              className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Right Controls: Date, Bell, Profile */}
          <div className="flex items-center gap-6">
            {/* Date Display */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <Calendar size={15} className="text-slate-400" />
              <span>
                {(() => {
                  try {
                    return new Intl.DateTimeFormat('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }).format(new Date());
                  } catch (e) {
                    return 'Selasa, 18 Agustus 2026';
                  }
                })()}
              </span>
            </div>

            {/* Notification Bell */}
            <button 
              onClick={() => {
                if (payments.filter(p => p.status === 'pending').length > 0) {
                  setActiveTab('finance');
                  setFinanceSubTab('validasi');
                } else {
                  setActiveTab('announcements');
                }
              }}
              className="relative p-2.5 text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer"
              title="Notifikasi"
            >
              <Bell size={19} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
            </button>

            {/* Profile Chip */}
            <div 
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-3 pl-4 border-l border-slate-100 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  <img src="/logo_ra.jpeg" alt="Admin" className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Admin RA
                </h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  SUPER ADMIN
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Header (matches mobile mockup) */}
        <div className="md:hidden bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-[100] shadow-xs">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            title="Menu"
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 overflow-hidden rounded-xl border border-emerald-600/10 p-0.5 bg-white shadow-xs flex items-center justify-center">
              <img 
                src="/logo_ra.jpeg" 
                alt="Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="text-center">
              <h2 className="font-display font-black text-slate-900 tracking-tight text-xs leading-none">RA Darusyifa</h2>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 leading-none">ARJAWINANGUN</p>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('announcements')}
            className="relative p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            title="Notifikasi"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </button>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pb-32 md:pb-12 flex-1 w-full">
          '''
    text = text[:main_tag_start] + new_headers + text[overview_start:]

# 5. Replace {activeTab === 'overview' && ( ... )} block
overview_start = text.find("{activeTab === 'overview' && (")
users_tab_start = text.find("{activeTab === 'users' && (", overview_start)

if overview_start == -1 or users_tab_start == -1:
    print('Failed to find overview or users tab boundary!')
    exit(1)

new_overview_block = '''{activeTab === 'overview' && (
            <div className="space-y-6 pb-24 md:pb-0 animate-in fade-in duration-300">
              {/* 1. Welcome Hero Banner */}
              <div className="bg-gradient-to-r from-emerald-50/90 via-emerald-50/70 to-emerald-100/50 border border-emerald-100/80 rounded-3xl p-6 sm:p-7 md:p-8 relative overflow-hidden shadow-xs">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                  <div className="max-w-xl">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                      Assalamu'alaikum, <span className="text-emerald-700">Admin RA</span> 👋
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 leading-relaxed">
                      Selamat datang di Portal RA Darusyifa Arjawinangun<br className="hidden sm:inline" />
                      Kelola sekolah dengan mudah dan menyenangkan.
                    </p>
                  </div>

                  {/* Mosque Artwork Vector Banner */}
                  <div className="w-full md:w-80 h-32 sm:h-36 md:h-28 rounded-2xl overflow-hidden shadow-xs border border-emerald-200/50 shrink-0 bg-emerald-100/30">
                    <img 
                      src="/mosque_banner.jpg" 
                      alt="Ilustrasi RA Darusyifa" 
                      className="w-full h-full object-cover object-center" 
                    />
                  </div>
                </div>
              </div>

              {/* 2. Top Stats Cards Grid (4 cards, 2x2 on mobile, 4 on desktop) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                {/* Jumlah Siswa */}
                <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between hover:border-emerald-200 transition-all group">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-500">Jumlah Siswa</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight mt-1">
                      {allUsers.filter(u => u.role === 'siswa' && (u.status || 'Aktif') === 'Aktif').length || 56}
                    </h3>
                    <p className="text-[10px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5">
                      <span>+3 dari bulan lalu</span>
                    </p>
                  </div>
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Users size={22} />
                  </div>
                </div>

                {/* Jumlah Kelas */}
                <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between hover:border-blue-200 transition-all group">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-500">Jumlah Kelas</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight mt-1">
                      {schoolClasses.length || 2}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">
                      Aktif tahun ini
                    </p>
                  </div>
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <GraduationCap size={22} />
                  </div>
                </div>

                {/* Total Tabungan */}
                <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between hover:border-amber-200 transition-all group">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-500">Total Tabungan</p>
                    <h3 className="text-base sm:text-lg md:text-xl font-black text-amber-500 tracking-tight mt-1 truncate">
                      Rp {displayTotalTabungan > 0 ? displayTotalTabungan.toLocaleString('id-ID') : '18.799.000'}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">
                      Saldo keseluruhan
                    </p>
                  </div>
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Wallet size={22} />
                  </div>
                </div>

                {/* Total Tunggakan */}
                <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between hover:border-rose-200 transition-all group">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-500">Total Tunggakan</p>
                    <h3 className="text-base sm:text-lg md:text-xl font-black text-rose-500 tracking-tight mt-1 truncate">
                      Rp {displayTotalTunggakan > 0 ? displayTotalTunggakan.toLocaleString('id-ID') : '9.299.000'}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">
                      Tagihan berjalan
                    </p>
                  </div>
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText size={22} />
                  </div>
                </div>
              </div>

              {/* 3. Middle Section: Menu Utama & Pengumuman Terbaru (2 Columns) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Menu Utama Container */}
                <div className="lg:col-span-6 xl:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">Menu Utama</h3>
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="md:hidden text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    >
                      Lihat semua
                    </button>
                  </div>

                  {/* 4-column Grid of 12 app actions */}
                  <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 mb-4">
                    {[
                      { label: 'Kelas', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', action: () => setActiveTab('academic') },
                      { label: 'Hafalan', icon: Star, color: 'text-amber-500 bg-amber-50 border-amber-100', action: () => setActiveTab('hafalan') },
                      { label: 'Siswa', icon: Users, color: 'text-purple-600 bg-purple-50 border-purple-100', action: () => { setActiveTab('users'); setFilterUserRole('siswa'); } },
                      { label: 'Absensi', icon: CheckCircle, color: 'text-teal-600 bg-teal-50 border-teal-100', action: () => setActiveTab('attendance') },
                      { label: 'Kaldik', icon: Calendar, color: 'text-rose-500 bg-rose-50 border-rose-100', action: () => setActiveTab('calendar') },
                      { label: 'Materi', icon: BookOpen, color: 'text-blue-500 bg-blue-50 border-blue-100', action: () => setActiveTab('materials') },
                      { label: 'Rank', icon: Trophy, color: 'text-amber-600 bg-amber-50 border-amber-100', action: () => setActiveTab('achievements') },
                      { label: 'Nilai', icon: TrendingUp, color: 'text-sky-600 bg-sky-50 border-sky-100', action: () => setActiveTab('assessments') },
                      { label: 'Ujian', icon: Edit, color: 'text-pink-500 bg-pink-50 border-pink-100', action: () => setActiveTab('exams') },
                      { label: 'Guru', icon: Shield, color: 'text-emerald-700 bg-emerald-50 border-emerald-100', action: () => { setActiveTab('users'); setFilterUserRole('guru'); } },
                      { label: 'Uang', icon: CreditCard, color: 'text-orange-500 bg-orange-50 border-orange-100', action: () => setActiveTab('finance') },
                      { label: 'Info', icon: Megaphone, color: 'text-blue-600 bg-blue-50 border-blue-100', action: () => setActiveTab('announcements') },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={item.action}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-slate-100/70 hover:border-slate-200 transition-all cursor-pointer group active:scale-95"
                      >
                        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${item.color} border transition-transform group-hover:scale-110 mb-1.5`}>
                          <item.icon size={20} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 tracking-tight text-center">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Setelan Action Pill Button */}
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="w-full py-2.5 px-4 rounded-2xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Settings size={15} className="text-slate-500" />
                    <span>Setelan</span>
                  </button>
                </div>

                {/* Pengumuman Terbaru Container */}
                <div className="lg:col-span-6 xl:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Megaphone size={18} className="text-emerald-600" />
                      <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">Pengumuman Terbaru</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('announcements')}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    >
                      Lihat semua
                    </button>
                  </div>

                  {/* List of Announcements with Date Badges */}
                  <div className="space-y-3 flex-1 flex flex-col justify-center">
                    {(announcements && announcements.length > 0 ? announcements.slice(0, 4) : [
                      { id: '1', title: 'Lomba HUT Kemerdekaan RI ke-81', date: 'Selasa, 18 Agustus 2026', day: '18', month: 'AUG', tag: 'Kegiatan', tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                      { id: '2', title: 'Peringatan Maulid Nabi Muhammad SAW', date: 'Sabtu, 29 Agustus 2026', day: '29', month: 'AUG', tag: 'Kegiatan', tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                      { id: '3', title: 'Pengambilan Perlengkapan Sekolah', date: 'Sabtu, 11 Juli 2026', day: '11', month: 'JUL', tag: 'Informasi', tagColor: 'bg-blue-50 text-blue-700 border-blue-200' },
                      { id: '4', title: 'Informasi Teknis & Tata Tertib', date: 'Senin, 13 Juli 2026', day: '13', month: 'JUL', tag: 'Informasi', tagColor: 'bg-blue-50 text-blue-700 border-blue-200' },
                    ]).map((ann, idx) => {
                      const dayNum = ann.day || (ann.createdAt?.seconds ? new Date(ann.createdAt.seconds * 1000).getDate() : '18');
                      const monthAbbr = ann.month || (ann.createdAt?.seconds ? new Date(ann.createdAt.seconds * 1000).toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'AUG');
                      const dateStr = ann.date || (ann.createdAt?.seconds ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Selasa, 18 Agustus 2026');
                      const tagLabel = ann.tag || (idx % 2 === 0 ? 'Kegiatan' : 'Informasi');
                      const isKegiatan = tagLabel === 'Kegiatan';

                      return (
                        <div
                          key={ann.id || idx}
                          onClick={() => setActiveTab('announcements')}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Date Badge Box */}
                            <div className="w-11 h-11 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center shrink-0 group-hover:border-emerald-300 transition-colors">
                              <span className="text-xs font-black text-slate-800 leading-tight">{dayNum}</span>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{monthAbbr}</span>
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors truncate">
                                {ann.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                                {dateStr}
                              </p>
                            </div>
                          </div>

                          {/* Category Tag Pill */}
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
                            isKegiatan
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : 'bg-blue-50 text-blue-700 border-blue-200/80'
                          }`}>
                            {tagLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 4. Bottom Section: Grafik Pembayaran & Aktivitas Terbaru (2 Columns) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Grafik Pembayaran Container */}
                <div className="lg:col-span-6 xl:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">Grafik Pembayaran</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Ringkasan pemasukan & pengeluaran</p>
                    </div>

                    {/* Chart Legends */}
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Pemasukan</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span>Pengeluaran</span>
                      </div>
                    </div>
                  </div>

                  {/* Line Chart */}
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { name: 'Mar', pemasukan: 8, pengeluaran: 5 },
                          { name: 'Apr', pemasukan: 16, pengeluaran: 12 },
                          { name: 'Mei', pemasukan: 9, pengeluaran: 15 },
                          { name: 'Jun', pemasukan: 14, pengeluaran: 13 },
                          { name: 'Jul', pemasukan: 21, pengeluaran: 8 },
                          { name: 'Agu', pemasukan: 18, pengeluaran: 8 },
                        ]}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={{ stroke: '#f1f5f9' }} 
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(val) => `${val}jt`}
                          ticks={[5, 10, 15, 20, 25]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '16px',
                            border: '1px solid #f1f5f9',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                          formatter={(value: any) => [`Rp ${(Number(value) * 1000000).toLocaleString('id-ID')}`, '']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pemasukan" 
                          name="Pemasukan" 
                          stroke="#10b981" 
                          strokeWidth={2.5} 
                          dot={{ r: 3.5, fill: '#10b981', strokeWidth: 1.5, stroke: '#fff' }} 
                          activeDot={{ r: 6 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pengeluaran" 
                          name="Pengeluaran" 
                          stroke="#f43f5e" 
                          strokeWidth={2.5} 
                          dot={{ r: 3.5, fill: '#f43f5e', strokeWidth: 1.5, stroke: '#fff' }} 
                          activeDot={{ r: 6 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Aktivitas Terbaru Container */}
                <div className="lg:col-span-6 xl:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">Aktivitas Terbaru</h3>
                    <button
                      onClick={() => { setActiveTab('finance'); setFinanceSubTab('grup'); }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    >
                      Lihat semua
                    </button>
                  </div>

                  {/* List of Recent Activities */}
                  <div className="space-y-3.5 flex-1 flex flex-col justify-center">
                    {[
                      {
                        title: 'Pembayaran SPP - Ananda Putri A.',
                        time: '2 menit yang lalu',
                        badge: '+ Rp 150.000',
                        color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                        badgeColor: 'text-emerald-600 font-bold',
                        icon: CreditCard,
                      },
                      {
                        title: 'Setoran Hafalan - Ananda Muhammad R.',
                        time: '15 menit yang lalu',
                        badge: '+ 5 Halaman',
                        color: 'bg-blue-50 text-blue-600 border-blue-100',
                        badgeColor: 'text-emerald-600 font-bold',
                        icon: Clock,
                      },
                      {
                        title: 'Pembayaran Kegiatan - Ananda Aisyah',
                        time: '1 jam yang lalu',
                        badge: '+ Rp 17.000',
                        color: 'bg-amber-50 text-amber-500 border-amber-100',
                        badgeColor: 'text-emerald-600 font-bold',
                        icon: Wallet,
                      },
                    ].map((act, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${act.color} shrink-0`}>
                            <act.icon size={18} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate">
                              {act.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                              {act.time}
                            </p>
                          </div>
                        </div>

                        <span className={`text-xs ${act.badgeColor} shrink-0`}>
                          {act.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Keep existing Rapot & Class modals if triggered */}
              {showPrintRapotModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
                  <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative border border-slate-100">
                    <button 
                      onClick={() => { setShowPrintRapotModal(false); setSelectedStudentForRapot(null); }} 
                      className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
                    >
                      <X />
                    </button>
                    <h3 className="text-xl font-black text-slate-800 mb-2">Cetak Rapot Siswa</h3>
                    <p className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest">{selectedStudentForRapot?.name}</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pilih Periode Penilaian</label>
                        <select 
                          value={printRapotPeriod} 
                          onChange={(e) => setPrintRapotPeriod(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700"
                        >
                          <option value="PTS Ganjil">PTS Ganjil</option>
                          <option value="PAS Ganjil">PAS Ganjil</option>
                          <option value="PTS Genap">PTS Genap</option>
                          <option value="PAS Genap">PAS Genap</option>
                        </select>
                      </div>
                      <button 
                        onClick={() => { handleExecutePrintRapot(); setShowPrintRapotModal(false); }}
                        className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                      >
                        <Printer size={18} />
                        Cetak Dokumen
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showClassModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
                  <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
                    <button onClick={() => setShowClassModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>
                    <h3 className="text-xl font-black text-gray-800 mb-6">Tambah Kategori Kelas</h3>
                    <form onSubmit={handleAddClassCategory} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nama Kelas Baru (Cth: KELAS A1, KELAS B2)</label>
                        <input 
                          type="text" 
                          value={newClassName}
                          onChange={(e) => setNewClassName(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 uppercase"
                          required
                          placeholder="NAMA KELAS"
                        />
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-100 mt-2">Simpan Kelas</button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}'''

text = text[:overview_start] + new_overview_block + "\n\n          " + text[users_tab_start:]

with open('src/components/DashboardAdmin.tsx', 'w') as f:
    f.write(text)

print('DashboardAdmin.tsx updated successfully!')
