import React, { useRef } from 'react';
import { TeacherRecord } from '../types/pkg';
import { createDefaultScores } from '../data/initialData';
import { Users, Plus, Copy, Trash2, Download, Upload, X, Check } from 'lucide-react';

interface TeacherManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: TeacherRecord[];
  activeId: string;
  onSelectTeacher: (id: string) => void;
  onAddTeacher: (record: TeacherRecord) => void;
  onDeleteTeacher: (id: string) => void;
  onImportRecords: (records: TeacherRecord[]) => void;
}

export const TeacherManagerModal: React.FC<TeacherManagerModalProps> = ({
  isOpen,
  onClose,
  records,
  activeId,
  onSelectTeacher,
  onAddTeacher,
  onDeleteTeacher,
  onImportRecords
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddNew = () => {
    const current = records.find((r) => r.id === activeId) || records[0];
    const newId = `guru-${Date.now()}`;
    const newRecord: TeacherRecord = {
      id: newId,
      updatedAt: new Date().toISOString(),
      teacher: {
        ...current.teacher,
        id: newId,
        name: '',
        nip: '',
        nuptk: '',
        additionalDuty: ''
      },
      metadata: { ...current.metadata },
      creditParams: { ...current.creditParams },
      scores: createDefaultScores(0)
    };
    onAddTeacher(newRecord);
  };

  const handleDuplicate = (rec: TeacherRecord) => {
    const newId = `guru-${Date.now()}`;
    const newRecord: TeacherRecord = {
      ...rec,
      id: newId,
      updatedAt: new Date().toISOString(),
      teacher: {
        ...rec.teacher,
        id: newId,
        name: `${rec.teacher.name} (Salinan)`
      }
    };
    onAddTeacher(newRecord);
  };

  const handleExport = () => {
    const jsonStr = JSON.stringify(records, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Data_PKG_RA_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].teacher) {
          onImportRecords(parsed);
          alert(`Berhasil mengimpor ${parsed.length} data guru!`);
        } else {
          alert('Format file JSON tidak sesuai.');
        }
      } catch (err) {
        alert('Gagal membaca file JSON: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              Kelola Daftar Guru Raudhatul Athfal
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Tambah Guru Baru
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg"
              title="Unduh backup semua data guru"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor JSON
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg"
              title="Unggah backup data guru"
            >
              <Upload className="w-3.5 h-3.5" />
              Impor JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
        </div>

        {/* List of Teachers */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {records.map((rec) => {
            const isSelected = rec.id === activeId;
            return (
              <div
                key={rec.id}
                className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    onSelectTeacher(rec.id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {rec.teacher.name || 'Guru Belum Diberi Nama'}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> Aktif
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4">
                    <span>NIP: {rec.teacher.nip || '-'}</span>
                    <span>Gol: {rec.teacher.rankGrade || '-'}</span>
                    <span>RA: {rec.teacher.schoolName || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleDuplicate(rec)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                    title="Duplikat profil guru ini"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {records.length > 1 && (
                    <button
                      onClick={() => onDeleteTeacher(rec.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                      title="Hapus guru ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
