/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VirtualSchoolEngine.ts
 * High-performance 2.5D Isometric Canvas Engine for RA Darusyifa Digital Twin.
 * Supports pixel art rendering, path movement, live reactive activities, and state management.
 */

export type RoleType = 'Guru Kelas' | 'Tata Usaha' | 'Siswa Hadir' | 'Wali Murid' | 'Kepala Sekolah';
export type StatusType = 
  | 'Standby' 
  | 'Mengajar' 
  | 'Merekap Nilai' 
  | 'Absensi Masuk' 
  | 'Menabung' 
  | 'Konsultasi' 
  | 'Membaca' 
  | 'Bermain' 
  | 'Verifikasi SPP';

export interface RoomZone {
  id: string;
  name: string;
  color: string;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  focusTile: { x: number; y: number };
  description: string;
}

export interface Furniture {
  id: string;
  type: 'smartboard' | 'desk_teacher' | 'desk_student' | 'bookshelf' | 'computer_tu' | 'gate_scanner' | 'slide' | 'plant' | 'bench';
  x: number;
  y: number;
  width?: number; // grid span
  label?: string;
}

export interface FloatingParticle {
  id: string;
  x: number; // screen coords
  y: number;
  text: string;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
}

export interface AvatarEntity {
  id: string;
  name: string;
  role: RoleType;
  status: StatusType;
  x: number; // grid x
  y: number; // grid y
  targetX: number;
  targetY: number;
  speed: number;
  avatarType: 'guru' | 'admin' | 'siswa_m' | 'siswa_f' | 'wali';
  gender: 'm' | 'f';
  uniformColor: string;
  accentColor: string;
  speechBubble?: { text: string; timer: number };
  actionCooldown: number;
  walkCycle: number;
  homeTile: { x: number; y: number };
  stats: {
    actionsCount: number;
    lastActive: string;
    classGroup?: string;
  };
}

export interface SimulationEvent {
  id: string;
  timestamp: string;
  avatarId: string;
  avatarName: string;
  role: RoleType;
  actionTitle: string;
  status: StatusType;
  roomName: string;
  badgeColor: string;
}

// 18x18 Grid Definition
export const GRID_SIZE_X = 18;
export const GRID_SIZE_Y = 18;
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

export const SCHOOL_ROOMS: RoomZone[] = [
  {
    id: 'classroom_a',
    name: 'Ruang Kelas RA A (Al-Fath)',
    color: '#0284c7', // Futuristic Blue
    bounds: { minX: 1, maxX: 7, minY: 1, maxY: 7 },
    focusTile: { x: 4, y: 4 },
    description: 'Ruang pembelajaran interaktif dilengkapi Smartboard & meja belajar siswa.'
  },
  {
    id: 'admin_office',
    name: 'Kantor Tata Usaha & Kasir',
    color: '#059669', // Emerald Green
    bounds: { minX: 9, maxX: 16, minY: 1, maxY: 7 },
    focusTile: { x: 12, y: 4 },
    description: 'Pusat administrasi, validasi SPP, tabungan, dan layanan wali murid.'
  },
  {
    id: 'library',
    name: 'Pojok Baca & Sains Cilik',
    color: '#d97706', // Warm Amber
    bounds: { minX: 1, maxX: 7, minY: 9, maxY: 15 },
    focusTile: { x: 4, y: 12 },
    description: 'Pustaka dongeng islami, buku mewarnai, dan ensiklopedia sains cilik.'
  },
  {
    id: 'playground',
    name: 'Taman Bermain Ramah Anak',
    color: '#10b981', // Child-friendly Green
    bounds: { minX: 9, maxX: 16, minY: 9, maxY: 14 },
    focusTile: { x: 12, y: 11 },
    description: 'Wahana perosotan, balok ketangkasan, dan area motorik outdoor aman.'
  },
  {
    id: 'gate',
    name: 'Gerbang & Checkpoint Absensi',
    color: '#6366f1', // Indigo Accent
    bounds: { minX: 7, maxX: 10, minY: 15, maxY: 17 },
    focusTile: { x: 8, y: 16 },
    description: 'Pintu gerbang utama dengan scanner presensi digital otomatis.'
  }
];

