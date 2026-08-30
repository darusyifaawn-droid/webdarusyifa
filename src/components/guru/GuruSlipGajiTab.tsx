import React, { useState, useMemo } from 'react';
import { 
  Wallet, Printer, Download, Eye, Calendar, ShieldCheck, 
  ArrowUpRight, ArrowDownRight, CheckCircle, Clock, Search, 
  Building2, ChevronRight, FileText, Sparkles, Filter
} from 'lucide-react';
import { SalarySlipData, formatRupiah, terbilang, MONTH_NAMES, DEFAULT_KEPSEK } from '../../lib/salaryUtils';
import SalarySlipModal from '../salary/SalarySlipModal';

interface GuruSlipGajiTabProps {
  salarySlips: SalarySlipData[];
  userData: any;
  user: any;
  settings?: any;
}

export default function GuruSlipGajiTab({
  salarySlips,
  userData,
  user,
  settings
}: GuruSlipGajiTabProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('Semua');
  const [selectedSlipForView, setSelectedSlipForView] = useState<SalarySlipData | null>(null);

  // Filter salary slips belonging to this teacher
  const mySlips = useMemo(() => {
    const teacherId = userData?.id || user?.uid;
    const teacherEmail = userData?.email || user?.email;
    const teacherName = userData?.name || '';

    return salarySlips.filter(slip => {
      const matchId = slip.teacherId === teacherId;
      const matchEmail = Boolean(teacherEmail && slip.teacherEmail === teacherEmail);
      const matchName = Boolean(teacherName && slip.teacherName?.toLowerCase() === teacherName.toLowerCase());
      const isMine = matchId || matchEmail || matchName;

      // Only published or paid slips are visible to teachers (not Drafts)
      const isVisibleStatus = slip.status === 'Diterbitkan' || slip.status === 'Dibayarkan';

      return isMine && isVisibleStatus;
    }).sort((a, b) => {
      // Sort newest first
      const dateA = a.tanggalTerbit || `${a.tahun}-${String(MONTH_NAMES.indexOf(a.bulan) + 1).padStart(2, '0')}-01`;
      const dateB = b.tanggalTerbit || `${b.tahun}-${String(MONTH_NAMES.indexOf(b.bulan) + 1).padStart(2, '0')}-01`;
      return dateB.localeCompare(dateA);
    });
  }, [salarySlips, userData, user]);

  // Filtered by year and month
  const filteredMySlips = useMemo(() => {
    return mySlips.filter(s => {
      const matchYear = selectedYear === 0 || s.tahun === Number(selectedYear);
      const matchMonth = selectedMonth === 'Semua' || s.bulan === selectedMonth;
      return matchYear && matchMonth;
    });
  }, [mySlips, selectedYear, selectedMonth]);

  // Latest slip for hero display
  const latestSlip = mySlips[0] || null;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-emerald-200 text-xs font-bold mb-3 border border-white/15">
              <ShieldCheck size={14} className="text-emerald-300" /> Dokumen Keuangan Resmi & Terverifikasi
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Slip Gaji & Honorarium Saya
            </h2>
            <p className="text-sm text-emerald-100/90 font-medium mt-1 max-w-xl">
              Cek rincian penghasilan bulanan, tunjangan, potongan, serta cetak atau simpan slip gaji resmi ber-barcode Kepala Sekolah kapan saja.
            </p>
          </div>

          {latestSlip && (
            <button
              onClick={() => setSelectedSlipForView(latestSlip)}
              className="px-5 py-3.5 bg-white hover:bg-emerald-50 text-emerald-900 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 shadow-xl active:scale-95 shrink-0"
            >
              <Printer size={16} /> Cetak Slip Terkini ({latestSlip.bulan} {latestSlip.tahun})
            </button>
          )}
        </div>
      </div>

      {/* Hero: Latest Slip Summary Card */}
      {latestSlip ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-5">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Slip Gaji Terakhir ({latestSlip.bulan} {latestSlip.tahun})
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                Penerimaan Bulan {latestSlip.bulan} {latestSlip.tahun}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Diterbitkan pada {latestSlip.tanggalTerbit || '-'} &bull; No: {latestSlip.qrVerificationCode}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                latestSlip.status === 'Dibayarkan'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {latestSlip.status === 'Dibayarkan' ? '✓ Telah Dibayarkan' : 'Diterbitkan'}
              </span>
              <button
                onClick={() => setSelectedSlipForView(latestSlip)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                <Eye size={14} /> Lihat Detail & Cetak
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Take Home Pay */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 rounded-2xl p-5 border border-emerald-200/80">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                Gaji Bersih Diterima
              </span>
              <p className="text-3xl font-black text-emerald-700 mt-2 tracking-tight">
                {formatRupiah(latestSlip.gajiBersih)}
              </p>
              <p className="text-xs text-emerald-950 font-medium italic mt-2">
                Terbilang: <strong>{terbilang(latestSlip.gajiBersih)}</strong>
              </p>
            </div>

            {/* Penerimaan Breakdown */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <ArrowUpRight size={14} className="text-emerald-600" /> Total Penerimaan
                </span>
                <span className="text-xs font-black text-emerald-700">
                  {formatRupiah(latestSlip.totalPenerimaan)}
                </span>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Gaji Pokok:</span>
                  <span className="font-bold text-slate-800">{formatRupiah(latestSlip.gajiPokok)}</span>
                </div>
                {latestSlip.tunjanganWaliKelas > 0 && (
                  <div className="flex justify-between">
                    <span>Tunj. Wali Kelas:</span>
                    <span className="font-bold text-slate-800">{formatRupiah(latestSlip.tunjanganWaliKelas)}</span>
                  </div>
                )}
                {latestSlip.tunjanganTransport > 0 && (
                  <div className="flex justify-between">
                    <span>Tunj. Transport:</span>
                    <span className="font-bold text-slate-800">{formatRupiah(latestSlip.tunjanganTransport)}</span>
                  </div>
                )}
                {latestSlip.tunjanganMakan > 0 && (
                  <div className="flex justify-between">
                    <span>Tunj. Uang Makan:</span>
                    <span className="font-bold text-slate-800">{formatRupiah(latestSlip.tunjanganMakan)}</span>
                  </div>
                )}
                {latestSlip.insentifBonus > 0 && (
                  <div className="flex justify-between">
                    <span>Insentif / Bonus:</span>
                    <span className="font-bold text-slate-800">{formatRupiah(latestSlip.insentifBonus)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Potongan Breakdown */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <ArrowDownRight size={14} className="text-rose-600" /> Total Potongan
                </span>
                <span className="text-xs font-black text-rose-600">
                  {formatRupiah(latestSlip.totalPotongan)}
                </span>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                {latestSlip.potonganKoperasi > 0 && (
                  <div className="flex justify-between">
                    <span>Koperasi / Kas Guru:</span>
                    <span className="font-bold text-rose-600">-{formatRupiah(latestSlip.potonganKoperasi)}</span>
                  </div>
                )}
                {latestSlip.potonganBpjs > 0 && (
                  <div className="flex justify-between">
                    <span>BPJS / Kesehatan:</span>
                    <span className="font-bold text-rose-600">-{formatRupiah(latestSlip.potonganBpjs)}</span>
                  </div>
                )}
                {latestSlip.potonganAbsen > 0 && (
                  <div className="flex justify-between">
                    <span>Absensi:</span>
                    <span className="font-bold text-rose-600">-{formatRupiah(latestSlip.potonganAbsen)}</span>
                  </div>
                )}
                {latestSlip.totalPotongan === 0 && (
                  <div className="text-slate-400 italic text-center py-3">
                    Tidak ada potongan pada periode ini
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Wallet size={28} />
          </div>
          <h4 className="text-base font-bold text-slate-800">Belum Ada Slip Gaji Diterbitkan</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Slip gaji Anda akan otomatis muncul di sini setelah diterbitkan oleh Bendahara atau Administrator madrasah.
          </p>
        </div>
      )}

      {/* Slips Archive & History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Riwayat Slip Gaji ({filteredMySlips.length} Data)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Arsip penggajian Anda di RA Darusyifa
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Bulan</option>
              {MONTH_NAMES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredMySlips.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs italic">
            Tidak ada riwayat slip gaji pada periode {selectedMonth} {selectedYear}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">No</th>
                  <th className="py-3.5 px-4">Periode</th>
                  <th className="py-3.5 px-4">No. Dokumen</th>
                  <th className="py-3.5 px-4 text-right">Penerimaan</th>
                  <th className="py-3.5 px-4 text-right">Potongan</th>
                  <th className="py-3.5 px-4 text-right">Gaji Bersih</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMySlips.map((slip, idx) => (
                  <tr key={slip.id || idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {slip.bulan} {slip.tahun}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {slip.qrVerificationCode || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                      {formatRupiah(slip.totalPenerimaan)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                      {slip.totalPotongan > 0 ? `-${formatRupiah(slip.totalPotongan)}` : 'Rp 0'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-black text-sm text-slate-900">
                        {formatRupiah(slip.gajiBersih)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        slip.status === 'Dibayarkan'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {slip.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedSlipForView(slip)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-xs mx-auto"
                      >
                        <Printer size={13} /> Cetak
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Salary Slip Detail & Print Modal */}
      {selectedSlipForView && (
        <SalarySlipModal
          slip={selectedSlipForView}
          onClose={() => setSelectedSlipForView(null)}
          schoolSettings={settings}
        />
      )}

    </div>
  );
}
