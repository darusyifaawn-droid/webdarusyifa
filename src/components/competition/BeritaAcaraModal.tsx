import React from 'react';
import { X, Printer, Download, CheckCircle, FileText, Award, QrCode } from 'lucide-react';
import { CompetitionEvent, CompetitionParticipant } from '../../types/competition';

interface BeritaAcaraModalProps {
  event: CompetitionEvent;
  participants: CompetitionParticipant[];
  onClose: () => void;
}

export default function BeritaAcaraModal({ event, participants, onClose }: BeritaAcaraModalProps) {
  // Sort participants by rank or score
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank;
    return (b.averageScore || 0) - (a.averageScore || 0);
  });

  const baNumber = event.baNumber || '042/BA-JURI/RA-DS/2026';
  const eventDateStr = event.dateFormatted || 'Sabtu, 29 Agustus 2026';
  const location = event.location || 'panggung utama RA Darusyifa Arjawinangun';
  const criteria = event.criteria || 'kesesuaian busana, catwalk/kelincahan, ekspresi/percaya diri, dan kerapihan';
  let headmasterNip = event.headmasterNip || 'NPK: 8950490276014';
  if (headmasterNip.includes('8950490276014') && headmasterNip.startsWith('NIP:')) {
    headmasterNip = headmasterNip.replace('NIP:', 'NPK:');
  }

  const qrJuriData = `VERIFIKASI-BERITA-ACARA|NO:${baNumber}|EVENT:${event.title}|JURI:${event.juryName}|TGL:${eventDateStr}`;
  const qrKepsekData = `VERIFIKASI-KEPALA-SEKOLAH|NO:${baNumber}|EVENT:${event.title}|KEPSEK:${event.headmasterName}|NPK:${headmasterNip}|STATUS:SAH`;

  const qrJuriUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrJuriData)}`;
  const qrKepsekUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrKepsekData)}`;

  const handlePrint = () => {
    const isSingleJury = (event.juriesCount === 1) || (!event.jury2Name && !event.jury3Name);

    const tableRows = sortedParticipants.map((p, idx) => {
      const rankNum = p.rank || idx + 1;
      const juri1Score = p.scores?.juri1 ? p.scores.juri1.toFixed(1) : (p.averageScore && p.averageScore > 0 ? p.averageScore.toFixed(1) : '-');
      const juri2Score = p.scores?.juri2 ? p.scores.juri2.toFixed(1) : '-';
      const juri3Score = p.scores?.juri3 ? p.scores.juri3.toFixed(1) : '-';
      const avgScore = p.averageScore !== undefined ? p.averageScore.toFixed(2) : '0.00';
      const awardLabel = p.award || (rankNum <= 3 ? `JUARA ${rankNum}` : 'PESERTA BERBAKAT FASHION SHOW');

      const isTop1 = rankNum === 1;
      const isTop2 = rankNum === 2;
      const isTop3 = rankNum === 3;
      const rowBg = isTop1 ? 'background-color: #fef9c3; font-weight: bold;' : isTop2 ? 'background-color: #f1f5f9; font-weight: bold;' : isTop3 ? 'background-color: #ffedd5; font-weight: bold;' : '';

      if (isSingleJury) {
        return `
          <tr style="${rowBg}">
            <td style="text-align: center; font-weight: bold; border: 1px solid #94a3b8; padding: 4px 6px;">${rankNum}</td>
            <td style="text-align: center; font-weight: bold; border: 1px solid #94a3b8; padding: 4px 6px;">${p.noUrut || `#${idx + 1}`}</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: 600;">${p.studentName}</td>
            <td style="text-align: center; border: 1px solid #94a3b8; padding: 4px 6px; font-size: 11px;">${p.kelas || '-'}</td>
            <td style="text-align: center; font-weight: 800; border: 1px solid #94a3b8; padding: 4px 6px;">${avgScore}</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-size: 10.5px; font-weight: bold; color: ${rankNum <= 3 ? '#b45309' : '#0f766e'};">${awardLabel}</td>
          </tr>
        `;
      }

      return `
        <tr style="${rowBg}">
          <td style="text-align: center; font-weight: bold; border: 1px solid #94a3b8; padding: 4px 6px;">${rankNum}</td>
          <td style="text-align: center; font-weight: bold; border: 1px solid #94a3b8; padding: 4px 6px;">${p.noUrut || `#${idx + 1}`}</td>
          <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: 600;">${p.studentName}</td>
          <td style="text-align: center; border: 1px solid #94a3b8; padding: 4px 6px; font-size: 11px;">${p.kelas || '-'}</td>
          <td style="text-align: center; border: 1px solid #94a3b8; padding: 4px 6px;">${juri1Score}</td>
          <td style="text-align: center; border: 1px solid #94a3b8; padding: 4px 6px;">${juri2Score}</td>
          <td style="text-align: center; border: 1px solid #94a3b8; padding: 4px 6px;">${juri3Score}</td>
          <td style="text-align: center; font-weight: 800; border: 1px solid #94a3b8; padding: 4px 6px;">${avgScore}</td>
          <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-size: 10.5px; font-weight: bold; color: ${rankNum <= 3 ? '#b45309' : '#0f766e'};">${awardLabel}</td>
        </tr>
      `;
    }).join('');

    const tableHeaderHtml = isSingleJury ? `
      <tr>
        <th style="width: 6%;">Rank</th>
        <th style="width: 7%;">No</th>
        <th style="width: 32%; text-align: left; padding-left: 8px;">Nama Peserta</th>
        <th style="width: 20%;">Kelas</th>
        <th style="width: 13%;">Nilai Skor</th>
        <th style="width: 22%; text-align: left; padding-left: 8px;">Keterangan Penghargaan</th>
      </tr>
    ` : `
      <tr>
        <th style="width: 5%;">Rank</th>
        <th style="width: 6%;">No</th>
        <th style="width: 25%; text-align: left; padding-left: 8px;">Nama Peserta</th>
        <th style="width: 17%;">Kelas</th>
        <th style="width: 7%;">Juri 1</th>
        <th style="width: 7%;">Juri 2</th>
        <th style="width: 7%;">Juri 3</th>
        <th style="width: 9%;">Rata-rata</th>
        <th style="width: 17%; text-align: left; padding-left: 8px;">Keterangan</th>
      </tr>
    `;

    const signaturesHtml = isSingleJury ? `
      <div class="signatures-container">
        <table style="width: 100%; border: none; margin-top: 15px;">
          <tr>
            <td style="border: none; text-align: center; width: 50%; vertical-align: top;">
              <div style="font-size: 11px; margin-bottom: 2px;">Dewan Juri / Penilai Busana,</div>
              <img src="${qrJuriUrl}" class="qr-img" alt="QR TTD" />
              <div class="sig-name">${event.juryName}</div>
              <div style="font-size: 10px; color: #475569;">${event.juryTitle || 'Praktisi & Penilai Busana'}</div>
            </td>
            <td style="border: none; text-align: center; width: 50%; vertical-align: top;">
              <div style="font-size: 11px; margin-bottom: 2px;">Mengetahui,</div>
              <div style="font-size: 11px; font-weight: bold; margin-bottom: 2px;">Kepala RA Darusyifa</div>
              <div class="stamp-badge">★ STEMPEL RESMI RA DARUSYIFA ★</div>
              <img src="${qrKepsekUrl}" class="qr-img" alt="QR TTD Kepsek" />
              <div class="sig-name">${event.headmasterName}</div>
              <div class="sig-nip">${headmasterNip}</div>
            </td>
          </tr>
        </table>
      </div>
    ` : `
      <div class="signatures-container">
        <table style="width: 100%; border: none; margin-bottom: 20px;">
          <tr>
            <td style="border: none; text-align: center; width: 33.3%;">
              <div style="font-size: 11px;">Ketua Dewan Juri,</div>
              <img src="${qrJuriUrl}" class="qr-img" alt="QR TTD" />
              <div class="sig-name">${event.juryName}</div>
              <div style="font-size: 10px; color: #475569;">${event.juryTitle || 'Ketua Dewan Juri'}</div>
            </td>
            <td style="border: none; text-align: center; width: 33.3%;">
              <div style="font-size: 11px;">Dewan Juri 2,</div>
              <img src="${qrJuriUrl}" class="qr-img" alt="QR TTD" />
              <div class="sig-name">${event.jury2Name || 'Juri 2'}</div>
              <div style="font-size: 10px; color: #475569;">${event.jury2Title || 'Dewan Juri'}</div>
            </td>
            <td style="border: none; text-align: center; width: 33.3%;">
              <div style="font-size: 11px;">Dewan Juri 3,</div>
              <img src="${qrJuriUrl}" class="qr-img" alt="QR TTD" />
              <div class="sig-name">${event.jury3Name || 'Juri 3'}</div>
              <div style="font-size: 10px; color: #475569;">${event.jury3Title || 'Dewan Juri'}</div>
            </td>
          </tr>
        </table>

        <div class="headmaster-box">
          <div style="font-size: 11px;">Mengetahui,</div>
          <div style="font-size: 11px; font-weight: bold; margin-bottom: 2px;">Kepala RA Darusyifa</div>
          <div class="stamp-badge">★ STEMPEL RESMI RA DARUSYIFA ★</div>
          <img src="${qrKepsekUrl}" class="qr-img" alt="QR TTD Kepsek" />
          <div class="sig-name">${event.headmasterName}</div>
          <div class="sig-nip">${headmasterNip}</div>
        </div>
      </div>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Berita Acara Penilaian - ${event.title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            font-family: 'Times New Roman', Times, serif;
          }
          body {
            color: #1e293b;
            line-height: 1.35;
            font-size: 12px;
            background: #fff;
            margin: 0;
            padding: 0;
          }
          .header {
            text-align: center;
            border-bottom: 3px double #0f172a;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .yayasan {
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 1px;
            color: #047857;
            margin: 0;
          }
          .sekolah {
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 0.5px;
            color: #065f46;
            margin: 2px 0 0 0;
          }
          .alamat {
            font-size: 10px;
            color: #475569;
            margin-top: 3px;
          }
          .title-box {
            text-align: center;
            margin: 12px 0 10px 0;
          }
          .ba-title {
            font-size: 15px;
            font-weight: 900;
            text-decoration: underline;
            letter-spacing: 0.5px;
            margin: 0;
          }
          .ba-nomor {
            font-size: 12px;
            font-weight: 600;
            margin: 3px 0 0 0;
          }
          .narrative {
            text-align: justify;
            text-justify: inter-word;
            margin-bottom: 12px;
            font-size: 12px;
            line-height: 1.45;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            font-size: 11.5px;
          }
          th {
            background-color: #f1f5f9;
            border: 1px solid #64748b;
            padding: 6px 4px;
            font-weight: 800;
            text-align: center;
          }
          .closing {
            text-align: justify;
            margin: 14px 0 20px 0;
            font-size: 12px;
            line-height: 1.4;
          }
          .signatures-container {
            width: 100%;
            margin-top: 15px;
            page-break-inside: avoid;
          }
          .signatures-grid {
            display: flex;
            justify-content: space-around;
            text-align: center;
            margin-bottom: 25px;
          }
          .sig-box {
            display: inline-block;
            width: 30%;
            text-align: center;
            vertical-align: top;
          }
          .headmaster-box {
            text-align: center;
            margin: 20px auto 0 auto;
            width: 50%;
            position: relative;
          }
          .qr-img {
            width: 70px;
            height: 70px;
            margin: 5px auto;
            display: block;
          }
          .stamp-badge {
            display: inline-block;
            border: 2px dashed #0284c7;
            color: #0284c7;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .sig-name {
            font-weight: 800;
            font-size: 12px;
            text-decoration: underline;
            margin-top: 4px;
          }
          .sig-nip {
            font-size: 10px;
            color: #334155;
          }
          .footer-auth {
            border-top: 1px solid #cbd5e1;
            padding-top: 5px;
            margin-top: 25px;
            font-size: 9px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="yayasan">YAYASAN DARUSYIFA AL ISLAMIYAH</div>
          <div class="sekolah">RAUDHATUL ATHFAL (RA) DARUSYIFA ARJAWINANGUN</div>
          <div class="alamat">Sekretariat: Kampus RA Darusyifa Arjawinangun • Email: ra.darusyifa@gmail.com</div>
        </div>

        <div class="title-box">
          <div class="ba-title">BERITA ACARA PENILAIAN DEWAN JURI</div>
          <div class="ba-nomor">Nomor: ${baNumber}</div>
        </div>

        <div class="narrative">
          Pada hari ini, <strong>${eventDateStr}</strong>, telah dilaksanakan penilaian Lomba <strong>${event.title}</strong> bertempat di ${location}. Berdasarkan kriteria penilaian ${criteria}, dewan juri menetapkan rekapitulasi nilai dan pemenang sebagai berikut:
        </div>

        <table>
          <thead>
            ${tableHeaderHtml}
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="closing">
          Demikian Berita Acara ini dibuat dengan sebenarnya sesuai dengan hasil penilaian murni dan obyektif oleh segenap Dewan Juri tanpa ada intervensi dari pihak manapun, untuk dapat dipergunakan sebagaimana mestinya.
        </div>

        ${signaturesHtml}

        <div class="footer-auth">
          <span>Autentikasi Dokumen: RADS-BA-2026/042 • Sistem Penilaian RA Darusyifa Arjawinangun</span>
          <span>Dicetak Resmi: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </body>
      </html>
    `;

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        return;
      }
    } catch (e) {
      console.warn("window.open blocked, using iframe fallback", e);
    }

    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
        }, 600);
      }
    } catch (err) {
      console.error("Iframe print error:", err);
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <FileText className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Berita Acara Penilaian Dewan Juri
              </h2>
              <p className="text-xs text-emerald-200">
                Nomor: <span className="font-mono font-bold text-white">{baNumber}</span> • {event.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Cetak / PDF Resmi
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Document Preview */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100 dark:bg-slate-950/50 flex-1">
          <div className="bg-white text-slate-800 p-6 sm:p-10 rounded-xl shadow-lg border border-slate-200 mx-auto max-w-4xl font-serif">
            
            {/* KOP Lembaga */}
            <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
              <h3 className="text-xs sm:text-sm font-bold tracking-widest text-emerald-800 uppercase">
                YAYASAN DARUSYIFA AL ISLAMIYAH
              </h3>
              <h1 className="text-base sm:text-xl font-extrabold tracking-wide text-emerald-950 mt-1 uppercase">
                RAUDHATUL ATHFAL (RA) DARUSYIFA ARJAWINANGUN
              </h1>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Sekretariat: Kampus RA Darusyifa Arjawinangun • Email: ra.darusyifa@gmail.com
              </p>
            </div>

            {/* Title */}
            <div className="text-center my-4">
              <h2 className="text-sm sm:text-base font-extrabold underline tracking-wider uppercase">
                BERITA ACARA PENILAIAN DEWAN JURI
              </h2>
              <p className="text-xs font-semibold text-slate-700 mt-1 font-mono">
                Nomor: {baNumber}
              </p>
            </div>

            {/* Narrative text */}
            <p className="text-xs sm:text-sm text-justify leading-relaxed text-slate-700 mb-4">
              Pada hari ini, <strong>{eventDateStr}</strong>, telah dilaksanakan penilaian Lomba <strong>{event.title}</strong> bertempat di {location}. Berdasarkan kriteria penilaian {criteria}, dewan juri menetapkan rekapitulasi nilai dan pemenang sebagai berikut:
            </p>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-300 rounded-lg mb-6">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 text-center font-bold">
                    <th className="p-2 border-r border-slate-300 w-12">Rank</th>
                    <th className="p-2 border-r border-slate-300 w-14">No</th>
                    <th className="p-2 border-r border-slate-300 text-left">Nama Peserta</th>
                    <th className="p-2 border-r border-slate-300">Kelas</th>
                    {(event.juriesCount === 1 || (!event.jury2Name && !event.jury3Name)) ? (
                      <th className="p-2 border-r border-slate-300 w-24">Nilai Skor</th>
                    ) : (
                      <>
                        <th className="p-2 border-r border-slate-300 w-12">Juri 1</th>
                        <th className="p-2 border-r border-slate-300 w-12">Juri 2</th>
                        <th className="p-2 border-r border-slate-300 w-12">Juri 3</th>
                        <th className="p-2 border-r border-slate-300 w-16">Rata-rata</th>
                      </>
                    )}
                    <th className="p-2 text-left">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedParticipants.map((p, idx) => {
                    const rankNum = p.rank || idx + 1;
                    const isTop1 = rankNum === 1;
                    const isTop2 = rankNum === 2;
                    const isTop3 = rankNum === 3;
                    const isSingle = (event.juriesCount === 1 || (!event.jury2Name && !event.jury3Name));

                    return (
                      <tr 
                        key={p.id || idx}
                        className={`hover:bg-slate-50 transition-colors ${
                          isTop1 ? 'bg-amber-50/80 font-semibold' :
                          isTop2 ? 'bg-slate-50 font-semibold' :
                          isTop3 ? 'bg-orange-50/80 font-semibold' : ''
                        }`}
                      >
                        <td className="p-2 text-center font-bold border-r border-slate-200">
                          {rankNum}
                        </td>
                        <td className="p-2 text-center font-bold border-r border-slate-200 font-mono text-slate-600">
                          {p.noUrut || `#${idx + 1}`}
                        </td>
                        <td className="p-2 font-semibold text-slate-900 border-r border-slate-200">
                          {p.studentName}
                        </td>
                        <td className="p-2 text-center text-slate-600 border-r border-slate-200 text-[11px]">
                          {p.kelas}
                        </td>
                        {isSingle ? (
                          <td className="p-2 text-center font-bold text-slate-900 border-r border-slate-200">
                            {p.averageScore !== undefined ? p.averageScore.toFixed(2) : '0.00'}
                          </td>
                        ) : (
                          <>
                            <td className="p-2 text-center border-r border-slate-200">
                              {p.scores?.juri1 ? p.scores.juri1.toFixed(1) : (p.averageScore && p.averageScore > 0 ? p.averageScore.toFixed(1) : '-')}
                            </td>
                            <td className="p-2 text-center border-r border-slate-200">
                              {p.scores?.juri2 ? p.scores.juri2.toFixed(1) : '-'}
                            </td>
                            <td className="p-2 text-center border-r border-slate-200">
                              {p.scores?.juri3 ? p.scores.juri3.toFixed(1) : '-'}
                            </td>
                            <td className="p-2 text-center font-bold text-slate-900 border-r border-slate-200">
                              {p.averageScore !== undefined ? p.averageScore.toFixed(2) : '0.00'}
                            </td>
                          </>
                        )}
                        <td className="p-2 font-bold text-[11px]">
                          <span className={
                            rankNum === 1 ? 'text-amber-700 bg-amber-100 px-2 py-0.5 rounded' :
                            rankNum === 2 ? 'text-slate-700 bg-slate-200 px-2 py-0.5 rounded' :
                            rankNum === 3 ? 'text-orange-700 bg-orange-100 px-2 py-0.5 rounded' :
                            'text-teal-800'
                          }>
                            {p.award || (rankNum <= 3 ? `JUARA ${rankNum}` : 'PESERTA BERBAKAT FASHION SHOW')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Closing text */}
            <p className="text-xs sm:text-sm text-justify leading-relaxed text-slate-700 mb-6">
              Demikian Berita Acara ini dibuat dengan sebenarnya sesuai dengan hasil penilaian murni dan obyektif oleh segenap Dewan Juri tanpa ada intervensi dari pihak manapun, untuk dapat dipergunakan sebagaimana mestinya.
            </p>

            {/* Signatures */}
            <div className="mt-8 border-t border-slate-200 pt-6">
              {(event.juriesCount === 1 || (!event.jury2Name && !event.jury3Name)) ? (
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <p className="text-xs text-slate-600">Dewan Juri / Penilai Busana,</p>
                    <div className="my-2 flex justify-center">
                      <img src={qrJuriUrl} alt="QR Juri" className="w-16 h-16 border border-slate-200 rounded p-1 bg-white" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 underline">{event.juryName}</p>
                    <p className="text-[10px] text-slate-500">{event.juryTitle || 'Praktisi & Penilai Busana'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Mengetahui,</p>
                    <p className="text-xs font-bold text-slate-900">Kepala RA Darusyifa</p>
                    <div className="my-2 flex justify-center items-center gap-2">
                      <div className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-[9px] text-blue-700 font-bold">
                        ★ STEMPEL RESMI
                      </div>
                      <img src={qrKepsekUrl} alt="QR Kepsek" className="w-16 h-16 border border-slate-200 rounded p-1 bg-white" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 underline">{event.headmasterName}</p>
                    <p className="text-[10px] text-slate-500">{headmasterNip}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4 text-center mb-8">
                    <div>
                      <p className="text-xs text-slate-600">Juri 1 (Ketua Dewan Juri),</p>
                      <div className="my-2 flex justify-center">
                        <img src={qrJuriUrl} alt="QR Juri" className="w-16 h-16 border border-slate-200 rounded p-1 bg-white" />
                      </div>
                      <p className="text-xs font-bold text-slate-900 underline">{event.juryName}</p>
                      <p className="text-[10px] text-slate-500">{event.juryTitle || 'Ketua Dewan Juri'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Dewan Juri 2,</p>
                      <div className="my-2 flex justify-center">
                        <img src={qrJuriUrl} alt="QR Juri 2" className="w-16 h-16 border border-slate-200 rounded p-1 bg-white" />
                      </div>
                      <p className="text-xs font-bold text-slate-900 underline">{event.jury2Name || 'Juri 2'}</p>
                      <p className="text-[10px] text-slate-500">{event.jury2Title || 'Dewan Juri'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Dewan Juri 3,</p>
                      <div className="my-2 flex justify-center">
                        <img src={qrJuriUrl} alt="QR Juri 3" className="w-16 h-16 border border-slate-200 rounded p-1 bg-white" />
                      </div>
                      <p className="text-xs font-bold text-slate-900 underline">{event.jury3Name || 'Juri 3'}</p>
                      <p className="text-[10px] text-slate-500">{event.jury3Title || 'Dewan Juri'}</p>
                    </div>
                  </div>

                  <div className="text-center mt-6">
                    <p className="text-xs text-slate-600">Mengetahui,</p>
                    <p className="text-xs font-bold text-slate-900">Kepala RA Darusyifa</p>
                    <div className="my-2 flex justify-center items-center gap-2">
                      <div className="px-3 py-1 bg-blue-50 border border-blue-200 rounded text-[10px] text-blue-700 font-bold">
                        ✓ RESMI & TERVERIFIKASI
                      </div>
                      <img src={qrKepsekUrl} alt="QR Kepsek" className="w-16 h-16 border border-slate-200 rounded p-1 bg-white" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 underline">{event.headmasterName}</p>
                    <p className="text-[10px] text-slate-500">{headmasterNip}</p>
                  </div>
                </>
              )}
            </div>

            {/* Document Auth */}
            <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-sans">
              <span>Autentikasi Dokumen: RADS-BA-2026/042 • Sistem Penilaian RA Darusyifa Arjawinangun</span>
              <span>Dokumen Digital Resmi</span>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Total {sortedParticipants.length} Peserta Terdaftar & Dinilai
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Cetak Dokumen Berita Acara
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
