import React from 'react';
import { TeacherRecord, FullEvaluationResult } from '../types/pkg';
import { PKG_COMPONENTS } from '../data/pkgStructure';
import { Award, Calculator, Printer, ArrowRight, CheckCircle2 } from 'lucide-react';

interface RecapViewProps {
  record: TeacherRecord;
  evaluation: FullEvaluationResult;
  onGoToPrint: () => void;
}

export const RecapView: React.FC<RecapViewProps> = ({
  record,
  evaluation,
  onGoToPrint
}) => {
  const { teacher, metadata, creditParams } = record;

  return (
    <div className="space-y-8">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Total Nilai PKG (15 Komponen)
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">
            {evaluation.totalComponentScore}{' '}
            <span className="text-sm font-medium text-slate-400">/ 60</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Maksimum 60 poin (15 × 4)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Konversi Nilai Skala 100
          </span>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2 tabular-nums">
            {evaluation.scale100Score}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Rumus: (Nilai PKG / 60) × 100
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Sebutan & Persentase NPK
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-2 flex items-center gap-2">
            <span>{evaluation.predicate}</span>
            <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
              {evaluation.npkPercent}%
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Kategori Permen PAN-RB No. 16/2009
          </div>
        </div>

        <div className="bg-emerald-700 text-white rounded-xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wide">
            Angka Kredit 1 Tahun (AK)
          </span>
          <div className="text-3xl font-extrabold mt-2 tabular-nums">
            {evaluation.annualCreditScore}
          </div>
          <div className="text-xs text-emerald-200 mt-1">
            Siap digunakan untuk DUPAK / PAK
          </div>
        </div>
      </div>

      {/* Main Table: Rekap Hasil Penilaian Kinerja Guru (Page 15 format) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Rekapitulasi Hasil Penilaian Kinerja Guru RA (Kepdirjen Pendis 1843/2021)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Guru: <strong className="text-slate-800">{teacher.name}</strong> | RA: <strong className="text-slate-800">{teacher.schoolName}</strong>
            </p>
          </div>

          <button
            onClick={onGoToPrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start md:self-auto"
          >
            <Printer className="w-4 h-4" />
            Cetak Dokumen Hasil Akhir
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4 w-12 text-center">No</th>
                <th className="py-2.5 px-4">Kompetensi & Komponen Penilaian</th>
                <th className="py-2.5 px-4 w-32 text-center">Skor Mentah</th>
                <th className="py-2.5 px-4 w-32 text-center">Persentase</th>
                <th className="py-2.5 px-4 w-28 text-center bg-emerald-50/50">Nilai Komponen (1-4)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Group A: Pedagogik */}
              <tr className="bg-slate-50 font-bold text-slate-900">
                <td className="py-2 px-4 text-center">A</td>
                <td className="py-2 px-4" colSpan={4}>
                  PEDAGOGIK
                </td>
              </tr>
              {PKG_COMPONENTS.filter((c) => c.competencyId === 1).map((comp) => {
                const res = evaluation.componentResults.find((r) => r.componentId === comp.id);
                return (
                  <tr key={comp.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 text-center text-slate-500">{comp.id}</td>
                    <td className="py-2.5 px-4 text-slate-800">{comp.title}</td>
                    <td className="py-2.5 px-4 text-center text-slate-600 tabular-nums">
                      {res?.totalScore} / {res?.maxScore}
                    </td>
                    <td className="py-2.5 px-4 text-center text-slate-600 tabular-nums">
                      {res?.percentage}%
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-800 bg-emerald-50/30 tabular-nums">
                      {res?.componentValue}
                    </td>
                  </tr>
                );
              })}

              {/* Group B: Kepribadian */}
              <tr className="bg-slate-50 font-bold text-slate-900">
                <td className="py-2 px-4 text-center">B</td>
                <td className="py-2 px-4" colSpan={4}>
                  KEPRIBADIAN
                </td>
              </tr>
              {PKG_COMPONENTS.filter((c) => c.competencyId === 2).map((comp) => {
                const res = evaluation.componentResults.find((r) => r.componentId === comp.id);
                return (
                  <tr key={comp.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 text-center text-slate-500">{comp.id}</td>
                    <td className="py-2.5 px-4 text-slate-800">{comp.title}</td>
                    <td className="py-2.5 px-4 text-center text-slate-600 tabular-nums">
                      {res?.totalScore} / {res?.maxScore}
                    </td>
                    <td className="py-2.5 px-4 text-center text-slate-600 tabular-nums">
                      {res?.percentage}%
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-800 bg-emerald-50/30 tabular-nums">
                      {res?.componentValue}
                    </td>
                  </tr>
                );
              })}

              {/* Group C: Profesional */}
              <tr className="bg-slate-50 font-bold text-slate-900">
                <td className="py-2 px-4 text-center">C</td>
                <td className="py-2 px-4" colSpan={4}>
                  PROFESIONAL
                </td>
              </tr>
              {PKG_COMPONENTS.filter((c) => c.competencyId === 3).map((comp) => {
                const res = evaluation.componentResults.find((r) => r.componentId === comp.id);
                return (
                  <tr key={comp.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 text-center text-slate-500">{comp.id}</td>
                    <td className="py-2.5 px-4 text-slate-800">{comp.title}</td>
                    <td className="py-2.5 px-4 text-center text-slate-600 tabular-nums">
                      {res?.totalScore} / {res?.maxScore}
                    </td>
                    <td className="py-2.5 px-4 text-center text-slate-600 tabular-nums">
                      {res?.percentage}%
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-800 bg-emerald-50/30 tabular-nums">
                      {res?.componentValue}
                    </td>
                  </tr>
                );
              })}

              {/* Group D: Sosial */}
              <tr className="bg-slate-50 font-bold text-slate-900">
                <td className="py-2 px-4 text-center">D</td>
                <td className="py-2 px-4" colSpan={4}>
                  SOSIAL
                </td>
              </tr>
              {PKG_COMPONENTS.filter((c) => c.competencyId === 4).map((comp) => {
                const res = evaluation.componentResults.find((r) => r.componentId === comp.id);
                return (
                  <tr key={comp.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 text-center text-slate-500">{comp.id}</td>
                    <td className="py-2.5 px-4 text-slate-800">{comp.title}</td>
                    <td className="py-2.5 px-4 text-center text-slate-600 tabular-nums">
                      {res?.totalScore} / {res?.maxScore}
                    </td>
                    <td className="py-2.5 px-4 text-center text-slate-600 tabular-nums">
                      {res?.percentage}%
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-800 bg-emerald-50/30 tabular-nums">
                      {res?.componentValue}
                    </td>
                  </tr>
                );
              })}

              {/* Summary Row */}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <td className="py-3 px-4 text-right" colSpan={4}>
                  Jumlah (Hasil Penilaian Kinerja Guru Raudhatul Athfal)
                </td>
                <td className="py-3 px-4 text-center text-sm font-extrabold text-emerald-900 bg-emerald-100 tabular-nums">
                  {evaluation.totalComponentScore}
                </td>
              </tr>

              <tr className="bg-slate-50 font-semibold border-t border-slate-200">
                <td className="py-3 px-4 text-right" colSpan={4}>
                  Konversi ke dalam Skala 0 - 100 : (Nilai PKG / 60) × 100
                </td>
                <td className="py-3 px-4 text-center text-sm font-bold text-blue-900 bg-blue-50 tabular-nums">
                  {evaluation.scale100Score}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Formula Calculation Breakdown Card (Page 16 format) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Rincian Penghitungan Angka Kredit 1 Tahun
            </h3>
            <p className="text-xs text-slate-500">
              Berdasarkan Permen PAN dan RB No. 16 Tahun 2009 & Kepdirjen Pendis No. 1843 Tahun 2021
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-xs text-slate-700 uppercase">
              1. Parameter yang Digunakan:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-slate-600">Nilai PKG (Skala 100):</div>
              <div className="font-bold text-slate-900 tabular-nums">{evaluation.scale100Score}</div>

              <div className="text-slate-600">Sebutan Kinerja:</div>
              <div className="font-bold text-slate-900">{evaluation.predicate}</div>

              <div className="text-slate-600">Persentase NPK:</div>
              <div className="font-bold text-slate-900 tabular-nums">{evaluation.npkPercent}% ({evaluation.npkPercent / 100})</div>

              <div className="text-slate-600">AKK (Kredit Kumulatif):</div>
              <div className="font-bold text-slate-900 tabular-nums">{creditParams.akk}</div>

              <div className="text-slate-600">AKPKB (Pengemb. Keprofesian):</div>
              <div className="font-bold text-slate-900 tabular-nums">{creditParams.akpkb}</div>

              <div className="text-slate-600">AKP (Unsur Penunjang):</div>
              <div className="font-bold text-slate-900 tabular-nums">{creditParams.akp}</div>

              <div className="text-slate-600">Tatap Muka (JM / JWM):</div>
              <div className="font-bold text-slate-900 tabular-nums">{creditParams.jm} / {creditParams.jwm} Jam</div>
            </div>
          </div>

          <div className="space-y-3 bg-emerald-50/50 p-4 rounded-lg border border-emerald-200">
            <h4 className="font-semibold text-xs text-emerald-800 uppercase">
              2. Rumus & Kalkulasi:
            </h4>
            <div className="font-mono text-xs bg-white p-2.5 rounded border border-emerald-300 text-emerald-950">
              Angka Kredit 1 Tahun = ((AKK - AKPKB - AKP) × (JM / JWM) × NPK) / 4
            </div>
            <div className="text-xs text-slate-700 space-y-1">
              <div>= (({creditParams.akk} - {creditParams.akpkb} - {creditParams.akp}) × ({creditParams.jm} / {creditParams.jwm}) × {evaluation.npkPercent}%) / 4</div>
              <div>= ({creditParams.akk - creditParams.akpkb - creditParams.akp} × 1 × {evaluation.npkPercent / 100}) / 4</div>
              <div className="font-bold text-base text-emerald-900 pt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>= {evaluation.annualCreditScore} Angka Kredit</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              * Angka kredit ini siap dimasukkan ke dalam Penetapan Angka Kredit (PAK) tahunan guru.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons to Print & Collective Report */}
      <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="text-xs text-slate-500">
          Semua penghitungan di atas telah sesuai rumus resmi Permen PAN-RB No 16/2009.
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGoToPrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Lanjut ke Cetak Berkas Lengkap (16 Halaman)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
