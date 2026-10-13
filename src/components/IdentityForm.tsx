import React, { useRef } from 'react';
import { TeacherInfo, AssessmentMetadata, CreditScoreParams } from '../types/pkg';
import { GOLONGAN_PRESETS } from '../utils/calculations';
import { KopSurat } from './KopSurat';
import {
  Building2,
  UserCheck,
  Calendar,
  Award,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Eye,
  FileSpreadsheet
} from 'lucide-react';

interface IdentityFormProps {
  teacher: TeacherInfo;
  metadata: AssessmentMetadata;
  creditParams: CreditScoreParams;
  onUpdateTeacher: (updated: Partial<TeacherInfo>) => void;
  onUpdateMetadata: (updated: Partial<AssessmentMetadata>) => void;
  onUpdateCreditParams: (updated: Partial<CreditScoreParams>) => void;
}

export const IdentityForm: React.FC<IdentityFormProps> = ({
  teacher,
  metadata,
  creditParams,
  onUpdateTeacher,
  onUpdateMetadata,
  onUpdateCreditParams
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGolonganChange = (key: string) => {
    const preset = GOLONGAN_PRESETS[key];
    if (preset) {
      onUpdateTeacher({ rankGrade: preset.rank });
      onUpdateCreditParams({
        akk: preset.akk,
        akpkb: preset.akpkb,
        akp: preset.akp
      });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onUpdateTeacher({ schoolLogoUrl: result });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleResetToKemenagLogo = () => {
    onUpdateTeacher({ schoolLogoUrl: 'kemenag' });
  };

  return (
    <div className="space-y-8">
      {/* Quick helper tip banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-emerald-900 text-sm">
        <div>
          <span className="font-semibold block">Petunjuk Pengisian Identitas & Kop Surat:</span>
          Isi data identitas guru, madrasah/RA, logo, NSM, dan NPSN di bawah ini. Semua data ini otomatis terintegrasi ke seluruh dokumen laporan (Cover, Persetujuan, Rekapitulasi, Laporan Kolektif, dan Format Angka Kredit).
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs text-emerald-800 font-medium">Preset Golongan:</label>
          <select
            className="text-xs bg-white border border-emerald-300 rounded px-2 py-1 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            onChange={(e) => handleGolonganChange(e.target.value)}
            defaultValue="III/a"
          >
            {Object.entries(GOLONGAN_PRESETS).map(([key, val]) => (
              <option key={key} value={key}>
                {key} ({val.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 1: KOP SURAT MADRASAH / RA (LOGO, NSM, NPSN, ALAMAT) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                1. Pengaturan Kop Surat Madrasah / RA (Logo, NSM, NPSN & Alamat)
              </h2>
              <p className="text-xs text-slate-500">
                Atur kop surat resmi yang akan tampil di Laporan Hasil Nilai PKG dan dokumen resmi lainnya.
              </p>
            </div>
          </div>
        </div>

        {/* Live Preview Kop Surat Box */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pratinjau Langsung Kop Surat :</span>
          </div>
          <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
            <KopSurat teacher={teacher} logoSize={70} />
          </div>
        </div>

        {/* Logo Upload & Controls */}
        <div className="mb-6 p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0">
              {teacher.schoolLogoUrl && teacher.schoolLogoUrl.startsWith('data:image') ? (
                <img
                  src={teacher.schoolLogoUrl}
                  alt="Logo Terpilih"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-[10px] text-center font-bold text-emerald-800">
                  Logo Kemenag
                </div>
              )}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Logo Kop Surat
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Gunakan Logo Resmi Kemenag atau upload logo Madrasah/Yayasan Anda sendiri (PNG/JPG maks 2MB).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Logo Sendiri
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />

            <button
              type="button"
              onClick={handleResetToKemenagLogo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors"
              title="Gunakan Logo Kemenag Default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Logo Kemenag
            </button>
          </div>
        </div>

        {/* Fields for Kop Surat: Yayasan, Madrasah, NSM, NPSN, Alamat */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Yayasan / Badan Penyelenggara (Baris 1)
            </label>
            <input
              type="text"
              value={teacher.foundationName || ''}
              onChange={(e) => onUpdateTeacher({ foundationName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
              placeholder="Contoh: YAYASAN PENDIDIKAN ISLAM AL-IKHLAS"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Madrasah / RA (Baris 2) *
            </label>
            <input
              type="text"
              value={teacher.schoolName}
              onChange={(e) => onUpdateTeacher({ schoolName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
              placeholder="Contoh: RA AL-IKHLAS SUMBER"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                N S M (Nomor Statistik) *
              </label>
              <input
                type="text"
                value={teacher.nsm || ''}
                onChange={(e) => onUpdateTeacher({ nsm: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                placeholder="101232090123"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                N P S N (Nomor Pokok) *
              </label>
              <input
                type="text"
                value={teacher.npsn || ''}
                onChange={(e) => onUpdateTeacher({ npsn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                placeholder="69781234"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Alamat Lengkap (Jalan, No.)
            </label>
            <input
              type="text"
              value={teacher.schoolAddress}
              onChange={(e) => onUpdateTeacher({ schoolAddress: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
              placeholder="Jl. Ki Bagus Rangin No. 24"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Desa/Kelurahan</label>
              <input
                type="text"
                value={teacher.schoolVillage}
                onChange={(e) => onUpdateTeacher({ schoolVillage: e.target.value })}
                className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                placeholder="Sumber"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Kecamatan</label>
              <input
                type="text"
                value={teacher.schoolDistrict}
                onChange={(e) => onUpdateTeacher({ schoolDistrict: e.target.value })}
                className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                placeholder="Sumber"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Kode Pos</label>
              <input
                type="text"
                value={teacher.schoolPostalCode || ''}
                onChange={(e) => onUpdateTeacher({ schoolPostalCode: e.target.value })}
                className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                placeholder="45611"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Kabupaten / Kota</label>
              <input
                type="text"
                value={teacher.schoolCity}
                onChange={(e) => onUpdateTeacher({ schoolCity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                placeholder="Cirebon"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Provinsi</label>
              <input
                type="text"
                value={teacher.schoolProvince}
                onChange={(e) => onUpdateTeacher({ schoolProvince: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                placeholder="Jawa Barat"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Telp / HP</label>
              <input
                type="text"
                value={teacher.schoolPhone}
                onChange={(e) => onUpdateTeacher({ schoolPhone: e.target.value })}
                className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                placeholder="0231-321456"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Sekolah</label>
              <input
                type="text"
                value={teacher.schoolEmail || ''}
                onChange={(e) => onUpdateTeacher({ schoolEmail: e.target.value })}
                className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                placeholder="ra.alikhlas@gmail.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Website</label>
              <input
                type="text"
                value={teacher.schoolWebsite || ''}
                onChange={(e) => onUpdateTeacher({ schoolWebsite: e.target.value })}
                className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                placeholder="www.ra-alikhlas.sch.id"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Unit Kerja Kemenag (di Cover & Laporan)
            </label>
            <input
              type="text"
              value={teacher.unitOfWork}
              onChange={(e) => onUpdateTeacher({ unitOfWork: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
              placeholder="Kementerian Agama Kabupaten Cirebon"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: DATA GURU YANG DINILAI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card: Biodata Guru */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">2. Data Guru yang Dinilai</h2>
              <p className="text-xs text-slate-500">Informasi pendidik Raudhatul Athfal</p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap & Gelar *
              </label>
              <input
                type="text"
                value={teacher.name}
                onChange={(e) => onUpdateTeacher({ name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Contoh: Siti Rohmah, S.Pd.I"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  N I P (jika ada / kosongkan jika -)
                </label>
                <input
                  type="text"
                  value={teacher.nip}
                  onChange={(e) => onUpdateTeacher({ nip: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                  placeholder="19880415 201101 2 018 atau -"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  NUPTK / PegID / NRG
                </label>
                <input
                  type="text"
                  value={teacher.nuptk}
                  onChange={(e) => onUpdateTeacher({ nuptk: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                  placeholder="4538766667210082"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tempat, Tanggal Lahir
                </label>
                <input
                  type="text"
                  value={teacher.birthPlaceDate}
                  onChange={(e) => onUpdateTeacher({ birthPlaceDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                  placeholder="Cirebon, 15 April 1988"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={teacher.gender}
                  onChange={(e) => onUpdateTeacher({ gender: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                >
                  <option value="Perempuan">Perempuan</option>
                  <option value="Laki-laki">Laki-laki</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pangkat / Golongan Ruang
                </label>
                <input
                  type="text"
                  value={teacher.rankGrade}
                  onChange={(e) => onUpdateTeacher({ rankGrade: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                  placeholder="Penata Muda / III/a atau Guru Tetap Yayasan"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Jabatan Fungsional
                </label>
                <input
                  type="text"
                  value={teacher.position}
                  onChange={(e) => onUpdateTeacher({ position: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                  placeholder="Guru Pertama / Guru Kelas"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mapel / Tugas yang Diampu
                </label>
                <input
                  type="text"
                  value={teacher.teachingAssignment}
                  onChange={(e) => onUpdateTeacher({ teachingAssignment: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                  placeholder="Guru Kelas RA"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tugas Tambahan (di Laporan Hasil)
                </label>
                <input
                  type="text"
                  value={teacher.additionalDuty || ''}
                  onChange={(e) => onUpdateTeacher({ additionalDuty: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                  placeholder="Wali Kelas RA A / Kepala RA / -"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pendidikan Terakhir / Jurusan
                </label>
                <input
                  type="text"
                  value={teacher.lastEducation}
                  onChange={(e) => onUpdateTeacher({ lastEducation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                  placeholder="S1 PG-PAUD / S1 PAI"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Masa Kerja
                </label>
                <input
                  type="text"
                  value={teacher.serviceYears}
                  onChange={(e) => onUpdateTeacher({ serviceYears: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                  placeholder="15 Tahun 0 Bulan"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  TMT Sebagai Guru
                </label>
                <input
                  type="text"
                  value={teacher.tmtTeacher}
                  onChange={(e) => onUpdateTeacher({ tmtTeacher: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                  placeholder="01 Januari 2011"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mulai Bekerja di RA Ini
                </label>
                <input
                  type="text"
                  value={teacher.workStartDateAtSchool}
                  onChange={(e) => onUpdateTeacher({ workStartDateAtSchool: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                  placeholder="01 Juli 2015"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card: Penilai, Supervisor & Kepala RA */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">3. Penilai, Supervisor & Kepala RA</h2>
              <p className="text-xs text-slate-500">Pejabat penilai untuk lembar pengesahan & tanda tangan</p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Supervisor / Pengawas *
                </label>
                <input
                  type="text"
                  value={metadata.supervisorName || metadata.assessorName}
                  onChange={(e) => onUpdateMetadata({ supervisorName: e.target.value, assessorName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-xs"
                  placeholder="Drs. H. Ahmad Fauzi, M.Pd.I"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  NIP Supervisor / Pengawas
                </label>
                <input
                  type="text"
                  value={metadata.supervisorNip || metadata.assessorNip}
                  onChange={(e) => onUpdateMetadata({ supervisorNip: e.target.value, assessorNip: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-xs"
                  placeholder="19750810 200003 1 004 atau -"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pangkat / Gol. Penilai
                </label>
                <input
                  type="text"
                  value={metadata.assessorRank}
                  onChange={(e) => onUpdateMetadata({ assessorRank: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-xs"
                  placeholder="Pembina / IV/a"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Jabatan Penilai
                </label>
                <input
                  type="text"
                  value={metadata.assessorPosition}
                  onChange={(e) => onUpdateMetadata({ assessorPosition: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-xs"
                  placeholder="Pengawas Madrasah / Guru Senior"
                />
              </div>
            </div>

            <hr className="border-slate-100 my-2" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kepala Madrasah / RA *
                </label>
                <input
                  type="text"
                  value={metadata.headmasterName}
                  onChange={(e) => onUpdateMetadata({ headmasterName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-xs font-semibold"
                  placeholder="Hj. Nurul Hidayah, M.Pd."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  NIP Kepala RA
                </label>
                <input
                  type="text"
                  value={metadata.headmasterNip}
                  onChange={(e) => onUpdateMetadata({ headmasterNip: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-xs"
                  placeholder="19800612 200501 2 007 atau -"
                />
              </div>
            </div>

            <hr className="border-slate-100 my-2" />

            {/* Periode & Tempat TTD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tahun Anggaran & Periode
                </label>
                <input
                  type="text"
                  value={metadata.period}
                  onChange={(e) => onUpdateMetadata({ period: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-xs"
                  placeholder="Januari s/d Desember 2026"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Kota & Tanggal TTD
                </label>
                <input
                  type="text"
                  value={metadata.cityDate}
                  onChange={(e) => onUpdateMetadata({ cityDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-xs"
                  placeholder="Cirebon, 31 Desember 2026"
                />
              </div>
            </div>

            {/* Jam Mengajar (JM & JWM) */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-700 block mb-1">
                Beban Jam Mengajar Mingguan:
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500">Jumlah Jam Tatap Muka (JM)</label>
                  <input
                    type="number"
                    value={creditParams.jm}
                    onChange={(e) => onUpdateCreditParams({ jm: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500">Jam Wajib Mengajar (JWM)</label>
                  <input
                    type="number"
                    value={creditParams.jwm}
                    onChange={(e) => onUpdateCreditParams({ jwm: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
