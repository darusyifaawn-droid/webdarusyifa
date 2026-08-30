// Utility functions for Cash Deposits (Setoran Cash Bendahara ke Kepala Sekolah / Yayasan)
import { formatRupiah, terbilang } from './salaryUtils';
import { getPrintHeaderHTML, getPrintStyles } from './printUtils';

export interface CashDeposit {
  id?: string;
  depositNumber: string; // e.g. "SC-260824-001"
  date: string; // YYYY-MM-DD
  time: string; // HH:mm e.g. "08:30"
  periodType: 'Harian' | 'Mingguan' | 'Bulanan' | 'Custom';
  depositType: 'Tabungan' | 'Iuran Bulanan' | 'Uang Kegiatan' | 'PPDB / Pendaftaran' | 'Penjualan Buku / Seragam' | 'Lainnya';
  source: string; // e.g. "Kelas Umar", "Kelas Utsman", "Sumber Lain", "Pendaftaran"
  amount: number;
  description: string;

  // Treasurer (Disetor & Diverifikasi Oleh)
  treasurerId?: string;
  treasurerName: string;
  treasurerNip?: string;
  treasurerTitle: string;
  treasurerVerified: boolean;
  treasurerVerifiedAt?: string;
  treasurerSignature?: string;

  // Principal / Foundation (Diterima & Disahkan Oleh)
  receiverId?: string;
  receiverName: string;
  receiverNip?: string;
  receiverTitle: string;
  principalVerified: boolean;
  principalVerifiedAt?: string;
  principalSignature?: string;

  // Final Status
  status: 'menunggu_verifikasi_bendahara' | 'menunggu_verifikasi_kepsek' | 'disahkan' | 'ditolak';
  rejectionReason?: string;

  // Verification & Audit Metadata
  qrVerificationCode?: string;
  relatedPaymentIds?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export const DEPOSIT_TYPES = [
  { id: 'Tabungan', label: 'Tabungan', desc: 'Setoran uang tabungan siswa', color: 'emerald' },
  { id: 'Iuran Bulanan', label: 'Iuran Bulanan / SPP', desc: 'Setoran SPP / iuran rutin bulanan', color: 'blue' },
  { id: 'Uang Kegiatan', label: 'Uang Kegiatan / Event', desc: 'Setoran kegiatan, field trip, perpisahan, dll', color: 'purple' },
  { id: 'PPDB / Pendaftaran', label: 'PPDB / Pendaftaran', desc: 'Setoran uang formulir & infaq pendaftaran', color: 'teal' },
  { id: 'Penjualan Buku / Seragam', label: 'Penjualan Buku / Seragam', desc: 'Setoran hasil penjualan atribut & seragam', color: 'amber' },
  { id: 'Lainnya', label: 'Lainnya', desc: 'Setoran dana kas masuk lainnya', color: 'slate' }
];

export const DEFAULT_TREASURER = {
  name: 'Siti Aisyah, S.Pd',
  nip: 'BDH-001',
  title: 'Bendahara RA Darusyifa'
};

export const DEFAULT_PRINCIPAL = {
  name: 'Gian Dwi Wahyuni, S.H',
  nip: '19880512 201503 2 001',
  title: 'Kepala Sekolah RA Darusyifa'
};

/**
 * Generate unique formatted Deposit Number: SC-YYMMDD-XXX
 */
export function generateDepositNumber(dateStr?: string, existingCount: number = 0): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const yy = d.getFullYear().toString().slice(-2);
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  const seq = (existingCount + 1).toString().padStart(3, '0');
  return `SC-${yy}${mm}${dd}-${seq}`;
}

/**
 * Generate Verification QR Data JSON string
 */
export function generateDepositQrData(deposit: CashDeposit): string {
  return JSON.stringify({
    institution: 'RA DAARUSSYIFA ARJAWINANGUN',
    doc: 'BUKTI RESMI SETORAN CASH BENDAHARA',
    depositNo: deposit.depositNumber,
    date: deposit.date,
    time: deposit.time,
    type: deposit.depositType,
    source: deposit.source,
    amount: formatRupiah(deposit.amount),
    treasurer: deposit.treasurerName,
    receiver: deposit.receiverName,
    status: deposit.status.toUpperCase(),
    validatedAt: deposit.principalVerifiedAt || deposit.treasurerVerifiedAt || new Date().toISOString()
  });
}

/**
 * Generate Printable Official HTML for "Bukti Setoran Cash"
 */
