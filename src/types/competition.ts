export interface CompetitionEvent {
  id: string;
  title: string; // e.g. "LOMBA FASHION SHOW BUSANA MUSLIM"
  category: string; // "Fashion Show" | "Keagamaan" | "Kesenian" | "Olahraga" | "Akademik" | "Lainnya"
  date: string; // e.g. "2026-08-29"
  dateFormatted?: string; // e.g. "Sabtu, 29 Agustus 2026"
  academicYear: string; // e.g. "2025/2026"
  baNumber?: string; // e.g. "042/BA-JURI/RA-DS/2026"
  location?: string; // e.g. "panggung utama RA Darusyifa Arjawinangun"
  criteria?: string; // e.g. "kesesuaian busana, catwalk/kelincahan, ekspresi/percaya diri, dan kerapihan"
  description?: string;
  theme?: string; // e.g. "Busana Muslim Anak Ceria & Berkarakter Qurani"
  status: 'Aktif' | 'Selesai' | 'Arsip';
  headmasterName: string; // default "GIAN DWI WAHYUNI, S.H"
  headmasterNip: string; // default "NPK: 8950490276014"
  juryName: string; // default "MUHAMAD NUGI ANDRI, S.H"
  juryTitle: string; // default "Ketua Dewan Juri"
  jury2Name?: string;
  jury2Title?: string;
  jury3Name?: string;
  jury3Title?: string;
  certificatePrefix: string; // e.g. "RADS-CERT-2026"
  juriesCount: number; // 1, 2, or 3
  allowTeacherScoring?: boolean; // Admin grants scoring permission to teachers
  isPublished?: boolean; // Admin publication toggle for Guru and Siswa
  createdAt?: any;
  updatedAt?: any;
}

export interface CompetitionParticipant {
  id: string;
  eventId: string;
  eventTitle: string;
  studentId?: string; // linked student uid if available
  studentName: string;
  nis?: string;
  kelas: string; // e.g. "Kelas Utsman bin Affan" | "Kelas Umar bin Khattab" | "Kelompok A" | "Kelompok B"
  gender?: 'Putra' | 'Putri';
  noUrut: string; // e.g. "#41", "41"
  groupCategory?: string; // e.g. "Kelompok B", "Kelompok A"
  scores: {
    juri1?: number;
    juri2?: number;
    juri3?: number;
  };
  averageScore: number;
  rank?: number;
  award?: string; // e.g. "JUARA 1", "JUARA 2", "JUARA 3", "HARAPAN 1", "PESERTA BERBAKAT FASHION SHOW", "PESERTA TERBAIK"
  certificateNumber: string; // e.g. "RADS-CERT-2026/041-RADS-2024-021"
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}
