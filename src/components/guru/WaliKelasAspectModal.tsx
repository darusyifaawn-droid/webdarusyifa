import React, { useState } from 'react';
import { 
  X, Star, Plus, Save, Trash2, Edit2, BookOpen, 
  Calendar, CheckCircle2, Sparkles, Layers, AlertCircle
} from 'lucide-react';

interface WaliKelasAspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  classAspects: any[];
  schoolClasses: any[];
  userData: any;
  user: any;
  exams: any[];
  onSaveAspect: (aspectData: { id?: string; name: string; category: string; className: string; period: string }) => Promise<void>;
  onDeleteAspect: (id: string) => Promise<void>;
  initialClass?: string;
}

const CATEGORY_OPTIONS = [
  "Nilai Agama & Moral",
  "Fisik Motorik",
  "Kognitif & Sains",
  "Bahasa & Literasi",
  "Seni & Kreativitas",
  "Sosial Emosional",
  "Al-Qur'an & Hafalan",
  "Muatan Lokal",
  "Umum / Kustom"
];

const PERIOD_OPTIONS = [
  "Semua Periode",
  "PTS Ganjil",
  "PAS Ganjil",
  "PTS Genap",
  "PAS Genap"
];

export default function WaliKelasAspectModal({
  isOpen,
  onClose,
  classAspects,
  schoolClasses,
  userData,
  user,
  exams,
  onSaveAspect,
  onDeleteAspect,
  initialClass
}: WaliKelasAspectModalProps) {
  const teacherClass = (userData?.assignedClass || userData?.kelas || '').trim();
  const defaultClass = initialClass || (teacherClass && teacherClass !== 'Semua' ? teacherClass : (schoolClasses[0]?.name || 'UTSMAN BIN AFFAN'));

  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [filterPeriod, setFilterPeriod] = useState<string>('Semua Periode');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aspectName, setAspectName] = useState('');
  const [aspectCategory, setAspectCategory] = useState('Nilai Agama & Moral');
  const [aspectPeriod, setAspectPeriod] = useState('Semua Periode');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'aspects' | 'exams'>('aspects');

  if (!isOpen) return null;

  // Normalized matching
  const filteredAspects = classAspects.filter(asp => {
    const aspClass = (asp.className || '').toLowerCase().trim();
    const targetClass = selectedClass.toLowerCase().trim();
    const normAsp = aspClass.replace(/[^a-z0-9]/g, '');
    const normTarget = targetClass.replace(/[^a-z0-9]/g, '');
    const classMatches = aspClass === 'semua' || aspClass === targetClass || normAsp === normTarget || targetClass.includes(aspClass) || aspClass.includes(targetClass);

    const periodMatches = filterPeriod === 'Semua Periode' || 
      (asp.period || 'Semua Periode') === 'Semua Periode' || 
      (asp.period || '').toLowerCase() === filterPeriod.toLowerCase();

    return classMatches && periodMatches;
  });

  // Extract exam subjects for selected class
  const examSubjectsByPeriod: Record<string, string[]> = {};
  exams.forEach(ex => {
    const p = ex.type || 'Lainnya';
    if (!examSubjectsByPeriod[p]) examSubjectsByPeriod[p] = [];
    const schedules = Array.isArray(ex.schedules) ? ex.schedules : [];
    schedules.forEach((sch: any) => {
      const schClass = (sch.kelas || '').toLowerCase().trim();
      const targetClass = selectedClass.toLowerCase().trim();
      const normSch = schClass.replace(/[^a-z0-9]/g, '');
      const normTarget = targetClass.replace(/[^a-z0-9]/g, '');
      const isMatch = !schClass || schClass === 'semua kelas' || schClass === 'semua' ||
        schClass === targetClass || normSch === normTarget || targetClass.includes(schClass) || schClass.includes(targetClass);
      
      if (isMatch && sch.subject && !examSubjectsByPeriod[p].includes(sch.subject.trim())) {
        examSubjectsByPeriod[p].push(sch.subject.trim());
      }
    });
  });

  const handleStartEdit = (aspect: any) => {
    setEditingId(aspect.id);
    setAspectName(aspect.name || '');
    setAspectCategory(aspect.category || 'Nilai Agama & Moral');
    setAspectPeriod(aspect.period || 'Semua Periode');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAspectName('');
    setAspectCategory('Nilai Agama & Moral');
    setAspectPeriod('Semua Periode');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aspectName.trim()) {
      alert('Mohon masukkan nama aspek perkembangan / mata pelajaran.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSaveAspect({
        id: editingId || undefined,
        name: aspectName.trim(),
        category: aspectCategory,
        className: selectedClass,
        period: aspectPeriod
      });
      handleCancelEdit();
    } catch (error) {
      console.error('Error saving aspect:', error);
      alert('Gagal menyimpan aspek perkembangan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus aspek "${name}" untuk kelas ${selectedClass}? Aspek ini tidak akan muncul lagi di pilihan penilaian guru.`)) {
      return;
    }
    try {
      await onDeleteAspect(id);
      if (editingId === id) handleCancelEdit();
    } catch (error) {
      console.error('Error deleting aspect:', error);
      alert('Gagal menghapus aspek perkembangan.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[250] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[92vh] flex flex-col space-y-5">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-xs">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg sm:text-xl text-slate-900 leading-tight">
                  Kelola Aspek Perkembangan Siswa
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wide">
                  Wali Kelas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Rincian aspek yang diinput oleh wali kelas akan <strong>otomatis muncul</strong> di form penilaian rapot semua guru untuk kelas ini.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Class and View Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
              Pilih Kelas Binaan / Target
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                handleCancelEdit();
              }}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {schoolClasses.length > 0 ? (
                schoolClasses.map(c => (
                  <option key={c.id || c.name} value={c.name}>{c.name}</option>
                ))
              ) : (
                <>
                  <option value="UTSMAN BIN AFFAN">UTSMAN BIN AFFAN</option>
                  <option value="UMAR BIN KHATTAB">UMAR BIN KHATTAB</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
              Filter Periode Penilaian
            </label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {PERIOD_OPTIONS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('aspects')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'aspects'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Star size={14} />
            <span>Aspek Perkembangan Kelas ({filteredAspects.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exams')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'exams'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen size={14} />
            <span>Mapel Jadwal Ujian Terhubung</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'aspects' ? (
            <>
              {/* Form Input Aspek */}
              <form onSubmit={handleSubmit} className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Plus size={14} className="text-emerald-600" />
                    <span>{editingId ? 'Edit Aspek Perkembangan' : `Tambah Aspek untuk Kelas: ${selectedClass}`}</span>
                  </h4>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-700 underline"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Nama Aspek / Mata Pelajaran Khusus
                    </label>
                    <input
                      type="text"
                      value={aspectName}
                      onChange={(e) => setAspectName(e.target.value)}
                      placeholder="Contoh: Kemandirian & Kedisiplinan, Hafalan Doa Sehari-hari, dll."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Kategori Perkembangan
                      </label>
                      <select
                        value={aspectCategory}
                        onChange={(e) => setAspectCategory(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {CATEGORY_OPTIONS.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Berlaku Pada Periode
                      </label>
                      <select
                        value={aspectPeriod}
                        onChange={(e) => setAspectPeriod(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {PERIOD_OPTIONS.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Save size={15} />
                    <span>{editingId ? 'Simpan Perubahan' : 'Simpan Aspek Kelas'}</span>
                  </button>
                </div>
              </form>

              {/* List Aspek */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Daftar Aspek Kelas {selectedClass}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {filteredAspects.length} aspek terdaftar
                  </span>
                </div>

                {filteredAspects.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-1">
                    <p className="text-xs font-bold text-slate-600">Belum ada rincian aspek manual untuk kelas ini.</p>
                    <p className="text-[11px] text-slate-400">
                      Wali kelas dapat menambahkan aspek di formulir atas agar otomatis muncul pada opsi penilaian guru.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAspects.map(asp => (
                      <div
                        key={asp.id}
                        className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs hover:border-emerald-200 transition-all gap-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-extrabold">
                              {asp.category || 'Umum'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-[10px] font-extrabold">
                              {asp.period || 'Semua Periode'}
                            </span>
                          </div>
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {asp.name}
                          </h5>
                          <p className="text-[10px] text-slate-400">
                            Wali Kelas: {asp.teacherName || 'Guru'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(asp)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                            title="Edit Aspek"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(asp.id, asp.name)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Hapus Aspek"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Jadwal Ujian Terhubung Preview */
            <div className="space-y-3">
              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-800 leading-relaxed flex items-start gap-2.5">
                <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Sinkronisasi Otomatis Jadwal Ujian:</strong> Semua mata pelajaran di bawah ini dibuat dari fitur <em>Jadwal Ujian</em> sekolah. Ketika guru memilih periode terkait (misal PTS Ganjil), mata pelajaran ini otomatis muncul di form input nilai rapot santri tanpa perlu diketik manual.
                </div>
              </div>

              {Object.keys(examSubjectsByPeriod).length === 0 ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-medium">
                  Belum ada jadwal ujian yang terdaftar untuk kelas ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(examSubjectsByPeriod).map(([period, subs]) => (
                    <div key={period} className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                          <Calendar size={14} className="text-emerald-600" />
                          <span>Periode Ujian: {period}</span>
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md">
                          {subs.length} Mapel
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {subs.map((sub, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1"
                          >
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>{sub}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Tersinkronisasi otomatis untuk semua guru</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
