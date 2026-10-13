/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TeacherRecord } from './types/pkg';
import { INITIAL_TEACHER_RECORD, BLANK_TEACHER_RECORD, SAMPLE_TEACHERS } from './data/initialData';
import { evaluatePKG } from './utils/calculations';
import { IdentityForm } from './components/IdentityForm';
import { ScoringView } from './components/ScoringView';
import { RecapView } from './components/RecapView';
import { CollectiveReportView } from './components/CollectiveReportView';
import { PrintDocument } from './components/PrintDocument';
import { TeacherManagerModal } from './components/TeacherManagerModal';
import { LoginPage } from './components/LoginPage';
import { MultiSchoolModal } from './components/MultiSchoolModal';
import { KemenagLogo } from './components/KemenagLogo';
import {
  FileText,
  UserCheck,
  Award,
  Printer,
  Users,
  Sparkles,
  ChevronRight,
  BookOpen,
  FileSpreadsheet,
  Building2,
  LogOut,
  School,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

const STORAGE_KEY_RECORDS = 'pkg_ra_records_v5_clean';
const STORAGE_KEY_ACTIVE = 'pkg_ra_active_id_v5_clean';
const STORAGE_KEY_AUTH = 'pkg_ra_auth_user_v3';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string; schoolName: string } | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default logged in for instant access
    return {
      name: 'Kepala RA',
      role: 'Kepala Madrasah / RA',
      schoolName: ''
    };
  });

  const [records, setRecords] = useState<TeacherRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    // Clean blank template for sharing to any school
    return [BLANK_TEACHER_RECORD];
  });

  const [activeId, setActiveId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return records[0]?.id || BLANK_TEACHER_RECORD.id;
  });

  const [activeTab, setActiveTab] = useState<'identity' | 'scoring' | 'recap' | 'collective' | 'print'>('identity');
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isMultiSchoolModalOpen, setIsMultiSchoolModalOpen] = useState(false);

  const handleClearAllData = () => {
    if (window.confirm('Kosongkan semua data guru dan madrasah? Data akan direset menjadi template bersih tanpa data apapun, siap dibagikan ke sekolah lain.')) {
      setRecords([BLANK_TEACHER_RECORD]);
      setActiveId(BLANK_TEACHER_RECORD.id);
      try {
        localStorage.removeItem(STORAGE_KEY_RECORDS);
        localStorage.removeItem(STORAGE_KEY_ACTIVE);
      } catch {
        // ignore
      }
      alert('Semua data berhasil dikosongkan. Sistem sekarang bersih dan siap digunakan!');
    }
  };

  const handleLoadSampleData = () => {
    setRecords(SAMPLE_TEACHERS);
    setActiveId(SAMPLE_TEACHERS[0].id);
  };

  const handleLogin = (user: { name: string; role: string; schoolName: string }) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } catch {
      // ignore
    }
  };

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch {
      // ignore
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeId);
    } catch {
      // ignore
    }
  }, [activeId]);

  const currentRecord = records.find((r) => r.id === activeId) || records[0];

  // Helper to update current record and synchronize school metadata across all teachers if school data changed
  const handleUpdateTeacher = (updatedTeacher: Partial<typeof currentRecord.teacher>) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === currentRecord.id) {
          return {
            ...r,
            updatedAt: new Date().toISOString(),
            teacher: { ...r.teacher, ...updatedTeacher }
          };
        }
        // Sync school-wide attributes (Kop surat, alamat, logo, NSM, NPSN) to all teachers in the same RA
        const schoolAttributes = [
          'foundationName',
          'schoolName',
          'nsm',
          'npsn',
          'schoolAddress',
          'schoolVillage',
          'schoolDistrict',
          'schoolCity',
          'schoolProvince',
          'schoolPostalCode',
          'schoolPhone',
          'schoolEmail',
          'schoolWebsite',
          'schoolLogoUrl',
          'unitOfWork',
          'kemenagOfficeAddress',
          'kemenagOfficeContact'
        ] as const;

        const sharedUpdates: Partial<typeof currentRecord.teacher> = {};
        let hasShared = false;
        schoolAttributes.forEach((attr) => {
          if (updatedTeacher[attr] !== undefined) {
            (sharedUpdates as any)[attr] = updatedTeacher[attr];
            hasShared = true;
          }
        });

        if (hasShared) {
          return {
            ...r,
            teacher: { ...r.teacher, ...sharedUpdates }
          };
        }
        return r;
      })
    );
  };

  const handleUpdateMetadata = (updatedMetadata: Partial<typeof currentRecord.metadata>) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === currentRecord.id) {
          return {
            ...r,
            updatedAt: new Date().toISOString(),
            metadata: { ...r.metadata, ...updatedMetadata }
          };
        }
        // Sync shared assessment metadata (period, year, headmaster, supervisor)
        return {
          ...r,
          metadata: {
            ...r.metadata,
            period: updatedMetadata.period ?? r.metadata.period,
            year: updatedMetadata.year ?? r.metadata.year,
            cityDate: updatedMetadata.cityDate ?? r.metadata.cityDate,
            headmasterName: updatedMetadata.headmasterName ?? r.metadata.headmasterName,
            headmasterNip: updatedMetadata.headmasterNip ?? r.metadata.headmasterNip,
            supervisorName: updatedMetadata.supervisorName ?? r.metadata.supervisorName,
            supervisorNip: updatedMetadata.supervisorNip ?? r.metadata.supervisorNip
          }
        };
      })
    );
  };

  const handleUpdateCreditParams = (updatedParams: Partial<typeof currentRecord.creditParams>) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === currentRecord.id
          ? {
              ...r,
              updatedAt: new Date().toISOString(),
              creditParams: { ...r.creditParams, ...updatedParams }
            }
          : r
      )
    );
  };

  const handleUpdateScore = (code: string, value: number) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === currentRecord.id
          ? {
              ...r,
              updatedAt: new Date().toISOString(),
              scores: { ...r.scores, [code]: value }
            }
          : r
      )
    );
  };

  const handleBatchSetScores = (newScores: Record<string, number>) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === currentRecord.id
          ? {
              ...r,
              updatedAt: new Date().toISOString(),
              scores: newScores
            }
          : r
      )
    );
  };

  const handleAddTeacher = (newRecord: TeacherRecord) => {
    setRecords((prev) => [...prev, newRecord]);
    setActiveId(newRecord.id);
  };

  const handleDeleteTeacher = (id: string) => {
    if (records.length <= 1) return;
    const nextList = records.filter((r) => r.id !== id);
    setRecords(nextList);
    if (activeId === id) {
      setActiveId(nextList[0].id);
    }
  };

  const handleImportRecords = (newRecords: TeacherRecord[]) => {
    setRecords(newRecords);
    if (newRecords.length > 0) {
      setActiveId(newRecords[0].id);
    }
  };

  // Evaluation calculation for current active teacher
  const evaluation = evaluatePKG(currentRecord.scores, currentRecord.creditParams);

  // If not logged in, show Login Page
  if (!currentUser) {
    return (
      <LoginPage
        onLogin={handleLogin}
        defaultSchoolName={currentRecord.teacher.schoolName}
        schoolLogoUrl={currentRecord.teacher.schoolLogoUrl}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Bar Header (Hidden in Print) */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-8">
            {/* Zone 1: Brand with Dynamic School Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 overflow-hidden shadow-2xs">
                {currentRecord.teacher.schoolLogoUrl && currentRecord.teacher.schoolLogoUrl.startsWith('data:image') ? (
                  <img
                    src={currentRecord.teacher.schoolLogoUrl}
                    alt="Logo Sekolah"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <KemenagLogo size={36} />
                )}
              </div>
              <div>
                <a href="/" className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap block leading-tight">
                  {currentRecord.teacher.schoolName || 'PKG Guru RA'}
                </a>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  {currentRecord.teacher.foundationName || 'Kepdirjen Pendis 1843/2021'}
                </span>
              </div>
            </div>

            {/* Zone 2: Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('identity')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'identity'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>1. Identitas & Kop Surat</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('scoring')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'scoring'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. Nilai Otomatis</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('recap')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'recap'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>3. Rekap & AK Guru</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('collective')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'collective'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100 font-semibold'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>4. Laporan Hasil Kolektif</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('print')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'print'
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-medium'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>5. Berkas Lengkap (16 Hal)</span>
              </button>
            </nav>

            {/* Zone 3: Actions, Multi-School & Logout */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleClearAllData}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Kosongkan semua data menjadi template bersih agar siap dibagikan ke sekolah lain"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kosongkan Data</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMultiSchoolModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                title="Panduan agar data antar sekolah tidak tercampur"
              >
                <School className="w-3.5 h-3.5 text-emerald-700" />
                <span>Multi-Sekolah</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTeacherModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Kelola & ganti data guru"
              >
                <Users className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Daftar Guru</span> ({records.length})
              </button>

              {/* Logout button */}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Keluar dari akun"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Keluar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="lg:hidden flex items-center justify-between border-t border-slate-200 px-3 py-2 bg-slate-50 text-xs overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('identity')}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
              activeTab === 'identity' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            1. Identitas
          </button>
          <button
            onClick={() => setActiveTab('scoring')}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
              activeTab === 'scoring' ? 'bg-white font-bold text-emerald-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            2. Nilai
          </button>
          <button
            onClick={() => setActiveTab('recap')}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
              activeTab === 'recap' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            3. Rekap
          </button>
          <button
            onClick={() => setActiveTab('collective')}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap font-bold ${
              activeTab === 'collective' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 bg-emerald-100/50'
            }`}
          >
            4. Laporan Hasil Kolektif
          </button>
          <button
            onClick={() => setActiveTab('print')}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
              activeTab === 'print' ? 'bg-slate-900 text-white font-bold shadow-xs' : 'text-slate-600'
            }`}
          >
            5. Cetak (16 Hal)
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Active Teacher Banner Summary (Hidden on Print) */}
        <div className="no-print bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
              {currentRecord.teacher.name.charAt(0) || 'G'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900">
                  {currentRecord.teacher.name || 'Nama Guru Belum Diisi'}
                </h1>
                <span className="text-[11px] text-slate-500 font-medium">
                  {currentRecord.teacher.rankGrade}
                </span>
              </div>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 mt-0.5">
                <span>Tempat Tugas: <strong className="text-slate-700">{currentRecord.teacher.schoolName || '-'}</strong></span>
                <span>·</span>
                <span>NSM: <strong className="text-slate-700">{currentRecord.teacher.nsm || '-'}</strong></span>
                <span>·</span>
                <span>NPSN: <strong className="text-slate-700">{currentRecord.teacher.npsn || '-'}</strong></span>
                <span>·</span>
                <span>NIP: <strong className="text-slate-700">{currentRecord.teacher.nip || '-'}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 self-end md:self-auto shrink-0 text-xs">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Nilai PKG</span>
              <span className="font-extrabold text-sm text-slate-900 tabular-nums">
                {evaluation.totalComponentScore} / 60 ({evaluation.scale100Score}%)
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Sebutan</span>
              <span className="font-extrabold text-sm text-emerald-700">
                {evaluation.predicate} ({evaluation.npkPercent}%)
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Angka Kredit</span>
              <span className="font-extrabold text-sm text-blue-700 tabular-nums">
                {evaluation.annualCreditScore}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'identity' && (
          <div className="space-y-6">
            <IdentityForm
              teacher={currentRecord.teacher}
              metadata={currentRecord.metadata}
              creditParams={currentRecord.creditParams}
              onUpdateTeacher={handleUpdateTeacher}
              onUpdateMetadata={handleUpdateMetadata}
              onUpdateCreditParams={handleUpdateCreditParams}
            />
            <div className="no-print flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('scoring')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Lanjut ke Penilaian Nilai Otomatis</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'scoring' && (
          <div className="space-y-6">
            <ScoringView
              scores={currentRecord.scores}
              evaluation={evaluation}
              onUpdateScore={handleUpdateScore}
              onBatchSetScores={handleBatchSetScores}
            />
            <div className="no-print flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('identity')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
              >
                Kembali ke Identitas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('recap')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Lihat Rekapitulasi & Angka Kredit</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'recap' && (
          <div className="space-y-6">
            <RecapView
              record={currentRecord}
              evaluation={evaluation}
              onGoToPrint={() => setActiveTab('print')}
            />
          </div>
        )}

        {activeTab === 'collective' && (
          <div className="space-y-6">
            <CollectiveReportView
              records={records}
              activeRecord={currentRecord}
              onSelectTeacher={setActiveId}
              onOpenTeacherModal={() => setIsTeacherModalOpen(true)}
            />
          </div>
        )}

        {activeTab === 'print' && (
          <PrintDocument
            record={currentRecord}
            evaluation={evaluation}
          />
        )}
      </main>

      {/* Footer (Hidden in Print) */}
      <footer className="no-print mt-12 border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Aplikasi PKG RA Standar Kepdirjen Pendis Nomor 1843 Tahun 2021 & Permen PAN-RB No 16/2009.</span>
          </div>
          <div>
            Dilengkapi Kop Surat Resmi Madrasah/RA & Laporan Hasil Nilai PKG Kolektif
          </div>
        </div>
      </footer>

      {/* Teacher Manager Modal */}
      <TeacherManagerModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        records={records}
        activeId={activeId}
        onSelectTeacher={setActiveId}
        onAddTeacher={handleAddTeacher}
        onDeleteTeacher={handleDeleteTeacher}
        onImportRecords={handleImportRecords}
      />

      {/* Multi-School Architecture & Data Isolation Modal */}
      <MultiSchoolModal
        isOpen={isMultiSchoolModalOpen}
        onClose={() => setIsMultiSchoolModalOpen(false)}
        currentSchoolName={currentRecord.teacher.schoolName}
      />
    </div>
  );
}
