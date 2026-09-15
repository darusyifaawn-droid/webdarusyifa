import React, { useState } from 'react';
import { 
  Star, Plus, Save, Trash2, Edit2, BookOpen, 
  Calendar, CheckCircle2, Sparkles, Layers, AlertCircle
} from 'lucide-react';

export interface ClassAspectsContentProps {
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

export default function ClassAspectsContent({
  classAspects,
  schoolClasses,
  userData,
  user,
  exams,
  onSaveAspect,
  onDeleteAspect,
  initialClass
}: ClassAspectsContentProps) {
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
    <div className="space-y-4">
      {/* Intro info banner */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
        <Sparkles size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>Rincian Aspek Perkembangan Siswa per Kelas:</strong> Aspek yang dibuat di sini akan otomatis muncul di pilihan penilaian rapot semua guru untuk kelas bersangkutan dan dicetak ke dalam buku rapot siswa.
        </div>
      </div>

      {/* Class and View Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
        <div>
          <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
            Pilih Kelas Sasaran
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
          <span>Daftar Aspek Kelas ({filteredAspects.length})</span>
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
      <div className="space-y-4">
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
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 underline cursor-pointer"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Nama Aspek / Perkembangan Santri
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
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <Star size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Belum ada aspek perkembangan khusus kelas {selectedClass}</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Gunakan form di atas untuk menambahkan indikator perkembangan santri kelas ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {filteredAspects.map(asp => (
                    <div
                      key={asp.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between gap-3 hover:border-emerald-300 transition-all"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            {asp.category || 'Umum'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
                            {asp.period || 'Semua Periode'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                            Kelas {asp.className}
                          </span>
                        </div>
                        <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {asp.name}
                        </h5>
                        <p className="text-[10px] text-slate-400">
                          Ditambahkan oleh: {asp.teacherName || 'Wali Kelas'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(asp)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Aspek"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(asp.id, asp.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-blue-600" />
                <span>Mata Pelajaran Ujian Otomatis</span>
              </p>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Mata pelajaran berikut diambil langsung dari menu <strong>Jadwal Ujian</strong> untuk kelas <strong>{selectedClass}</strong> dan otomatis tersedia saat guru melakukan penilaian rapot periode terkait.
              </p>
            </div>

            {Object.keys(examSubjectsByPeriod).length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-medium">
                Belum ada jadwal ujian yang terdaftar untuk kelas {selectedClass}.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(examSubjectsByPeriod).map(([period, subs]) => (
                  <div key={period} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <Calendar size={13} className="text-indigo-600" />
                        <span>Periode: {period}</span>
                      </span>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {subs.length} Mapel
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {subs.map((sub, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1">
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
    </div>
  );
}
