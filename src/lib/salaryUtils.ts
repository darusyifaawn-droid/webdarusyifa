// Utility functions for Salary Slip (Slip Gaji) and Financial Calculations

export interface SalaryItem {
  nama: string;
  nominal: number;
}

export interface SalarySlipData {
  id?: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  teacherNip?: string;
  teacherJabatan?: string;
  assignedClass?: string;
  bulan: string;
  tahun: number;
  periode: string; // e.g. "Agustus 2026"
  tanggalTerbit: string; // YYYY-MM-DD
  
  // Earnings (Penerimaan)
  gajiPokok: number;
  tunjanganJabatan: number;
  tunjanganWaliKelas: number;
  tunjanganTransport: number;
  tunjanganMakan: number;
  tunjanganKehadiran: number;
  insentifBonus: number;
  rincianTunjanganLain: SalaryItem[];
  totalPenerimaan: number;

  // Deductions (Potongan)
  potonganBpjs: number;
  potonganKoperasi: number;
  potonganAbsen: number;
  potonganPinjaman: number;
  rincianPotonganLain: SalaryItem[];
  totalPotongan: number;

  // Take Home Pay
  gajiBersih: number;

  // Status & Metadata
  status: 'Draft' | 'Diterbitkan' | 'Dibayarkan';
  metodePembayaran: string; // e.g. 'Transfer Bank', 'Tunai'
  nomorRekening?: string;
  bankName?: string;
  catatan?: string;
  
  // Signatures
  namaKepsek: string;
  nipKepsek?: string;
  qrVerificationCode: string;
  createdAt?: any;
  updatedAt?: any;
}

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const DEFAULT_KEPSEK = {
  nama: 'Gian Dwi Wahyuni, S.H',
  nip: '19880512 201503 2 001',
  jabatan: 'Kepala Sekolah RA Darusyifa'
};

/**
 * Convert number to Indonesian words (Terbilang Rupiah)
 */
export function terbilang(n: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];

  const num = Math.floor(Math.abs(n));
  if (num === 0) return 'Nol Rupiah';

  function toWords(x: number): string {
    if (x < 12) {
      return bilangan[x];
    } else if (x < 20) {
      return toWords(x - 10) + ' Belas';
    } else if (x < 100) {
      return toWords(Math.floor(x / 10)) + ' Puluh ' + toWords(x % 10);
    } else if (x < 200) {
      return 'Seratus ' + toWords(x - 100);
    } else if (x < 1000) {
      return toWords(Math.floor(x / 100)) + ' Ratus ' + toWords(x % 100);
    } else if (x < 2000) {
      return 'Seribu ' + toWords(x - 1000);
    } else if (x < 1000000) {
      return toWords(Math.floor(x / 1000)) + ' Ribu ' + toWords(x % 1000);
    } else if (x < 1000000000) {
      return toWords(Math.floor(x / 1000000)) + ' Juta ' + toWords(x % 1000000);
    } else if (x < 1000000000000) {
      return toWords(Math.floor(x / 1000000000)) + ' Milyar ' + toWords(x % 1000000000);
    }
    return '';
  }

  const result = toWords(num).replace(/\s+/g, ' ').trim();
  return result ? `${result} Rupiah` : 'Nol Rupiah';
}

/**
 * Format currency to IDR
 */
export function formatRupiah(amount: number | string | undefined | null): string {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val);
}

/**
 * Generate unique verification code and QR signature string
 */
export function generateVerificationCode(teacherName: string, month: string, year: number): string {
  const monthIdx = (MONTH_NAMES.indexOf(month) + 1).toString().padStart(2, '0');
  const cleanName = (teacherName || 'GURU').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DS-SLIP-${year}${monthIdx}-${cleanName}-${rand}`;
}

export function generateQrVerificationData(slip: SalarySlipData): string {
  return JSON.stringify({
    institution: 'RA DAARUSSYIFA ARJAWINANGUN',
    document: 'SLIP GAJI RESMI GURU / PEGAWAI',
    code: slip.qrVerificationCode,
    teacher: slip.teacherName,
    period: `${slip.bulan} ${slip.tahun}`,
    netSalary: formatRupiah(slip.gajiBersih),
    status: slip.status,
    issuedDate: slip.tanggalTerbit,
    authorizedBy: slip.namaKepsek || DEFAULT_KEPSEK.nama,
    verified: 'DIGITALLY SIGNED & VALID'
  });
}
