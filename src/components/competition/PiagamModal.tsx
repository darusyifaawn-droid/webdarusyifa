import React, { useState } from 'react';
import { X, Printer, CheckCircle, Award, ShieldCheck, Sparkles, QrCode } from 'lucide-react';
import { CompetitionEvent, CompetitionParticipant } from '../../types/competition';

interface PiagamModalProps {
  participant: CompetitionParticipant | null;
  event: CompetitionEvent | null;
  onClose: () => void;
  schoolSettings?: any;
}

export default function PiagamModal({ participant, event, onClose, schoolSettings }: PiagamModalProps) {
  const [digitalSignatureActive, setDigitalSignatureActive] = useState(true);

  if (!participant) return null;

  const eventTitle = event?.title || participant.eventTitle || 'LOMBA FASHION SHOW BUSANA MUSLIM';
  const headmasterName = event?.headmasterName || schoolSettings?.headmasterName || 'GIAN DWI WAHYUNI, S.H';
  let headmasterNip = event?.headmasterNip || schoolSettings?.headmasterNip || 'NPK: 8950490276014';
  if (headmasterNip.includes('8950490276014') && headmasterNip.startsWith('NIP:')) {
    headmasterNip = headmasterNip.replace('NIP:', 'NPK:');
  }
  const juryName = event?.juryName || 'MUHAMAD NUGI ANDRI, S.H';
  const juryTitle = event?.juryTitle || 'Praktisi & Penilai Busana';
  const certNumber = participant.certificateNumber || `RADS-CERT-2026/${participant.noUrut?.replace('#', '') || '001'}-${participant.nis || 'RADS-2024-001'}`;

  // QR Code URL
  const qrJuryData = `https://darusyifa.sch.id/verify-cert?no=${encodeURIComponent(certNumber)}&recipient=${encodeURIComponent(participant.studentName)}&event=${encodeURIComponent(eventTitle)}&sign=JURY`;
  const qrJuryUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrJuryData)}`;

  const qrKepsekData = `https://darusyifa.sch.id/verify-cert?no=${encodeURIComponent(certNumber)}&recipient=${encodeURIComponent(participant.studentName)}&event=${encodeURIComponent(eventTitle)}&sign=KEPSEK`;
  const qrKepsekUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrKepsekData)}`;

  const isTop3 = participant.rank !== undefined && participant.rank >= 1 && participant.rank <= 3;

  const handlePrint = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Piagam Penghargaan - ${participant.studentName} - ${participant.award || 'Piagam'}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif;
            background-color: #ffffff;
            color: #1e293b;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .certificate-container {
            width: 297mm;
            height: 210mm;
            padding: 10mm;
            position: relative;
            background: #fffdfa;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          /* Outer Border */
          .border-outer {
            border: 3.5px solid #b45309;
            border-radius: 16px;
            padding: 4px;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            background: #ffffff;
          }
          /* Inner Border */
          .border-inner {
            border: 1.5px solid #d97706;
            border-radius: 12px;
            padding: 18px 24px 14px 24px;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            background: radial-gradient(circle at center, #ffffff 60%, #fffbf0 100%);
          }
          /* Corner Ornaments */
          .corner-tl { position: absolute; top: 8px; left: 8px; font-size: 16px; color: #b45309; line-height: 1; }
          .corner-tr { position: absolute; top: 8px; right: 8px; font-size: 16px; color: #b45309; line-height: 1; }
          .corner-bl { position: absolute; bottom: 8px; left: 8px; font-size: 16px; color: #b45309; line-height: 1; }
          .corner-br { position: absolute; bottom: 8px; right: 8px; font-size: 16px; color: #b45309; line-height: 1; }

          /* Header Kop */
          .header {
            text-align: center;
            margin-top: 2px;
          }
          .logo-img {
            width: 58px;
            height: 58px;
            object-fit: contain;
            margin: 0 auto 4px auto;
            display: block;
          }
          .inst-sub {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1.5px;
            color: #047857;
            text-transform: uppercase;
            margin: 0;
          }
          .inst-main {
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 0.5px;
            color: #064e3b;
            text-transform: uppercase;
            margin: 2px 0;
            font-family: Georgia, 'Times New Roman', serif;
          }
          .inst-meta {
            font-size: 9.5px;
            color: #64748b;
            font-weight: 600;
            letter-spacing: 0.3px;
            margin: 0;
          }
          .divider {
            width: 80%;
            height: 1.5px;
            background: linear-gradient(to right, transparent, #d97706, transparent);
            margin: 8px auto 10px auto;
          }

          /* Main Award Body */
          .award-badge-pill {
            display: inline-block;
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 3px 20px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            box-shadow: 0 1px 3px rgba(180, 83, 9, 0.1);
          }
          .award-title {
            font-size: 32px;
            font-weight: 900;
            color: #b45309;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin: 4px 0 2px 0;
            font-family: Georgia, 'Times New Roman', serif;
            text-shadow: 0 1px 1px rgba(0,0,0,0.05);
          }
          .event-subtitle {
            font-size: 11.5px;
            color: #475569;
            font-style: italic;
            margin: 0 0 10px 0;
            font-weight: 500;
          }
          .presented-to {
            font-size: 11px;
            color: #64748b;
            margin: 0 0 4px 0;
            letter-spacing: 0.3px;
          }
          .recipient-name {
            font-size: 26px;
            font-weight: 900;
            color: #064e3b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 4px 0;
            display: inline-block;
            border-bottom: 2.5px solid #064e3b;
            padding-bottom: 2px;
            font-family: Georgia, 'Times New Roman', serif;
          }
          .recipient-meta {
            font-size: 11px;
            font-weight: 800;
            color: #334155;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            margin: 2px 0 6px 0;
          }
          .score-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #f0fdf4;
            border: 1px solid #86efac;
            color: #166534;
            font-size: 10.5px;
            font-weight: 700;
            padding: 2px 14px;
            border-radius: 9999px;
          }

          /* Signatures */
          .signatures-grid {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 10px;
            padding: 0 30px;
          }
          .sig-box {
            text-align: center;
            width: 220px;
            position: relative;
          }
          .sig-role {
            font-size: 10.5px;
            font-weight: 600;
            color: #475569;
            margin-bottom: 4px;
          }
          .qr-box {
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            padding: 4px 8px 3px 8px;
            border-radius: 8px;
            margin-bottom: 6px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
          }
          .qr-img {
            width: 48px;
            height: 48px;
            display: block;
          }
          .qr-badge {
            font-size: 7.5px;
            font-weight: 800;
            padding: 1px 6px;
            border-radius: 4px;
            margin-top: 2px;
            text-transform: uppercase;
          }
          .badge-green { background: #dcfce7; color: #15803d; border: 0.5px solid #86efac; }
          .badge-blue { background: #e0f2fe; color: #0369a1; border: 0.5px solid #7dd3fc; }
          
          .stamp-circle {
            position: absolute;
            left: -20px;
            top: 20px;
            width: 72px;
            height: 72px;
            border: 2px dashed #2563eb;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #1d4ed8;
            font-size: 6px;
            font-weight: 900;
            text-transform: uppercase;
            text-align: center;
            opacity: 0.85;
            transform: rotate(-12deg);
            pointer-events: none;
            background: rgba(239, 246, 255, 0.4);
          }

          .sig-name {
            font-size: 11.5px;
            font-weight: 900;
            color: #0f172a;
            margin: 0;
            text-decoration: underline;
          }
          .sig-title {
            font-size: 9.5px;
            color: #64748b;
            font-weight: 600;
            margin-top: 1px;
          }

          /* Footer */
          .cert-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid #f1f5f9;
            padding-top: 6px;
            margin-top: 8px;
            font-size: 8.5px;
            color: #64748b;
          }
          .cert-footer strong {
            color: #334155;
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="border-outer">
            <div class="border-inner">
              <!-- Corner Ornaments -->
              <div class="corner-tl">✤</div>
              <div class="corner-tr">✤</div>
              <div class="corner-bl">✤</div>
              <div class="corner-br">✤</div>

              <!-- Header -->
              <div class="header">
                <img src="/logo_ra.jpeg" alt="Logo RA Darusyifa" class="logo-img" onerror="this.style.display='none'" />
                <p class="inst-sub">YAYASAN DARUSYIFA AL ISLAMIYAH</p>
                <h1 class="inst-main">RAUDHATUL ATHFAL (RA) DARUSYIFA ARJAWINANGUN</h1>
                <p class="inst-meta">Kemenag RI • Terakreditasi • Pendidikan Anak Usia Dini Berkarakter Qurani</p>
                <div class="divider"></div>
              </div>

              <!-- Content Body -->
              <div style="text-align: center;">
                <div class="award-badge-pill">PIAGAM PENGHARGAAN</div>
                <div class="award-title">${participant.award || 'PENGHARGAAN'}</div>
                <div class="event-subtitle">Diberikan dalam rangka penyelenggaraan ${eventTitle.toUpperCase()}</div>
                
                <p class="presented-to">Dengan penuh rasa bangga dianugerahkan kepada:</p>
                <div class="recipient-name">${participant.studentName}</div>
                <div class="recipient-meta">${participant.kelas.toUpperCase()} ${participant.nis ? `• NIS: ${participant.nis}` : ''}</div>
                
                ${participant.averageScore ? `
                  <div>
                    <span class="score-chip">
                      ✨ Nilai Rata-rata: ${participant.averageScore.toFixed(2)}${isTop3 ? ` (Juara ${participant.rank})` : ''}
                    </span>
                  </div>
                ` : ''}
              </div>

              <!-- Signatures -->
              <div class="signatures-grid">
                <!-- Dewan Juri -->
                <div class="sig-box">
                  <div class="sig-role">Ketua Dewan Juri,</div>
                  <div class="qr-box">
                    <img src="${qrJuryUrl}" alt="QR TTD Juri" class="qr-img" />
                    <span class="qr-badge badge-green">✓ TTD BARCODE SAH</span>
                  </div>
                  <p class="sig-name">${juryName}</p>
                  <p class="sig-title">${juryTitle}</p>
                </div>

                <!-- Kepala Sekolah -->
                <div class="sig-box">
                  <div class="stamp-circle">
                    RA DARUSYIFA<br/>★ SAH & RESMI ★<br/>ARJAWINANGUN
                  </div>
                  <div class="sig-role">Kepala RA Darusyifa,</div>
                  <div class="qr-box">
                    <img src="${qrKepsekUrl}" alt="QR TTD Kepsek" class="qr-img" />
                    <span class="qr-badge badge-blue">✓ SAH & TERVERIFIKASI</span>
                  </div>
                  <p class="sig-name">${headmasterName}</p>
                  <p class="sig-title">${headmasterNip}</p>
                </div>
              </div>

              <!-- Footer info -->
              <div class="cert-footer">
                <div>
                  <span style="color: #16a34a; font-weight: bold;">✓</span> Dokumen Resmi Terdaftar Elektronik • RA Darusyifa Arjawinangun
                </div>
                <div>
                  No. Sertifikat: <strong>${certNumber}</strong>
                </div>
              </div>

            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 350);
          };
        </script>
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
    <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[96vh] overflow-hidden my-auto">
        
        {/* Top Control Bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">Pratinjau Piagam Penghargaan Resmi</h3>
              <p className="text-xs text-slate-500 font-medium">
                Penerima: <span className="font-bold text-slate-700">{participant.studentName}</span> - <span className="text-amber-600 font-bold">{participant.award || 'Piagam'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs font-bold">
              <ShieldCheck size={14} />
              <span>TTD Barcode (Digital): Aktif</span>
            </div>

            <button
              id="btn-print-piagam-modal"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Printer size={15} />
              <span>Cetak Piagam (Print / PDF)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Tutup"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Certificate Display Frame */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex justify-center items-center">
          <div className="w-full max-w-3xl bg-[#fffdfa] rounded-2xl shadow-lg border-[3px] border-amber-600/70 p-2 sm:p-3 relative select-none">
            <div className="border border-amber-500/50 rounded-xl p-5 sm:p-8 bg-radial from-white via-white to-amber-50/30 flex flex-col justify-between min-h-[520px] sm:min-h-[580px] relative overflow-hidden">
              
              {/* Corner Ornaments */}
              <div className="absolute top-2.5 left-2.5 text-amber-700 font-serif text-sm opacity-80">✤</div>
              <div className="absolute top-2.5 right-2.5 text-amber-700 font-serif text-sm opacity-80">✤</div>
              <div className="absolute bottom-2.5 left-2.5 text-amber-700 font-serif text-sm opacity-80">✤</div>
              <div className="absolute bottom-2.5 right-2.5 text-amber-700 font-serif text-sm opacity-80">✤</div>

              {/* Header */}
              <div className="text-center">
                <img 
                  src="/logo_ra.jpeg" 
                  alt="Logo RA" 
                  className="w-14 h-14 sm:w-16 sm:h-16 mx-auto object-contain mb-1.5"
                  onError={(e: any) => { e.target.style.display = 'none'; }}
                />
                <p className="text-[10px] sm:text-xs font-black tracking-widest text-emerald-800 uppercase">
                  YAYASAN DARUSYIFA AL ISLAMIYAH
                </p>
                <h1 className="text-base sm:text-xl font-serif font-black text-slate-900 tracking-wide uppercase mt-0.5">
                  RAUDHATUL ATHFAL (RA) DARUSYIFA ARJAWINANGUN
                </h1>
                <p className="text-[9px] sm:text-[10.5px] text-slate-500 font-semibold tracking-tight">
                  Kemenag RI • Terakreditasi • Pendidikan Anak Usia Dini Berkarakter Qurani
                </p>
                <div className="w-3/4 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto my-3" />
              </div>

              {/* Award Content */}
              <div className="text-center my-auto py-2">
                <div className="inline-block bg-gradient-to-r from-amber-100 via-amber-200 to-amber-100 border border-amber-400 text-amber-900 px-4 sm:px-6 py-1 rounded-full text-[10px] sm:text-xs font-extrabold tracking-widest uppercase shadow-xs">
                  PIAGAM PENGHARGAAN
                </div>

                <h2 className="text-2xl sm:text-4xl font-serif font-black text-amber-700 uppercase tracking-wider mt-3 mb-1">
                  {participant.award || 'PENGHARGAAN'}
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 italic font-medium max-w-xl mx-auto mb-4">
                  Diberikan dalam rangka penyelenggaraan {eventTitle.toUpperCase()}
                </p>

                <p className="text-[11px] sm:text-xs text-slate-500 mb-1">
                  Dengan penuh rasa bangga dianugerahkan kepada:
                </p>

                <h3 className="text-xl sm:text-3xl font-serif font-black text-emerald-950 uppercase inline-block border-b-2 border-emerald-900 pb-1 px-4 mb-1">
                  {participant.studentName}
                </h3>

                <p className="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-wider mt-1.5">
                  {participant.kelas.toUpperCase()} {participant.nis ? `• NIS: ${participant.nis}` : ''}
                </p>

                {participant.averageScore ? (
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                      <Sparkles size={13} className="text-amber-500" />
                      Nilai Rata-rata: {participant.averageScore.toFixed(2)}{isTop3 ? ` (Juara ${participant.rank})` : ''}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-6 items-end px-2 sm:px-8 mt-4 pt-2">
                {/* Juri */}
                <div className="text-center flex flex-col items-center">
                  <p className="text-[11px] text-slate-500 font-medium mb-1.5">Ketua Dewan Juri,</p>
                  <div className="p-1 bg-white border border-slate-200 rounded-lg shadow-xs mb-1.5 flex flex-col items-center">
                    <img src={qrJuryUrl} alt="QR TTD" className="w-12 h-12" />
                    <span className="text-[7.5px] font-black text-emerald-700 bg-emerald-50 px-1 rounded mt-0.5">✓ TTD BARCODE SAH</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 underline">{juryName}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{juryTitle}</p>
                </div>

                {/* Kepsek */}
                <div className="text-center flex flex-col items-center relative">
                  {/* Stempel */}
                  <div className="absolute -left-3 top-2 w-16 h-16 border-2 border-dashed border-blue-600 rounded-full flex flex-col items-center justify-center text-blue-700 text-[6px] font-black uppercase text-center opacity-85 rotate-[-12deg] bg-blue-50/50 pointer-events-none">
                    RA DARUSYIFA<br/>★ RESMI ★<br/>ARJAWINANGUN
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mb-1.5">Kepala RA Darusyifa,</p>
                  <div className="p-1 bg-white border border-slate-200 rounded-lg shadow-xs mb-1.5 flex flex-col items-center">
                    <img src={qrKepsekUrl} alt="QR TTD" className="w-12 h-12" />
                    <span className="text-[7.5px] font-black text-blue-700 bg-blue-50 px-1 rounded mt-0.5">✓ SAH & TERVERIFIKASI</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 underline">{headmasterName}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{headmasterNip}</p>
                </div>
              </div>

              {/* Bottom Footer Info */}
              <div className="flex flex-wrap justify-between items-center text-[9px] text-slate-400 border-t border-slate-100 pt-2.5 mt-4">
                <div className="flex items-center gap-1">
                  <CheckCircle size={11} className="text-emerald-600" />
                  <span>Dokumen Resmi Terdaftar Elektronik • RA Darusyifa Arjawinangun</span>
                </div>
                <div>
                  No. Sertifikat: <span className="font-mono font-bold text-slate-600">{certNumber}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
