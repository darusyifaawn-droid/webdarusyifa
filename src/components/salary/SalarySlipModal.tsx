import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck, QrCode, Building2, User, Calendar, Wallet } from 'lucide-react';
import { SalarySlipData, formatRupiah, terbilang, DEFAULT_KEPSEK } from '../../lib/salaryUtils';
import { getPrintHeaderHTML, getPrintStyles } from '../../lib/printUtils';

interface SalarySlipModalProps {
  slip: SalarySlipData | null;
  onClose: () => void;
  schoolSettings?: any;
}

export default function SalarySlipModal({ slip, onClose, schoolSettings }: SalarySlipModalProps) {
  if (!slip) return null;

  const printAreaRef = useRef<HTMLDivElement>(null);
  const kepsekName = slip.namaKepsek || schoolSettings?.headmasterName || DEFAULT_KEPSEK.nama;
  const kepsekNip = slip.nipKepsek || schoolSettings?.headmasterNip || DEFAULT_KEPSEK.nip;

  // QR Signature code
  const qrData = `https://darusyifa.sch.id/verify-slip?code=${encodeURIComponent(slip.qrVerificationCode || 'DS-VERIFIED')}&name=${encodeURIComponent(slip.teacherName)}&period=${encodeURIComponent(`${slip.bulan} ${slip.tahun}`)}&total=${slip.gajiBersih}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrData)}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak. Pastikan pop-up diizinkan.');
      return;
    }

    const earningsRows = [
      { name: 'Gaji Pokok', val: slip.gajiPokok },
      ...(slip.tunjanganJabatan > 0 ? [{ name: 'Tunjangan Jabatan', val: slip.tunjanganJabatan }] : []),
      ...(slip.tunjanganWaliKelas > 0 ? [{ name: 'Tunjangan Wali Kelas', val: slip.tunjanganWaliKelas }] : []),
      ...(slip.tunjanganTransport > 0 ? [{ name: 'Tunjangan Transportasi', val: slip.tunjanganTransport }] : []),
      ...(slip.tunjanganMakan > 0 ? [{ name: 'Tunjangan Uang Makan', val: slip.tunjanganMakan }] : []),
      ...(slip.tunjanganKehadiran > 0 ? [{ name: 'Tunjangan Kehadiran', val: slip.tunjanganKehadiran }] : []),
      ...(slip.insentifBonus > 0 ? [{ name: 'Insentif & Bonus Kinerja', val: slip.insentifBonus }] : []),
      ...(slip.rincianTunjanganLain || []).map(r => ({ name: r.nama, val: r.nominal }))
    ];

    const deductionRows = [
      ...(slip.potonganBpjs > 0 ? [{ name: 'BPJS / Jaminan Kesehatan', val: slip.potonganBpjs }] : []),
      ...(slip.potonganKoperasi > 0 ? [{ name: 'Simpanan Koperasi / Kas Guru', val: slip.potonganKoperasi }] : []),
      ...(slip.potonganAbsen > 0 ? [{ name: 'Potongan Ketidakhadiran', val: slip.potonganAbsen }] : []),
      ...(slip.potonganPinjaman > 0 ? [{ name: 'Cicilan / Pinjaman', val: slip.potonganPinjaman }] : []),
      ...(slip.rincianPotonganLain || []).map(r => ({ name: r.nama, val: r.nominal }))
    ];

    const maxRows = Math.max(earningsRows.length, deductionRows.length, 1);

    let tableRowsHTML = '';
    for (let i = 0; i < maxRows; i++) {
      const e = earningsRows[i];
      const d = deductionRows[i];
      tableRowsHTML += `
        <tr>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${e ? e.name : ''}</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; font-size: 12px;">${e ? formatRupiah(e.val) : ''}</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; border-left: 2px solid #cbd5e1;">${d ? d.name : ''}</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; font-size: 12px; color: #dc2626;">${d ? formatRupiah(d.val) : ''}</td>
        </tr>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Slip Gaji - ${slip.teacherName} - ${slip.bulan} ${slip.tahun}</title>
        <style>
          ${getPrintStyles()}
          @page { size: A4 portrait; margin: 12mm 15mm; }
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; line-height: 1.4; padding: 15px; }
          .kop-surat { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 8px; }
          .kop-surat img { width: 75px; height: 75px; object-fit: contain; }
          .kop-text { text-align: center; }
          .kop-text h2 { font-size: 13px; font-weight: 700; color: #047857; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .kop-text h1 { font-size: 17px; font-weight: 900; color: #0f172a; margin: 2px 0; text-transform: uppercase; }
          .kop-text p { font-size: 11px; margin: 1px 0; color: #475569; font-weight: 500; }
          .kop-text .address { font-size: 10px; color: #64748b; margin-top: 3px; }
          .kop-divider { border: 0; border-top: 3px double #0f172a; margin: 10px 0 16px 0; }
          .slip-title { text-align: center; margin-bottom: 16px; }
          .slip-title h3 { font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; margin: 0; }
          .slip-title span { font-size: 11px; color: #64748b; font-weight: 600; }
          
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 11.5px; }
          .info-row { display: flex; justify-content: space-between; }
          .info-label { color: #64748b; font-weight: 600; }
          .info-val { color: #0f172a; font-weight: 700; text-align: right; }

          table.payroll-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          table.payroll-table th { background: #f1f5f9; padding: 8px 10px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #334155; border-top: 2px solid #94a3b8; border-bottom: 2px solid #94a3b8; }
          .total-row td { background: #f8fafc; font-weight: 800; padding: 8px 10px; font-size: 12px; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; }
          
          .take-home-box { background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 12px 16px; margin: 14px 0; display: flex; justify-content: space-between; align-items: center; }
          .take-home-label { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #065f46; letter-spacing: 0.5px; }
          .take-home-words { font-size: 10.5px; color: #047857; font-style: italic; margin-top: 2px; }
          .take-home-val { font-size: 18px; font-weight: 900; color: #047857; }

          .signature-section { display: flex; justify-content: space-between; margin-top: 24px; page-break-inside: avoid; }
          .sig-box { width: 220px; text-align: center; font-size: 11.5px; }
          .sig-box .qr-wrapper { margin: 8px auto; width: 85px; height: 85px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px; }
          .sig-box .qr-wrapper img { width: 100%; height: 100%; object-fit: contain; }
          .sig-name { font-weight: 800; color: #0f172a; margin-top: 4px; border-top: 1px solid #0f172a; padding-top: 4px; }
          .sig-nip { font-size: 10px; color: #64748b; }
          .sig-empty-space { height: 75px; }

          .doc-footer { margin-top: 20px; font-size: 9.5px; color: #94a3b8; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="kop-surat">
          <img src="/logo.png" onerror="this.src='https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/graduation-cap.svg'" alt="Logo RA Darusyifa" />
          <div class="kop-text">
            <h2>YAYASAN DARUSYIFA AL ISLAMIYAH</h2>
            <h1>RAUDHATUL ATHFAL (RA) DARUSYIFA</h1>
            <p>NSRA : 101232090331 &nbsp;|&nbsp; NPSN : 69993923 &nbsp;|&nbsp; Akreditasi : B</p>
            <p class="address">Blok Telar Baru RT.004 RW.014 Desa/Kecamatan Arjawinangun Kabupaten Cirebon</p>
          </div>
        </div>
        <hr class="kop-divider" />

        <div class="slip-title">
          <h3>SLIP GAJI & HONORARIUM GURU / KARYAWAN</h3>
          <span>Periode: <strong>${slip.bulan} ${slip.tahun}</strong> &nbsp;|&nbsp; No. Dokumen: <strong>${slip.qrVerificationCode}</strong></span>
        </div>

        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">Nama Pegawai / Guru</span>
            <span class="info-val">: ${slip.teacherName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Bulan / Periode</span>
            <span class="info-val">: ${slip.bulan} ${slip.tahun}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Jabatan / Tugas</span>
            <span class="info-val">: ${slip.teacherJabatan || 'Guru Pengajar'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status Pembayaran</span>
            <span class="info-val" style="color: #059669;">: ${slip.status.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Penugasan Kelas</span>
            <span class="info-val">: ${slip.assignedClass || 'Semua Kelas'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Metode Pembayaran</span>
            <span class="info-val">: ${slip.metodePembayaran || 'Tunai / Kas Sekolah'}</span>
          </div>
        </div>

        <table class="payroll-table">
          <thead>
            <tr>
              <th style="width: 32%;">I. PENERIMAAN (PENGHASILAN)</th>
              <th style="width: 18%; text-align: right;">JUMLAH (RP)</th>
              <th style="width: 32%; border-left: 2px solid #cbd5e1;">II. POTONGAN</th>
              <th style="width: 18%; text-align: right;">JUMLAH (RP)</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHTML}
            <tr class="total-row">
              <td><strong>TOTAL PENERIMAAN (A)</strong></td>
              <td style="text-align: right; color: #047857;"><strong>${formatRupiah(slip.totalPenerimaan)}</strong></td>
              <td style="border-left: 2px solid #cbd5e1;"><strong>TOTAL POTONGAN (B)</strong></td>
              <td style="text-align: right; color: #dc2626;"><strong>${formatRupiah(slip.totalPotongan)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="take-home-box">
          <div>
            <div class="take-home-label">GAJI BERSIH DITERIMA (TAKE HOME PAY = A - B)</div>
            <div class="take-home-words">Terbilang: <strong>${terbilang(slip.gajiBersih)}</strong></div>
          </div>
          <div class="take-home-val">${formatRupiah(slip.gajiBersih)}</div>
        </div>

        <div style="font-size: 10.5px; color: #475569; margin-top: 6px;">
          ${slip.catatan ? `<em>Catatan: ${slip.catatan}</em>` : ''}
        </div>

        <div class="signature-section">
          <div class="sig-box">
            <p>Penerima / Guru,</p>
            <div class="sig-empty-space"></div>
            <div class="sig-name">${slip.teacherName}</div>
            <div class="sig-nip">${slip.teacherNip ? `NIP: ${slip.teacherNip}` : 'Pegawai / Guru RA Darusyifa'}</div>
          </div>

          <div class="sig-box">
            <p>Arjawinangun, ${slip.tanggalTerbit || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br>Kepala Sekolah,</p>
            <div class="qr-wrapper">
              <img src="${qrImageUrl}" alt="Barcode Signature Kepsek" />
            </div>
            <div class="sig-name">${kepsekName}</div>
            <div class="sig-nip">NIP: ${kepsekNip}</div>
          </div>
        </div>

        <div class="doc-footer">
          * Dokumen ini dibuat secara otomatis oleh Sistem Informasi Akademik & Keuangan RA DAARUSSYIFA dan telah diverifikasi keabsahannya dengan Barcode Tanda Tangan Elektronik Kepala Sekolah.
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[250] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Wallet className="text-emerald-200" size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                Pratinjau Slip Gaji Resmi
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/30 border border-emerald-400/40 rounded-full text-emerald-100">
                  {slip.status}
                </span>
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                Periode {slip.bulan} {slip.tahun} &bull; {slip.teacherName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white text-emerald-900 rounded-xl font-bold text-xs hover:bg-emerald-50 transition-all flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Printer size={15} /> Cetak / PDF
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Content / Visual Slip View */}
        <div ref={printAreaRef} className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto space-y-6 text-slate-800 bg-slate-50/50">
          
          {/* Official Kop Mock */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left border-b border-slate-100 pb-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xl shrink-0">
                RA
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Yayasan Darusyifa Al Islamiyah</h4>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">RAUDHATUL ATHFAL (RA) DARUSYIFA</h2>
                <p className="text-[11px] text-slate-500 font-medium">NSRA: 101232090331 &bull; NPSN: 69993923 &bull; Kec. Arjawinangun, Kab. Cirebon</p>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  {slip.qrVerificationCode}
                </span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Nama Guru/Pegawai:</span>
                <span className="font-bold text-slate-900">{slip.teacherName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Bulan / Periode:</span>
                <span className="font-bold text-slate-900">{slip.bulan} {slip.tahun}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Jabatan:</span>
                <span className="font-bold text-slate-900">{slip.teacherJabatan || 'Guru Pengajar'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Penugasan Kelas:</span>
                <span className="font-bold text-slate-900">{slip.assignedClass || 'Semua Kelas'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Metode Bayar:</span>
                <span className="font-bold text-slate-900">{slip.metodePembayaran || 'Tunai'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Tanggal Terbit:</span>
                <span className="font-bold text-slate-900">{slip.tanggalTerbit || '-'}</span>
              </div>
            </div>
          </div>

          {/* Table Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Penerimaan */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-100">
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Penerimaan (Gaji)
                </h4>
                <span className="text-xs font-black text-emerald-700">{formatRupiah(slip.totalPenerimaan)}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gaji Pokok</span>
                  <span className="font-bold text-slate-800">{formatRupiah(slip.gajiPokok)}</span>
                </div>
                {slip.tunjanganJabatan > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tunjangan Jabatan</span>
                    <span className="font-bold text-slate-800">{formatRupiah(slip.tunjanganJabatan)}</span>
                  </div>
                )}
                {slip.tunjanganWaliKelas > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tunjangan Wali Kelas</span>
                    <span className="font-bold text-slate-800">{formatRupiah(slip.tunjanganWaliKelas)}</span>
                  </div>
                )}
                {slip.tunjanganTransport > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tunjangan Transportasi</span>
                    <span className="font-bold text-slate-800">{formatRupiah(slip.tunjanganTransport)}</span>
                  </div>
                )}
                {slip.tunjanganMakan > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tunjangan Uang Makan</span>
                    <span className="font-bold text-slate-800">{formatRupiah(slip.tunjanganMakan)}</span>
                  </div>
                )}
                {slip.tunjanganKehadiran > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tunjangan Kehadiran</span>
                    <span className="font-bold text-slate-800">{formatRupiah(slip.tunjanganKehadiran)}</span>
                  </div>
                )}
                {slip.insentifBonus > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Insentif / Bonus Kinerja</span>
                    <span className="font-bold text-slate-800">{formatRupiah(slip.insentifBonus)}</span>
                  </div>
                )}
                {(slip.rincianTunjanganLain || []).map((t, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600">
                    <span>{t.nama}</span>
                    <span className="font-bold text-slate-800">{formatRupiah(t.nominal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Potongan */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-rose-100">
                <h4 className="text-xs font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Potongan
                </h4>
                <span className="text-xs font-black text-rose-700">{formatRupiah(slip.totalPotongan)}</span>
              </div>
              <div className="space-y-2 text-xs">
                {slip.potonganBpjs > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>BPJS / Asuransi Kesehatan</span>
                    <span className="font-bold text-rose-600">-{formatRupiah(slip.potonganBpjs)}</span>
                  </div>
                )}
                {slip.potonganKoperasi > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Simpanan Koperasi / Kas</span>
                    <span className="font-bold text-rose-600">-{formatRupiah(slip.potonganKoperasi)}</span>
                  </div>
                )}
                {slip.potonganAbsen > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Potongan Ketidakhadiran</span>
                    <span className="font-bold text-rose-600">-{formatRupiah(slip.potonganAbsen)}</span>
                  </div>
                )}
                {slip.potonganPinjaman > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Cicilan / Pinjaman</span>
                    <span className="font-bold text-rose-600">-{formatRupiah(slip.potonganPinjaman)}</span>
                  </div>
                )}
                {(slip.rincianPotonganLain || []).map((p, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600">
                    <span>{p.nama}</span>
                    <span className="font-bold text-rose-600">-{formatRupiah(p.nominal)}</span>
                  </div>
                ))}
                {slip.totalPotongan === 0 && (
                  <div className="text-center py-4 text-slate-400 italic text-xs">
                    Tidak ada potongan pada periode ini
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Take Home Pay Callout */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-500/40 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-[11px] font-black uppercase text-emerald-800 tracking-wider">
                Gaji Bersih Diterima (Take Home Pay)
              </span>
              <p className="text-xs text-emerald-950 font-medium italic mt-0.5">
                Terbilang: <strong>{terbilang(slip.gajiBersih)}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                {formatRupiah(slip.gajiBersih)}
              </span>
            </div>
          </div>

          {/* Barcode Signature Preview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0 flex items-center justify-center">
                <img src={qrImageUrl} alt="Barcode Signature" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs">
                  <ShieldCheck size={16} /> Terverifikasi Secara Digital
                </div>
                <h5 className="text-sm font-black text-slate-900 mt-0.5">{kepsekName}</h5>
                <p className="text-xs text-slate-500 font-medium">Kepala Sekolah RA Darusyifa</p>
                <p className="text-[10px] text-slate-400 font-mono mt-1">Kode: {slip.qrVerificationCode}</p>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xs text-slate-500 font-medium">Disahkan di Arjawinangun</p>
              <p className="text-xs font-bold text-slate-800">{slip.tanggalTerbit || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <button
                onClick={handlePrint}
                className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md mx-auto sm:ml-auto"
              >
                <Printer size={14} /> Cetak Slip Gaji Sekarang
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