export const INITIAL_FURNITURE: Furniture[] = [
  // Ruang Kelas A (x: 1-7, y: 1-7)
  { id: 'sb_1', type: 'smartboard', x: 4, y: 1, label: 'Smartboard Digital' },
  { id: 'desk_t1', type: 'desk_teacher', x: 4, y: 2, label: 'Meja Guru Kelas' },
  { id: 'desk_s1', type: 'desk_student', x: 2, y: 4, label: 'Meja Siswa A1' },
  { id: 'desk_s2', type: 'desk_student', x: 6, y: 4, label: 'Meja Siswa A2' },
  { id: 'desk_s3', type: 'desk_student', x: 2, y: 6, label: 'Meja Siswa A3' },
  { id: 'desk_s4', type: 'desk_student', x: 6, y: 6, label: 'Meja Siswa A4' },
  { id: 'p_class', type: 'plant', x: 1, y: 1 },

  // Kantor TU (x: 9-16, y: 1-7)
  { id: 'tu_pc1', type: 'computer_tu', x: 11, y: 2, label: 'Workstation TU' },
  { id: 'tu_pc2', type: 'computer_tu', x: 14, y: 2, label: 'Loket Keuangan' },
  { id: 'tu_bench', type: 'bench', x: 12, y: 6, label: 'Sofa Tamu' },
  { id: 'p_tu', type: 'plant', x: 16, y: 1 },

  // Perpustakaan (x: 1-7, y: 9-15)
  { id: 'lib_shelf1', type: 'bookshelf', x: 1, y: 10, label: 'Rak Buku Cerita' },
  { id: 'lib_shelf2', type: 'bookshelf', x: 1, y: 13, label: 'Rak Buku Islam' },
  { id: 'lib_bench', type: 'bench', x: 4, y: 12, label: 'Karpet Membaca' },
  { id: 'p_lib', type: 'plant', x: 6, y: 9 },

  // Taman Bermain (x: 9-16, y: 9-14)
  { id: 'play_slide', type: 'slide', x: 13, y: 11, label: 'Perosotan Ceria' },
  { id: 'play_bench', type: 'bench', x: 10, y: 13, label: 'Bangku Taman' },
  { id: 'p_play1', type: 'plant', x: 9, y: 9 },
  { id: 'p_play2', type: 'plant', x: 15, y: 9 },

  // Gerbang (x: 7-10, y: 15-17)
  { id: 'gate_sc1', type: 'gate_scanner', x: 8, y: 16, label: 'Absensi QR Gate' }
];

