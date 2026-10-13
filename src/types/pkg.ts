export interface IndicatorItem {
  id: number;
  code: string; // e.g. "1.1", "1.2"
  text: string;
  evidence: string[]; // Bukti Kinerja
}

export interface PkgComponent {
  id: number;
  competencyId: number; // 1: Pedagogik, 2: Kepribadian, 3: Profesional, 4: Sosial
  competencyTitle: string;
  title: string;
  indicators: IndicatorItem[];
}

export interface TeacherInfo {
  id: string;
  name: string;
  nip: string;
  nuptk: string; // NUPTK / PegID / NRG
  birthPlaceDate: string; // Tempat, Tanggal Lahir
  rankGrade: string; // Pangkat / Golongan Ruang (misal: Penata Muda / III/a)
  position: string; // Jabatan (misal: Guru Pertama / Guru Kelas)
  teacherType: string; // Jenis Guru (default: Guru Kelas)
  teachingAssignment: string; // Tugas yang Diampu / Mengajar (default: Guru Kelas RA)
  additionalDuty?: string; // Tugas Tambahan (default: - atau Wali Kelas)
  tmtTeacher: string; // TMT Sebagai Guru
  serviceYears: string; // Masa Kerja (misal: 6 Tahun 4 Bulan)
  gender: string; // Jenis Kelamin: Laki-laki / Perempuan
  lastEducation: string; // Pendidikan Terakhir / Spesialisasi (misal: S1 PG-PAUD)
  foundationName?: string; // Nama Yayasan (misal: YAYASAN PENDIDIKAN ISLAM ...)
  schoolName: string; // Tempat Tugas (misal: RA Al-Ikhlas)
  nsm?: string; // Nomor Statistik Madrasah (NSM)
  npsn?: string; // Nomor Pokok Sekolah Nasional (NPSN)
  schoolAddress: string; // Alamat Tempat Tugas
  schoolVillage: string; // Desa / Kelurahan
  schoolDistrict: string; // Kecamatan
  schoolCity: string; // Kabupaten / Kota (misal: Kabupaten Cirebon)
  schoolProvince: string; // Provinsi (misal: Jawa Barat)
  schoolPostalCode?: string; // Kode Pos
  schoolPhone: string; // Telp / Fax
  schoolEmail?: string;
  schoolWebsite?: string;
  schoolLogoUrl?: string; // Base64 data URL or 'kemenag' or 'default'
  unitOfWork: string; // Unit Kerja (misal: Kementerian Agama Kabupaten Cirebon)
  workStartDateAtSchool: string; // Tanggal Mulai Bekerja di RA Ini
  kemenagOfficeAddress: string; // Alamat Kantor Kemenag (default: Jalan Sunan Drajat No. 5...)
  kemenagOfficeContact: string; // Email / Website Kemenag
}

export interface AssessmentMetadata {
  period: string; // Periode Penilaian (misal: "Januari s/d Desember 2026")
  year: string; // Tahun (misal: "2026")
  assessmentType: 'PKG Awal' | 'PKG'; // PKG Awal atau PKG reguler
  assessmentDate: string; // Tanggal Penilaian (misal: "31 Desember 2026")
  cityDate: string; // Kota TTD (misal: "Cirebon, 31 Desember 2026")
  assessorName: string; // Nama Penilai
  assessorNip: string; // NIP Penilai
  assessorRank: string; // Pangkat/Golongan Penilai
  assessorPosition: string; // Jabatan Penilai (misal: Pengawas Madrasah / Guru Senior)
  supervisorName?: string; // Nama Supervisor / Pengawas
  supervisorNip?: string; // NIP Supervisor
  headmasterName: string; // Nama Kepala RA
  headmasterNip: string; // NIP Kepala RA
}

export interface CreditScoreParams {
  akk: number; // Angka Kredit Kumulatif minimal naik pangkat
  akpkb: number; // Angka Kredit PKB (Pengembangan Diri + Publikasi/Karya Inovatif)
  akp: number; // Angka Kredit Unsur Penunjang
  jm: number; // Jam Mengajar tatap muka per minggu (standar 24)
  jwm: number; // Jam Wajib Mengajar per minggu (standar 24)
}

export interface TeacherRecord {
  id: string;
  updatedAt: string;
  teacher: TeacherInfo;
  metadata: AssessmentMetadata;
  creditParams: CreditScoreParams;
  scores: Record<string, number>; // indicator code -> score (0, 1, or 2)
}

export interface ComponentCalculation {
  componentId: number;
  totalScore: number;
  maxScore: number;
  percentage: number;
  componentValue: number; // 1, 2, 3, or 4
}

export interface FullEvaluationResult {
  componentResults: ComponentCalculation[];
  totalComponentScore: number; // Nilai PKG (sum of component values, max 60)
  maxComponentScore: number; // 60
  scale100Score: number; // (totalComponentScore / 60) * 100
  predicate: string; // 'Amat Baik' | 'Baik' | 'Cukup' | 'Sedang' | 'Kurang'
  npkPercent: number; // 125, 100, 75, 50, or 25
  annualCreditScore: number; // ((AKK - AKPKB - AKP) * (JM / JWM) * (NPK / 100)) / 4
}
