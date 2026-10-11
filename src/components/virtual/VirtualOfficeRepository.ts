/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VirtualOfficeRepository.ts
 * Central state repository and architectural data layer for Virtual Office RA Darusyifa Arjawinangun.
 * Provides Human & AI agent directory, rooms, task workflows, live audit logs, and demo/live stats.
 */

export type AgentType = 'HUMAN' | 'AI';
export type AgentStatus = 'Online' | 'Offline' | 'Working' | 'Idle' | 'Waiting Approval' | 'Error';
export type TaskPriority = 'Tinggi' | 'Sedang' | 'Rendah';
export type TaskStatus = 'Pending' | 'In Progress' | 'Waiting Approval' | 'Completed';
export type RoomStatus = 'active' | 'waiting' | 'issue' | 'inactive';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  roomId: string;
  assigneeId: string;
  assigneeName: string;
  assigneeType: AgentType;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  createdAt: string;
  completedAt?: string;
}

export interface ActivityFeedItem {
  id: string;
  agentId: string;
  agentName: string;
  agentType: AgentType;
  roomId: string;
  roomName: string;
  activity: string;
  timestamp: string;
  status: 'Sukses' | 'Diproses' | 'Perlu Tindakan' | 'Peringatan';
  details?: string;
}

export interface AgentEntity {
  id: string;
  name: string;
  type: AgentType;
  role: string;
  title?: string;
  roomId: string;
  roomName: string;
  status: AgentStatus;
  permissions: string[];
  tasks: TaskItem[];
  email?: string;
  phone?: string;
  lastActive: string;
  avatarBadge?: string;
  capabilities?: string[];
}

export interface RoomEntity {
  id: string;
  name: string;
  code: string;
  iconName: string;
  description: string;
  assignedAgentIds: string[];
  status: RoomStatus;
  taskSummary: string;
  notificationCount: number;
  colorTheme: 'emerald' | 'sky' | 'amber' | 'purple' | 'rose' | 'teal';
  linkedModuleTab: string;
  coordinates: { x: number; y: number; w: number; h: number };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'critical' | 'warning' | 'info' | 'success';
  timestamp: string;
  isRead: boolean;
  roomId?: string;
  agentId?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorName: string;
  actorType: AgentType;
  action: string;
  module: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'ALERT';
}

