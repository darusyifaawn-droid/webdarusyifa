import React, { useState, useEffect } from 'react';
import { 
  X, Wallet, QrCode, Building, Smartphone, Copy, Check, 
  Upload, ShieldCheck, CheckCircle, Clock, MessageCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { compressImage } from '../lib/imageUtils';

interface NabungOnlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentUser: any;
  onSuccess?: () => void;
}

export default function NabungOnlineModal({
  isOpen,
  onClose,
  studentUser,
  onSuccess
}: NabungOnlineModalProps) {
  // Transfer Channel
  const [channel, setChannel] = useState<'qris' | 'bri' | 'dana'>('qris');
  
  // Nominal Selection
  const [amount, setAmount] = useState<number>(50000);
  const [customAmountStr, setCustomAmountStr] = useState<string>('50000');
  
  // Form fields
  const [notes, setNotes] = useState<string>('');
  const [proofImage, setProofImage] = useState<string>('');
  
  // Status states
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessSubmitted, setIsSuccessSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [qrisDataUrl, setQrisDataUrl] = useState<string>('');

  // Generate QRIS Data URL
  useEffect(() => {
    const qrisPayload = `00020101021226670014ID.LINKAJA.WWW011893600911002220002102150000000000000000303UMI51440014ID.DANA.WWW011893600911002220002102150000000000000005204829953033605802ID5926RA DARUSYIFA ARJAWINANGUN6013CIREBON6105451626304`;
    QRCode.toDataURL(qrisPayload, {
      width: 280,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }).then(url => setQrisDataUrl(url)).catch(() => {});
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSuccessSubmitted(false);
      setProofImage('');
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickAmounts = [10000, 20000, 50000, 100000, 200000, 500000];

  const handleQuickAmount = (val: number) => {
    setAmount(val);
    setCustomAmountStr(val.toString());
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setCustomAmountStr(rawVal);
    const num = Number(rawVal) || 0;
    setAmount(num);
  };

  const handleCopy = (text: string, type: 'amount' | 'account') => {
    navigator.clipboard.writeText(text);
    if (type === 'amount') {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } else {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const compressed = await compressImage(reader.result as string, 900, 900, 0.75);
        setProofImage(compressed);
      } catch (err) {
        setProofImage(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || amount < 5000) {
      alert('Nominal tabungan minimal Rp 5.000');
      return;
    }

    if (!proofImage) {
      alert('Harap unggah foto bukti transfer/screenshot resi sebagai bukti verifikasi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const studentId = studentUser?.id || studentUser?.uid;
      const studentName = studentUser?.name || 'Santri';
      const studentClass = studentUser?.kelas || '-';
      const todayStr = new Date().toISOString().split('T')[0];

      const channelLabel = channel === 'qris' ? 'QRIS Sekolah' : channel === 'bri' ? 'Bank BRI' : 'DANA Sekolah';

      const docData = {
        studentId,
        studentName,
        kelas: studentClass,
        amount: Number(amount),
        type: 'tabungan',
        isSavingsDeposit: true,
        category: 'Setoran Tabungan Online',
        method: 'Transfer',
        transferChannel: channelLabel,
        notes: notes.trim() || 'Setoran Tabungan Siswa',
        proofStr: proofImage,
        status: 'pending',
        date: todayStr,
        createdAt: serverTimestamp(),
        description: `Setoran Tabungan Online (${channelLabel}) - Rp ${Number(amount).toLocaleString('id-ID')} (${studentName})`
      };

      await addDoc(collection(db, 'payments'), docData);

      setSubmittedData({
        ...docData,
        channelLabel,
        totalTransfer: Number(amount)
      });
      setIsSuccessSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error submitting savings deposit:', err);
      alert('Terjadi kendala saat mengirim setoran. Silakan periksa koneksi internet Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeAccountNumber = channel === 'bri' ? '415001003649509' : channel === 'dana' ? '08993358221' : '';
  const activeAccountHolder = channel === 'bri' ? 'GIAN DWI WAHYUNI' : channel === 'dana' ? 'RA DARUSYIFA' : 'RA DARUSYIFA ARJAWINANGUN';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-800">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 sm:p-6 relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Wallet size={20} className="text-yellow-300" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                Portal Tabungan Siswa
              </span>
              <h3 className="text-lg sm:text-xl font-black tracking-tight">Nabung Online (Transfer / QRIS)</h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-white/15 text-xs">
            <div>
              <span className="text-emerald-100/80 text-[10px] block">Santri / Siswa:</span>
              <span className="font-bold">{studentUser?.name || 'Siswa'} ({studentUser?.kelas || '-'})</span>
            </div>
            <div className="text-right">
              <span className="text-emerald-100/80 text-[10px] block">Saldo Tabungan Saat Ini:</span>
              <span className="font-black text-yellow-300 text-sm">Rp {(studentUser?.savings || 0).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {isSuccessSubmitted ? (
            /* Success State */
            <div className="py-6 text-center space-y-5 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
                <CheckCircle size={44} className="stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900 tracking-tight">Alhamdulillah, Setoran Terkirim!</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Bukti setoran tabungan online ananda <strong className="text-slate-800">{studentUser?.name}</strong> telah berhasil dikirim ke bendahara.
                </p>
              </div>

              {/* Status Card */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <Clock size={16} className="text-amber-600 shrink-0" />
                  <span>Status: Menunggu Validasi Bendahara</span>
                </div>
                <p className="text-[11px] text-amber-700/90 leading-relaxed">
                  Saldo tabungan ananda akan <strong>otomatis bertambah</strong> begitu bendahara mengesahkan setoran.
                </p>
                <div className="pt-2 border-t border-amber-200/60 flex justify-between text-xs font-bold text-slate-700">
                  <span>Nominal Setoran:</span>
                  <span className="font-black text-emerald-700">Rp {submittedData?.totalTransfer?.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* WhatsApp Confirmation Button */}
              <a 
                href={`https://wa.me/628993358221?text=${encodeURIComponent(
                  `Assalamu'alaikum Bendahara RA Darusyifa, saya telah melakukan setoran tabungan online:\n\n` +
                  `👤 Nama Siswa: ${studentUser?.name} (${studentUser?.kelas || '-'})\n` +
                  `💰 Nominal: Rp ${submittedData?.totalTransfer?.toLocaleString('id-ID')}\n` +
                  `🏦 Saluran: ${submittedData?.channelLabel}\n\n` +
                  `Mohon dicek dan divalidasi. Terima kasih!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-200 transition-all cursor-pointer"
              >
                <MessageCircle size={16} />
                Konfirmasi Cepat via WhatsApp Bendahara
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup Jendela
              </button>
            </div>
          ) : (
            /* Input Form */
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* 1. Pilih Rekening / Saluran Pembayaran */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  1. Pilih Metode Transfer
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannel('qris')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      channel === 'qris'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="absolute -top-2 right-2 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                      BEBAS ADM
                    </span>
                    <div className="flex items-center gap-1.5 mb-1">
                      <QrCode size={17} className={channel === 'qris' ? 'text-emerald-600' : 'text-slate-400'} />
                      <span className="text-xs font-black">QRIS</span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium leading-tight">
                      DANA, BCA, BRI, GoPay, dll.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('bri')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      channel === 'bri'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Building size={17} className={channel === 'bri' ? 'text-emerald-600' : 'text-slate-400'} />
                      <span className="text-xs font-black">Bank BRI</span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium leading-tight">
                      Rekening Sekolah
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('dana')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      channel === 'dana'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Smartphone size={17} className={channel === 'dana' ? 'text-emerald-600' : 'text-slate-400'} />
                      <span className="text-xs font-black">DANA</span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium leading-tight">
                      Sesama DANA
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. Nominal Tabungan */}
              <div className="space-y-3 bg-slate-50/90 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                    2. Nominal Tabungan
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold">Minimal Rp 5.000</span>
                </div>

                {/* Quick Buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAmount(amt)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                        amount === amt
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {amt >= 1000 ? `${amt / 1000}rb` : amt}
                    </button>
                  ))}
                </div>

                {/* Input Manual */}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">Rp</span>
                  <input
                    type="text"
                    required
                    value={customAmountStr ? Number(customAmountStr).toLocaleString('id-ID') : ''}
                    onChange={handleCustomAmountChange}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base font-black text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="50.000"
                  />
                </div>

                {/* Nominal Summary Box */}
                <div className="bg-white p-3 rounded-xl border border-emerald-100 flex items-center justify-between shadow-xs">
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      Jumlah Transfer:
                    </p>
                    <p className="text-lg font-black text-emerald-700 tracking-tight">
                      Rp {(amount || 0).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy((amount || 0).toString(), 'amount')}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black flex items-center gap-1.5 border border-emerald-200 transition-colors cursor-pointer active:scale-95"
                  >
                    {copiedAmount ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copiedAmount ? 'Tersalin!' : 'Salin Nominal'}
                  </button>
                </div>
              </div>

              {/* 3. Detail Tujuan Transfer (QRIS / Rekening) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                  3. Tujuan Pembayaran Sekolah
                </label>

                {channel === 'qris' && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                        QRIS STANDAR NASIONAL (NMID: ID1024345678)
                      </span>
                    </div>

                    {/* QR Code Container */}
                    <div className="w-52 h-52 mx-auto bg-white p-3 rounded-2xl border-2 border-slate-900 shadow-md flex items-center justify-center relative">
                      {qrisDataUrl ? (
                        <img 
                          src={qrisDataUrl} 
                          alt="QRIS RA Darusyifa" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <p className="font-black text-sm text-slate-900">RA DARUSYIFA ARJAWINANGUN</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Buka aplikasi <strong>DANA, BCA Mobile, BRImo, Livin Mandiri, GoPay, OVO, ShopeePay</strong> lalu scan QRIS di atas. Bebas biaya admin!
                      </p>
                    </div>
                  </div>
                )}

                {channel !== 'qris' && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                        {channel === 'bri' ? 'Bank Rakyat Indonesia (BRI)' : 'Dompet Digital DANA'}
                      </span>
                      <p className="text-base sm:text-lg font-black text-slate-900 tracking-wider font-mono">
                        {activeAccountNumber}
                      </p>
                      <p className="text-xs font-bold text-emerald-700">
                        a.n {activeAccountHolder}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(activeAccountNumber, 'account')}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black flex items-center justify-center gap-2 border border-slate-200 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      {copiedAccount ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      {copiedAccount ? 'Nomor Tersalin!' : 'Salin Nomor'}
                    </button>
                  </div>
                )}
              </div>

              {/* 4. Upload Bukti Resi & Catatan */}
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                  4. Upload Bukti Transfer
                </label>

                {/* Upload Bukti Struk */}
                <div>
                  <div 
                    onClick={() => document.getElementById('nabung-proof-input')?.click()}
                    className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group"
                  >
                    {proofImage ? (
                      <div className="w-full h-full relative flex items-center justify-center bg-slate-100">
                        <img 
                          src={proofImage} 
                          alt="Bukti Transfer" 
                          className="w-full h-full object-contain p-2"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-xl">
                            Klik untuk ganti foto
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4 space-y-1">
                        <Upload size={22} className="text-slate-400 mx-auto mb-1 group-hover:text-emerald-600 transition-colors" />
                        <p className="text-xs font-bold text-slate-700">Pilih Foto atau Screenshot Resi</p>
                        <p className="text-[10px] text-slate-400">Format JPG, PNG (Maksimal 10MB)</p>
                      </div>
                    )}
                  </div>
                  <input 
                    id="nabung-proof-input" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    Catatan / Pesan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Tabungan mingguan ananda"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Anti-Fraud Disclaimer */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5 text-[11px] text-emerald-900 leading-relaxed">
                <ShieldCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Verifikasi Amanah &amp; Terbuka:</strong>
                  <p className="text-emerald-800/80 mt-0.5">
                    Setelah Anda mengirim bukti transfer, bendahara sekolah akan memvalidasi setoran dengan mutasi bank/QRIS. Saldo tabungan santri akan otomatis bertambah di aplikasi.
                  </p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mengirim Bukti...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Kirim Setoran Tabungan</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