export function generateBuktiSetoranPrintHTML(deposit: CashDeposit): string {
  const terbilangText = terbilang(deposit.amount);
  const qrData = generateDepositQrData(deposit);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrData)}`;

  const isDisahkan = deposit.status === 'disahkan';
  const isBendaharaVerif = deposit.treasurerVerified || isDisahkan;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bukti Setoran Cash - ${deposit.depositNumber}</title>
      <style>
        ${getPrintStyles()}
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }
        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #0f172a;
          background: #ffffff;
          padding: 10px;
          line-height: 1.4;
        }
        .header-title-box {
          text-align: center;
          margin-top: -15px;
          margin-bottom: 20px;
        }
        .header-title-box h2 {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin: 0;
          color: #0f172a;
        }
        .badge-no {
          display: inline-block;
          background: #047857;
          color: #ffffff;
          font-size: 13px;
          font-weight: 800;
          padding: 4px 14px;
          border-radius: 999px;
          letter-spacing: 0.5px;
          margin-top: 6px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 16px;
          font-size: 12px;
        }
        .meta-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 14px;
        }
        .meta-card h4 {
          margin: 0 0 6px 0;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }
        .detail-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 5px;
          font-size: 12px;
        }
        .detail-table td {
          padding: 4px 6px;
          border-bottom: none;
        }
        .detail-table td.label {
          width: 130px;
          color: #64748b;
          font-weight: 600;
        }
        .detail-table td.val {
          font-weight: 700;
          color: #0f172a;
        }
        .amount-box {
          background: #ecfdf5;
          border: 2px solid #a7f3d0;
          border-radius: 10px;
          padding: 12px 18px;
          margin: 16px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .amount-box .lbl {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          color: #065f46;
        }
        .amount-box .terbilang {
          font-size: 11px;
          font-style: italic;
          color: #047857;
          margin-top: 3px;
        }
        .amount-box .num {
          font-size: 22px;
          font-weight: 900;
          color: #047857;
          letter-spacing: -0.5px;
        }
        
        /* 3-Column Verification Signatures */
        .signatures-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-top: 24px;
          page-break-inside: avoid;
        }
        .sig-box {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
          background: #ffffff;
          position: relative;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .sig-box .title {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: #475569;
          margin-bottom: 4px;
        }
        .sig-box .sig-visual {
          margin: 6px auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .sig-box .paraf {
          font-family: 'Brush Script MT', 'Dancing Script', cursive, sans-serif;
          font-size: 24px;
          color: #1e3a8a;
          transform: rotate(-3deg);
          margin: 4px 0;
        }
        .stamp-official {
          position: absolute;
          right: 8px;
          bottom: 24px;
          width: 65px;
          height: 65px;
          border: 2px dashed #1e40af;
          border-radius: 50%;
          color: #1e40af;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
          text-align: center;
          opacity: 0.85;
          transform: rotate(-12deg);
          pointer-events: none;
        }
        .badge-status-sig {
          display: inline-block;
          font-size: 9px;
          font-weight: 900;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          margin-top: 3px;
        }
        .sig-name {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          border-top: 1px solid #94a3b8;
          padding-top: 4px;
          margin-top: auto;
        }
        .sig-date {
          font-size: 9px;
          color: #64748b;
          margin-top: 2px;
        }
        .footer-note {
          margin-top: 20px;
          font-size: 10px;
          color: #64748b;
          text-align: center;
          border-top: 1px dashed #cbd5e1;
          padding-top: 8px;
        }
      </style>
    </head>
    <body>
      ${getPrintHeaderHTML('BUKTI RESMI SETORAN CASH')}
      
      <div class="header-title-box">
        <span class="badge-no">${deposit.depositNumber}</span>
      </div>

      <div class="meta-grid">
        <div class="meta-card">
          <h4>Data Penyetoran (Bendahara)</h4>
          <table class="detail-table">
            <tr>
              <td class="label">Disetor Oleh</td>
              <td class="val">: ${deposit.treasurerName}</td>
            </tr>
            <tr>
              <td class="label">NIP / ID</td>
              <td class="val">: ${deposit.treasurerNip || 'BDH-001'}</td>
            </tr>
            <tr>
              <td class="label">Jabatan</td>
              <td class="val">: ${deposit.treasurerTitle}</td>
            </tr>
            <tr>
              <td class="label">Tanggal & Waktu</td>
              <td class="val">: ${deposit.date} - Pukul ${deposit.time} WIB</td>
            </tr>
            <tr>
              <td class="label">Periode Setoran</td>
              <td class="val">: ${deposit.periodType}</td>
            </tr>
          </table>
        </div>

        <div class="meta-card">
          <h4>Penerima (Kepala Sekolah / Yayasan)</h4>
          <table class="detail-table">
            <tr>
              <td class="label">Diterima Oleh</td>
              <td class="val">: ${deposit.receiverName}</td>
            </tr>
            <tr>
              <td class="label">NIP / ID</td>
              <td class="val">: ${deposit.receiverNip || '-'}</td>
            </tr>
            <tr>
              <td class="label">Jabatan</td>
              <td class="val">: ${deposit.receiverTitle}</td>
            </tr>
            <tr>
              <td class="label">Jenis Setoran</td>
              <td class="val">: <strong style="color:#047857;">${deposit.depositType}</strong></td>
            </tr>
            <tr>
              <td class="label">Sumber Dana / Kelas</td>
              <td class="val">: ${deposit.source}</td>
            </tr>
          </table>
        </div>
      </div>

      <div class="amount-box">
        <div>
          <div class="lbl">Total Uang Cash Yang Disetorkan</div>
          <div class="terbilang">Terbilang: "${terbilangText}"</div>
          <div style="font-size: 11px; color: #475569; margin-top: 4px;">Keterangan: ${deposit.description || '-'}</div>
        </div>
        <div class="num">${formatRupiah(deposit.amount)}</div>
      </div>

      <!-- 3-Column Verification Signatures -->
      <div class="signatures-grid">
        {/* Kolom 1: Disetor Oleh (Bendahara) */}
        <div class="sig-box">
          <div class="title">Disetor Oleh (Bendahara)</div>
          <div class="sig-visual">
            <div class="paraf">${deposit.treasurerName.split(' ')[0]}</div>
            <span class="badge-status-sig" style="background:#f1f5f9; color:#475569;">DISETORKAN</span>
          </div>
          <div>
            <div class="sig-name">${deposit.treasurerName}</div>
            <div class="sig-date">${deposit.date} ${deposit.time} WIB</div>
          </div>
        </div>

        {/* Kolom 2: Diverifikasi Oleh (Bendahara) */}
        <div class="sig-box">
          <div class="title">Diverifikasi (Bendahara)</div>
          <div class="sig-visual">
            ${isBendaharaVerif ? `
              <div class="paraf" style="color: #059669;">✓ Verified</div>
              <span class="badge-status-sig" style="background:#d1fae5; color:#065f46; border: 1px solid #6ee7b7;">TER-VERIFIKASI</span>
            ` : `
              <div style="height: 35px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #94a3b8; font-style: italic;">Menunggu Verifikasi</div>
              <span class="badge-status-sig" style="background:#fef3c7; color:#92400e;">PENDING</span>
            `}
          </div>
          <div>
            <div class="sig-name">${deposit.treasurerName}</div>
            <div class="sig-date">${deposit.treasurerVerifiedAt || (isBendaharaVerif ? deposit.date : '-')}</div>
          </div>
        </div>

        {/* Kolom 3: Diverifikasi & Disahkan Oleh (Kepala Sekolah / Yayasan) */}
        <div class="sig-box">
          <div class="title">Disahkan (Kepsek / Yayasan)</div>
          <div class="sig-visual">
            ${isDisahkan ? `
              <img src="${qrUrl}" style="width: 55px; height: 55px; object-fit: contain; margin-bottom: 2px;" alt="QR Verification" />
              <span class="badge-status-sig" style="background:#d1fae5; color:#065f46; border: 1px solid #6ee7b7;">DISAHKAN</span>
              <div class="stamp-official">
                RA DARUSYIFA<br/>★ SAH ★<br/>ARJAWINANGUN
              </div>
            ` : `
              <div style="height: 45px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #94a3b8; font-style: italic;">Menunggu Pengesahan</div>
              <span class="badge-status-sig" style="background:#fef3c7; color:#92400e;">BELUM DISAHKAN</span>
            `}
          </div>
          <div>
            <div class="sig-name">${deposit.receiverName}</div>
            <div class="sig-date">${deposit.principalVerifiedAt || (isDisahkan ? deposit.date : '-')}</div>
          </div>
        </div>
      </div>

      <div class="footer-note">
        Bukti ini adalah tanda sah setoran uang cash dari Bendahara ke Kepala Sekolah / Yayasan dan menjadi bagian resmi dari pembukuan laporan kas RA Darusyifa.
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;
}