// Initial Seed Data
const INITIAL_ROOMS: RoomEntity[] = [
  {
    id: 'room_komando',
    name: 'Ruang Komando Admin & Operator',
    code: 'KOMANDO-01',
    iconName: 'ShieldCheck',
    description: 'Pusat kontrol operasional sistem, otentikasi akun, dan tata kelola portal sekolah.',
    assignedAgentIds: ['agt_h1', 'agt_h2', 'agt_ai4'],
    status: 'active',
    taskSummary: '2 tugas pengawasan aktif & sinkronisasi data',
    notificationCount: 1,
    colorTheme: 'sky',
    linkedModuleTab: 'overview',
    coordinates: { x: 50, y: 50, w: 220, h: 160 }
  },
  {
    id: 'room_guru',
    name: 'Ruang Guru',
    code: 'GURU-02',
    iconName: 'Users',
    description: 'Ruang kolaborasi dewan asatidz RA, penyusunan RPP, capaian belajar & modul ajar anak usia dini.',
    assignedAgentIds: ['agt_h3', 'agt_h4'],
    status: 'active',
    taskSummary: 'Input rapor capaian & materi belajar semester ganjil',
    notificationCount: 2,
    colorTheme: 'emerald',
    linkedModuleTab: 'academic',
    coordinates: { x: 300, y: 50, w: 220, h: 160 }
  },
  {
    id: 'room_bendahara',
    name: 'Ruang Bendahara',
    code: 'KAS-03',
    iconName: 'CreditCard',
    description: 'Loket keuangan sekolah, validasi setoran SPP, tabungan santri, dan manajemen slip gaji asatidz.',
    assignedAgentIds: ['agt_h5', 'agt_ai5'],
    status: 'waiting',
    taskSummary: '3 transaksi pembayaran menanti verifikasi & rekap kas mingguan',
    notificationCount: 3,
    colorTheme: 'amber',
    linkedModuleTab: 'finance',
    coordinates: { x: 550, y: 50, w: 220, h: 160 }
  },
  {
    id: 'room_siswa',
    name: 'Area Siswa & Absensi',
    code: 'PRESENSI-04',
    iconName: 'UserCheck',
    description: 'Pintu gerbang presensi harian, kehadiran fingerprint/barcode, dan pemantauan santri.',
    assignedAgentIds: ['agt_h8', 'agt_h9'],
    status: 'active',
    taskSummary: 'Presensi kelas A & B tercatat 96% hadir hari ini',
    notificationCount: 0,
    colorTheme: 'teal',
    linkedModuleTab: 'attendance',
    coordinates: { x: 50, y: 240, w: 220, h: 160 }
  },
  {
    id: 'room_pengumuman',
    name: 'Studio Pengumuman',
    code: 'SIARAN-05',
    iconName: 'Megaphone',
    description: 'Pusat publikasi berita sekolah, siaran WhatsApp wali murid, dan jadwal kaldik terpadu.',
    assignedAgentIds: ['agt_h6', 'agt_ai2'],
    status: 'active',
    taskSummary: 'Draf siaran Parenting Day & Libur PHBI siap kirim',
    notificationCount: 1,
    colorTheme: 'purple',
    linkedModuleTab: 'announcements',
    coordinates: { x: 300, y: 240, w: 220, h: 160 }
  },
  {
    id: 'room_hafalan',
    name: 'Ruang Hafalan',
    code: 'TAHFIDZ-06',
    iconName: 'BookOpen',
    description: 'Bilik munaqasyah Al-Qur\'an, setoran Juz \'Amma, doa harian, dan hadits pilihan santri.',
    assignedAgentIds: ['agt_h3', 'agt_h7'],
    status: 'active',
    taskSummary: 'Pemeriksaan hafalan Surah An-Nas - Al-Ikhlas 18 santri',
    notificationCount: 1,
    colorTheme: 'emerald',
    linkedModuleTab: 'hafalan',
    coordinates: { x: 550, y: 240, w: 220, h: 160 }
  },
  {
    id: 'room_arsip',
    name: 'Ruang Arsip & Dokumen',
    code: 'ARSIP-07',
    iconName: 'FolderArchive',
    description: 'Penyimpanan berkas EMIS, akreditasi, data induk santri, serta dokumen legalitas RA.',
    assignedAgentIds: ['agt_h2', 'agt_ai3'],
    status: 'waiting',
    taskSummary: 'Audit kelengkapan NIK/NISN santri baru angkatan 2026/2027',
    notificationCount: 2,
    colorTheme: 'rose',
    linkedModuleTab: 'users',
    coordinates: { x: 175, y: 430, w: 220, h: 160 }
  },
  {
    id: 'room_ai',
    name: 'Ruang AI Assistant',
    code: 'AI-LAB-08',
    iconName: 'Sparkles',
    description: 'Pusat agen intelijen otomatis untuk pemrosesan teks, analisis data presensi, dan pendamping tugas admin.',
    assignedAgentIds: ['agt_ai1', 'agt_ai2', 'agt_ai3', 'agt_ai4', 'agt_ai5'],
    status: 'active',
    taskSummary: '5 agen AI aktif beroperasi dengan pemantauan server',
    notificationCount: 0,
    colorTheme: 'sky',
    linkedModuleTab: 'ai-assistant',
    coordinates: { x: 425, y: 430, w: 220, h: 160 }
  }
];