export const INITIAL_AVATARS: AvatarEntity[] = [
  {
    id: 'av_guru_1',
    name: 'Ustadzah Nurul Hidayah, S.Pd',
    role: 'Guru Kelas',
    status: 'Mengajar',
    x: 4,
    y: 2,
    targetX: 4,
    targetY: 2,
    speed: 0.05,
    avatarType: 'guru',
    gender: 'f',
    uniformColor: '#0284c7', // Futuristic Blue
    accentColor: '#38bdf8',
    actionCooldown: 0,
    walkCycle: 0,
    homeTile: { x: 4, y: 2 },
    stats: {
      actionsCount: 18,
      lastActive: 'Baru saja',
      classGroup: 'Kelompok A (Usia 4-5)'
    }
  },
  {
    id: 'av_admin_1',
    name: 'Pak Ilham Syahputra, S.Kom',
    role: 'Tata Usaha',
    status: 'Merekap Nilai',
    x: 11,
    y: 3,
    targetX: 11,
    targetY: 3,
    speed: 0.05,
    avatarType: 'admin',
    gender: 'm',
    uniformColor: '#059669', // Emerald
    accentColor: '#10b981',
    actionCooldown: 0,
    walkCycle: 0,
    homeTile: { x: 11, y: 3 },
    stats: {
      actionsCount: 34,
      lastActive: '1 mnt lalu',
      classGroup: 'Bagian Administrasi & Keuangan'
    }
  },
  {
    id: 'av_siswa_1',
    name: 'Muhammad Rayhan Al-Fatih',
    role: 'Siswa Hadir',
    status: 'Standby',
    x: 2,
    y: 5,
    targetX: 2,
    targetY: 5,
    speed: 0.06,
    avatarType: 'siswa_m',
    gender: 'm',
    uniformColor: '#0284c7',
    accentColor: '#10b981',
    actionCooldown: 0,
    walkCycle: 0,
    homeTile: { x: 2, y: 5 },
    stats: {
      actionsCount: 8,
      lastActive: '07:12 WIB',
      classGroup: 'Kelompok A'
    }
  },
  {
    id: 'av_siswa_2',
    name: 'Aisyah Putri Azzahra',
    role: 'Siswa Hadir',
    status: 'Membaca',
    x: 4,
    y: 11,
    targetX: 4,
    targetY: 11,
    speed: 0.06,
    avatarType: 'siswa_f',
    gender: 'f',
    uniformColor: '#0284c7',
    accentColor: '#f43f5e',
    actionCooldown: 0,
    walkCycle: 0,
    homeTile: { x: 6, y: 5 },
    stats: {
      actionsCount: 11,
      lastActive: '07:20 WIB',
      classGroup: 'Kelompok A'
    }
  },
  {
    id: 'av_siswa_3',
    name: 'Fathan Maulana Malik',
    role: 'Siswa Hadir',
    status: 'Bermain',
    x: 11,
    y: 11,
    targetX: 11,
    targetY: 11,
    speed: 0.07,
    avatarType: 'siswa_m',
    gender: 'm',
    uniformColor: '#0284c7',
    accentColor: '#f59e0b',
    actionCooldown: 0,
    walkCycle: 0,
    homeTile: { x: 2, y: 7 },
    stats: {
      actionsCount: 14,
      lastActive: '07:15 WIB',
      classGroup: 'Kelompok A'
    }
  },
  {
    id: 'av_wali_1',
    name: 'Ibu Rahmawati (Wali Rayhan)',
    role: 'Wali Murid',
    status: 'Absensi Masuk',
    x: 8,
    y: 15,
    targetX: 8,
    targetY: 15,
    speed: 0.05,
    avatarType: 'wali',
    gender: 'f',
    uniformColor: '#8b5cf6',
    accentColor: '#a855f7',
    actionCooldown: 0,
    walkCycle: 0,
    homeTile: { x: 8, y: 16 },
    stats: {
      actionsCount: 4,
      lastActive: '07:10 WIB',
      classGroup: 'Wali Murid RA'
    }
  }
];

export class VirtualSchoolSimulator {
  public avatars: AvatarEntity[] = [];
  public events: SimulationEvent[] = [];
  public particles: FloatingParticle[] = [];
  public autoSimulate: boolean = true;
  public simSpeed: number = 1;
  private autoTimer: number = 0;
  private onUpdateCallback?: () => void;

  constructor() {
    this.avatars = JSON.parse(JSON.stringify(INITIAL_AVATARS));
    this.events = [
      {
        id: 'evt_init_1',
        timestamp: '07:15:20',
        avatarId: 'av_wali_1',
        avatarName: 'Ibu Rahmawati',
        role: 'Wali Murid',
        actionTitle: 'Presensi Masuk Berhasil',
        status: 'Absensi Masuk',
        roomName: 'Gerbang & Checkpoint Absensi',
        badgeColor: '#6366f1'
      },
      {
        id: 'evt_init_2',
        timestamp: '07:22:45',
        avatarId: 'av_guru_1',
        avatarName: 'Ustadzah Nurul',
        role: 'Guru Kelas',
        actionTitle: 'Memulai Sesi Mengajar Pagi',
        status: 'Mengajar',
        roomName: 'Ruang Kelas RA A',
        badgeColor: '#0284c7'
      },
      {
        id: 'evt_init_3',
        timestamp: '07:28:10',
        avatarId: 'av_admin_1',
        avatarName: 'Pak Ilham (TU)',
        role: 'Tata Usaha',
        actionTitle: 'Sinkronisasi Ledger Tabungan',
        status: 'Merekap Nilai',
        roomName: 'Kantor Tata Usaha & Kasir',
        badgeColor: '#059669'
      }
    ];
  }

  public setOnUpdate(cb: () => void) {
    this.onUpdateCallback = cb;
  }

