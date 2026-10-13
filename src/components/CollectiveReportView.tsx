import React from 'react';
import { TeacherRecord } from '../types/pkg';
import { evaluatePKG } from '../utils/calculations';
import { KopSurat } from './KopSurat';
import { Printer, Download, Sparkles, Building2, UserPlus } from 'lucide-react';

interface CollectiveReportViewProps {
  records: TeacherRecord[];
  activeRecord: TeacherRecord;
  onSelectTeacher: (id: string) => void;
  onOpenTeacherModal: () => void;
}

export const CollectiveReportView: React.FC<CollectiveReportViewProps> = ({
  records,
  activeRecord,
  onSelectTeacher,
  onOpenTeacherModal
}) => {
  const { teacher, metadata } = activeRecord;

  const handlePrint = () => {
    try {
      window.focus();
      setTimeout(() => {
        window.print();
      }, 150);
    } catch (err) {
      console.error(err);
      alert('Gunakan kombinasi tombol Ctrl + P pada keyboard untuk mencetak.');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'No',
      'Nama Guru',
      'NIP',
      'Golongan',
      'NUPTK/PegID',
      'Mapel Diampu',
      'Tugas Tambahan',
      'Jumlah Total Jam',
      'Nilai PKG',
      'Konversi Nilai PKG',
      'Kategori',
      'Angka Kredit'
    ];

    const rows = records.map((rec, idx) => {
      const ev = evaluatePKG(rec.scores, rec.creditParams);
      return [
        idx + 1,
        `"${rec.teacher.name || '-'}"`,
        `"${rec.teacher.nip || '-'}"`,
        `"${rec.teacher.rankGrade || '-'}"`,
        `"${rec.teacher.nuptk || '-'}"`,
        `"${rec.teacher.teachingAssignment || '-'}"`,
        `"${rec.teacher.additionalDuty || '-'}"`,
        rec.creditParams.jm,
        ev.totalComponentScore,
        ev.scale100Score,
        `"${ev.predicate}"`,
        ev.annualCreditScore
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeSchool = (teacher.schoolName || 'RA').replace(/\s+/g, '_');
    link.setAttribute('download', `Laporan_Hasil_Nilai_PKG_${safeSchool}_${metadata.year || '2026'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Control Banner (Hidden in Print) */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Laporan Hasil Nilai PKG Kolektif (Semua Guru RA)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Format resmi sesuai blanko madrasah/RA lengkap dengan Kop Surat, NSM, NPSN, dan rekap seluruh guru.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenTeacherModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Kelola / Tambah Guru ({records.length})
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor Excel (CSV)
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan Hasil Nilai PKG
          </button>
        </div>
      </div>

      {/* Printable Paper Sheet for Collective Report */}
      <div className="print-container bg-slate-200/60 p-2 sm:p-6 rounded-2xl flex justify-center overflow-x-auto">
        <div className="sheet-page bg-white text-black p-6 sm:p-10 border border-slate-300 shadow-md mx-auto w-full max-w-[280mm] min-h-[210mm] flex flex-col justify-between font-sans text-xs">
          <div>
            {/* 1. KOP SURAT RESMI */}
            <KopSurat teacher={teacher} logoSize={80} />

            {/* 2. JUDUL LAPORAN */}
            <div className="text-center my-4">
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide">
                LAPORAN HASIL NILAI PKG
              </h2>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide">
                TAHUN {metadata.year}
              </h3>
            </div>

            {/* 3. IDENTITAS SEKOLAH DI BAWAH JUDUL */}
            <div className="text-xs mb-4 max-w-xl">
              <table className="w-full text-left">
                <tbody>
                  <tr>
                    <td className="w-36 py-0.5 font-medium">Nama Madrasah / RA</td>
                    <td className="w-3 py-0.5">:</td>
                    <td className="py-0.5 font-bold uppercase">{teacher.schoolName}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-medium">N S M</td>
                    <td className="py-0.5">:</td>
                    <td className="py-0.5 font-semibold">{teacher.nsm || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-medium">Alamat</td>
                    <td className="py-0.5">:</td>
                    <td className="py-0.5">{teacher.schoolAddress}{teacher.schoolVillage && `, ${teacher.schoolVillage}`}{teacher.schoolDistrict && `, Kec. ${teacher.schoolDistrict}`}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. TABEL REKAPITULASI SELURUH GURU */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-[10.5px]">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-black text-center">
                    <th className="border border-black p-1.5 w-8">No.</th>
                    <th className="border border-black p-1.5 w-48">Nama Guru / NIP</th>
                    <th className="border border-black p-1.5 w-24">Gol.</th>
                    <th className="border border-black p-1.5 w-32">NUPTK/PegID</th>
                    <th className="border border-black p-1.5 w-28">Mapel Diampu</th>
                    <th className="border border-black p-1.5 w-28">Tugas Tambahan</th>
                    <th className="border border-black p-1.5 w-16">Jumlah Total Jam</th>
                    <th className="border border-black p-1.5 w-16">Nilai PKG</th>
                    <th className="border border-black p-1.5 w-18">Konversi Nilai PKG</th>
                    <th className="border border-black p-1.5 w-20">Kategori</th>
                    <th className="border border-black p-1.5 w-16">Angka Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, index) => {
                    const evalResult = evaluatePKG(rec.scores, rec.creditParams);
                    return (
                      <tr
                        key={rec.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="border border-black p-1.5 text-center font-medium align-middle">
                          {index + 1}
                        </td>
                        <td className="border border-black p-1.5 align-middle leading-tight">
                          <div className="font-bold text-slate-900">{rec.teacher.name}</div>
                          <div className="text-[9.5px] text-slate-600">NIP. {rec.teacher.nip || '-'}</div>
                        </td>
                        <td className="border border-black p-1.5 text-center align-middle font-medium">
                          {rec.teacher.rankGrade.includes('/')
                            ? rec.teacher.rankGrade.split('/')[1] || rec.teacher.rankGrade
                            : rec.teacher.rankGrade}
                        </td>
                        <td className="border border-black p-1.5 text-center align-middle">
                          {rec.teacher.nuptk || '-'}
                        </td>
                        <td className="border border-black p-1.5 text-center align-middle">
                          {rec.teacher.teachingAssignment || 'Guru Kelas RA'}
                        </td>
                        <td className="border border-black p-1.5 text-center align-middle">
                          {rec.teacher.additionalDuty || '-'}
                        </td>
                        <td className="border border-black p-1.5 text-center align-middle font-semibold tabular-nums">
                          {rec.creditParams.jm}
                        </td>
                        <td className="border border-black p-1.5 text-center align-middle font-bold tabular-nums">
                          {evalResult.totalComponentScore}
                        </td>
                        <td className="border border-black p-1.5 text-center align-middle font-bold tabular-nums">
                          {evalResult.scale100Score}
                        </td>
                        <td className="border border-black p-1.5 text-center align-middle font-semibold">
                          {evalResult.predicate}
                        </td>
                        <td className="border border-black p-1.5 text-center align-middle font-extrabold text-slate-950 tabular-nums">
                          {evalResult.annualCreditScore}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Empty rows filler if less than 6 records to match print appearance */}
                  {Array.from({ length: Math.max(0, 5 - records.length) }).map((_, fIdx) => (
                    <tr key={`filler-${fIdx}`} className="h-8">
                      <td className="border border-black p-1 text-center text-slate-300">{records.length + fIdx + 1}</td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. TANDA TANGAN (Kiri: Supervisor / Penilai, Kanan: Kepala Madrasah / RA) */}
          <div className="mt-8 pt-4">
            <div className="flex justify-between items-start px-8 text-xs">
              {/* Kiri */}
              <div className="text-left w-72">
                <p className="font-medium">Mengetahui :</p>
                <p className="font-semibold mb-20">Supervisor,</p>
                <p className="font-bold underline uppercase">
                  {metadata.supervisorName || metadata.assessorName}
                </p>
                <p>NIP. {metadata.supervisorNip || metadata.assessorNip || '..................................................'}</p>
              </div>

              {/* Kanan */}
              <div className="text-left w-72 pl-8">
                <p className="font-medium mb-1">{metadata.cityDate}</p>
                <p className="font-semibold mb-20">Kepala Madrasah / RA,</p>
                <p className="font-bold underline uppercase">
                  {metadata.headmasterName}
                </p>
                <p>NIP. {metadata.headmasterNip || '..................................................'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