const INITIAL_AGENTS: AgentEntity[] = [
  // HUMAN AGENTS
  {
    id: 'agt_h2',
    name: 'M. Nugi Andri, S.H',
    type: 'HUMAN',
    role: 'Admin & Operator',
    title: 'Operator & Tata Usaha Madrasah',
    roomId: 'room_komando',
    roomName: 'Ruang Admin & Operator',
    status: 'Online',
    permissions: ['user_manage', 'database_rw', 'system_config', 'reset_password'],
    tasks: [],
    email: 'nugi.admin@darusyifa.sch.id',
    phone: '0857-3344-5566',
    lastActive: 'Baru saja',
    avatarBadge: 'NA'
  },
  {
    id: 'agt_h3',
    name: 'Ustadzah Syarifah Habasyiyah',
    type: 'HUMAN',
    role: 'Guru',
    title: 'Wali Kelas RA-A (Kelompok Umar bin Khattab)',
    roomId: 'room_guru',
    roomName: 'Ruang Guru',
    status: 'Online',
    permissions: ['assessment_input', 'attendance_manage', 'hafalan_verify', 'chat_parent'],
    tasks: [],
    email: 'syarifah.guru@darusyifa.sch.id',
    phone: '0821-9988-7711',
    lastActive: '09.42',
    avatarBadge: 'SH'
  },
  {
    id: 'agt_h4',
    name: 'Umi Kulsum, S.Pd',
    type: 'HUMAN',
    role: 'Guru',
    title: 'Wali Kelas RA-B (Kelompok Ali bin Abi Thalib)',
    roomId: 'room_guru',
    roomName: 'Ruang Guru',
    status: 'Online',
    permissions: ['assessment_input', 'attendance_manage', 'hafalan_verify'],
    tasks: [],
    email: 'kulsum.guru@darusyifa.sch.id',
    phone: '0813-4455-6677',
    lastActive: '18 menit yang lalu',
    avatarBadge: 'UK'
  },
  {
    id: 'agt_h5',
    name: 'Syarifah Habasyiyah',
    type: 'HUMAN',
    role: 'Bendahara',
    title: 'Bendahara Madrasah & Pengelola Kas',
    roomId: 'room_bendahara',
    roomName: 'Ruang Bendahara',
    status: 'Online',
    permissions: ['finance_rw', 'validate_payment', 'salary_process', 'cash_deposit'],
    tasks: [],
    email: 'bendahara@darusyifa.sch.id',
    phone: '0878-1234-5678',
    lastActive: '09.38',
    avatarBadge: 'SH'
  },
  {
    id: 'agt_h6',
    name: "Marfu'ah",
    type: 'HUMAN',
    role: 'Agen Pengumuman',
    title: 'Staff Humas & Penyiaran Madrasah',
    roomId: 'room_pengumuman',
    roomName: 'Studio Pengumuman',
    status: 'Online',
    permissions: ['announcements_write', 'kaldik_publish', 'whatsapp_broadcast'],
    tasks: [],
    email: 'marfuah.humas@darusyifa.sch.id',
    phone: '0896-7788-9900',
    lastActive: '09.30',
    avatarBadge: 'MF'
  },
  {
    id: 'agt_h7',
    name: 'Hulalul Anbiyaa, S.Pd',
    type: 'HUMAN',
    role: 'Agen Hafalan',
    title: 'Koordinator Tahfidz & Munaqasyah',
    roomId: 'room_hafalan',
    roomName: 'Ruang Hafalan',
    status: 'Online',
    permissions: ['hafalan_full_access', 'munaqasyah_exam', 'certificate_issue'],
    tasks: [],
    email: 'anbiyaa.tahfidz@darusyifa.sch.id',
    phone: '0812-9900-1122',
    lastActive: 'Baru saja',
    avatarBadge: 'HA'
  },
  {
    id: 'agt_h8',
    name: 'Santri RA Darusyifa (42 Siswa)',
    type: 'HUMAN',
    role: 'Siswa',
    title: 'Santri Kelompok A & B',
    roomId: 'room_siswa',
    roomName: 'Area Siswa & Absensi',
    status: 'Online',
    permissions: ['view_own_data', 'view_materials', 'view_hafalan'],
    tasks: [],
    lastActive: '09.15',
    avatarBadge: '42'
  },
  {
    id: 'agt_h9',
    name: 'H. Syaiful Anwar',
    type: 'HUMAN',
    role: 'Wali Murid',
    title: 'Komite Madrasah & Wali Santri',
    roomId: 'room_siswa',
    roomName: 'Area Siswa & Absensi',
    status: 'Idle',
    permissions: ['view_child_report', 'payment_upload', 'view_calendar'],
    tasks: [],
    phone: '0852-1122-3344',
    lastActive: '45 menit yang lalu',
    avatarBadge: 'SA'
  },

  // AI AGENTS
  {
    id: 'agt_ai1',
    name: 'AI Pengingat',
    type: 'AI',
    role: 'AI Pengingat',
    title: 'Intelligent Reminder Agent',
    roomId: 'room_ai',
    roomName: 'Ruang AI Assistant',
    status: 'Working',
    permissions: ['auto_reminder_draft', 'due_date_detection', 'notification_emit'],
    tasks: [],
    lastActive: 'Baru saja',
    avatarBadge: 'AP',
    capabilities: ['Audit tagihan jatuh tempo', 'Draft pesan santun WhatsApp wali santri', 'Pengingat jadwal ujian tahfidz']
  },
  {
    id: 'agt_ai2',
    name: 'AI Pengumuman',
    type: 'AI',
    role: 'AI Pengumuman',
    title: 'School Broadcaster Generator',
    roomId: 'room_ai',
    roomName: 'Ruang AI Assistant',
    status: 'Idle',
    permissions: ['draft_announcement', 'format_academic_calendar', 'multi_channel_sync'],
    tasks: [],
    lastActive: '4 menit yang lalu',
    avatarBadge: 'APG',
    capabilities: ['Menyusun redaksi pengumuman resmi', 'Rangkuman agenda pekanan', 'Format jadwal peringatan hari besar Islam']
  },
  {
    id: 'agt_ai3',
    name: 'AI Pemeriksa Kelengkapan Data',
    type: 'AI',
    role: 'AI Pemeriksa Kelengkapan Data',
    title: 'Data Quality & Validation Inspector',
    roomId: 'room_arsip',
    roomName: 'Ruang Arsip & Dokumen',
    status: 'Working',
    permissions: ['data_validation_scan', 'missing_field_detection', 'report_discrepancy'],
    tasks: [],
    lastActive: 'Baru saja',
    avatarBadge: 'APK',
    capabilities: ['Audit NISN & NIK santri baru', 'Verifikasi nomor WhatsApp aktif wali murid', 'Deteksi foto dokumen buram']
  },
  {
    id: 'agt_ai4',
    name: 'AI Analis Sekolah',
    type: 'AI',
    role: 'AI Analis Sekolah',
    title: 'School Analytics & Trend Engine',
    roomId: 'room_komando',
    roomName: 'Ruang Komando Admin & Operator',
    status: 'Online',
    permissions: ['analytics_query', 'trend_synthesis', 'retention_metrics'],
    tasks: [],
    lastActive: '1 menit yang lalu',
    avatarBadge: 'AAS',
    capabilities: ['Analisis tren kehadiran mingguan', 'Statistik kelulusan jilid Al-Qur\'an', 'Prediksi keterlambatan pembayaran iuran']
  },
  {
    id: 'agt_ai5',
    name: 'AI Asisten Administrasi',
    type: 'AI',
    role: 'AI Asisten Administrasi',
    title: 'Administrative & Financial Reconciliation Agent',
    roomId: 'room_bendahara',
    roomName: 'Ruang Bendahara',
    status: 'Working',
    permissions: ['slip_validation', 'reconciliation_assist', 'ledger_auto_match'],
    tasks: [],
    lastActive: 'Baru saja',
    avatarBadge: 'AAA',
    capabilities: ['Cek nominal mutasi bank vs tagihan SPP', 'Deteksi duplikasi bukti transfer', 'Penyusunan format draf slip gaji']
  }
];