  // Update physics, positions, bubbles, particles every animation frame
  public tick(deltaTime: number) {
    const delta = deltaTime * this.simSpeed;

    // 1. Update avatars
    for (const av of this.avatars) {
      // Move towards target
      const dx = av.targetX - av.x;
      const dy = av.targetY - av.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0.05) {
        const step = Math.min(dist, av.speed * delta * 60);
        av.x += (dx / dist) * step;
        av.y += (dy / dist) * step;
        av.walkCycle += delta * 8;
      } else {
        av.x = av.targetX;
        av.y = av.targetY;
        av.walkCycle = 0;
      }

      // Bubble countdown
      if (av.speechBubble) {
        av.speechBubble.timer -= delta;
        if (av.speechBubble.timer <= 0) {
          av.speechBubble = undefined;
        }
      }

      // Action cooldown
      if (av.actionCooldown > 0) {
        av.actionCooldown -= delta;
        if (av.actionCooldown <= 0) {
          // Revert to standby or default status
          if (av.role === 'Guru Kelas') av.status = 'Mengajar';
          else if (av.role === 'Tata Usaha') av.status = 'Standby';
          else av.status = 'Standby';
        }
      }
    }

    // 2. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      p.y -= delta * 18;
      p.opacity = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // 3. Auto simulation timer
    if (this.autoSimulate) {
      this.autoTimer += delta;
      if (this.autoTimer >= 6.5) {
        this.autoTimer = 0;
        this.triggerRandomAutoEvent();
      }
    }
  }

  public addParticle(x: number, y: number, text: string, color: string = '#38bdf8') {
    this.particles.push({
      id: 'p_' + Math.random().toString(36).substring(2, 8),
      x,
      y,
      text,
      color,
      opacity: 1,
      life: 0,
      maxLife: 2.2
    });
  }

  public recordEvent(
    avatarId: string, 
    actionTitle: string, 
    status: StatusType, 
    roomName: string, 
    badgeColor: string
  ) {
    const av = this.avatars.find(a => a.id === avatarId);
    if (!av) return;

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const newEvt: SimulationEvent = {
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      timestamp: timeStr,
      avatarId: av.id,
      avatarName: av.name,
      role: av.role,
      actionTitle,
      status,
      roomName,
      badgeColor
    };

    this.events.unshift(newEvt);
    if (this.events.length > 30) this.events.pop();

    av.stats.actionsCount++;
    av.stats.lastActive = timeStr;

    if (this.onUpdateCallback) this.onUpdateCallback();
  }

  // --- INTERACTIVE SIMULATION DISPATCHERS ---

  // 1. Guru Input Nilai
  public triggerTeacherGradeInput() {
    const guru = this.avatars.find(a => a.role === 'Guru Kelas');
    if (!guru) return;

    guru.targetX = 4;
    guru.targetY = 1; // Near smartboard
    guru.status = 'Merekap Nilai';
    guru.actionCooldown = 5.0;
    guru.speechBubble = { text: '📝 Input Nilai Mingguan...', timer: 4.0 };

    this.recordEvent(
      guru.id,
      'Ustadzah menginput nilai capaian anak (PABP & Motorik)',
      'Merekap Nilai',
      'Ruang Kelas RA A',
      '#0284c7'
    );
  }

  // 2. Wali Murid & Siswa Absensi Masuk
  public triggerAttendanceScan() {
    const wali = this.avatars.find(a => a.role === 'Wali Murid');
    const siswa = this.avatars.find(a => a.id === 'av_siswa_1');
    if (!wali || !siswa) return;

    // Spawn at gate
    wali.x = 8;
    wali.y = 17;
    wali.targetX = 8;
    wali.targetY = 15;
    wali.status = 'Absensi Masuk';
    wali.speechBubble = { text: '📲 Scan Barcode Presensi', timer: 3.5 };

    siswa.targetX = 8;
    siswa.targetY = 14;
    siswa.status = 'Absensi Masuk';
    siswa.speechBubble = { text: 'Assalamualaikum!', timer: 3.5 };

    setTimeout(() => {
      // Siswa moves back to classroom
      siswa.targetX = siswa.homeTile.x;
      siswa.targetY = siswa.homeTile.y;
      siswa.status = 'Standby';
    }, 3800);

    this.recordEvent(
      wali.id,
      'Presensi Hadir QR Code divalidasi sistem',
      'Absensi Masuk',
      'Gerbang & Checkpoint Absensi',
      '#6366f1'
    );
  }

  // 3. Siswa Setor Tabungan ke TU
  public triggerSavingsDeposit() {
    const siswa = this.avatars.find(a => a.id === 'av_siswa_3') || this.avatars[2];
    const admin = this.avatars.find(a => a.role === 'Tata Usaha');
    if (!siswa || !admin) return;

    // Siswa walks to TU desk
    siswa.targetX = 13;
    siswa.targetY = 3;
    siswa.status = 'Menabung';
    siswa.speechBubble = { text: '🪙 Menabung Rp 10.000', timer: 4.0 };

    admin.status = 'Verifikasi SPP';
    admin.targetX = 14;
    admin.targetY = 2;
    admin.speechBubble = { text: '✅ Catat Buku Tabungan', timer: 4.0 };
    admin.actionCooldown = 5.0;

    setTimeout(() => {
      siswa.targetX = 11;
      siswa.targetY = 11; // return to play or desk
      siswa.status = 'Bermain';
    }, 4500);

    this.recordEvent(
      siswa.id,
      'Penyetoran tabungan siswa Rp 10.000 tercatat di kasir',
      'Menabung',
      'Kantor Tata Usaha & Kasir',
      '#f59e0b'
    );
  }

  // 4. Bel Masuk & Mengajar Aktif
  public triggerClassTeaching() {
    const guru = this.avatars.find(a => a.role === 'Guru Kelas');
    if (!guru) return;

    guru.targetX = 4;
    guru.targetY = 2;
    guru.status = 'Mengajar';
    guru.actionCooldown = 6.0;
    guru.speechBubble = { text: '🌟 Mari Belajar Huruf Hijaiyah!', timer: 4.5 };

    // Move students to their classroom desks
    const students = this.avatars.filter(a => a.role === 'Siswa Hadir');
    students.forEach((s) => {
      s.targetX = s.homeTile.x;
      s.targetY = s.homeTile.y;
      s.status = 'Standby';
      s.speechBubble = { text: 'Siap Belajar! 🙋', timer: 3.5 };
    });

    this.recordEvent(
      guru.id,
      'Sesi Pembelajaran Kelas A dimulai (Materi Hijaiyah)',
      'Mengajar',
      'Ruang Kelas RA A',
      '#0284c7'
    );
  }

  // 5. Waktu Istirahat & Bermain
  public triggerPlaytime() {
    const students = this.avatars.filter(a => a.role === 'Siswa Hadir');
    const playCoords = [
      { x: 12, y: 11 },
      { x: 13, y: 12 },
      { x: 14, y: 10 }
    ];

    students.forEach((s, idx) => {
      const coord = playCoords[idx % playCoords.length];
      s.targetX = coord.x;
      s.targetY = coord.y;
      s.status = 'Bermain';
      s.speechBubble = { text: '🎉 Main Perosotan!', timer: 4.0 };
    });

    const guru = this.avatars.find(a => a.role === 'Guru Kelas');
    if (guru) {
      guru.targetX = 10;
      guru.targetY = 10;
      guru.status = 'Standby';
      guru.speechBubble = { text: 'Menjaga murid bermain aman 👀', timer: 4.0 };
    }

    this.recordEvent(
      students[0]?.id || 'av_siswa_1',
      'Bel Istirahat berbunyi: Murid bermain di playzone',
      'Bermain',
      'Taman Bermain Ramah Anak',
      '#10b981'
    );
  }

  // 6. Pojok Baca / Literasi
  public triggerLibraryReading() {
    const siswa = this.avatars.find(a => a.id === 'av_siswa_2') || this.avatars[2];
    siswa.targetX = 3;
    siswa.targetY = 12;
    siswa.status = 'Membaca';
    siswa.speechBubble = { text: '📖 Kisah Para Nabi', timer: 4.0 };

    this.recordEvent(
      siswa.id,
      'Membaca buku di Pojok Baca Cilik',
      'Membaca',
      'Pojok Baca & Sains Cilik',
      '#d97706'
    );
  }

  // 7. Random automated event when auto-simulate is ON
  private triggerRandomAutoEvent() {
    const actions = [
      () => this.triggerTeacherGradeInput(),
      () => this.triggerAttendanceScan(),
      () => this.triggerSavingsDeposit(),
      () => this.triggerClassTeaching(),
      () => this.triggerPlaytime(),
      () => this.triggerLibraryReading()
    ];
    const randFn = actions[Math.floor(Math.random() * actions.length)];
    randFn();
  }
}
