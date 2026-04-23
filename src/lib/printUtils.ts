export const getPrintHeaderHTML = (title: string, schoolName?: string, logoUrl?: string) => `
  <div class="kop-surat">
    <div class="logo-container">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : `<div style="width: 80px; height: 80px; border: 2px solid #ccc; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999;">LOGO</div>`}
    </div>
    <div class="kop-text">
      <h2>YAYASAN DARUSYIFA AL ISLAMIYAH</h2>
      <h1>RAUDHATUL ATHFAL (RA) DARUSYIFA ARJAWINANGUN</h1>
      <p>NSRA : 101232090331 / NPSN : 69993923</p>
      <p class="address">Blok Telar Baru RT.004 RW.014 Desa/Kecamatan Arjawinangun Kabupaten Cirebon</p>
    </div>
  </div>
  <hr class="kop-separator" />
  <div class="doc-title">${title}</div>
`;

export const getPrintStyles = () => `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
  body { 
    font-family: 'Inter', sans-serif; 
    padding: 40px; 
    color: #1f2937; 
    background: #fff;
    max-width: 800px;
    margin: 0 auto;
    -webkit-print-color-adjust: exact;
  }
  
  .kop-surat { display: flex; align-items: center; justify-content: center; gap: 25px; margin-bottom: 10px; }
  .kop-surat .logo-container img { max-width: 90px; height: auto; }
  .kop-surat .kop-text { text-align: center; }
  .kop-surat .kop-text h2 { margin: 0; font-size: 16px; font-weight: 800; color: #4b5563; text-transform: uppercase; }
  .kop-surat .kop-text h1 { margin: 5px 0; font-size: 20px; font-weight: 900; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px; }
  .kop-surat .kop-text p { margin: 2px 0; font-size: 13px; color: #4b5563; font-weight: 800; }
  .kop-surat .kop-text p.address { font-size: 12px; font-weight: 400; margin-top: 5px; color: #6b7280; }
  .kop-separator { border: 0; border-top: 3px solid #1f2937; border-bottom: 1px solid #1f2937; height: 2px; margin-bottom: 30px; }
  .doc-title { text-align: center; margin-bottom: 30px; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;}
  
  .student-info { display: grid; grid-template-columns: 120px 1fr; gap: 10px; margin-bottom: 30px; font-size: 14px; }
  .student-info div:nth-child(odd) { font-weight: 600; color: #6b7280; }
  .student-info div:nth-child(even) { font-weight: 800; }
  
  table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
  th { text-align: left; padding: 12px 10px; background: #f3f4f6; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #4b5563; border-bottom: 2px solid #e5e7eb; }
  th.center { text-align: center; }
  td { padding: 12px 10px; border-bottom: 1px solid #eee; }
  
  .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 14px; page-break-inside: avoid; }
  .signature { text-align: center; width: 220px; display: flex; flex-direction: column; align-items: center; }
  .signature .qr-code { margin: 15px 0; width: 100px; height: 100px; }
  .signature .qr-code img { width: 100%; height: 100%; object-fit: contain; }
  .signature .line { border-top: 1px solid #1f2937; padding-top: 5px; font-weight: 800; width: 100%; margin-top: auto; }
  .signature-spacing { margin-top: 130px; } /* For non-QR signatures */
  
  .receipt-details { margin: 40px 0; border: 2px dashed #e5e7eb; border-radius: 16px; background: #fafafa; font-size: 16px; overflow: hidden; }
  .receipt-row { display: flex; justify-content: space-between; padding: 20px; border-bottom: 1px solid #e5e7eb; }
  .receipt-row:last-child { border-bottom: none; }
  .receipt-label { color: #6b7280; font-weight: 600; }
  .receipt-value { font-weight: 800; color: #1f2937; text-align: right; }
  .receipt-amount { font-size: 28px; color: #16a34a; }
  .receipt-trx { font-family: monospace; font-size: 14px; color: #4b5563; }
  
  @media print {
    body { padding: 0; }
  }
`;

export const getPrintSignatureHTML = (dateStr: string = "", role1: string = "Bendahara / Penerima", role2: string = "Kepala Sekolah", qrData: string = "Ditandatangani secara elektronik oleh Kepala Sekolah RA Darusyifa") => `
  <div style="text-align: right; margin-bottom: 30px; font-size: 14px; color: #4b5563;">
    Arjawinangun, ${dateStr || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
  </div>
  <div class="footer">
    <div class="signature">
      <p>${role1}</p>
      <div class="line signature-spacing">Nama Terang</div>
    </div>
    <div class="signature">
      <p>${role2}</p>
      <div class="qr-code">
         <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}" alt="QR Code Signature" />
      </div>
      <div class="line">Kepala Sekolah</div>
    </div>
  </div>
`;