const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'tsk_101',
    title: 'Validasi Bukti Transfer SPP Bulan Oktober (5 Santri)',
    description: 'Verifikasi kecocokan slip mutasi bank dengan penagihan SPP santri RA Kelompok A & B.',
    roomId: 'room_bendahara',
    assigneeId: 'agt_h5',
    assigneeName: 'Dewi Sartika, S.E',
    assigneeType: 'HUMAN',
    priority: 'Tinggi',
    status: 'In Progress',
    deadline: 'Hari ini, 15:00',
    createdAt: '2026-10-09 08:30'
  },
  {
    id: 'tsk_102',
    title: 'Input Rapor Perkembangan Capaian Belajar Anak RA-A',
    description: 'Perekapan deskripsi capaian nilai agama budi pekerti, jati diri, dan literasi/STEAM anak.',
    roomId: 'room_guru',
    assigneeId: 'agt_h3',
    assigneeName: 'Siti Maryam, S.Pd',
    assigneeType: 'HUMAN',
    priority: 'Tinggi',
    status: 'In Progress',
    deadline: '12 Oktober 2026',
    createdAt: '2026-10-08 10:00'
  },
  {
    id: 'tsk_103',
    title: 'Pemeriksaan Hafalan Surah Al-Humazah Santri Kelompok B',
    description: 'Pengujian munaqasyah tajwid dan kelancaran setoran hafalan mandiri santri.',
    roomId: 'room_hafalan',
    assigneeId: 'agt_h7',
    assigneeName: 'Ust. Hamdan, Lc',
    assigneeType: 'HUMAN',
    priority: 'Sedang',
    status: 'Pending',
    deadline: 'Besok, 10:00',
    createdAt: '2026-10-09 07:45'
  },
  {
    id: 'tsk_104',
    title: 'Pindai Kelengkapan NIK/NISN 12 Santri Baru',
    description: 'AI melakukan inspeksi otomatis pada database santri untuk melengkapi berkas EMIS 4.0.',
    roomId: 'room_arsip',
    assigneeId: 'agt_ai3',
    assigneeName: 'AI Pemeriksa Kelengkapan Data',
    assigneeType: 'AI',
    priority: 'Tinggi',
    status: 'In Progress',
    deadline: 'Hari ini, 12:00',
    createdAt: '2026-10-09 08:00'
  },
  {
    id: 'tsk_105',
    title: 'Draf Broadcast Pengumuman Pertemuan Komite & Parenting',
    description: 'Penyusunan format pengumuman santun kegiatan parenting day via WhatsApp terintegrasi.',
    roomId: 'room_pengumuman',
    assigneeId: 'agt_ai2',
    assigneeName: 'AI Pengumuman',
    assigneeType: 'AI',
    priority: 'Sedang',
    status: 'Waiting Approval',
    deadline: '10 Oktober 2026',
    createdAt: '2026-10-09 09:15'
  },
  {
    id: 'tsk_106',
    title: 'Otomasi Peringatan Jatuh Tempo SPP Wali Santri',
    description: 'Pengecekan daftar santri dengan tagihan berjalan lebih dari 10 hari.',
    roomId: 'room_ai',
    assigneeId: 'agt_ai1',
    assigneeName: 'AI Pengingat',
    assigneeType: 'AI',
    priority: 'Sedang',
    status: 'Completed',
    deadline: '09 Oktober 2026',
    createdAt: '2026-10-09 06:00',
    completedAt: '2026-10-09 08:10'
  },
  {
    id: 'tsk_107',
    title: 'Backup & Audit Keamanan Akun Operator Sekolah',
    description: 'Verifikasi otentikasi dua faktor, status sesi login guru, dan pengamanan kredensial.',
    roomId: 'room_komando',
    assigneeId: 'agt_h2',
    assigneeName: 'Ahmad Fauzi, S.Kom',
    assigneeType: 'HUMAN',
    priority: 'Rendah',
    status: 'Completed',
    deadline: '08 Oktober 2026',
    createdAt: '2026-10-08 09:00',
    completedAt: '2026-10-08 16:30'
  }
];

const INITIAL_ACTIVITIES: ActivityFeedItem[] = [
  {
    id: 'act_1',
    agentId: 'agt_h3',
    agentName: 'Ustadzah Syarifah Habasyiyah',
    agentType: 'HUMAN',
    roomId: 'room_hafalan',
    roomName: 'Ruang Hafalan',
    activity: 'Guru memeriksa hafalan Surah Al-Humazah',
    timestamp: '09.42',
    status: 'Sukses',
    details: 'Munaqasyah tajwid dan kelancaran setoran santri kelompok A'
  },
  {
    id: 'act_2',
    agentId: 'agt_h5',
    agentName: 'Syarifah Habasyiyah',
    agentType: 'HUMAN',
    roomId: 'room_bendahara',
    roomName: 'Ruang Bendahara',
    activity: 'Bendahara memvalidasi pembayaran SPP',
    timestamp: '09.38',
    status: 'Sukses',
    details: 'Verifikasi mutasi rekening bank transfer Rp 120.000 atas nama santri Ahmad'
  },
  {
    id: 'act_3',
    agentId: 'agt_ai5',
    agentName: 'AI Asisten Administrasi',
    agentType: 'AI',
    roomId: 'room_bendahara',
    roomName: 'Ruang Bendahara',
    activity: 'AI mencocokkan mutasi kas harian dengan bukti setor',
    timestamp: '09.35',
    status: 'Sukses',
    details: 'Auto-reconciliation saldo kas masuk dan sinkronisasi pembukuan madrasah'
  },
  {
    id: 'act_4',
    agentId: 'agt_h6',
    agentName: "Marfu'ah",
    agentType: 'HUMAN',
    roomId: 'room_pengumuman',
    roomName: 'Studio Pengumuman',
    activity: 'Agen Pengumuman menerbitkan agenda Maulid & Kaldik',
    timestamp: '09.30',
    status: 'Sukses',
    details: 'Publikasi kalender akademik dan agenda PHBI ke kanal resmi wali murid'
  },
  {
    id: 'act_5',
    agentId: 'agt_ai2',
    agentName: 'AI Pengumuman',
    agentType: 'AI',
    roomId: 'room_pengumuman',
    roomName: 'Studio Pengumuman',
    activity: 'AI Pengumuman menyusun draf pesan Parenting Day',
    timestamp: '09.28',
    status: 'Sukses',
    details: 'Format pengumuman santun via WhatsApp terintegrasi siap kirim'
  },
  {
    id: 'act_6',
    agentId: 'agt_ai3',
    agentName: 'AI Pemeriksa Kelengkapan Data',
    agentType: 'AI',
    roomId: 'room_arsip',
    roomName: 'Ruang Arsip & Dokumen',
    activity: 'AI menemukan data siswa yang belum lengkap',
    timestamp: '09.25',
    status: 'Sukses',
    details: 'Deteksi NIK belum valid pada 2 santri baru untuk sinkronisasi EMIS 4.0'
  },
  {
    id: 'act_7',
    agentId: 'agt_h2',
    agentName: 'M. Nugi Andri, S.H',
    agentType: 'HUMAN',
    roomId: 'room_komando',
    roomName: 'Ruang Admin & Operator',
    activity: 'Admin mencadangkan database EMIS 4.0 & induk',
    timestamp: '09.20',
    status: 'Sukses',
    details: 'Backup snapshot harian sistem database dan audit akun pengguna'
  },
  {
    id: 'act_8',
    agentId: 'agt_h8',
    agentName: 'Kelas A - Umar bin Khattab',
    agentType: 'HUMAN',
    roomId: 'room_siswa',
    roomName: 'Area Siswa & Absensi',
    activity: 'Siswa melakukan absensi pagi',
    timestamp: '09.15',
    status: 'Sukses',
    details: 'Presensi digital tercatat: 42 siswa hadir tepat waktu di ruang kelas'
  },
  {
    id: 'act_9',
    agentId: 'agt_ai1',
    agentName: 'AI Pengingat',
    agentType: 'AI',
    roomId: 'room_ai',
    roomName: 'Ruang AI Assistant',
    activity: 'AI menyusun daftar pengingat tagihan berjalan',
    timestamp: '09.05',
    status: 'Sukses',
    details: 'Pendeteksian 5 akun penagihan SPP jatuh tempo untuk pemberitahuan ramah'
  },
  {
    id: 'act_10',
    agentId: 'agt_h1',
    agentName: 'Hj. Masriyah',
    agentType: 'HUMAN',
    roomId: 'room_komando',
    roomName: 'Ruang Admin & Operator',
    activity: 'Kepala RA menyetujui draf program kerja',
    timestamp: '08.55',
    status: 'Sukses',
    details: 'Pengesahan rencana evaluasi bulanan dan kegiatan munaqasyah santri'
  },
  {
    id: 'act_11',
    agentId: 'agt_ai4',
    agentName: 'AI Analis Sekolah',
    agentType: 'AI',
    roomId: 'room_komando',
    roomName: 'Ruang Admin & Operator',
    activity: 'AI menghitung rasio kehadiran santri pekan ini',
    timestamp: '08.45',
    status: 'Sukses',
    details: 'Analisis statistik kehadiran rata-rata mencapai 98.4% (sangat tinggi)'
  },
  {
    id: 'act_12',
    agentId: 'agt_h7',
    agentName: 'Ust. Hamdan, Lc',
    agentType: 'HUMAN',
    roomId: 'room_hafalan',
    roomName: 'Ruang Hafalan',
    activity: 'Pengujian hafalan doa harian & hadits pilihan',
    timestamp: '08.30',
    status: 'Sukses',
    details: 'Evaluasi tajwid dan makhraj 15 santri kelompok B di bilik munaqasyah'
  }
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'Validasi Pembayaran Menunggu',
    message: 'Ada 5 bukti transfer baru pada loket bendahara yang memerlukan persetujuan.',
    category: 'warning',
    timestamp: '10 menit yang lalu',
    isRead: false,
    roomId: 'room_bendahara',
    agentId: 'agt_h5'
  },
  {
    id: 'notif_2',
    title: 'Data Santri Belum Lengkap',
    message: 'AI Pemeriksa Data mendeteksi NIK 2 santri baru belum sinkron dengan data Dukcapil.',
    category: 'critical',
    timestamp: '25 menit yang lalu',
    isRead: false,
    roomId: 'room_arsip',
    agentId: 'agt_ai3'
  },
  {
    id: 'notif_3',
    title: 'Munaqasyah Hafalan Dijadwalkan',
    message: 'Sesi pengujian tahfidz kelompok B dijadwalkan besok pukul 08:30 WIB.',
    category: 'info',
    timestamp: '1 jam yang lalu',
    isRead: true,
    roomId: 'room_hafalan',
    agentId: 'agt_h7'
  }
];

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud_1',
    timestamp: '2026-10-09 09:42:15',
    actorName: 'Ustadzah Syarifah Habasyiyah',
    actorType: 'HUMAN',
    action: 'VERIFY_HAFALAN',
    module: 'Hafalan Siswa',
    details: 'Pemeriksaan hafalan Surah An-Nas santri',
    status: 'SUCCESS'
  },
  {
    id: 'aud_2',
    timestamp: '2026-10-09 09:38:12',
    actorName: 'Syarifah Habasyiyah',
    actorType: 'HUMAN',
    action: 'VALIDATE_PAYMENT',
    module: 'Keuangan',
    details: 'Validasi pembayaran tunai SPP Rp 120.000',
    status: 'SUCCESS'
  },
  {
    id: 'aud_3',
    timestamp: '2026-10-09 09:30:04',
    actorName: "Marfu'ah",
    actorType: 'HUMAN',
    action: 'PUBLISH_ANNOUNCEMENT',
    module: 'Pengumuman',
    details: 'Penerbitan info agenda kegiatan sekolah',
    status: 'SUCCESS'
  },
  {
    id: 'aud_4',
    timestamp: '2026-10-09 09:15:55',
    actorName: 'Kelas A - Umar bin Khattab',
    actorType: 'HUMAN',
    action: 'RECORD_ATTENDANCE',
    module: 'Absensi',
    details: 'Presensi 42 siswa hadir hari ini',
    status: 'SUCCESS'
  }
];

const STORAGE_KEY = 'ra_virtual_office_store_v6';

export class VirtualOfficeRepository {
  private rooms: RoomEntity[] = [];
  private agents: AgentEntity[] = [];
  private tasks: TaskItem[] = [];
  private activities: ActivityFeedItem[] = [];
  private notifications: NotificationItem[] = [];
  private auditLogs: AuditLogItem[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.rooms = (parsed.rooms && parsed.rooms.length > 0) ? parsed.rooms : INITIAL_ROOMS;
        this.agents = (parsed.agents && parsed.agents.length > 0) ? parsed.agents : INITIAL_AGENTS;
        this.tasks = (parsed.tasks && parsed.tasks.length > 0) ? parsed.tasks : INITIAL_TASKS;
        this.activities = (parsed.activities && parsed.activities.length >= 5) ? parsed.activities : INITIAL_ACTIVITIES;
        this.notifications = (parsed.notifications && parsed.notifications.length > 0) ? parsed.notifications : INITIAL_NOTIFICATIONS;
        this.auditLogs = (parsed.auditLogs && parsed.auditLogs.length > 0) ? parsed.auditLogs : INITIAL_AUDIT_LOGS;
      } else {
        this.resetToDefaults();
      }
    } catch {
      this.resetToDefaults();
    }
  }

  private persist() {
    try {
      const state = {
        rooms: this.rooms,
        agents: this.agents,
        tasks: this.tasks,
        activities: this.activities,
        notifications: this.notifications,
        auditLogs: this.auditLogs
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('[VirtualOfficeRepository] LocalStorage write failed:', e);
    }
    this.notify();
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public resetToDefaults() {
    this.rooms = JSON.parse(JSON.stringify(INITIAL_ROOMS));
    this.agents = JSON.parse(JSON.stringify(INITIAL_AGENTS));
    this.tasks = JSON.parse(JSON.stringify(INITIAL_TASKS));
    this.activities = JSON.parse(JSON.stringify(INITIAL_ACTIVITIES));
    this.notifications = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
    this.auditLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
    this.persist();
  }

  // Getters
  public getRooms(): RoomEntity[] {
    return [...this.rooms];
  }

  public getRoomById(id: string): RoomEntity | undefined {
    return this.rooms.find(r => r.id === id);
  }

  public getAgents(): AgentEntity[] {
    return [...this.agents];
  }

  public getAgentById(id: string): AgentEntity | undefined {
    return this.agents.find(a => a.id === id);
  }

  public getTasks(): TaskItem[] {
    return [...this.tasks];
  }

  public getActivities(): ActivityFeedItem[] {
    if (!this.activities || this.activities.length === 0) {
      this.activities = JSON.parse(JSON.stringify(INITIAL_ACTIVITIES));
      this.persist();
    }
    return [...this.activities];
  }

  public getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  public getAuditLogs(): AuditLogItem[] {
    return [...this.auditLogs];
  }

  // Computations
  public getKPISummary() {
    const totalAgents = 10;
    const onlineAgents = 8;
    const teachingTeachers = 4;
    const presentStudents = 42;
    const totalStudents = 56;
    const hafalanVerified = 18;
    const activeAnnouncements = 2;
    const totalAnnouncements = 5;
    const pendingValidations = 5;
    const totalValidations = 12;

    return {
      totalAgents,
      onlineAgents,
      teachingTeachers,
      presentStudents,
      totalStudents,
      hafalanVerified,
      activeAnnouncements,
      totalAnnouncements,
      pendingValidations,
      totalValidations,
      isSimulated: true
    };
  }

  // Actions
  public updateAgentStatus(agentId: string, status: AgentStatus) {
    this.agents = this.agents.map(a => {
      if (a.id === agentId) {
        return {
          ...a,
          status,
          lastActive: 'Baru saja'
        };
      }
      return a;
    });

    const agent = this.getAgentById(agentId);
    if (agent) {
      this.addAuditLog(
        agent.name,
        agent.type,
        'UPDATE_STATUS',
        'Virtual Office',
        `Mengubah status agen menjadi ${status}`
      );
      this.addActivity(
        agent.id,
        agent.name,
        agent.type,
        agent.roomId,
        agent.roomName,
        `Status diperbarui menjadi: ${status}`,
        'Sukses'
      );
    }

    this.persist();
  }

  public assignTask(task: Omit<TaskItem, 'id' | 'createdAt'>) {
    const id = `tsk_${Date.now()}`;
    const newTask: TaskItem = {
      ...task,
      id,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    this.tasks = [newTask, ...this.tasks];

    // Log & notify
    this.addAuditLog(
      newTask.assigneeName,
      newTask.assigneeType,
      'TASK_ASSIGNED',
      'Manajemen Tugas',
      `Tugas baru dibuat: ${newTask.title} (Prioritas: ${newTask.priority})`
    );

    this.addActivity(
      newTask.assigneeId,
      newTask.assigneeName,
      newTask.assigneeType,
      newTask.roomId,
      this.getRoomById(newTask.roomId)?.name || 'Ruang Kantor',
      `Ditugaskan: ${newTask.title}`,
      'Perlu Tindakan'
    );

    this.persist();
    return newTask;
  }

  public updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    let targetTask: TaskItem | undefined;
    this.tasks = this.tasks.map(t => {
      if (t.id === taskId) {
        targetTask = { ...t, status: newStatus };
        if (newStatus === 'Completed') {
          targetTask.completedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
        }
        return targetTask;
      }
      return t;
    });

    if (targetTask) {
      this.addAuditLog(
        targetTask.assigneeName,
        targetTask.assigneeType,
        'TASK_STATUS_CHANGE',
        'Manajemen Tugas',
        `Tugas "${targetTask.title}" diubah statusnya menjadi ${newStatus}`
      );

      this.addActivity(
        targetTask.assigneeId,
        targetTask.assigneeName,
        targetTask.assigneeType,
        targetTask.roomId,
        this.getRoomById(targetTask.roomId)?.name || 'Ruang Kantor',
        `Status tugas diubah menjadi ${newStatus}: ${targetTask.title}`,
        newStatus === 'Completed' ? 'Sukses' : 'Diproses'
      );
    }

    this.persist();
  }

  public addActivity(
    agentId: string,
    agentName: string,
    agentType: AgentType,
    roomId: string,
    roomName: string,
    activity: string,
    status: 'Sukses' | 'Diproses' | 'Perlu Tindakan' | 'Peringatan' = 'Sukses',
    details?: string
  ) {
    const newAct: ActivityFeedItem = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      agentId,
      agentName,
      agentType,
      roomId,
      roomName,
      activity,
      timestamp: 'Baru saja',
      status,
      details
    };
    this.activities = [newAct, ...this.activities.slice(0, 49)];
    this.persist();
  }

  public addNotification(
    title: string,
    message: string,
    category: 'critical' | 'warning' | 'info' | 'success',
    roomId?: string,
    agentId?: string
  ) {
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      title,
      message,
      category,
      timestamp: 'Baru saja',
      isRead: false,
      roomId,
      agentId
    };
    this.notifications = [newNotif, ...this.notifications.slice(0, 29)];
    this.persist();
  }

  public markNotificationAsRead(id: string) {
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    this.persist();
  }

  public markAllNotificationsAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
    this.persist();
  }

  public addAuditLog(
    actorName: string,
    actorType: AgentType,
    action: string,
    module: string,
    details: string,
    status: 'SUCCESS' | 'WARNING' | 'ALERT' = 'SUCCESS'
  ) {
    const newLog: AuditLogItem = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actorName,
      actorType,
      action,
      module,
      details,
      status
    };
    this.auditLogs = [newLog, ...this.auditLogs.slice(0, 99)];
    this.persist();
  }
}

// Singleton export
export const voRepository = new VirtualOfficeRepository();
